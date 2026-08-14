import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useLogout';
import { getAccessiblePortals, getUserInfo, getUserRole } from '../utils/auth';
import { getCurrentUserProfile } from '../axios/api/auth';
import {
  Truck, MapPin, Users, Wrench, Settings, ShieldCheck, DollarSign, Heart, FileText, LogOut
} from 'lucide-react';

const ROLE_PORTAL_MAP: Record<string, string> = {
  dispatcher: 'dispatch_load',
  hr: 'human_resource',
  accountant: 'accounts',
  'Fleet Maintenance Manager': 'fleet_maintenance',
  'Compliance Manager': 'compliance',
  'safety officer': 'health_safety',
  'Maintenance Crew (Mechanics)': 'mechanic',
};

const PORTAL_CONFIG: Record<string, { label: string; route: string; icon: React.ReactNode; color: string }> = {
  dispatch_load: {
    label: 'Dispatch Load',
    route: '/dispatch',
    icon: <Truck size={36} />,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400',
  },
  gps: {
    label: 'GPS',
    route: '/gpsvehicle',
    icon: <MapPin size={36} />,
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400',
  },
  human_resource: {
    label: 'Human Resource',
    route: '/Management',
    icon: <Users size={36} />,
    color: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 hover:border-violet-400',
  },
  fleet_maintenance: {
    label: 'Fleet Maintenance',
    route: '/fleetmaintenance',
    icon: <Settings size={36} />,
    color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-400',
  },
  mechanic: {
    label: 'Mechanic',
    route: '/mechanics/dashboard',
    icon: <Wrench size={36} />,
    color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-400',
  },
  compliance: {
    label: 'Compliance',
    route: '/compliance',
    icon: <ShieldCheck size={36} />,
    color: 'from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-400',
  },
  accounts: {
    label: 'Accounts',
    route: '/accounts',
    icon: <DollarSign size={36} />,
    color: 'from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-400',
  },
  health_safety: {
    label: 'Health & Safety',
    route: '/healthandsafety',
    icon: <Heart size={36} />,
    color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 hover:border-pink-400',
  },
  manifest: {
    label: 'Manifest',
    route: '/manifest',
    icon: <FileText size={36} />,
    color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-400',
  },
};

export default function PortalSelectScreen() {
  const navigate = useNavigate();
  const { logout } = useLogout();
  const userInfo = getUserInfo();
  const userName = userInfo?.userData?.name || 'User';
  const [accessiblePortals, setAccessiblePortals] = useState<string[]>(() => getAccessiblePortals());

  useEffect(() => {
    getCurrentUserProfile().then((res) => {
      if (res?.success && res?.data) {
        const freshPortals: string[] = res.data.portals || [];

        try {
          const stored = localStorage.getItem('userInfo');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.userData) {
              parsed.userData.portals = freshPortals;
              localStorage.setItem('userInfo', JSON.stringify(parsed));
            }
          }
        } catch (_) {}

        const role = getUserRole();
        const all = new Set(freshPortals);
        if (role && ROLE_PORTAL_MAP[role]) all.add(ROLE_PORTAL_MAP[role]);
        setAccessiblePortals(Array.from(all));
      }
    }).catch(() => {});
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-main)', fontFamily: 'var(--font-poppins)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logistiq" className="h-9 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <span className="text-xl font-bold text-primary tracking-wide">Logistiq Innovation</span>
        </div>
        <button
          onClick={() => logout(false)}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {userName}</h1>
        <p className="text-secondary mb-10 text-base">Select a portal to continue</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-4xl">
          {accessiblePortals.map((portalKey) => {
            const config = PORTAL_CONFIG[portalKey];
            if (!config) return null;
            return (
              <button
                key={portalKey}
                onClick={() => navigate(config.route)}
                className={`group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border bg-gradient-to-br ${config.color} transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="text-primary opacity-80 group-hover:opacity-100 transition-opacity">
                  {config.icon}
                </div>
                <span className="text-lg font-semibold text-primary">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
