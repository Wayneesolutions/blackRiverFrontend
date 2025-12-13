import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaFileInvoiceDollar,
  FaClipboardCheck,
  FaCarCrash,
  FaSync,
  FaChartLine,
} from "react-icons/fa";
import { getCvsaInspectionStats, getTicketStats, getIncidentStats } from "../../../axios/api/admin";
import { useNavigate } from "react-router-dom";
import { FLEET_COLORS } from "../fleetMaintenance/colorUtils";
import { ChevronRight } from "lucide-react";

interface CvsaStats {
  total: number;
  pass: number;
  fail: number;
  warning: number;
  outOfService: number;
}

interface TicketStats {
  total: number;
  paid: number;
  unpaid: number;
  fight: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  fightAmount: number;
}

interface IncidentStats {
  total: number;
  open: number;
  underReview: number;
  closed: number;
}

const hexToRgba = (hex: string, alpha = 1) => {
  const parsed = hex.replace("#", "");
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function Dashboard() {
  const navigate = useNavigate();
  const [cvsaStats, setCvsaStats] = useState<CvsaStats>({
    total: 0,
    pass: 0,
    fail: 0,
    warning: 0,
    outOfService: 0,
  });
  const [ticketStats, setTicketStats] = useState<TicketStats>({
    total: 0,
    paid: 0,
    unpaid: 0,
    fight: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    fightAmount: 0,
  });
  const [incidentStats, setIncidentStats] = useState<IncidentStats>({
    total: 0,
    open: 0,
    underReview: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const [cvsaRes, ticketRes, incidentRes] = await Promise.all([
        getCvsaInspectionStats(),
        getTicketStats(),
        getIncidentStats(),
      ]);

      if (cvsaRes?.success) {
        setCvsaStats(cvsaRes.data || { total: 0, pass: 0, fail: 0, warning: 0, outOfService: 0 });
      }

      if (ticketRes?.success) {
        setTicketStats(ticketRes.data || { total: 0, paid: 0, unpaid: 0, fight: 0, totalAmount: 0, paidAmount: 0, unpaidAmount: 0, fightAmount: 0 });
      }

      if (incidentRes?.success) {
        setIncidentStats(incidentRes.data || { total: 0, open: 0, underReview: 0, closed: 0 });
      }

      setLastUpdated(new Date().toISOString());
    } catch (error: any) {
      console.error("Error fetching compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    onClick,
    bgColor,
    iconColor
  }: {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ComponentType<any>;
    onClick?: () => void;
    bgColor: string;
    iconColor: string;
  }) => {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="flex items-start justify-between mb-2">
          {/* Left side content */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xl font-bold text-gray-900">{value}</span>
            </div>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>

          {/* Right side icon */}
          <div className={`${bgColor} rounded-lg p-2 shadow-sm`}>
            {/* The icons from react-icons/fa usually don't accept strokeWidth, so we adjust sizing if needed */}
            <Icon className={iconColor} size={21} />
          </div>
        </div>
      </div>
    );
  };

  const DetailSection = ({ title, icon: Icon, children, onClickHeader }: { title: string, icon: any, children: React.ReactNode, onClickHeader?: () => void }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div
        className={`px-6 py-4 border-b border-gray-200 flex justify-between items-center ${onClickHeader ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
        onClick={onClickHeader}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-blue-50`}>
            <Icon className="text-blue-600" size={18} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        {onClickHeader && <ChevronRight className="text-gray-400" size={20} />}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  // Reusing the smaller card style for inner grid items as well to match overall density
  const InnerGridCard = ({ label, value, colorClass, onClick, icon: Icon }: { label: string, value: string | number, colorClass: string, onClick?: () => void, icon: any }) => (
    <div
      onClick={onClick}
      className={`bg-white border rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow transition-all ${onClick ? 'cursor-pointer hover:border-blue-200' : 'border-gray-100'}`}
    >
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
      </div>
      <div className={`p-2 rounded-full ${colorClass.replace('text-', 'bg-').replace('600', '50').replace('500', '50')}`}>
        <Icon className={colorClass} size={16} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#EDF8FF' }}>
        <div className="text-center">
          {/* Using simple loading text matching dispatch style */}
          <div className="w-12 h-12 border-4 border-[#42aeec] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative max-w-7xl mx-auto">
        {/* Gradient band - Matching Dispatch */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`,
            height: '101px'
          }}
          aria-hidden="true"
        />

        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Compliance Overview</h1>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-xs">Compliance Dashboard</span>
                {lastUpdated && <span className="text-[10px] opacity-75">Updated: {new Date(lastUpdated).toLocaleTimeString()}</span>}
              </div>
            </div>
          </div>

          {/* Stats Cards - Matching Dispatch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 -mt-2 mb-4">
            <StatCard
              title="Total Inspections"
              value={cvsaStats.total}
              subtitle={`Pass: ${cvsaStats.pass} | Fail: ${cvsaStats.fail}`}
              icon={FaClipboardCheck}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
              onClick={() => navigate("/admin/compliance/cvsa-inspection")}
            />
            <StatCard
              title="Total Tickets"
              value={ticketStats.total}
              subtitle={`Paid: ${ticketStats.paid} | Unpaid: ${ticketStats.unpaid}`}
              icon={FaFileInvoiceDollar}
              bgColor="bg-purple-50"
              iconColor="text-purple-600"
              onClick={() => navigate("/admin/compliance/tickets")}
            />
            <StatCard
              title="Total Incidents"
              value={incidentStats.total}
              subtitle={`Open: ${incidentStats.open} | Closed: ${incidentStats.closed}`}
              icon={FaCarCrash}
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
              onClick={() => navigate("/admin/compliance/incidents")}
            />
          </div>

          {/* Feature Sections - Matching Table Container Style */}
          <div className="space-y-6">

            {/* CVSA Section */}
            <DetailSection
              title="CVSA Inspections Breakdown"
              icon={FaClipboardCheck}
              onClickHeader={() => navigate("/admin/compliance/cvsa-inspection")}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InnerGridCard
                  label="Pass"
                  value={cvsaStats.pass}
                  colorClass="text-green-600"
                  icon={FaCheckCircle}
                  onClick={() => navigate("/admin/compliance/cvsa-inspection?status=pass")}
                />
                <InnerGridCard
                  label="Fail"
                  value={cvsaStats.fail}
                  colorClass="text-red-600"
                  icon={FaTimesCircle}
                  onClick={() => navigate("/admin/compliance/cvsa-inspection?status=fail")}
                />
                <InnerGridCard
                  label="Warning"
                  value={cvsaStats.warning}
                  colorClass="text-yellow-600"
                  icon={FaExclamationTriangle}
                  onClick={() => navigate("/admin/compliance/cvsa-inspection?status=warning")}
                />
                <InnerGridCard
                  label="Out of Service"
                  value={cvsaStats.outOfService}
                  colorClass="text-red-800"
                  icon={FaShieldAlt}
                  onClick={() => navigate("/admin/compliance/cvsa-inspection?status=out-of-service")}
                />
              </div>
            </DetailSection>

            {/* Tickets Section */}
            <DetailSection
              title="Tickets Breakdown"
              icon={FaFileInvoiceDollar}
              onClickHeader={() => navigate("/admin/compliance/tickets")}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InnerGridCard
                  label="Paid"
                  value={ticketStats.paid}
                  colorClass="text-green-600"
                  icon={FaCheckCircle}
                  onClick={() => navigate("/admin/compliance/tickets?status=paid")}
                />
                <InnerGridCard
                  label="Unpaid"
                  value={ticketStats.unpaid}
                  colorClass="text-red-600"
                  icon={FaExclamationTriangle}
                  onClick={() => navigate("/admin/compliance/tickets?status=unpaid")}
                />
                <InnerGridCard
                  label="Fighting"
                  value={ticketStats.fight}
                  colorClass="text-orange-600"
                  icon={FaShieldAlt}
                  onClick={() => navigate("/admin/compliance/tickets?status=fight")}
                />
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Amount</p>
                    <p className="text-xl font-bold mt-1 text-gray-800">${ticketStats.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-gray-200 rounded-full">
                    <FaFileInvoiceDollar className="text-gray-600" size={16} />
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* Incidents Section */}
            <DetailSection
              title="Incidents Breakdown"
              icon={FaCarCrash}
              onClickHeader={() => navigate("/admin/compliance/incidents")}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InnerGridCard
                  label="Open Cases"
                  value={incidentStats.open}
                  colorClass="text-red-600"
                  icon={FaExclamationTriangle}
                  onClick={() => navigate("/admin/compliance/incidents?status=open")}
                />
                <InnerGridCard
                  label="Under Review"
                  value={incidentStats.underReview}
                  colorClass="text-yellow-600"
                  icon={FaClipboardCheck}
                  onClick={() => navigate("/admin/compliance/incidents?status=under-review")}
                />
                <InnerGridCard
                  label="Closed Cases"
                  value={incidentStats.closed}
                  colorClass="text-green-600"
                  icon={FaCheckCircle}
                  onClick={() => navigate("/admin/compliance/incidents?status=closed")}
                />
              </div>
            </DetailSection>

            {/* Monthly Report Quick Link */}
            <div
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => navigate("/admin/compliance/monthly-report")}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FaChartLine className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Monthly Compliance Report</h3>
                  <p className="text-sm text-gray-500">View detailed reports and analytics</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
