import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Calendar, Wrench, FileText } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

type ServiceType = 'Oil Change' | 'DPF Filter' | 'Valve Adjustment' | 'Radiator Change' | 'Oil Pump' | 'Coolant Filter' | 'After Treatment System' | 'Transmission Service' | 'Brake Inspection';

interface ScheduledService {
  _id: string;
  serviceDate: string;
  unitNo: string;
  unitType: string;
  makeModel: string;
  serviceType: ServiceType;
  odometer: number;
  invoiceNo: string;
  notes: string;
  createdAt: string;
}

// Static data for scheduled services
const staticServices: ScheduledService[] = [
  {
    _id: '1',
    serviceDate: '2024-01-15',
    unitNo: '1001',
    unitType: 'Truck',
    makeModel: 'Kenworth T680',
    serviceType: 'Oil Change',
    odometer: 125000,
    invoiceNo: 'INV-2024-001',
    notes: 'Regular scheduled maintenance. All filters replaced.',
    createdAt: '2024-01-15'
  },
  {
    _id: '2',
    serviceDate: '2024-01-20',
    unitNo: '1002',
    unitType: 'Truck',
    makeModel: 'Peterbilt 579',
    serviceType: 'DPF Filter',
    odometer: 98000,
    invoiceNo: 'INV-2024-002',
    notes: 'DPF filter cleaned and inspected. No issues found.',
    createdAt: '2024-01-20'
  },
  {
    _id: '3',
    serviceDate: '2024-01-25',
    unitNo: '1001',
    unitType: 'Truck',
    makeModel: 'Kenworth T680',
    serviceType: 'Valve Adjustment',
    odometer: 125500,
    invoiceNo: 'INV-2024-003',
    notes: 'Valve clearance adjusted to specifications.',
    createdAt: '2024-01-25'
  },
  {
    _id: '4',
    serviceDate: '2024-02-01',
    unitNo: 'BRV001',
    unitType: 'Reefer Trailer',
    makeModel: 'Utility 4000R',
    serviceType: 'Coolant Filter',
    odometer: 45000,
    invoiceNo: 'INV-2024-004',
    notes: 'Coolant filter replaced. System flushed.',
    createdAt: '2024-02-01'
  },
  {
    _id: '5',
    serviceDate: '2024-02-05',
    unitNo: '1003',
    unitType: 'Truck',
    makeModel: 'Freightliner Cascadia',
    serviceType: 'After Treatment System',
    odometer: 156000,
    invoiceNo: 'INV-2024-005',
    notes: 'After treatment system serviced. DEF tank refilled.',
    createdAt: '2024-02-05'
  },
  {
    _id: '6',
    serviceDate: '2024-02-10',
    unitNo: '1002',
    unitType: 'Truck',
    makeModel: 'Peterbilt 579',
    serviceType: 'Transmission Service',
    odometer: 99000,
    invoiceNo: 'INV-2024-006',
    notes: 'Transmission fluid changed. Filter replaced.',
    createdAt: '2024-02-10'
  },
  {
    _id: '7',
    serviceDate: '2024-02-15',
    unitNo: '1001',
    unitType: 'Truck',
    makeModel: 'Kenworth T680',
    serviceType: 'Radiator Change',
    odometer: 126000,
    invoiceNo: 'INV-2024-007',
    notes: 'Radiator replaced due to leak. System pressure tested.',
    createdAt: '2024-02-15'
  },
  {
    _id: '8',
    serviceDate: '2024-02-20',
    unitNo: 'BRV002',
    unitType: 'Tri-Axle Trailer',
    makeModel: 'Great Dane',
    serviceType: 'Brake Inspection',
    odometer: 32000,
    invoiceNo: 'INV-2024-008',
    notes: 'Full brake inspection. All components within spec.',
    createdAt: '2024-02-20'
  }
];

const ScheduledServicesLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ScheduledService | null>(null);
  const [services, setServices] = useState<ScheduledService[]>(staticServices);
  const [formData, setFormData] = useState({
    serviceDate: new Date().toISOString().split('T')[0],
    unitNo: '',
    serviceType: 'Oil Change' as ServiceType,
    odometer: '',
    invoiceNo: '',
    notes: ''
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

  const filteredServices = services.filter(service => {
    const matchesSearch = !searchTerm || 
      service.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterServiceType === 'all' || service.serviceType === filterServiceType;
    return matchesSearch && matchesType;
  });

  const handleAddService = () => {
    setFormData({
      serviceDate: new Date().toISOString().split('T')[0],
      unitNo: '',
      serviceType: 'Oil Change',
      odometer: '',
      invoiceNo: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleEditService = (service: ScheduledService) => {
    setSelectedService(service);
    setFormData({
      serviceDate: service.serviceDate,
      unitNo: service.unitNo,
      serviceType: service.serviceType,
      odometer: service.odometer.toString(),
      invoiceNo: service.invoiceNo,
      notes: service.notes
    });
    setShowEditModal(true);
  };

  const handleDeleteService = (service: ScheduledService) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleSaveService = () => {
    if (!formData.serviceDate || !formData.unitNo || !formData.serviceType || !formData.odometer || !formData.invoiceNo) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedUnit = availableUnits.find(u => u.unitNo === formData.unitNo);

    if (showAddModal) {
      const newService: ScheduledService = {
        _id: Date.now().toString(),
        serviceDate: formData.serviceDate,
        unitNo: formData.unitNo,
        unitType: selectedUnit?.unitType || '',
        makeModel: selectedUnit?.makeModel || '',
        serviceType: formData.serviceType,
        odometer: parseInt(formData.odometer),
        invoiceNo: formData.invoiceNo,
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };
      setServices([...services, newService]);
    } else if (showEditModal && selectedService) {
      setServices(services.map(service => 
        service._id === selectedService._id 
          ? { 
              ...service, 
              serviceDate: formData.serviceDate,
              unitNo: formData.unitNo,
              unitType: selectedUnit?.unitType || service.unitType,
              makeModel: selectedUnit?.makeModel || service.makeModel,
              serviceType: formData.serviceType,
              odometer: parseInt(formData.odometer),
              invoiceNo: formData.invoiceNo,
              notes: formData.notes
            }
          : service
      ));
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedService(null);
  };

  const handleConfirmDelete = () => {
    if (selectedService) {
      setServices(services.filter(service => service._id !== selectedService._id));
      setShowDeleteModal(false);
      setSelectedService(null);
    }
  };

  const serviceTypes: ServiceType[] = [
    'Oil Change',
    'DPF Filter',
    'Valve Adjustment',
    'Radiator Change',
    'Oil Pump',
    'Coolant Filter',
    'After Treatment System',
    'Transmission Service',
    'Brake Inspection'
  ];

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
                  Scheduled Services Log
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Log repetitive maintenance (Oil Change, DPF, etc.)
                </p>
              </div>
            </div>
            <button
              onClick={handleAddService}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg shadow-lg transition-all duration-200 font-medium hover:opacity-90"
              style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
            >
              <Plus className="w-5 h-5" />
              Add Service
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by unit number, make/model, or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
              onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Service Type:</label>
              <select
                value={filterServiceType}
                onChange={(e) => setFilterServiceType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
              onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
              onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
              >
                <option value="all">All Types</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Service Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Unit No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Unit Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Make/Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Service Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Odometer/Hour</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Invoice No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Notes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No services found
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((service) => (
                    <tr key={service._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900">
                        {new Date(service.serviceDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{service.unitNo}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {service.unitType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{service.makeModel}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: '#398bc3', color: '#063f6f' }}>
                          {service.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{service.odometer.toLocaleString()} km</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">{service.invoiceNo}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={service.notes}>
                        {service.notes || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service)}
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
              setSelectedService(null);
            }} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  <h2 className="text-2xl font-bold">{showAddModal ? 'Add Scheduled Service' : 'Edit Service'}</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedService(null);
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as ServiceType })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    >
                      {serviceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Odometer/Hour *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice No. *</label>
                    <input
                      type="text"
                      value={formData.invoiceNo}
                      onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="INV-2024-001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                    onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                    onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                    placeholder="Any special notes from the mechanic..."
                  />
                </div>
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedService(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveService}
                    className="px-6 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                  >
                    {showAddModal ? 'Add Service' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedService && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]" onClick={() => setShowDeleteModal(false)} />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[9999] w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <FaExclamationCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Service</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this service record for unit <strong>{selectedService.unitNo}</strong>?
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

export default ScheduledServicesLog;

