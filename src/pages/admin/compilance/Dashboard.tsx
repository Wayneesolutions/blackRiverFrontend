import { useEffect, useMemo, useState } from "react";
import {
  FaCar,
  FaUserTie,
  FaCheckCircle,
  FaExclamationCircle,
  FaHourglassHalf,
  FaClipboardList,
  FaShieldAlt,
  FaSync,
} from "react-icons/fa";
import { compilancsummary } from "../../../axios/api/admin";

interface ComplianceBreakdown {
  total: number;
  valid: number;
  expired: number;
  expiringSoon: number;
  complianceRate: number;
}

function Dashboard() {
  const [complianceData, setComplianceData] = useState<{
    vehicles: ComplianceBreakdown;
    drivers: ComplianceBreakdown;
  }>({
    vehicles: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
    drivers: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
    } finally {
      setUserInfoReady(true);
    }
  }, []);

  useEffect(() => {
    if (!userInfoReady) {
      return;
    }

    const isSuperadmin = userInfo?.role === 'superadmin';
    const hasCompany = Boolean(userInfo?.company);

    if (!isSuperadmin && !hasCompany) {
      setComplianceData({
        vehicles: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
        drivers: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
      });
      setEmptyStateMessage(null);
      setLoading(false);
      return;
    }

    const fetchCompliance = async () => {
      setLoading(true);
      try {
        const res = await compilancsummary();
        if (res?.success) {
          setComplianceData(
            res.data || {
              vehicles: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
              drivers: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
            }
          );
          setLastUpdated(new Date().toISOString());

          const hasRecords =
            (res.data?.vehicles?.total ?? 0) > 0 ||
            (res.data?.vehicles?.valid ?? 0) > 0 ||
            (res.data?.drivers?.total ?? 0) > 0 ||
            (res.data?.drivers?.valid ?? 0) > 0;

          setEmptyStateMessage(
            hasRecords ? null : res.message || "No compliance records found for your organisation yet."
          );
        } else if (res?.message) {
          setEmptyStateMessage(res.message);
        }
      } catch (error: any) {
        console.error("Error fetching compliance summary:", error);
        setEmptyStateMessage(error?.message || "Failed to fetch compliance summary.");
      }
      setLoading(false);
    };

    fetchCompliance();
  }, [userInfoReady, userInfo]);

  const hasAnyData = useMemo(() => {
    const { vehicles, drivers } = complianceData;
    return (
      (vehicles.total ?? 0) > 0 ||
      (vehicles.valid ?? 0) > 0 ||
      (vehicles.expired ?? 0) > 0 ||
      (vehicles.expiringSoon ?? 0) > 0 ||
      (drivers.total ?? 0) > 0 ||
      (drivers.valid ?? 0) > 0 ||
      (drivers.expired ?? 0) > 0 ||
      (drivers.expiringSoon ?? 0) > 0
    );
  }, [complianceData]);

  const StatCard = ({
    icon,
    label,
    value,
    color,
    tooltip,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    color: string;
    tooltip?: string;
  }) => (
    <div className="flex items-center gap-3 bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition-all duration-300">
      <div className={`p-3 rounded-full text-white ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 flex items-center gap-2">
          {label}
          {tooltip && (
            <span className="text-xs text-gray-400" title={tooltip}>
              &#9432;
            </span>
          )}
        </p>
        <p className="text-lg font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );

  const ComplianceCard = ({
    title,
    icon,
    data,
    color,
    entity,
  }: {
    title: string;
    icon: React.ReactNode;
    data: ComplianceBreakdown;
    color: string;
    entity: "vehicles" | "drivers";
  }) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full text-white ${color}`}>{icon}</div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - data.complianceRate / 100)}
              className={`${color.replace("bg-", "text-")}`}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-700">
            {data.complianceRate}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<FaCheckCircle />}
          label="Valid"
          value={data.valid}
          color="bg-green-500"
          tooltip={`Number of ${entity} currently compliant`}
        />
        <StatCard
          icon={<FaExclamationCircle />}
          label="Expired"
          value={data.expired}
          color="bg-red-500"
          tooltip={`Number of ${entity} with expired compliance`}
        />
        <StatCard
          icon={<FaHourglassHalf />}
          label="Expiring Soon"
          value={data.expiringSoon}
          color="bg-yellow-500"
          tooltip={`Number of ${entity} expiring within the configured threshold`}
        />
        <StatCard
          icon={<FaCar />}
          label="Total"
          value={data.total}
          color="bg-blue-500"
          tooltip={`Total ${entity}`}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <div className="space-y-2">
          <p className="text-gray-700 font-medium text-lg">Fetching compliance summary…</p>
          <p className="text-gray-500 text-sm">
            This might take a moment while we aggregate vehicle and driver records.
          </p>
        </div>
      </div>
    );
  }

  if (emptyStateMessage && !hasAnyData) {
    return (
      <div className="p-6 min-h-screen bg-gray-100 flex flex-col items-center justify-center text-center space-y-6">
        <div className="bg-white shadow-xl rounded-2xl px-6 py-8 max-w-xl">
          <div className="flex justify-center mb-4">
            <FaClipboardList className="text-4xl text-blue-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Compliance Data Yet</h2>
          <p className="text-gray-500 mb-4">{emptyStateMessage}</p>
          <div className="grid gap-3 text-left bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FaShieldAlt className="text-blue-500 mt-1" />
              <p className="text-sm text-blue-700">
                Add vehicles and drivers to your registry to start tracking compliance status automatically.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <FaHourglassHalf className="text-blue-500 mt-1" />
              <p className="text-sm text-blue-700">
                Once documents are uploaded with expiry dates, we’ll highlight expiring and expired items here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Compliance Summary</h1>
          <p className="text-gray-500">
            Track compliance health across your fleet and driver workforce at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
          <FaSync className="text-blue-500" />
          <div className="text-sm text-gray-500">
            Last updated:
            <span className="font-medium text-gray-700 ml-1">
              {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Just now"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ComplianceCard
          title="Vehicle Compliance"
          icon={<FaCar />}
          data={complianceData.vehicles}
          color="bg-blue-500"
          entity="vehicles"
        />
        <ComplianceCard
          title="Driver Compliance"
          icon={<FaUserTie />}
          data={complianceData.drivers}
          color="bg-purple-500"
          entity="drivers"
        />
      </div>
    </div>
  );
}

export default Dashboard;