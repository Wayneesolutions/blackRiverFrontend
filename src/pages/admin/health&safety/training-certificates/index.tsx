import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList, 
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
  FaCertificate,
  FaClock
} from 'react-icons/fa';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

interface Training {
  _id: string;
  trainingNumber: string;
  title: string;
  type: string;
  date: string;
  expiryDate?: string;
  participants: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'expired';
  instructor: string;
}

interface Certificate {
  _id: string;
  certificateNumber: string;
  employee: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'expiring-soon';
}

const TrainingCertificates = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'training' | 'certificates'>('training');

  useEffect(() => {
    // TODO: Fetch data from API
    setTrainings([
      {
        _id: '1',
        trainingNumber: 'TRN-2024-001',
        title: 'Safety Training',
        type: 'General Safety',
        date: '2024-01-15',
        expiryDate: '2025-01-15',
        participants: 25,
        status: 'completed',
        instructor: 'John Doe'
      },
      {
        _id: '2',
        trainingNumber: 'TRN-2024-002',
        title: 'First Aid Training',
        type: 'Medical',
        date: '2024-02-01',
        participants: 15,
        status: 'scheduled',
        instructor: 'Jane Smith'
      }
    ]);

    setCertificates([
      {
        _id: '1',
        certificateNumber: 'CERT-2024-001',
        employee: 'John Doe',
        type: 'Safety Certification',
        issueDate: '2024-01-15',
        expiryDate: '2025-01-15',
        status: 'active'
      }
    ]);
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'expiring-soon': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTrainings = trainings.filter(training => {
    const matchesSearch = 
      training.trainingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || training.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#eeeeee] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
              Training & Certificates
            </h1>
            <p className="text-gray-600">Manage employee training programs and certifications</p>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaPlus /> {activeTab === 'training' ? 'New Training' : 'New Certificate'}
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('training')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'training'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'training' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaClipboardList className="inline mr-2" />
              Training Programs
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'certificates'
                  ? 'border-b-2 text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'certificates' ? { borderColor: FLEET_COLORS.primary } : {}}
            >
              <FaCertificate className="inline mr-2" />
              Certificates
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
                placeholder={`Search ${activeTab}...`}
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
                {activeTab === 'training' ? (
                  <>
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </>
                ) : (
                  <>
                    <option value="active">Active</option>
                    <option value="expiring-soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Training Table */}
        {activeTab === 'training' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: FLEET_COLORS.gradient }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Training #</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Title</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Participants</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Instructor</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredTrainings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No training programs found
                      </td>
                    </tr>
                  ) : (
                    filteredTrainings.map((training) => (
                      <tr key={training._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{training.trainingNumber}</td>
                        <td className="px-6 py-4">{training.title}</td>
                        <td className="px-6 py-4">{training.type}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(training.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            {training.participants}
                          </span>
                        </td>
                        <td className="px-6 py-4">{training.instructor}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(training.status)}`}>
                            {training.status.replace('-', ' ').toUpperCase()}
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

        {/* Certificates Table */}
        {activeTab === 'certificates' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: FLEET_COLORS.gradient }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-semibold">Certificate #</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Employee</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Issue Date</th>
                    <th className="px-6 py-4 text-left text-white font-semibold">Expiry Date</th>
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
                  ) : certificates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No certificates found
                      </td>
                    </tr>
                  ) : (
                    certificates.map((certificate) => (
                      <tr key={certificate._id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">{certificate.certificateNumber}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaUser className="text-gray-400" />
                            {certificate.employee}
                          </div>
                        </td>
                        <td className="px-6 py-4">{certificate.type}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400" />
                            {new Date(certificate.issueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FaClock className="text-gray-400" />
                            {new Date(certificate.expiryDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(certificate.status)}`}>
                            {certificate.status.replace('-', ' ').toUpperCase()}
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
      </div>
    </div>
  );
};

export default TrainingCertificates;

