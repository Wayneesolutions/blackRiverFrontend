import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import DispatchSidebar from "./Sidebar";
import DispatchHeader from "./Header";
import ExpiringDriverDocumentsPopup from "../common/ExpiringDriverDocumentsPopup";
import DocumentUploadNotification from "../common/DocumentUploadNotification";
import { useExpiringDriverDocuments } from "../../hooks/useExpiringDriverDocuments";
import AIChatAssistant from "../ai/AIChatAssistant";
import { socketService } from "../../services/socketService";

const Layout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [documentNotification, setDocumentNotification] = useState<any>(null);
    const {
        showExpiringPopup: showDriverExpiringPopup,
        handleClosePopup: handleCloseDriverPopup,
        handleViewDocuments: handleViewDriverDocuments
    } = useExpiringDriverDocuments();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Global Socket.IO listener for document upload notifications (DISPATCHER)
    useEffect(() => {
        console.log('🌐 DISPATCHER GLOBAL: Setting up Socket.IO document upload listener...');
        console.log('🌐 DISPATCHER GLOBAL: Socket.IO connected?', socketService.isConnected());
        console.log('🌐 DISPATCHER GLOBAL: Socket.IO authenticated?', socketService.getIsAuthenticated());
        
        // FORCE Socket.IO connection
        const initSocketConnection = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ DISPATCHER GLOBAL: No auth token found');
                return;
            }

            console.log('🔌 DISPATCHER GLOBAL: Token found, forcing Socket.IO connection...');
            
            try {
                await socketService.connect(token);
                console.log('✅ DISPATCHER GLOBAL: Socket.IO connected successfully');
                console.log('✅ DISPATCHER GLOBAL: Socket ID:', socketService.getSocket()?.id);
            } catch (error) {
                console.error('❌ DISPATCHER GLOBAL: Failed to connect Socket.IO:', error);
            }
        };
        
        initSocketConnection();
        
        const handleDocumentUpload = (notification: any) => {
            console.log('🎉🎉🎉 DISPATCHER GLOBAL NOTIFICATION RECEIVED! 🎉🎉🎉');
            console.log('📢 DISPATCHER GLOBAL: Full notification data:', notification);
            console.log('📢 DISPATCHER GLOBAL: Notification type:', typeof notification);
            console.log('📢 DISPATCHER GLOBAL: Notification keys:', Object.keys(notification));
            console.log('📢 DISPATCHER GLOBAL: Order ID:', notification.orderId);
            console.log('📢 DISPATCHER GLOBAL: Order Number:', notification.orderNumber);
            console.log('📢 DISPATCHER GLOBAL: Driver Name:', notification.driverName);
            console.log('📢 DISPATCHER GLOBAL: Message:', notification.message);
            
            console.log('🔄 DISPATCHER GLOBAL: Setting notification state...');
            console.log('🔄 DISPATCHER GLOBAL: Current documentNotification:', documentNotification);
            
            // Show the notification
            setDocumentNotification(notification);
            
            console.log('✅ DISPATCHER GLOBAL: setDocumentNotification called');
            console.log('✅ DISPATCHER GLOBAL: Notification state update triggered');
            
            setTimeout(() => {
                console.log('⏱️ DISPATCHER GLOBAL: After 100ms, checking if popup rendered...');
            }, 100);
        };

        // Wait for socket to be ready before registering listener
        const registerListener = () => {
            const socket = socketService.getSocket();
            if (!socket || !socket.connected) {
                console.warn('⚠️ DISPATCHER GLOBAL: Socket not ready yet, retrying in 500ms...');
                setTimeout(registerListener, 500);
                return;
            }

            console.log('✅ DISPATCHER GLOBAL: Socket is ready! Registering listener...');
            socketService.onDocumentUploadNotification(handleDocumentUpload);
            console.log('✅ DISPATCHER GLOBAL: Socket.IO listener registered');
        };

        // Start registration after connection attempt
        setTimeout(registerListener, 1000);

        // Re-register listener when socket reconnects
        const socket = socketService.getSocket();
        if (socket) {
            const handleReconnect = () => {
                console.log('🔄 DISPATCHER GLOBAL: Socket reconnected! Re-registering listener...');
                socketService.onDocumentUploadNotification(handleDocumentUpload);
                console.log('✅ DISPATCHER GLOBAL: Listener re-registered');
            };
            
            socket.on('connect', handleReconnect);
            
            // Catch-all listener
            const handleAnyEvent = (eventName: string, ...args: any[]) => {
                console.log('🔔 DISPATCHER GLOBAL: Socket event received:', eventName, args);
            };
            
            socket.onAny(handleAnyEvent);
            console.log('🐛 DISPATCHER DEBUG: Catch-all listener registered');
            
            // Cleanup
            return () => {
                socket.off('connect', handleReconnect);
                socket.offAny(handleAnyEvent);
                socketService.offDocumentUploadNotification(handleDocumentUpload);
                console.log('🔇 DISPATCHER GLOBAL: Stopped listening');
            };
        } else {
            return () => {
                socketService.offDocumentUploadNotification(handleDocumentUpload);
                console.log('🔇 DISPATCHER GLOBAL: Stopped listening');
            };
        }
    }, []);

    return (
        <div className="flex h-screen bg-[#eeeeee]">
            {/* Sidebar with independent scroll */}
            <div className="flex-shrink-0 h-screen overflow-hidden">
                <DispatchSidebar
                    isCollapsed={isSidebarCollapsed}
                />
            </div>

            {/* Main content area with independent scroll */}
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                {/* Header - fixed at top */}
                <div className="flex-shrink-0">
                    <DispatchHeader
                        onToggleSidebar={toggleSidebar} />
                </div>

                {/* Main content with scroll */}
                <main className="flex-1 overflow-y-auto bg-[#EDF8FF]">
                    <Outlet />
                </main>
            </div>

            {/* Global Expiring Driver Documents Popup */}
            <ExpiringDriverDocumentsPopup
                isOpen={showDriverExpiringPopup}
                onClose={handleCloseDriverPopup}
                onViewDocuments={handleViewDriverDocuments}
                daysThreshold={30}
                showOnlyOnce={false}
            />
            
            {/* AI Chat Assistant */}
            <AIChatAssistant />

            {/* Global Document Upload Notification */}
            {(() => {
                console.log('🔍 DISPATCHER RENDER CHECK: documentNotification =', documentNotification);
                console.log('🔍 DISPATCHER RENDER CHECK: Should render?', !!documentNotification);
                return documentNotification && (
                    <DocumentUploadNotification
                        notification={documentNotification}
                        onClose={() => {
                            console.log('❌ DISPATCHER: Closing notification...');
                            setDocumentNotification(null);
                        }}
                        userRole="dispatcher"
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
                        console.log('🧪 DISPATCHER TEST: Manually triggering notification...');
                        const testNotification = {
                            type: 'DOCUMENT_UPLOAD',
                            title: 'Driver Documents Uploaded',
                            message: 'TEST: Driver has uploaded POD and Manifest documents',
                            orderId: '123456',
                            orderNumber: 'TEST-ORDER-123',
                            driverName: 'Test Driver',
                            timestamp: new Date().toISOString(),
                            link: '/dispatch/trips?orderId=123456'
                        };
                        setDocumentNotification(testNotification);
                        console.log('✅ DISPATCHER TEST: Notification triggered');
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-all"
                    style={{ fontSize: '12px' }}
                >
                    🧪 Test Notification
                </button>
                    <button
                        onClick={() => {
                            console.log('🔍 DISPATCHER: Socket.IO Status Check:');
                            console.log('  - Connected:', socketService.isConnected());
                            console.log('  - Authenticated:', socketService.getIsAuthenticated());
                            const socket = socketService.getSocket();
                            console.log('  - Socket ID:', socket?.id);
                            alert(`Socket Connected: ${socketService.isConnected()}\nSocket ID: ${socket?.id || 'N/A'}\nAuthenticated: ${socketService.getIsAuthenticated()}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all"
                        style={{ fontSize: '12px' }}
                    >
                        🔍 Check Socket
                    </button>
                    <button
                        onClick={async () => {
                            console.log('🔥 DISPATCHER: Calling backend TEST endpoint...');
                            try {
                                const response = await fetch('http://localhost:3000/api/v1/dispatcher/test/document-notification', {
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                });
                                const data = await response.json();
                                console.log('✅ DISPATCHER: Backend response:', data);
                                alert('Backend test triggered! Check console and watch for popup.');
                            } catch (error) {
                                console.error('❌ DISPATCHER: Backend test failed:', error);
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
    );
};

export default Layout;