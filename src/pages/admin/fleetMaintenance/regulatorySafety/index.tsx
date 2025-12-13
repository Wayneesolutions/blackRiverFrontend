import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import ExcelJS from 'exceljs';
import { Plus, Edit, Trash2, Search, AlertTriangle, Calendar, Download } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import {
  listRegulatorySafety,
  createRegulatorySafety,
  updateRegulatorySafety,
  deleteRegulatorySafety,
  type RegulatorySafetyDto,
  type RegulatorySafetyPayload
} from '../../../../axios/api/regulatorySafety';
import { listFleetUnits } from '../../../../axios/api/fleet.units';
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

type UnitStatus = 'Active' | 'Inactive';
type TruckType = 'Semi-Truck' | 'Straight Truck' | 'Box Truck' | 'Flatbed' | 'Refrigerated Truck' | 'Dump Truck' | 'Tow Truck';
type TrailerType = 'Reefer Trailer' | 'Tri-Axle Trailer' | 'Dry Van' | 'Flatbed' | 'Step Deck' | 'Lowboy' | 'Tank Trailer' | 'Dump Trailer';

type UnitFilterKey = 'all' | 'truck' | 'trailer' | 'tri-axle trailer' | 'reefer trailer' | 'dry van';

interface UnitOption {
  unitNo: string;
  unitType?: string;
  truckType?: TruckType | string;
  trailerType?: TrailerType | string;
  status?: UnitStatus | string;
  makeModel?: string;
  referenceType?: string;
  referenceId?: string;
}

const UNIT_FILTERS: { key: UnitFilterKey; label: string }[] = [
  { key: 'all', label: 'All Units' },
  { key: 'truck', label: 'Trucks' },
  { key: 'trailer', label: 'Trailers' },
  { key: 'tri-axle trailer', label: 'Tri-Axle Trailer' },
  { key: 'reefer trailer', label: 'Reefer Trailer' },
  { key: 'dry van', label: 'Dry Van' }
];

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

interface FormState {
  unitNo: string;
  safetyExpiryDate: string;
  safetyDecalNumber: string;
  safetyPaperNumber: string;
  shopName: string;
  invoiceNo: string;
  notes: string;
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

const getExpiryStatus = (expiry?: string) => {
  if (!expiry) {
    return { status: 'unknown', color: 'bg-gray-100 text-gray-600', text: 'Not Set' };
  }
  const today = new Date();
  const expiryDate = new Date(expiry);
  const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { status: 'expired', color: 'bg-red-100 text-red-800', text: 'EXPIRED' };
  }
  if (diffDays <= 30) {
    return { status: 'warning', color: 'bg-yellow-100 text-yellow-800', text: `${diffDays} days left` };
  }
  return { status: 'ok', color: 'bg-green-100 text-green-800', text: 'OK' };
};

