import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { CSSProperties } from 'react';
import ExcelJS from 'exceljs';
import { Plus, Edit, Trash2, Search, Download, AlertCircle, Clock } from 'lucide-react';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';
import {
  listVehicleServices,
  createVehicleService,
  updateVehicleService,
  deleteVehicleService,
  type VehicleServiceData,
  type VehicleServiceResponse,
  type VehicleServiceType,
  type ServiceFilters
} from '../../../../axios/api/vehicleService';
import { listFleetUnits, type FleetUnitDto } from '../../../../axios/api/fleet.units';
import { FLEET_COLORS } from '../colorUtils';

const ACCENT_PRIMARY = FLEET_COLORS.primary;
const ACCENT_DARK = FLEET_COLORS.dark;
const hexToRgba = (hex: string, alpha = 1) => {
  const parsed = hex.replace('#', '');
  const bigint = parseInt(parsed, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const ACCENT_SOFT = hexToRgba(ACCENT_PRIMARY, 0.1);
const ACCENT_SOFT_BORDER = hexToRgba(ACCENT_PRIMARY, 0.25);
const ACCENT_VARS = {
  '--accent-color': ACCENT_PRIMARY,
  '--accent-dark': ACCENT_DARK,
  '--accent-soft': ACCENT_SOFT,
  '--accent-soft-border': ACCENT_SOFT_BORDER
} as CSSProperties;

const SERVICE_TYPE_OPTIONS: { label: string; value: VehicleServiceType }[] = [
  { label: 'Oil Change', value: 'oil-change' },
  { label: 'DPF Filter', value: 'dpf-filter' },
  { label: 'Valve Adjustment', value: 'valve-adjustment' },
  { label: 'Radiator Change', value: 'radiator-change' },
  { label: 'Oil Pump', value: 'oil-pump' },
  { label: 'Coolant Filter', value: 'coolant-filter' },
  { label: 'After Treatment System', value: 'after-treatment-system' },
  { label: 'Transmission Service', value: 'transmission-service' },
  { label: 'Brake Inspection', value: 'brake-inspection' }
];

type ServiceTypeFilter = 'all' | VehicleServiceType;

interface ScheduledService {
  _id: string;
  unitNo: string;
  unitType?: string;
  makeModel?: string;
  serviceType: VehicleServiceType;
  serviceDate?: string;
  dueDate?: string;
  dueMileage?: number;
  odometer?: number;
  invoiceNo?: string;
  notes?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: string;
}

interface UnitOption {
  unitNo: string;
  unitType?: string;
  makeModel?: string;
  referenceType?: string;
  referenceId?: string;
}

const getServiceTypeLabel = (value: string) => {
  const match = SERVICE_TYPE_OPTIONS.find(option => option.value === value);
  if (match) return match.label;
  return value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

interface ServiceFormState {
  serviceDate: string;
  unitNo: string;
  serviceType: VehicleServiceType;
  odometer: string;
  invoiceNo: string;
  notes: string;
}

const ScheduledServicesLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<ServiceTypeFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ScheduledService | null>(null);
  const [services, setServices] = useState<ScheduledService[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormState>({
    serviceDate: new Date().toISOString().split('T')[0],
    unitNo: '',
    serviceType: SERVICE_TYPE_OPTIONS[0].value,
    odometer: '',
    invoiceNo: '',
    notes: ''
  });

  const mapApiService = useCallback((service: VehicleServiceResponse): ScheduledService => {
    const unitNo =
      service.unitNumber ||
      service.vehicleId?.internalId ||
      service.vehicleId?.plateNumber ||
      'N/A';
    const makeModel =
      service.makeModel ||
      [service.vehicleId?.make, service.vehicleId?.model].filter(Boolean).join(' ').trim() ||
      undefined;
    return {
      _id: service._id,
      unitNo,
      unitType: service.unitType || (service.vehicleId ? 'Truck' : undefined),
      makeModel,
      serviceType: service.serviceType,
      serviceDate: service.serviceDate || undefined,
      dueDate: service.dueDate || undefined,
      dueMileage: service.dueMileage ?? undefined,
      odometer: service.odometer ?? undefined,
      invoiceNo: service.invoiceNumber || undefined,
      notes: service.notes || undefined,
      status: service.status,
      priority: service.priority
    };
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const response = await listFleetUnits({ category: 'all' });
      if (response?.success) {
        const unitOptions =
          (response.data as FleetUnitDto[] | undefined)?.map((unit) => ({
            unitNo: unit.unitNo,
            unitType: unit.unitType,
            makeModel: unit.makeModel,
            referenceType: unit.referenceType,
            referenceId: unit.referenceId
          })) || [];
        setUnits(unitOptions);
      }
    } catch (err) {
      console.error('Failed to load units', err);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: ServiceFilters = {};
      if (filterServiceType !== 'all') {
        filters.serviceType = filterServiceType;
      }
      const response = await listVehicleServices(filters);
      if (response?.success) {
        const mapped =
          (response.data as VehicleServiceResponse[] | undefined)?.map(mapApiService) || [];
        setServices(mapped);
      } else {
        setServices([]);
        setError(response?.message || 'Failed to fetch services');
      }
    } catch (err: any) {
      setServices([]);
      setError(err?.message || 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, [filterServiceType, mapApiService]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !searchTerm ||
        service.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.makeModel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterServiceType === 'all' || service.serviceType === filterServiceType;
      return matchesSearch && matchesType;
    });
  }, [services, searchTerm, filterServiceType]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Calculate incoming maintenance (services due within next 7,500 km or 30 days)
    const incomingServices = services.filter((service) => {
      if (service.status === 'completed') return false;

      // Check if service has a due date within 30 days
      if (service.dueDate) {
        const dueDate = new Date(service.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue >= 0 && daysUntilDue <= 30) {
          return true;
        }
      }

      // Check if service is due based on mileage (within 7,500 km)
      if (service.dueMileage && service.odometer !== undefined) {
        const remainingKm = service.dueMileage - service.odometer;
        if (remainingKm >= 0 && remainingKm <= 7500) {
          return true;
        }
      }

      // Include all pending and in-progress services as incoming maintenance
      return service.status === 'pending' || service.status === 'in-progress';
    });

    const incomingMaintenance = incomingServices.length;

    // Get breakdown by status
    const incomingByStatus = {
      pending: incomingServices.filter(s => s.status === 'pending').length,
      inProgress: incomingServices.filter(s => s.status === 'in-progress').length,
      dueSoon: incomingServices.filter(s => {
        if (!s.dueDate) return false;
        const dueDate = new Date(s.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 7;
      }).length
    };

    // Get unique units needing maintenance
    const unitsNeedingMaintenance = new Set(incomingServices.map(s => s.unitNo)).size;

    // Recent activity - completed services in last 30 days
    const recentServices = services.filter((service) => {
      if (service.status !== 'completed') return false;
      if (!service.serviceDate) return false;
      const serviceDate = new Date(service.serviceDate);
      serviceDate.setHours(0, 0, 0, 0);
      return serviceDate >= thirtyDaysAgo;
    });

    const recentActivity = recentServices.length;

    // Get most recent service date
    const mostRecentDate = recentServices.length > 0
      ? recentServices
        .map(s => s.serviceDate ? new Date(s.serviceDate) : null)
        .filter(Boolean)
        .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0]
      : null;

    // Get service type breakdown for recent activity
    const serviceTypeBreakdown = recentServices.reduce((acc, service) => {
      const type = getServiceTypeLabel(service.serviceType);
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topServiceType = Object.entries(serviceTypeBreakdown)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      incomingMaintenance,
      incomingByStatus,
      unitsNeedingMaintenance,
      recentActivity,
      mostRecentDate,
      topServiceType: topServiceType ? `${topServiceType[0]} (${topServiceType[1]})` : null
    };
  }, [services, units]);

  const handleExportServices = async () => {
    if (!filteredServices.length) {
      alert('No scheduled services available to export.');
      return;
    }

    try {
      setExporting(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Scheduled Services');

      worksheet.columns = [
        { header: 'Unit Number', key: 'unitNo', width: 16 },
        { header: 'Unit Type', key: 'unitType', width: 14 },
        { header: 'Make / Model', key: 'makeModel', width: 24 },
        { header: 'Service Type', key: 'serviceType', width: 24 },
        { header: 'Service Date', key: 'serviceDate', width: 16 },
        { header: 'Due Date', key: 'dueDate', width: 16 },
        { header: 'Odometer', key: 'odometer', width: 14 },
        { header: 'Invoice #', key: 'invoiceNo', width: 16 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Priority', key: 'priority', width: 14 },
        { header: 'Notes', key: 'notes', width: 32 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0EA5E9' }
      };

      filteredServices.forEach((service) => {
        worksheet.addRow({
          unitNo: service.unitNo,
          unitType: service.unitType || 'N/A',
          makeModel: service.makeModel || 'N/A',
          serviceType: getServiceTypeLabel(service.serviceType),
          serviceDate: formatDate(service.serviceDate),
          dueDate: formatDate(service.dueDate),
          odometer: service.odometer ?? 'N/A',
          invoiceNo: service.invoiceNo || 'N/A',
          status: service.status.replace(/-/g, ' ').toUpperCase(),
          priority: service.priority || 'Standard',
          notes: service.notes || ''
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Scheduled_Services_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export scheduled services', error);
      alert('Unable to export scheduled services. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleAddService = () => {
    setNotification(null);
    setError(null);
    setFormError(null);
    setFormData({
      serviceDate: new Date().toISOString().split('T')[0],
      unitNo: '',
      serviceType: SERVICE_TYPE_OPTIONS[0].value,
      odometer: '',
      invoiceNo: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleEditService = (service: ScheduledService) => {
    setNotification(null);
    setError(null);
    setFormError(null);
    setSelectedService(service);
    setFormData({
      serviceDate: service.serviceDate ? service.serviceDate.split('T')[0] : new Date().toISOString().split('T')[0],
      unitNo: service.unitNo,
      serviceType: service.serviceType,
      odometer: service.odometer?.toString() || '',
      invoiceNo: service.invoiceNo || '',
      notes: service.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteService = (service: ScheduledService) => {
    setNotification(null);
    setError(null);
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleSaveService = async () => {
    if (!formData.serviceDate || !formData.unitNo || !formData.serviceType) {
      setFormError('Please fill in all required fields (Service Date, Unit No., and Service Type).');
      return;
    }

    const selectedUnit = units.find((unit) => unit.unitNo === formData.unitNo);
    if (!selectedUnit) {
      setFormError('Please select a valid unit.');
      return;
    }

    const payload: VehicleServiceData = {
      vehicleId: selectedUnit.referenceType === 'vehicle' ? selectedUnit.referenceId : undefined,
      unitNumber: selectedUnit.unitNo,
      unitType: selectedUnit.unitType,
      makeModel: selectedUnit.makeModel,
      serviceType: formData.serviceType as VehicleServiceType,
      priority: 'medium',
      dueDate: formData.serviceDate,
      dueMileage: formData.odometer ? Number(formData.odometer) : 0,
      assignedMechanic: 'Fleet Team',
      description: formData.notes,
      status: 'completed',
      serviceDate: formData.serviceDate,
      odometer: formData.odometer ? Number(formData.odometer) : undefined,
      invoiceNumber: formData.invoiceNo || undefined,
      notes: formData.notes || undefined
    };

    setSaving(true);
    try {
      let response;
      if (showAddModal) {
        response = await createVehicleService(payload);
      } else if (showEditModal && selectedService) {
        response = await updateVehicleService(selectedService._id, payload);
      }

      if (response?.success) {
        setNotification({ type: 'success', message: response.message || 'Service saved successfully.' });
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedService(null);
        await fetchServices();
      } else {
        setFormError(response?.message || 'Failed to save service');
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedService) return;
    setDeleting(true);
    try {
      const response = await deleteVehicleService(selectedService._id);
      if (response?.success) {
        setNotification({ type: 'success', message: response.message || 'Service deleted successfully.' });
        setShowDeleteModal(false);
        setSelectedService(null);
        await fetchServices();
      } else {
        setNotification({ type: 'error', message: response?.message || 'Failed to delete service.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.response?.data?.message || err?.message || 'Failed to delete service.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF', ...ACCENT_VARS }}>
      <div className="relative max-w-7xl mx-auto">


        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black">Scheduled Services Log</h1>
                <div className="flex items-center gap-2 text-black/90">
                  <span className="text-xs">Log repetitive maintenance (Oil Change, DPF, etc.)</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportServices}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 rounded-lg bg-white text-green-600 px-4 py-2 font-bold text-sm shadow-sm hover:bg-white/90 transition disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
                <button
                  onClick={handleAddService}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#0ea3d8] rounded-lg hover:bg-white/90 shadow-sm transition-all font-bold text-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 -mt-4">
          {notification && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 ${notification.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
                }`}
            >
              {notification.message}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Incoming Maintenance Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Incoming Maintenance</p>
                  <p className="text-2xl font-bold text-orange-600 mb-1">{summaryStats.incomingMaintenance}</p>
                  <p className="text-xs text-gray-500">Services due within next 7,500 km or 30 days</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-semibold text-gray-900">{summaryStats.incomingByStatus.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">In Progress</span>
                  <span className="font-semibold text-gray-900">{summaryStats.incomingByStatus.inProgress}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Due in 7 days</span>
                  <span className="font-semibold text-orange-600">{summaryStats.incomingByStatus.dueSoon}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-100">
                  <span className="text-gray-600">Units Affected</span>
                  <span className="font-semibold text-gray-900">{summaryStats.unitsNeedingMaintenance}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Recent Activity</p>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{summaryStats.recentActivity}</p>
                  <p className="text-xs text-gray-500">Completed services in last 30 days</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                {summaryStats.mostRecentDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Most Recent</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(summaryStats.mostRecentDate.toISOString())}
                    </span>
                  </div>
                )}
                {summaryStats.topServiceType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Top Service Type</span>
                    <span className="font-semibold text-blue-600 text-right max-w-[60%] truncate" title={summaryStats.topServiceType}>
                      {summaryStats.topServiceType}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-100">
                  <span className="text-gray-600">Total Completed</span>
                  <span className="font-semibold text-gray-900">{summaryStats.recentActivity}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
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
                  onChange={(e) => setFilterServiceType(e.target.value as ServiceTypeFilter)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                  onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                >
                  <option value="all">All Types</option>
                  {SERVICE_TYPE_OPTIONS.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Notes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        Loading services...
                      </td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        No services found
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr key={service._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900">
                          {formatDate(service.serviceDate || service.dueDate)}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{service.unitNo}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {service.unitType || 'Unit'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{service.makeModel || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: '#398bc3', color: '#063f6f' }}>
                            {getServiceTypeLabel(service.serviceType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {service.odometer !== undefined ? `${service.odometer.toLocaleString()} km` : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{service.invoiceNo || '—'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${service.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : service.status === 'in-progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {service.status.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={service.notes || undefined}>
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
                setFormError(null);
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
                        setFormError(null);
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
                          {units.map(unit => (
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
                          onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as VehicleServiceType })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        >
                          {SERVICE_TYPE_OPTIONS.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Odometer/Hour</label>
                        <input
                          type="number"
                          value={formData.odometer}
                          onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          placeholder="0 (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Invoice No.</label>
                        <input
                          type="text"
                          value={formData.invoiceNo}
                          onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          placeholder="INV-2024-001 (optional)"
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
                  </div>

                  {/* Footer - Fixed to bottom */}
                  <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setShowEditModal(false);
                        setSelectedService(null);
                        setFormError(null);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveService}
                      disabled={saving}
                      className={`px-6 py-2 !text-white rounded-lg transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
                      style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                    >
                      {saving ? 'Saving...' : showAddModal ? 'Add Service' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && selectedService && (
            <>
              <div
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedService(null);
                }}
              />
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
                      onClick={() => {
                        setShowDeleteModal(false);
                        setSelectedService(null);
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={deleting}
                      className={`px-6 py-2 rounded-lg !text-white transition-colors ${deleting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
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
      </div >
    </div >
  );
};

export default ScheduledServicesLog;
