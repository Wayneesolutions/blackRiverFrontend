import  { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ExpiringDriverDocumentsPopup from "../common/ExpiringDriverDocumentsPopup";
import DocumentUploadNotification from "../common/DocumentUploadNotification";
import ErrorBoundary from "../common/ErrorBoundary";
import { useExpiringDriverDocuments } from "../../hooks/useExpiringDriverDocuments";
import AIChatAssistant from "../ai/AIChatAssistant";
import { socketService } from "../../services/socketService";

// Wrapper to log route changes and catch rendering issues
const OutletWrapper = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('🔄 Route changed to:', location.pathname);
  }, [location.pathname]);
  
  return <Outlet />;
};

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

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Global Socket.IO listener for document upload notifications
    useEffect(() => {
        console.log('🌐 GLOBAL: Setting up Socket.IO document upload listener in Layout...');
        console.log('🌐 GLOBAL: Socket.IO connected?', socketService.isConnected());
        console.log('🌐 GLOBAL: Socket.IO authenticated?', socketService.getIsAuthenticated());
        
        // FORCE Socket.IO connection
        const initSocketConnection = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ GLOBAL: No auth token found, cannot connect Socket.IO');
                return;
            }

            console.log('🔌 GLOBAL: Token found, forcing Socket.IO connection...');
            
            try {
                // Always try to connect (will reconnect if needed)
                await socketService.connect(token);
                console.log('✅ GLOBAL: Socket.IO connected successfully');
                console.log('✅ GLOBAL: Socket ID:', socketService.getSocket()?.id);
            } catch (error) {
                console.error('❌ GLOBAL: Failed to connect Socket.IO:', error);
            }
        };
        
        // Initialize connection immediately
        initSocketConnection();
        
        const handleDocumentUpload = (notification: any) => {
            console.log('🎉🎉🎉 GLOBAL NOTIFICATION RECEIVED! 🎉🎉🎉');
            console.log('📢 GLOBAL: Raw notification:', notification);
            console.log('📢 GLOBAL: Is array?', Array.isArray(notification));
            
            // Handle array format - unwrap if needed
            let notificationData = notification;
            if (Array.isArray(notification) && notification.length > 0) {
                notificationData = notification[0];
                console.log('📢 GLOBAL: Unwrapped from array:', notificationData);
            }
            
            console.log('📢 GLOBAL: Final notification data:', JSON.stringify(notificationData, null, 2));
            
            // Validate notification
            if (!notificationData || typeof notificationData !== 'object') {
                console.error('❌ GLOBAL: Invalid notification data:', notificationData);
                return;
            }
            
            console.log('📢 GLOBAL: Order ID:', notificationData.orderId);
            console.log('📢 GLOBAL: Order Number:', notificationData.orderNumber);
            console.log('📢 GLOBAL: Driver Name:', notificationData.driverName);
            
            // Set notification data and show popup (like expiring documents pattern)
            setDocumentNotification(notificationData);
            setShowDocumentNotification(true);
            
            console.log('✅ ADMIN GLOBAL: State updated - notification set and popup shown');
        };

        // Wait for socket to be ready before registering listener
        const registerListener = () => {
            const socket = socketService.getSocket();
            if (!socket || !socket.connected) {
                console.warn('⚠️ GLOBAL: Socket not ready yet, retrying in 500ms...');
                setTimeout(registerListener, 500);
                return;
            }

            console.log('✅ GLOBAL: Socket is ready! Registering listener...');
            console.log('✅ GLOBAL: Socket ID:', socket.id);
            console.log('✅ GLOBAL: Socket connected:', socket.connected);
            
            // Register via service
            socketService.onDocumentUploadNotification(handleDocumentUpload);
            console.log('✅ GLOBAL: Socket.IO listener registered via service');
            
            // Also add direct socket listener as primary handler
            socket.on('documentUploadNotification', (data) => {
                console.log('🔔🔔🔔 GLOBAL: Direct socket listener triggered!');
                console.log('🔔 GLOBAL: Raw data:', data);
                console.log('🔔 GLOBAL: Is array?', Array.isArray(data));
                
                // Handle array format (Socket.IO sometimes wraps in array)
                let notificationData = data;
                if (Array.isArray(data) && data.length > 0) {
                    notificationData = data[0];
                    console.log('🔔 GLOBAL: Unwrapped from array:', notificationData);
                }
                
                console.log('🔔 GLOBAL: Final notification data:', JSON.stringify(notificationData, null, 2));
                handleDocumentUpload(notificationData);
            });
            console.log('✅ GLOBAL: Direct socket listener registered as PRIMARY handler');
            
            // Add catch-all listener
            socket.onAny((eventName, ...args) => {
                if (eventName === 'documentUploadNotification') {
                    console.log('🎯🎯🎯 GLOBAL: onAny caught documentUploadNotification!', args);
                }
            });
            console.log('✅ GLOBAL: Catch-all listener (onAny) registered');
        };

        // Start registration after connection attempt
        setTimeout(registerListener, 1000);

        // Re-register listener when socket reconnects
        const socket = socketService.getSocket();
        if (socket) {
            const handleReconnect = () => {
                console.log('🔄 GLOBAL: Socket reconnected! Re-registering document upload listener...');
                socketService.onDocumentUploadNotification(handleDocumentUpload);
                console.log('✅ GLOBAL: Listener re-registered after reconnection');
            };
            
            socket.on('connect', handleReconnect);
            console.log('✅ GLOBAL: Reconnect handler registered');
            
            // Add a catch-all listener to debug
            const handleAnyEvent = (eventName: string, ...args: any[]) => {
                console.log('🔔 GLOBAL: Socket event received:', eventName, args);
            };
            
            socket.onAny(handleAnyEvent);
            console.log('🐛 GLOBAL DEBUG: Catch-all listener registered to see ALL socket events');
            
            // Cleanup
            return () => {
                socket.off('connect', handleReconnect);
                socket.offAny(handleAnyEvent);
                socketService.offDocumentUploadNotification(handleDocumentUpload);
                console.log('🔇 GLOBAL: Stopped listening for document upload notifications');
            };
        } else {
            // Cleanup without reconnect handler
            return () => {
                socketService.offDocumentUploadNotification(handleDocumentUpload);
                console.log('🔇 GLOBAL: Stopped listening for document upload notifications');
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
                            console.log('❌ ADMIN: Closing notification...');
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
