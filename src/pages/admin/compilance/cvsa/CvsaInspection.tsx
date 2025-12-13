import React, { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  FaClipboardCheck,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaInfoCircle,
  FaBan,
  FaEdit,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
  FaFlag,
  FaFlagUsa,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import {
  getCvsaInspections,
  getCvsaInspectionStats,
  createCvsaInspection,
  updateCvsaInspection,
  deleteCvsaInspection
} from '../../../../axios/api/admin';
import { listFleetUnits, type FleetUnitDto } from '../../../../axios/api/fleet.units';
import { listDriver } from '../../../../axios/api/distapcher';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

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

// Types
interface Inspection {
  _id: string;
  inspectionId: string;
  country: 'canada' | 'usa';
  date: string;
  location: string;
  status: 'pass' | 'fail' | 'warning' | 'out-of-service';
  vehicle: {
    _id: string;
    internalId?: string;
    plateNumber?: string;
    make?: string;
    model?: string;
    year?: number;
  } | string;
  driver: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  inspectorName: string;
  violations?: Violation[];
  notes?: string;
  createdAt: string;
  // OFFICIAL DOCUMENT NUMBERS
  reportNumber?: string; // The unique identifier of the physical inspection document
  inspectionLevel?: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII'; // The official CVSA inspection level
  jurisdiction?: string; // The state or province (e.g., 'ON', 'TX') that conducted the inspection
  // DRIVER & CARRIER SPECIFIC IDs
  driverLicenseNumber?: string; // The driver's license number
  carrierUSDOTNumber?: string; // The Carrier's USDOT Number (Crucial for USA FMCSA records)
  carrierMotorCarrierNumber?: string; // The Carrier's MC Number (if applicable)
  // TIME & DOCUMENTATION
  timeOfInspection?: string; // To capture the exact time on the report
  documentLink?: string; // URL link to the scanned PDF/image of the physical report
  // OUT-OF-SERVICE SPECIFICS (Critical for tracking repairs)
  outOfServiceIssued?: boolean; // Whether an OOS order was explicitly issued (Yes/No)
  outOfServiceReleaseDate?: string; // Date and time the OOS order was lifted (if applicable)
  defectRepairNeeded?: boolean; // Indicates if mechanical defects must be repaired
}

interface Vehicle {
  _id: string;
  internalId?: string;
  plateNumber: string;
  licensePlate?: string;
  make: string;
  model: string;
  makeModel?: string;
  year?: number;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
}

interface Violation {
  _id: string;
  code: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
}

interface InspectionStats {
  total: number;
  pass: number;
  fail: number;
  warning: number;
  outOfService: number;
}

// Toast Notification Types
type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

// Toast Notification Component
const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const toneStyles: Record<NotificationType, { bg: string; border: string; icon: React.ReactNode }> = {
    success: { bg: 'bg-green-50 border-green-200', border: '', icon: <FaCheckCircle className="text-green-600" size={20} /> },
    error: { bg: 'bg-red-50 border-red-200', border: '', icon: <FaExclamationCircle className="text-red-600" size={20} /> },
    info: { bg: '', border: '', icon: <FaInfoCircle className="text-[var(--accent-color)]" size={20} /> },
    warning: { bg: 'bg-yellow-50 border-yellow-200', border: '', icon: <FaExclamationTriangle className="text-yellow-600" size={20} /> }
  };

  const infoStyle =
    notification.type === 'info'
      ? { backgroundColor: ACCENT_SOFT, borderColor: ACCENT_SOFT_BORDER }
      : undefined;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${toneStyles[notification.type].bg || ''} animate-slide-in`}
      style={infoStyle}
    >
      <div className="flex-shrink-0 mt-0.5">
        {toneStyles[notification.type].icon}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

const CvsaInspection: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([]);
  const [activeTab, setActiveTab] = useState<'canada' | 'usa'>('canada');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [inspectionForm, setInspectionForm] = useState<Partial<Inspection>>({
    country: 'canada',
    date: '',
    location: '',
    status: 'pass',
    vehicle: '',
    driver: '',
    inspectorName: '',
    violations: [],
    notes: '',
    // New required fields
    reportNumber: '',
    inspectionLevel: 'I',
    jurisdiction: '',
    driverLicenseNumber: '',
    carrierUSDOTNumber: '',
    carrierMotorCarrierNumber: '',
    timeOfInspection: '',
    documentLink: '',
    outOfServiceIssued: false,
    outOfServiceReleaseDate: '',
    defectRepairNeeded: false
  });
  const [stats, setStats] = useState<InspectionStats>({
    total: 0,
    pass: 0,
    fail: 0,
    warning: 0,
    outOfService: 0
  });
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const notificationIdRef = useRef(0);

  // Fetch vehicles and drivers (using FleetUnit)
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await listFleetUnits({ category: "trucks" });
        if (res?.success && res?.data) {
          // Map FleetUnit to Vehicle interface format - filter to trucks only
          const trucks = res.data.filter((unit: FleetUnitDto) =>
            unit.unitType === "Truck" || unit.unitType === "Bus/Van"
          );

          const mappedVehicles: Vehicle[] = trucks.map((unit: FleetUnitDto) => {
            // Extract make and model
            let make = unit.make || '';
            let model = unit.model || '';

            // If makeModel exists but make/model don't, parse makeModel
            if ((!make || !model) && unit.makeModel) {
              const makeModelParts = unit.makeModel.trim().split(/\s+/);
              if (makeModelParts.length > 0) {
                make = make || makeModelParts[0];
                model = model || makeModelParts.slice(1).join(' ');
              }
            }

            // Use unitNo or internalId as fallback
            const identifier = unit.licensePlate || unit.unitNo || unit.internalId || unit._id;

            // Ensure we don't show "Unknown Unknown"
            if (!make && !model) {
              if (unit.makeModel) {
                const parts = unit.makeModel.trim().split(/\s+/);
                make = parts[0] || identifier;
                model = parts.slice(1).join(' ') || '';
              } else {
                make = identifier;
                model = '';
              }
            }

            return {
              _id: unit._id,
              internalId: unit.internalId || unit.unitNo,
              plateNumber: unit.licensePlate || unit.unitNo || unit.internalId || 'N/A',
              licensePlate: unit.licensePlate,
              make: make || identifier,
              model: model || '',
              makeModel: unit.makeModel,
              year: unit.year
            };
          });
          setVehicles(mappedVehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    const fetchDrivers = async () => {
      try {
        const res = await listDriver();
        if (res?.success && res?.data) {
          // Filter for drivers only
          const driverList = Array.isArray(res.data)
            ? res.data.filter((d: any) => d.role === 'driver')
            : (res.data?.drivers || []).filter((d: any) => d.role === 'driver');
          setDrivers(driverList);
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
    };

    fetchVehicles();
    fetchDrivers();
  }, []);

  // Function to refresh inspections and stats
  const refreshData = async (useFilters = true, page = currentPage, limit = pageSize) => {
    try {
      const [inspectionsRes, statsRes] = await Promise.all([
        getCvsaInspections({
          country: activeTab,
          status: useFilters && statusFilter !== 'all' ? statusFilter : undefined,
          search: useFilters && searchQuery ? searchQuery : undefined,
          page: page,
          limit: limit
        }),
        getCvsaInspectionStats(activeTab)
      ]);

      if (inspectionsRes?.success) {
        setInspections(inspectionsRes.data || []);

        // Update pagination info
        if (inspectionsRes?.pagination) {
          setTotal(inspectionsRes.pagination.total || 0);
          setTotalPages(inspectionsRes.pagination.totalPages || 0);
          setCurrentPage(inspectionsRes.pagination.page || 1);
        }
      }

      if (statsRes?.success) {
        setStats(statsRes.data || {
          total: 0,
          pass: 0,
          fail: 0,
          warning: 0,
          outOfService: 0
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Fetch inspections and stats when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Reset to page 1 when filters change
        setCurrentPage(1);
        await refreshData(true, 1, pageSize);
      } catch (error) {
        console.error('Error fetching inspections:', error);
        addNotification('error', 'Failed to load inspections');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      refreshData(true, 1, pageSize);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Fetch when page or pageSize changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await refreshData(true, currentPage, pageSize);
      } catch (error) {
        console.error('Error fetching inspections:', error);
        addNotification('error', 'Failed to load inspections');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Filter inspections (already filtered by API, but keep for client-side if needed)
  useEffect(() => {
    setFilteredInspections(inspections);
  }, [inspections]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <FaCheckCircle className="text-green-600" size={20} />;
      case 'fail':
        return <FaTimesCircle className="text-red-600" size={20} />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-600" size={20} />;
      case 'out-of-service':
        return <FaBan className="text-red-800" size={20} />;
      default:
        return <FaClipboardCheck className="text-gray-600" size={20} />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-service':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'text-yellow-600';
      case 'major':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setInspectionForm({
      country: 'canada',
      date: '',
      location: '',
      status: 'pass',
      vehicle: '',
      driver: '',
      inspectorName: '',
      violations: [],
      notes: '',
      // New required fields
      reportNumber: '',
      inspectionLevel: 'I',
      jurisdiction: '',
      driverLicenseNumber: '',
      carrierUSDOTNumber: '',
      carrierMotorCarrierNumber: '',
      timeOfInspection: '',
      documentLink: '',
      outOfServiceIssued: false,
      outOfServiceReleaseDate: '',
      defectRepairNeeded: false
    });
  };

  const handleAddInspection = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setInspectionForm({
      country: inspection.country,
      date: inspection.date ? new Date(inspection.date).toISOString().split('T')[0] : '',
      location: inspection.location,
      status: inspection.status,
      vehicle: typeof inspection.vehicle === 'string' ? inspection.vehicle : inspection.vehicle?._id || '',
      driver: typeof inspection.driver === 'string' ? inspection.driver : inspection.driver?._id || '',
      inspectorName: inspection.inspectorName,
      violations: inspection.violations || [],
      notes: inspection.notes || '',
      // New required fields
      reportNumber: inspection.reportNumber || '',
      inspectionLevel: inspection.inspectionLevel || 'I',
      jurisdiction: inspection.jurisdiction || '',
      driverLicenseNumber: inspection.driverLicenseNumber || '',
      carrierUSDOTNumber: inspection.carrierUSDOTNumber || '',
      carrierMotorCarrierNumber: inspection.carrierMotorCarrierNumber || '',
      timeOfInspection: inspection.timeOfInspection || '',
      documentLink: inspection.documentLink || '',
      outOfServiceIssued: inspection.outOfServiceIssued || false,
      outOfServiceReleaseDate: inspection.outOfServiceReleaseDate ? new Date(inspection.outOfServiceReleaseDate).toISOString().split('T')[0] : '',
      defectRepairNeeded: inspection.defectRepairNeeded || false
    });
    setShowEditModal(true);
  };

  const handleDeleteInspection = (inspection: Inspection) => {
    setInspectionToDelete(inspection);
    setShowDeleteModal(true);
  };

  const getVehicleInfo = (vehicle: Inspection['vehicle']): string => {
    if (typeof vehicle === 'string') {
      const v = vehicles.find(v => v._id === vehicle);
      if (v) {
        const plate = v.plateNumber || v.licensePlate || v.internalId || 'N/A';
        const vehicleName = [v.make, v.model].filter(Boolean).join(' ').trim() || v.makeModel || v.internalId || 'Vehicle';
        return `${vehicleName} (${plate})`;
      }
      return '';
    }
    if (vehicle) {
      const make = vehicle.make || '';
      const model = vehicle.model || '';
      const plate = vehicle.plateNumber || vehicle.internalId || 'N/A';
      const vehicleName = [make, model].filter(Boolean).join(' ').trim() || 'Vehicle';
      return `${vehicleName} (${plate})`;
    }
    return '';
  };

  const getDriverName = (driver: Inspection['driver']): string => {
    if (typeof driver === 'string') {
      const d = drivers.find(d => d._id === driver);
      return d ? d.name : '';
    }
    return driver?.name || '';
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = ++notificationIdRef.current;
    setNotifications((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const validateForm = () => {
    return (
      !!inspectionForm.country &&
      !!inspectionForm.date &&
      !!inspectionForm.location &&
      !!inspectionForm.status &&
      !!inspectionForm.vehicle &&
      !!inspectionForm.driver &&
      !!inspectionForm.inspectorName
    );
  };

  const saveNewInspection = async () => {
    console.log('saveNewInspection called');
    console.log('Form validation:', validateForm());
    console.log('Form data:', inspectionForm);

    if (!validateForm()) {
      addNotification('error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        country: inspectionForm.country,
        date: inspectionForm.date,
        location: inspectionForm.location,
        status: inspectionForm.status,
        vehicle: typeof inspectionForm.vehicle === 'string' ? inspectionForm.vehicle : inspectionForm.vehicle?._id || inspectionForm.vehicle,
        driver: typeof inspectionForm.driver === 'string' ? inspectionForm.driver : inspectionForm.driver?._id || inspectionForm.driver,
        inspectorName: inspectionForm.inspectorName,
        violations: inspectionForm.violations || [],
        notes: inspectionForm.notes || '',
        // New required fields
        reportNumber: inspectionForm.reportNumber || '',
        inspectionLevel: inspectionForm.inspectionLevel || 'I',
        jurisdiction: inspectionForm.jurisdiction || '',
        driverLicenseNumber: inspectionForm.driverLicenseNumber || '',
        carrierUSDOTNumber: inspectionForm.carrierUSDOTNumber || '',
        carrierMotorCarrierNumber: inspectionForm.carrierMotorCarrierNumber || '',
        timeOfInspection: inspectionForm.timeOfInspection || '',
        documentLink: inspectionForm.documentLink || '',
        outOfServiceIssued: inspectionForm.outOfServiceIssued || false,
        outOfServiceReleaseDate: inspectionForm.outOfServiceReleaseDate || '',
        defectRepairNeeded: inspectionForm.defectRepairNeeded || false
      };

      console.log('Sending payload:', payload);
      const res = await createCvsaInspection(payload);
      console.log('API Response:', res);

      if (res?.success) {
        addNotification('success', res.message || 'Inspection created successfully');
        // Refresh both inspections and stats
        await refreshData(true);
        setShowAddModal(false);
        resetForm();
      } else {
        addNotification('error', res?.message || 'Failed to create inspection');
      }
    } catch (error: any) {
      console.error('Error creating inspection:', error);
      console.error('Error details:', error?.response?.data || error);
      addNotification('error', error?.response?.data?.message || error?.message || 'Failed to create inspection');
    } finally {
      setLoading(false);
    }
  };

  const updateInspection = async () => {
    if (!selectedInspection) return;
    if (!validateForm()) {
      addNotification('error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        country: inspectionForm.country,
        date: inspectionForm.date,
        location: inspectionForm.location,
        status: inspectionForm.status,
        vehicle: inspectionForm.vehicle,
        driver: inspectionForm.driver,
        inspectorName: inspectionForm.inspectorName,
        violations: inspectionForm.violations || [],
        notes: inspectionForm.notes || '',
        // New required fields
        reportNumber: inspectionForm.reportNumber || '',
        inspectionLevel: inspectionForm.inspectionLevel || 'I',
        jurisdiction: inspectionForm.jurisdiction || '',
        driverLicenseNumber: inspectionForm.driverLicenseNumber || '',
        carrierUSDOTNumber: inspectionForm.carrierUSDOTNumber || '',
        carrierMotorCarrierNumber: inspectionForm.carrierMotorCarrierNumber || '',
        timeOfInspection: inspectionForm.timeOfInspection || '',
        documentLink: inspectionForm.documentLink || '',
        outOfServiceIssued: inspectionForm.outOfServiceIssued || false,
        outOfServiceReleaseDate: inspectionForm.outOfServiceReleaseDate || '',
        defectRepairNeeded: inspectionForm.defectRepairNeeded || false
      };

      const res = await updateCvsaInspection(selectedInspection._id, payload);
      if (res?.success) {
        addNotification('success', res.message || 'Inspection updated successfully');
        // Refresh both inspections and stats
        await refreshData(true);
        setShowEditModal(false);
        setSelectedInspection(null);
        resetForm();
      } else {
        addNotification('error', res?.message || 'Failed to update inspection');
      }
    } catch (error: any) {
      console.error('Error updating inspection:', error);
      addNotification('error', error?.message || 'Failed to update inspection');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!inspectionToDelete) return;

    setLoading(true);
    try {
      const res = await deleteCvsaInspection(inspectionToDelete._id);
      if (res?.success) {
        addNotification('success', res.message || 'Inspection deleted successfully');
        // Refresh both inspections and stats
        await refreshData(true);
        setShowDeleteModal(false);
        setInspectionToDelete(null);
      } else {
        addNotification('error', res?.message || 'Failed to delete inspection');
      }
    } catch (error: any) {
      console.error('Error deleting inspection:', error);
      addNotification('error', error?.message || 'Failed to delete inspection');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    onClick,
    bgColor,
    iconColor
  }: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ReactNode;
    onClick?: () => void;
    bgColor: string;
    iconColor: string;
  }) => {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="flex items-start justify-between mb-2">
          {/* Left side content */}
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xl font-bold text-gray-900">{value}</span>
            </div>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>

          {/* Right side icon */}
          <div className={`${bgColor} rounded-lg p-2 shadow-sm`}>
            {/* Render the icon directly if it's an element, or as component if passed as ref */}
            {React.isValidElement(Icon) ? React.cloneElement(Icon as React.ReactElement, { classname: iconColor, size: 21 }) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF', ...ACCENT_VARS }}>
      {/* Toast Notifications Container - High z-index to be above modal */}
      <div className="fixed top-4 right-4 z-[10002] flex flex-col gap-3 max-w-md">
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto">


        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black">CVSA Inspection Management</h1>
                <div className="flex items-center gap-2 text-black/90">
                  <span className="text-xs">Compliance / CVSA Inspections</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Country Toggle */}
                <div className="bg-gray-50 rounded-lg p-1 flex border border-white/20">
                  <button
                    onClick={() => setActiveTab('canada')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
      ${activeTab === 'canada'
                        ? 'bg-white shadow-sm'
                        : 'hover:bg-black/5'
                      }`}
                  >
                    <FaFlag
                      size={12}
                      className={activeTab === 'canada' ? 'text-red-500' : 'text-black/60'}
                    />

                    <span
                      className={
                        activeTab === 'canada'
                          ? 'bg-clip-text text-transparent'
                          : 'text-black'
                      }
                      style={
                        activeTab === 'canada'
                          ? {
                            backgroundImage:
                              'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                          }
                          : {}
                      }
                    >
                      Canada
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('usa')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
      ${activeTab === 'usa'
                        ? 'bg-white shadow-sm'
                        : 'hover:bg-black/5'
                      }`}
                  >
                    <FaFlagUsa
                      size={12}
                      className={activeTab === 'usa' ? 'text-blue-500' : 'text-black/60'}
                    />

                    <span
                      className={
                        activeTab === 'usa'
                          ? 'bg-clip-text text-transparent'
                          : 'text-black'
                      }
                      style={
                        activeTab === 'usa'
                          ? {
                            backgroundImage:
                              'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                          }
                          : {}
                      }
                    >
                      USA
                    </span>
                  </button>
                </div>



                <button
                  onClick={handleAddInspection}
                  style={{ background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`, }}
                  className="flex items-center gap-2 px-4 py-2  !text-white rounded-lg shadow-sm  transition-colors font-medium text-sm"
                >
                  + Add Inspection
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards - Matching Dispatch Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 -mt-2 mb-6">
            <StatCard
              title="Total"
              value={stats.total}
              icon={<FaClipboardCheck />}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Passed"
              value={stats.pass}
              icon={<FaCheckCircle />}
              bgColor="bg-green-50"
              iconColor="text-green-600"
            />
            <StatCard
              title="Failed"
              value={stats.fail}
              icon={<FaTimesCircle />}
              bgColor="bg-red-50"
              iconColor="text-red-600"
            />
            <StatCard
              title="Warning"
              value={stats.warning}
              icon={<FaExclamationTriangle />}
              bgColor="bg-yellow-50"
              iconColor="text-yellow-600"
            />
            <StatCard
              title="Out of Svc"
              value={stats.outOfService}
              icon={<FaBan />}
              bgColor="bg-red-100"
              iconColor="text-red-800"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area (Filters + Table) moved inside the container for spacing */}
      <div className="max-w-7xl mx-auto px-4 -mt-4">


        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search inspections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" size={16} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="warning">Warning</option>
                  <option value="out-of-service">Out of Service</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">
              {activeTab.toUpperCase()} Inspections ({total > 0 ? total : filteredInspections.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-color)] mx-auto mb-4"></div>
              <p className="text-xl font-semibold text-gray-500">Loading inspections...</p>
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="text-center py-16">
              <FaClipboardCheck size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-semibold text-gray-500">No inspections found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        Inspection ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inspector
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jurisdiction
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        USDOT #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        OOS Issued
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Violations
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInspections.map((inspection) => (
                      <tr key={inspection._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white z-10">
                          <div className="text-sm font-medium text-gray-900">
                            {inspection.inspectionId || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <FaCalendarAlt className="text-gray-400" size={12} />
                              {inspection.date ? formatDate(inspection.date) : 'N/A'}
                            </div>
                            {inspection.timeOfInspection && (
                              <div className="text-xs text-gray-500 mt-1">
                                {inspection.timeOfInspection}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-[200px] truncate" title={inspection.location || 'N/A'}>
                            <div className="flex items-center gap-1">
                              <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" size={12} />
                              {inspection.location || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 uppercase">
                            {inspection.country === 'canada' ? (
                              <span className="flex items-center gap-1">
                                <FaFlag className="text-red-600" size={14} />
                                CA
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <FaFlagUsa className="text-blue-600" size={14} />
                                USA
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-[180px]">
                            <div className="font-medium truncate" title={getVehicleInfo(inspection.vehicle)}>
                              {getVehicleInfo(inspection.vehicle) || 'N/A'}
                            </div>
                            {typeof inspection.vehicle === 'object' && inspection.vehicle?.internalId && (
                              <div className="text-xs text-gray-500">
                                ID: {inspection.vehicle.internalId}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-[150px]">
                            <div className="truncate" title={getDriverName(inspection.driver)}>
                              {getDriverName(inspection.driver) || 'N/A'}
                            </div>
                            {inspection.driverLicenseNumber && (
                              <div className="text-xs text-gray-500">
                                DL: {inspection.driverLicenseNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(inspection.status)}
                            <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusBadgeColor(inspection.status)}`}>
                              {inspection.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 max-w-[150px] truncate" title={inspection.inspectorName || 'N/A'}>
                            {inspection.inspectorName || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {inspection.reportNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {inspection.inspectionLevel ? `Level ${inspection.inspectionLevel}` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {inspection.jurisdiction || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {inspection.carrierUSDOTNumber || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">
                            {inspection.outOfServiceIssued ? (
                              <span className="text-red-600 font-medium">Yes</span>
                            ) : (
                              <span className="text-gray-500">No</span>
                            )}
                            {inspection.outOfServiceReleaseDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Released: {formatDate(inspection.outOfServiceReleaseDate)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {inspection.violations && inspection.violations.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-red-600 font-medium">{inspection.violations.length} violation(s)</span>
                                {inspection.violations.slice(0, 2).map((v, idx) => (
                                  <span key={idx} className="text-xs text-gray-600 truncate max-w-[150px]" title={v.description}>
                                    {v.code}: {v.description}
                                  </span>
                                ))}
                                {inspection.violations.length > 2 && (
                                  <span className="text-xs text-gray-500">+{inspection.violations.length - 2} more</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-10">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewInspection(inspection)}
                              className="text-[var(--accent-color)] hover:text-[var(--accent-dark)] p-2 hover:bg-[var(--accent-soft)] rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditInspection(inspection)}
                              className="text-[var(--accent-color)] hover:text-[var(--accent-dark)] p-2 hover:bg-[var(--accent-soft)] rounded-lg transition-colors"
                              title="Edit Inspection"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteInspection(inspection)}
                              className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Inspection"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> inspections
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg border ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                        }`}
                    >
                      <FaChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === pageNum
                              ? 'bg-[var(--accent-color)] text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg border ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                        }`}
                    >
                      <FaChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Inspection Modal */}
        {showViewModal && selectedInspection && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">
                    Inspection Details: {selectedInspection.inspectionId}
                  </h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTimesCircle className="text-gray-500" size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Inspection Overview */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Inspection Overview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Inspection ID</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedInspection.inspectionId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
                      <p className="text-lg font-semibold text-gray-800 uppercase">{selectedInspection.country}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                      <p className="text-lg font-semibold text-gray-800">{formatDate(selectedInspection.date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedInspection.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedInspection.status)}
                        <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${getStatusBadgeColor(selectedInspection.status)}`}>
                          {selectedInspection.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Inspector</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedInspection.inspectorName}</p>
                    </div>
                    {selectedInspection.reportNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Report Number</label>
                        <p className="text-lg font-semibold text-gray-800">{selectedInspection.reportNumber}</p>
                      </div>
                    )}
                    {selectedInspection.inspectionLevel && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Inspection Level</label>
                        <p className="text-lg font-semibold text-gray-800">Level {selectedInspection.inspectionLevel}</p>
                      </div>
                    )}
                    {selectedInspection.jurisdiction && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Jurisdiction</label>
                        <p className="text-lg font-semibold text-gray-800">{selectedInspection.jurisdiction}</p>
                      </div>
                    )}
                    {selectedInspection.timeOfInspection && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Time of Inspection</label>
                        <p className="text-lg font-semibold text-gray-800">{selectedInspection.timeOfInspection}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Official Document Information */}
                {(selectedInspection.reportNumber || selectedInspection.inspectionLevel || selectedInspection.jurisdiction || selectedInspection.timeOfInspection) && (
                  <div className="rounded-xl p-6" style={{ backgroundColor: ACCENT_SOFT }}>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Official Document Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedInspection.reportNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Report Number</label>
                          <p className="text-lg font-semibold text-gray-800">{selectedInspection.reportNumber}</p>
                        </div>
                      )}
                      {selectedInspection.inspectionLevel && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Inspection Level</label>
                          <p className="text-lg font-semibold text-gray-800">Level {selectedInspection.inspectionLevel}</p>
                        </div>
                      )}
                      {selectedInspection.jurisdiction && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Jurisdiction (State/Province)</label>
                          <p className="text-lg font-semibold text-gray-800">{selectedInspection.jurisdiction}</p>
                        </div>
                      )}
                      {selectedInspection.timeOfInspection && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Time of Inspection</label>
                          <p className="text-lg font-semibold text-gray-800">{selectedInspection.timeOfInspection}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Driver & Carrier Information */}
                {(selectedInspection.driverLicenseNumber || selectedInspection.carrierUSDOTNumber || selectedInspection.carrierMotorCarrierNumber) && (
                  <div className="bg-green-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Driver & Carrier Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedInspection.driverLicenseNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Driver License Number</label>
                          <p className="text-lg font-semibold text-gray-800">{selectedInspection.driverLicenseNumber}</p>
                        </div>
                      )}
                      {selectedInspection.carrierUSDOTNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Carrier USDOT Number</label>
                          <p className="text-lg font-semibold text-gray-800">{selectedInspection.carrierUSDOTNumber}</p>
                        </div>
                      )}
                      {selectedInspection.carrierMotorCarrierNumber && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Carrier MC Number</label>
                          <p className="text-lg font-semibold text-gray-800">{selectedInspection.carrierMotorCarrierNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Out-of-Service Information */}
                {(selectedInspection.outOfServiceIssued || selectedInspection.defectRepairNeeded || selectedInspection.outOfServiceReleaseDate) && (
                  <div className="bg-red-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Out-of-Service Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Out-of-Service Order Issued</label>
                        <p className="text-lg font-semibold text-gray-800">
                          {selectedInspection.outOfServiceIssued ? (
                            <span className="text-red-600">Yes</span>
                          ) : (
                            <span className="text-green-600">No</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Defect Repair Needed</label>
                        <p className="text-lg font-semibold text-gray-800">
                          {selectedInspection.defectRepairNeeded ? (
                            <span className="text-red-600">Yes</span>
                          ) : (
                            <span className="text-green-600">No</span>
                          )}
                        </p>
                      </div>
                      {selectedInspection.outOfServiceReleaseDate && (
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-600 mb-1">Out-of-Service Release Date</label>
                          <p className="text-lg font-semibold text-gray-800">{formatDate(selectedInspection.outOfServiceReleaseDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documentation */}
                {selectedInspection.documentLink && (
                  <div className="bg-[var(--accent-soft)] rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Documentation</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Document Link</label>
                      <a
                        href={selectedInspection.documentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-[var(--accent-color)] hover:text-[var(--accent-dark)] underline break-all"
                      >
                        {selectedInspection.documentLink}
                      </a>
                    </div>
                  </div>
                )}

                {/* Vehicle & Driver Info */}
                <div className="rounded-xl p-6" style={{ backgroundColor: ACCENT_SOFT }}>
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Vehicle & Driver Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
                      <p className="text-lg font-semibold text-gray-800">{getVehicleInfo(selectedInspection.vehicle)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Driver</label>
                      <p className="text-lg font-semibold text-gray-800">{getDriverName(selectedInspection.driver)}</p>
                    </div>
                  </div>
                </div>

                {/* Violations */}
                {selectedInspection.violations && selectedInspection.violations.length > 0 && (
                  <div className="bg-red-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Violations Found</h4>
                    <div className="space-y-3">
                      {selectedInspection.violations.map((violation) => (
                        <div key={violation._id} className="bg-white rounded-lg p-4 border border-red-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {violation.code}
                                </span>
                                <span className={`text-sm font-semibold ${getSeverityColor(violation.severity)}`}>
                                  {violation.severity.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-gray-800">{violation.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedInspection.notes && (
                  <div className="bg-yellow-50 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4">Inspector Notes</h4>
                    <p className="text-gray-800">{selectedInspection.notes}</p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Inspection Sidebar Panel */}
        {showAddModal && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] transition-all duration-500" onClick={() => setShowAddModal(false)} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between" style={{ background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`, }}>
                  <h3 className="text-xl font-bold text-white">Add Inspection</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                    <FaTimes size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                        <select
                          value={inspectionForm.country}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, country: e.target.value as 'canada' | 'usa' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        >
                          <option value="canada">Canada</option>
                          <option value="usa">USA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          value={inspectionForm.date || ''}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Enter inspection location"
                          value={inspectionForm.location || ''}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                        <select
                          value={inspectionForm.status}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, status: e.target.value as Inspection['status'] }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        >
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="warning">Warning</option>
                          <option value="out-of-service">Out of Service</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspector <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Inspector name"
                          value={inspectionForm.inspectorName || ''}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, inspectorName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver <span className="text-red-500">*</span></label>
                        <select
                          value={typeof inspectionForm.driver === 'string' ? inspectionForm.driver : inspectionForm.driver?._id || ''}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, driver: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>{driver.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                        <select
                          value={typeof inspectionForm.vehicle === 'string' ? inspectionForm.vehicle : inspectionForm.vehicle?._id || ''}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, vehicle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        >
                          <option value="">Select Vehicle</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle._id} value={vehicle._id}>
                              {(() => {
                                const vehicleName = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim() || vehicle.makeModel || 'Vehicle';
                                const identifier = vehicle.plateNumber || vehicle.licensePlate || vehicle.internalId || 'N/A';
                                return `${vehicleName} (${identifier})`;
                              })()}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          placeholder="Additional notes"
                          value={inspectionForm.notes || ''}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Official Document Numbers Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Official Document Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Number <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="Inspection Report Number"
                            value={inspectionForm.reportNumber || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, reportNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Level <span className="text-red-500">*</span></label>
                          <select
                            value={inspectionForm.inspectionLevel || 'I'}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, inspectionLevel: e.target.value as 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          >
                            <option value="I">Level I</option>
                            <option value="II">Level II</option>
                            <option value="III">Level III</option>
                            <option value="IV">Level IV</option>
                            <option value="V">Level V</option>
                            <option value="VI">Level VI</option>
                            <option value="VII">Level VII</option>
                            <option value="VIII">Level VIII</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction (State/Province)</label>
                          <input
                            type="text"
                            placeholder="e.g., ON, TX, CA"
                            value={inspectionForm.jurisdiction || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, jurisdiction: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time of Inspection</label>
                          <input
                            type="time"
                            value={inspectionForm.timeOfInspection || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, timeOfInspection: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Driver & Carrier Information Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Driver & Carrier Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Driver License Number</label>
                          <input
                            type="text"
                            placeholder="Driver's License Number"
                            value={inspectionForm.driverLicenseNumber || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, driverLicenseNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Carrier USDOT Number</label>
                          <input
                            type="text"
                            placeholder="USDOT Number (USA only)"
                            value={inspectionForm.carrierUSDOTNumber || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, carrierUSDOTNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Carrier MC Number</label>
                          <input
                            type="text"
                            placeholder="Motor Carrier Number (if applicable)"
                            value={inspectionForm.carrierMotorCarrierNumber || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, carrierMotorCarrierNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Out-of-Service Information Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Out-of-Service Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <input
                              type="checkbox"
                              checked={inspectionForm.outOfServiceIssued || false}
                              onChange={(e) => setInspectionForm(prev => ({ ...prev, outOfServiceIssued: e.target.checked }))}
                              className="rounded border-gray-300 text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                            />
                            Out-of-Service Order Issued
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <input
                              type="checkbox"
                              checked={inspectionForm.defectRepairNeeded || false}
                              onChange={(e) => setInspectionForm(prev => ({ ...prev, defectRepairNeeded: e.target.checked }))}
                              className="rounded border-gray-300 text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                            />
                            Defect Repair Needed
                          </label>
                        </div>
                        {inspectionForm.outOfServiceIssued && (
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Out-of-Service Release Date</label>
                            <input
                              type="date"
                              value={inspectionForm.outOfServiceReleaseDate || ''}
                              onChange={(e) => setInspectionForm(prev => ({ ...prev, outOfServiceReleaseDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Link Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Documentation</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Link (PDF/Image)</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Create a local URL for preview/storage
                              const fileUrl = URL.createObjectURL(file);
                              setInspectionForm(prev => ({ ...prev, documentLink: fileUrl }));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-soft)] file:text-[var(--accent-color)] hover:file:bg-purple-100 cursor-pointer"
                        />
                        {inspectionForm.documentLink && inspectionForm.documentLink.startsWith('blob:') && (
                          <p className="mt-2 text-sm text-gray-600">
                            Selected file: <span className="font-medium">{inspectionForm.documentLink.split('/').pop()}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                  <button type="button" onClick={saveNewInspection} className="px-6 py-2.5 bg-[var(--accent-color)] !text-white rounded-lg hover:bg-[var(--accent-dark)] font-medium transition-colors disabled:opacity-60" disabled={!validateForm() || loading}>
                    {loading ? 'Saving...' : 'Save Inspection'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edit Inspection Sidebar Panel */}
        {showEditModal && selectedInspection && (
          <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] transition-all duration-500" onClick={() => setShowEditModal(false)} />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[80vw] xl:w-[70vw] bg-white shadow-2xl transform transition-transform duration-500 ease-out z-[101] border-l border-gray-200">
              <div className="h-full flex flex-col">
                <div className="flex-shrink-0  px-6 py-4 flex items-center justify-between" style={{ background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`, }}>
                  <h3 className="text-xl font-bold text-white">Edit Inspection: {selectedInspection.inspectionId}</h3>
                  <button onClick={() => setShowEditModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                    <FaTimes size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                        <select
                          value={inspectionForm.country}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, country: e.target.value as 'canada' | 'usa' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        >
                          <option value="canada">Canada</option>
                          <option value="usa">USA</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                        <input type="date" value={inspectionForm.date || ''} onChange={(e) => setInspectionForm(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                        <input type="text" value={inspectionForm.location || ''} onChange={(e) => setInspectionForm(prev => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                        <select value={inspectionForm.status} onChange={(e) => setInspectionForm(prev => ({ ...prev, status: e.target.value as Inspection['status'] }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent">
                          <option value="pass">Pass</option>
                          <option value="fail">Fail</option>
                          <option value="warning">Warning</option>
                          <option value="out-of-service">Out of Service</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspector <span className="text-red-500">*</span></label>
                        <input type="text" value={inspectionForm.inspectorName || ''} onChange={(e) => setInspectionForm(prev => ({ ...prev, inspectorName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver <span className="text-red-500">*</span></label>
                        <select
                          value={typeof inspectionForm.driver === 'string' ? inspectionForm.driver : inspectionForm.driver?._id || ''}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, driver: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>{driver.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                        <select
                          value={typeof inspectionForm.vehicle === 'string' ? inspectionForm.vehicle : inspectionForm.vehicle?._id || ''}
                          onChange={(e) => setInspectionForm(prev => ({ ...prev, vehicle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        >
                          <option value="">Select Vehicle</option>
                          {vehicles.map((vehicle) => (
                            <option key={vehicle._id} value={vehicle._id}>
                              {(() => {
                                const vehicleName = [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim() || vehicle.makeModel || 'Vehicle';
                                const identifier = vehicle.plateNumber || vehicle.licensePlate || vehicle.internalId || 'N/A';
                                return `${vehicleName} (${identifier})`;
                              })()}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea value={inspectionForm.notes || ''} onChange={(e) => setInspectionForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent" rows={3} />
                      </div>
                    </div>

                    {/* Official Document Numbers Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Official Document Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Report Number <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            placeholder="Inspection Report Number"
                            value={inspectionForm.reportNumber || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, reportNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Inspection Level <span className="text-red-500">*</span></label>
                          <select
                            value={inspectionForm.inspectionLevel || 'I'}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, inspectionLevel: e.target.value as 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          >
                            <option value="I">Level I</option>
                            <option value="II">Level II</option>
                            <option value="III">Level III</option>
                            <option value="IV">Level IV</option>
                            <option value="V">Level V</option>
                            <option value="VI">Level VI</option>
                            <option value="VII">Level VII</option>
                            <option value="VIII">Level VIII</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction (State/Province)</label>
                          <input
                            type="text"
                            placeholder="e.g., ON, TX, CA"
                            value={inspectionForm.jurisdiction || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, jurisdiction: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time of Inspection</label>
                          <input
                            type="time"
                            value={inspectionForm.timeOfInspection || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, timeOfInspection: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Driver & Carrier Information Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Driver & Carrier Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Driver License Number</label>
                          <input
                            type="text"
                            placeholder="Driver's License Number"
                            value={inspectionForm.driverLicenseNumber || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, driverLicenseNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Carrier USDOT Number</label>
                          <input
                            type="text"
                            placeholder="USDOT Number (USA only)"
                            value={inspectionForm.carrierUSDOTNumber || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, carrierUSDOTNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Carrier MC Number</label>
                          <input
                            type="text"
                            placeholder="Motor Carrier Number (if applicable)"
                            value={inspectionForm.carrierMotorCarrierNumber || ''}
                            onChange={(e) => setInspectionForm(prev => ({ ...prev, carrierMotorCarrierNumber: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Out-of-Service Information Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Out-of-Service Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <input
                              type="checkbox"
                              checked={inspectionForm.outOfServiceIssued || false}
                              onChange={(e) => setInspectionForm(prev => ({ ...prev, outOfServiceIssued: e.target.checked }))}
                              className="rounded border-gray-300 text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                            />
                            Out-of-Service Order Issued
                          </label>
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <input
                              type="checkbox"
                              checked={inspectionForm.defectRepairNeeded || false}
                              onChange={(e) => setInspectionForm(prev => ({ ...prev, defectRepairNeeded: e.target.checked }))}
                              className="rounded border-gray-300 text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                            />
                            Defect Repair Needed
                          </label>
                        </div>
                        {inspectionForm.outOfServiceIssued && (
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Out-of-Service Release Date</label>
                            <input
                              type="date"
                              value={inspectionForm.outOfServiceReleaseDate || ''}
                              onChange={(e) => setInspectionForm(prev => ({ ...prev, outOfServiceReleaseDate: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Document Link Section */}
                    <div className="border-t pt-6 mt-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">Documentation</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Link (PDF/Image)</label>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Create a local URL for preview/storage
                              const fileUrl = URL.createObjectURL(file);
                              setInspectionForm(prev => ({ ...prev, documentLink: fileUrl }));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-soft)] file:text-[var(--accent-color)] hover:file:bg-purple-100 cursor-pointer"
                        />
                        {inspectionForm.documentLink && inspectionForm.documentLink.startsWith('blob:') && (
                          <p className="mt-2 text-sm text-gray-600">
                            Selected file: <span className="font-medium">{inspectionForm.documentLink.split('/').pop()}</span>
                          </p>
                        )}
                        {inspectionForm.documentLink && !inspectionForm.documentLink.startsWith('blob:') && (
                          <p className="mt-2 text-sm text-gray-600">
                            Current document: <a href={inspectionForm.documentLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{inspectionForm.documentLink}</a>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                  <button onClick={() => setShowEditModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                  <button onClick={updateInspection} className="px-6 py-2.5 bg-[var(--accent-color)] !text-white rounded-lg hover:bg-[var(--accent-dark)] font-medium transition-colors disabled:opacity-60" disabled={!validateForm() || loading}>
                    {loading ? 'Updating...' : 'Update Inspection'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && inspectionToDelete && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <FaTimesCircle className="text-red-600" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Delete Inspection</h3>
                </div>
                <p className="text-gray-600 mb-6">Are you sure you want to delete inspection <span className="font-semibold">{inspectionToDelete.inspectionId}</span>? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setShowDeleteModal(false); setInspectionToDelete(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors" disabled={loading}>Cancel</button>
                  <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-60" disabled={loading}>
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CvsaInspection;
