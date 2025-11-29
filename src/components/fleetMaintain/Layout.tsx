import  { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from './Header'
import Sidebar from './Sidebar'
import ExpiringDocumentsPopup from "../common/ExpiringDocumentsPopup";
import ExpiringVehicleDocumentsToast from "../common/ExpiringVehicleDocumentsToast";
import { useExpiringDocuments } from "../../hooks/useExpiringDocuments";
import { useExpiringVehicleDocumentsFleetMaintenance } from "../../hooks/useExpiringVehicleDocumentsFleetMaintenance";

function Layout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { showExpiringToast, handleCloseToast, handleViewDocuments } = useExpiringDocuments();
  const { 
    showExpiringToast: showVehicleExpiringToast, 
    expiringDocuments: expiringVehicleDocuments, 
    handleCloseToast: handleCloseVehicleToast, 
    handleViewDocuments: handleViewVehicleDocuments 
  } = useExpiringVehicleDocumentsFleetMaintenance();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="flex h-screen bg-[#eeeeee]">
            {/* Sidebar with independent scroll */}
            <div className="flex-shrink-0 h-screen overflow-hidden">
                <Sidebar 
                    isCollapsed={isSidebarCollapsed} 
                    onToggle={toggleSidebar} 
                />
            </div>
            
            {/* Main content area with independent scroll */}
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                {/* Header - fixed at top */}
                <div className="flex-shrink-0 pl-5">
                    <Header />
                </div>
                
                {/* Main content with scroll */}
                <main className="flex-1 overflow-y-auto pl-5 p-4 pb-20">
                    <Outlet />
                </main>
            </div>
            
            {/* Global Expiring Employee Documents Popup */}
            <ExpiringDocumentsPopup
                isOpen={showExpiringToast}
                onClose={handleCloseToast}
                onViewDocuments={handleViewDocuments}
                daysThreshold={30}
                showOnlyOnce={false}
            />
            
            {/* Global Expiring Vehicle Documents Toast (Fleet Maintenance Only) */}
            <ExpiringVehicleDocumentsToast
                isOpen={showVehicleExpiringToast}
                onClose={handleCloseVehicleToast}
                onViewDocuments={handleViewVehicleDocuments}
                count={expiringVehicleDocuments.length}
            />
        </div>
    );
}

export default Layout