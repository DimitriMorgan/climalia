import type {
  ContactStatus,
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

export interface ApiDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  mimeType: string;
  sizeBytes: number;
  region: string | null;
  uploadedAt: string;
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
