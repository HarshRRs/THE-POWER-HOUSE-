import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
    case 'hot':
      return 'bg-success';
    case 'warm':
      return 'bg-warning';
    case 'cold':
      return 'bg-muted';
    default:
      return 'bg-muted';
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
  };
  return labels[procedure] || procedure;
}
