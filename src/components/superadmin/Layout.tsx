// src/components/admin/Layout.tsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ExpiringDocumentsPopup from "../common/ExpiringDocumentsPopup";
import { useExpiringDocuments } from "../../hooks/useExpiringDocuments";

const Layout = () => {
    const { showExpiringPopup, handleClosePopup, handleViewDocuments } = useExpiringDocuments();

    return (
        <div className="flex flex-col min-h-screen bg-[#eeeeee] pb-16">
            {/* Main row with sidebar + content */}
            <div className="flex flex-1">
                <Sidebar />
                <div className="flex flex-col flex-1 pl-5">
                    <Header />
                    <main className="p-4 flex-1">
                        <Outlet />
                    </main>
                </div>
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
        </div>
    );
};
export default Layout;