const RegulatorySafety: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [records, setRecords] = useState<RegulatorySafetyDto[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [unitFilter, setUnitFilter] = useState<UnitFilterKey>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegulatorySafetyDto | null>(null);
  const [formData, setFormData] = useState<FormState>({
    unitNo: '',
    safetyExpiryDate: '',
    safetyDecalNumber: '',
    safetyPaperNumber: '',
    shopName: '',
    invoiceNo: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [requiresCompanySetup, setRequiresCompanySetup] = useState(false);
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
        const rawData = (response as any)?.data;
        const payload = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.units)
              ? rawData.units
              : [];
        setUnits(
          payload.map((unit: any) => ({
            unitNo: unit.unitNo,
            unitType: unit.unitType,
            truckType: unit.truckType,
            trailerType: unit.trailerType,
            status: unit.status,
            makeModel: unit.makeModel,
            referenceType: unit.referenceType,
            referenceId: unit.referenceId
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load units', err);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listRegulatorySafety(debouncedSearch || undefined);
      if (response?.success) {
        setRecords(response.data || []);
        setRequiresCompanySetup(!!response.requiresCompanySetup);
      } else {
        setRecords([]);
        setRequiresCompanySetup(!!response.requiresCompanySetup);
        setError(response?.message || 'Failed to fetch safety records');
      }
    } catch (err: any) {
      setRecords([]);
      setError(err?.response?.data?.message || err?.message || 'Failed to fetch safety records');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const unitMap = useMemo(() => {
    const map = new Map<string, UnitOption>();
    units.forEach((unit) => map.set(unit.unitNo, unit));
    return map;
  }, [units]);

  const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

  const isTrailerFamily = (value: string) =>
    ['trailer', 'reefer trailer', 'tri-axle trailer', 'dry van', 'flatbed', 'step deck', 'lowboy', 'tank trailer', 'dump trailer'].includes(
      value
    );

  const matchesUnitFilter = (unitData: { unitType?: string; truckType?: string; trailerType?: string }, filter: UnitFilterKey) => {
    if (filter === 'all') return true;
    const unitType = normalize(unitData.unitType);
    const truckType = normalize(unitData.truckType);
    const trailerType = normalize(unitData.trailerType);

    if (filter === 'truck') {
      return unitType === 'truck' || (!!truckType && truckType.length > 0 && truckType !== 'truck');
    }

    if (filter === 'trailer') {
      return unitType === 'trailer' || isTrailerFamily(unitType) || isTrailerFamily(trailerType);
    }

    const filterValue = normalize(filter);
    return trailerType === filterValue || unitType === filterValue;
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const meta = unitMap.get(record.unitNo);
      return matchesUnitFilter(
        {
          unitType: record.unitType || meta?.unitType,
          truckType: (record as any)?.truckType || meta?.truckType,
          trailerType: (record as any)?.trailerType || meta?.trailerType
        },
        unitFilter
      );
    });
  }, [records, unitMap, unitFilter]);

  const filteredUnitOptions = useMemo(() => units.filter((unit) => matchesUnitFilter(unit, unitFilter)), [units, unitFilter]);

  const unitSelectOptions = useMemo(() => {
    if (!formData.unitNo) return filteredUnitOptions;
    const exists = filteredUnitOptions.some((unit) => unit.unitNo === formData.unitNo);
    return exists ? filteredUnitOptions : [...filteredUnitOptions, ...units.filter((unit) => unit.unitNo === formData.unitNo)];
  }, [filteredUnitOptions, formData.unitNo, units]);

  const handleExportSafety = async () => {
    if (!filteredRecords.length) {
      alert('No safety records available to export.');
      return;
    }

    try {
      setExporting(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Regulatory Safety');

      worksheet.columns = [
        { header: 'Unit Number', key: 'unitNo', width: 16 },
        { header: 'Unit Type', key: 'unitType', width: 16 },
        { header: 'Make / Model', key: 'makeModel', width: 26 },
        { header: 'Safety Expiry', key: 'safetyExpiryDate', width: 18 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Decal Number', key: 'safetyDecalNumber', width: 18 },
        { header: 'Paper Number', key: 'safetyPaperNumber', width: 18 },
        { header: 'Shop Name', key: 'shopName', width: 24 },
        { header: 'Invoice #', key: 'invoiceNo', width: 18 },
        { header: 'Notes', key: 'notes', width: 32 }
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0EA5E9' }
      };

      filteredRecords.forEach((record) => {
        const status = getExpiryStatus(record.safetyExpiryDate);
        worksheet.addRow({
          unitNo: record.unitNo,
          unitType: record.unitType || 'N/A',
          makeModel: record.makeModel || 'N/A',
          safetyExpiryDate: formatDate(record.safetyExpiryDate),
          status: status.text,
          safetyDecalNumber: record.safetyDecalNumber || 'N/A',
          safetyPaperNumber: record.safetyPaperNumber || 'N/A',
          shopName: record.shopName || 'N/A',
          invoiceNo: record.invoiceNo || 'N/A',
          notes: record.notes || ''
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Regulatory_Safety_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export regulatory safety records', error);
      alert('Unable to export safety records. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleAddRecord = () => {
    const defaultUnitNo = (filteredUnitOptions[0] || units[0])?.unitNo || '';
    setFormData({
      unitNo: defaultUnitNo,
      safetyExpiryDate: '',
      safetyDecalNumber: '',
      safetyPaperNumber: '',
      shopName: '',
      invoiceNo: '',
      notes: ''
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleEditRecord = (record: RegulatorySafetyDto) => {
    setSelectedRecord(record);
    setFormError(null);
    setFormData({
      unitNo: record.unitNo,
      safetyExpiryDate: record.safetyExpiryDate ? record.safetyExpiryDate.split('T')[0] : '',
      safetyDecalNumber: record.safetyDecalNumber || '',
      safetyPaperNumber: record.safetyPaperNumber || '',
      shopName: record.shopName || '',
      invoiceNo: record.invoiceNo || '',
      notes: record.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteRecord = (record: RegulatorySafetyDto) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedRecord(null);
    setFormError(null);
  };

  const buildPayload = (): RegulatorySafetyPayload | null => {
    if (!formData.unitNo || !formData.safetyExpiryDate || !formData.safetyDecalNumber || !formData.shopName) {
      setFormError('Please fill in all required fields.');
      return null;
    }
    const selectedUnit = units.find((unit) => unit.unitNo === formData.unitNo);
    return {
      unitNo: formData.unitNo,
      unitType: selectedUnit?.unitType,
      makeModel: selectedUnit?.makeModel,
      unitSource: selectedUnit?.referenceType,
      unitReference: selectedUnit?.referenceId,
      safetyExpiryDate: formData.safetyExpiryDate,
      safetyDecalNumber: formData.safetyDecalNumber,
      safetyPaperNumber: formData.safetyPaperNumber || undefined,
      shopName: formData.shopName,
      invoiceNo: formData.invoiceNo || undefined,
      notes: formData.notes || undefined
    };
  };

  const handleSaveRecord = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    try {
      const response = showAddModal
        ? await createRegulatorySafety(payload)
        : selectedRecord
          ? await updateRegulatorySafety(selectedRecord._id, payload)
          : null;

      if (response?.success) {
        setNotification({ type: 'success', message: response.message || 'Safety record saved.' });
        closeModals();
        await loadRecords();
      } else {
        setFormError(response?.message || 'Failed to save safety record.');
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save safety record.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRecord) return;
    setDeleting(true);
    try {
      const response = await deleteRegulatorySafety(selectedRecord._id);
      if (response?.success) {
        setNotification({ type: 'success', message: response.message || 'Safety record deleted.' });
        setShowDeleteModal(false);
        setSelectedRecord(null);
        await loadRecords();
      } else {
        setNotification({ type: 'error', message: response?.message || 'Failed to delete safety record.' });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to delete safety record.'
      });
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
                <h1 className="text-2xl font-bold text-black">Regulatory & Safety</h1>
                <div className="flex items-center gap-2 text-black/90">
                  <span className="text-xs">Track inspections and safety expiry dates</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleExportSafety}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 rounded-lg bg-white text-green-600 px-4 py-2 font-bold text-sm shadow-sm hover:bg-white/90 transition disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Export'}
                </button>
                <button
                  onClick={handleAddRecord}
                  className="flex items-center gap-2 px-4 py-2 !text-white rounded-lg shadow-sm transition-all font-bold text-sm hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                >
                  <Plus className="w-5 h-5" />
                  Add Record
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 -mt-4">
          {requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Please complete your company settings to view safety records.
            </div>
          )}

          {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

          {error && !requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
          )}

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by unit number, make/model, invoice, or decal number..."
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {UNIT_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setUnitFilter(filter.key)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${unitFilter === filter.key ? '!text-white shadow-md' : 'text-gray-600 bg-white hover:text-gray-900'
                  }`}
                style={
                  unitFilter === filter.key
                    ? { background: 'linear-gradient(to right, #016ab2, #063f6f)', borderColor: 'transparent' }
                    : { borderColor: 'rgba(0,0,0,0.08)' }
                }
              >
                {filter.label}
              </button>
            ))}
            <span className="text-sm text-gray-500">
              Showing {filteredRecords.length} of {records.length} safety record{records.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        Loading safety records...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        {unitFilter === 'all' ? 'No safety records found' : 'No records match the selected filter'}
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const status = getExpiryStatus(record.safetyExpiryDate);
                      const rowAccent =
                        status.status === 'expired'
                          ? 'border-l-4 border-red-400'
                          : status.status === 'warning'
                            ? 'border-l-4 border-amber-400'
                            : 'border-l-4 border-transparent';
                      return (
                        <tr
                          key={record._id}
                          className={`hover:bg-gray-50 transition-colors ${rowAccent}`}
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{record.unitNo}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {record.unitType || 'Unit'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-900">{record.makeModel || '—'}</td>
                          <td className="px-6 py-4 text-gray-900">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(record.safetyExpiryDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-4 py-2 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.status === 'expired' && <FaExclamationCircle className="mr-1" size={12} />}
                              {status.status === 'warning' && <AlertTriangle className="mr-1" size={12} />}
                              {status.status === 'ok' && <FaCheckCircle className="mr-1" size={12} />}
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-mono text-sm">{record.safetyDecalNumber || '—'}</td>
                          <td className="px-6 py-4 text-gray-600 font-mono text-sm">{record.safetyPaperNumber || '—'}</td>
                          <td className="px-6 py-4 text-gray-900">{record.shopName || '—'}</td>
                          <td className="px-6 py-4 text-gray-600 font-mono text-sm">{record.invoiceNo || '—'}</td>
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
        </div>
      </div>

      {
        (showAddModal || showEditModal) && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={closeModals} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  <h2 className="text-2xl font-bold">{showAddModal ? 'Add Safety Record' : 'Edit Safety Record'}</h2>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit No. *</label>
                      <select
                        value={formData.unitNo}
                        onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })}
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
                        {unitSelectOptions.map((unit) => (
                          <option key={unit.unitNo} value={unit.unitNo}>
                            {unit.unitNo} - {unit.makeModel} ({unit.unitType || unit.trailerType || 'Unit'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Safety Expiry Date *</label>
                      <input
                        type="date"
                        value={formData.safetyExpiryDate}
                        onChange={(e) => setFormData({ ...formData, safetyExpiryDate: e.target.value })}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Safety Decal Number *</label>
                      <input
                        type="text"
                        value={formData.safetyDecalNumber}
                        onChange={(e) => setFormData({ ...formData, safetyDecalNumber: e.target.value })}
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
                        placeholder="SD-2024-1001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Safety Paper Number</label>
                      <input
                        type="text"
                        value={formData.safetyPaperNumber}
                        onChange={(e) => setFormData({ ...formData, safetyPaperNumber: e.target.value })}
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
                        onFocus={(e) => {
                          e.target.style.borderColor = '#016ab2';
                          e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '';
                          e.target.style.boxShadow = '';
                        }}
                        placeholder="Inspection shop name"
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
                        onFocus={(e) => {
                          e.target.style.borderColor = '#016ab2';
                          e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '';
                          e.target.style.boxShadow = '';
                        }}
                        placeholder="INV-SAF-2024-001"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                        placeholder="Additional notes about this inspection"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                  <button
                    onClick={closeModals}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    disabled={saving}
                    className={`px-6 py-2 !text-white rounded-lg transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
                    style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                  >
                    {saving ? 'Saving...' : showAddModal ? 'Add Record' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div >
          </>
        )
      }

      {
        showDeleteModal && selectedRecord && (
          <>
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998]"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedRecord(null);
              }}
            />
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
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedRecord(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className={`px-6 py-2 rounded-lg text-white transition-colors ${deleting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      }
    </div >
  );
};

export default RegulatorySafety;
