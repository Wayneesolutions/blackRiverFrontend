import React from 'react'
import { FaBell, FaCommentDots, FaUserCircle, FaExpand } from "react-icons/fa";
function Header() {
    return (
        <header className="flex items-center justify-between px-4 py-4">
            {/* Left section: Search + Button */}
            <div className="flex items-center flex-1 gap-14 max-w-3xl">
                {/* Quick Action Search */}
                <div className="flex-1 bg-white shadow-[0px_4px_4px_0px_#00000040] rounded-md">
                    <input
                        type="text"
                        placeholder="Quick Action"
                        className="w-full rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                    />
                </div>

                {/* Dispatch & Load Management Button */}
                <button className="px-4 py-2 rounded-md text-sm bg-gradient-to-r from-gray-200 to-blue-200 shadow-md hover:opacity-90 transition">
                    GPS Tracking & Vehicle Telematics
                </button>
            </div>

            {/* Right section: Icons */}
            <div className="flex items-center gap-4 ml-4">
                <FaBell className="cursor-pointer" />
                <FaUserCircle className="cursor-pointer" />
            </div>
        </header>
    )
}

export default Header