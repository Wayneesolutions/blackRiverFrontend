import { Outlet } from "react-router-dom";
import DispatchSidebar from "./Sidebar";
import DispatchHeader from "./Header";

const Layout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-[#FFF6F6] pb-16">
            <div className="flex flex-1">
                <DispatchSidebar />
                <div className="flex flex-col flex-1 pl-5">
                    <DispatchHeader />
                    <main className="p-4 flex-1">
                        <Outlet />
                    </main>
                </div>
            </div>
            
            {/* Footer fixed at bottom */}
            <footer className="bg-[#9793E4] text-center text-white py-4 text-md fixed bottom-0 left-0 w-full z-50">
                Dispatch Module - Logistics All rights reserved
            </footer>
        </div>
    );
};

export default Layout;