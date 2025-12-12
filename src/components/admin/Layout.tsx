import  { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ExpiringDriverDocumentsPopup from "../common/ExpiringDriverDocumentsPopup";
import ErrorBoundary from "../common/ErrorBoundary";
import { useExpiringDriverDocuments } from "../../hooks/useExpiringDriverDocuments";

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
            </div>
        </ErrorBoundary>
    );
};

export default Layout;
