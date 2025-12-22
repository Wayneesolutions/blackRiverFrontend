import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Plus, Edit, Trash2, Search, Truck, CheckCircle, XCircle, Filter, MapPin, FileText, X, Download } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import {
  listFleetUnits,
  createFleetUnit as apiCreateFleetUnit,
  updateFleetUnit as apiUpdateFleetUnit,
  deleteFleetUnit as apiDeleteFleetUnit,
  type FleetUnitDto,
  type FleetUnitSummary
} from '../../../../axios/api/fleet.units';
import {
  createVehicleDocument,
  updateVehicleDocument,
  getVehicleDocument
} from '../../../../axios/api/compilance.vehicledoc';
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

type UnitType = 'Truck' | 'Trailer';
type UnitStatus = 'Active' | 'Inactive';
type TruckType = 'Semi-Truck' | 'Straight Truck' | 'Box Truck' | 'Flatbed' | 'Refrigerated Truck' | 'Dump Truck' | 'Tow Truck';
type TrailerType = 'Reefer Trailer' | 'Tri-Axle Trailer' | 'Dry Van' | 'Flatbed' | 'Step Deck' | 'Lowboy' | 'Tank Trailer' | 'Dump Trailer';

type FleetUnit = FleetUnitDto & {
  source?: 'vehicle' | 'trailer' | 'custom';
  documents?: Array<{
    _id: string;
    documentType: string;
    documentNumber?: string;
    expiryDate?: string;
    issuedAt?: string;
    status?: string;
  }>;
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
  serviceIntervalDays: string;
  serviceIntervalMileage: string;
}

