import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Truck, CheckCircle, XCircle, Filter, MapPin } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import {
  listFleetUnits,
  createFleetUnit as apiCreateFleetUnit,
  updateFleetUnit as apiUpdateFleetUnit,
  deleteFleetUnit as apiDeleteFleetUnit,
  type FleetUnitDto,
  type FleetUnitSummary
} from '../../../../axios/api/fleet.units';

type UnitType = 'Truck' | 'Trailer';
type UnitStatus = 'Active' | 'Inactive';
type TruckType = 'Semi-Truck' | 'Straight Truck' | 'Box Truck' | 'Flatbed' | 'Refrigerated Truck' | 'Dump Truck' | 'Tow Truck';
type TrailerType = 'Reefer Trailer' | 'Tri-Axle Trailer' | 'Dry Van' | 'Flatbed' | 'Step Deck' | 'Lowboy' | 'Tank Trailer' | 'Dump Trailer';

type FleetUnit = FleetUnitDto & {
  source?: 'vehicle' | 'trailer' | 'custom';
};

interface FleetUnitFormData {
  unitNo: string;
  internalId: string;
  unitType: UnitType;
  makeModel: string;
  vinNo: string;
  licensePlate: string;
  year: string;
  truckType: TruckType;
  trailerType: TrailerType;
  capacity: string;
  initialOdometer: string;
  currentOdometer: string;
  status: UnitStatus;
  operationStatus: string;
  address: string;
  lastDate: string;
  reason: string;
}

const defaultSummary: FleetUnitSummary = {
  totalUnits: 0,
  activeUnits: 0,
  inactiveUnits: 0,
  trucks: 0,
  trailers: 0,
  expiringSoon: 0,
  expired: 0
};

