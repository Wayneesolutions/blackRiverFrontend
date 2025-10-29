import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userLogOut } from '../redux/slices/userSlice';
import { message } from 'antd';

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logout = () => {
    try {
      // Clear user data from Redux store
      dispatch(userLogOut());
      
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // Show success message
      message.success('Logged out successfully');
      
      // Navigate to login page
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Error during logout');
    }
  };

  return { logout };
};
