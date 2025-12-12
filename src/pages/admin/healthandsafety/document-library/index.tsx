import React, { useState, useEffect } from 'react';
import { COLORS } from '../../../../theme/colors';
import {
  FaFolder,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileImage,
  FaDownload,
  FaTrash,
  FaSearch,
  FaFilter,
  FaPlus,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaArchive,
  FaEye,
  FaEdit,
  FaTag,
} from 'react-icons/fa';

interface Document {
  _id: string;
  documentNumber: string;
  title: string;
  description?: string;
  category: 'Safety Meeting' | 'Toolbox Talk' | 'Safety Bulletin' | 'Investigation' | 'Policy' | 'Inspection' | 'Training' | 'First Aid' | 'Other';
  documentType: 'pdf' | 'word' | 'image' | 'excel' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize: number; // bytes
  uploadedBy: string;
  uploadedDate: string;
  tags: string[];
  
  // Retention Management
  retentionPeriod: number; // months
  retentionStartDate: string; // date when retention period starts
  retentionEndDate: string; // calculated: retentionStartDate + retentionPeriod months
  retentionStatus: 'active' | 'expiring-soon' | 'expired' | 'archived';
  autoDelete: boolean; // if true, auto-delete after retention period
  retentionNotes?: string;
  
  // Compliance
  requiredForAudit: boolean;
  auditCategory?: string;
  relatedIncident?: string;
  relatedHazard?: string;
  relatedInspection?: string;
  
  // Access Control
  accessLevel: 'public' | 'restricted' | 'confidential';
  allowedRoles?: string[];
}

