import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { userLogOut } from '../redux/slices/userSlice';
import { superAdminLogOut } from '../redux/slices/superAdminSlice';
import { message } from 'antd';
import { clearAuth } from '../utils/auth';

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    try {
      // Determine redirect path based on current route
      const isSuperAdmin = location.pathname.startsWith('/superadmin');
      const redirectPath = isSuperAdmin ? '/superadmin/login' : '/';
      
      // Clear user data from Redux store (admin and superadmin)
      dispatch(userLogOut());
      dispatch(superAdminLogOut());
      
      // Clear all authentication data using utility
      clearAuth();
      
      // Show success message
      message.success('Logged out successfully');
      
      // Navigate to appropriate login page
      navigate(redirectPath);
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Error during logout');
      // Ensure auth is cleared even on error
      clearAuth();
      navigate('/');
    }
  };

  return { logout };
};
