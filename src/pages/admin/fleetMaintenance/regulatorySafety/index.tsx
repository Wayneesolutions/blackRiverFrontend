import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Shield, AlertTriangle, Calendar } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

interface RegulatorySafety {
  _id: string;
  unitNo: string;
  unitType: string;
  makeModel: string;
  safetyExpiry: string;
  safetyDecalNumber: string;
  safetyPaperNumber: string;
  shopName: string;
  invoiceNo: string;
  createdAt: string;
}

// Static data for regulatory & safety records
const staticSafetyRecords: RegulatorySafety[] = [
  {
    _id: '1',
    unitNo: '1001',
    unitType: 'Truck',
    makeModel: 'Kenworth T680',
    safetyExpiry: '2024-12-15',
    safetyDecalNumber: 'SD-2024-1001',
    safetyPaperNumber: 'SP-2024-1001',
    shopName: 'Provincial Safety Inspection',
    invoiceNo: 'INV-SAF-2024-001',
    createdAt: '2024-01-15'
  },
  {
    _id: '2',
    unitNo: '1002',
    unitType: 'Truck',
    makeModel: 'Peterbilt 579',
    safetyExpiry: '2024-11-20',
    safetyDecalNumber: 'SD-2024-1002',
    safetyPaperNumber: 'SP-2024-1002',
    shopName: 'Fleet Safety Services',
    invoiceNo: 'INV-SAF-2024-002',
    createdAt: '2024-01-20'
  },
  {
    _id: '3',
    unitNo: 'BRV001',
    unitType: 'Reefer Trailer',
    makeModel: 'Utility 4000R',
    safetyExpiry: '2024-10-05',
    safetyDecalNumber: 'SD-2024-BRV001',
    safetyPaperNumber: 'SP-2024-BRV001',
    shopName: 'Trailer Inspection Center',
    invoiceNo: 'INV-SAF-2024-003',
    createdAt: '2024-02-05'
  },
  {
    _id: '4',
    unitNo: '1003',
    unitType: 'Truck',
    makeModel: 'Freightliner Cascadia',
    safetyExpiry: '2024-09-30',
    safetyDecalNumber: 'SD-2024-1003',
    safetyPaperNumber: 'SP-2024-1003',
    shopName: 'Commercial Vehicle Inspections',
    invoiceNo: 'INV-SAF-2024-004',
    createdAt: '2024-02-10'
  },
  {
    _id: '5',
    unitNo: 'BRV002',
    unitType: 'Tri-Axle Trailer',
    makeModel: 'Great Dane',
    safetyExpiry: '2024-08-15',
    safetyDecalNumber: 'SD-2024-BRV002',
    safetyPaperNumber: 'SP-2024-BRV002',
    shopName: 'Trailer Inspection Center',
    invoiceNo: 'INV-SAF-2024-005',
    createdAt: '2024-02-15'
  },
  {
    _id: '6',
    unitNo: 'BRV003',
    unitType: 'Dry Van',
    makeModel: 'Wabash National',
    safetyExpiry: '2024-07-20',
    safetyDecalNumber: 'SD-2024-BRV003',
    safetyPaperNumber: 'SP-2024-BRV003',
    shopName: 'Trailer Inspection Center',
    invoiceNo: 'INV-SAF-2024-006',
    createdAt: '2024-02-20'
  }
];