const DocumentLibrary: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRetention, setFilterRetention] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    // Mock data
    const mockDocuments: Document[] = [
      {
        _id: '1',
        documentNumber: 'DOC-2025-001',
        title: 'December Safety Meeting Minutes',
        description: 'Monthly safety committee meeting minutes',
        category: 'Safety Meeting',
        documentType: 'pdf',
        fileUrl: '/documents/safety-meeting-dec-2025.pdf',
        fileName: 'safety-meeting-dec-2025.pdf',
        fileSize: 245760, // 240 KB
        uploadedBy: 'Safety Manager',
        uploadedDate: '2025-12-01',
        tags: ['safety-committee', 'monthly-meeting', '2025'],
        retentionPeriod: 24, // 24 months
        retentionStartDate: '2025-12-01',
        retentionEndDate: '2027-12-01',
        retentionStatus: 'active',
        autoDelete: false,
        requiredForAudit: true,
        auditCategory: 'Safety Committee',
        accessLevel: 'public',
      },
      {
        _id: '2',
        documentNumber: 'DOC-2025-002',
        title: 'Incident Investigation Report - INC-2025-045',
        description: 'Root cause analysis for workplace incident',
        category: 'Investigation',
        documentType: 'pdf',
        fileUrl: '/documents/investigation-inc-045.pdf',
        fileName: 'investigation-inc-045.pdf',
        fileSize: 512000, // 500 KB
        uploadedBy: 'Safety Manager',
        uploadedDate: '2025-12-05',
        tags: ['incident', 'investigation', 'root-cause'],
        retentionPeriod: 36, // 36 months (3 years for investigations)
        retentionStartDate: '2025-12-05',
        retentionEndDate: '2028-12-05',
        retentionStatus: 'active',
        autoDelete: false,
        requiredForAudit: true,
        auditCategory: 'Incident Management',
        relatedIncident: 'INC-2025-045',
        accessLevel: 'restricted',
        allowedRoles: ['safety-manager', 'hr', 'management'],
      },
      {
        _id: '3',
        documentNumber: 'DOC-2024-150',
        title: 'January 2024 Toolbox Talk - Winter Driving',
        description: 'Toolbox talk attendance and notes',
        category: 'Toolbox Talk',
        documentType: 'word',
        fileUrl: '/documents/toolbox-talk-winter-2024.docx',
        fileName: 'toolbox-talk-winter-2024.docx',
        fileSize: 128000, // 125 KB
        uploadedBy: 'Operations Manager',
        uploadedDate: '2024-01-15',
        tags: ['toolbox-talk', 'winter-driving', '2024'],
        retentionPeriod: 24, // 24 months
        retentionStartDate: '2024-01-15',
        retentionEndDate: '2026-01-15',
        retentionStatus: 'expiring-soon',
        autoDelete: true,
        requiredForAudit: true,
        auditCategory: 'Training & Communication',
        accessLevel: 'public',
      },
      {
        _id: '4',
        documentNumber: 'DOC-2023-080',
        title: 'Q3 2023 Safety Inspection Report',
        description: 'Quarterly facility safety inspection',
        category: 'Inspection',
        documentType: 'pdf',
        fileUrl: '/documents/inspection-q3-2023.pdf',
        fileName: 'inspection-q3-2023.pdf',
        fileSize: 1024000, // 1 MB
        uploadedBy: 'Safety Inspector',
        uploadedDate: '2023-09-30',
        tags: ['inspection', 'quarterly', '2023'],
        retentionPeriod: 24, // 24 months
        retentionStartDate: '2023-09-30',
        retentionEndDate: '2025-09-30',
        retentionStatus: 'expired',
        autoDelete: true,
        requiredForAudit: true,
        auditCategory: 'Inspections',
        accessLevel: 'public',
      },
    ];

    setDocuments(mockDocuments);
    setLoading(false);
  }, []);

  const calculateRetentionStatus = (endDate: string): Document['retentionStatus'] => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'active';
  };

  const getFileIcon = (type: Document['documentType']) => {
    switch (type) {
      case 'pdf':
        return <FaFilePdf className="text-red-600" size={24} />;
      case 'word':
        return <FaFileWord className="text-blue-600" size={24} />;
      case 'image':
        return <FaFileImage className="text-green-600" size={24} />;
      default:
        return <FaFileAlt className="text-gray-600" size={24} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    const matchesRetention = filterRetention === 'all' || doc.retentionStatus === filterRetention;
    return matchesSearch && matchesCategory && matchesRetention;
  });

  const stats = {
    total: documents.length,
    expiringSoon: documents.filter(d => d.retentionStatus === 'expiring-soon').length,
    expired: documents.filter(d => d.retentionStatus === 'expired').length,
    archived: documents.filter(d => d.retentionStatus === 'archived').length,
    totalSize: documents.reduce((sum, d) => sum + d.fileSize, 0),
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.background.secondary }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
            <FaFolder className="inline mr-3" style={{ color: COLORS.modules.compliance }} />
            Document Library
          </h1>
          <p className="text-lg text-gray-600">
            Centralized document storage with retention management and compliance tracking.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: COLORS.modules.compliance }}>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Documents</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
            <div className="text-3xl font-bold text-yellow-700">{stats.expiringSoon}</div>
            <div className="text-sm text-gray-600 mt-1">Expiring Soon</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
            <div className="text-3xl font-bold text-red-700">{stats.expired}</div>
            <div className="text-sm text-gray-600 mt-1">Expired</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-gray-500">
            <div className="text-3xl font-bold text-gray-700">{stats.archived}</div>
            <div className="text-sm text-gray-600 mt-1">Archived</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-700">{formatFileSize(stats.totalSize)}</div>
            <div className="text-sm text-gray-600 mt-1">Total Storage</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents by title, number, tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Safety Meeting">Safety Meeting</option>
                <option value="Toolbox Talk">Toolbox Talk</option>
                <option value="Safety Bulletin">Safety Bulletin</option>
                <option value="Investigation">Investigation</option>
                <option value="Policy">Policy</option>
                <option value="Inspection">Inspection</option>
                <option value="Training">Training</option>
                <option value="First Aid">First Aid</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={filterRetention}
                onChange={(e) => setFilterRetention(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Retention Status</option>
                <option value="active">Active</option>
                <option value="expiring-soon">Expiring Soon</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-semibold"
            >
              <FaPlus /> Upload Document
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Retention</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No documents found</td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.documentType)}
                          <div>
                            <div className="font-semibold text-gray-900">{doc.title}</div>
                            <div className="text-xs text-gray-500">{doc.documentNumber}</div>
                            {doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.tags.slice(0, 2).map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                    <FaTag className="inline mr-1" size={8} />
                                    {tag}
                                  </span>
                                ))}
                                {doc.tags.length > 2 && (
                                  <span className="text-xs text-gray-400">+{doc.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{new Date(doc.uploadedDate).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">by {doc.uploadedBy}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" size={12} />
                          <div>
                            <div className="text-gray-700">
                              {new Date(doc.retentionEndDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {doc.retentionPeriod} months
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.retentionStatus === 'active' && (
                          <span className="flex items-center text-green-700">
                            <FaCheckCircle className="mr-1" /> Active
                          </span>
                        )}
                        {doc.retentionStatus === 'expiring-soon' && (
                          <span className="flex items-center text-yellow-700">
                            <FaClock className="mr-1" /> Expiring Soon
                          </span>
                        )}
                        {doc.retentionStatus === 'expired' && (
                          <span className="flex items-center text-red-700">
                            <FaExclamationTriangle className="mr-1" /> Expired
                          </span>
                        )}
                        {doc.retentionStatus === 'archived' && (
                          <span className="flex items-center text-gray-700">
                            <FaArchive className="mr-1" /> Archived
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Download">
                            <FaDownload />
                          </button>
                          {doc.retentionStatus === 'expired' && doc.autoDelete && (
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
            <FaCheckCircle /> Document Retention Management
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Automatic retention period tracking (24-36 months for federal compliance)</li>
            <li>✅ Expiry warnings 30 days before retention period ends</li>
            <li>✅ Auto-delete option for expired documents (configurable per document)</li>
            <li>✅ Archive option to preserve documents beyond retention period</li>
            <li>✅ Audit-ready document categorization and tagging</li>
            <li>✅ Access control by role and confidentiality level</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentLibrary;

