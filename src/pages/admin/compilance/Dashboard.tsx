import React from "react";
import { FaCar, FaUserTie, FaCheckCircle, FaExclamationCircle, FaHourglassHalf } from "react-icons/fa";

function Dashboard() {
  // Dummy data (replace with API integration later)
  const complianceData = {
    vehicles: {
      total: 100,
      valid: 80,
      expired: 10,
      expiringSoon: 10,
      complianceRate: 80,
    },
    drivers: {
      total: 50,
      valid: 40,
      expired: 5,
      expiringSoon: 5,
      complianceRate: 80,
    },
  };

  const StatCard = ({ icon, label, value, color }: any) => (
    <div className="flex items-center gap-3 bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition-all duration-300">
      <div className={`p-3 rounded-full text-white ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );

  const ComplianceCard = ({ title, icon, data, color }: any) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full text-white ${color}`}>{icon}</div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
        {/* Circle compliance rate */}
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<FaCheckCircle />}
          label="Valid"
          value={data.valid}
          color="bg-green-500"
        />
        <StatCard
          icon={<FaExclamationCircle />}
          label="Expired"
          value={data.expired}
          color="bg-red-500"
        />
        <StatCard
          icon={<FaHourglassHalf />}
          label="Expiring Soon"
          value={data.expiringSoon}
          color="bg-yellow-500"
        />
        <StatCard
          icon={<FaCar />}
          label="Total"
          value={data.total}
          color="bg-blue-500"
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Compliance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ComplianceCard
          title="Vehicle Compliance"
          icon={<FaCar />}
          data={complianceData.vehicles}
          color="bg-blue-500"
        />
        <ComplianceCard
          title="Driver Compliance"
          icon={<FaUserTie />}
          data={complianceData.drivers}
          color="bg-purple-500"
        />
      </div>
    </div>
  );
}

export default Dashboard;
