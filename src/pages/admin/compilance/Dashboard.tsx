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

type CardToneKey = "primary" | "dark" | "light" | "gradient";

type CardTone = {
  fill?: string;
  gradient?: string;
  text: string;
  border: string;
};

const CARD_TONES: Record<CardToneKey, CardTone> = {
  primary: {
    fill: hexToRgba(FLEET_COLORS.primary, 0.12),
    text: FLEET_COLORS.primary,
    border: hexToRgba(FLEET_COLORS.primary, 0.3)
  },
  dark: {
    fill: hexToRgba(FLEET_COLORS.dark, 0.12),
    text: FLEET_COLORS.dark,
    border: hexToRgba(FLEET_COLORS.dark, 0.3)
  },
  light: {
    fill: hexToRgba(FLEET_COLORS.light, 0.12),
    text: FLEET_COLORS.light,
    border: hexToRgba(FLEET_COLORS.light, 0.3)
  },
  gradient: {
    gradient: FLEET_COLORS.gradient,
    text: "#ffffff",
    border: "transparent"
  }
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
      console.log('📊 Fetching compliance dashboard data...');
      
      const [cvsaRes, ticketRes, incidentRes] = await Promise.all([
        getCvsaInspectionStats(),
        getTicketStats(),
        getIncidentStats(),
      ]);

      console.log('📥 API Responses:', { cvsaRes, ticketRes, incidentRes });

      if (cvsaRes?.success) {
        const cvsaData = cvsaRes.data || {
          total: 0,
          pass: 0,
          fail: 0,
          warning: 0,
          outOfService: 0,
        };
        console.log('✅ CVSA Stats:', cvsaData);
        setCvsaStats(cvsaData);
      } else {
        console.warn('⚠️ CVSA Stats API failed:', cvsaRes?.message);
      }

      if (ticketRes?.success) {
        const ticketData = ticketRes.data || {
          total: 0,
          paid: 0,
          unpaid: 0,
          fight: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          fightAmount: 0,
        };
        console.log('✅ Ticket Stats:', ticketData);
        setTicketStats(ticketData);
      } else {
        console.warn('⚠️ Ticket Stats API failed:', ticketRes?.message);
      }

      if (incidentRes?.success) {
        const incidentData = incidentRes.data || {
          total: 0,
          open: 0,
          underReview: 0,
          closed: 0,
        };
        console.log('✅ Incident Stats:', incidentData);
        setIncidentStats(incidentData);
      } else {
        console.warn('⚠️ Incident Stats API failed:', incidentRes?.message);
      }

      setLastUpdated(new Date().toISOString());
      console.log('✅ Compliance dashboard data loaded successfully');
    } catch (error: any) {
      console.error("❌ Error fetching compliance data:", error);
      // Set default values on error to prevent UI issues
      if (!cvsaStats.total && !ticketStats.total && !incidentStats.total) {
        // Only reset if we have no data at all
        setCvsaStats({
          total: 0,
          pass: 0,
          fail: 0,
          warning: 0,
          outOfService: 0,
        });
        setTicketStats({
          total: 0,
          paid: 0,
          unpaid: 0,
          fight: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          fightAmount: 0,
        });
        setIncidentStats({
          total: 0,
          open: 0,
          underReview: 0,
          closed: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const StatCard = ({
    icon,
    label,
    value,
    tone = "primary",
    onClick
  }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    tone?: keyof typeof CARD_TONES;
    onClick?: () => void;
  }) => {
    const toneMeta = CARD_TONES[tone];
    const badgeStyle: CSSProperties = toneMeta.gradient
      ? { backgroundImage: toneMeta.gradient, color: toneMeta.text }
      : { backgroundColor: toneMeta.fill, color: toneMeta.text };

    return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="p-3 rounded-lg border"
            style={{ ...badgeStyle, borderColor: toneMeta.border }}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const ComplianceSection = ({
    title,
    icon,
    stats,
    type,
    onHeaderClick,
  }: {
    title: string;
    icon: React.ReactNode;
    stats: CvsaStats | TicketStats | IncidentStats;
    type: "cvsa" | "tickets" | "incidents";
    onHeaderClick?: () => void;
  }) => {
    const getPassRate = () => {
      if (type === "cvsa") {
        const cvsa = stats as CvsaStats;
        return cvsa.total > 0 ? Math.round((cvsa.pass / cvsa.total) * 100) : 0;
      }
      if (type === "tickets") {
        const tickets = stats as TicketStats;
        return tickets.total > 0 ? Math.round((tickets.paid / tickets.total) * 100) : 0;
      }
      if (type === "incidents") {
        const incidents = stats as IncidentStats;
        return incidents.total > 0 ? Math.round((incidents.closed / incidents.total) * 100) : 0;
      }
      return 0;
    };

    const getColor = () => {
      const rate = getPassRate();
      if (rate >= 80) return "text-green-500";
      if (rate >= 60) return "text-yellow-500";
      return "text-red-500";
    };

    return (
      <div className="rounded-2xl shadow-lg p-6 border border-gray-100" style={{ background: "linear-gradient(135deg, #ffffff, rgba(1,106,178,0.04))" }}>
        <div 
          onClick={onHeaderClick}
          className={`flex items-center justify-between mb-6 ${onHeaderClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg border"
              style={{
                background: hexToRgba(FLEET_COLORS.primary, 0.08),
                borderColor: hexToRgba(FLEET_COLORS.primary, 0.2),
                color: FLEET_COLORS.primary
              }}
            >
              {icon}
            </div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-3xl font-bold ${getColor()}`}>{getPassRate()}%</div>
              <div className="text-xs text-gray-500">
                {type === "cvsa" ? "Pass Rate" : type === "tickets" ? "Paid Rate" : "Resolution Rate"}
              </div>
            </div>
            {onHeaderClick && (
              <span className="text-sm text-gray-500">View All →</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {type === "cvsa" && (
            <>
              <StatCard
                icon={<FaCheckCircle />}
                label="Pass"
                value={(stats as CvsaStats).pass}
                tone="primary"
                onClick={() => navigate("/admin/compliance/cvsa-inspection?status=pass")}
              />
              <StatCard
                icon={<FaTimesCircle />}
                label="Fail"
                value={(stats as CvsaStats).fail}
                tone="dark"
                onClick={() => navigate("/admin/compliance/cvsa-inspection?status=fail")}
              />
              <StatCard
                icon={<FaExclamationTriangle />}
                label="Warning"
                value={(stats as CvsaStats).warning}
                tone="light"
                onClick={() => navigate("/admin/compliance/cvsa-inspection?status=warning")}
              />
              <StatCard
                icon={<FaShieldAlt />}
                label="Out of Service"
                value={(stats as CvsaStats).outOfService}
                tone="gradient"
                onClick={() => navigate("/admin/compliance/cvsa-inspection?status=out-of-service")}
              />
            </>
          )}

          {type === "tickets" && (
            <>
              <StatCard
                icon={<FaCheckCircle />}
                label="Paid"
                value={(stats as TicketStats).paid}
                tone="primary"
                onClick={() => navigate("/admin/compliance/tickets?status=paid")}
              />
              <StatCard
                icon={<FaExclamationTriangle />}
                label="Unpaid"
                value={(stats as TicketStats).unpaid}
                tone="dark"
                onClick={() => navigate("/admin/compliance/tickets?status=unpaid")}
              />
              <StatCard
                icon={<FaShieldAlt />}
                label="Fighting"
                value={(stats as TicketStats).fight}
                tone="light"
                onClick={() => navigate("/admin/compliance/tickets?status=fight")}
              />
              <StatCard
                icon={<FaFileInvoiceDollar />}
                label="Total Amount"
                value={`$${((stats as TicketStats).totalAmount || 0).toLocaleString()}`}
                tone="gradient"
                onClick={() => navigate("/admin/compliance/tickets")}
              />
            </>
          )}

          {type === "incidents" && (
            <>
              <StatCard
                icon={<FaExclamationTriangle />}
                label="Open"
                value={(stats as IncidentStats).open}
                tone="dark"
                onClick={() => navigate("/admin/compliance/incidents?status=open")}
              />
              <StatCard
                icon={<FaClipboardCheck />}
                label="Under Review"
                value={(stats as IncidentStats).underReview}
                tone="light"
                onClick={() => navigate("/admin/compliance/incidents?status=under-review")}
              />
              <StatCard
                icon={<FaCheckCircle />}
                label="Closed"
                value={(stats as IncidentStats).closed}
                tone="primary"
                onClick={() => navigate("/admin/compliance/incidents?status=closed")}
              />
              <StatCard
                icon={<FaCarCrash />}
                label="Total"
                value={(stats as IncidentStats).total}
                tone="gradient"
                onClick={() => navigate("/admin/compliance/incidents")}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <div className="text-center">
          <p className="text-gray-700 font-medium text-lg">Loading compliance data...</p>
          <p className="text-gray-500 text-sm mt-1">Fetching statistics from all compliance modules</p>
        </div>
      </div>
    );
  }

  const totalComplianceItems =
    cvsaStats.total + ticketStats.total + incidentStats.total;

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Compliance Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Overview of CVSA Inspections, Tickets, and Incidents
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchComplianceData}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <FaSync className="text-blue-500" />
            <span className="text-sm text-gray-700">Refresh</span>
          </button>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
            <FaChartLine className="text-blue-500" />
            <div className="text-sm text-gray-500">
              Last updated:
              <span className="font-medium text-gray-700 ml-1">
                {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Just now"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<FaClipboardCheck />}
          label="Total CVSA Inspections"
          value={cvsaStats.total}
          tone="primary"
          onClick={() => navigate("/admin/compliance/cvsa-inspection")}
        />
        <StatCard
          icon={<FaFileInvoiceDollar />}
          label="Total Tickets"
          value={ticketStats.total}
          tone="light"
          onClick={() => navigate("/admin/compliance/tickets")}
        />
        <StatCard
          icon={<FaCarCrash />}
          label="Total Incidents"
          value={incidentStats.total}
          tone="dark"
          onClick={() => navigate("/admin/compliance/incidents")}
        />
      </div>

      {/* Compliance Sections */}
      <div className="space-y-6">
        <ComplianceSection
          title="CVSA Inspections"
          icon={<FaClipboardCheck />}
          stats={cvsaStats}
          type="cvsa"
          onHeaderClick={() => navigate("/admin/compliance/cvsa-inspection")}
        />
        <ComplianceSection
          title="Tickets"
          icon={<FaFileInvoiceDollar />}
          stats={ticketStats}
          type="tickets"
          onHeaderClick={() => navigate("/admin/compliance/tickets")}
        />
        <ComplianceSection
          title="Incidents"
          icon={<FaCarCrash />}
          stats={incidentStats}
          type="incidents"
          onHeaderClick={() => navigate("/admin/compliance/incidents")}
        />
      </div>

      {/* Monthly Report Section */}
      <div 
        onClick={() => navigate("/admin/compliance/monthly-report")}
        className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-lg border"
              style={{
                background: hexToRgba(FLEET_COLORS.primary, 0.08),
                borderColor: hexToRgba(FLEET_COLORS.primary, 0.2),
                color: FLEET_COLORS.primary
              }}
            >
              <FaChartLine />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Monthly Report</h2>
              <p className="text-sm text-gray-500 mt-1">View comprehensive monthly compliance reports</p>
            </div>
          </div>
          <span className="text-sm text-gray-500">View Report →</span>
        </div>
      </div>

    

      {/* Quick Actions */}
      {totalComplianceItems === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <FaShieldAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Compliance Data Yet</h2>
          <p className="text-gray-500 mb-6">
            Start tracking compliance by adding CVSA inspections, tickets, or incidents.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/admin/compliance/cvsa-inspection")}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add CVSA Inspection
            </button>
            <button
              onClick={() => navigate("/admin/compliance/tickets")}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Add Ticket
            </button>
            <button
              onClick={() => navigate("/admin/compliance/incidents")}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Add Incident
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
