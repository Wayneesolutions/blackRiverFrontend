import  { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ExpiringDocumentsPopup from "../common/ExpiringDocumentsPopup";
import ExpiringDriverDocumentsPopup from "../common/ExpiringDriverDocumentsPopup";
import { useExpiringDocuments } from "../../hooks/useExpiringDocuments";
import { useExpiringDriverDocuments } from "../../hooks/useExpiringDriverDocuments";

const Layout = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { showExpiringPopup, setShowExpiringPopup, handleClosePopup, handleViewDocuments } = useExpiringDocuments();
    const { 
        showExpiringPopup: showDriverExpiringPopup, 
        setShowExpiringPopup: setShowDriverExpiringPopup, 
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
                    {/* Debug Panel - Remove after testing */}
                    <div className="fixed top-20 right-4 z-50 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg max-w-xs">
                        <h3 className="text-sm font-bold text-yellow-800 mb-2">Popup Debug</h3>
                        <p className="text-xs text-yellow-700 mb-1">Employee Popup: {showExpiringPopup ? 'OPEN' : 'CLOSED'}</p>
                        <p className="text-xs text-yellow-700 mb-1">Driver Popup: {showDriverExpiringPopup ? 'OPEN' : 'CLOSED'}</p>
                        <p className="text-xs text-yellow-700 mb-2">Hook Active: ✅</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    console.log('🔍 Manual employee popup trigger clicked');
                                    setShowExpiringPopup(true);
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition-colors flex-1"
                            >
                                🧪 Employee
                            </button>
                            <button
                                onClick={() => {
                                    console.log('🔍 Manual driver popup trigger clicked');
                                    setShowDriverExpiringPopup(true);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors flex-1"
                            >
                                🧪 Driver
                            </button>
                        </div>
                    </div>
                    <Outlet />
                </main>
            </div>
            
            {/* Footer fixed at bottom */}
            <footer className="bg-[#9793E4] text-center text-white py-4 text-md fixed bottom-0 left-0 w-full z-50">
                Logistics All rights reserved
            </footer>
            
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