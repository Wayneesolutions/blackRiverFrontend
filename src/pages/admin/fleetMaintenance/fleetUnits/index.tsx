import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Truck, CheckCircle, XCircle, Filter } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

type UnitType = 'Truck' | 'Reefer Trailer' | 'Tri-Axle Trailer' | 'Dry Van' | 'Bus/Van';
type UnitStatus = 'Active' | 'Inactive';
type TruckType = 'Semi-Truck' | 'Straight Truck' | 'Box Truck' | 'Flatbed' | 'Refrigerated Truck' | 'Dump Truck' | 'Tow Truck';
type TrailerType = 'Reefer Trailer' | 'Tri-Axle Trailer' | 'Dry Van' | 'Flatbed' | 'Step Deck' | 'Lowboy' | 'Tank Trailer' | 'Dump Trailer';

interface FleetUnit {
  _id: string;
  unitNo: string;
  unitType: UnitType;
  makeModel: string;
  vinNo: string;
  licensePlate: string;
  year?: number;
  truckType?: TruckType;
  trailerType?: TrailerType;
  capacity?: string;
  initialOdometer: number;
  currentOdometer?: number;
  status: UnitStatus;
  operationStatus?: string;
  lastDate?: string;
  reason?: string;
  // Safety compliance fields
  safetyExpiryDate?: string;
  safetyDecalNumber?: string;
  safetyPaperNumber?: string;
  lastInspectionShop?: string;
  lastInspectionInvoice?: string;
  createdAt: string;
}

