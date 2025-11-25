import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Wrench, FileText, Building2 } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

interface GeneralRepair {
  _id: string;
  serviceDate: string;
  unitNumber: string;
  makeModel: string;
  vinLicensePlate: string;
  description: string;
  odometer: number;
  parts: string;
  notes: string;
  serviceProvider: string;
  invoiceNumber: string;
  createdAt: string;
}

// Static data for general repairs
const staticRepairs: GeneralRepair[] = [
  {
    _id: '1',
    serviceDate: '2024-01-10',
    unitNumber: '1001',
    makeModel: 'Kenworth T680',
    vinLicensePlate: 'BRV-1001 / 1XKDB0X5XKJ123456',
    description: 'Front right tire blow out - replaced with new tire. Rim inspected and found to be in good condition.',
    odometer: 124500,
    parts: '1x Michelin XZA2+ 295/75R22.5, 1x Valve Stem',
    notes: 'Passed post-repair inspection. Tire pressure monitoring system checked.',
    serviceProvider: 'ABC Tire & Service',
    invoiceNumber: 'INV-REP-2024-001',
    createdAt: '2024-01-10'
  },
  {
    _id: '2',
    serviceDate: '2024-01-18',
    unitNumber: '1002',
    makeModel: 'Peterbilt 579',
    vinLicensePlate: 'BRV-1002 / 1NP5DB0X9NW234567',
    description: 'Brake pad replacement on all four wheels. Brake fluid flushed and replaced.',
    odometer: 97500,
    parts: '4x Front Brake Pads, 4x Rear Brake Pads, 2L Brake Fluid',
    notes: 'Brake system tested. All components functioning properly.',
    serviceProvider: 'Fleet Maintenance Center',
    invoiceNumber: 'INV-REP-2024-002',
    createdAt: '2024-01-18'
  },
  {
    _id: '3',
    serviceDate: '2024-02-05',
    unitNumber: '1001',
    makeModel: 'Kenworth T680',
    vinLicensePlate: 'BRV-1001 / 1XKDB0X5XKJ123456',
    description: 'Accident repair - Rear bumper damage from minor collision. Bumper replaced and repainted.',
    odometer: 125800,
    parts: '1x Rear Bumper Assembly, Paint & Primer',
    notes: 'Insurance claim filed. Vehicle inspected and cleared for operation.',
    serviceProvider: 'Collision Repair Specialists',
    invoiceNumber: 'INV-REP-2024-003',
    createdAt: '2024-02-05'
  },
  {
    _id: '4',
    serviceDate: '2024-02-12',
    unitNumber: 'BRV001',
    makeModel: 'Utility 4000R',
    vinLicensePlate: 'TRL-001 / 1UYVS2534M1234567',
    description: 'Reefer unit compressor failure. Compressor replaced and system recharged.',
    odometer: 44500,
    parts: '1x Compressor Unit, Refrigerant R134a, Oil Filter',
    notes: 'Temperature control system tested. All functions operating correctly.',
    serviceProvider: 'Refrigeration Services Inc.',
    invoiceNumber: 'INV-REP-2024-004',
    createdAt: '2024-02-12'
  },
  {
    _id: '5',
    serviceDate: '2024-02-20',
    unitNumber: '1003',
    makeModel: 'Freightliner Cascadia',
    vinLicensePlate: 'BRV-1003 / 1FUJGHDV5DS345678',
    description: 'Engine overheating issue. Radiator replaced, thermostat replaced, coolant system flushed.',
    odometer: 155000,
    parts: '1x Radiator, 1x Thermostat, 5L Coolant, Hoses',
    notes: 'Engine temperature monitoring system verified. No further issues detected.',
    serviceProvider: 'Diesel Engine Specialists',
    invoiceNumber: 'INV-REP-2024-005',
    createdAt: '2024-02-20'
  },
  {
    _id: '6',
    serviceDate: '2024-02-25',
    unitNumber: 'BRV002',
    makeModel: 'Great Dane',
    vinLicensePlate: 'TRL-002 / 1GRDM2534M2345678',
    description: 'Trailer door hinge replacement. Both rear doors serviced.',
    odometer: 31800,
    parts: '4x Door Hinges, Grease, Hardware',
    notes: 'Doors operate smoothly. Latch mechanism inspected and lubricated.',
    serviceProvider: 'Trailer Repair Services',
    invoiceNumber: 'INV-REP-2024-006',
    createdAt: '2024-02-25'
  }
];

const GeneralRepairsLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<GeneralRepair | null>(null);
  const [repairs, setRepairs] = useState<GeneralRepair[]>(staticRepairs);
  const [formData, setFormData] = useState({
    serviceDate: new Date().toISOString().split('T')[0],
    unitNumber: '',
    description: '',
    odometer: '',
    parts: '',
    notes: '',
    serviceProvider: '',
    invoiceNumber: ''
  });

  // Available units (from Unit Master List)
  const availableUnits = [
    { unitNo: '1001', makeModel: 'Kenworth T680', vinLicense: 'BRV-1001 / 1XKDB0X5XKJ123456' },
    { unitNo: '1002', makeModel: 'Peterbilt 579', vinLicense: 'BRV-1002 / 1NP5DB0X9NW234567' },
    { unitNo: '1003', makeModel: 'Freightliner Cascadia', vinLicense: 'BRV-1003 / 1FUJGHDV5DS345678' },
    { unitNo: 'BRV001', makeModel: 'Utility 4000R', vinLicense: 'TRL-001 / 1UYVS2534M1234567' },
    { unitNo: 'BRV002', makeModel: 'Great Dane', vinLicense: 'TRL-002 / 1GRDM2534M2345678' },
    { unitNo: 'BRV003', makeModel: 'Wabash National', vinLicense: 'TRL-003 / 1WBN2534M3456789' }
  ];

  const filteredRepairs = repairs.filter(repair => {
    return !searchTerm || 
      repair.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleAddRepair = () => {
    setFormData({
      serviceDate: new Date().toISOString().split('T')[0],
      unitNumber: '',
      description: '',
      odometer: '',
      parts: '',
      notes: '',
      serviceProvider: '',
      invoiceNumber: ''
    });
    setShowAddModal(true);
  };

  const handleEditRepair = (repair: GeneralRepair) => {
    setSelectedRepair(repair);
    setFormData({
      serviceDate: repair.serviceDate,
      unitNumber: repair.unitNumber,
      description: repair.description,
      odometer: repair.odometer.toString(),
      parts: repair.parts,
      notes: repair.notes,
      serviceProvider: repair.serviceProvider,
      invoiceNumber: repair.invoiceNumber
    });
    setShowEditModal(true);
  };

  const handleDeleteRepair = (repair: GeneralRepair) => {
    setSelectedRepair(repair);
    setShowDeleteModal(true);
  };

  const handleSaveRepair = () => {
    if (!formData.serviceDate || !formData.unitNumber || !formData.description || !formData.odometer || !formData.serviceProvider || !formData.invoiceNumber) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedUnit = availableUnits.find(u => u.unitNo === formData.unitNumber);

    if (showAddModal) {
      const newRepair: GeneralRepair = {
        _id: Date.now().toString(),
        serviceDate: formData.serviceDate,
        unitNumber: formData.unitNumber,
        makeModel: selectedUnit?.makeModel || '',
        vinLicensePlate: selectedUnit?.vinLicense || '',
        description: formData.description,
        odometer: parseInt(formData.odometer),
        parts: formData.parts,
        notes: formData.notes,
        serviceProvider: formData.serviceProvider,
        invoiceNumber: formData.invoiceNumber,
        createdAt: new Date().toISOString()
      };
      setRepairs([...repairs, newRepair]);
    } else if (showEditModal && selectedRepair) {
      setRepairs(repairs.map(repair => 
        repair._id === selectedRepair._id 
          ? { 
              ...repair, 
              serviceDate: formData.serviceDate,
              unitNumber: formData.unitNumber,
              makeModel: selectedUnit?.makeModel || repair.makeModel,
              vinLicensePlate: selectedUnit?.vinLicense || repair.vinLicensePlate,
              description: formData.description,
              odometer: parseInt(formData.odometer),
              parts: formData.parts,
              notes: formData.notes,
              serviceProvider: formData.serviceProvider,
              invoiceNumber: formData.invoiceNumber
            }
          : repair
      ));
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedRepair(null);
  };

  const handleConfirmDelete = () => {
    if (selectedRepair) {
      setRepairs(repairs.filter(repair => repair._id !== selectedRepair._id));
      setShowDeleteModal(false);
      setSelectedRepair(null);
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
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  General Repairs Log
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Log non-routine repairs (Tires, Brakes, Accident Repairs)
                </p>
              </div>
            </div>
            <button
              onClick={handleAddRepair}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg shadow-lg transition-all duration-200 font-medium hover:opacity-90"
              style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
            >
              <Plus className="w-5 h-5" />
              Add Repair
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by unit number, make/model, invoice, or description..."
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
                  <th className="px-6 py-4 text-left text-sm font-semibold">Service Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Unit Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Make/Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">VIN/License Plate</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Odometer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Parts</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Service Provider</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Invoice Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                      No repairs found
                    </td>
                  </tr>
                ) : (
                  filteredRepairs.map((repair) => (
                    <tr key={repair._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900">
                        {new Date(repair.serviceDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{repair.unitNumber}</td>
                      <td className="px-6 py-4 text-gray-900">{repair.makeModel}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">{repair.vinLicensePlate}</td>
                      <td className="px-6 py-4 text-gray-900 max-w-xs">
                        <div className="truncate" title={repair.description}>
                          {repair.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{repair.odometer.toLocaleString()} km</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs">
                        <div className="truncate" title={repair.parts}>
                          {repair.parts || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{repair.serviceProvider}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">{repair.invoiceNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditRepair(repair)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRepair(repair)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Add/Edit Sidebar */}
        {(showAddModal || showEditModal) && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] transition-all duration-500" onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setSelectedRepair(null);
            }} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  <h2 className="text-2xl font-bold">{showAddModal ? 'Add General Repair' : 'Edit Repair'}</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedRepair(null);
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Date *</label>
                    <input
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Number *</label>
                    <select
                      value={formData.unitNumber}
                      onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    >
                      <option value="">Select Unit</option>
                      {availableUnits.map(unit => (
                        <option key={unit.unitNo} value={unit.unitNo}>
                          {unit.unitNo} - {unit.makeModel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Odometer *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Provider *</label>
                    <input
                      type="text"
                      value={formData.serviceProvider}
                      onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="Name of the shop"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="Be specific, e.g., 'Front right tire blow out - replaced'"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">PARTS</label>
                    <textarea
                      value={formData.parts}
                      onChange={(e) => setFormData({ ...formData, parts: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="List major parts used"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number *</label>
                    <input
                      type="text"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="INV-REP-2024-001"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="e.g., 'Passed post-repair inspection'"
                    />
                  </div>
                </div>
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedRepair(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRepair}
                    className="px-6 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                  >
                    {showAddModal ? 'Add Repair' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedRepair && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]" onClick={() => setShowDeleteModal(false)} />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[9999] w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <FaExclamationCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Repair</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this repair record for unit <strong>{selectedRepair.unitNumber}</strong>?
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

export default GeneralRepairsLog;

