import { useState, useEffect } from 'react';
import { File, X } from 'lucide-react';
import { FaTruck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface DocumentUploadNotificationProps {
  notification: {
    type: string;
    title: string;
    message: string;
    orderId: string;
    orderNumber: string;
    driverName: string;
    timestamp: string;
    link: string;
  };
  onClose: () => void;
  userRole?: 'admin' | 'dispatcher';
}

const DocumentUploadNotification = ({ notification, onClose, userRole = 'admin' }: DocumentUploadNotificationProps) => {
  const [progress, setProgress] = useState(100);
  const navigate = useNavigate();
  const duration = 8000; // 8 seconds

  // Log when component mounts
  useEffect(() => {
    console.log('🎨 DocumentUploadNotification COMPONENT MOUNTED!');
    console.log('🎨 Notification props:', notification);
    console.log('🎨 User role:', userRole);
    console.log('🎨 Component is now visible in the DOM');
  }, []);

  useEffect(() => {
    console.log('⏰ Starting auto-dismiss timer (8 seconds)...');
    const timer = setTimeout(() => {
      console.log('⏰ Timer expired, calling onClose()');
      onClose();
    }, duration);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const decrement = (100 / duration) * 50;
        return Math.max(0, prev - decrement);
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  const handleClick = () => {
    // Navigate to the order page based on user role
    const basePath = userRole === 'dispatcher' ? '/dispatch/trips' : '/admin/dispatch/trips';
    const targetUrl = `${basePath}?orderId=${notification.orderId}`;
    
    console.log(`📍 Navigating to: ${targetUrl} (role: ${userRole})`);
    navigate(targetUrl);
    onClose();
  };

  return (
    <div
      onClick={handleClick}
      className="fixed top-4 right-4 w-[400px] bg-white rounded-2xl shadow-2xl z-[99999] animate-slide-in cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] border border-gray-100 overflow-hidden"
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      {/* Progress bar */}
      <div 
        className="h-1 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-100" 
        style={{ width: `${progress}%` }}
      ></div>
      
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg">
              <File className="w-6 h-6" />
            </div>
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white absolute ml-8 -mt-3 animate-pulse"></div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 text-base">
                📄 Documents Uploaded
              </h4>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-2">
              <strong>{notification.driverName || 'Driver'}</strong> has uploaded POD and Manifest documents
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                <FaTruck className="w-3 h-3" />
                Order #{notification.orderNumber}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                <File className="w-4 h-4" />
                <span>Click to view documents</span>
              </div>
              <div className="flex-1"></div>
              <span className="text-gray-400 text-xs">Just now</span>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadNotification;

