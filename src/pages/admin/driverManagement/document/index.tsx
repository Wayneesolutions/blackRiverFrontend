import React, { useState, useEffect } from 'react';
import { FileText, Search, Upload, Eye, Download, Trash2, CheckCircle, XCircle, AlertTriangle, Plus, Edit } from 'lucide-react';
import {
  getAllEmployeeDocuments,
  getEmployeeDocumentStats,
  deleteEmployeeDocument,
  getAllEmployees,
  createEmployeeDocument,
  updateEmployeeDocument,
  type EmployeeWithDocuments,
  type EmployeeDocument,
  type DocumentStats
} from '../../../../axios/api/employeeDocument';

const EmployeeDocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeDocuments, setEmployeeDocuments] = useState<EmployeeWithDocuments[]>([]);
  const [documentStats, setDocumentStats] = useState<DocumentStats | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<EmployeeDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Document types configuration
  const documentTypes = [
    { name: 'Employment Contract', required: true },
    { name: 'ID Document', required: true },
    { name: 'Passport', required: true },
    { name: 'Work Permit', required: true },
    { name: 'Background Check', required: true },
    { name: 'Tax Document', required: true },
    { name: 'Payroll Document', required: true },
    { name: 'Medical Certificate', required: false },
    { name: 'Training Certificate', required: false },
    { name: 'Performance Review', required: false },
    { name: 'Drug Test', required: false },
    { name: 'Insurance Policy', required: false },
    { name: 'Company Policy', required: false },
    { name: 'Emergency Contact', required: false },
    { name: 'Other', required: false }
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [currentPage, selectedEmployee]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [documentsResponse, statsResponse, employeesResponse] = await Promise.all([
        getAllEmployeeDocuments(
          currentPage,
          10,
          selectedEmployee?._id,
          undefined,
          undefined,
          'createdAt',
          'desc'
        ),
        getEmployeeDocumentStats(),
        getAllEmployees()
      ]);

      console.log('Documents response:', documentsResponse);
      console.log('Stats response:', statsResponse);
      console.log('Employees response:', employeesResponse);
      
      setEmployeeDocuments(documentsResponse.data || []);
      setDocumentStats(statsResponse.data);
      setEmployees(employeesResponse.data || []);
      setTotalPages(documentsResponse.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await getAllEmployeeDocuments(
        1,
        10,
        selectedEmployee?._id,
        undefined,
        undefined,
        'createdAt',
        'desc'
      );
      setEmployeeDocuments(response.data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteEmployeeDocument(documentId);
        fetchData(); // Refresh data
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'expired':
        return 'bg-red-100 text-red-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-3 h-3" />;
      case 'pending':
        return <AlertTriangle className="w-3 h-3" />;
      case 'expired':
      case 'rejected':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Employee Documents</h2>
            {selectedEmployee && (
              <p className="text-gray-600 mt-1">Viewing documents for: <span className="font-semibold text-blue-600">{selectedEmployee.name}</span></p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-blue-500 !text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
            <button 
              onClick={() => setSelectedEmployee(null)}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              View All
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents by employee name, document type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedEmployee?._id || ''}
            onChange={(e) => {
              const employee = employees.find(emp => emp._id === e.target.value);
              setSelectedEmployee(employee || null);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name} ({employee.internalId})
              </option>
            ))}
          </select>
          <button 
            onClick={handleSearch}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Document Types Overview */}
      {!selectedEmployee && documentStats && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Total</span>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-1">Total Documents</p>
              <p className="text-2xl font-bold text-blue-900">{documentStats.totalDocuments}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">Valid</span>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-1">Valid Documents</p>
              <p className="text-2xl font-bold text-green-900">{documentStats.validDocuments}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded">Pending</span>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-1">Pending Documents</p>
              <p className="text-2xl font-bold text-yellow-900">{documentStats.pendingDocuments}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Expired</span>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-1">Expired Documents</p>
              <p className="text-2xl font-bold text-red-900">{documentStats.expiredDocuments}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-4">
            {documentTypes.map((docType, index) => {
              const count = documentStats.documentTypes[docType.name] || 0;
              return (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    {docType.required && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-1">{docType.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 mt-1">documents</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee Documents */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {employeeDocuments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-4">
                {selectedEmployee 
                  ? `${selectedEmployee.name} has no documents uploaded yet.`
                  : 'No employee documents found. Upload some documents to get started.'
                }
              </p>
              <button 
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-blue-500 !text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload Document
              </button>
            </div>
          ) : (
            employeeDocuments.map((empDoc) => (
              <div key={empDoc.employee._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Employee Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {empDoc.employee.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{empDoc.employee.name}</h3>
                        <p className="text-sm text-gray-500">{empDoc.employee.internalId}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{empDoc.documents.length} documents</span>
                      <button 
                        onClick={() => {
                          setSelectedEmployee(empDoc.employee);
                          setShowUploadModal(true);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg"
                        title="Upload Document"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Documents Table */}
                {empDoc.documents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Document Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Upload Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">File Size</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {empDoc.documents.map((doc: EmployeeDocument, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-800">{doc.documentType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                                {getStatusIcon(doc.status)}
                                <span className="capitalize">{doc.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm ${!doc.expiryDate ? 'text-gray-400' : 'text-gray-600'}`}>
                                {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {doc.fileSize ? formatFileSize(doc.fileSize) : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {doc.fileUrl && (
                                  <>
                                    <button 
                                      onClick={() => window.open(doc.fileUrl, '_blank')}
                                      className="p-1.5 hover:bg-blue-50 rounded text-blue-600" 
                                      title="View"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = doc.fileUrl!;
                                        link.download = doc.fileName || 'document';
                                        link.click();
                                      }}
                                      className="p-1.5 hover:bg-green-50 rounded text-green-600" 
                                      title="Download"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => setEditingDocument(doc)}
                                  className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600" 
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteDocument(doc._id)}
                                  className="p-1.5 hover:bg-red-50 rounded text-red-600" 
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No documents uploaded for this employee</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          employee={selectedEmployee}
          employees={employees}
          onClose={() => {
            setShowUploadModal(false);
            setEditingDocument(null);
            setSelectedEmployee(null); // Clear selected employee when modal is closed
          }}
          onSuccess={() => {
            setShowUploadModal(false);
            setEditingDocument(null);
            setSelectedEmployee(null); // Clear selected employee to show all users
            fetchData();
          }}
          editingDocument={editingDocument}
        />
      )}
    </div>
  );
};

// Upload Document Modal Component
const UploadDocumentModal = ({ 
  employee, 
  employees, 
  onClose, 
  onSuccess, 
  editingDocument 
}: {
  employee: any;
  employees: any[];
  onClose: () => void;
  onSuccess: () => void;
  editingDocument: EmployeeDocument | null;
}) => {
  const [formData, setFormData] = useState({
    employee: employee?._id || '',
    documentType: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    description: '',
    status: 'valid'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const documentTypes = [
    'Employment Contract',
    'ID Document',
    'Passport',
    'Work Permit',
    'Background Check',
    'Drug Test',
    'Training Certificate',
    'Insurance Policy',
    'Company Policy',
    'Performance Review',
    'Payroll Document',
    'Tax Document',
    'Emergency Contact',
    'Medical Certificate',
    'Other'
  ];

  useEffect(() => {
    if (editingDocument) {
      setFormData({
        employee: editingDocument.employee,
        documentType: editingDocument.documentType,
        documentNumber: editingDocument.documentNumber || '',
        issueDate: editingDocument.issueDate ? editingDocument.issueDate.split('T')[0] : '',
        expiryDate: editingDocument.expiryDate ? editingDocument.expiryDate.split('T')[0] : '',
        description: editingDocument.description || '',
        status: editingDocument.status
      });
    } else if (employee) {
      setFormData(prev => ({ ...prev, employee: employee._id }));
    }
  }, [editingDocument, employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee || !formData.documentType) {
      alert('Please select an employee and document type');
      return;
    }

    if (!editingDocument && !selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);
      const submitData = new FormData();
      submitData.append('employee', formData.employee);
      submitData.append('documentType', formData.documentType);
      submitData.append('status', formData.status);
      
      if (formData.documentNumber) submitData.append('documentNumber', formData.documentNumber);
      if (formData.issueDate) submitData.append('issueDate', formData.issueDate);
      if (formData.expiryDate) submitData.append('expiryDate', formData.expiryDate);
      if (formData.description) submitData.append('description', formData.description);
      if (selectedFile) submitData.append('documentFile', selectedFile);

      // Debug: Log the form data being sent
      console.log('Form data being sent:');
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }

      if (editingDocument) {
        await updateEmployeeDocument(editingDocument._id, submitData);
      } else {
        await createEmployeeDocument(submitData);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving document:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error saving document: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold !text-gray-800">
              {editingDocument ? 'Edit Document' : 'Upload Document'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.internalId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Document Type</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Number
                </label>
                <input
                  type="text"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="valid">Valid</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter document description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document File {!editingDocument && <span className="text-red-500">*</span>}
              </label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip"
              />
              {editingDocument && (
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to keep current file
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingDocument ? 'Update Document' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDocumentsPage;