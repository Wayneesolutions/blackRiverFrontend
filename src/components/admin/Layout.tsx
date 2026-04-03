import { useState, useEffect, useCallback, memo } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ExpiringDriverDocumentsPopup from "../common/ExpiringDriverDocumentsPopup";
import DocumentUploadNotification from "../common/DocumentUploadNotification";
import ErrorBoundary from "../common/ErrorBoundary";
import { useExpiringDriverDocuments } from "../../hooks/useExpiringDriverDocuments";
import AIChatAssistant from "../ai/AIChatAssistant";
import { socketService } from "../../services/socketService";

// Wrapper to handle route changes
const OutletWrapper = memo(() => {
  return <Outlet />;
});

const Layout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [documentNotification, setDocumentNotification] = useState<any>(null);
    const [showDocumentNotification, setShowDocumentNotification] = useState(false);
    
    // Hooks MUST be called unconditionally at top level (React Rules of Hooks)
    // ErrorBoundary will catch any errors from these hooks
    const { 
        showExpiringPopup: showDriverExpiringPopup, 
        handleClosePopup: handleCloseDriverPopup, 
        handleViewDocuments: handleViewDriverDocuments 
    } = useExpiringDriverDocuments();

    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed(prev => !prev);
    }, []);

    // Global Socket.IO listener for document upload notifications
    useEffect(() => {
        // Initialize Socket.IO connection
        const initSocketConnection = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                await socketService.connect(token);
            } catch (error) {
                console.error('Failed to connect Socket.IO:', error);
            }
        };

        initSocketConnection();

        const handleDocumentUpload = (notification: any) => {
            // Handle array format - unwrap if needed
            let notificationData = notification;
            if (Array.isArray(notification) && notification.length > 0) {
                notificationData = notification[0];
            }

            if (!notificationData || typeof notificationData !== 'object') return;

            setDocumentNotification(notificationData);
            setShowDocumentNotification(true);
        };

        // Wait for socket to be ready before registering listener
        const registerListener = () => {
            const socket = socketService.getSocket();
            if (!socket || !socket.connected) {
                setTimeout(registerListener, 500);
                return;
            }

            socketService.onDocumentUploadNotification(handleDocumentUpload);

            // Also add direct socket listener as primary handler
            socket.on('documentUploadNotification', (data) => {
                let notificationData = data;
                if (Array.isArray(data) && data.length > 0) {
                    notificationData = data[0];
                }
                handleDocumentUpload(notificationData);
            });
        };

        setTimeout(registerListener, 1000);

        // Re-register listener when socket reconnects
        const socket = socketService.getSocket();
        if (socket) {
            const handleReconnect = () => {
                socketService.onDocumentUploadNotification(handleDocumentUpload);
            };

            socket.on('connect', handleReconnect);

            return () => {
                socket.off('connect', handleReconnect);
                socketService.offDocumentUploadNotification(handleDocumentUpload);
            };
        } else {
            return () => {
                socketService.offDocumentUploadNotification(handleDocumentUpload);
            };
        }
    }, []);

    return (
        <ErrorBoundary>
            <div className="flex h-screen bg-[#eeeeee]">
                {/* Sidebar with independent scroll */}
                <ErrorBoundary>
                    <div className="flex-shrink-0 h-screen overflow-hidden">
                        <Sidebar 
                            isCollapsed={isSidebarCollapsed}
                        />
                    </div>
                </ErrorBoundary>
                
                {/* Main content area with independent scroll */}
                <div className="flex flex-col flex-1 h-full overflow-hidden">
                    {/* Header - fixed at top */}
                    <ErrorBoundary>
                        <div className="flex-shrink-0">
                            <Header 
                                isSidebarCollapsed={isSidebarCollapsed}
                                onToggleSidebar={toggleSidebar}
                            />
                        </div>
                    </ErrorBoundary>
                    
                    {/* Main content with scroll */}
                    <main className="flex-1 overflow-y-auto bg-[#EDF8FF]">
                        <ErrorBoundary
                            fallback={
                                <div className="p-8 bg-white rounded-lg shadow">
                                    <h2 className="text-xl font-bold text-red-600 mb-4">Page Error</h2>
                                    <p className="text-gray-600 mb-4">The page failed to load. Please check the console for details.</p>
                                    <button
                                        onClick={() => window.location.href = '/admin/dashboard'}
                                        className="px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Go to Dashboard
                                    </button>
                                </div>
                            }
                        >
                            <OutletWrapper />
                        </ErrorBoundary>
                    </main>
                </div>
                
             
                
                {/* Global Expiring Driver Documents Popup */}
                <ErrorBoundary>
                    <ExpiringDriverDocumentsPopup
                        isOpen={showDriverExpiringPopup}
                        onClose={handleCloseDriverPopup}
                        onViewDocuments={handleViewDriverDocuments}
                        daysThreshold={30}
                        showOnlyOnce={false}
                    />
                </ErrorBoundary>

                {/* AI Chat Assistant */}
                <ErrorBoundary>
                    <AIChatAssistant />
                </ErrorBoundary>

                {/* Global Document Upload Notification - Like expiring documents popup */}
                {showDocumentNotification && documentNotification && (
                    <DocumentUploadNotification
                        notification={documentNotification}
                        onClose={() => {
                            setShowDocumentNotification(false);
                            setDocumentNotification(null);
                        }}
                        userRole="admin"
                    />
                )}

            </div>
        </ErrorBoundary>
    );
};

export default Layout;
