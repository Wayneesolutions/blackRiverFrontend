import { useState } from "react";
import { Outlet } from "react-router-dom";
import DispatchSidebar from "./Sidebar";
import DispatchHeader from "./Header";
import ExpiringDriverDocumentsPopup from "../common/ExpiringDriverDocumentsPopup";
import { useExpiringDriverDocuments } from "../../hooks/useExpiringDriverDocuments";

const Layout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
                />
            </div>

            {/* Main content area with independent scroll */}
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                {/* Header - fixed at top */}
                <div className="flex-shrink-0">
                    <DispatchHeader isSidebarCollapsed={isSidebarCollapsed}
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
        </div>
    );
};

export default Layout;