const FleetUnits: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'trucks' | 'trailers'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<FleetUnit | null>(null);
  const [units, setUnits] = useState<FleetUnit[]>([]);
  const [summary, setSummary] = useState<FleetUnitSummary>(defaultSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [requiresCompanySetup, setRequiresCompanySetup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FleetUnitFormData>({
    unitNo: '',
    internalId: '',
    unitType: 'Truck',
    makeModel: '',
    vinNo: '',
    licensePlate: '',
    year: new Date().getFullYear().toString(),
    truckType: 'Semi-Truck',
    trailerType: 'Dry Van',
    capacity: '',
    initialOdometer: '',
    currentOdometer: '',
    status: 'Active',
    operationStatus: 'available',
    address: '',
    lastDate: '',
    reason: ''
  });

  const resetForm = () => {
    setFormData({
      unitNo: '',
      internalId: '',
      unitType: 'Truck',
      makeModel: '',
      vinNo: '',
      licensePlate: '',
      year: new Date().getFullYear().toString(),
      truckType: 'Semi-Truck',
      trailerType: 'Dry Van',
      capacity: '',
      initialOdometer: '',
      currentOdometer: '',
      status: 'Active',
      operationStatus: 'available',
      address: '',
      lastDate: '',
      reason: ''
    });
    setFormError(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadFleetUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listFleetUnits({
        search: debouncedSearchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: activeTab
      });

      if (response?.success) {
        setUnits(response.data || []);
        setSummary(response.summary || defaultSummary);
        setRequiresCompanySetup(!!response.requiresCompanySetup);
      } else {
        setUnits([]);
        setSummary(defaultSummary);
        setError(response?.message || 'Failed to fetch fleet units');
      }
    } catch (err: any) {
      setUnits([]);
      setSummary(defaultSummary);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch fleet units');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    loadFleetUnits();
  }, [loadFleetUnits]);

  const handleAddUnit = () => {
    resetForm();
    setSelectedUnit(null);
    setShowAddModal(true);
  };

  const handleEditUnit = (unit: FleetUnit) => {
    setSelectedUnit(unit);
    setFormData({
      unitNo: unit.unitNo,
      internalId: unit.internalId || '',
      unitType: unit.unitType as UnitType,
      makeModel: unit.makeModel,
      vinNo: unit.vinNo,
      licensePlate: unit.licensePlate,
      year: unit.year?.toString() || '',
      truckType: (unit.truckType as TruckType) || 'Semi-Truck',
      trailerType: (unit.trailerType as TrailerType) || 'Dry Van',
      capacity: unit.capacity || '',
      initialOdometer: unit.initialOdometer?.toString() || '',
      currentOdometer: (unit.currentOdometer ?? unit.initialOdometer ?? 0).toString(),
      status: unit.status as UnitStatus,
      operationStatus: unit.operationStatus || 'available',
      address: unit.currentLocation?.address || '',
      lastDate: unit.lastDate ? unit.lastDate.slice(0, 10) : '',
      reason: unit.reason || ''
    });
    setFormError(null);
    setShowEditModal(true);
  };


  const handleDeleteUnit = (unit: FleetUnit) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  };

  const handleSaveUnit = async () => {
    setFormError(null);
    if (!formData.unitNo || !formData.makeModel || !formData.vinNo || !formData.licensePlate || !formData.initialOdometer) {
      setFormError('Please fill in all required fields highlighted with *');
      return;
    }

    // Map UnitType to FleetUnitType - if it's just "Trailer", use the selected trailerType
    const mappedUnitType: import('../../../../axios/api/fleet.units').FleetUnitType = 
      formData.unitType === 'Truck' 
        ? 'Truck' 
        : (formData.trailerType as import('../../../../axios/api/fleet.units').FleetUnitType) || 'Dry Van';

    const payload: import('../../../../axios/api/fleet.units').FleetUnitPayload = {
      unitNo: formData.unitNo.trim(),
      internalId: formData.internalId.trim() || undefined,
      unitType: mappedUnitType,
      makeModel: formData.makeModel.trim(),
      vinNo: formData.vinNo.trim(),
      licensePlate: formData.licensePlate.trim(),
      year: formData.year ? Number(formData.year) : undefined,
      truckType: formData.unitType === 'Truck' ? formData.truckType : undefined,
      trailerType: formData.unitType !== 'Truck' ? formData.trailerType : undefined,
      capacity: formData.unitType !== 'Truck' ? formData.capacity : undefined,
      initialOdometer: formData.initialOdometer ? Number(formData.initialOdometer) : 0,
      currentOdometer: formData.currentOdometer
        ? Number(formData.currentOdometer)
        : formData.initialOdometer
          ? Number(formData.initialOdometer)
          : 0,
      status: formData.status,
      operationStatus: formData.unitType !== 'Truck' ? formData.operationStatus : undefined,
      address: formData.address.trim() || undefined,
      lastDate: formData.status === 'Inactive' ? formData.lastDate || undefined : undefined,
      reason: formData.status === 'Inactive' ? formData.reason || undefined : undefined
    };

    setSaving(true);
    try {
      if (showAddModal) {
        const response = await apiCreateFleetUnit(payload);
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to create fleet unit');
        }
        setNotification({ type: 'success', message: 'Fleet unit added successfully.' });
    } else if (showEditModal && selectedUnit) {
        const response = await apiUpdateFleetUnit(selectedUnit._id, payload);
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to update fleet unit');
        }
        setNotification({ type: 'success', message: 'Fleet unit updated successfully.' });
      }
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedUnit(null);
      resetForm();
      await loadFleetUnits();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to save fleet unit';
      setFormError(message);
      setNotification({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };


  const handleConfirmDelete = async () => {
    if (!selectedUnit) return;
    setDeleting(true);
    try {
      const response = await apiDeleteFleetUnit(selectedUnit._id);
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to delete fleet unit');
      }
      setNotification({ type: 'success', message: 'Fleet unit deleted successfully.' });
      setShowDeleteModal(false);
      setSelectedUnit(null);
      await loadFleetUnits();
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete fleet unit';
      setNotification({ type: 'error', message });
    } finally {
      setDeleting(false);
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

  const trailerTypes: TrailerType[] = [
    'Reefer Trailer',
    'Tri-Axle Trailer',
    'Dry Van',
    'Flatbed',
    'Step Deck',
    'Lowboy',
    'Tank Trailer',
    'Dump Trailer'
  ];
  const operationStatuses = ['available', 'in-transit', 'maintenance', 'idle'];

  const activeCount = summary.activeUnits;
  const trucksCount = summary.trucks;
  const trailersCount = summary.trailers;
  const totalUnitsCount = summary.totalUnits;

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
                  Fleet 
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Comprehensive management of all trucks and trailers
                </p>
              </div>
            </div>
            <button
              onClick={handleAddUnit}
              className="flex items-center gap-2 px-6 py-3 !text-white rounded-lg shadow-lg transition-all duration-200 font-medium hover:opacity-90"
              style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
            >
              <Plus className="w-5 h-5" />
              Add fleet
            </button>
          </div>
        </div>

        {requiresCompanySetup && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            Please complete your company settings to view and manage fleet units.
          </div>
        )}

        {notification && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 ${
              notification.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {notification.message}
          </div>
        )}

        {error && !requiresCompanySetup && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Units</p>
                <p className="text-3xl font-bold" style={{ color: '#016ab2' }}>{totalUnitsCount}</p>
              </div>
              <Truck className="text-gray-400" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Active Units</p>
                <p className="text-3xl font-bold text-green-600">{activeCount}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Trucks</p>
                <p className="text-3xl font-bold" style={{ color: '#398bc3' }}>{trucksCount}</p>
              </div>
              <Truck className="text-blue-400" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Trailers</p>
                <p className="text-3xl font-bold" style={{ color: '#063f6f' }}>{trailersCount}</p>
              </div>
              <Truck className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'all'
                  ? '!text-white border-b-2'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === 'all' ? { background: 'linear-gradient(to right, #016ab2, #063f6f)', borderColor: '#016ab2' } : {}}
            >
              All Units ({totalUnitsCount})
            </button>
            <button
              onClick={() => setActiveTab('trucks')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'trucks'
                  ? '!text-white border-b-2'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === 'trucks' ? { background: 'linear-gradient(to right, #016ab2, #063f6f)', borderColor: '#016ab2' } : {}}
            >
              Trucks ({trucksCount})
            </button>
            <button
              onClick={() => setActiveTab('trailers')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'trailers'
                  ? '!text-white border-b-2'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === 'trailers' ? { background: 'linear-gradient(to right, #016ab2, #063f6f)', borderColor: '#016ab2' } : {}}
            >
              Trailers ({trailersCount})
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by unit number, make/model, plate, or VIN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                  onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                  onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Unit No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Make/Model</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">VIN No.</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">License Plate</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Year</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Odometer</th>
                  {activeTab === 'trailers' && (
                    <th className="px-6 py-4 text-left text-sm font-semibold">Capacity</th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Comment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={activeTab === 'trailers' ? 11 : 10} className="px-6 py-12 text-center text-gray-500">
                      Loading fleet units...
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'trailers' ? 11 : 10} className="px-6 py-12 text-center text-gray-500">
                      {requiresCompanySetup
                        ? 'Please complete your company settings to manage fleet units.'
                        : error || 'No units found'}
                    </td>
                  </tr>
                ) : (
                  units.map((unit) => {
                    return (
                      <tr key={unit._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{unit.unitNo}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              unit.unitType === 'Truck' ? 'bg-blue-100 text-blue-800' :
                              unit.unitType === 'Reefer Trailer' ? 'bg-green-100 text-green-800' :
                              unit.unitType === 'Tri-Axle Trailer' ? 'bg-orange-100 text-orange-800' :
                              unit.unitType === 'Dry Van' ? 'bg-purple-100 text-purple-800' :
                          unit.unitType === 'Flatbed' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {unit.unitType}
                            </span>
                        {unit.truckType && unit.truckType !== unit.unitType && (
                              <span className="text-xs text-gray-500">{unit.truckType}</span>
                            )}
                        {unit.trailerType && unit.trailerType !== unit.unitType && (
                              <span className="text-xs text-gray-500">{unit.trailerType}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{unit.makeModel}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{unit.vinNo}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {unit.licensePlate}
                          {unit.source && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              {unit.source === 'vehicle'
                                ? 'Vehicle'
                                : unit.source === 'trailer'
                                  ? 'Trailer'
                                  : 'Custom'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900">{unit.year || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-900">
                          {unit.currentOdometer !== undefined ? unit.currentOdometer.toLocaleString() : unit.initialOdometer.toLocaleString()} km
                        </td>
                        {activeTab === 'trailers' && (
                          <td className="px-6 py-4 text-gray-900">{unit.capacity || 'N/A'}</td>
                        )}
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            unit.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {unit.status === 'Active' ? (
                              <><FaCheckCircle className="mr-1" size={12} /> Active</>
                            ) : (
                              <><XCircle className="mr-1" size={12} /> Inactive</>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {unit.status === 'Inactive' && unit.reason ? (
                            <span className="text-gray-700">{unit.reason}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditUnit(unit)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(unit)}
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
              setSelectedUnit(null);
              resetForm();
            }} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  <h2 className="text-2xl font-bold">{showAddModal ? 'Add New Unit' : 'Edit Unit'}</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedUnit(null);
                      resetForm();
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {formError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit No. *</label>
                      <input
                        type="text"
                        value={formData.unitNo}
                        onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        placeholder="e.g., 1001, BRV001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Internal ID</label>
                      <input
                        type="text"
                        value={formData.internalId}
                        onChange={(e) => setFormData({ ...formData, internalId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        placeholder="e.g., INT-001, GEO-123"
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional: For Geotab or other tracking system integration</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type *</label>
                      <select
                        value={formData.unitType}
                        onChange={(e) => setFormData({ ...formData, unitType: e.target.value as UnitType })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      >
                        <option value="Truck">Truck</option>
                        <option value="Trailer">Trailer</option>
                     
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Make/Model *</label>
                      <input
                        type="text"
                        value={formData.makeModel}
                        onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        placeholder="e.g., Kenworth T680"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">VIN No. *</label>
                      <input
                        type="text"
                        value={formData.vinNo}
                        onChange={(e) => setFormData({ ...formData, vinNo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-mono"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        placeholder="17-character VIN"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">License Plate *</label>
                      <input
                        type="text"
                        value={formData.licensePlate}
                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        placeholder="e.g., BRV-1001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
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
                    {formData.unitType === 'Truck' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Truck Type</label>
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
                    )}
                    {formData.unitType !== 'Truck' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Trailer Type</label>
                          <select
                            value={formData.trailerType}
                            onChange={(e) => setFormData({ ...formData, trailerType: e.target.value as TrailerType })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                            onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          >
                            {trailerTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                          <input
                            type="text"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                            onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                            placeholder="e.g., 53 ft"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Operation Status</label>
                          <select
                            value={formData.operationStatus}
                            onChange={(e) => setFormData({ ...formData, operationStatus: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                            onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          >
                            {operationStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.replace('-', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Initial Odometer/Hour *</label>
                      <input
                        type="number"
                        value={formData.initialOdometer}
                        onChange={(e) => setFormData({ ...formData, initialOdometer: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Odometer/Hour</label>
                      <input
                        type="number"
                        value={formData.currentOdometer}
                        onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as UnitStatus })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Current Location</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                            onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                            placeholder="123 Main St, City, State, Country"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Coordinates will be automatically fetched from this address using Google Maps
                        </p>
                      </div>
                    </div>
                    {formData.status === 'Inactive' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Date *</label>
                          <input
                            type="date"
                            value={formData.lastDate}
                            onChange={(e) => setFormData({ ...formData, lastDate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                            onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reason/Comment *</label>
                          <input
                            type="text"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                            onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                            placeholder="SOLD, Rental returned, Scrapped, etc."
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t mt-6">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setSelectedUnit(null);
                        resetForm();
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUnit}
                      disabled={saving}
                      className={`px-6 py-2 !text-white rounded-lg transition-colors ${
                        saving ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
                      }`}
                      style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                    >
                      {saving ? 'Saving...' : showAddModal ? 'Add Fleet' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUnit && (
          <>
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUnit(null);
              }}
            />
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-[9999] w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <FaExclamationCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Delete Unit</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete unit <strong>{selectedUnit.unitNo}</strong> ({selectedUnit.makeModel})?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUnit(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className={`px-6 py-2 rounded-lg !text-white transition-colors ${
                      deleting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
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

export default FleetUnits;

