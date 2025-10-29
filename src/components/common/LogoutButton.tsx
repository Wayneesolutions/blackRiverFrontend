import { FaSignOutAlt } from "react-icons/fa";
import { useLogout } from "../../hooks/useLogout";

interface LogoutButtonProps {
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  className = "", 
  showIcon = true, 
  children = "Logout" 
}) => {
  const { logout } = useLogout();

  return (
    <button
      onClick={logout}
      className={`flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-md ${className}`}
    >
      {showIcon && <FaSignOutAlt className="text-red-500" />}
      {children}
    </button>
  );
};

export default LogoutButton;
