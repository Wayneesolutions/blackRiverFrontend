import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';

type TruckType = 'Semi-Truck' | 'Straight Truck' | 'Box Truck' | 'Flatbed' | 'Refrigerated Truck' | 'Dump Truck' | 'Tow Truck';

interface Truck {
  _id: string;
  internalId: string;
  plateNumber: string;
  vinNumber: string;
  make: string;
  model: string;
  year: number;
  truckType: TruckType;
  odometer: number;
  status: string;
  // Safety compliance fields
  safetyExpiryDate?: string;
  safetyDecalNumber?: string;
  safetyPaperNumber?: string;
  lastInspectionShop?: string;
  lastInspectionInvoice?: string;
}

// Static data for trucks
const staticTrucks: Truck[] = [
  {
    _id: '1',
    internalId: '1001',
    plateNumber: 'BRV-1001',
    vinNumber: '1XKDB0X5XKJ123456',
    make: 'Kenworth',
    model: 'T680',
    year: 2022,
    truckType: 'Semi-Truck',
    odometer: 125000,
    status: 'available',
    safetyExpiryDate: '2024-12-15',
    safetyDecalNumber: 'SD-2024-1001',
    safetyPaperNumber: 'SP-2024-1001',
    lastInspectionShop: 'Provincial Safety Inspection',
    lastInspectionInvoice: 'INV-SAF-2024-001'
  },
  {
    _id: '2',
    internalId: '1002',
    plateNumber: 'BRV-1002',
    vinNumber: '1NP5DB0X9NW234567',
    make: 'Peterbilt',
    model: '579',
    year: 2023,
    truckType: 'Semi-Truck',
    odometer: 98000,
    status: 'in-use',
    safetyExpiryDate: '2024-11-20',
    safetyDecalNumber: 'SD-2024-1002',
    safetyPaperNumber: 'SP-2024-1002',
    lastInspectionShop: 'Fleet Safety Services',
    lastInspectionInvoice: 'INV-SAF-2024-002'
  },
  {
    _id: '3',
    internalId: '1003',
    plateNumber: 'BRV-1003',
    vinNumber: '1FUJGHDV5DS345678',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2021,
    truckType: 'Semi-Truck',
    odometer: 156000,
    status: 'maintenance',
    safetyExpiryDate: '2024-09-30',
    safetyDecalNumber: 'SD-2024-1003',
    safetyPaperNumber: 'SP-2024-1003',
    lastInspectionShop: 'Commercial Vehicle Inspections',
    lastInspectionInvoice: 'INV-SAF-2024-004'
  },
  {
    _id: '4',
    internalId: '1004',
    plateNumber: 'BRV-1004',
    vinNumber: '4V4NC9EH5NN456789',
    make: 'Volvo',
    model: 'VNL',
    year: 2020,
    truckType: 'Semi-Truck',
    odometer: 180000,
    status: 'available',
    safetyExpiryDate: '2024-08-15',
    safetyDecalNumber: 'SD-2024-1004',
    safetyPaperNumber: 'SP-2024-1004',
    lastInspectionShop: 'Fleet Safety Services',
    lastInspectionInvoice: 'INV-SAF-2024-005'
  },
  {
    _id: '5',
    internalId: '1005',
    plateNumber: 'BRV-1005',
    vinNumber: '1HTMMAMN5MH567890',
    make: 'International',
    model: 'LT Series',
    year: 2023,
    truckType: 'Box Truck',
    odometer: 45000,
    status: 'available',
    safetyExpiryDate: '2024-10-10',
    safetyDecalNumber: 'SD-2024-1005',
    safetyPaperNumber: 'SP-2024-1005',
    lastInspectionShop: 'Provincial Safety Inspection',
    lastInspectionInvoice: 'INV-SAF-2024-006'
  }
];

