import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, hexToRgba, getStatusColor } from '../../../theme/colors';
import {
  FaShieldAlt,
  FaExclamationTriangle,
  FaClipboardList,
  FaFileContract,
  FaChartLine,
  FaUserInjured,
  FaTools,
  FaCalendarAlt,
  FaBell,
  FaChevronRight,
} from '../../../theme/icons';
import { getUserRole } from '../../../utils/auth';
import {
  getDashboardStats,
  getRecentActivity,
  getUpcomingTasks,
} from '../../../axios/api/healthSafety';

/* ===========================
   STAT CARD (HR DASHBOARD STYLE)
=========================== */
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label: string;
  };
  onClick?: () => void;
  urgent?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  onClick,
  urgent,
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200
                 hover:shadow-md hover:border-[#42aeec]/20
                 transition-all cursor-pointer
                 hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            {title}
          </h3>

          <span className="text-xl font-bold text-gray-900">
            {value}
          </span>

          {trend && (
            <p
              className={`text-xs mt-0.5 ${trend.direction === 'up'
                ? 'text-red-600'
                : 'text-green-600'
                }`}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}% {trend.label}
            </p>
          )}
        </div>

        <div
          className="rounded-lg p-2"
          style={{ backgroundColor: hexToRgba(color, 0.15) }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>

      {urgent && (
        <span className="text-xs font-semibold text-red-600">
          Requires attention
        </span>
      )}
    </div>
  );
};

/* ===========================
   MAIN DASHBOARD
=========================== */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const role = getUserRole();
  const basePath =
    role === 'safety officer'
      ? '/healthandsafety'
      : '/admin/healthandsafety';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    overdueCAPA: 0,
    policyGaps: 0,
    expiredCertificates: 0,
    openIncidents: 0,
    totalIncidents: 0,
    openHazards: 0,
    overdueInspections: 0,
    activeRTWCases: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, activityRes, tasksRes] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(10),
        getUpcomingTasks(),
      ]);

      if (statsRes?.success) setStats(statsRes.data || {});
      if (activityRes?.success) setRecentActivity(activityRes.data || []);
      if (tasksRes?.success) setUpcomingTasks(tasksRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDF8FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF8FF]">
      <div className="relative max-w-7xl mx-auto">
        {/* Gradient Header */}
        <div
          className="absolute inset-x-0 top-0 h-[101px]"
          style={{
            background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`,
            height: '101px'
          }}
        />

        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">
              Health & Safety Dashboard
            </h1>


          </div>

          {/* Critical Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard
              title="Overdue CAPA"
              value={stats.overdueCAPA}
              icon={<FaTools size={21} />}
              color={COLORS.status.danger}
              urgent={stats.overdueCAPA > 0}
              onClick={() =>
                navigate(`${basePath}/committee-capa?filter=overdue`)
              }
            />
            <StatCard
              title="Policy Gaps"
              value={stats.policyGaps}
              icon={<FaFileContract size={21} />}
              color={COLORS.status.warning}
            />
            <StatCard
              title="Expired Certificates"
              value={stats.expiredCertificates}
              icon={<FaClipboardList size={21} />}
              color={COLORS.status.warning}
            />
            <StatCard
              title="Open Incidents"
              value={stats.openIncidents}
              icon={<FaExclamationTriangle size={21} />}
              color={COLORS.modules.incident}
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              title="Total Incidents"
              value={stats.totalIncidents}
              icon={<FaChartLine size={21} />}
              color={COLORS.modules.reports}
            />
            <StatCard
              title="Open Hazards"
              value={stats.openHazards}
              icon={<FaShieldAlt size={21} />}
              color={COLORS.modules.hazard}
            />
            <StatCard
              title="Overdue Inspections"
              value={stats.overdueInspections}
              icon={<FaClipboardList size={21} />}
              color={COLORS.modules.inspection}
            />
            <StatCard
              title="RTW Cases"
              value={stats.activeRTWCases}
              icon={<FaUserInjured size={21} />}
              color={COLORS.modules.committee}
            />
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">
                Recent Activity
              </h2>

              <div className="space-y-2">
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  recentActivity.map((a) => {
                    const status = getStatusColor(a.status);
                    return (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
                      >
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: status.bg,
                            color: status.text,
                          }}
                        >
                          <FaExclamationTriangle size={14} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {a.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {a.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h2 className="text-sm font-bold text-gray-900 mb-3">
                Upcoming Tasks
              </h2>

              <div className="space-y-2">
                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No upcoming tasks
                  </p>
                ) : (
                  upcomingTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {t.title}
                        </p>
                        <p className="text-xs text-gray-500">{t.date}</p>
                      </div>
                      <FaChevronRight size={14} className="text-gray-400" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
