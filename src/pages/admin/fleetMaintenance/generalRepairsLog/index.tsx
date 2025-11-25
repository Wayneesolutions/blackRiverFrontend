import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Wrench, FileText } from 'lucide-react';
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

interface UnitOption {
  unitNo: string;
  makeModel?: string;
  vin?: string;
  referenceType?: string;
  referenceId?: string;
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
    invoiceNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [requiresCompanySetup, setRequiresCompanySetup] = useState(false);

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
    loadRepairs();
  }, [loadRepairs]);

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
    setFormError(null);
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
      invoiceNumber: repair.invoiceNumber
    });
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
      unitReference: selectedUnit?.referenceId
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
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

          {requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Please complete your company settings to view repairs.
            </div>
          )}

          {notification && <Toast notification={notification} onClose={() => setNotification(null)} />}

          {error && !requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
          )}
        </div>

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
                      <input
                        type="text"
                        value={formData.serviceProvider}
                        onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
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
                        placeholder="Name of the shop"
                      />
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
                      className={`px-6 py-2 text-white rounded-lg transition-colors ${
                        saving ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
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
                    className={`px-6 py-2 rounded-lg text-white transition-colors ${
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

export default GeneralRepairsLog;

