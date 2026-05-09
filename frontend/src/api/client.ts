import { useAuthStore } from '@/stores/authStore';

export interface ApiViolation {
  propertyPath: string;
  message: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly violations: ReadonlyArray<ApiViolation>;

  public constructor(status: number, message: string, violations: ReadonlyArray<ApiViolation> = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.violations = violations;
  }
}

interface SymfonyValidationViolation {
  propertyPath?: unknown;
  title?: unknown;
  message?: unknown;
}

interface SymfonyErrorBody {
  message?: unknown;
  detail?: unknown;
  violations?: unknown;
}

function parseViolations(raw: unknown): ReadonlyArray<ApiViolation> {
  if (!Array.isArray(raw)) return [];
  const out: ApiViolation[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const v = item as SymfonyValidationViolation;
    const path = typeof v.propertyPath === 'string' ? v.propertyPath : '';
    const msg =
      typeof v.message === 'string' ? v.message :
      typeof v.title === 'string' ? v.title :
      'Invalid value';
    out.push({ propertyPath: path, message: msg });
  }
  return out;
}

async function buildError(response: Response): Promise<ApiError> {
  let body: SymfonyErrorBody = {};
  try {
    body = (await response.json()) as SymfonyErrorBody;
  } catch {
    // ignore — body wasn't JSON
  }
  const message =
    typeof body.message === 'string' ? body.message :
    typeof body.detail === 'string' ? body.detail :
    response.statusText || `HTTP ${String(response.status)}`;
  return new ApiError(response.status, message, parseViolations(body.violations));
}

export async function apiFetch<T>(input: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const { token } = useAuthStore.getState();
  if (token !== null) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  const response = await fetch(input, { ...init, headers });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw await buildError(response);
  }
  if (!response.ok) {
    throw await buildError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
