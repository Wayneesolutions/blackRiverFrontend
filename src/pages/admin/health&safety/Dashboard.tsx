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
  FaArrowRight,
  FaChevronRight,
} from '../../../theme/icons';
import { getUserRole } from '../../../utils/auth';

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

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, onClick, urgent }) => {
  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
      style={{
        background: `linear-gradient(135deg, ${hexToRgba(color, 0.1)} 0%, ${hexToRgba(color, 0.05)} 100%)`,
        border: `2px solid ${urgent ? color : hexToRgba(color, 0.2)}`,
      }}
    >
      {/* Urgent Badge */}
      {urgent && (
        <div className="absolute top-3 right-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold text-white animate-pulse"
            style={{ backgroundColor: color }}
          >
            URGENT
          </span>
        </div>
      )}

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-md"
        style={{ backgroundColor: hexToRgba(color, 0.15) }}
      >
        <div style={{ color }}>{icon}</div>
      </div>

      {/* Value */}
      <div className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
        {value}
      </div>

      {/* Title */}
      <div className="text-sm font-medium text-gray-600 mb-3">{title}</div>

      {/* Trend Indicator */}
      {trend && (
        <div className="flex items-center text-xs">
          <span
            className={`flex items-center font-semibold ${
              trend.direction === 'up' ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
          <span className="ml-2 text-gray-500">{trend.label}</span>
        </div>
      )}

      {/* Hover Arrow */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <FaArrowRight style={{ color }} />
      </div>

      {/* Background Pattern */}
      <div
        className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-5"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const basePath = userRole === 'safety officer' ? '/healthandsafety' : '/admin/healthandsafety';
  const [stats, setStats] = useState({
    overdueCAPA: 5,
    policyGaps: 18,
    expiredCertificates: 7,
    openIncidents: 3,
    totalIncidents: 12,
    openHazards: 9,
    overdueInspections: 3,
    activeRTWCases: 2,
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: '1',
      type: 'incident',
      title: 'Driver Injury Report Filed',
      description: 'John Doe - Warehouse A',
      time: '2 hours ago',
      status: 'investigating',
    },
    {
      id: '2',
      type: 'capa',
      title: 'CAPA Overdue',
      description: 'Forklift Brake Repair',
      time: '5 hours ago',
      status: 'overdue',
    },
    {
      id: '3',
      type: 'training',
      title: 'Training Expiring Soon',
      description: '5 employees - WHMIS',
      time: '1 day ago',
      status: 'expiring',
    },
  ]);

  const [upcomingTasks, setUpcomingTasks] = useState([
    { id: '1', title: 'Monthly H&S Committee Meeting', date: '2025-12-15', type: 'meeting' },
    { id: '2', title: 'Quarterly Shop Inspection', date: '2025-12-18', type: 'inspection' },
    { id: '3', title: 'Policy Renewal: Fire Safety', date: '2025-12-20', type: 'policy' },
  ]);

  useEffect(() => {
    // Fetch dashboard data
    // TODO: Replace with API call
  }, []);

  const handleNavigation = (path: string) => {
    navigate(`${basePath}/${path}`);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.background.secondary }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold" style={{ color: COLORS.text.primary }}>
              Health & Safety Dashboard
            </h1>
            <button
              className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center space-x-2"
              style={{ background: COLORS.gradients.primary }}
            >
              <FaBell size={18} />
              <span>View All Alerts</span>
              <span className="ml-2 bg-white/30 px-2 py-1 rounded-full text-xs">
                {stats.overdueCAPA + stats.expiredCertificates}
              </span>
            </button>
          </div>
          <p className="text-lg text-gray-600">
            Monitor federal compliance and manage safety operations across your organization.
          </p>
        </div>

        {/* Critical Metrics Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
            🚨 Critical Compliance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Overdue Corrective Actions (CAPA)"
              value={stats.overdueCAPA}
              icon={<FaTools size={28} />}
              color={COLORS.status.danger}
              urgent={stats.overdueCAPA > 0}
              trend={{ value: 25, direction: 'up', label: 'vs last month' }}
              onClick={() => navigate(`${basePath}/committee-capa?filter=overdue`)}
            />
            <StatCard
              title="Policy Acknowledgment Gaps"
              value={stats.policyGaps}
              icon={<FaFileContract size={28} />}
              color={COLORS.status.warning}
              urgent={stats.policyGaps > 15}
              onClick={() => navigate(`${basePath}/policies-documents?filter=missing-ack`)}
            />
            <StatCard
              title="Expired Training Certificates"
              value={stats.expiredCertificates}
              icon={<FaClipboardList size={28} />}
              color={COLORS.status.warning}
              urgent={stats.expiredCertificates > 5}
              onClick={() => navigate(`${basePath}/training-certificates?filter=expired`)}
            />
            <StatCard
              title="Open Incident Investigations"
              value={stats.openIncidents}
              icon={<FaExclamationTriangle size={28} />}
              color={COLORS.modules.incident}
              onClick={() => navigate(`${basePath}/incidents-accidents?filter=investigating`)}
            />
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
            📊 Operations Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Incidents (12 Months)"
              value={stats.totalIncidents}
              icon={<FaChartLine size={28} />}
              color={COLORS.modules.reports}
              trend={{ value: 15, direction: 'down', label: 'vs last year' }}
              onClick={() => navigate(`${basePath}/reports-analytics`)}
            />
            <StatCard
              title="Open Hazards & Risk Assessments"
              value={stats.openHazards}
              icon={<FaShieldAlt size={28} />}
              color={COLORS.modules.hazard}
              onClick={() => navigate(`${basePath}/inspections-hazards?filter=open`)}
            />
            <StatCard
              title="Overdue Safety Inspections"
              value={stats.overdueInspections}
              icon={<FaClipboardList size={28} />}
              color={COLORS.modules.inspection}
              onClick={() => navigate(`${basePath}/inspections-hazards?filter=overdue`)}
            />
            <StatCard
              title="Active Return-to-Work Cases"
              value={stats.activeRTWCases}
              icon={<FaUserInjured size={28} />}
              color={COLORS.modules.committee}
              onClick={() => navigate(`${basePath}/incidents-accidents?tab=injury-rtw`)}
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: COLORS.text.primary }}>
                  Recent Activity
                </h2>
                <button className="text-sm font-semibold hover:underline" style={{ color: COLORS.primary.main }}>
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const statusColor = getStatusColor(activity.status);
                  const icon =
                    activity.type === 'incident' ? (
                      <FaExclamationTriangle />
                    ) : activity.type === 'capa' ? (
                      <FaTools />
                    ) : (
                      <FaClipboardList />
                    );

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      style={{ border: `1px solid ${COLORS.border.light}` }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{activity.title}</div>
                        <div className="text-sm text-gray-600">{activity.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{activity.time}</div>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                        }}
                      >
                        {activity.status.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Upcoming Tasks - Takes 1 column */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
                <FaCalendarAlt className="inline mr-2" style={{ color: COLORS.primary.main }} />
                Upcoming Tasks
              </h2>
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ border: `1px solid ${COLORS.border.light}` }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{task.date}</div>
                    </div>
                    <FaChevronRight className="text-gray-400" size={14} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.text.primary }}>
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`${basePath}/incidents-accidents`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors text-left"
                  style={{ border: `2px solid ${COLORS.border.light}` }}
                >
                  <span className="flex items-center space-x-3">
                    <FaExclamationTriangle style={{ color: COLORS.modules.incident }} />
                    <span className="font-medium text-sm">Report Incident</span>
                  </span>
                  <FaChevronRight className="text-gray-400" size={14} />
                </button>

                <button
                  onClick={() => navigate(`${basePath}/inspections-hazards`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-amber-50 transition-colors text-left"
                  style={{ border: `2px solid ${COLORS.border.light}` }}
                >
                  <span className="flex items-center space-x-3">
                    <FaShieldAlt style={{ color: COLORS.modules.hazard }} />
                    <span className="font-medium text-sm">Report Hazard</span>
                  </span>
                  <FaChevronRight className="text-gray-400" size={14} />
                </button>

                <button
                  onClick={() => navigate(`${basePath}/committee-capa`)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-green-50 transition-colors text-left"
                  style={{ border: `2px solid ${COLORS.border.light}` }}
                >
                  <span className="flex items-center space-x-3">
                    <FaTools style={{ color: COLORS.modules.committee }} />
                    <span className="font-medium text-sm">Manage CAPA</span>
                  </span>
                  <FaChevronRight className="text-gray-400" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;