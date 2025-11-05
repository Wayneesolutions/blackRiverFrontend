import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../redux/store';
import { isTokenValid } from '../../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
}

/**
 * ProtectedRoute - Component to protect routes that require authentication
 * 
 * @param children - The component to render if authenticated
 * @param requiredRole - Optional role(s) required to access the route
 * @param redirectTo - Optional custom redirect path (defaults to /admin/login)
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  redirectTo 
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { userInfo } = useSelector((state: RootState) => state.userAuth);
  const token = localStorage.getItem('token');

  // Check if user is authenticated and token is valid
  const isAuthenticated = !!(token && userInfo && isTokenValid());

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    const loginPath = redirectTo || '/admin/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Check if user is active
  const userStatus = userInfo?.userData?.status;
  if (userStatus !== 'active') {
    // Clear auth data and redirect to login if user is inactive
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    const loginPath = redirectTo || '/admin/login';
    return <Navigate to={loginPath} state={{ from: location, inactive: true }} replace />;
  }

  // Check role if required
  if (requiredRole) {
    const userRole = userInfo?.userData?.role;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!userRole || !roles.includes(userRole)) {
      // Redirect to dashboard if user doesn't have required role
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

