import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import ExcelJS from 'exceljs';
import { Plus, Edit, Trash2, Search, Wrench, FileText, Download, AlertCircle, Clock } from 'lucide-react';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';
import {
  listGeneralRepairs,
  createGeneralRepair,
  updateGeneralRepair,
  deleteGeneralRepair,
  type GeneralRepairDto,
  type GeneralRepairPayload
} from '../../../../axios/api/generalRepairs';
import { listFleetUnits } from '../../../../axios/api/fleet.units';
import { getAllEmployees } from '../../../../axios/api/employee';
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

interface UnitOption {
  _id?: string;
  unitNo: string;
  makeModel?: string;
  vin?: string;
  referenceType?: string;
  referenceId?: string;
}

interface ServiceProviderOption {
  id: string;
  name: string;
  role: string;
  email?: string;
  internalId?: string;
}

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

interface FormState {
  serviceDate: string;
  unitNumber: string;
  description: string;
  odometer: string;
  parts: string;
  notes: string;
  serviceProvider: string;
  serviceProviderId?: string;
  invoiceNumber: string;
}

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
};

const Toast: React.FC<{ notification: NotificationState; onClose: () => void }> = ({ notification, onClose }) => {
  const colors =
    notification.type === 'success'
      ? 'border-green-200 bg-green-50 text-green-800'
      : 'border-red-200 bg-red-50 text-red-800';

  return (
    <div className="fixed top-6 right-6 z-[1200] w-full max-w-sm animate-slide-in">
      <div className={`rounded-lg border px-4 py-3 shadow-lg flex items-start gap-3 ${colors}`}>
        <div className="flex-1 text-sm">{notification.message}</div>
        <button
          onClick={onClose}
          className="text-xs font-semibold uppercase tracking-wide opacity-70 hover:opacity-100"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const GeneralRepairsLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [repairs, setRepairs] = useState<GeneralRepairDto[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<GeneralRepairDto | null>(null);
  const [formData, setFormData] = useState<FormState>({
    serviceDate: new Date().toISOString().split('T')[0],
    unitNumber: '',
    description: '',
    odometer: '',
    parts: '',
    notes: '',
    serviceProvider: '',
    serviceProviderId: undefined,
    invoiceNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [requiresCompanySetup, setRequiresCompanySetup] = useState(false);
  const [serviceProviders, setServiceProviders] = useState<ServiceProviderOption[]>([]);
  const [serviceProvidersLoading, setServiceProvidersLoading] = useState(false);
  const [serviceProvidersError, setServiceProvidersError] = useState<string | null>(null);
  const [useCustomProvider, setUseCustomProvider] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const loadUnits = useCallback(async () => {
    try {
      const response = await listFleetUnits({ category: 'all' });
      if (response?.success) {
        setUnits(
          response.data?.map((unit) => ({
            _id: unit._id,
            unitNo: unit.unitNo,
            makeModel: unit.makeModel,
            vin: unit.vinNo || unit.licensePlate,
            referenceType: unit.referenceType,
            referenceId: unit.referenceId
          })) || []
        );
      }
    } catch (err) {
      console.error('Failed to load units', err);
    }
  }, []);

  const loadServiceProviders = useCallback(async () => {
    setServiceProvidersLoading(true);
    setServiceProvidersError(null);
    try {
      const response = await getAllEmployees();
      if (response?.success) {
        const mechanics =
          response.data
            ?.filter((employee: any) =>
              (employee?.role || '').toLowerCase().includes('mechanic')
            )
            .map((employee: any) => ({
              id: employee._id,
              name: employee.name || employee.internalId || employee.email || 'Mechanic',
              role: employee.role || 'Mechanic',
              email: employee.email,
              internalId: employee.internalId
            })) || [];
        setServiceProviders(mechanics);
        if (mechanics.length > 0 && !showEditModal) {
          setUseCustomProvider(false);
        }
      } else {
        setServiceProviders([]);
        setServiceProvidersError(response?.message || 'Unable to load mechanics.');
      }
    } catch (err: any) {
      console.error('Failed to load mechanics', err);
      setServiceProviders([]);
      setServiceProvidersError(err?.response?.data?.message || err?.message || 'Unable to load mechanics.');
    } finally {
      setServiceProvidersLoading(false);
    }
  }, [showEditModal]);

  const loadRepairs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listGeneralRepairs(debouncedSearch || undefined);
      if (response?.success) {
        setRepairs(response.data || []);
        setRequiresCompanySetup(!!response.requiresCompanySetup);
      } else {
        setRepairs([]);
        setRequiresCompanySetup(!!response.requiresCompanySetup);
        setError(response?.message || 'Failed to fetch repairs');
      }
    } catch (err: any) {
      setRepairs([]);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch repairs');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  useEffect(() => {
    loadServiceProviders();
  }, [loadServiceProviders]);

  useEffect(() => {
    loadRepairs();
  }, [loadRepairs]);

  useEffect(() => {
    if (!showEditModal || !selectedRepair || serviceProviders.length === 0) return;
    setFormData((prev) => {
      if (!selectedRepair.serviceProvider) {
        return prev.serviceProviderId ? { ...prev, serviceProviderId: undefined } : prev;
      }
      const match = serviceProviders.find((provider) => provider.name === selectedRepair.serviceProvider);
      if (match && prev.serviceProviderId !== match.id) {
        setUseCustomProvider(false);
        return { ...prev, serviceProviderId: match.id };
      }
      if (!match && !useCustomProvider) {
        setUseCustomProvider(true);
      }
      return prev;
    });
  }, [serviceProviders, selectedRepair, showEditModal, useCustomProvider]);

  const filteredRepairs = useMemo(() => {
    if (!searchTerm) return repairs;
    const term = searchTerm.toLowerCase();
    return repairs.filter((repair) => {
      return (
        repair.unitNumber.toLowerCase().includes(term) ||
        (repair.makeModel || '').toLowerCase().includes(term) ||
        (repair.invoiceNumber || '').toLowerCase().includes(term) ||
        repair.description.toLowerCase().includes(term)
      );
    });
  }, [repairs, searchTerm]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Count recent repairs (within last 30 days) as potential incoming maintenance indicators
    const recentRepairs = repairs.filter((repair) => {
      if (!repair.serviceDate) return false;
      const serviceDate = new Date(repair.serviceDate);
      serviceDate.setHours(0, 0, 0, 0);
      return serviceDate >= thirtyDaysAgo;
    });

    const incomingMaintenance = recentRepairs.length;

    // Get repairs from last 7 days (more urgent)
    const urgentRepairs = recentRepairs.filter((repair) => {
      if (!repair.serviceDate) return false;
      const serviceDate = new Date(repair.serviceDate);
      serviceDate.setHours(0, 0, 0, 0);
      return serviceDate >= sevenDaysAgo;
    }).length;

    // Get unique units with recent repairs
    const unitsWithRecentRepairs = new Set(recentRepairs.map(r => r.unitNumber)).size;

    // Get most recent repair date
    const mostRecentRepairDate = recentRepairs.length > 0
      ? recentRepairs
        .map(r => r.serviceDate ? new Date(r.serviceDate) : null)
        .filter(Boolean)
        .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0]
      : null;

    // Recent Activity - all repairs in last 30 days
    const recentActivity = recentRepairs.length;

    // Get repair type breakdown (based on description keywords)
    const repairTypeBreakdown = recentRepairs.reduce((acc, repair) => {
      const desc = (repair.description || '').toLowerCase();
      let type = 'Other';
      if (desc.includes('tire') || desc.includes('tyre')) type = 'Tires';
      else if (desc.includes('brake')) type = 'Brakes';
      else if (desc.includes('accident') || desc.includes('collision')) type = 'Accident';
      else if (desc.includes('engine')) type = 'Engine';
      else if (desc.includes('transmission')) type = 'Transmission';
      else if (desc.includes('electrical')) type = 'Electrical';

      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topRepairType = Object.entries(repairTypeBreakdown)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      incomingMaintenance,
      urgentRepairs,
      unitsWithRecentRepairs,
      recentActivity,
      mostRecentRepairDate,
      topRepairType: topRepairType ? `${topRepairType[0]} (${topRepairType[1]})` : null
    };
  }, [repairs]);

  const handleExportRepairs = async () => {
    if (!filteredRepairs.length) {
      alert('No repair records available to export.');
      return;
    }

    try {
      setExporting(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('General Repairs');

      worksheet.columns = [
        { header: 'Service Date', key: 'serviceDate', width: 16 },
        { header: 'Unit Number', key: 'unitNumber', width: 16 },
        { header: 'Make / Model', key: 'makeModel', width: 24 },
        { header: 'Description', key: 'description', width: 32 },
        { header: 'Odometer', key: 'odometer', width: 14 },
        { header: 'Parts', key: 'parts', width: 28 },
        { header: 'Notes', key: 'notes', width: 32 },
        { header: 'Service Provider', key: 'serviceProvider', width: 24 },
        { header: 'Invoice #', key: 'invoiceNumber', width: 18 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0EA5E9' }
      };

      filteredRepairs.forEach((repair) => {
        worksheet.addRow({
          serviceDate: formatDate(repair.serviceDate),
          unitNumber: repair.unitNumber,
          makeModel: repair.makeModel || 'N/A',
          description: repair.description,
          odometer: repair.odometer ?? 'N/A',
          parts: repair.parts || 'N/A',
          notes: repair.notes || '',
          serviceProvider: repair.serviceProvider,
          invoiceNumber: repair.invoiceNumber || 'N/A'
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `General_Repairs_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export general repairs', error);
      alert('Unable to export repair records. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const providerSelectValue = useCustomProvider ? '__custom__' : formData.serviceProviderId || '';

  useEffect(() => {
    if (serviceProviders.length === 0) {
      setUseCustomProvider(true);
    }
  }, [serviceProviders.length]);

  const handleAddRepair = () => {
    setFormData({
      serviceDate: new Date().toISOString().split('T')[0],
      unitNumber: '',
      description: '',
      odometer: '',
      parts: '',
      notes: '',
      serviceProvider: '',
      serviceProviderId: undefined,
      invoiceNumber: ''
    });
    setFormError(null);
    setUseCustomProvider(serviceProviders.length === 0);
    setShowAddModal(true);
  };

  const handleEditRepair = (repair: GeneralRepairDto) => {
    setSelectedRepair(repair);
    setFormError(null);
    setFormData({
      serviceDate: repair.serviceDate ? repair.serviceDate.split('T')[0] : '',
      unitNumber: repair.unitNumber,
      description: repair.description,
      odometer: repair.odometer?.toString() || '',
      parts: repair.parts || '',
      notes: repair.notes || '',
      serviceProvider: repair.serviceProvider,
      serviceProviderId: serviceProviders.find((provider) => provider.name === repair.serviceProvider)?.id,
      invoiceNumber: repair.invoiceNumber
    });
    setUseCustomProvider(!serviceProviders.find((provider) => provider.name === repair.serviceProvider));
    setShowEditModal(true);
  };

  const handleDeleteRepair = (repair: GeneralRepairDto) => {
    setSelectedRepair(repair);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedRepair(null);
    setFormError(null);
  };

  const buildPayload = (): GeneralRepairPayload | null => {
    if (
      !formData.serviceDate ||
      !formData.unitNumber ||
      !formData.description ||
      !formData.serviceProvider ||
      !formData.invoiceNumber
    ) {
      setFormError('Please fill in all required fields.');
      return null;
    }
    const selectedUnit = units.find((unit) => unit.unitNo === formData.unitNumber);
    return {
      serviceDate: formData.serviceDate,
      unitNumber: formData.unitNumber,
      makeModel: selectedUnit?.makeModel,
      vinLicensePlate: selectedUnit?.vin,
      description: formData.description,
      odometer: formData.odometer ? Number(formData.odometer) : undefined,
      parts: formData.parts || undefined,
      notes: formData.notes || undefined,
      serviceProvider: formData.serviceProvider,
      invoiceNumber: formData.invoiceNumber,
      unitSource: selectedUnit?.referenceType,
      unitReference: selectedUnit?._id || selectedUnit?.referenceId // Use FleetUnit _id if available, fallback to referenceId
    };
  };

  const handleSaveRepair = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      const response = showAddModal
        ? await createGeneralRepair(payload)
        : selectedRepair
          ? await updateGeneralRepair(selectedRepair._id, payload)
          : null;

      if (response?.success) {
        setNotification({ type: 'success', message: response.message || 'Repair saved successfully.' });
        closeModals();
        await loadRepairs();
      } else {
        setFormError(response?.message || 'Failed to save repair.');
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save repair.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRepair) return;
    setDeleting(true);
    try {
      const response = await deleteGeneralRepair(selectedRepair._id);
      if (response?.success) {
        setNotification({ type: 'success', message: response.message || 'Repair deleted successfully.' });
        setShowDeleteModal(false);
        setSelectedRepair(null);
        await loadRepairs();
      } else {
        setNotification({ type: 'error', message: response?.message || 'Failed to delete repair.' });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to delete repair.'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF', ...ACCENT_VARS }}>
      <div className="relative max-w-7xl mx-auto">
        {/* Gradient band */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`,
            height: '101px'
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">General Repairs Log</h1>
                <div className="flex items-center gap-2 text-white/90">
                  <span className="text-xs">Log non-routine repairs (Tires, Brakes, Accident Repairs)</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportRepairs}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 rounded-lg bg-white text-green-600 px-4 py-2 font-bold text-sm shadow-sm hover:bg-white/90 transition disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
                <button
                  onClick={handleAddRepair}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#0ea3d8] rounded-lg hover:bg-white/90 shadow-sm transition-all font-bold text-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add Repair
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 -mt-4">
          {requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Please complete your company settings to view repairs.
            </div>
          )}

          {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

          {error && !requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Incoming Maintenance Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Incoming Maintenance</p>
                  <p className="text-2xl font-bold text-orange-600 mb-1">{summaryStats.incomingMaintenance}</p>
                  <p className="text-xs text-gray-500">Recent repairs requiring attention</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last 7 Days</span>
                  <span className="font-semibold text-orange-600">{summaryStats.urgentRepairs}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last 30 Days</span>
                  <span className="font-semibold text-gray-900">{summaryStats.incomingMaintenance}</span>
                </div>
                {summaryStats.mostRecentRepairDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Most Recent</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(summaryStats.mostRecentRepairDate.toISOString())}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-100">
                  <span className="text-gray-600">Units Affected</span>
                  <span className="font-semibold text-gray-900">{summaryStats.unitsWithRecentRepairs}</span>
                </div>
              </div>
            </div>

            {/* Recent Repairs Activity Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Recent Repairs / Activity</p>
                  <p className="text-2xl font-bold text-blue-600 mb-1">{summaryStats.recentActivity}</p>
                  <p className="text-xs text-gray-500">Repairs logged in last 30 days</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                {summaryStats.mostRecentRepairDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Most Recent</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(summaryStats.mostRecentRepairDate.toISOString())}
                    </span>
                  </div>
                )}
                {summaryStats.topRepairType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Top Repair Type</span>
                    <span className="font-semibold text-blue-600 text-right max-w-[60%] truncate" title={summaryStats.topRepairType}>
                      {summaryStats.topRepairType}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-1.5 border-t border-gray-100">
                  <span className="text-gray-600">Total Repairs</span>
                  <span className="font-semibold text-gray-900">{summaryStats.recentActivity}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by unit number, make/model, invoice, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#016ab2';
                  e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.boxShadow = '';
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        Loading repairs...
                      </td>
                    </tr>
                  ) : filteredRepairs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        No repairs found
                      </td>
                    </tr>
                  ) : (
                    filteredRepairs.map((repair) => (
                      <tr key={repair._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-gray-900">{formatDate(repair.serviceDate)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{repair.unitNumber}</td>
                        <td className="px-6 py-4 text-gray-900">{repair.makeModel || '—'}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{repair.vinLicensePlate || '—'}</td>
                        <td className="px-6 py-4 text-gray-900 max-w-xs">
                          <div className="truncate" title={repair.description}>
                            {repair.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {typeof repair.odometer === 'number' ? `${repair.odometer.toLocaleString()} km` : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs">
                          <div className="truncate" title={repair.parts || undefined}>
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

          {(showAddModal || showEditModal) && (
            <>
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={closeModals} />
              <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl z-[101] border-l border-gray-200">
                <div className="h-full flex flex-col">
                  <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                    <h2 className="text-2xl font-bold">{showAddModal ? 'Add General Repair' : 'Edit Repair'}</h2>
                    <button onClick={closeModals} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {formError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{formError}</div>
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
                          onFocus={(e) => {
                            e.target.style.borderColor = '#016ab2';
                            e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '';
                            e.target.style.boxShadow = '';
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit Number *</label>
                        <select
                          value={formData.unitNumber}
                          onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#016ab2';
                            e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '';
                            e.target.style.boxShadow = '';
                          }}
                        >
                          <option value="">Select Unit</option>
                          {units.map((unit) => (
                            <option key={unit.unitNo} value={unit.unitNo}>
                              {unit.unitNo} - {unit.makeModel}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Odometer</label>
                        <input
                          type="number"
                          value={formData.odometer}
                          onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#016ab2';
                            e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '';
                            e.target.style.boxShadow = '';
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Provider *</label>
                        {serviceProvidersLoading ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 inline-block" />
                            Loading mechanics...
                          </div>
                        ) : serviceProviders.length > 0 ? (
                          <>
                            <select
                              value={providerSelectValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!value) {
                                  setUseCustomProvider(false);
                                  setFormData((prev) => ({ ...prev, serviceProviderId: undefined, serviceProvider: '' }));
                                  return;
                                }
                                if (value === '__custom__') {
                                  setUseCustomProvider(true);
                                  setFormData((prev) => ({ ...prev, serviceProviderId: undefined, serviceProvider: '' }));
                                  return;
                                }
                                const provider = serviceProviders.find((option) => option.id === value);
                                setUseCustomProvider(false);
                                setFormData((prev) => ({
                                  ...prev,
                                  serviceProviderId: provider?.id,
                                  serviceProvider: provider?.name || ''
                                }));
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                              style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#016ab2';
                                e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = '';
                                e.target.style.boxShadow = '';
                              }}
                            >
                              <option value="">Select mechanic</option>
                              {serviceProviders.map((provider) => (
                                <option key={provider.id} value={provider.id}>
                                  {provider.name} {provider.role ? `(${provider.role})` : ''}
                                </option>
                              ))}
                              <option value="__custom__">Other / External Vendor</option>
                            </select>
                            {useCustomProvider && (
                              <input
                                type="text"
                                value={formData.serviceProvider}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    serviceProvider: e.target.value,
                                    serviceProviderId: undefined
                                  })
                                }
                                className="mt-3 w-full px-4 !mt-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                                style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                                placeholder="Enter shop or vendor name"
                              />
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={formData.serviceProvider}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  serviceProvider: e.target.value,
                                  serviceProviderId: undefined
                                })
                              }
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                              style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                              placeholder="Enter shop or vendor name"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              Add an employee with a mechanic role to auto-populate this list.
                            </p>
                          </>
                        )}
                        {serviceProvidersError && (
                          <p className="text-sm text-red-600 mt-2">{serviceProvidersError}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#016ab2';
                            e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '';
                            e.target.style.boxShadow = '';
                          }}
                          placeholder="Be specific, e.g., 'Front right tire blow out - replaced'"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parts</label>
                        <textarea
                          value={formData.parts}
                          onChange={(e) => setFormData({ ...formData, parts: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#016ab2';
                            e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '';
                            e.target.style.boxShadow = '';
                          }}
                          placeholder="List major parts used"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number *</label>
                        <input
                          type="text"
                          value={formData.invoiceNumber}
                          onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus-border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#016ab2';
                            e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '';
                            e.target.style.boxShadow = '';
                          }}
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
                          onFocus={(e) => {
                            e.target.style.borderColor = '#016ab2';
                            e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '';
                            e.target.style.boxShadow = '';
                          }}
                          placeholder="e.g., 'Passed post-repair inspection'"
                        />
                      </div>
                    </div>
                    <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t mt-6">
                      <button
                        onClick={closeModals}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRepair}
                        disabled={saving}
                        className={`px-6 py-2 !text-white rounded-lg transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
                          }`}
                        style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                      >
                        {saving ? 'Saving...' : showAddModal ? 'Add Repair' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {showDeleteModal && selectedRepair && (
            <>
              <div
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRepair(null);
                }}
              />
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
                      onClick={() => {
                        setShowDeleteModal(false);
                        setSelectedRepair(null);
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
      </div>
    </div>
  );
};

export default GeneralRepairsLog;
