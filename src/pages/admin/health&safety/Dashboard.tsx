import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaClipboardList,
  FaFileContract, // Policy/Acknowledgment Icon
  FaChartLine,
  FaUserInjured, // For Active RTW Cases
  FaTools, // For CAPA
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getUserRole } from '../../../utils/auth';
// Assuming FLEET_COLORS is defined in a utility file
// For this example, I'll define some placeholders if FLEET_COLORS is unavailable.
const FLEET_COLORS = {
  primary: "#1e40af", // Blue
  dark: "#1f2937", // Dark Gray
  success: "#10b981", // Green
  warning: "#f59e0b", // Amber
  danger: "#ef4444", // Red
};

// Helper function remains the same
const hexToRgba = (hex: string, alpha = 1) => {
  const parsed = hex.replace("#", "");
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

// StatCard component remains the same
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgColor, onClick }) => {
  const cardStyle: CSSProperties = {
    background: `linear-gradient(135deg, ${hexToRgba(bgColor, 0.1)} 0%, ${hexToRgba(bgColor, 0.05)} 100%)`,
    border: `1px solid ${hexToRgba(bgColor, 0.2)}`,
    cursor: onClick ? 'pointer' : 'default',
  };

  return (
    <div
      className="rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      style={cardStyle}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg" style={{ background: hexToRgba(bgColor, 0.2) }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-1" style={{ color: FLEET_COLORS.dark }}>
        {value}
      </h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const basePath = userRole === 'safety officer' ? '/healthandsafety' : '/admin/healthandsafety';
  // UPDATED: Focused on Federal Compliance and Risk Metrics
  const [stats, setStats] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    overdueCAPA: 0, // CRITICAL: From Req 7
    policyGaps: 0, // CRITICAL: From Req 4, 12
    expiredCertificates: 0, // CRITICAL: From Req 3
    openHazards: 0, // From Req 2
    overdueInspections: 0, // From Req 6
    activeRTWCases: 0, // From Req 9
  });

  useEffect(() => {
    // Placeholder data reflecting client's compliance requirements
    setStats({
      totalIncidents: 12,
      openIncidents: 3,
      overdueCAPA: 5, // High priority risk, should be red/amber
      policyGaps: 18, // High priority compliance risk
      expiredCertificates: 7, // High priority compliance risk
      openHazards: 9,
      overdueInspections: 3,
      activeRTWCases: 2, // Modified duty/injury management
    });
  }, []);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
            Health & Safety Compliance Summary 🚦
          </h1>
          <p className="text-gray-600">
            Monitor, manage, and verify federal compliance requirements across the organization.
          </p>
        </div>

        {/* COMPLIANCE & RISK GRID (Top Priority Metrics) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* CRITICAL METRIC 1: Overdue CAPA */}
          <StatCard
            title="Overdue Corrective Actions (CAPA)"
            value={stats.overdueCAPA}
            icon={<FaTools size={24} />}
            color={stats.overdueCAPA > 0 ? FLEET_COLORS.danger : FLEET_COLORS.success} // RED if > 0
            bgColor={stats.overdueCAPA > 0 ? FLEET_COLORS.danger : FLEET_COLORS.success}
            onClick={() => navigate(`${basePath}/committee-capa?filter=overdue`)}
          />
          {/* CRITICAL METRIC 2: Policy Acknowledgment Gaps */}
          <StatCard
            title="Policy Acknowledgment Gaps"
            value={stats.policyGaps}
            icon={<FaFileContract size={24} />}
            color={stats.policyGaps > 0 ? FLEET_COLORS.warning : FLEET_COLORS.primary} // AMBER if > 0
            bgColor={stats.policyGaps > 0 ? FLEET_COLORS.warning : FLEET_COLORS.primary}
            onClick={() => navigate(`${basePath}/policies-documents?filter=missing-ack`)}
          />
          {/* CRITICAL METRIC 3: Expired Certificates */}
          <StatCard
            title="Expired Training Certificates"
            value={stats.expiredCertificates}
            icon={<FaClipboardList size={24} />}
            color={stats.expiredCertificates > 0 ? FLEET_COLORS.warning : FLEET_COLORS.primary} // AMBER if > 0
            bgColor={stats.expiredCertificates > 0 ? FLEET_COLORS.warning : FLEET_COLORS.primary}
            onClick={() => navigate(`${basePath}/training-certificates?filter=expired`)}
          />
          {/* CRITICAL METRIC 4: Open Incidents */}
          <StatCard
            title="Open Incident Investigations"
            value={stats.openIncidents}
            icon={<FaExclamationTriangle size={24} />}
            color={FLEET_COLORS.primary}
            bgColor={FLEET_COLORS.primary}
            onClick={() => navigate(`${basePath}/incidents-accidents?filter=open`)}
          />
        </div>

        {/* PROACTIVE & ADMINISTRATIVE METRICS (Secondary Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Incidents (Last 12 Mo.)"
            value={stats.totalIncidents}
            icon={<FaChartLine size={24} />}
            color={FLEET_COLORS.dark}
            bgColor={FLEET_COLORS.dark}
            onClick={() => navigate(`${basePath}/reports-analytics`)}
          />
          <StatCard
            title="Open Hazards/Risk Assessments"
            value={stats.openHazards}
            icon={<FaShieldAlt size={24} />}
            color={FLEET_COLORS.warning}
            bgColor={FLEET_COLORS.warning}
            onClick={() => navigate(`${basePath}/inspections-hazards?filter=open`)}
          />
          <StatCard
            title="Overdue Inspections (Yard/Shop)"
            value={stats.overdueInspections}
            icon={<FaShieldAlt size={24} />}
            color={FLEET_COLORS.primary}
            bgColor={FLEET_COLORS.primary}
            onClick={() => navigate(`${basePath}/inspections-hazards?filter=overdue-inspections`)}
          />
          <StatCard
            title="Active Return-to-Work Cases"
            value={stats.activeRTWCases}
            icon={<FaUserInjured size={24} />}
            color={FLEET_COLORS.success}
            bgColor={FLEET_COLORS.success}
            onClick={() => navigate(`${basePath}/incidents-accidents?filter=rtw`)}
          />
        </div>

        {/* Visualizations/Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg lg:col-span-2">
            <h2 className="text-xl font-bold mb-4" style={{ color: FLEET_COLORS.dark }}>
              Incident Trend Analysis (12 Months)
            </h2>
            {/* Placeholder for Chart Component (e.g., using Chart.js or Recharts) */}
            <div className="h-64 flex items-center justify-center text-gray-400 border-dashed border-2 rounded-lg">
              [Line Chart Component: Incidents/Near-Misses per month]
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4" style={{ color: FLEET_COLORS.dark }}>
              Training Compliance Status
            </h2>
            {/* Placeholder for Chart Component */}
            <div className="h-64 flex items-center justify-center text-gray-400 border-dashed border-2 rounded-lg">
              [Doughnut Chart: Compliant, Nearing Expiry, Expired]
            </div>
          </div>
        </div>

        {/* Quick Actions remains the same */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4" style={{ color: FLEET_COLORS.dark }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate(`${basePath}/incidents-accidents/report-new`)}
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <FaExclamationTriangle className="text-red-600" size={20} />
              <span className="font-medium">Report New Incident/Near-Miss</span>
            </button>
            <button
              onClick={() => navigate(`${basePath}/inspections-hazards/report-hazard`)}
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <FaShieldAlt className="text-amber-600" size={20} />
              <span className="font-medium">Report New Hazard/Risk</span>
            </button>
            <button
              onClick={() => navigate(`${basePath}/committee-capa`)}
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <FaTools className="text-blue-600" size={20} />
              <span className="font-medium">Manage Corrective Actions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;