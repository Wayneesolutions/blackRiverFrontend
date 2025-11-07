import { useEffect, useState } from "react";
import { FaCar, FaUserTie, FaCheckCircle, FaExclamationCircle, FaHourglassHalf } from "react-icons/fa";
import { compilancsummary } from "../../../axios/api/admin";

function Dashboard() {
  const [complianceData, setComplianceData] = useState({
    vehicles: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
    drivers: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState(false);

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
      setEmptyStateMessage('No company assigned to the current admin.');
      setLoading(false);
      return;
    }

    const fetchCompliance = async () => {
      setLoading(true);
      const res = await compilancsummary();
      if (res?.success) {
        setComplianceData(res.data || {
          vehicles: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
          drivers: { total: 0, valid: 0, expired: 0, expiringSoon: 0, complianceRate: 0 },
        });
        if (res.message) {
          setEmptyStateMessage(res.data?.vehicles?.total ? null : res.message);
        } else {
          setEmptyStateMessage(null);
        }
      } else if (res?.message) {
        setEmptyStateMessage(res.message);
      }
      setLoading(false);
    };

    fetchCompliance();
  }, [userInfoReady, userInfo]);

  const StatCard = ({ icon, label, value, color }: any) => (
    <div className="flex items-center gap-3 bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition-all duration-300">
      <div className={`p-3 rounded-full text-white ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );

  const ComplianceCard = ({ title, icon, data, color }: any) => (
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
        <StatCard icon={<FaCheckCircle />} label="Valid" value={data.valid} color="bg-green-500" />
        <StatCard icon={<FaExclamationCircle />} label="Expired" value={data.expired} color="bg-red-500" />
        <StatCard icon={<FaHourglassHalf />} label="Expiring Soon" value={data.expiringSoon} color="bg-yellow-500" />
        <StatCard icon={<FaCar />} label="Total" value={data.total} color="bg-blue-500" />
      </div>
    </div>
  );

  if (loading) return <div className="text-center mt-20 text-gray-500">Loading...</div>;

  if (emptyStateMessage) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-5xl text-gray-300">⚖️</div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800">No compliance data available</h2>
          <p className="text-gray-500">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Compliance Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ComplianceCard title="Vehicle Compliance" icon={<FaCar />} data={complianceData.vehicles} color="bg-blue-500" />
        <ComplianceCard title="Driver Compliance" icon={<FaUserTie />} data={complianceData.drivers} color="bg-purple-500" />
      </div>
    </div>
  );
}

export default Dashboard;