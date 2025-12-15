import React, { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import {
  FaExclamationTriangle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaSearch,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import {
  getIncidents,
  getIncidentStats,
  createIncident,
  updateIncident,
  deleteIncident
} from '../../../../axios/api/admin';
import { createIssue } from '../../../../axios/api/distapcher';
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
interface ActionTakenLog {
  date: string;
  action: string;
  takenBy: string;
  notes?: string;
}

interface CostTracking {
  category: string;
  estimated: number;
  actual?: number;
  notes?: string;
}

interface Incident {
  _id: string;
  incidentNumber: string;
  incidentDateTime: string;
  location: {
    city: string;
    stateProvince: string;
    country: 'usa' | 'canada';
  };
  incidentType: string;
  incidentStatus: 'open' | 'under-review' | 'closed';
  caseFileNumber?: string;
  supportingMedia?: string[];

  // Personnel Details
  driver: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  driversLicense?: string;
  reportingParty?: string;

  // Equipment Details
  unitNumber?: string;
  trailerNumber?: string;
  vinPlateNumber?: string;
  damageDescription?: string;

  // Investigation & Follow-up
  actionTakenLog?: ActionTakenLog[];
  preventativeMeasures?: string;
  costTracking?: CostTracking[];
  cvsaDotImpact?: boolean;
  fmcsaReportable?: boolean;
  fmcsaNotes?: string;

  // Additional fields
  description?: string;
  witnessInfo?: string;
  policeReportNumber?: string;
  notes?: string;
  createdAt: string;
}

interface Vehicle {
  _id: string;
  unitNo: string;
  internalId?: string;
  licensePlate: string;
  plateNumber?: string;
  makeModel: string;
  make?: string;
  model?: string;
  year?: number;
  vinNo?: string;
  vin?: string;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
  licenseNumber?: string;
}

interface Trailer {
  _id: string;
  trailer: string;
  internalId?: string;
  plateNumber?: string;
}

interface IncidentForm {
  incidentDateTime: string;
  location: {
    city: string;
    stateProvince: string;
    country: 'usa' | 'canada';
  };
  incidentType: string;
  incidentStatus: 'open' | 'under-review' | 'closed';
  caseFileNumber?: string;
  supportingMedia?: string[];
  driver: string;
  driversLicense?: string;
  reportingParty?: string;
  unitNumber?: string;
  alsoCreateAsAccident?: boolean;
  trailerNumber?: string;
  vinPlateNumber?: string;
  damageDescription?: string;
  description?: string;
  witnessInfo?: string;
  policeReportNumber?: string;
  actionTakenLog?: ActionTakenLog[];
  preventativeMeasures?: string;
  costTracking?: CostTracking[];
  cvsaDotImpact?: boolean;
  fmcsaReportable?: boolean;
  fmcsaNotes?: string;
  notes?: string;
}

// Toast Notification Component
type NotificationType = 'success' | 'error' | 'info';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

const icons = {
  success: <FaCheckCircle className="text-green-600" size={20} />,
  error: <FaExclamationCircle className="text-red-600" size={20} />,
  info: <FaInfoCircle className="text-[var(--accent-color)]" size={20} />,
};

const ToastNotification: React.FC<ToastNotification & { onRemove: () => void }> = ({ type, message, onRemove }) => {
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 bg-white px-6 py-4 rounded-lg shadow-lg border-l-4 ${type === 'success' ? 'border-green-500' : type === 'error' ? 'border-red-500' : 'border-blue-500'} animate-slide-in`}>
      {icons[type]}
      <p className="text-gray-800 font-medium">{message}</p>
      <button onClick={onRemove} className="ml-4 text-gray-400 hover:text-gray-600">
        <FaTimes size={16} />
      </button>
    </div>
  );
};

const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);

  // Form state
  const [incidentForm, setIncidentForm] = useState<IncidentForm>({
    incidentDateTime: '',
    location: {
      city: '',
      stateProvince: '',
      country: 'usa'
    },
    incidentType: '',
    incidentStatus: 'open',
    driver: '',
    alsoCreateAsAccident: false // New field for creating accident
  });

  // Notifications
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const notificationIdRef = useRef(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    underReview: 0,
    closed: 0
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, locationFilter, driverFilter]);

  useEffect(() => {
    loadDrivers();
    loadVehicles();
    loadTrailers();
    loadStats();
  }, []);

  useEffect(() => {
    refreshData();
  }, [statusFilter, typeFilter, locationFilter, driverFilter, debouncedSearch, currentPage, pageSize]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: 'incidentDateTime',
        sortOrder: 'desc'
      };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (locationFilter !== 'all') params.location = locationFilter;
      if (driverFilter !== 'all') params.driver = driverFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await getIncidents(params);
      if (res && res.success && res.data) {
        setIncidents(res.data);
        if (res.pagination) {
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
          // If current page is beyond total pages, reset to last page
          if (currentPage > res.pagination.totalPages && res.pagination.totalPages > 0) {
            setCurrentPage(res.pagination.totalPages);
          }
        }
      } else {
        setIncidents([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      addNotification('error', 'Failed to load incidents');
      setIncidents([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const res = await listDriver();
      if (res && res.data) {
        setDrivers(res.data);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await listFleetUnits({ category: 'trucks' });
      if (res && res.success && res.data) {
        // Map FleetUnit to Vehicle format for compatibility
        const mappedVehicles: Vehicle[] = res.data.map((unit: FleetUnitDto) => ({
          _id: unit._id,
          unitNo: unit.unitNo,
          internalId: unit.internalId,
          licensePlate: unit.licensePlate,
          plateNumber: unit.licensePlate,
          makeModel: unit.makeModel,
          make: unit.make,
          model: unit.model,
          year: unit.year,
          vinNo: unit.vinNo,
          vin: unit.vinNo
        }));
        setVehicles(mappedVehicles);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const loadTrailers = async () => {
    try {
      const res = await listFleetUnits({ category: 'trailers' });
      if (res && res.success && res.data) {
        // Map FleetUnit to Trailer format for compatibility
        const mappedTrailers: Trailer[] = res.data
          .filter((unit: FleetUnitDto) => unit.unitType !== 'Truck' && unit.unitType !== 'Bus/Van')
          .map((unit: FleetUnitDto) => ({
            _id: unit._id,
            trailer: unit.unitNo || unit.licensePlate || unit.internalId || 'Trailer',
            internalId: unit.internalId || unit.unitNo,
            plateNumber: unit.licensePlate || unit.unitNo || unit.internalId || 'N/A'
          }));
        setTrailers(mappedTrailers);
      }
    } catch (error) {
      console.error('Error loading trailers:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getIncidentStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getDriverName = (driver: Incident['driver']): string => {
    if (!driver) return 'N/A';
    if (typeof driver === 'string') {
      const found = drivers.find(d => d._id === driver);
      return found?.name || driver;
    }
    return driver?.name || 'N/A';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <FaExclamationCircle className="text-red-600" size={20} />;
      case 'under-review':
        return <FaInfoCircle className="text-orange-600" size={20} />;
      case 'closed':
        return <FaCheckCircle className="text-green-600" size={20} />;
      default:
        return <FaExclamationTriangle className="text-gray-600" size={20} />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'under-review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };




  const resetForm = () => {
    setIncidentForm({
      incidentDateTime: '',
      location: {
        city: '',
        stateProvince: '',
        country: 'usa'
      },
      incidentType: '',
      incidentStatus: 'open',
      driver: '',
      alsoCreateAsAccident: false
    });
  };

  const handleAddIncident = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setIncidentForm({
      incidentDateTime: incident.incidentDateTime ? new Date(incident.incidentDateTime).toISOString().slice(0, 16) : '',
      location: {
        city: incident.location?.city || '',
        stateProvince: incident.location?.stateProvince || '',
        country: incident.location?.country || 'usa'
      },
      incidentType: incident.incidentType || '',
      incidentStatus: incident.incidentStatus || 'open',
      caseFileNumber: incident.caseFileNumber || '',
      driver: typeof incident.driver === 'string' ? incident.driver : incident.driver?._id || '',
      driversLicense: incident.driversLicense || '',
      reportingParty: incident.reportingParty || '',
      unitNumber: incident.unitNumber || '',
      trailerNumber: incident.trailerNumber || '',
      vinPlateNumber: incident.vinPlateNumber || '',
      damageDescription: incident.damageDescription || '',
      description: incident.description || '',
      witnessInfo: incident.witnessInfo || '',
      policeReportNumber: incident.policeReportNumber || '',
      actionTakenLog: incident.actionTakenLog || [],
      preventativeMeasures: incident.preventativeMeasures || '',
      costTracking: incident.costTracking || [],
      cvsaDotImpact: incident.cvsaDotImpact || false,
      fmcsaReportable: incident.fmcsaReportable || false,
      fmcsaNotes: incident.fmcsaNotes || '',
      notes: incident.notes || ''
    });
    setShowEditModal(true);
  };

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setShowViewModal(true);
  };

  const handleDeleteIncident = (incident: Incident) => {
    setIncidentToDelete(incident);
    setShowDeleteModal(true);
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = ++notificationIdRef.current;
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const validateForm = () => {
    return !!incidentForm.incidentDateTime &&
      !!incidentForm.location?.city &&
      !!incidentForm.location?.stateProvince &&
      !!incidentForm.incidentType &&
      !!incidentForm.driver;
  };

  const saveNewIncident = async () => {
    if (!validateForm()) {
      addNotification('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        incidentDateTime: incidentForm.incidentDateTime,
        location: incidentForm.location,
        incidentType: incidentForm.incidentType,
        incidentStatus: incidentForm.incidentStatus,
        driver: incidentForm.driver,
        caseFileNumber: incidentForm.caseFileNumber || '',
        driversLicense: incidentForm.driversLicense || '',
        reportingParty: incidentForm.reportingParty || '',
        unitNumber: incidentForm.unitNumber || '',
        trailerNumber: incidentForm.trailerNumber || '',
        vinPlateNumber: incidentForm.vinPlateNumber || '',
        damageDescription: incidentForm.damageDescription || '',
        description: incidentForm.description || '',
        witnessInfo: incidentForm.witnessInfo || '',
        policeReportNumber: incidentForm.policeReportNumber || '',
        actionTakenLog: incidentForm.actionTakenLog || [],
        preventativeMeasures: incidentForm.preventativeMeasures || '',
        costTracking: incidentForm.costTracking || [],
        cvsaDotImpact: incidentForm.cvsaDotImpact || false,
        fmcsaReportable: incidentForm.fmcsaReportable || false,
        fmcsaNotes: incidentForm.fmcsaNotes || '',
        notes: incidentForm.notes || ''
      };

      const res = await createIncident(payload);
      if (res && res.success && res.data) {
        // If "Also create as accident" is checked, create an Issue with issueType='accident'
        if (incidentForm.alsoCreateAsAccident) {
          try {
            // Find the vehicle (FleetUnit) by unitNumber
            let vehicleId = null;
            if (incidentForm.unitNumber) {
              const fleetUnitsResponse = await listFleetUnits({ category: 'trucks' });
              if (fleetUnitsResponse?.success && fleetUnitsResponse?.data) {
                const matchingUnit = fleetUnitsResponse.data.find(
                  (unit: FleetUnitDto) => unit.unitNo === incidentForm.unitNumber
                );
                if (matchingUnit) {
                  vehicleId = matchingUnit._id;
                }
              }
            }

            // Build address string from location
            const addressParts = [];
            if (incidentForm.location.city) addressParts.push(incidentForm.location.city);
            if (incidentForm.location.stateProvince) addressParts.push(incidentForm.location.stateProvince);
            const address = addressParts.join(', ') || undefined;

            // Create issue payload
            const issuePayload: any = {
              issueType: 'accident',
              issueCategory: 'minor-damage', // Default, can be adjusted
              issueReport: incidentForm.description || incidentForm.incidentType || 'Accident reported',
              priority: 'high', // Accidents are typically high priority
              status: incidentForm.incidentStatus === 'open' ? 'open' : incidentForm.incidentStatus === 'closed' ? 'closed' : 'in-progress',
              driver: incidentForm.driver,
              address: address
            };

            if (vehicleId) {
              issuePayload.vehicle = vehicleId;
            }

            if (incidentForm.reportingParty) {
              issuePayload.reportedBy = incidentForm.reportingParty;
            }

            // Create the issue
            const issueRes = await createIssue(issuePayload);
            if (issueRes && issueRes.success) {
              addNotification('success', 'Incident and accident created successfully');
            } else {
              addNotification('error', 'Incident created, but failed to create accident: ' + (issueRes?.message || 'Unknown error'));
            }
          } catch (issueError: any) {
            console.error('Error creating accident issue:', issueError);
            addNotification('error', 'Incident created, but failed to create accident: ' + (issueError?.response?.data?.message || issueError?.message || 'Unknown error'));
          }
        } else {
          addNotification('success', 'Incident created successfully');
        }

        setShowAddModal(false);
        resetForm();
        setCurrentPage(1); // Reset to first page to see the new incident
        await refreshData();
        await loadStats();
      } else {
        addNotification('error', res?.message || 'Failed to create incident');
      }
    } catch (error: any) {
      console.error('Error creating incident:', error);
      addNotification('error', error?.response?.data?.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  const saveEditedIncident = async () => {
    if (!validateForm() || !selectedIncident) {
      addNotification('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        incidentDateTime: incidentForm.incidentDateTime,
        location: incidentForm.location,
        incidentType: incidentForm.incidentType,
        incidentStatus: incidentForm.incidentStatus,
        driver: incidentForm.driver,
        caseFileNumber: incidentForm.caseFileNumber || '',
        driversLicense: incidentForm.driversLicense || '',
        reportingParty: incidentForm.reportingParty || '',
        unitNumber: incidentForm.unitNumber || '',
        trailerNumber: incidentForm.trailerNumber || '',
        vinPlateNumber: incidentForm.vinPlateNumber || '',
        damageDescription: incidentForm.damageDescription || '',
        description: incidentForm.description || '',
        witnessInfo: incidentForm.witnessInfo || '',
        policeReportNumber: incidentForm.policeReportNumber || '',
        actionTakenLog: incidentForm.actionTakenLog || [],
        preventativeMeasures: incidentForm.preventativeMeasures || '',
        costTracking: incidentForm.costTracking || [],
        cvsaDotImpact: incidentForm.cvsaDotImpact || false,
        fmcsaReportable: incidentForm.fmcsaReportable || false,
        fmcsaNotes: incidentForm.fmcsaNotes || '',
        notes: incidentForm.notes || ''
      };

      const res = await updateIncident(selectedIncident._id, payload);
      if (res && res.success && res.data) {
        addNotification('success', 'Incident updated successfully');
        setShowEditModal(false);
        setSelectedIncident(null);
        resetForm();
        await refreshData();
        await loadStats();
      } else {
        addNotification('error', res?.message || 'Failed to update incident');
      }
    } catch (error: any) {
      console.error('Error updating incident:', error);
      addNotification('error', error?.response?.data?.message || 'Failed to update incident');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!incidentToDelete) return;

    setLoading(true);
    try {
      const res = await deleteIncident(incidentToDelete._id);
      if (res && res.success) {
        addNotification('success', 'Incident deleted successfully');
        setShowDeleteModal(false);
        setIncidentToDelete(null);
        // If we're on the last page and it becomes empty, go to previous page
        if (incidents.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        await refreshData();
        await loadStats();
      } else {
        addNotification('error', res?.message || 'Failed to delete incident');
      }
    } catch (error: any) {
      console.error('Error deleting incident:', error);
      addNotification('error', error?.response?.data?.message || 'Failed to delete incident');
    } finally {
      setLoading(false);
    }
  };

  // Get unique incident types for filter
  const incidentTypes = Array.from(new Set(incidents.map(i => i.incidentType).filter(Boolean)));

  // Get unique locations for filter
  const locations = Array.from(new Set(
    incidents
      .map(i => i.location?.stateProvince || i.location?.city)
      .filter(Boolean)
  ));

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
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xl font-bold text-gray-900">{value}</span>
            </div>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={`${bgColor} rounded-lg p-2 shadow-sm`}>
            {React.isValidElement(Icon) ? React.cloneElement(Icon as React.ReactElement<{ className?: string, size?: number }>, { className: iconColor, size: 21 }) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF', ...ACCENT_VARS }}>
      {/* Toast Notifications */}
      {notifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          {...notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}

      <div className="relative max-w-7xl mx-auto">


        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header */}
          <div className="mb-4 relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                  Incidents & Accidents
                </h1>
                <div className="flex items-center gap-2 text-black/90">
                  <span className="text-xs">Manage and track all incidents and accidents</span>
                </div>
              </div>
              <button
                onClick={handleAddIncident}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#0ea3d8] rounded-lg hover:bg-white/90 shadow-sm transition-all font-bold text-sm"
              >
                <FaPlus /> Report Incident
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 -mt-2 mb-6 relative z-10">
            <StatCard
              title="Total Incidents"
              value={stats.total}
              bgColor="bg-blue-50"
              iconColor="text-[#0ea3d8]"
              icon={<FaExclamationTriangle />}
            />
            <StatCard
              title="Open"
              value={stats.open}
              bgColor="bg-red-50"
              iconColor="text-red-600"
              icon={<FaExclamationCircle />}
            />
            <StatCard
              title="Under Review"
              value={stats.underReview}
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
              icon={<FaInfoCircle />}
            />
            <StatCard
              title="Closed"
              value={stats.closed}
              bgColor="bg-green-50"
              iconColor="text-green-600"
              icon={<FaCheckCircle />}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-4">
        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div className="md:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="under-review">Under Review</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
              >
                <option value="all">All Types</option>
                {incidentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={driverFilter}
                onChange={(e) => {
                  setDriverFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
              >
                <option value="all">All Drivers</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>{driver.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(currentPage * pageSize, total)}</span> of{' '}
              <span className="font-semibold">{total}</span> incidents
            </p>
            <button
              onClick={handleAddIncident}
              className="px-6 py-2.5 bg-[var(--accent-color)] !text-white rounded-lg hover:bg-[var(--accent-dark)] font-medium transition-colors flex items-center gap-2"
            >
              <FaPlus size={16} />
              Add Incident
            </button>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Incident #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit/Trailer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Case File #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      Loading incidents...
                    </td>
                  </tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No incidents found
                    </td>
                  </tr>
                ) : (
                  incidents.map((incident) => (
                    <tr key={incident._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium sticky left-0 bg-white z-10">
                        <p className="text-sm font-semibold text-gray-800">{incident.incidentNumber || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaCalendarAlt size={14} />
                          {incident.incidentDateTime ? formatDate(incident.incidentDateTime) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-gray-800">{incident.incidentType || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaMapMarkerAlt size={14} />
                          <span>
                            {incident.location?.city || ''}{incident.location?.city && incident.location?.stateProvince ? ', ' : ''}
                            {incident.location?.stateProvince || ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaUser size={14} />
                          {getDriverName(incident.driver)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {incident.unitNumber ? `Unit: ${incident.unitNumber}` : 'N/A'}
                          {incident.trailerNumber && (
                            <div className="text-xs text-gray-500">Trailer: {incident.trailerNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-gray-600">{incident.caseFileNumber || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(incident.incidentStatus)}
                          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getStatusBadgeColor(incident.incidentStatus)}`}>
                            {incident.incidentStatus?.toUpperCase().replace('-', ' ') || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-10">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewIncident(incident)}
                            className="text-[var(--accent-color)] hover:text-[var(--accent-dark)] p-2 hover:bg-[var(--accent-soft)] rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditIncident(incident)}
                            className="text-[var(--accent-color)] hover:text-[var(--accent-dark)] p-2 hover:bg-[var(--accent-soft)] rounded-lg transition-colors"
                            title="Edit Incident"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteIncident(incident)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Incident"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {total > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                <span className="font-medium">{total}</span> incidents
              </div>
              {totalPages > 1 && (
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
                  <div className="flex gap-1">
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
                          className={`px-3 py-2 rounded-lg border ${currentPage === pageNum
                            ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
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
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-4 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700"
                  >
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Incident Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Add New Incident</h3>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <FaTimesCircle className="text-gray-500" size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Essential Incident Details */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Essential Incident Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date/Time <span className="text-red-500">*</span></label>
                      <input
                        type="datetime-local"
                        value={incidentForm.incidentDateTime || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, incidentDateTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case/File Number</label>
                      <input
                        type="text"
                        placeholder="Case or file number"
                        value={incidentForm.caseFileNumber || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, caseFileNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                      <select
                        value={incidentForm.location?.country || 'usa'}
                        onChange={(e) => setIncidentForm(prev => ({
                          ...prev,
                          location: { ...prev.location, country: e.target.value as 'usa' | 'canada' }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      >
                        <option value="usa">USA</option>
                        <option value="canada">Canada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {incidentForm.location?.country === 'canada' ? 'Province' : 'State'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={incidentForm.location?.country === 'canada' ? 'Province' : 'State'}
                        value={incidentForm.location?.stateProvince || ''}
                        onChange={(e) => setIncidentForm(prev => ({
                          ...prev,
                          location: { ...prev.location, stateProvince: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="City"
                        value={incidentForm.location?.city || ''}
                        onChange={(e) => setIncidentForm(prev => ({
                          ...prev,
                          location: { ...prev.location, city: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="e.g., Deer accident, Driver error, Hit another vehicle"
                        value={incidentForm.incidentType || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, incidentType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Incident Status <span className="text-red-500">*</span></label>
                      <select
                        value={incidentForm.incidentStatus || 'open'}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, incidentStatus: e.target.value as 'open' | 'under-review' | 'closed' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      >
                        <option value="open">Open</option>
                        <option value="under-review">Under Review</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Incident Description</label>
                      <textarea
                        placeholder="Detailed description of the incident"
                        value={incidentForm.description || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Media URLs</label>
                      <input
                        type="text"
                        placeholder="Comma-separated URLs for photos, videos, or reports"
                        value={(incidentForm.supportingMedia || []).join(', ')}
                        onChange={(e) => setIncidentForm(prev => ({
                          ...prev,
                          supportingMedia: e.target.value ? e.target.value.split(',').map(url => url.trim()).filter(Boolean) : []
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Personnel Details */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Personnel Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Driver <span className="text-red-500">*</span></label>
                      <select
                        value={incidentForm.driver || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, driver: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      >
                        <option value="">Select Driver</option>
                        {drivers.map((driver) => (
                          <option key={driver._id} value={driver._id}>{driver.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Driver's License #</label>
                      <input
                        type="text"
                        placeholder="Driver's license number"
                        value={incidentForm.driversLicense || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, driversLicense: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Party</label>
                      <input
                        type="text"
                        placeholder="Who filed the report (if different from driver)"
                        value={incidentForm.reportingParty || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, reportingParty: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Witness Information</label>
                      <input
                        type="text"
                        placeholder="Witness names and contact info"
                        value={incidentForm.witnessInfo || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, witnessInfo: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Police Report Number</label>
                      <input
                        type="text"
                        placeholder="Police report number (if applicable)"
                        value={incidentForm.policeReportNumber || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, policeReportNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Equipment Details */}
                <div className="bg-[var(--accent-soft)] rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Equipment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                      <select
                        value={incidentForm.unitNumber || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, unitNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      >
                        <option value="">Select Truck</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle._id} value={vehicle.unitNo}>
                            {vehicle.unitNo} - {vehicle.makeModel} ({vehicle.licensePlate})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trailer Number</label>
                      <select
                        value={incidentForm.trailerNumber || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, trailerNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      >
                        <option value="">Select Trailer</option>
                        {trailers.map((trailer) => {
                          const identifier = trailer.plateNumber || trailer.internalId || trailer.trailer || 'N/A';
                          const displayName = trailer.trailer || trailer.plateNumber || trailer.internalId || 'Trailer';
                          return (
                            <option key={trailer._id} value={trailer.trailer || trailer.internalId || trailer._id}>
                              {displayName} {identifier !== displayName ? `(${identifier})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">VIN / Plate #</label>
                      <input
                        type="text"
                        placeholder="VIN or plate number"
                        value={incidentForm.vinPlateNumber || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, vinPlateNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Damage Description</label>
                      <textarea
                        placeholder="Detailed description of damage sustained"
                        value={incidentForm.damageDescription || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, damageDescription: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Investigation & Follow-up */}
                <div className="bg-orange-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Investigation & Follow-up</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={incidentForm.fmcsaReportable || false}
                          onChange={(e) => setIncidentForm(prev => ({ ...prev, fmcsaReportable: e.target.checked }))}
                          className="w-4 h-4 text-[var(--accent-color)] border-gray-300 rounded focus:ring-[var(--accent-color)]"
                        />
                        <span className="text-sm font-medium text-gray-700">FMCSA Reportable Accident</span>
                      </label>
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={incidentForm.cvsaDotImpact || false}
                          onChange={(e) => setIncidentForm(prev => ({ ...prev, cvsaDotImpact: e.target.checked }))}
                          className="w-4 h-4 text-[var(--accent-color)] border-gray-300 rounded focus:ring-[var(--accent-color)]"
                        />
                        <span className="text-sm font-medium text-gray-700">CVSA & DOT Impact</span>
                      </label>
                    </div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={incidentForm.alsoCreateAsAccident || false}
                          onChange={(e) => setIncidentForm(prev => ({ ...prev, alsoCreateAsAccident: e.target.checked }))}
                          className="w-4 h-4 text-[var(--accent-color)] border-gray-300 rounded focus:ring-[var(--accent-color)]"
                        />
                        <span className="text-sm font-medium text-gray-700">Also create as accident (Issue)</span>
                        <span className="text-xs text-gray-500">(Creates an accident record in the Issues system)</span>
                      </label>
                    </div>
                    {incidentForm.fmcsaReportable && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">FMCSA Notes</label>
                        <textarea
                          placeholder="FMCSA reporting details"
                          value={incidentForm.fmcsaNotes || ''}
                          onChange={(e) => setIncidentForm(prev => ({ ...prev, fmcsaNotes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                          rows={2}
                        />
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preventative Measures</label>
                      <textarea
                        placeholder="Record any changes to policies or training implemented"
                        value={incidentForm.preventativeMeasures || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, preventativeMeasures: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                      <textarea
                        placeholder="Any additional notes or comments"
                        value={incidentForm.notes || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
                <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors" disabled={loading}>
                  Cancel
                </button>
                <button onClick={saveNewIncident} className="px-6 py-2.5 bg-[var(--accent-color)] !text-white rounded-lg hover:bg-[var(--accent-dark)] font-medium transition-colors disabled:opacity-60" disabled={!validateForm() || loading}>
                  {loading ? 'Saving...' : 'Save Incident'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Incident Modal - Similar structure to Add Modal */}
        {showEditModal && selectedIncident && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Edit Incident: {selectedIncident.incidentNumber}</h3>
                  <button onClick={() => { setShowEditModal(false); setSelectedIncident(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <FaTimesCircle className="text-gray-500" size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Similar form structure to Add Modal - using incidentForm state */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Essential Incident Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date/Time <span className="text-red-500">*</span></label>
                      <input
                        type="datetime-local"
                        value={incidentForm.incidentDateTime || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, incidentDateTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={incidentForm.incidentType || ''}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, incidentType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                      <select
                        value={incidentForm.incidentStatus || 'open'}
                        onChange={(e) => setIncidentForm(prev => ({ ...prev, incidentStatus: e.target.value as 'open' | 'under-review' | 'closed' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                      >
                        <option value="open">Open</option>
                        <option value="under-review">Under Review</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Add other sections similar to Add Modal */}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
                <button onClick={() => { setShowEditModal(false); setSelectedIncident(null); resetForm(); }} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors" disabled={loading}>
                  Cancel
                </button>
                <button onClick={saveEditedIncident} className="px-6 py-2.5 bg-[var(--accent-color)] !text-white rounded-lg hover:bg-[var(--accent-dark)] font-medium transition-colors disabled:opacity-60" disabled={!validateForm() || loading}>
                  {loading ? 'Updating...' : 'Update Incident'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Incident Modal - Display all fields in read-only mode */}
        {showViewModal && selectedIncident && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Incident Details: {selectedIncident.incidentNumber}</h3>
                  <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <FaTimesCircle className="text-gray-500" size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Display all incident fields in read-only mode */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Incident Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Incident Number</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedIncident.incidentNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Date/Time</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedIncident.incidentDateTime ? formatDate(selectedIncident.incidentDateTime) : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedIncident.incidentType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedIncident.incidentStatus)}
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getStatusBadgeColor(selectedIncident.incidentStatus)}`}>
                          {selectedIncident.incidentStatus?.toUpperCase().replace('-', ' ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                      <p className="text-lg font-semibold text-gray-800">
                        {selectedIncident.location?.city || ''}{selectedIncident.location?.city && selectedIncident.location?.stateProvince ? ', ' : ''}
                        {selectedIncident.location?.stateProvince || ''}
                        {selectedIncident.location?.country ? ` (${selectedIncident.location.country.toUpperCase()})` : ''}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Driver</label>
                      <p className="text-lg font-semibold text-gray-800">{getDriverName(selectedIncident.driver)}</p>
                    </div>
                  </div>
                  {selectedIncident.description && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                      <p className="text-gray-800">{selectedIncident.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
                <button onClick={() => setShowViewModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && incidentToDelete && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <FaExclamationTriangle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Delete Incident</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete incident <span className="font-semibold">{incidentToDelete.incidentNumber}</span>?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setIncidentToDelete(null); }}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-60"
                    disabled={loading}
                  >
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

export default Incidents;
