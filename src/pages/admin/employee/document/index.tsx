import React, { useState } from 'react';
import { FileText, Search, Filter, Upload, Eye, Download, Trash2, MoreVertical, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const EmployeeDocumentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const documentTypes = [
    { name: 'Employment Contract', required: true, count: 142 },
    { name: 'ID Proof', required: true, count: 156 },
    { name: 'Address Proof', required: true, count: 148 },
    { name: 'Educational Certificates', required: true, count: 152 },
    { name: 'Background Check', required: true, count: 145 },
    { name: 'Tax Documents', required: true, count: 138 },
    { name: 'Bank Details', required: true, count: 156 },
    { name: 'Medical Certificate', required: false, count: 89 },
    { name: 'Training Certificates', required: false, count: 124 },
    { name: 'Performance Reviews', required: false, count: 98 }
  ];

  const employeeDocuments = [
    {
      employeeId: 'EMP001',
      employeeName: 'Alex Martinez',
      documents: [
        { type: 'Employment Contract', status: 'Approved', uploadDate: '2023-01-15', expiryDate: '2025-01-15', size: '2.4 MB' },
        { type: 'ID Proof', status: 'Approved', uploadDate: '2023-01-15', expiryDate: '2028-01-15', size: '1.2 MB' },
        { type: 'Address Proof', status: 'Approved', uploadDate: '2023-01-15', expiryDate: '-', size: '850 KB' },
        { type: 'Background Check', status: 'Approved', uploadDate: '2023-01-10', expiryDate: '-', size: '3.1 MB' },
        { type: 'Training Certificates', status: 'Approved', uploadDate: '2023-06-20', expiryDate: '2024-06-20', size: '1.8 MB' }
      ]
    },
    {
      employeeId: 'EMP002',
      employeeName: 'Emma Wilson',
      documents: [
        { type: 'Employment Contract', status: 'Approved', uploadDate: '2023-03-22', expiryDate: '2025-03-22', size: '2.2 MB' },
        { type: 'ID Proof', status: 'Approved', uploadDate: '2023-03-22', expiryDate: '2027-03-22', size: '1.1 MB' },
        { type: 'Address Proof', status: 'Pending', uploadDate: '2023-03-22', expiryDate: '-', size: '920 KB' },
        { type: 'Educational Certificates', status: 'Approved', uploadDate: '2023-03-20', expiryDate: '-', size: '2.5 MB' }
      ]
    },
    {
      employeeId: 'EMP003',
      employeeName: 'James Brown',
      documents: [
        { type: 'Employment Contract', status: 'Approved', uploadDate: '2022-11-10', expiryDate: '2024-11-10', size: '2.3 MB' },
        { type: 'ID Proof', status: 'Approved', uploadDate: '2022-11-10', expiryDate: '2026-11-10', size: '1.3 MB' },
        { type: 'Background Check', status: 'Approved', uploadDate: '2022-11-05', expiryDate: '-', size: '2.9 MB' },
        { type: 'Medical Certificate', status: 'Expired', uploadDate: '2022-11-10', expiryDate: '2023-11-10', size: '780 KB' },
        { type: 'Training Certificates', status: 'Approved', uploadDate: '2023-04-15', expiryDate: '2024-04-15', size: '2.1 MB' }
      ]
    }
  ];

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
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Document Types Overview */}
      {!selectedEmployee && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Types Overview</h3>
          <div className="grid grid-cols-5 gap-4">
            {documentTypes.map((docType, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  {docType.required && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">{docType.name}</p>
                <p className="text-2xl font-bold text-gray-900">{docType.count}</p>
                <p className="text-xs text-gray-500 mt-1">of 156 employees</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee Documents */}
      <div className="space-y-6">
        {(selectedEmployee ? employeeDocuments.filter(ed => ed.employeeId === selectedEmployee.id) : employeeDocuments).map((empDoc) => (
          <div key={empDoc.employeeId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Employee Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {empDoc.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{empDoc.employeeName}</h3>
                    <p className="text-sm text-gray-500">{empDoc.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{empDoc.documents.length} documents</span>
                  <button className="p-2 hover:bg-gray-200 rounded-lg">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Documents Table */}
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
                  {empDoc.documents.map((doc, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">{doc.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'Approved' 
                            ? 'bg-green-100 text-green-700'
                            : doc.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {doc.status === 'Approved' && <CheckCircle className="w-3 h-3" />}
                          {doc.status === 'Pending' && <AlertTriangle className="w-3 h-3" />}
                          {doc.status === 'Expired' && <XCircle className="w-3 h-3" />}
                          <span>{doc.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{doc.uploadDate}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${doc.expiryDate === '-' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {doc.expiryDate}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{doc.size}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-red-50 rounded text-red-600" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDocumentsPage;