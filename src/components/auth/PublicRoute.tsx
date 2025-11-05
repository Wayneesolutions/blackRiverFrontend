import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../redux/store';

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
}

/**
 * PublicRoute - Component for public routes (login, register)
 * Redirects authenticated users away from auth pages
 * 
 * @param children - The component to render if not authenticated
 * @param redirectTo - Custom redirect path for authenticated users
 * @param allowedRoles - Optional roles that can still access this route when authenticated
 */
const PublicRoute = ({ 
  children, 
  redirectTo,
  allowedRoles 
}: PublicRouteProps) => {
  const { userInfo } = useSelector((state: RootState) => state.userAuth);
  const { superAdminInfo } = useSelector((state: RootState) => state.superAdminAuth);
  const token = localStorage.getItem('token');

  // Check if user is authenticated
  // Priority: Admin (Redux userInfo) > SuperAdmin (Redux superAdminInfo)
  const isAdminAuthenticated = !!(token && userInfo);
  const isSuperAdminAuthenticated = !!(token && superAdminInfo && !userInfo); // Only if not an admin
  const isAuthenticated = isAdminAuthenticated || isSuperAdminAuthenticated;

  // If authenticated and route is not allowed for authenticated users
  if (isAuthenticated) {
    // Determine user role for allowedRoles check
    const currentRole = userInfo?.userData?.role || superAdminInfo?.userData?.role;
    
    // If allowedRoles is specified and user's role is in the list, allow access
    if (allowedRoles && currentRole) {
      if (allowedRoles.includes(currentRole)) {
        return <>{children}</>;
      }
    }

    // Determine redirect path based on authentication type
    // Admin users (from Redux) should go to admin dashboard
    // SuperAdmin users (from localStorage only) should go to superadmin dashboard
    let defaultRedirect = '/admin/dashboard';
    if (isSuperAdminAuthenticated && !isAdminAuthenticated) {
      defaultRedirect = '/superadmin/dashboard';
    }

    const redirectPath = redirectTo || defaultRedirect;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;

