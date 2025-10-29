import  { useState } from "react";
import { Outlet } from "react-router-dom";
import DispatchSidebar from "./Sidebar";
import DispatchHeader from "./Header";
import ExpiringDocumentsPopup from "../common/ExpiringDocumentsPopup";
import ExpiringDriverDocumentsPopup from "../common/ExpiringDriverDocumentsPopup";
import { useExpiringDocuments } from "../../hooks/useExpiringDocuments";
import { useExpiringDriverDocuments } from "../../hooks/useExpiringDriverDocuments";

const Layout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { showExpiringPopup, handleClosePopup, handleViewDocuments } = useExpiringDocuments();
    const { 
        showExpiringPopup: showDriverExpiringPopup, 
        handleClosePopup: handleCloseDriverPopup, 
        handleViewDocuments: handleViewDriverDocuments 
    } = useExpiringDriverDocuments();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="flex h-screen bg-[#eeeeee]">
            {/* Sidebar with independent scroll */}
            <div className="flex-shrink-0 h-screen overflow-hidden">
                <DispatchSidebar 
                    isCollapsed={isSidebarCollapsed} 
                    onToggle={toggleSidebar} 
                />
            </div>
            
            {/* Main content area with independent scroll */}
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                {/* Header - fixed at top */}
                <div className="flex-shrink-0 pl-5">
                    <DispatchHeader />
                </div>
                
                {/* Main content with scroll */}
                <main className="flex-1 overflow-y-auto pl-5 p-4 pb-20">
                    <Outlet />
                </main>
            </div>
            
            {/* Global Expiring Documents Popup */}
            <ExpiringDocumentsPopup
                isOpen={showExpiringPopup}
                onClose={handleClosePopup}
                onViewDocuments={handleViewDocuments}
                daysThreshold={30}
                showOnlyOnce={false}
            />
            
            {/* Global Expiring Driver Documents Popup */}
            <ExpiringDriverDocumentsPopup
                isOpen={showDriverExpiringPopup}
                onClose={handleCloseDriverPopup}
                onViewDocuments={handleViewDriverDocuments}
                daysThreshold={30}
                showOnlyOnce={false}
            />
        </div>
    );
};

export default Layout;