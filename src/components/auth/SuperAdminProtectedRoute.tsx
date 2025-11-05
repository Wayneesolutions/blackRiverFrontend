import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../redux/store';
import { isTokenValid } from '../../utils/auth';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * SuperAdminProtectedRoute - Component to protect superadmin routes
 * Checks for superadmin token and role in localStorage
 * 
 * @param children - The component to render if authenticated as superadmin
 * @param redirectTo - Optional custom redirect path (defaults to /superadmin/login)
 */
const SuperAdminProtectedRoute = ({ 
  children, 
  redirectTo 
}: SuperAdminProtectedRouteProps) => {
  const location = useLocation();
  const { superAdminInfo } = useSelector((state: RootState) => state.superAdminAuth);
  const token = localStorage.getItem('token');

  // Check if user is authenticated as superadmin and token is valid
  const isSuperAdmin = !!(token && superAdminInfo && isTokenValid());

  // If not authenticated as superadmin, redirect to login
  if (!isSuperAdmin) {
    const loginPath = redirectTo || '/superadmin/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check if superadmin is active
  const superAdminStatus = superAdminInfo?.userData?.status;
  if (superAdminStatus !== 'active') {
    // Clear auth data and redirect to login if superadmin is inactive
    localStorage.removeItem('token');
    localStorage.removeItem('superAdminInfo');
    const loginPath = redirectTo || '/superadmin/login';
    return <Navigate to={loginPath} state={{ from: location, inactive: true }} replace />;
  }

  return <>{children}</>;
};

export default SuperAdminProtectedRoute;

