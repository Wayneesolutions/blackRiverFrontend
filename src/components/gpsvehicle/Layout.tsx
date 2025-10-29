import React from 'react'
import  { useState } from "react";
import { Outlet } from "react-router-dom";
import GpsHeader from './Header'
import GpsSidebar from './Sidebar'
import ExpiringDocumentsPopup from "../common/ExpiringDocumentsPopup";
import { useExpiringDocuments } from "../../hooks/useExpiringDocuments";

function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { showExpiringPopup, handleClosePopup, handleViewDocuments } = useExpiringDocuments();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="flex h-screen bg-[#eeeeee]">
            {/* Sidebar with independent scroll */}
            <div className="flex-shrink-0 h-screen overflow-hidden">
                <GpsSidebar 
                    isCollapsed={isSidebarCollapsed} 
                    onToggle={toggleSidebar} 
                />
            </div>
            
            {/* Main content area with independent scroll */}
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                {/* Header - fixed at top */}
                <div className="flex-shrink-0 pl-5">
                    <GpsHeader />
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
        </div>
    );
}

export default Layout