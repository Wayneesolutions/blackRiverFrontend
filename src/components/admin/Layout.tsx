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
            console.log('📢 GLOBAL: Full notification data:', notification);
            console.log('📢 GLOBAL: Notification type:', typeof notification);
            console.log('📢 GLOBAL: Notification keys:', Object.keys(notification));
            console.log('📢 GLOBAL: Order ID:', notification.orderId);
            console.log('📢 GLOBAL: Order Number:', notification.orderNumber);
            console.log('📢 GLOBAL: Driver Name:', notification.driverName);
            console.log('📢 GLOBAL: Message:', notification.message);
            console.log('📢 GLOBAL: Timestamp:', notification.timestamp);
            
            console.log('🔄 GLOBAL: Setting notification state...');
            console.log('🔄 GLOBAL: Current documentNotification:', documentNotification);
            
            // Show the notification
            setDocumentNotification(notification);
            
            console.log('✅ GLOBAL: setDocumentNotification called with:', notification);
            console.log('✅ GLOBAL: Notification state update triggered');
            
            // Force a console log after a short delay to see if state updated
            setTimeout(() => {
                console.log('⏱️ GLOBAL: After 100ms, checking if popup rendered...');
            }, 100);
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
            socketService.onDocumentUploadNotification(handleDocumentUpload);
            console.log('✅ GLOBAL: Socket.IO listener registered for "documentUploadNotification" event');
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

                {/* Global Document Upload Notification */}
                {(() => {
                    console.log('🔍 RENDER CHECK: documentNotification =', documentNotification);
                    console.log('🔍 RENDER CHECK: Should render?', !!documentNotification);
                    return documentNotification && (
                        <DocumentUploadNotification
                            notification={documentNotification}
                            onClose={() => {
                                console.log('❌ Closing notification...');
                                setDocumentNotification(null);
                            }}
                            userRole="admin"
                        />
                    );
                })()}

                {/* DEBUG: State Monitor */}
                <div className="fixed top-4 left-4 z-[99998] bg-black text-white p-2 rounded text-xs font-mono max-w-xs">
                    <div>Socket: {socketService.isConnected() ? '🟢 Connected' : '🔴 Disconnected'}</div>
                    <div>Notification: {documentNotification ? '🟢 Active' : '⚪ None'}</div>
                    {documentNotification && (
                        <div className="mt-1 text-green-400">
                            Order: {documentNotification.orderNumber}
                        </div>
                    )}
                </div>

                {/* DEBUG: Test Notification Button */}
                <div className="fixed bottom-4 left-4 z-[99999] flex flex-col gap-2">
                    <button
                        onClick={() => {
                            console.log('🧪 TEST: Manually triggering notification...');
                            const testNotification = {
                                type: 'DOCUMENT_UPLOAD',
                                title: 'Driver Documents Uploaded',
                                message: 'TEST: Driver has uploaded POD and Manifest documents',
                                orderId: '123456',
                                orderNumber: 'TEST-ORDER-123',
                                driverName: 'Test Driver',
                                timestamp: new Date().toISOString(),
                                link: '/admin/dispatch/trips?orderId=123456'
                            };
                            setDocumentNotification(testNotification);
                            console.log('✅ TEST: Notification triggered manually');
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-all"
                        style={{ fontSize: '12px' }}
                    >
                        🧪 Test Notification
                    </button>
                    <button
                        onClick={() => {
                            console.log('🔍 Socket.IO Status Check:');
                            console.log('  - Connected:', socketService.isConnected());
                            console.log('  - Authenticated:', socketService.getIsAuthenticated());
                            const socket = socketService.getSocket();
                            console.log('  - Socket ID:', socket?.id);
                            console.log('  - Socket exists:', !!socket);
                            console.log('  - Listeners:', socket?.listeners('documentUploadNotification'));
                            alert(`Socket Connected: ${socketService.isConnected()}\nSocket ID: ${socket?.id || 'N/A'}\nAuthenticated: ${socketService.getIsAuthenticated()}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all"
                        style={{ fontSize: '12px' }}
                    >
                        🔍 Check Socket
                    </button>
                    <button
                        onClick={async () => {
                            console.log('🔥 Calling backend TEST endpoint to trigger notification...');
                            try {
                                const response = await fetch('http://localhost:3000/api/v1/dispatcher/test/document-notification', {
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                });
                                const data = await response.json();
                                console.log('✅ Backend response:', data);
                                alert('Backend test triggered! Check console and watch for popup.');
                            } catch (error) {
                                console.error('❌ Backend test failed:', error);
                                alert('Backend test failed: ' + error.message);
                            }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition-all"
                        style={{ fontSize: '12px' }}
                    >
                        🔥 Backend Test
                    </button>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Layout;
