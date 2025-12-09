import React, { useState, useEffect } from 'react';
import { 
  FaShieldAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaClipboardCheck
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

interface Inspection {
  _id: string;
  inspectionNumber: string;
  date: string;
  type: string;
  inspector: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  findings: number;
  hazards: number;
  location: string;
}

const InspectionsHazards = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inspections' | 'hazards'>('inspections');

  useEffect(() => {
    // TODO: Fetch inspections from API
    setInspections([
      {
        _id: '1',
        inspectionNumber: 'INS-2024-001',
        date: '2024-01-15',
        type: 'Safety Inspection',
        inspector: 'John Doe',
        status: 'completed',
        findings: 3,
        hazards: 1,
        location: 'Warehouse A'
      },
      {
        _id: '2',
        inspectionNumber: 'INS-2024-002',
        date: '2024-01-25',
        type: 'Fire Safety Inspection',
        inspector: 'Jane Smith',
        status: 'scheduled',
        findings: 0,
        hazards: 0,
        location: 'Office Building'
      }
    ]);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      inspection.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || inspection.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#eeeeee] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
              Inspections & Hazards
            </h1>
            <p className="text-gray-600">Manage safety inspections and hazard identification</p>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaPlus /> New Inspection
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('inspections')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'inspections'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'inspections' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaClipboardCheck className="inline mr-2" />
              Inspections
            </button>
            <button
              onClick={() => setActiveTab('hazards')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'hazards'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'hazards' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaExclamationTriangle className="inline mr-2" />
              Hazards
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search inspections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        {activeTab === 'inspections' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: FLEET_COLORS.gradient }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Inspection #</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Inspector</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Location</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Findings</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Hazards</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        No inspections found
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.map((inspection) => (
                      <tr key={inspection._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{inspection.inspectionNumber}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(inspection.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">{inspection.type}</td>
                        <td className="px-6 py-4">{inspection.inspector}</td>
                        <td className="px-6 py-4">{inspection.location}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {inspection.findings}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            {inspection.hazards}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(inspection.status)}`}>
                            {inspection.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
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
        )}

        {/* Hazards Tab Content */}
        {activeTab === 'hazards' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <p className="text-gray-600 text-center py-8">
              Hazards management interface coming soon...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionsHazards;

