import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export function getToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('boss_token') || '';
  }
  return '';
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${getToken()}`,
    ...extra,
  };
  const csrf = getCsrfToken();
  if (csrf) {
    headers['x-csrf-token'] = csrf;
  }
  return headers;
}

export function authJsonHeaders(): Record<string, string> {
  return authHeaders({ 'Content-Type': 'application/json' });
}

/** Wrapper around fetch that includes credentials (for CSRF cookie) */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getStatusColor(status: 'hot' | 'warm' | 'cold'): string {
  switch (status) {
    case 'hot': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'warm': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'cold': return 'text-slate-600 bg-slate-50 border-slate-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getProcedureLabel(procedure: string): string {
  const labels: Record<string, string> = {
    'SALARIE_PAYSIPS': 'Salarié',
    'ETUDIANT_RENEWAL': 'Étudiant',
    'CHANGEMENT_STATUT_ETUDIANT_SALARIE': 'Changement Statut',
    'VIE_FAMILIALE_MARIAGE': 'Vie Familiale',
    'ENTREPRENEUR': 'Entrepreneur',
    'DUPLICATA_PERDU': 'Duplicata',
    'RENEWAL_ANY': 'Renouvellement',
    'TITRE_SEJOUR': 'Titre de Séjour',
    'NATURALISATION': 'Naturalisation',
    // Indian Embassy procedures
    'PASSPORT_RENEWAL': 'Passport Renewal',
    'PASSPORT_REISSUE': 'Passport Reissue',
    'PASSPORT_NEW': 'New Passport',
    'PASSPORT_TATKAL': 'Passport Tatkal',
    'OCI_REGISTRATION': 'OCI Registration',
    'OCI_RENEWAL': 'OCI Renewal',
    'OCI_MISC': 'OCI Misc',
    'VISA_CONSULAR': 'Visa Consular',
    'BIRTH_REGISTRATION': 'Birth Registration',
    'CONSULAR_OTHER': 'Consular Other',
    // VFS Italy procedures
    'SCHENGEN_TOURIST_ITALY': 'Italy Tourist Visa',
    'SCHENGEN_BUSINESS_ITALY': 'Italy Business Visa',
    'STUDENT_VISA_ITALY': 'Italy Student Visa',
    'WORK_VISA_ITALY': 'Italy Work Visa',
    'SEASONAL_WORK_VISA_ITALY': 'Italy Seasonal Work Visa',
    // VFS Germany procedures
    'SCHENGEN_TOURIST_GERMANY': 'Germany Tourist Visa',
    'SCHENGEN_BUSINESS_GERMANY': 'Germany Business Visa',
    'STUDENT_VISA_GERMANY': 'Germany Student Visa',
    'WORK_VISA_GERMANY': 'Germany Work Visa',
    'OPPORTUNITY_CARD_GERMANY': 'Germany Opportunity Card (Chancenkarte)',
    // VFS France procedures
    'SCHENGEN_TOURIST_FRANCE': 'France Tourist Visa',
    'SCHENGEN_BUSINESS_FRANCE': 'France Business Visa',
    'STUDENT_VISA_FRANCE': 'France Student Visa',
    'WORK_VISA_FRANCE': 'France Work Visa',
    // VFS Switzerland procedures
    'SCHENGEN_TOURIST_SWITZERLAND': 'Switzerland Tourist Visa',
    'SCHENGEN_BUSINESS_SWITZERLAND': 'Switzerland Business Visa',
    'STUDENT_VISA_SWITZERLAND': 'Switzerland Student Visa',
    'WORK_VISA_SWITZERLAND': 'Switzerland Work Visa',
    // VFS Austria procedures
    'SCHENGEN_TOURIST_AUSTRIA': 'Austria Tourist Visa',
    'SCHENGEN_BUSINESS_AUSTRIA': 'Austria Business Visa',
    'STUDENT_VISA_AUSTRIA': 'Austria Student Visa',
    'WORK_VISA_AUSTRIA': 'Austria Work Visa',
    // VFS Belgium procedures
    'SCHENGEN_TOURIST_BELGIUM': 'Belgium Tourist Visa',
    'SCHENGEN_BUSINESS_BELGIUM': 'Belgium Business Visa',
    'STUDENT_VISA_BELGIUM': 'Belgium Student Visa',
    'WORK_VISA_BELGIUM': 'Belgium Work Visa',
    // VFS Netherlands procedures
    'SCHENGEN_TOURIST_NETHERLANDS': 'Netherlands Tourist Visa',
    'SCHENGEN_BUSINESS_NETHERLANDS': 'Netherlands Business Visa',
    'STUDENT_VISA_NETHERLANDS': 'Netherlands Student Visa',
    'WORK_VISA_NETHERLANDS': 'Netherlands Work Visa',
    // VFS Portugal procedures
    'SCHENGEN_TOURIST_PORTUGAL': 'Portugal Tourist Visa',
    'SCHENGEN_BUSINESS_PORTUGAL': 'Portugal Business Visa',
    'STUDENT_VISA_PORTUGAL': 'Portugal Student Visa',
    'WORK_VISA_PORTUGAL': 'Portugal Work/Golden Visa',
    'JOB_SEEKER_VISA_PORTUGAL': 'Portugal Job Seeker Visa',
  };
  return labels[procedure] || procedure;
}

export function getDetectionLocationName(detection: any): string {
  // VFS Center detection
  if (detection.vfsCenterName) {
    return detection.categoryName
      ? `${detection.vfsCenterName} (${detection.categoryName})`
      : detection.vfsCenterName;
  }
  // Consulate detection
  if (detection.consulateName) {
    return detection.categoryName
      ? `${detection.consulateName} (${detection.categoryName})`
      : detection.consulateName;
  }
  // Prefecture detection
  return detection.prefectureName || 'Unknown';
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

export function getWhatsAppStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return 'text-emerald-600 bg-emerald-50';
    case 'sent': return 'text-sky-600 bg-sky-50';
    case 'failed': return 'text-red-600 bg-red-50';
    default: return 'text-slate-500 bg-slate-50';
  }
}

export function getPrefectureSystemType(prefectureId: string): string {
  if (prefectureId === 'paris_75') return 'ANTS';
  if (prefectureId === 'bobigny_93') return 'ezbooking';
  if (['melun_77', 'lyon_69'].includes(prefectureId)) return 'ANEF';
  return 'RDV-Prefecture';
}
