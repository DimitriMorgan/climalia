export const UserRole = {
  EMPLOYEE: 'EMPLOYEE',
  PARTNER: 'PARTNER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const DocumentCategory = {
  PLANNING: 'PLANNING',
  TECHNICAL_SHEET: 'TECHNICAL_SHEET',
  MAINTENANCE_CONTRACT: 'MAINTENANCE_CONTRACT',
  INTERNAL_DOC: 'INTERNAL_DOC',
  INTERVENTION_REPORT: 'INTERVENTION_REPORT',
  MAINTENANCE_CERTIFICATE: 'MAINTENANCE_CERTIFICATE',
  INVOICE: 'INVOICE',
} as const;
export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory];

export const RealizationType = {
  RESIDENTIAL: 'RESIDENTIAL',
  TERTIARY: 'TERTIARY',
} as const;
export type RealizationType = (typeof RealizationType)[keyof typeof RealizationType];

export const EquipmentType = {
  AC: 'AC',
  HEAT_PUMP: 'HEAT_PUMP',
  VMC: 'VMC',
} as const;
export type EquipmentType = (typeof EquipmentType)[keyof typeof EquipmentType];

export const ProjectType = {
  INSTALLATION_AC: 'INSTALLATION_AC',
  HEAT_PUMP: 'HEAT_PUMP',
  VMC: 'VMC',
  MAINTENANCE: 'MAINTENANCE',
  REPAIR: 'REPAIR',
} as const;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const ContactStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  CLOSED: 'CLOSED',
} as const;
export type ContactStatus = (typeof ContactStatus)[keyof typeof ContactStatus];
