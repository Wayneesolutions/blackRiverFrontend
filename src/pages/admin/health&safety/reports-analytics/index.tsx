import React, { useState, useEffect } from 'react';
import { 
  FaChartBar, 
  FaDownload, 
  FaFilePdf,
  FaFileExcel,
  FaCalendarAlt,
  FaFilter,
  FaChartLine,
  FaChartPie,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClipboardList
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

interface Report {
  _id: string;
  reportNumber: string;
  title: string;
  type: string;
  period: string;
  generatedDate: string;
  status: 'generated' | 'pending' | 'failed';
  fileUrl?: string;
}

const ReportsAnalytics = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [stats, setStats] = useState({
    totalIncidents: 45,
    openIncidents: 8,
    totalInspections: 32,
    passedInspections: 28,
    totalTraining: 156,
    completedTraining: 142,
    activePolicies: 24,
    expiringCertificates: 5
  });

  useEffect(() => {
    // TODO: Fetch reports from API
    setReports([
      {
        _id: '1',
        reportNumber: 'RPT-2024-001',
        title: 'Monthly Safety Report',
        type: 'Monthly Summary',
        period: 'January 2024',
        generatedDate: '2024-02-01',
        status: 'generated'
      },
      {
        _id: '2',
        reportNumber: 'RPT-2024-002',
        title: 'Incident Analysis Report',
        type: 'Incident Analysis',
        period: 'Q1 2024',
        generatedDate: '2024-04-01',
        status: 'generated'
      }
    ]);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#eeeeee] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
              Reports & Analytics
            </h1>
            <p className="text-gray-600">View and generate health & safety reports and analytics</p>
          </div>
          <button
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
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FaChartLine className="text-4xl mb-2 mx-auto" />
                <p>Chart visualization coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4" style={{ color: FLEET_COLORS.dark }}>
              Inspection Status
            </h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FaChartPie className="text-4xl mb-2 mx-auto" />
                <p>Chart visualization coming soon</p>
              </div>
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
                          >
                            <FaFilePdf />
                          </button>
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Download Excel"
                          >
                            <FaFileExcel />
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
      </div>
    </div>
  );
};

export default ReportsAnalytics;

