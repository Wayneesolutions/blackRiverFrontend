import { useEffect, useState } from "react";
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
  FaTruck,
  FaCalendarCheck,
  FaTools,
  FaBalanceScale,
  FaWarehouse,
} from "react-icons/fa";
import { getCvsaInspectionStats, getTicketStats, getIncidentStats } from "../../../axios/api/admin";
import { useNavigate } from "react-router-dom";

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

const fleetComplianceModules = [
  {
    key: "fleet",
    title: "Fleet",
    description: "Active units, inspection readiness, VIN matchups.",
    metric: "18 units monitored",
    icon: <FaTruck className="text-blue-600" />,
    accent: "bg-blue-50",
    route: "/fleetmaintenance/fleet-units",
  },
  {
    key: "scheduled-services",
    title: "Scheduled Services Log",
    description: "Upcoming PM visits and overdue tasks.",
    metric: "7 services this week",
    icon: <FaCalendarCheck className="text-indigo-600" />,
    accent: "bg-indigo-50",
    route: "/fleetmaintenance/scheduled-services-log",
  },
  {
    key: "general-repairs",
    title: "General Repairs Log",
    description: "Chronic issues and component replacements.",
    metric: "4 repairs in review",
    icon: <FaTools className="text-amber-600" />,
    accent: "bg-amber-50",
    route: "/fleetmaintenance/general-repairs-log",
  },
  {
    key: "regulatory-safety",
    title: "Regulatory & Safety",
    description: "Policy attestations, compliance tasks, safety scorecards.",
    metric: "Compliance score 92%",
    icon: <FaBalanceScale className="text-emerald-600" />,
    accent: "bg-emerald-50",
    route: "/fleetmaintenance/regulatory-safety",
  },
  {
    key: "spare-parts",
    title: "Fleet Spare Parts",
    description: "Critical inventory, warranty tracking, reorder alerts.",
    metric: "32 critical SKUs",
    icon: <FaWarehouse className="text-purple-600" />,
    accent: "bg-purple-50",
    route: "/fleetmaintenance/spare-parts",
  },
];

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
    color,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const ComplianceSection = ({
    title,
    icon,
    stats,
    type,
  }: {
    title: string;
    icon: React.ReactNode;
    stats: CvsaStats | TicketStats | IncidentStats;
    type: "cvsa" | "tickets" | "incidents";
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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">{icon}</div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getColor()}`}>{getPassRate()}%</div>
            <div className="text-xs text-gray-500">
              {type === "cvsa" ? "Pass Rate" : type === "tickets" ? "Paid Rate" : "Resolution Rate"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {type === "cvsa" && (
            <>
              <StatCard
                icon={<FaCheckCircle />}
                label="Pass"
                value={(stats as CvsaStats).pass}
                color="bg-green-100 text-green-600"
                onClick={() => navigate("/admin/compliance/cvsa-inspection?status=pass")}
              />
              <StatCard
                icon={<FaTimesCircle />}
                label="Fail"
                value={(stats as CvsaStats).fail}
                color="bg-red-100 text-red-600"
                onClick={() => navigate("/admin/compliance/cvsa-inspection?status=fail")}
              />
              <StatCard
                icon={<FaExclamationTriangle />}
                label="Warning"
                value={(stats as CvsaStats).warning}
                color="bg-yellow-100 text-yellow-600"
                onClick={() => navigate("/admin/compliance/cvsa-inspection?status=warning")}
              />
              <StatCard
                icon={<FaShieldAlt />}
                label="Out of Service"
                value={(stats as CvsaStats).outOfService}
                color="bg-orange-100 text-orange-600"
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
                color="bg-green-100 text-green-600"
                onClick={() => navigate("/admin/compliance/tickets?status=paid")}
              />
              <StatCard
                icon={<FaExclamationTriangle />}
                label="Unpaid"
                value={(stats as TicketStats).unpaid}
                color="bg-red-100 text-red-600"
                onClick={() => navigate("/admin/compliance/tickets?status=unpaid")}
              />
              <StatCard
                icon={<FaShieldAlt />}
                label="Fighting"
                value={(stats as TicketStats).fight}
                color="bg-blue-100 text-blue-600"
                onClick={() => navigate("/admin/compliance/tickets?status=fight")}
              />
              <StatCard
                icon={<FaFileInvoiceDollar />}
                label="Total Amount"
                value={`$${((stats as TicketStats).totalAmount || 0).toLocaleString()}`}
                color="bg-purple-100 text-purple-600"
              />
            </>
          )}

          {type === "incidents" && (
            <>
              <StatCard
                icon={<FaExclamationTriangle />}
                label="Open"
                value={(stats as IncidentStats).open}
                color="bg-red-100 text-red-600"
                onClick={() => navigate("/admin/compliance/incidents?status=open")}
              />
              <StatCard
                icon={<FaClipboardCheck />}
                label="Under Review"
                value={(stats as IncidentStats).underReview}
                color="bg-yellow-100 text-yellow-600"
                onClick={() => navigate("/admin/compliance/incidents?status=under-review")}
              />
              <StatCard
                icon={<FaCheckCircle />}
                label="Closed"
                value={(stats as IncidentStats).closed}
                color="bg-green-100 text-green-600"
                onClick={() => navigate("/admin/compliance/incidents?status=closed")}
              />
              <StatCard
                icon={<FaCarCrash />}
                label="Total"
                value={(stats as IncidentStats).total}
                color="bg-gray-100 text-gray-600"
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
          color="bg-blue-100 text-blue-600"
          onClick={() => navigate("/admin/compliance/cvsa-inspection")}
        />
        <StatCard
          icon={<FaFileInvoiceDollar />}
          label="Total Tickets"
          value={ticketStats.total}
          color="bg-purple-100 text-purple-600"
          onClick={() => navigate("/admin/compliance/tickets")}
        />
        <StatCard
          icon={<FaCarCrash />}
          label="Total Incidents"
          value={incidentStats.total}
          color="bg-red-100 text-red-600"
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
        />
        <ComplianceSection
          title="Tickets"
          icon={<FaFileInvoiceDollar />}
          stats={ticketStats}
          type="tickets"
        />
        <ComplianceSection
          title="Incidents"
          icon={<FaCarCrash />}
          stats={incidentStats}
          type="incidents"
        />
      </div>

      {/* Fleet compliance modules */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Fleet Compliance Modules</h2>
            <p className="text-gray-500">
              Quick shortcuts to the maintenance logs most often referenced by Compliance.
            </p>
          </div>
          <p className="text-sm text-gray-400">
            Static preview based on fleet maintenance system snapshots.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fleetComplianceModules.map((module) => (
            <button
              key={module.key}
              type="button"
              onClick={() => navigate(module.route)}
              className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${module.accent}`}>
                {module.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                <p className="text-sm text-gray-500">{module.description}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{module.metric}</span>
                <span className="text-blue-600 font-semibold group-hover:underline">
                  View module
                </span>
              </div>
            </button>
          ))}
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
