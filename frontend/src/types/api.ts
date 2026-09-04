import type {
  ClientSegment,
  ContactStatus,
  DocumentAudience,
  DocumentCategory,
  EquipmentType,
  ProjectType,
  RealizationType,
  UserRole,
} from '@/types/enums';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  region: string | null;
}

export interface ApiClientOption {
  id: string;
  label: string;
}

export interface ApiDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  audience: DocumentAudience;
  mimeType: string;
  sizeBytes: number;
  region: string | null;
  uploadedAt: string;
  /** Date « métier » (échéance, intervention…) — alimente le calendrier admin. */
  documentDate: string | null;
  hasFile: boolean;
  /** Vue admin uniquement. */
  uploadedBy?: string | null;
  /** Vue admin uniquement. */
  assignedClients?: ReadonlyArray<ApiClientOption>;
}

export interface ApiDocumentDownload {
  id: string;
  title: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ApiRealization {
  id: string;
  title: string;
  description: string;
  type: RealizationType;
  equipmentType: EquipmentType;
  region: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  publishedAt: string;
}

export interface RealizationInput {
  title: string;
  description: string;
  type: RealizationType;
  equipmentType: EquipmentType;
  region: string;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
  publishedAt?: string | null;
}

export interface ContactRequestInput {
  fullName: string;
  email: string;
  phone: string;
  postalCode: string;
  projectType: ProjectType;
  message: string;
  surface?: number | null;
  deadline?: string | null;
}

export interface ContactRequestResponse {
  id: string;
  status: ContactStatus;
}

export interface ApiErrorPayload {
  status: number;
  message: string;
  violations: ReadonlyArray<{ propertyPath: string; message: string }>;
}

/** Demande de devis (vue admin). */
export interface ApiContactRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  postalCode: string;
  projectType: ProjectType;
  surface: number | null;
  deadline: string | null;
  message: string;
  createdAt: string;
  status: ContactStatus;
  /** Date de la dernière réponse envoyée depuis l'admin (null = jamais répondu). */
  repliedAt: string | null;
}

/** Compte utilisateur (vue admin /api/users). */
export interface ApiManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  region: string | null;
  company: ApiClientOption | null;
  /** Peut se connecter (compte non désactivé). */
  active: boolean;
  /** Reçoit les e-mails de notification de nouveaux documents. */
  notifyOnNewDocument: boolean;
  createdAt: string;
}

export interface UserFlagsInput {
  active?: boolean;
  notifyOnNewDocument?: boolean;
}

export interface ManagedUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  region?: string | null;
  password?: string | null;
}

export interface ApiClientContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Peut se connecter (compte non désactivé). */
  active: boolean;
  /** Reçoit les e-mails de notification de nouveaux documents. */
  notifyOnNewDocument: boolean;
}

/** Entreprise cliente (vue admin /api/clients). */
export interface ApiClientCompany {
  id: string;
  name: string;
  segment: ClientSegment;
  region: string | null;
  contacts: ReadonlyArray<ApiClientContact>;
}

export interface ClientCompanyInput {
  name: string;
  segment: ClientSegment;
  region?: string | null;
  contactEmail?: string;
  contactFirstName?: string;
  contactLastName?: string;
  password?: string;
}

export interface ClientContactInput {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

/** Overrides de contenu du site : clé → texte. */
export type ContentOverrides = Readonly<Record<string, string>>;