interface FleetDocumentForm {
  documentType: 'insurance' | 'permit' | 'fitness' | 'pollution' | 'driver_license' | 'logbook' | 'maintenance' | 'trailer_registration' | 'safety_inspection' | 'brake_certificate' | 'coupling_certificate' | 'other';
  documentNumber: string;
  expiryDate: string;
  issuedAt: string;
  file: File | null;
  _id?: string; // For existing documents
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
  // Two-step flow state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [fleetDocuments, setFleetDocuments] = useState<FleetDocumentForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Unit details view
  const [showUnitDetails, setShowUnitDetails] = useState(false);
  const [selectedUnitDetails, setSelectedUnitDetails] = useState<FleetUnit | null>(null);
  // Refs for scrollbar synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
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
    reason: '',
    serviceIntervalDays: '',
    serviceIntervalMileage: ''
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
      reason: '',
      serviceIntervalDays: '',
      serviceIntervalMileage: ''
    });
    setFleetDocuments([]);
    setCurrentStep(1);
    setFormError(null);
    setIsSubmitting(false);
  };

  // Vehicle document types
  const VEHICLE_DOCUMENT_TYPES: Array<'insurance' | 'permit' | 'fitness' | 'pollution' | 'driver_license' | 'logbook' | 'maintenance' | 'trailer_registration' | 'safety_inspection' | 'brake_certificate' | 'coupling_certificate' | 'other'> = [
    'insurance',
    'permit',
    'fitness',
    'pollution',
    'driver_license',
    'logbook',
    'maintenance',
    'trailer_registration',
    'safety_inspection',
    'brake_certificate',
    'coupling_certificate',
    'other'
  ];

  const addDocument = () => {
    setFleetDocuments([...fleetDocuments, {
      documentType: 'insurance',
      documentNumber: '',
      expiryDate: '',
      issuedAt: '',
      file: null
    }]);
  };

  const removeDocument = (index: number) => {
    setFleetDocuments(fleetDocuments.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: keyof FleetDocumentForm, value: any) => {
    const updated = [...fleetDocuments];
    updated[index] = { ...updated[index], [field]: value };
    setFleetDocuments(updated);
  };

  const handleDocumentFileChange = (index: number, file: File | null) => {
    updateDocument(index, 'file', file);
  };

  // Fetch documents for a fleet unit
  const fetchFleetUnitDocuments = useCallback(async (fleetUnitId: string) => {
    try {
      const response = await getVehicleDocument();
      if (response?.success && Array.isArray(response?.documentsByVehicle)) {
        // Find documents for this fleet unit
        const unitDocuments = response.documentsByVehicle
          .flatMap((item: any) => {
            const docs = item.documents || [];
            return docs
              .filter((doc: any) => doc.fleetUnitId === fleetUnitId)
              .map((doc: any) => ({
                documentType: doc.documentType,
                documentNumber: doc.documentNumber || '',
                expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
                issuedAt: doc.issuedAt ? doc.issuedAt.split('T')[0] : '',
               
                file: null,
                _id: doc._id
              }));
          });
        setFleetDocuments(unitDocuments);
      }
    } catch (error) {
      console.error('Error fetching fleet unit documents:', error);
      setFleetDocuments([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Sync scroll between top and bottom scrollbars for documents table
  useEffect(() => {
    if (!showUnitDetails) return;
    
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;

    if (!topScroll || !bottomScroll) return;

    let isScrolling = false;

    const handleTopScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      bottomScroll.scrollLeft = topScroll.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    const handleBottomScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      topScroll.scrollLeft = bottomScroll.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    // Sync scroll widths
    const syncScrollWidths = () => {
      const bottomScrollWidth = bottomScroll.scrollWidth;
      const topInner = topScroll.querySelector('.top-scroll-content') as HTMLElement;
      if (topInner && bottomScrollWidth > 0) {
        topInner.style.width = `${bottomScrollWidth}px`;
        topScroll.scrollLeft = bottomScroll.scrollLeft;
      }
    };

    // Initial sync - wait for table to render
    const timeoutId = setTimeout(syncScrollWidths, 100);
    const timeoutId2 = setTimeout(syncScrollWidths, 300);
    const timeoutId3 = setTimeout(syncScrollWidths, 500);

    // Observe table changes
    const tableObserver = new MutationObserver(() => {
      syncScrollWidths();
    });

    const bottomTable = bottomScroll.querySelector('table');
    if (bottomTable) {
      tableObserver.observe(bottomTable, { childList: true, subtree: true });
    }

    topScroll.addEventListener('scroll', handleTopScroll);
    bottomScroll.addEventListener('scroll', handleBottomScroll);

    // Sync on window resize
    window.addEventListener('resize', syncScrollWidths);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
      window.removeEventListener('resize', syncScrollWidths);
      tableObserver.disconnect();
    };
  }, [showUnitDetails, selectedUnitDetails]);

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
        const unitsData = response.data || [];
        
        // Fetch documents for each unit
        const unitsWithDocuments = await Promise.all(
          unitsData.map(async (unit: FleetUnit) => {
            try {
              const docsResponse = await getVehicleDocument();
              if (docsResponse?.success && Array.isArray(docsResponse?.documentsByVehicle)) {
                // Find documents for this fleet unit
                const unitDocuments = docsResponse.documentsByVehicle
                  .flatMap((item: any) => {
                    const docs = item.documents || [];
                    return docs.filter((doc: any) => doc.fleetUnitId === unit._id);
                  });
                return { ...unit, documents: unitDocuments };
              }
            } catch (err) {
              console.error(`Error fetching documents for unit ${unit._id}:`, err);
            }
            return { ...unit, documents: [] };
          })
        );
        
        setUnits(unitsWithDocuments);
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
    setCurrentStep(1); // Ensure we start at step 1
    setShowAddModal(true);
  };

  const handleEditUnit = async (unit: FleetUnit) => {
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
      reason: unit.reason || '',
      serviceIntervalDays: (unit as any).serviceIntervalDays?.toString() || '',
      serviceIntervalMileage: (unit as any).serviceIntervalMileage?.toString() || ''
    });
    setFormError(null);
    setCurrentStep(1);
    setShowEditModal(true);
    // Fetch existing documents for this unit
    await fetchFleetUnitDocuments(unit._id);
  };


  const handleDeleteUnit = (unit: FleetUnit) => {
    setSelectedUnit(unit);
    setShowDeleteModal(true);
  };

  const handleSaveUnit = async () => {
    // Step 1: Validate and move to step 2 for new units or when editing
    if (currentStep === 1 && (showAddModal || showEditModal)) {
      setFormError(null);
      if (!formData.unitNo || !formData.makeModel || !formData.vinNo || !formData.licensePlate || !formData.initialOdometer) {
        setFormError('Please fill in all required fields highlighted with *');
        return;
      }
      // Move to step 2
      setCurrentStep(2);
      return;
    }

    // Step 2: Save fleet unit and documents
    setFormError(null);
    if (!formData.unitNo || !formData.makeModel || !formData.vinNo || !formData.licensePlate || !formData.initialOdometer) {
      setFormError('Please fill in all required fields highlighted with *');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSaving(true);

    try {
      // Map UnitType to FleetUnitType
      const mappedUnitType: import('../../../../axios/api/fleet.units').FleetUnitType = formData.unitType;

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
        reason: formData.status === 'Inactive' ? formData.reason || undefined : undefined,
        serviceIntervalDays: formData.serviceIntervalDays ? Number(formData.serviceIntervalDays) : undefined,
        serviceIntervalMileage: formData.serviceIntervalMileage ? Number(formData.serviceIntervalMileage) : undefined
      };

      let fleetUnitId: string | null = null;

      if (showAddModal) {
        const response = await apiCreateFleetUnit(payload);
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to create fleet unit');
        }
        fleetUnitId = response.data?._id || (response.data as any)?.id;
        setNotification({ type: 'success', message: 'Fleet unit added successfully.' });
      } else if (showEditModal && selectedUnit) {
        const response = await apiUpdateFleetUnit(selectedUnit._id, payload);
        if (!response?.success) {
          throw new Error(response?.message || 'Failed to update fleet unit');
        }
        fleetUnitId = selectedUnit._id;
        setNotification({ type: 'success', message: 'Fleet unit updated successfully.' });
      }

      // Upload documents if any
      if (fleetUnitId && fleetDocuments.length > 0) {
        try {
          const assetType = formData.unitType === 'Truck' ? 'vehicle' : 'trailer';
          for (const doc of fleetDocuments) {
            if (doc.file && doc.documentType) {
              const docFormData = new FormData();
              docFormData.append('assetType', assetType);
              docFormData.append('fleetUnitId', fleetUnitId);
              docFormData.append('vehicleId', ''); // Empty string when using fleetUnitId
              docFormData.append('trailerId', ''); // Empty string when using fleetUnitId
              docFormData.append('documentType', doc.documentType);
              if (doc.documentNumber) docFormData.append('documentNumber', doc.documentNumber);
              if (doc.issuedAt) docFormData.append('issuedAt', doc.issuedAt);
              if (doc.expiryDate) docFormData.append('expiryDate', doc.expiryDate);
              docFormData.append('file', doc.file); // Use 'file' instead of 'document'

              await createVehicleDocument(docFormData);
            } else if (doc._id && doc.documentType) {
              // Update existing document without file change
              const docFormData = new FormData();
              docFormData.append('documentType', doc.documentType);
              if (doc.documentNumber) docFormData.append('documentNumber', doc.documentNumber);
              if (doc.issuedAt) docFormData.append('issuedAt', doc.issuedAt);
              if (doc.expiryDate) docFormData.append('expiryDate', doc.expiryDate);

              await updateVehicleDocument(doc._id, docFormData);
            }
          }
        } catch (docError) {
          console.error('Error uploading documents:', docError);
          setNotification({ type: 'error', message: 'Fleet unit saved but some documents failed to upload. Please add them manually.' });
        }
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
      setIsSubmitting(false);
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

  // Helper function to format days display
  const formatDaysDisplay = (days: number): string => {
    if (!days || days <= 0) return '';
    if (days < 30) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) {
        return `${months} ${months === 1 ? 'month' : 'months'}`;
      }
      return `${months} ${months === 1 ? 'month' : 'months'} ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
    } else {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      const months = Math.floor(remainingDays / 30);
      if (months === 0 && remainingDays === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
      } else if (remainingDays === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'}`;
      }
      return `${years} ${years === 1 ? 'year' : 'years'} ${months} ${months === 1 ? 'month' : 'months'} ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
    }
  };

  const activeCount = summary.activeUnits;
  const trucksCount = summary.trucks;
  const trailersCount = summary.trailers;
  const totalUnitsCount = summary.totalUnits;

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    bgColor,
    iconColor
  }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
  }) => {
    return (
      <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-[#42aeec]/20">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xl font-bold text-gray-900">{value}</span>
            </div>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={`${bgColor} rounded-lg p-2 shadow-sm`}>
            {React.isValidElement(Icon) ? React.cloneElement(Icon as React.ReactElement<any>, { className: iconColor, size: 21 }) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF', ...ACCENT_VARS }}>
      <div className="relative w-full mx-auto p-2">


        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black">Fleet Units</h1>
                <div className="flex items-center gap-2 text-black/90">
                  <span className="text-xs">Comprehensive management of all trucks and trailers</span>
                </div>
              </div>
              <button
                onClick={handleAddUnit}
                style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                className="flex items-center gap-2 px-4 py-2 !text-white rounded-lg shadow-sm transition-all font-bold text-sm"
              >
                <Plus className="w-5 h-5" />
                Add Fleet
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 -mt-2 mb-4">
            <StatCard
              title="Total Units"
              value={totalUnitsCount}
              subtitle="All fleet units"
              icon={<Truck />}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Active Units"
              value={activeCount}
              subtitle="Currently active"
              icon={<CheckCircle />}
              bgColor="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              title="Trucks"
              value={trucksCount}
              subtitle="Total trucks"
              icon={<Truck />}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Trailers"
              value={trailersCount}
              subtitle="Total trailers"
              icon={<Truck />}
              bgColor="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full mx-auto px-4 -mt-4">
          {requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Please complete your company settings to view and manage fleet units.
            </div>
          )}

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

          {error && !requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {/* Tabs and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${activeTab === 'all'
                  ? '!text-white border-b-2'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
                style={activeTab === 'all' ? { background: 'linear-gradient(to right, #016ab2, #063f6f)', borderColor: '#016ab2' } : {}}
              >
                All Units ({totalUnitsCount})
              </button>
              <button
                onClick={() => setActiveTab('trucks')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${activeTab === 'trucks'
                  ? '!text-white border-b-2'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
                style={activeTab === 'trucks' ? { background: 'linear-gradient(to right, #016ab2, #063f6f)', borderColor: '#016ab2' } : {}}
              >
                Trucks ({trucksCount})
              </button>
              <button
                onClick={() => setActiveTab('trailers')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${activeTab === 'trailers'
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
                    <th className="px-6 py-4 text-left text-sm font-semibold">Documents</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={activeTab === 'trailers' ? 12 : 11} className="px-6 py-12 text-center text-gray-500">
                        Loading fleet units...
                      </td>
                    </tr>
                  ) : units.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'trailers' ? 12 : 11} className="px-6 py-12 text-center text-gray-500">
                        {requiresCompanySetup
                          ? 'Please complete your company settings to manage fleet units.'
                          : error || 'No units found'}
                      </td>
                    </tr>
                  ) : (
                    units.map((unit) => {
                      return (
                        <tr 
                          key={unit._id} 
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedUnitDetails(unit);
                            setShowUnitDetails(true);
                          }}
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{unit.unitNo}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${unit.unitType === 'Truck' ? 'bg-blue-100 text-blue-800' :
                                unit.unitType === 'Reefer Trailer' ? 'bg-green-100 text-green-800' :
                                  unit.unitType === 'Tri-Axle Trailer' ? 'bg-orange-100 text-orange-800' :
                                    unit.unitType === 'Dry Van' || unit.unitType === 'Trailer' ? 'bg-purple-100 text-purple-800' :
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
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${unit.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {unit.documents?.length || 0}
                              </span>
                              {unit.documents && unit.documents.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({unit.documents.filter((d: any) => d.status === 'completed' || !d.status).length} valid)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
              {/* Header - Fixed to top */}
              <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                <h2 className="text-2xl font-bold">
                  {showAddModal ? 'Add New Unit' : showEditModal ? 'Edit Unit' : ''}
                </h2>
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

              {/* Step Indicator - Always show when modal is open */}
              {showAddModal && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 1
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white'
                          }`}>
                          {currentStep > 1 ? <CheckCircle size={16} className="text-blue-600" /> : '1'}
                        </div>
                        <span className="text-sm font-medium">Fleet Information</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                        <div
                          className={`h-full transition-all ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}
                          style={{ width: currentStep >= 2 ? '100%' : '0%' }}
                        />
                      </div>
                      <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep >= 2
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-white'
                          }`}>
                          2
                        </div>
                        <span className="text-sm font-medium">Fleet Documents</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {showEditModal && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentStep(1)}
                      style={
                        currentStep === 1
                          ? {
                            background: 'linear-gradient(to right, #016ab2, #063f6f)',
                          }
                          : undefined
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStep === 1
                        ? '!text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Fleet Information
                    </button>

                    <button
                      onClick={() => setCurrentStep(2)}
                      style={
                        currentStep === 2
                          ? {
                            background: 'linear-gradient(to right, #016ab2, #063f6f)',
                          }
                          : undefined
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentStep === 2
                        ? '!text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Fleet Documents ({fleetDocuments.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {formError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                )}
                {currentStep === 2 ? (
                  /* Step 2: Fleet Documents */
                  <div className="space-y-4 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 font-semibold text-xl" style={{ color: ACCENT_PRIMARY }}>
                        <FileText size={24} />
                        <span>Fleet Documents</span>
                      </div>
                      <button
                        onClick={addDocument}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Add Document
                      </button>
                    </div>

                    {fleetDocuments.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">No documents added yet</p>
                        <p className="text-sm text-gray-500 mb-4">Click "Add Document" to upload fleet documents</p>
                        <button
                          onClick={addDocument}
                          className="px-4 py-2 !text-white rounded-lg hover:opacity-90 transition-colors"
                          style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                        >
                          Add First Document
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fleetDocuments.map((doc, index) => (
                          <div key={doc._id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-700">Document {index + 1}</h4>
                                {doc._id && (
                                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Existing</span>
                                )}
                              </div>
                              <button
                                onClick={() => removeDocument(index)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Document Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={doc.documentType}
                                  onChange={(e) => updateDocument(index, 'documentType', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {VEHICLE_DOCUMENT_TYPES.map((type) => (
                                    <option key={type} value={type}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                                  <input
                                    type="text"
                                    value={doc.documentNumber}
                                    onChange={(e) => updateDocument(index, 'documentNumber', e.target.value)}
                                    placeholder="e.g., DOC-123456"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                               
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                                  <input
                                    type="date"
                                    value={doc.issuedAt}
                                    onChange={(e) => updateDocument(index, 'issuedAt', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                  <input
                                    type="date"
                                    value={doc.expiryDate}
                                    onChange={(e) => updateDocument(index, 'expiryDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Document File {!doc._id && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                  type="file"
                                  onChange={(e) => handleDocumentFileChange(index, e.target.files?.[0] || null)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                />
                                {doc.file && (
                                  <p className="text-xs mt-1 text-green-600 flex items-center gap-1">
                                    <CheckCircle size={12} />
                                    Selected: {doc.file.name}
                                  </p>
                                )}
                                {doc._id && !doc.file && (
                                  <p className="text-xs mt-1 text-gray-500">
                                    Leave empty to keep existing file
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Step 1: Fleet Information */
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Interval (Days)
                      {formData.serviceIntervalDays && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          ({formatDaysDisplay(Number(formData.serviceIntervalDays))})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={formData.serviceIntervalDays}
                      onChange={(e) => setFormData({ ...formData, serviceIntervalDays: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="e.g., 90"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Service due after X days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Interval (Mileage)</label>
                    <input
                      type="number"
                      value={formData.serviceIntervalMileage}
                      onChange={(e) => setFormData({ ...formData, serviceIntervalMileage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                      placeholder="e.g., 2000"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Service due after X kilometers</p>
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
                )}
              </div>

              {/* Footer - Fixed to bottom */}
              <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-between gap-3 border-t border-gray-200">
                <div className="flex gap-3">
                  {currentStep === 2 && (
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
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
                    disabled={saving || isSubmitting}
                    className={`px-6 py-2 !text-white rounded-lg transition-colors ${saving || isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
                      }`}
                    style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                  >
                    {(() => {
                      if (saving || isSubmitting) return 'Saving...';
                      if (showAddModal) {
                        if (currentStep === 1) return 'Continue to Documents';
                        if (currentStep === 2) return 'Add Fleet';
                      }
                      if (showEditModal) {
                        if (currentStep === 1) return 'Continue to Documents';
                        if (currentStep === 2) return 'Save Changes';
                      }
                      return 'Save Changes';
                    })()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Unit Details Modal with Horizontal Scrollbar */}
      {showUnitDetails && selectedUnitDetails && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                >
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedUnitDetails.unitNo}</h2>
                  <p className="text-sm text-gray-500">{selectedUnitDetails.makeModel}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUnitDetails(false);
                  setSelectedUnitDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Fleet Unit Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5" style={{ color: ACCENT_PRIMARY }} />
                    <span>Fleet Unit Information</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px] grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Unit Number</p>
                        <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.unitNo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Internal ID</p>
                        <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.internalId || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Unit Type</p>
                        <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.unitType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Make/Model</p>
                        <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.makeModel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">VIN Number</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">{selectedUnitDetails.vinNo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">License Plate</p>
                        <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.licensePlate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Year</p>
                        <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.year || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Status</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedUnitDetails.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {selectedUnitDetails.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Initial Odometer</p>
                        <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.initialOdometer?.toLocaleString() || '0'} km</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Current Odometer</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(selectedUnitDetails.currentOdometer ?? selectedUnitDetails.initialOdometer ?? 0).toLocaleString()} km
                        </p>
                      </div>
                      {selectedUnitDetails.unitType !== 'Truck' && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Capacity</p>
                            <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.capacity || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Operation Status</p>
                            <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.operationStatus || 'N/A'}</p>
                          </div>
                        </>
                      )}
                      {selectedUnitDetails.currentLocation?.address && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500 mb-1">Current Location</p>
                          <p className="text-sm font-medium text-gray-900">{selectedUnitDetails.currentLocation.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" style={{ color: ACCENT_PRIMARY }} />
                    <span>Documents ({selectedUnitDetails.documents?.length || 0})</span>
                  </h3>
                  {!selectedUnitDetails.documents || selectedUnitDetails.documents.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No documents uploaded for this fleet unit</p>
                    </div>
                  ) : (
                    <>
                      <style>{`
                        .table-container-hidden-scrollbar {
                          scrollbar-width: none; /* Firefox */
                          -ms-overflow-style: none; /* IE and Edge */
                        }
                        .table-container-hidden-scrollbar::-webkit-scrollbar {
                          display: none; /* Chrome, Safari, Opera */
                        }
                      `}</style>
                      <div 
                        ref={topScrollRef}
                        className="overflow-x-auto overflow-y-hidden top-scrollbar-container"
                        style={{ 
                          maxHeight: '20px',
                          marginBottom: '2px',
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#cbd5e0 #f7fafc' /* Firefox */
                        }}
                      >
                        <div className="top-scroll-content" style={{ height: '1px' }}></div>
                      </div>
                      {/* Main Table - Scrollbar hidden, controlled by top scrollbar */}
                      <div 
                        ref={bottomScrollRef}
                        className="overflow-x-auto overflow-y-visible table-container-hidden-scrollbar"
                      >
                        <table className="w-full" style={{ minWidth: '1200px' }}>
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Document Type</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Document Number</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Issue Date</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Expiry Date</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">File Name</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">File Size</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Uploaded Date</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedUnitDetails.documents.map((doc: any, index: number) => {
                              const file = doc.files && doc.files.length > 0 ? doc.files[0] : null;
                              const formatFileSize = (bytes: number) => {
                                if (bytes === 0) return '0 Bytes';
                                const k = 1024;
                                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                                const i = Math.floor(Math.log(bytes) / Math.log(k));
                                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
                              };
                              return (
                                <tr key={doc._id || index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-800">
                                        {doc.documentType?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600">{doc.documentNumber || '-'}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600">
                                      {doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString() : '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`text-sm ${!doc.expiryDate ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                      doc.status === 'completed' || !doc.status
                                        ? 'bg-green-100 text-green-800'
                                        : doc.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : doc.status === 'expired'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {doc.status || 'completed'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600" title={file?.fileName || '-'}>
                                      {file?.fileName ? (file.fileName.length > 30 ? file.fileName.substring(0, 30) + '...' : file.fileName) : '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600">
                                      {file?.fileSize ? formatFileSize(file.fileSize) : '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm text-gray-600">
                                      {file?.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : '-'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                      {file && (
                                        <>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                const { getSignedVehicleDocumentUrl } = await import('../../../../axios/api/compilance.vehicledoc');
                                                const signedRes = await getSignedVehicleDocumentUrl(doc._id, 0, 'attachment');
                                                const url = signedRes?.success && signedRes?.url ? signedRes.url : file.fileUrl;
                                                if (url) {
                                                  const link = window.document.createElement('a');
                                                  link.href = url;
                                                  link.download = file.fileName || 'document';
                                                  link.target = '_blank';
                                                  window.document.body.appendChild(link);
                                                  link.click();
                                                  window.document.body.removeChild(link);
                                                }
                                              } catch (error) {
                                                console.error('Download error:', error);
                                              }
                                            }}
                                            className="p-1.5 hover:bg-green-50 rounded text-green-600"
                                            title="Download"
                                          >
                                            <Download className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              try {
                                                const { getSignedVehicleDocumentUrl } = await import('../../../../axios/api/compilance.vehicledoc');
                                                const signedRes = await getSignedVehicleDocumentUrl(doc._id, 0, 'inline');
                                                const url = signedRes?.success && signedRes?.url ? signedRes.url : file.fileUrl;
                                                if (url) {
                                                  window.open(url, '_blank', 'noopener,noreferrer');
                                                }
                                              } catch (error) {
                                                console.error('View error:', error);
                                              }
                                            }}
                                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                                            title="View"
                                          >
                                            <FileText className="w-4 h-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnitDetails(false);
                  setSelectedUnitDetails(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowUnitDetails(false);
                  setSelectedUnitDetails(null);
                  handleEditUnit(selectedUnitDetails);
                }}
                className="px-6 py-2 !text-white rounded-lg hover:opacity-90 transition-colors font-medium"
                style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
              >
                Edit Unit
              </button>
            </div>
          </div>
        </div>
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
  );
};

export default FleetUnits;

