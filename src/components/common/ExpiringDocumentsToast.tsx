import React, { useEffect } from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

interface ExpiringDocumentsToastProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDocuments?: () => void;
  count: number;
}

const ExpiringDocumentsToast: React.FC<ExpiringDocumentsToastProps> = ({
  isOpen,
  onClose,
  onViewDocuments,
  count
}) => {
  // Auto-close after 8 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || count === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md w-full animate-slide-in">
      <div className="bg-white rounded-lg shadow-xl border-l-4 border-orange-500 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Documents Expiring Soon
                </h3>
                <p className="text-sm text-gray-600">
                  {count} document{count !== 1 ? 's' : ''} {count === 1 ? 'is' : 'are'} expiring within 30 days
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
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
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                style={{ color: 'white' }}
              >
                <ExternalLink className="w-3 h-3 text-white" style={{ color: 'white', stroke: 'white' }} />
                <span className="text-white" style={{ color: 'white' }}>View Documents</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpiringDocumentsToast;

// Add CSS animation styles
const styles = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  if (!document.head.querySelector('style[data-expiring-toast]')) {
    styleSheet.setAttribute('data-expiring-toast', 'true');
    document.head.appendChild(styleSheet);
  }
}

