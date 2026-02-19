import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

interface TrialExpiredToastContextType {
  showTrialExpiredToast: (message?: string) => void;
  hideTrialExpiredToast: () => void;
}

const TrialExpiredToastContext = createContext<TrialExpiredToastContextType | undefined>(undefined);

export const useTrialExpiredToast = () => {
  const context = useContext(TrialExpiredToastContext);
  if (!context) {
    throw new Error('useTrialExpiredToast must be used within TrialExpiredToastProvider');
  }
  return context;
};

interface TrialExpiredToastProviderProps {
  children: React.ReactNode;
}

export const TrialExpiredToastProvider: React.FC<TrialExpiredToastProviderProps> = ({ children }) => {
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("Your subscription has ended. Purchase to continue use.");

  const showTrialExpiredToast = useCallback((customMessage?: string) => {
    if (customMessage) {
      setMessage(customMessage);
    }
    // Always show toast - don't check if already showing to ensure it stays visible
    setShowToast(true);
  }, []);

  const hideTrialExpiredToast = useCallback(() => {
    setShowToast(false);
  }, []);

  // Store the show function globally so API client can access it
  useEffect(() => {
    (window as any).showTrialExpiredToast = showTrialExpiredToast;
    return () => {
      delete (window as any).showTrialExpiredToast;
    };
  }, [showTrialExpiredToast]);

  return (
    <TrialExpiredToastContext.Provider value={{ showTrialExpiredToast, hideTrialExpiredToast }}>
      {children}
      {/* Global Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[99999] w-[400px] max-w-[90vw]">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-xl p-4 animate-slide-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <FaExclamationTriangle className="text-yellow-600" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Subscription Ended</p>
                <p className="text-sm text-yellow-800 mb-2">{message}</p>
                <p className="text-xs text-yellow-700 mb-3">You don't have access right now. Please purchase a plan to continue using all features.</p>
                <button
                  onClick={() => {
                    const isAdmin = window.location.pathname.includes('/admin/');
                    const subscriptionPath = isAdmin ? '/admin/subscription' : '/subscription';
                    window.location.href = subscriptionPath;
                  }}
                  className="mt-2 px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors w-full"
                >
                  Purchase Now
                </button>
              </div>
              <button
                onClick={hideTrialExpiredToast}
                className="flex-shrink-0 text-yellow-600 hover:text-yellow-800 transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </TrialExpiredToastContext.Provider>
  );
};

