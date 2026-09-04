import type { DocumentCategory } from '@/types/enums';

/** Libellés français des catégories de documents (partagés par tout l'espace pro). */
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  PLANNING: 'Planning',
  TECHNICAL_SHEET: 'Fiche technique',
  MAINTENANCE_CONTRACT: 'Contrat d’entretien',
  INTERNAL_DOC: 'Document interne',
  INTERVENTION_REPORT: 'Compte-rendu d’intervention',
  MAINTENANCE_CERTIFICATE: 'Attestation d’entretien',
  INVOICE: 'Facture',
};
