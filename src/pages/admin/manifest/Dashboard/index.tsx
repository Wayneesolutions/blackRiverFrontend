import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck, Package, Users, AlertCircle, ArrowRight, RefreshCw,
} from "lucide-react";
import { getAllVehicles } from "../../../../axios/api/vehicle";
import { getAllTrailers } from "../../../../axios/api/trailer";
import { getAllDrivers } from "../../../../axios/api/driver";

interface Stats {
  totalTrucks: number;
  totalTrailers: number;
  totalDrivers: number;
}

const StatCard = ({
  icon, label, value, sub, color, bgColor, onClick, background
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  bgColor: string;
  background?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-[${background}]/20 rounded-xl p-5 shadow-sm border border-theme flex items-start gap-4 ${onClick ? "cursor-pointer hover:shadow-md hover:border-[var(--accent-blue)]/20 transition-all group" : ""}`}
  >
    <div className={`${bgColor} rounded-xl p-3 flex-shrink-0`}>
      <span className={color}>{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-secondary font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
      {sub && <p className="text-xs text-secondary mt-0.5">{sub}</p>}
    </div>
    {onClick && <ArrowRight size={16} className="text-gray-300 group-hover:text-[var(--accent-blue)] transition-colors mt-1 flex-shrink-0" />}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalTrucks: 0,
    totalTrailers: 0,
    totalDrivers: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, trRes, dRes] = await Promise.all([
        getAllVehicles(1, 500),
        getAllTrailers(1, 500),
        getAllDrivers(1, 500),
      ]);

      setStats({
        totalTrucks: tRes?.pagination?.total || tRes?.data?.length || 0,
        totalTrailers: trRes?.pagination?.total || trRes?.data?.length || 0,
        totalDrivers: dRes?.pagination?.total || dRes?.data?.length || 0,
      });
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-main">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent-blue)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-main">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-headings">Dashboard</h1>
          <p className="text-sm text-secondary mt-0.5">Manifest portal overview</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg shadow-sm border border-theme text-sm text-secondary hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-card border border-red-100 rounded-xl text-red-700 text-sm mb-5">
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<Truck size={22} />}
          label="Trucks"
          value={stats.totalTrucks}
          sub="In fleet"
          color="text-[var(--accent-teal)]"
          bgColor=""
          onClick={() => navigate("/admin/manifest/trucks")}
          background="var(--accent-teal)"
        />
        <StatCard
          icon={<Package size={22} />}
          label="Trailers"
          value={stats.totalTrailers}
          sub="In fleet"
          color="text-[var(--accent-blue)]"
          bgColor=""
          onClick={() => navigate("/admin/manifest/trailers")}
          background="var(--accent-blue)"
        />
        <StatCard
          icon={<Users size={22} />}
          label="Drivers"
          value={stats.totalDrivers}
          sub="Active staff"
          color="text-[var(--accent-purple)]"
          bgColor=""
          onClick={() => navigate("/admin/manifest/drivers")}
          background="var(--accent-purple)"
        />
      </div>


    </div>
  );
};

export default Dashboard;
