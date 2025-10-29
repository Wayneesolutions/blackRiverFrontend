// components/Header.jsx
import React from "react";
import { FaBell, FaCommentDots, FaUserCircle, FaExpand } from "react-icons/fa";

const Header = () => {
    return (
        <header className="flex items-center justify-between px-4 py-4">
            {/* Quick Action Search */}
            <div className="flex-1 max-w-xl bg-white shadow-[0px_4px_4px_0px_#00000040] shadow-sm">
                <input
                    type="text"
                    placeholder="Quick Action"
                    className="w-full  rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 ml-4">
                <FaBell className="cursor-pointer" />
                <FaUserCircle className="cursor-pointer" />
            </div>
        </header>
    );
};

export default Header;
