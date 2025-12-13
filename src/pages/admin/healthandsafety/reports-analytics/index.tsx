import React, { useState, useEffect } from 'react';
import {
  FaChartBar,
  FaFilePdf,
  FaFileExcel,
  FaCalendarAlt,
  FaFilter,
  FaChartLine,
  FaChartPie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClipboardList,
  FaTimes,
  FaInfoCircle,
  FaTrash
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import {
  getAnalyticsStats,
  getIncidentTrends,
  getInspectionStatus,
  getReports,
  generateReport,
  deleteReport
} from '../../../../axios/api/healthSafety';

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface Report {
  _id: string;
  reportNumber: string;
  title: string;
  type: string;
  period: string;
  generatedDate: string;
  status: 'generated' | 'pending' | 'failed';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

const ToastNotificationComponent = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationTriangle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-blue-500" size={24} />,
    warning: <FaExclamationTriangle className="text-yellow-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10000] ${bgColors[notification.type]} min-w-[300px] max-w-[500px]`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

const ReportsAnalytics = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [notificationId, setNotificationId] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);

  const [stats, setStats] = useState({
    totalIncidents: 0,
    openIncidents: 0,
    totalInspections: 0,
    passedInspections: 0,
    totalTraining: 0,
    completedTraining: 0,
    activePolicies: 0,
    expiringCertificates: 0
  });

  const [incidentTrends, setIncidentTrends] = useState<any[]>([]);
  const [inspectionStatus, setInspectionStatus] = useState<any>({});

  const [generateFormData, setGenerateFormData] = useState({
    title: '',
    type: 'Monthly Summary',
    periodType: 'monthly',
    fileType: 'pdf'
  });

  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = notificationId + 1;
    setNotificationId(id);
    setNotifications([...notifications, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const fetchStats = async () => {
    try {
      const response = await getAnalyticsStats({ periodType: selectedPeriod });
      if (response?.success && response.data) {
        setStats({
          totalIncidents: response.data.totalIncidents || 0,
          openIncidents: response.data.openIncidents || 0,
          totalInspections: response.data.totalInspections || 0,
          passedInspections: response.data.passedInspections || 0,
          totalTraining: response.data.totalTraining || 0,
          completedTraining: response.data.completedTraining || 0,
          activePolicies: response.data.activePolicies || 0,
          expiringCertificates: response.data.expiringCertificates || 0
        });
      } else if (response && !response.success) {
        showNotification('error', response.message || 'Failed to fetch statistics');
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      showNotification('error', error?.response?.data?.message || error?.message || 'Failed to fetch statistics');
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await getIncidentTrends({ periodType: selectedPeriod });
      if (response?.success && Array.isArray(response.data)) {
        setIncidentTrends(response.data);
      } else if (response && !response.success) {
        console.error('Failed to fetch trends:', response.message);
      } else {
        setIncidentTrends([]);
      }
    } catch (error: any) {
      console.error('Error fetching trends:', error);
      setIncidentTrends([]);
    }
  };

  const fetchInspectionStatus = async () => {
    try {
      const response = await getInspectionStatus({ periodType: selectedPeriod });
      if (response?.success && response.data) {
        setInspectionStatus(response.data);
      } else if (response && !response.success) {
        console.error('Failed to fetch inspection status:', response.message);
        setInspectionStatus({});
      } else {
        setInspectionStatus({});
      }
    } catch (error: any) {
      console.error('Error fetching inspection status:', error);
      setInspectionStatus({});
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getReports();
      if (response?.success && Array.isArray(response.data)) {
        setReports(response.data.map((item: any) => ({
          _id: item._id,
          reportNumber: item.reportNumber || 'N/A',
          title: item.title || 'Untitled Report',
          type: item.type || 'Custom',
          period: item.period || 'N/A',
          generatedDate: item.generatedDate || item.createdAt || new Date().toISOString(),
          status: item.status || 'pending',
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          fileType: item.fileType
        })));
      } else if (response && !response.success) {
        showNotification('error', response.message || 'Failed to fetch reports');
        setReports([]);
      } else {
        setReports([]);
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      showNotification('error', error?.response?.data?.message || error?.message || 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTrends();
    fetchInspectionStatus();
    fetchReports();
  }, [selectedPeriod]);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerateLoading(true);
      const response = await generateReport({
        title: generateFormData.title || `${generateFormData.type} - ${new Date().toLocaleDateString()}`,
        type: generateFormData.type,
        periodType: generateFormData.periodType,
        fileType: generateFormData.fileType
      });

      if (response?.success) {
        showNotification('success', 'Report generated successfully');
        setShowGenerateModal(false);
        setGenerateFormData({
          title: '',
          type: 'Monthly Summary',
          periodType: 'monthly',
          fileType: 'pdf'
        });
        fetchReports();
      } else {
        showNotification('error', response?.message || 'Failed to generate report');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await deleteReport(id);
      if (response?.success) {
        showNotification('success', 'Report deleted successfully');
        fetchReports();
      } else {
        showNotification('error', response?.message || 'Failed to delete report');
      }
    } catch (error: any) {
      console.error('Error deleting report:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete report');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate chart percentages for inspection status
  const inspectionTotal = (inspectionStatus.scheduled || 0) +
    (inspectionStatus['in-progress'] || 0) +
    (inspectionStatus.completed || 0) +
    (inspectionStatus.overdue || 0);

  const inspectionPercentages = inspectionTotal > 0 ? {
    scheduled: ((inspectionStatus.scheduled || 0) / inspectionTotal * 100).toFixed(1),
    inProgress: ((inspectionStatus['in-progress'] || 0) / inspectionTotal * 100).toFixed(1),
    completed: ((inspectionStatus.completed || 0) / inspectionTotal * 100).toFixed(1),
    overdue: ((inspectionStatus.overdue || 0) / inspectionTotal * 100).toFixed(1)
  } : { scheduled: 0, inProgress: 0, completed: 0, overdue: 0 };

  return (
    <div className="min-h-screen bg-[#eeeeee] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-[10001] space-y-2">
          {notifications.map(notification => (
            <ToastNotificationComponent
              key={notification.id}
              notification={notification}
              onClose={removeNotification}
            />
          ))}
        </div>

        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
              Reports & Analytics
            </h1>
            <p className="text-gray-600">View and generate health & safety reports and analytics</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaChartBar /> Generate Report
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FaExclamationTriangle className="text-red-500 text-2xl" />
              <span className="text-2xl font-bold" style={{ color: FLEET_COLORS.dark }}>
                {stats.totalIncidents}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Total Incidents</p>
            <p className="text-xs text-gray-400 mt-1">{stats.openIncidents} Open</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FaClipboardList className="text-blue-500 text-2xl" />
              <span className="text-2xl font-bold" style={{ color: FLEET_COLORS.dark }}>
                {stats.totalInspections}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Total Inspections</p>
            <p className="text-xs text-gray-400 mt-1">{stats.passedInspections} Passed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FaCheckCircle className="text-green-500 text-2xl" />
              <span className="text-2xl font-bold" style={{ color: FLEET_COLORS.dark }}>
                {stats.totalTraining}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Training Programs</p>
            <p className="text-xs text-gray-400 mt-1">{stats.completedTraining} Completed</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FaFilePdf className="text-purple-500 text-2xl" />
              <span className="text-2xl font-bold" style={{ color: FLEET_COLORS.dark }}>
                {stats.activePolicies}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Active Policies</p>
            <p className="text-xs text-gray-400 mt-1">{stats.expiringCertificates} Expiring Soon</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex items-center gap-4">
            <FaFilter className="text-gray-400" />
            <span className="font-medium text-gray-700">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4" style={{ color: FLEET_COLORS.dark }}>
              Incident Trends
            </h3>
            <div className="h-64 flex items-center justify-center">
              {incidentTrends && incidentTrends.length > 0 ? (
                <div className="w-full space-y-2">
                  <div className="text-sm text-gray-600 mb-4">
                    Total incidents in period: {incidentTrends.reduce((sum: number, t: any) => sum + (t.count || 0), 0)}
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {incidentTrends.slice(0, 7).map((trend: any, idx: number) => {
                      const maxCount = Math.max(...incidentTrends.map((t: any) => t.count || 0), 1);
                      const percentage = maxCount > 0 ? Math.min(((trend.count || 0) / maxCount) * 100, 100) : 0;
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-20 truncate">{trend.date || 'N/A'}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div
                              className="bg-blue-500 h-6 rounded-full flex items-center justify-center text-white text-xs"
                              style={{ width: `${percentage}%` }}
                            >
                              {trend.count || 0}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <FaChartLine className="text-4xl mb-2 mx-auto" />
                  <p>No incident data available</p>
                  <p className="text-xs mt-1">Try selecting a different period</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4" style={{ color: FLEET_COLORS.dark }}>
              Inspection Status
            </h3>
            <div className="h-64 flex items-center justify-center">
              {inspectionTotal > 0 ? (
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: FLEET_COLORS.primary }}>
                        {inspectionStatus.scheduled || 0}
                      </div>
                      <div className="text-xs text-gray-600">Scheduled ({inspectionPercentages.scheduled}%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: FLEET_COLORS.warning }}>
                        {inspectionStatus['in-progress'] || 0}
                      </div>
                      <div className="text-xs text-gray-600">In Progress ({inspectionPercentages.inProgress}%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: FLEET_COLORS.success }}>
                        {inspectionStatus.completed || 0}
                      </div>
                      <div className="text-xs text-gray-600">Completed ({inspectionPercentages.completed}%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold" style={{ color: FLEET_COLORS.danger }}>
                        {inspectionStatus.overdue || 0}
                      </div>
                      <div className="text-xs text-gray-600">Overdue ({inspectionPercentages.overdue}%)</div>
                    </div>
                  </div>
                  <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${inspectionPercentages.scheduled}%` }}
                      title={`Scheduled: ${inspectionPercentages.scheduled}%`}
                    />
                    <div
                      className="bg-yellow-500"
                      style={{ width: `${inspectionPercentages.inProgress}%` }}
                      title={`In Progress: ${inspectionPercentages.inProgress}%`}
                    />
                    <div
                      className="bg-green-500"
                      style={{ width: `${inspectionPercentages.completed}%` }}
                      title={`Completed: ${inspectionPercentages.completed}%`}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${inspectionPercentages.overdue}%` }}
                      title={`Overdue: ${inspectionPercentages.overdue}%`}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <FaChartPie className="text-4xl mb-2 mx-auto" />
                  <p>No inspection data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold" style={{ color: FLEET_COLORS.dark }}>
              Generated Reports
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: FLEET_COLORS.gradient }}>
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Report #</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Period</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Generated Date</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{report.reportNumber}</td>
                      <td className="px-6 py-4">{report.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{report.period}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" />
                          {new Date(report.generatedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                          {report.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download PDF"
                            onClick={() => {
                              if (report.fileUrl) {
                                window.open(report.fileUrl, '_blank');
                              } else {
                                showNotification('info', 'Report file not available yet');
                              }
                            }}
                          >
                            <FaFilePdf />
                          </button>
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Download Excel"
                            onClick={() => {
                              if (report.fileUrl) {
                                window.open(report.fileUrl, '_blank');
                              } else {
                                showNotification('info', 'Report file not available yet');
                              }
                            }}
                          >
                            <FaFileExcel />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Report Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Generate Report</h2>
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>
              </div>
              <form onSubmit={handleGenerateReport} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={generateFormData.title}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, title: e.target.value })}
                    placeholder="Auto-generated if left empty"
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
                  <select
                    value={generateFormData.type}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, type: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  >
                    <option value="Monthly Summary">Monthly Summary</option>
                    <option value="Incident Analysis">Incident Analysis</option>
                    <option value="Inspection Summary">Inspection Summary</option>
                    <option value="Training Report">Training Report</option>
                    <option value="CAPA Report">CAPA Report</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Type *</label>
                  <select
                    value={generateFormData.periodType}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, periodType: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Type *</label>
                  <select
                    value={generateFormData.fileType}
                    onChange={(e) => setGenerateFormData({ ...generateFormData, fileType: e.target.value })}
                    required
                    className="w-full border border-gray-300 p-2 rounded-lg"
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                  </select>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generateLoading}
                    className="px-4 py-2 rounded-lg text-white disabled:opacity-50"
                    style={{ background: FLEET_COLORS.gradient }}
                  >
                    {generateLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsAnalytics;
