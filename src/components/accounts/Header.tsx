import { useState, useRef, useEffect, useCallback } from 'react'
import { FaUser, FaSignOutAlt, FaBars, FaChevronDown } from "react-icons/fa";
import { Search, X, LogOut, ArrowLeft, ArrowRight } from "lucide-react";
import { useLogout } from "../../hooks/useLogout";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import type { RootState } from "../../redux/store";
import { getUserRole } from "../../utils/auth";
import { useQuickActions } from "../common/QuickAction";

function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { logout } = useLogout();
  const { userInfo } = useSelector((state: RootState) => state.userAuth);
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isHR = userRole === 'hr';
  const isAccountant = userRole === 'accountant';
  const { filterActions } = useQuickActions();

  const filteredActions = filterActions(searchQuery, (isHR || isAccountant) ? (isAccountant ? 'accountant' : 'hr') : 'admin');
  const pageTitle = usePageTitle();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Escape closes, Ctrl+K opens search
  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSelectedIndex(0);
        setIsDropdownOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, []);

  useEffect(() => { setSelectedIndex(0); }, [searchQuery]);
  useEffect(() => {
    if (isSearchOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isSearchOpen]);

  const handleLogoutClick = useCallback(() => {
    setIsDropdownOpen(false);
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = useCallback(() => { setShowLogoutModal(false); logout(); }, [logout]);
  const cancelLogout = useCallback(() => { setShowLogoutModal(false); }, []);

  const getProfilePath = useCallback(() => {
    const basePath = (isHR || isAccountant) ? '/accounts' : '/admin/accounts';
    return `${basePath}/profile`;
  }, [isHR, isAccountant]);

  const handleProfileClick = useCallback(() => {
    setIsDropdownOpen(false);
    navigate(getProfilePath());
  }, [navigate, getProfilePath]);

  const handleActionSelect = useCallback((action: any) => {
    if (action.path) {
      navigate(action.path);
      setSearchQuery('');
      setIsSearchOpen(false);
      setSelectedIndex(0);
    }
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredActions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < filteredActions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : filteredActions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredActions.length > 0) handleActionSelect(filteredActions[selectedIndex]);
        break;
    }
  }, [filteredActions, selectedIndex, handleActionSelect]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (filteredActions.length > 0) handleActionSelect(filteredActions[selectedIndex]);
  }, [filteredActions, selectedIndex, handleActionSelect]);

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 shadow-sm relative z-20 bg-main">

        {/* LEFT: Sidebar toggle + navigation */}
        <div className="flex items-center gap-4">
          <button onClick={onToggleSidebar} className="header-btn" title="Toggle Sidebar">
            <FaBars size={20} />
          </button>
          <button onClick={() => navigate(-1)} className="header-btn" title="Previous">
            <ArrowLeft size={22} />
          </button>
          <button onClick={() => navigate(1)} className="header-btn" title="Next">
            <ArrowRight size={22} />
          </button>
        </div>

        {/* CENTER: Page Title */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-primary font-semibold text-lg tracking-wide">
            {pageTitle || 'Accounts & Finance'}
          </span>
        </div>

        {/* RIGHT: Search + Profile dropdown + Logout */}
        <div className="flex items-center gap-4">

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[rgba(255,255,255,0.08)] hover:border-[#42aeec]/40 text-secondary hover:text-primary transition-all"
            title="Search (Ctrl+K)"
          >
            <Search size={16} className="flex-shrink-0" />
            <span className="text-sm hidden sm:block">Search...</span>
            <kbd className="text-xs bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded text-secondary font-mono hidden sm:block">Ctrl K</kbd>
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[rgba(255,255,255,0.08)] hover:border-[#42aeec]/40 text-secondary hover:text-primary transition-all"
              title="Profile"
            >
              <div className="w-7 h-7 rounded-full bg-[#42aeec]/20 flex items-center justify-center text-[#42aeec]">
                <FaUser size={12} />
              </div>
              <span className="hidden sm:block text-sm font-medium text-primary">
                {userInfo?.userData?.name?.split(" ")[0] || "User"}
              </span>
              <FaChevronDown
                size={11}
                className={`text-secondary transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-card)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl overflow-hidden z-50">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                  <p className="text-sm font-semibold text-primary truncate">
                    {userInfo?.userData?.name || "User"}
                  </p>
                  <p className="text-xs text-secondary truncate mt-0.5">
                    {userInfo?.userData?.email || "user@example.com"}
                  </p>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-secondary hover:text-primary hover-accent transition-all"
                  >
                    <FaUser size={13} />
                    Profile
                  </button>
                  <div className="border-t border-[rgba(255,255,255,0.06)] my-1" />
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-[rgba(255,77,79,0.08)] transition-all"
                  >
                    <FaSignOutAlt size={13} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Logout shortcut */}
          <button onClick={handleLogoutClick} className="header-btn" title="Logout">
            <FaSignOutAlt size={18} />
          </button>
        </div>
      </header>

      {/* SEARCH OVERLAY */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/50 backdrop-blur-md">
          <div ref={searchRef} className="bg-card text-primary border border-theme rounded-xl shadow-2xl w-full max-w-2xl mx-4">
            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-theme">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="text-secondary" size={20} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Quick Action - Type to search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-12 py-3 text-lg border border-theme rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSelectedIndex(0); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[rgba(255,255,255,0.03)] rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </form>

            {searchQuery.trim() !== '' && filteredActions.length > 0 && (
              <div className="max-h-[400px] overflow-y-auto">
                <div className="py-2">
                  {filteredActions.map((action, index) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionSelect(action)}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-2 ${
                        index === selectedIndex
                          ? 'active-accent border-[var(--accent-blue)]'
                          : 'border-transparent hover-accent'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${index === selectedIndex ? 'scale-110' : ''}`}>
                        <div className={`p-2 rounded-lg ${
                          action.type === 'create'
                            ? 'bg-[rgba(0,255,163,0.1)] text-[var(--accent-green)]'
                            : action.type === 'navigation'
                            ? 'bg-[rgba(0,209,255,0.1)] text-[var(--accent-blue)]'
                            : 'bg-[rgba(255,255,255,0.05)] text-secondary'
                        }`}>
                          {action.icon}
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary truncate">{action.title}</span>
                          {action.type === 'create' && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[rgba(0,255,163,0.1)] text-[var(--accent-green)]">New</span>
                          )}
                          {action.type === 'navigation' && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[rgba(0,209,255,0.1)] text-[var(--accent-blue)]">Navigate</span>
                          )}
                        </div>
                        <p className="text-sm text-secondary mt-0.5 truncate">{action.description}</p>
                      </div>
                      <ArrowRight
                        className={`flex-shrink-0 transition-all ${
                          index === selectedIndex ? 'text-[var(--accent-blue)] opacity-100' : 'text-secondary opacity-0'
                        }`}
                        size={18}
                      />
                    </button>
                  ))}
                </div>
                <div className="border-t border-theme px-4 py-2 bg-card">
                  <p className="text-xs text-secondary text-center">
                    {filteredActions.length} result{filteredActions.length !== 1 ? 's' : ''} • Use ↑↓ to navigate
                  </p>
                </div>
              </div>
            )}

            {searchQuery.trim() !== '' && filteredActions.length === 0 && (
              <div className="p-8">
                <p className="text-sm text-secondary text-center">No actions found for "{searchQuery}"</p>
              </div>
            )}

            {searchQuery.trim() === '' && (
              <div className="p-8">
                <p className="text-sm text-secondary text-center">Type to search for actions, pages, or create new items</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10">
                <LogOut size={20} className="text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-primary">Confirm Logout</h3>
            </div>
            <p className="text-sm text-secondary mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm rounded-lg border border-[rgba(255,255,255,0.08)] text-secondary hover:text-primary hover:border-[rgba(255,255,255,0.2)] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;