import React, { useState, useEffect } from 'react';
import { 
  FaUsersCog, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
  FaExclamationTriangle
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

interface CommitteeMember {
  _id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
}

interface CAPA {
  _id: string;
  capaNumber: string;
  title: string;
  type: 'corrective' | 'preventive';
  source: string;
  issueDate: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const CommitteeCAPA = () => {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [capas, setCapas] = useState<CAPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'committee' | 'capa'>('committee');

  useEffect(() => {
    // TODO: Fetch data from API
    setMembers([
      {
        _id: '1',
        name: 'John Doe',
        role: 'Chairperson',
        department: 'Operations',
        email: 'john.doe@company.com',
        phone: '+1-234-567-8900'
      },
      {
        _id: '2',
        name: 'Jane Smith',
        role: 'Member',
        department: 'HR',
        email: 'jane.smith@company.com',
        phone: '+1-234-567-8901'
      }
    ]);

    setCapas([
      {
        _id: '1',
        capaNumber: 'CAPA-2024-001',
        title: 'Improve Safety Training Program',
        type: 'corrective',
        source: 'Incident Report',
        issueDate: '2024-01-15',
        dueDate: '2024-03-15',
        status: 'in-progress',
        assignedTo: 'John Doe',
        priority: 'high'
      },
      {
        _id: '2',
        capaNumber: 'CAPA-2024-002',
        title: 'Update Emergency Procedures',
        type: 'preventive',
        source: 'Safety Audit',
        issueDate: '2024-02-01',
        dueDate: '2024-04-01',
        status: 'open',
        assignedTo: 'Jane Smith',
        priority: 'medium'
      }
    ]);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const filteredCapas = capas.filter(capa => {
    const matchesSearch = 
      capa.capaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capa.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      capa.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || capa.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#eeeeee] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
              H&S Committee & CAPA
            </h1>
            <p className="text-gray-600">Manage Health & Safety Committee and Corrective/Preventive Actions</p>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaPlus /> {activeTab === 'committee' ? 'Add Member' : 'New CAPA'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('committee')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'committee'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'committee' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaUsersCog className="inline mr-2" />
              H&S Committee
            </button>
            <button
              onClick={() => setActiveTab('capa')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'capa'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'capa' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaClipboardList className="inline mr-2" />
              CAPA Management
            </button>
          </div>
        </div>

        {/* Committee Tab */}
        {activeTab === 'committee' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <div key={member._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                        {member.role}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Department:</strong> {member.department}</p>
                      <p><strong>Email:</strong> {member.email}</p>
                      <p><strong>Phone:</strong> {member.phone}</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                        <FaEdit />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CAPA Tab */}
        {activeTab === 'capa' && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search CAPA..."
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
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CAPA Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: FLEET_COLORS.gradient }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">CAPA #</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Title</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Source</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Issue Date</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Due Date</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Assigned To</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Priority</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredCapas.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                          No CAPA items found
                        </td>
                      </tr>
                    ) : (
                      filteredCapas.map((capa) => (
                        <tr key={capa._id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{capa.capaNumber}</td>
                          <td className="px-6 py-4">{capa.title}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              capa.type === 'corrective' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {capa.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">{capa.source}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-gray-400" />
                              {new Date(capa.issueDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="text-gray-400" />
                              {new Date(capa.dueDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FaUser className="text-gray-400" />
                              {capa.assignedTo}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(capa.priority)}`}>
                              {capa.priority.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(capa.status)}`}>
                              {capa.status.replace('-', ' ').toUpperCase()}
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
          </>
        )}
      </div>
    </div>
  );
};

export default CommitteeCAPA;

