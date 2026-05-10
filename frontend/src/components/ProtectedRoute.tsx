import type React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/enums';

export interface ProtectedRouteProps {
  allowedRoles?: ReadonlyArray<UserRole>;
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (token === null) {
    return <Navigate to="/espace-pro/login" replace state={{ from: location.pathname }} />;
  }
  if (allowedRoles !== undefined && allowedRoles.length > 0) {
    if (user === null || !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }
  return <Outlet />;
}