// Comprehensive static data combining trucks and trailers
const staticFleetUnits: FleetUnit[] = [
  // Trucks
  {
    _id: '1',
    unitNo: '1001',
    unitType: 'Truck',
    makeModel: 'Kenworth T680',
    vinNo: '1XKDB0X5XKJ123456',
    licensePlate: 'BRV-1001',
    year: 2022,
    truckType: 'Semi-Truck',
    initialOdometer: 0,
    currentOdometer: 125000,
    status: 'Active',
    safetyExpiryDate: '2024-12-15',
    safetyDecalNumber: 'SD-2024-1001',
    safetyPaperNumber: 'SP-2024-1001',
    lastInspectionShop: 'Provincial Safety Inspection',
    lastInspectionInvoice: 'INV-SAF-2024-001',
    createdAt: '2023-01-15'
  },
  {
    _id: '2',
    unitNo: '1002',
    unitType: 'Truck',
    makeModel: 'Peterbilt 579',
    vinNo: '1NP5DB0X9NW234567',
    licensePlate: 'BRV-1002',
    year: 2023,
    truckType: 'Semi-Truck',
    initialOdometer: 0,
    currentOdometer: 98000,
    status: 'Active',
    safetyExpiryDate: '2024-11-20',
    safetyDecalNumber: 'SD-2024-1002',
    safetyPaperNumber: 'SP-2024-1002',
    lastInspectionShop: 'Fleet Safety Services',
    lastInspectionInvoice: 'INV-SAF-2024-002',
    createdAt: '2023-02-20'
  },
  {
    _id: '3',
    unitNo: '1003',
    unitType: 'Truck',
    makeModel: 'Freightliner Cascadia',
    vinNo: '1FUJGHDV5DS345678',
    licensePlate: 'BRV-1003',
    year: 2021,
    truckType: 'Semi-Truck',
    initialOdometer: 0,
    currentOdometer: 156000,
    status: 'Active',
    safetyExpiryDate: '2024-09-30',
    safetyDecalNumber: 'SD-2024-1003',
    safetyPaperNumber: 'SP-2024-1003',
    lastInspectionShop: 'Commercial Vehicle Inspections',
    lastInspectionInvoice: 'INV-SAF-2024-004',
    createdAt: '2022-11-15'
  },
  {
    _id: '4',
    unitNo: '1004',
    unitType: 'Truck',
    makeModel: 'Volvo VNL',
    vinNo: '4V4NC9EH5NN456789',
    licensePlate: 'BRV-1004',
    year: 2020,
    truckType: 'Semi-Truck',
    initialOdometer: 0,
    currentOdometer: 0,
    status: 'Inactive',
    lastDate: '2024-01-15',
    reason: 'SOLD - Replaced with newer unit',
    createdAt: '2021-06-10'
  },
  {
    _id: '5',
    unitNo: '1005',
    unitType: 'Truck',
    makeModel: 'International LT Series',
    vinNo: '1HTMMAMN5MH567890',
    licensePlate: 'BRV-1005',
    year: 2023,
    truckType: 'Box Truck',
    initialOdometer: 0,
    currentOdometer: 45000,
    status: 'Active',
    safetyExpiryDate: '2024-10-10',
    safetyDecalNumber: 'SD-2024-1005',
    safetyPaperNumber: 'SP-2024-1005',
    lastInspectionShop: 'Provincial Safety Inspection',
    lastInspectionInvoice: 'INV-SAF-2024-006',
    createdAt: '2023-03-15'
  },
  // Trailers
  {
    _id: '6',
    unitNo: 'BRV001',
    unitType: 'Reefer Trailer',
    makeModel: 'Utility 4000R',
    vinNo: '1UYVS2534M1234567',
    licensePlate: 'TRL-001',
    year: 2023,
    trailerType: 'Reefer Trailer',
    capacity: '53 ft',
    initialOdometer: 0,
    currentOdometer: 45000,
    status: 'Active',
    operationStatus: 'available',
    safetyExpiryDate: '2024-10-05',
    safetyDecalNumber: 'SD-2024-BRV001',
    safetyPaperNumber: 'SP-2024-BRV001',
    lastInspectionShop: 'Trailer Inspection Center',
    lastInspectionInvoice: 'INV-SAF-2024-003',
    createdAt: '2023-03-10'
  },
  {
    _id: '7',
    unitNo: 'BRV002',
    unitType: 'Tri-Axle Trailer',
    makeModel: 'Great Dane',
    vinNo: '1GRDM2534M2345678',
    licensePlate: 'TRL-002',
    year: 2022,
    trailerType: 'Tri-Axle Trailer',
    capacity: '53 ft',
    initialOdometer: 0,
    currentOdometer: 32000,
    status: 'Active',
    operationStatus: 'in-transit',
    safetyExpiryDate: '2024-08-15',
    safetyDecalNumber: 'SD-2024-BRV002',
    safetyPaperNumber: 'SP-2024-BRV002',
    lastInspectionShop: 'Trailer Inspection Center',
    lastInspectionInvoice: 'INV-SAF-2024-005',
    createdAt: '2023-04-05'
  },
  {
    _id: '8',
    unitNo: 'BRV003',
    unitType: 'Dry Van',
    makeModel: 'Wabash National',
    vinNo: '1WBN2534M3456789',
    licensePlate: 'TRL-003',
    year: 2023,
    trailerType: 'Dry Van',
    capacity: '53 ft',
    initialOdometer: 0,
    currentOdometer: 28000,
    status: 'Active',
    operationStatus: 'available',
    safetyExpiryDate: '2024-07-20',
    safetyDecalNumber: 'SD-2024-BRV003',
    safetyPaperNumber: 'SP-2024-BRV003',
    lastInspectionShop: 'Trailer Inspection Center',
    lastInspectionInvoice: 'INV-SAF-2024-006',
    createdAt: '2023-05-20'
  },
  {
    _id: '9',
    unitNo: 'BRV004',
    unitType: 'Reefer Trailer',
    makeModel: 'Carrier Transicold',
    vinNo: '1CRR2534M4567890',
    licensePlate: 'TRL-004',
    year: 2024,
    trailerType: 'Reefer Trailer',
    capacity: '53 ft',
    initialOdometer: 0,
    currentOdometer: 12000,
    status: 'Active',
    operationStatus: 'available',
    safetyExpiryDate: '2025-01-15',
    safetyDecalNumber: 'SD-2025-BRV004',
    safetyPaperNumber: 'SP-2025-BRV004',
    lastInspectionShop: 'Trailer Inspection Center',
    lastInspectionInvoice: 'INV-SAF-2025-001',
    createdAt: '2024-01-10'
  },
  {
    _id: '10',
    unitNo: 'BRV005',
    unitType: 'Dry Van',
    makeModel: 'East Manufacturing Flatbed',
    vinNo: '1FBP2534M5678901',
    licensePlate: 'TRL-005',
    year: 2022,
    trailerType: 'Flatbed',
    capacity: '48 ft',
    initialOdometer: 0,
    currentOdometer: 55000,
    status: 'Inactive',
    operationStatus: 'maintenance',
    lastDate: '2024-02-10',
    reason: 'Rental returned',
    createdAt: '2022-08-15'
  }
];

