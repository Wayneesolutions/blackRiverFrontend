import React, { useState, useEffect } from 'react';
import { 
  FaFileArchive, // Changed main icon to represent document storage
  FaDownload, 
  FaFilePdf,
  FaSearch,
  FaFilter,
  FaExclamationTriangle,
  FaShieldAlt, // For Compliance
  FaClock, // For 24-month retention
  FaClipboardList,
  FaBookOpen, // For Policies
  FaTools, // For Toolbox Talks
  FaUserCheck, // For Training
  FaFileMedical // For First Aid
} from 'react-icons/fa';


// Placeholder for FLEET_COLORS
const FLEET_COLORS = {
    primary: "#4c51bf", 
    dark: "#1f2937", 
    focusRing: "rgba(76, 81, 191, 0.5)",
    gradient: "linear-gradient(90deg, #4c51bf 0%, #6b46c1 100%)",
    danger: "#ef4444", 
    success: "#10b939", 
    warning: "#f59e0b"
};

// Interface for Compliance Documents (Req 10)
interface ComplianceDocument {
  _id: string;
  docId: string;
  title: string;
  type: 'Safety Meeting' | 'Toolbox Talk' | 'Safety Bulletin' | 'Investigation' | 'Policy' | 'Inspection' | 'Training Record' | 'First Aid Record';
  date: string; // Document creation/effective date
  requiredRetention: '24 months' | 'Permanent' | 'Other'; // Highlight federal expectation
  status: 'Active' | 'Archived' | 'Expired';
  fileUrl: string;
}

const ComplianceDocumentation = () => {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch compliance documents from API
    setDocuments([
      {
        _id: '1',
        docId: 'POL-001',
        title: 'Fall Protection Policy V2.0',
        type: 'Policy',
        date: '2025-01-15',
        requiredRetention: 'Permanent',
        status: 'Active',
        fileUrl: '/files/policy-001.pdf',
      },
      {
        _id: '2',
        docId: 'SM-2025-11-01',
        title: 'H&S Committee Meeting Minutes (Nov)',
        type: 'Safety Meeting',
        date: '2025-11-01',
        requiredRetention: '24 months',
        status: 'Active',
        fileUrl: '/files/meeting-nov.pdf',
      },
      {
        _id: '3',
        docId: 'INV-2025-012',
        title: 'Forklift Accident Investigation Report',
        type: 'Investigation',
        date: '2025-10-20',
        requiredRetention: 'Permanent',
        status: 'Active',
        fileUrl: '/files/inv-forklift.pdf',
      },
      {
        _id: '4',
        docId: 'TR-2023-08-01',
        title: 'WHMIS Training Session Roster',
        type: 'Training Record',
        date: '2023-08-01', // Document is 28 months old (over 24 months)
        requiredRetention: '24 months',
        status: 'Archived', 
        fileUrl: '/files/whmis-2023.pdf',
      }
    ]);
    setLoading(false);
  }, []);

  const getStatusColor = (status: ComplianceDocument['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Archived': return 'bg-gray-100 text-gray-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconForType = (type: ComplianceDocument['type']) => {
    switch (type) {
      case 'Policy': return <FaBookOpen className="text-purple-600" />;
      case 'Safety Meeting': return <FaClipboardList className="text-blue-600" />;
      case 'Toolbox Talk': return <FaTools className="text-yellow-600" />;
      case 'Investigation': return <FaFileArchive className="text-red-600" />;
      case 'Training Record': return <FaUserCheck className="text-green-600" />;
      case 'First Aid Record': return <FaFileMedical className="text-red-600" />;
      case 'Inspection': return <FaClipboardList className="text-blue-600" />;
      case 'Safety Bulletin': return <FaShieldAlt className="text-green-600" />;
      default: return <FaFilePdf className="text-gray-600" />;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.docId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
    
  // Compliance Check Logic for the Dashboard
  const complianceStats = {
      totalDocs: documents.length,
      docsInRetention: documents.filter(doc => doc.requiredRetention === '24 months').length,
      // Simple check: check if any 24-month documents are near or past 24 months old.
      // In a real app, this would be an API check on actual retention.
      docsExpiring: documents.filter(doc => 
        doc.requiredRetention === '24 months' && 
        ((new Date().getTime() - new Date(doc.date).getTime()) / (1000 * 60 * 60 * 24)) > (24 * 30 - 90) // Within 3 months of 24 months
      ).length
  };

  return (
    <div className="min-h-screen bg-[#eeeeee] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: FLEET_COLORS.dark }}>
              Compliance Recordkeeping (Req 10) 📜
            </h1>
            <p className="text-gray-600">Secure storage and retrieval of safety documents for audit compliance.</p>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-white shadow-md hover:opacity-90 transition flex items-center gap-2 font-semibold"
            style={{
              background: FLEET_COLORS.gradient,
              boxShadow: `0 4px 6px ${FLEET_COLORS.focusRing}`
            }}
          >
            <FaFileArchive /> Upload New Document
          </button>
        </div>

        {/* Compliance Dashboard (Addressing 24-month requirement) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <FaFilePdf className="text-purple-500 text-2xl" />
              <span className="text-2xl font-bold" style={{ color: FLEET_COLORS.dark }}>
                {complianceStats.totalDocs}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Total Compliance Documents</p>
            <p className="text-xs text-gray-400 mt-1">All record types stored securely</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <FaClock className="text-blue-500 text-2xl" />
              <span className="text-2xl font-bold" style={{ color: FLEET_COLORS.dark }}>
                {complianceStats.docsInRetention}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Documents with 24-Month Rule</p>
            <p className="text-xs text-gray-400 mt-1 font-semibold">Ready for Inspector Review</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-4">
              <FaExclamationTriangle className="text-red-500 text-2xl" />
              <span className="text-2xl font-bold" style={{ color: FLEET_COLORS.dark }}>
                {complianceStats.docsExpiring}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Records Approaching Archival/Expiration</p>
            <p className="text-xs text-red-500 mt-1 font-bold">Action Required to Archive/Review</p>
          </div>
        </div>
        {/* End Compliance Dashboard */}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Title or Doc ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Document Types</option>
                  <option value="Policy">Policies</option>
                  <option value="Safety Meeting">Safety Meetings</option>
                  <option value="Toolbox Talk">Toolbox Talks</option>
                  <option value="Safety Bulletin">Safety Bulletins</option>
                  <option value="Investigation">Investigations</option>
                  <option value="Inspection">Inspections</option>
                  <option value="Training Record">Training Records</option>
                  <option value="First Aid Record">First Aid Records</option>
                </select>
              </div>
                <div className="flex items-center gap-2">
                <FaFilter className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold" style={{ color: FLEET_COLORS.dark }}>
              Compliance Document Library
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: FLEET_COLORS.gradient }}>
                <tr>
                  <th className="px-6 py-4 text-left text-white font-semibold">Doc ID</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Retention</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading document list...</td></tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No documents found matching criteria.</td></tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{doc.docId}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                          {getIconForType(doc.type)}
                          {doc.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(doc.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                          <span className={`${doc.requiredRetention === '24 months' ? 'text-red-700' : 'text-gray-700'}`}>
                              {doc.requiredRetention}
                          </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}>
                          {doc.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download PDF"
                          >
                            <FaDownload />
                          </a>
                          <button
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Metadata"
                          >
                            <FaFilePdf />
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

export default ComplianceDocumentation;