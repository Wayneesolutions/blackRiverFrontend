import { useState, useRef, useEffect } from "react";
import { FaSignOutAlt, FaUser, FaBars } from "react-icons/fa";
import {
  Search, X, LogOut, AlertCircle, ArrowRight,
  LayoutDashboard, Truck, Package, Users,
} from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import { usePageTitle } from "../../hooks/usePageTitle";

interface ManifestHeaderProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  basePath?: string;
}

const getQuickActions = (_basePath: string) => [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Manifest portal overview",
    path: "/dashboard",
    icon: <LayoutDashboard size={16} />,
    keywords: ["dashboard", "home", "overview"],
  },
  {
    id: "trucks",
    title: "Trucks",
    description: "View all trucks",
    path: "/trucks",
    icon: <Truck size={16} />,
    keywords: ["trucks", "vehicles", "fleet"],
  },
  {
    id: "trailers",
    title: "Trailers",
    description: "View all trailers",
    path: "/trailers",
    icon: <Package size={16} />,
    keywords: ["trailers", "cargo", "container"],
  },
  {
    id: "drivers",
    title: "Drivers",
    description: "View all drivers",
    path: "/drivers",
    icon: <Users size={16} />,
    keywords: ["drivers", "people", "staff"],
  },
];

const ManifestHeader: React.FC<ManifestHeaderProps> = ({
  isSidebarCollapsed = false,
  onToggleSidebar,
  basePath = "/admin/manifest",
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { logout } = useLogout();
  const { userInfo } = useSelector((state: RootState) => state.userAuth);
  const navigate = useNavigate();
  const pageTitle = usePageTitle();

  const quickActions = getQuickActions(basePath);

  const filteredActions = quickActions.filter(
    (a) =>
      a.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener("mousedown", handle);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => document.removeEventListener("mousedown", handle);
  }, [isSearchOpen]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSelectedIndex(0);
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [isSearchOpen]);

  useEffect(() => { setSelectedIndex(0); }, [searchQuery]);

  const handleActionSelect = (action: ReturnType<typeof getQuickActions>[0]) => {
    navigate(`${basePath}${action.path}`);
    setSearchQuery("");
    setIsSearchOpen(false);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredActions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((p) => (p < filteredActions.length - 1 ? p + 1 : 0)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIndex((p) => (p > 0 ? p - 1 : filteredActions.length - 1)); }
    if (e.key === "Enter")     { e.preventDefault(); if (filteredActions[selectedIndex]) handleActionSelect(filteredActions[selectedIndex]); }
  };

  return (
    <>
      <header
        className="flex items-center justify-between px-6 py-4 shadow-sm relative z-20"
        style={{ background: "linear-gradient(135deg, #42aeec 0%, #0ea3d8 100%)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <FaBars size={20} />
          </button>
        </div>

        {pageTitle && (
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
            <span className="text-white font-semibold text-lg tracking-wide">{pageTitle}</span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
            title="Quick Search (Ctrl+K)"
          >
            <Search size={20} />
          </button>

          <button
            onClick={() => navigate(`${basePath}/drivers`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
            title="Profile"
          >
            <FaUser size={16} />
            <span className="text-sm font-medium hidden sm:inline">
              {userInfo?.userData?.name?.split(" ")[0] || "Profile"}
            </span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors !text-white"
            title="Logout"
          >
            <FaSignOutAlt size={18} />
          </button>
        </div>
      </header>

      {/* Quick Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/30 backdrop-blur-sm">
          <div ref={searchRef} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <form
              onSubmit={(e) => { e.preventDefault(); if (filteredActions[selectedIndex]) handleActionSelect(filteredActions[selectedIndex]); }}
              className="p-4 border-b border-gray-200"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search — Manifests, Trucks, Trailers, Drivers…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-12 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSelectedIndex(0); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="text-gray-400" size={20} />
                </button>
              </div>
            </form>

            {searchQuery.trim() !== "" && filteredActions.length > 0 && (
              <div className="max-h-[400px] overflow-y-auto">
                <div className="py-2">
                  {filteredActions.map((action, index) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionSelect(action)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-all border-l-2 ${
                        index === selectedIndex ? "bg-blue-50 border-[#42aeec]" : "border-transparent hover:border-blue-300"
                      }`}
                    >
                      <div className="flex-shrink-0 p-2 rounded-lg bg-[#42aeec]/10 text-[#42aeec]">{action.icon}</div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{action.title}</div>
                        <p className="text-sm text-gray-500 truncate">{action.description}</p>
                      </div>
                      <ArrowRight
                        className={`flex-shrink-0 transition-all ${index === selectedIndex ? "text-[#42aeec] opacity-100" : "text-gray-300 opacity-0"}`}
                        size={18}
                      />
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
                  <p className="text-xs text-gray-400 text-center">
                    {filteredActions.length} result{filteredActions.length !== 1 ? "s" : ""} · ↑↓ navigate · Enter select
                  </p>
                </div>
              </div>
            )}

            {searchQuery.trim() !== "" && filteredActions.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">No results for "{searchQuery}"</div>
            )}

            {searchQuery.trim() === "" && (
              <div className="p-8 text-center text-sm text-gray-500">Type to search Manifests, Trucks, Trailers, or Drivers</div>
            )}
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowLogoutModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <LogOut className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
                  <p className="text-sm text-gray-500 mt-1">Are you sure you want to logout?</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-amber-800">You'll need to sign in again to access your account.</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLogoutModal(false); logout(); }}
                className="px-6 py-2.5 !text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManifestHeader;