const RegulatorySafety: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegulatorySafety | null>(null);
  const [records, setRecords] = useState<RegulatorySafety[]>(staticSafetyRecords);
  const [formData, setFormData] = useState({
    unitNo: '',
    safetyExpiry: '',
    safetyDecalNumber: '',
    safetyPaperNumber: '',
    shopName: '',
    invoiceNo: ''
  });

  // Available units (from Unit Master List)
  const availableUnits = [
    { unitNo: '1001', unitType: 'Truck', makeModel: 'Kenworth T680' },
    { unitNo: '1002', unitType: 'Truck', makeModel: 'Peterbilt 579' },
    { unitNo: '1003', unitType: 'Truck', makeModel: 'Freightliner Cascadia' },
    { unitNo: 'BRV001', unitType: 'Reefer Trailer', makeModel: 'Utility 4000R' },
    { unitNo: 'BRV002', unitType: 'Tri-Axle Trailer', makeModel: 'Great Dane' },
    { unitNo: 'BRV003', unitType: 'Dry Van', makeModel: 'Wabash National' }
  ];

  const filteredRecords = records.filter(record => {
    return !searchTerm || 
      record.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.safetyDecalNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: string): { status: 'expired' | 'warning' | 'ok'; color: string; text: string } => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) {
      return { status: 'expired', color: 'bg-red-100 text-red-800', text: 'EXPIRED' };
    } else if (days <= 30) {
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', text: `${days} days left` };
    } else {
      return { status: 'ok', color: 'bg-green-100 text-green-800', text: 'OK' };
    }
  };

  const handleAddRecord = () => {
    setFormData({
      unitNo: '',
      safetyExpiry: '',
      safetyDecalNumber: '',
      safetyPaperNumber: '',
      shopName: '',
      invoiceNo: ''
    });
    setShowAddModal(true);
  };

  const handleEditRecord = (record: RegulatorySafety) => {
    setSelectedRecord(record);
    setFormData({
      unitNo: record.unitNo,
      safetyExpiry: record.safetyExpiry,
      safetyDecalNumber: record.safetyDecalNumber,
      safetyPaperNumber: record.safetyPaperNumber,
      shopName: record.shopName,
      invoiceNo: record.invoiceNo
    });
    setShowEditModal(true);
  };

  const handleDeleteRecord = (record: RegulatorySafety) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const handleSaveRecord = () => {
    if (!formData.unitNo || !formData.safetyExpiry || !formData.safetyDecalNumber || !formData.safetyPaperNumber || !formData.shopName || !formData.invoiceNo) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedUnit = availableUnits.find(u => u.unitNo === formData.unitNo);

    if (showAddModal) {
      const newRecord: RegulatorySafety = {
        _id: Date.now().toString(),
        unitNo: formData.unitNo,
        unitType: selectedUnit?.unitType || '',
        makeModel: selectedUnit?.makeModel || '',
        safetyExpiry: formData.safetyExpiry,
        safetyDecalNumber: formData.safetyDecalNumber,
        safetyPaperNumber: formData.safetyPaperNumber,
        shopName: formData.shopName,
        invoiceNo: formData.invoiceNo,
        createdAt: new Date().toISOString()
      };
      setRecords([...records, newRecord]);
    } else if (showEditModal && selectedRecord) {
      setRecords(records.map(record => 
        record._id === selectedRecord._id 
          ? { 
              ...record, 
              unitNo: formData.unitNo,
              unitType: selectedUnit?.unitType || record.unitType,
              makeModel: selectedUnit?.makeModel || record.makeModel,
              safetyExpiry: formData.safetyExpiry,
              safetyDecalNumber: formData.safetyDecalNumber,
              safetyPaperNumber: formData.safetyPaperNumber,
              shopName: formData.shopName,
              invoiceNo: formData.invoiceNo
            }
          : record
      ));
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedRecord(null);
  };

  const handleConfirmDelete = () => {
    if (selectedRecord) {
      setRecords(records.filter(record => record._id !== selectedRecord._id));
      setShowDeleteModal(false);
      setSelectedRecord(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(to bottom right, #016ab2, #063f6f)' }}>
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  Regulatory & Safety
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Track inspections and safety expiry dates
                </p>
              </div>
            </div>
            <button
              onClick={handleAddRecord}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg shadow-lg transition-all duration-200 font-medium hover:opacity-90"
              style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
            >
              <Plus className="w-5 h-5" />
              Add Safety Record
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by unit number, make/model, invoice, or decal number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
              onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Unit No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Unit Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Make/Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Safety Expiry</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Safety Decal Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Safety Paper Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Shop Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Invoice No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      No safety records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => {
                    const expiryStatus = getExpiryStatus(record.safetyExpiry);
                    return (
                      <tr key={record._id} className={`hover:bg-gray-50 transition-colors ${
                        expiryStatus.status === 'expired' ? 'bg-red-50' : 
                        expiryStatus.status === 'warning' ? 'bg-yellow-50' : ''
                      }`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{record.unitNo}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {record.unitType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{record.makeModel}</td>
                        <td className="px-6 py-4 text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(record.safetyExpiry).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${expiryStatus.color}`}>
                            {expiryStatus.status === 'expired' && <FaExclamationCircle className="mr-1" size={12} />}
                            {expiryStatus.status === 'warning' && <AlertTriangle className="mr-1" size={12} />}
                            {expiryStatus.status === 'ok' && <FaCheckCircle className="mr-1" size={12} />}
                            {expiryStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{record.safetyDecalNumber}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{record.safetyPaperNumber}</td>
                        <td className="px-6 py-4 text-gray-900">{record.shopName}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{record.invoiceNo}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditRecord(record)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(record)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Sidebar */}
        {(showAddModal || showEditModal) && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] transition-all duration-500" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setSelectedRecord(null);
            }} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  <h2 className="text-2xl font-bold">{showAddModal ? 'Add Safety Record' : 'Edit Safety Record'}</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedRecord(null);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit No. *</label>
                    <select
                      value={formData.unitNo}
                      onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    >
                      <option value="">Select Unit</option>
                      {availableUnits.map(unit => (
                        <option key={unit.unitNo} value={unit.unitNo}>
                          {unit.unitNo} - {unit.makeModel} ({unit.unitType})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Safety Expiry *</label>
                    <input
                      type="date"
                      value={formData.safetyExpiry}
                      onChange={(e) => setFormData({ ...formData, safetyExpiry: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    />
                    <p className="text-xs text-gray-500 mt-1">CRITICAL: Used for dashboard alerts</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Safety Decal Number *</label>
                    <input
                      type="text"
                      value={formData.safetyDecalNumber}
                      onChange={(e) => setFormData({ ...formData, safetyDecalNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-mono"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="SD-2024-1001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Safety Paper Number *</label>
                    <input
                      type="text"
                      value={formData.safetyPaperNumber}
                      onChange={(e) => setFormData({ ...formData, safetyPaperNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-mono"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="SP-2024-1001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name *</label>
                    <input
                      type="text"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="Name of inspection shop"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice No. *</label>
                    <input
                      type="text"
                      value={formData.invoiceNo}
                      onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-mono"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="INV-SAF-2024-001"
                    />
                  </div>
                </div>
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedRecord(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    className="px-6 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                  >
                    {showAddModal ? 'Add Record' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedRecord && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]" onClick={() => setShowDeleteModal(false)} />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[9999] w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <FaExclamationCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Safety Record</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this safety record for unit <strong>{selectedRecord.unitNo}</strong>?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RegulatorySafety;

