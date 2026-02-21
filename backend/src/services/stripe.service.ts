import Stripe from 'stripe';
import { prisma } from '../config/database.js';
import { PLAN_LIMITS } from '../config/constants.js';
import { activatePlan, renewSubscription, cancelSubscription } from './plan.service.js';
import { ApiError } from '../utils/responses.util.js';
import logger from '../utils/logger.util.js';
import type { Plan } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function createCheckoutSession(userId: string, email: string, plan: Plan) {
  const planConfig = PLAN_LIMITS[plan];
  
  if (!planConfig || planConfig.price === 0) {
    throw new ApiError('Invalid plan', 400);
  }

  const isSubscription = planConfig.type === 'subscription';
  const planNames: Record<string, string> = {
    URGENCE_24H: 'Urgence 24h',
    URGENCE_7J: 'Urgence 7 jours',
    URGENCE_TOTAL: 'Urgence Total (Mensuel)',
  };

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    payment_method_types: ['card'],
    mode: isSubscription ? 'subscription' : 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: planNames[plan] || plan,
            description: `RDVPriority - ${planNames[plan] || plan}`,
          },
          unit_amount: planConfig.price,
          ...(isSubscription ? { recurring: { interval: 'month' } } : {}),
        },
        quantity: 1,
      },
    ],
    success_url: `${FRONTEND_URL}/dashboard?payment=success&plan=${plan}`,
    cancel_url: `${FRONTEND_URL}/pricing?payment=cancelled`,
    metadata: {
      userId,
      plan,
    },
  });

  return { checkoutUrl: session.url, sessionId: session.id };
}

async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.processedStripeEvent.findUnique({
    where: { eventId },
  });
  return !!existing;
}

export async function handleWebhook(payload: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new ApiError('Webhook secret not configured', 500);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    throw new ApiError('Invalid webhook signature', 400);
  }

  // Idempotency check: skip if already processed
  if (await isEventProcessed(event.id)) {
    logger.info(`Stripe event ${event.id} already processed, skipping`);
    return { received: true, duplicate: true };
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session, event.id);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice, event.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(subscription, event.id);
      break;
    }

    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
      // Record even unhandled events to prevent reprocessing
      await prisma.processedStripeEvent.create({ data: { eventId: event.id } });
  }

  return { received: true };
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session, eventId: string) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as Plan;

  if (!userId || !plan) {
    logger.error('Missing metadata in checkout session', { sessionId: session.id });
    return;
  }

  // Use transaction for atomicity: record event + update user + create payment + activate plan
  await prisma.$transaction(async (tx) => {
    // Mark event as processed within transaction
    await tx.processedStripeEvent.create({ data: { eventId } });

    // Update user with Stripe customer ID
    await tx.user.update({
      where: { id: userId },
      data: {
        stripeCustomerId: session.customer as string,
      },
    });

    // Record payment
    await tx.payment.create({
      data: {
        userId,
        plan,
        amount: session.amount_total || PLAN_LIMITS[plan].price,
        stripePaymentId: (session.payment_intent as string) || session.subscription as string,
        stripeSessionId: session.id,
        status: 'COMPLETED',
        paidAt: new Date(),
      },
    });

    // Activate plan within the same transaction
    await activatePlan(userId, plan, tx);
  });

  logger.info(`Checkout complete: User ${userId} activated plan ${plan}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    logger.warn(`No user found for customer ${customerId}`);
    return;
  }

  // Use transaction for atomicity: record event + renew subscription
  await prisma.$transaction(async (tx) => {
    // Mark event as processed FIRST within transaction
    await tx.processedStripeEvent.create({ data: { eventId } });

    // Renew subscription within the same transaction
    await renewSubscription(user.id, tx);
  });

  logger.info(`Subscription renewed for user ${user.id}`);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription, eventId: string) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    logger.warn(`No user found for customer ${customerId}`);
    return;
  }

  // Use transaction for atomicity: record event + cancel subscription
  await prisma.$transaction(async (tx) => {
    // Mark event as processed FIRST within transaction
    await tx.processedStripeEvent.create({ data: { eventId } });

    // Cancel subscription within the same transaction
    await cancelSubscription(user.id, tx);
  });

  logger.info(`Subscription cancelled for user ${user.id}`);
}

export async function getPaymentHistory(userId: string) {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return payments;
}

export async function cancelUserSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user?.stripeCustomerId) {
    throw new ApiError('No active subscription found', 400);
  }

  // Find active subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: 'active',
  });

  if (subscriptions.data.length === 0) {
    throw new ApiError('No active subscription found', 400);
  }

  // Cancel at period end
  await stripe.subscriptions.update(subscriptions.data[0].id, {
    cancel_at_period_end: true,
  });

  return { message: 'Subscription will be cancelled at the end of the billing period' };
}

export { stripe };
