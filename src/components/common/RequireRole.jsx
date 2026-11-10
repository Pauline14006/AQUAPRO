import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser, useStoreVersion } from '../../lib/store';

/** Only lets the listed roles in. Everyone else is sent to /login. */
export default function RequireRole({ roles }) {
  useStoreVersion();
  const user = getCurrentUser();
  if (!user || !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
}
