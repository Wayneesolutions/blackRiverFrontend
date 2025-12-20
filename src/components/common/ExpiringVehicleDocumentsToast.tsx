import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Truck } from 'lucide-react';

interface ExpiringVehicleDocumentsToastProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDocuments?: () => void;
  count: number;
}

const ONE_HOUR = 60 * 60 * 1000; // 3600000 ms
const AUTO_CLOSE_TIME = 5000;   // 5 seconds

const ExpiringVehicleDocumentsToast: React.FC<ExpiringVehicleDocumentsToastProps> = ({
  isOpen,
  onClose,
  onViewDocuments,
  count
}) => {
  const [visible, setVisible] = useState(false);

  // 🔁 Show toast every 1 hour
  useEffect(() => {
    if (count === 0) return;

    // First show after 1 hour
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, ONE_HOUR);

    // Repeat every 1 hour
    const interval = setInterval(() => {
      setVisible(true);
    }, ONE_HOUR);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [count]);

  // ⏱ Auto-close after 5 seconds
  useEffect(() => {
    if (visible) {
      const closeTimer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, AUTO_CLOSE_TIME);

      return () => clearTimeout(closeTimer);
    }
  }, [visible, onClose]);

  if (!visible || !isOpen || count === 0) {
    return null;
  }

  return (
    <div className="fixed top-24 right-4 z-[9999] max-w-md w-full animate-slide-in">
      <div className="bg-white rounded-lg shadow-xl border-l-4 border-red-500 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-red-100 rounded-lg">
                <Truck className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Vehicle Documents Expiring Soon
                </h3>
                <p className="text-sm text-gray-600">
                  {count} vehicle document{count !== 1 ? 's' : ''}{' '}
                  {count === 1 ? 'is' : 'are'} expiring within 30 days
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setVisible(false);
                onClose();
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors ml-2"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {onViewDocuments && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  onViewDocuments();
                  setVisible(false);
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-white text-xs font-medium rounded transition-colors"
                style={{
                  background:
                    'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                }}
              >
                <ExternalLink className="w-3 h-3 text-white" />
                <span className="text-white">View Vehicle Documents</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpiringVehicleDocumentsToast;
