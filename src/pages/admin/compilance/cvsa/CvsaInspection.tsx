import React, { useState, useEffect } from 'react';
import { 
  FaClipboardCheck, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaBan,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
  FaFlag,
  FaFlagUsa
} from 'react-icons/fa';

// Types
interface Inspection {
  _id: string;
  inspectionId: string;
  country: 'canada' | 'usa';
  date: string;
  location: string;
  status: 'pass' | 'fail' | 'warning' | 'out-of-service';
  vehicleId: string;
  vehicleInfo: string;
  driverId: string;
  driverName: string;
  inspectorName: string;
  violations?: Violation[];
  notes?: string;
  createdAt: string;
}

interface Violation {
  _id: string;
  code: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
}

interface InspectionStats {
  total: number;
  pass: number;
  fail: number;
  warning: number;
  outOfService: number;
}

// Mock data
const mockInspections: Inspection[] = [
  {
    _id: '1',
    inspectionId: 'CVSA-2024-001',
    country: 'canada',
    date: '2024-01-15',
    location: 'Windsor, ON - Ambassador Bridge',
    status: 'pass',
    vehicleId: 'V001',
    vehicleInfo: 'Freightliner Cascadia - ABC123',
    driverId: 'D001',
    driverName: 'John Smith',
    inspectorName: 'Inspector Johnson',
    violations: [],
    notes: 'All systems functioning properly',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    _id: '2',
    inspectionId: 'CVSA-2024-002',
    country: 'usa',
    date: '2024-01-18',
    location: 'Detroit, MI - Ambassador Bridge',
    status: 'warning',
    vehicleId: 'V002',
    vehicleInfo: 'Peterbilt 579 - XYZ789',
    driverId: 'D002',
    driverName: 'Sarah Johnson',
    inspectorName: 'Inspector Williams',
    violations: [
      {
        _id: 'v1',
        code: '393.75',
        description: 'Brake adjustment',
        severity: 'minor'
      }
    ],
    notes: 'Minor brake adjustment needed',
    createdAt: '2024-01-18T14:20:00Z'
  },
  {
    _id: '3',
    inspectionId: 'CVSA-2024-003',
    country: 'canada',
    date: '2024-01-22',
    location: 'Toronto, ON - Highway 401',
    status: 'fail',
    vehicleId: 'V003',
    vehicleInfo: 'Volvo VNL - DEF456',
    driverId: 'D003',
    driverName: 'Michael Brown',
    inspectorName: 'Inspector Davis',
    violations: [
      {
        _id: 'v2',
        code: '393.45',
        description: 'Brake system defect',
        severity: 'major'
      },
      {
        _id: 'v3',
        code: '393.75',
        description: 'Brake adjustment',
        severity: 'minor'
      }
    ],
    notes: 'Multiple brake system issues found',
    createdAt: '2024-01-22T09:15:00Z'
  },
  {
    _id: '4',
    inspectionId: 'CVSA-2024-004',
    country: 'usa',
    date: '2024-01-25',
    location: 'Buffalo, NY - Peace Bridge',
    status: 'out-of-service',
    vehicleId: 'V004',
    vehicleInfo: 'Kenworth T680 - GHI789',
    driverId: 'D004',
    driverName: 'Emily Davis',
    inspectorName: 'Inspector Miller',
    violations: [
      {
        _id: 'v4',
        code: '393.45',
        description: 'Critical brake system failure',
        severity: 'critical'
      }
    ],
    notes: 'Vehicle placed out of service due to critical brake failure',
    createdAt: '2024-01-25T16:45:00Z'
  }
];

const CvsaInspection: React.FC = () => {
  const [inspections] = useState<Inspection[]>(mockInspections);
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>(mockInspections);
  const [activeTab, setActiveTab] = useState<'canada' | 'usa'>('canada');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [stats, setStats] = useState<InspectionStats>({
    total: 0,
    pass: 0,
    fail: 0,
    warning: 0,
    outOfService: 0
  });

  // Calculate stats
  useEffect(() => {
    const calculateStats = () => {
      const countryInspections = inspections.filter(inspection => inspection.country === activeTab);
      const newStats: InspectionStats = {
        total: countryInspections.length,
        pass: countryInspections.filter(i => i.status === 'pass').length,
        fail: countryInspections.filter(i => i.status === 'fail').length,
        warning: countryInspections.filter(i => i.status === 'warning').length,
        outOfService: countryInspections.filter(i => i.status === 'out-of-service').length
      };
      setStats(newStats);
    };

    calculateStats();
  }, [inspections, activeTab]);

  // Filter inspections
  useEffect(() => {
    let filtered = inspections.filter(inspection => inspection.country === activeTab);

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inspection => inspection.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(inspection =>
        inspection.inspectionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.vehicleInfo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredInspections(filtered);
  }, [inspections, activeTab, statusFilter, searchQuery]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <FaCheckCircle className="text-green-600" size={20} />;
      case 'fail':
        return <FaTimesCircle className="text-red-600" size={20} />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-600" size={20} />;
      case 'out-of-service':
        return <FaBan className="text-red-800" size={20} />;
      default:
        return <FaClipboardCheck className="text-gray-600" size={20} />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-service':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'text-yellow-600';
      case 'major':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowViewModal(true);
  };

  const StatCard = ({ title, value, color, icon }: { title: string; value: number; color: string; icon: React.ReactNode }) => (
    <div className={`${color} p-4 rounded-xl border-2`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">CVSA Inspection Management</h1>
          <p className="text-gray-600 mt-1">Commercial Vehicle Safety Alliance inspections</p>
        </div>
      </div>

      {/* Country Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">Country Selection</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('canada')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'canada'
                  ? 'bg-white text-[#9793E4] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaFlag className="text-red-600" size={16} />
              Canada
            </button>
            <button
              onClick={() => setActiveTab('usa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === 'usa'
                  ? 'bg-white text-[#9793E4] shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaFlagUsa className="text-blue-600" size={16} />
              USA
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Total Inspections"
            value={stats.total}
            color="bg-blue-50 border-blue-200"
            icon={<FaClipboardCheck className="text-blue-600" size={24} />}
          />
          <StatCard
            title="Passed"
            value={stats.pass}
            color="bg-green-50 border-green-200"
            icon={<FaCheckCircle className="text-green-600" size={24} />}
          />
          <StatCard
            title="Failed"
            value={stats.fail}
            color="bg-red-50 border-red-200"
            icon={<FaTimesCircle className="text-red-600" size={24} />}
          />
          <StatCard
            title="Warning"
            value={stats.warning}
            color="bg-yellow-50 border-yellow-200"
            icon={<FaExclamationTriangle className="text-yellow-600" size={24} />}
          />
          <StatCard
            title="Out of Service"
            value={stats.outOfService}
            color="bg-red-100 border-red-300"
            icon={<FaBan className="text-red-800" size={24} />}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="warning">Warning</option>
              <option value="out-of-service">Out of Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">
            {activeTab.toUpperCase()} Inspections ({filteredInspections.length})
          </h3>
        </div>
        
        {filteredInspections.length === 0 ? (
          <div className="text-center py-16">
            <FaClipboardCheck size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-semibold text-gray-500">No inspections found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspection ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle & Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspections.map((inspection) => (
                  <tr key={inspection._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {inspection.inspectionId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" size={14} />
                          {formatDate(inspection.date)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <FaMapMarkerAlt className="text-gray-400" size={14} />
                          <span className="text-gray-600">{inspection.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{inspection.vehicleInfo}</div>
                        <div className="text-gray-600">{inspection.driverName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(inspection.status)}
                        <span className={`text-sm px-2 py-1 rounded-full font-medium border ${getStatusBadgeColor(inspection.status)}`}>
                          {inspection.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inspection.inspectorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewInspection(inspection)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          className="text-[#9793E4] hover:text-[#8783D4] p-2 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Inspection"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Inspection"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Inspection Modal */}
      {showViewModal && selectedInspection && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Inspection Details: {selectedInspection.inspectionId}
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimesCircle className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Inspection Overview */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Inspection Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Inspection ID</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedInspection.inspectionId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
                    <p className="text-lg font-semibold text-gray-800 uppercase">{selectedInspection.country}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                    <p className="text-lg font-semibold text-gray-800">{formatDate(selectedInspection.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedInspection.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedInspection.status)}
                      <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${getStatusBadgeColor(selectedInspection.status)}`}>
                        {selectedInspection.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Inspector</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedInspection.inspectorName}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle & Driver Info */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Vehicle & Driver Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedInspection.vehicleInfo}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Driver</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedInspection.driverName}</p>
                  </div>
                </div>
              </div>

              {/* Violations */}
              {selectedInspection.violations && selectedInspection.violations.length > 0 && (
                <div className="bg-red-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Violations Found</h4>
                  <div className="space-y-3">
                    {selectedInspection.violations.map((violation) => (
                      <div key={violation._id} className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {violation.code}
                              </span>
                              <span className={`text-sm font-semibold ${getSeverityColor(violation.severity)}`}>
                                {violation.severity.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-800">{violation.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedInspection.notes && (
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Inspector Notes</h4>
                  <p className="text-gray-800">{selectedInspection.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CvsaInspection;