const Trucks: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [trucks, setTrucks] = useState<Truck[]>(staticTrucks);
  const [formData, setFormData] = useState({
    internalId: '',
    plateNumber: '',
    vinNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    truckType: 'Semi-Truck' as TruckType,
    odometer: '',
    status: 'available'
  });
  const [safetyForm, setSafetyForm] = useState({
    safetyExpiryDate: '',
    safetyDecalNumber: '',
    safetyPaperNumber: '',
    lastInspectionShop: '',
    lastInspectionInvoice: ''
  });

  const filteredTrucks = trucks.filter(truck => {
    return !searchTerm || 
      truck.internalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.vinNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getComplianceStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', color: 'gray', text: 'Not Set' };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'red', text: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring-soon', color: 'yellow', text: `Expiring in ${daysUntilExpiry} days` };
    } else {
      return { status: 'valid', color: 'green', text: 'Valid' };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  const handleAddTruck = () => {
    setFormData({
      internalId: '',
      plateNumber: '',
      vinNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear().toString(),
      truckType: 'Semi-Truck',
      odometer: '',
      status: 'available'
    });
    setShowAddModal(true);
  };

  const handleEditTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setFormData({
      internalId: truck.internalId,
      plateNumber: truck.plateNumber,
      vinNumber: truck.vinNumber,
      make: truck.make,
      model: truck.model,
      year: truck.year.toString(),
      truckType: truck.truckType,
      odometer: truck.odometer.toString(),
      status: truck.status
    });
    setShowEditModal(true);
  };

  const handleSafetyRecord = (truck: Truck) => {
    setSelectedTruck(truck);
    setSafetyForm({
      safetyExpiryDate: truck.safetyExpiryDate ? new Date(truck.safetyExpiryDate).toISOString().split('T')[0] : '',
      safetyDecalNumber: truck.safetyDecalNumber || '',
      safetyPaperNumber: truck.safetyPaperNumber || '',
      lastInspectionShop: truck.lastInspectionShop || '',
      lastInspectionInvoice: truck.lastInspectionInvoice || ''
    });
    setShowSafetyModal(true);
  };

  const handleDeleteTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setShowDeleteModal(true);
  };

  const handleSaveTruck = () => {
    if (!formData.internalId || !formData.plateNumber || !formData.vinNumber || !formData.make || !formData.model) {
      alert('Please fill in all required fields');
      return;
    }

    if (showAddModal) {
      const newTruck: Truck = {
        _id: Date.now().toString(),
        internalId: formData.internalId,
        plateNumber: formData.plateNumber,
        vinNumber: formData.vinNumber,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        truckType: formData.truckType,
        odometer: parseInt(formData.odometer) || 0,
        status: formData.status
      };
      setTrucks([...trucks, newTruck]);
    } else if (showEditModal && selectedTruck) {
      setTrucks(trucks.map(truck => 
        truck._id === selectedTruck._id 
          ? { 
              ...truck, 
              internalId: formData.internalId,
              plateNumber: formData.plateNumber,
              vinNumber: formData.vinNumber,
              make: formData.make,
              model: formData.model,
              year: parseInt(formData.year),
              truckType: formData.truckType,
              odometer: parseInt(formData.odometer) || truck.odometer,
              status: formData.status
            }
          : truck
      ));
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedTruck(null);
  };

  const handleSaveSafety = () => {
    if (!selectedTruck || !safetyForm.safetyExpiryDate) {
      alert('Please fill in the safety expiry date');
      return;
    }

    setTrucks(trucks.map(truck => 
      truck._id === selectedTruck._id 
        ? { 
            ...truck, 
            safetyExpiryDate: safetyForm.safetyExpiryDate,
            safetyDecalNumber: safetyForm.safetyDecalNumber,
            safetyPaperNumber: safetyForm.safetyPaperNumber,
            lastInspectionShop: safetyForm.lastInspectionShop,
            lastInspectionInvoice: safetyForm.lastInspectionInvoice
          }
        : truck
    ));
    setShowSafetyModal(false);
    setSelectedTruck(null);
  };

  const handleConfirmDelete = () => {
    if (selectedTruck) {
      setTrucks(trucks.filter(truck => truck._id !== selectedTruck._id));
      setShowDeleteModal(false);
      setSelectedTruck(null);
    }
  };

  const truckTypes: TruckType[] = [
    'Semi-Truck',
    'Straight Truck',
    'Box Truck',
    'Flatbed',
    'Refrigerated Truck',
    'Dump Truck',
    'Tow Truck'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(to bottom right, #016ab2, #063f6f)' }}>
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  Trucks
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Manage truck fleet and safety compliance records
                </p>
              </div>
            </div>
            <button
              onClick={handleAddTruck}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg shadow-lg transition-all duration-200 font-medium hover:opacity-90"
              style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
            >
              <Plus className="w-5 h-5" />
              Add Truck
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by unit number, plate, make, model, or VIN..."
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
                  <th className="px-6 py-4 text-left text-sm font-semibold">Plate Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">VIN Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Make/Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Odometer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold min-w-[180px]">Safety Expiry</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTrucks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      No trucks found
                    </td>
                  </tr>
                ) : (
                  filteredTrucks.map((truck) => {
                    const compliance = getComplianceStatus(truck.safetyExpiryDate);
                    return (
                      <tr key={truck._id} className={`hover:bg-gray-50 transition-colors ${
                        compliance.status === 'expired' ? 'bg-red-50' : 
                        compliance.status === 'expiring-soon' ? 'bg-yellow-50' : ''
                      }`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{truck.internalId}</td>
                        <td className="px-6 py-4 text-gray-900">{truck.plateNumber}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{truck.vinNumber}</td>
                        <td className="px-6 py-4 text-gray-900">{truck.make} {truck.model}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {truck.truckType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{truck.year}</td>
                        <td className="px-6 py-4 text-gray-900">{truck.odometer.toLocaleString()} km</td>
                        <td className="px-6 py-4 min-w-[180px]">
                          {truck.safetyExpiryDate ? (
                            <div className="flex flex-col gap-2">
                              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                {formatDate(truck.safetyExpiryDate)}
                              </span>
                              <span className={`px-4 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${
                                compliance.status === 'expired'
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : compliance.status === 'expiring-soon'
                                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                    : "bg-green-100 text-green-700 border border-green-200"
                              }`}>
                                {compliance.text}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not Set</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            truck.status === 'available' ? 'bg-green-100 text-green-800' :
                            truck.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                            truck.status === 'maintenance' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {truck.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditTruck(truck)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSafetyRecord(truck)}
                              className="p-2 rounded-lg transition-colors"
                            style={{ color: '#016ab2' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(1, 106, 178, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                              title="Safety Record"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTruck(truck)}
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
              setSelectedTruck(null);
            }} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  <h2 className="text-2xl font-bold">{showAddModal ? 'Add New Truck' : 'Edit Truck'}</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedTruck(null);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit No. (Internal ID) *</label>
                    <input
                      type="text"
                      value={formData.internalId}
                      onChange={(e) => setFormData({ ...formData, internalId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="e.g., 1001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plate Number *</label>
                    <input
                      type="text"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="e.g., BRV-1001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">VIN Number *</label>
                    <input
                      type="text"
                      value={formData.vinNumber}
                      onChange={(e) => setFormData({ ...formData, vinNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-mono"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="17-character VIN"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Truck Type *</label>
                    <select
                      value={formData.truckType}
                      onChange={(e) => setFormData({ ...formData, truckType: e.target.value as TruckType })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    >
                      {truckTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make *</label>
                    <input
                      type="text"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="e.g., Kenworth"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="e.g., T680"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Odometer (km)</label>
                    <input
                      type="number"
                      value={formData.odometer}
                      onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    >
                      <option value="available">Available</option>
                      <option value="in-use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="idle">Idle</option>
                    </select>
                  </div>
                </div>
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedTruck(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTruck}
                    className="px-6 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                  >
                    {showAddModal ? 'Add Truck' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Safety Record Sidebar */}
        {showSafetyModal && selectedTruck && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] transition-all duration-500" onClick={() => {
              setShowSafetyModal(false);
              setSelectedTruck(null);
            }} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  <div>
                    <h2 className="text-2xl font-bold">Safety Compliance Record</h2>
                    <p className="text-sm mt-1 opacity-90">
                      {selectedTruck.internalId} - {selectedTruck.make} {selectedTruck.model} ({selectedTruck.truckType})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSafetyModal(false);
                      setSelectedTruck(null);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Safety Expiry Date *</label>
                    <input
                      type="date"
                      value={safetyForm.safetyExpiryDate}
                      onChange={(e) => setSafetyForm({ ...safetyForm, safetyExpiryDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Safety Decal Number</label>
                    <input
                      type="text"
                      value={safetyForm.safetyDecalNumber}
                      onChange={(e) => setSafetyForm({ ...safetyForm, safetyDecalNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="SD-2024-1001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Safety Paper Number</label>
                    <input
                      type="text"
                      value={safetyForm.safetyPaperNumber}
                      onChange={(e) => setSafetyForm({ ...safetyForm, safetyPaperNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="SP-2024-1001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                    <input
                      type="text"
                      value={safetyForm.lastInspectionShop}
                      onChange={(e) => setSafetyForm({ ...safetyForm, lastInspectionShop: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="Name of inspection shop"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                    <input
                      type="text"
                      value={safetyForm.lastInspectionInvoice}
                      onChange={(e) => setSafetyForm({ ...safetyForm, lastInspectionInvoice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
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
                        setShowSafetyModal(false);
                        setSelectedTruck(null);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSafety}
                      className="px-6 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                      style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                    >
                      Save Safety Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedTruck && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]" onClick={() => setShowDeleteModal(false)} />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[9999] w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <FaExclamationCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Truck</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete truck <strong>{selectedTruck.internalId}</strong> ({selectedTruck.make} {selectedTruck.model})?
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

export default Trucks;
