import { prisma } from '../config/database.js';
import { stripe } from './stripe.service.js';
import { notificationQueue } from '../config/bullmq.js';
import logger from '../utils/logger.util.js';
import type { Plan } from '@prisma/client';

/**
 * Refund Guarantee Service
 * Handles automatic refunds for Urgence Totale plan when no appointments are found
 */

interface RefundEligibilityCheck {
  userId: string;
  userEmail: string;
  plan: Plan;
  planExpiresAt: Date;
  totalDetections: number;
  eligibleForRefund: boolean;
  reason?: string;
}

/**
 * Check if a user is eligible for automatic refund
 * @param userId - User ID to check
 * @returns Refund eligibility information
 */
export async function checkRefundEligibility(userId: string): Promise<RefundEligibilityCheck> {
  // Get user with their plan information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      plan: true,
      planExpiresAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Only Urgence Totale plan is eligible for automatic refund
  if (user.plan !== 'URGENCE_TOTAL') {
    return {
      userId: user.id,
      userEmail: user.email,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt!,
      totalDetections: 0,
      eligibleForRefund: false,
      reason: 'Only Urgence Totale plan eligible for automatic refund',
    };
  }

  // Check if plan is still active
  if (!user.planExpiresAt || user.planExpiresAt <= new Date()) {
    return {
      userId: user.id,
      userEmail: user.email,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt!,
      totalDetections: 0,
      eligibleForRefund: false,
      reason: 'Plan has expired',
    };
  }

  // Count total detections for this user during their plan period
  const totalDetections = await prisma.detection.count({
    where: {
      alert: {
        userId: user.id,
        createdAt: {
          gte: user.planExpiresAt!, // Actually should be plan start date, but we'll use this for now
        },
      },
    },
  });

  // Eligible if no detections found
  const eligible = totalDetections === 0;

  return {
    userId: user.id,
    userEmail: user.email,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt!,
    totalDetections,
    eligibleForRefund: eligible,
    ...(eligible ? {} : { reason: `User received ${totalDetections} detections during plan period` }),
  };
}

/**
 * Process automatic refund for eligible users
 * @param userId - User ID to process refund for
 * @returns Refund result
 */
export async function processAutomaticRefund(userId: string): Promise<{
  success: boolean;
  amountRefunded?: number;
  reason?: string;
}> {
  try {
    const eligibility = await checkRefundEligibility(userId);
    
    if (!eligibility.eligibleForRefund) {
      return {
        success: false,
        reason: eligibility.reason || 'Not eligible for refund',
      };
    }

    // Find the most recent payment for this user
    const recentPayment = await prisma.payment.findFirst({
      where: {
        userId: userId,
        status: 'COMPLETED',
        plan: 'URGENCE_TOTAL',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!recentPayment) {
      return {
        success: false,
        reason: 'No completed payment found for Urgence Totale plan',
      };
    }

    // Check if refund already processed (using refundedAt field)
    if (recentPayment.refundedAt) {
      return {
        success: false,
        reason: 'Payment already refunded',
      };
    }

    // Process refund through Stripe
    await stripe.refunds.create({
      payment_intent: recentPayment.stripePaymentId,
      reason: 'requested_by_customer',
    });

    // Update payment with refund information
    await prisma.payment.update({
      where: { id: recentPayment.id },
      data: { 
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: recentPayment.id },
      data: { status: 'REFUNDED' },
    });

    // Send notification to user
    await sendRefundNotification(userId, recentPayment.amount);

    logger.info(`Automatic refund processed for user ${userId}: €${(recentPayment.amount / 100).toFixed(2)}`);

    return {
      success: true,
      amountRefunded: recentPayment.amount,
    };

  } catch (error) {
    logger.error(`Failed to process automatic refund for user ${userId}:`, error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Batch process refunds for all eligible users
 * This should be called periodically (e.g., daily)
 */
export async function processBatchRefunds(): Promise<{
  totalProcessed: number;
  successfulRefunds: number;
  failedRefunds: number;
}> {
  logger.info('Starting batch refund processing...');
  
  // Find all users with expired Urgence Totale plans who haven't been refunded
  const eligibleUsers = await prisma.user.findMany({
    where: {
      plan: 'URGENCE_TOTAL',
      planExpiresAt: {
        lt: new Date(), // Expired plans
      },
      payments: {
        some: {
          status: 'COMPLETED',
          plan: 'URGENCE_TOTAL',
          refundedAt: null,
        },
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  let successful = 0;
  let failed = 0;

  for (const user of eligibleUsers) {
    try {
      const result = await processAutomaticRefund(user.id);
      if (result.success) {
        successful++;
      } else {
        failed++;
        logger.warn(`Failed to process refund for user ${user.id}: ${result.reason}`);
      }
    } catch (error) {
      failed++;
      logger.error(`Error processing refund for user ${user.id}:`, error);
    }
  }

  logger.info(`Batch refund processing complete. Total: ${eligibleUsers.length}, Successful: ${successful}, Failed: ${failed}`);

  return {
    totalProcessed: eligibleUsers.length,
    successfulRefunds: successful,
    failedRefunds: failed,
  };
}

/**
 * Send refund notification to user
 */
async function sendRefundNotification(userId: string, amount: number): Promise<void> {
  const amountEur = (amount / 100).toFixed(2);

  try {
    await notificationQueue.add(
      `refund-notification:${userId}`,
      {
        userId,
        channel: 'EMAIL',
        type: 'refund_processed',
        title: 'Votre remboursement RDVPriority',
        body: `Votre remboursement de ${amountEur} EUR a ete traite avec succes. Le montant sera credite sur votre compte sous 5 a 10 jours ouvrables.`,
        metadata: { amount, amountEur },
      },
      { priority: 2 }
    );
    logger.info(`Refund notification queued for user ${userId} (${amountEur} EUR)`);
  } catch (error) {
    logger.error(`Failed to queue refund notification for user ${userId}:`, error);
  }
}

/**
 * Manual refund trigger (for admin use)
 */
export async function triggerManualRefund(
  userId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await processAutomaticRefund(userId);
    
    if (result.success) {
      // Log admin action in audit log
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'MANUAL_REFUND',
          resourceType: 'USER',
          resourceId: userId,
          metadata: {
            amount: result.amountRefunded,
            reason: reason,
          },
        },
      });
      
      return {
        success: true,
        message: `Refund of €${(result.amountRefunded! / 100).toFixed(2)} processed successfully`,
      };
    } else {
      return {
        success: false,
        message: result.reason || 'Refund processing failed',
      };
    }
  } catch (error) {
    logger.error(`Manual refund failed for user ${userId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}