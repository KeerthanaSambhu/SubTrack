import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { SubscriptionsProvider } from '../context/SubscriptionsContext';
import { FullPageSpinner } from '../components/ui/Feedback';

/** Only signed-in users get through; everyone else goes to /login. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return (
    <SubscriptionsProvider>
      <Outlet />
    </SubscriptionsProvider>
  );
}

/**
 * Login / register pages: signed-in users are sent into the app — back to the
 * page they originally asked for, if they were redirected here.
 */
export function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to={location.state?.from || '/'} replace />;
  return <Outlet />;
}