const FleetUnits: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'trucks' | 'trailers'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<FleetUnit | null>(null);
  const [units, setUnits] = useState<FleetUnit[]>(staticFleetUnits);
  const [formData, setFormData] = useState({
    unitNo: '',
    unitType: 'Truck' as UnitType,
    makeModel: '',
    vinNo: '',
    licensePlate: '',
    year: new Date().getFullYear().toString(),
    truckType: 'Semi-Truck' as TruckType,
    trailerType: 'Dry Van' as TrailerType,
    capacity: '',
    initialOdometer: '',
    status: 'Active' as UnitStatus,
    operationStatus: 'available',
    lastDate: '',
    reason: ''
  });

  const filteredUnits = useMemo(() => {
    return units.filter(unit => {
      // Tab filter
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'trucks' && unit.unitType === 'Truck') ||
        (activeTab === 'trailers' && (unit.unitType === 'Reefer Trailer' || unit.unitType === 'Tri-Axle Trailer' || unit.unitType === 'Dry Van' || unit.unitType === 'Bus/Van'));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && unit.status === 'Active') ||
        (statusFilter === 'inactive' && unit.status === 'Inactive');
      
      // Search filter
      const matchesSearch = !searchTerm || 
        unit.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.makeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.vinNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTab && matchesStatus && matchesSearch;
    });
  }, [units, activeTab, statusFilter, searchTerm]);

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

  const handleAddUnit = () => {
    setFormData({
      unitNo: '',
      unitType: 'Truck',
      makeModel: '',
      vinNo: '',
      licensePlate: '',
      year: new Date().getFullYear().toString(),
      truckType: 'Semi-Truck',
      trailerType: 'Dry Van',
      capacity: '',
      initialOdometer: '',
      status: 'Active',
      operationStatus: 'available',
      lastDate: '',
      reason: ''
    });
    setShowAddModal(true);
  };

  const handleEditUnit = (unit: FleetUnit) => {
    setSelectedUnit(unit);
    setFormData({
      unitNo: unit.unitNo,
      unitType: unit.unitType,
      makeModel: unit.makeModel,
      vinNo: unit.vinNo,
      licensePlate: unit.licensePlate,
      year: unit.year?.toString() || new Date().getFullYear().toString(),
      truckType: unit.truckType || 'Semi-Truck',
      trailerType: unit.trailerType || 'Dry Van',
      capacity: unit.capacity || '',
      initialOdometer: unit.initialOdometer.toString(),
      status: unit.status,
      operationStatus: unit.operationStatus || 'available',
      lastDate: unit.lastDate || '',
      reason: unit.reason || ''
    });
    setShowEditModal(true);
  };


  const handleDeleteUnit = (unit: FleetUnit) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  };

  const handleSaveUnit = () => {
    if (!formData.unitNo || !formData.makeModel || !formData.vinNo || !formData.licensePlate || !formData.initialOdometer) {
      alert('Please fill in all required fields');
      return;
    }

    if (showAddModal) {
      const newUnit: FleetUnit = {
        _id: Date.now().toString(),
        unitNo: formData.unitNo,
        unitType: formData.unitType,
        makeModel: formData.makeModel,
        vinNo: formData.vinNo,
        licensePlate: formData.licensePlate,
        year: parseInt(formData.year),
        truckType: formData.unitType === 'Truck' ? formData.truckType : undefined,
        trailerType: formData.unitType !== 'Truck' ? formData.trailerType : undefined,
        capacity: formData.unitType !== 'Truck' ? formData.capacity : undefined,
        initialOdometer: parseInt(formData.initialOdometer),
        currentOdometer: parseInt(formData.initialOdometer),
        status: formData.status,
        operationStatus: formData.unitType !== 'Truck' ? formData.operationStatus : undefined,
        lastDate: formData.status === 'Inactive' ? formData.lastDate : undefined,
        reason: formData.status === 'Inactive' ? formData.reason : undefined,
        createdAt: new Date().toISOString()
      };
      setUnits([...units, newUnit]);
    } else if (showEditModal && selectedUnit) {
      setUnits(units.map(unit => 
        unit._id === selectedUnit._id 
          ? { 
              ...unit, 
              unitNo: formData.unitNo,
              unitType: formData.unitType,
              makeModel: formData.makeModel,
              vinNo: formData.vinNo,
              licensePlate: formData.licensePlate,
              year: parseInt(formData.year),
              truckType: formData.unitType === 'Truck' ? formData.truckType : undefined,
              trailerType: formData.unitType !== 'Truck' ? formData.trailerType : undefined,
              capacity: formData.unitType !== 'Truck' ? formData.capacity : undefined,
              initialOdometer: parseInt(formData.initialOdometer),
              status: formData.status,
              operationStatus: formData.unitType !== 'Truck' ? formData.operationStatus : unit.operationStatus,
              lastDate: formData.status === 'Inactive' ? formData.lastDate : undefined,
              reason: formData.status === 'Inactive' ? formData.reason : undefined
            }
          : unit
      ));
    }

    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedUnit(null);
  };


  const handleConfirmDelete = () => {
    if (selectedUnit) {
      setUnits(units.filter(unit => unit._id !== selectedUnit._id));
      setShowDeleteModal(false);
      setSelectedUnit(null);
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

  const activeCount = units.filter(u => u.status === 'Active').length;
  const trucksCount = units.filter(u => u.unitType === 'Truck').length;
  const trailersCount = units.filter(u => u.unitType !== 'Truck').length;

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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Units</p>
                <p className="text-3xl font-bold" style={{ color: '#016ab2' }}>{units.length}</p>
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
              All Units ({units.length})
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
                  <th className="px-6 py-4 text-left text-sm font-semibold min-w-[180px]">Safety Expiry</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Comment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'trailers' ? 12 : 11} className="px-6 py-12 text-center text-gray-500">
                      No units found
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((unit) => {
                    const compliance = getComplianceStatus(unit.safetyExpiryDate);
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
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {unit.unitType}
                            </span>
                            {unit.truckType && (
                              <span className="text-xs text-gray-500">{unit.truckType}</span>
                            )}
                            {unit.trailerType && (
                              <span className="text-xs text-gray-500">{unit.trailerType}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{unit.makeModel}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{unit.vinNo}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{unit.licensePlate}</td>
                        <td className="px-6 py-4 text-gray-900">{unit.year || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-900">
                          {unit.currentOdometer !== undefined ? unit.currentOdometer.toLocaleString() : unit.initialOdometer.toLocaleString()} km
                        </td>
                        {activeTab === 'trailers' && (
                          <td className="px-6 py-4 text-gray-900">{unit.capacity || 'N/A'}</td>
                        )}
                        <td className="px-6 py-4 min-w-[180px]">
                          {unit.safetyExpiryDate ? (
                            <div className="flex flex-col gap-2">
                              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                {formatDate(unit.safetyExpiryDate)}
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
                        <option value="Reefer Trailer">Reefer Trailer</option>
                        <option value="Tri-Axle Trailer">Tri-Axle Trailer</option>
                        <option value="Dry Van">Dry Van</option>
                        <option value="Bus/Van">Bus/Van</option>
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
                            <option value="available">Available</option>
                            <option value="in-transit">In Transit</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="idle">Idle</option>
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
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUnit}
                      className="px-6 py-2 !text-white rounded-lg transition-colors hover:opacity-90"
                      style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                    >
                      {showAddModal ? 'Add Fleet' : 'Save Changes'}
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
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]" onClick={() => setShowDeleteModal(false)} />
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
                    onClick={() => setShowDeleteModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-6 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 transition-colors"
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

export default FleetUnits;

