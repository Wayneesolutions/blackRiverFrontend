import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import ExcelJS from 'exceljs';
import { Plus, Edit, Trash2, Search, Download, AlertCircle, Clock, X } from 'lucide-react';
import { FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import {
  listVehicleServices,
  createVehicleService,
  updateVehicleService,
  deleteVehicleService,
  getSamsaraUpcomingServices,
  type VehicleServiceData,
  type VehicleServiceResponse,
  type VehicleServiceType,
  type ServiceFilters
} from '../../../../axios/api/vehicleService';
import { getAllVehicles } from '../../../../axios/api/vehicle';
import { getAllTrailers } from '../../../../axios/api/trailer';
import { getCompany } from '../../../../axios/api/admin';
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

// Helper function to convert service name to service type key (kebab-case)
const nameToServiceType = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Default service types for backward compatibility
const DEFAULT_SERVICE_TYPE_OPTIONS: { label: string; value: VehicleServiceType }[] = [
  { label: 'Oil Change', value: 'oil-change' },
  { label: 'DPF Filter', value: 'dpf-filter' },
  { label: 'Valve Adjustment', value: 'valve-adjustment' },
  { label: 'Radiator Change', value: 'radiator-change' },
  { label: 'Oil Pump', value: 'oil-pump' },
  { label: 'Coolant Filter', value: 'coolant-filter' },
  { label: 'After Treatment System', value: 'after-treatment-system' },
  { label: 'Transmission Service', value: 'transmission-service' },
  { label: 'Brake Inspection', value: 'brake-inspection' },
  { label: 'Tire Rotation', value: 'tire-rotation' },
  { label: 'General Maintenance', value: 'general-maintenance' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Other', value: 'other' }
];

type ServiceTypeFilter = 'all' | VehicleServiceType | string; // Allow custom service types

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
  amount?: number;
  notes?: string;
  description?: string;
  serviceProvider?: string;
  assignedMechanic?: string | { _id: string; name: string };
  status: 'pending' | 'in-progress' | 'completed';
  priority?: string;
  source?: 'samsara' | 'manual';
}

interface UnitOption {
  unitNo: string;
  unitType?: string;
  makeModel?: string;
  referenceType?: string;
  referenceId?: string;
  currentOdometer?: number;
  serviceIntervalDays?: number;
  serviceIntervalMileage?: number;
}

// This will be updated to use dynamic services
const getServiceTypeLabel = (value: string, customServices?: Array<{ name: string }>) => {
  // First check custom services
  if (customServices) {
    const customMatch = customServices.find(service => nameToServiceType(service.name) === value);
    if (customMatch) return customMatch.name;
  }
  
  // Then check default options
  const match = DEFAULT_SERVICE_TYPE_OPTIONS.find(option => option.value === value);
  if (match) return match.label;
  
  // Fallback: format the value
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
  status: string;
  amount: string;
  description: string;
  serviceProvider: string;
}

const ScheduledServicesLog: React.FC = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<ServiceTypeFilter>('all');
  const [filterIncoming, setFilterIncoming] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ScheduledService | null>(null);
  const [services, setServices] = useState<ScheduledService[]>([]);
  const [samsaraServices, setSamsaraServices] = useState<ScheduledService[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [, setLoadingSamsara] = useState(false);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [customServices, setCustomServices] = useState<Array<{ name: string }>>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [mechanics, setMechanics] = useState<Array<{ _id: string; name: string }>>([]);
  
  // Refs for scrollbar synchronization
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceFormState>({
    serviceDate: new Date().toISOString().split('T')[0],
    unitNo: '',
    serviceType: '' as VehicleServiceType, // Will be set when custom services load
    odometer: '',
    invoiceNo: '',
    notes: '',
    status: 'pending',
    amount: '',
    description: '',
    serviceProvider: ''
  });

  // Fetch company custom services on mount
  useEffect(() => {
    const fetchCustomServices = async () => {
      try {
        const response = await getCompany();
        if (response?.success && response?.data?.maintenancePolicies?.customServices) {
          const services = response.data.maintenancePolicies.customServices;
          setCustomServices(services);
          
          // Create service type options ONLY from custom services (no hardcoded defaults)
          const customOptions = services.map((service: { name: string }) => ({
            label: service.name,
            value: nameToServiceType(service.name)
          }));
          
          // Set only custom services (no hardcoded defaults)
          setServiceTypeOptions(customOptions);
          
          // Update form default to first custom service if available
          if (customOptions.length > 0) {
            setFormData(prev => ({
              ...prev,
              serviceType: (prev.serviceType || customOptions[0].value) as VehicleServiceType
            }));
          }
        } else {
          // No custom services configured - show empty state
          setServiceTypeOptions([]);
        }
      } catch (error) {
        console.error('Error fetching custom services:', error);
        // Show empty on error - user needs to configure services first
        setServiceTypeOptions([]);
      }
    };
    
    fetchCustomServices();
  }, []);

  // Fetch mechanics (employees with mechanic role) on mount
  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const response = await getAllEmployees(1, 1000, undefined, 'Maintenance Crew (Mechanics)', 'active');
        if (response?.success && response?.data) {
          const mechanicsList = (response.data as any[]).map((emp: any) => ({
            _id: emp._id,
            name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown'
          }));
          setMechanics(mechanicsList);
        }
      } catch (error) {
        console.error('Error fetching mechanics:', error);
        setMechanics([]);
      }
    };
    
    fetchMechanics();
  }, []);

  // Check URL query parameter for incoming maintenance filter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldFilter = searchParams.get('filter') === 'incoming';
    console.log('🔍 [ScheduledServicesLog] URL filter check:', { 
      search: location.search, 
      filterParam: searchParams.get('filter'),
      shouldFilter 
    });
    setFilterIncoming(shouldFilter);
  }, [location.search]);

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
      amount: service.amount ?? undefined,
      notes: service.notes || undefined,
      description: service.description || undefined,
      serviceProvider: service.serviceProvider || undefined,
      assignedMechanic: service.assignedMechanic || undefined,
      status: service.status,
      priority: service.priority,
      source: (service as any).source || 'manual'
    };
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      // Fetch both trucks and trailers in parallel
      const [vehiclesResponse, trailersResponse] = await Promise.all([
        getAllVehicles(1, 1000),
        getAllTrailers(1, 1000)
      ]);

      const unitOptions: Array<{
        unitNo: string;
        unitType: string;
        makeModel?: string;
        referenceType: 'vehicle' | 'trailer';
        referenceId: string;
        currentOdometer: number;
        serviceIntervalDays?: number;
        serviceIntervalMileage?: number;
      }> = [];

      // Map trucks/vehicles
      if (vehiclesResponse?.success && vehiclesResponse?.data) {
        const vehicleUnits = (vehiclesResponse.data as any[]).map((vehicle) => ({
          unitNo: vehicle.unitNumber || vehicle.internalId || vehicle.plateNumber || '',
          unitType: vehicle.type || 'Truck',
          makeModel: [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim() || undefined,
          referenceType: 'vehicle' as const,
          referenceId: vehicle._id,
          currentOdometer: vehicle.odometer || 0,
          serviceIntervalDays: undefined,
          serviceIntervalMileage: undefined
        }));
        unitOptions.push(...vehicleUnits);
      }

      // Map trailers
      if (trailersResponse?.success && trailersResponse?.data) {
        const trailerUnits = (trailersResponse.data as any[]).map((trailer) => ({
          unitNo: trailer.trailer || trailer.plateNumber || trailer.trailerId || '',
          unitType: trailer.type || 'Trailer',
          makeModel: [trailer.make, trailer.model].filter(Boolean).join(' ').trim() || undefined,
          referenceType: 'trailer' as const,
          referenceId: trailer._id,
          currentOdometer: trailer.odometer || 0,
          serviceIntervalDays: undefined,
          serviceIntervalMileage: undefined
        }));
        unitOptions.push(...trailerUnits);
      }

      // Sort by unit number for better UX
      unitOptions.sort((a, b) => a.unitNo.localeCompare(b.unitNo));
      
      setUnits(unitOptions);
    } catch (err) {
      console.error('Failed to load units (trucks and trailers)', err);
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

  const fetchSamsaraServices = useCallback(async () => {
    setLoadingSamsara(true);
    try {
      const response = await getSamsaraUpcomingServices();
      if (response?.success) {
        const mapped =
          (response.data as VehicleServiceResponse[] | undefined)?.map(mapApiService) || [];
        setSamsaraServices(mapped);
      } else {
        setSamsaraServices([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch Samsara services:', err);
      setSamsaraServices([]);
    } finally {
      setLoadingSamsara(false);
    }
  }, [mapApiService]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    fetchServices();
    fetchSamsaraServices();
  }, [fetchServices, fetchSamsaraServices]);

  // Sync scroll between top and bottom scrollbars
  useEffect(() => {
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
      tableObserver.observe(bottomTable, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    topScroll.addEventListener('scroll', handleTopScroll, { passive: true });
    bottomScroll.addEventListener('scroll', handleBottomScroll, { passive: true });
    window.addEventListener('resize', syncScrollWidths);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      tableObserver.disconnect();
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
      window.removeEventListener('resize', syncScrollWidths);
    };
  }, [services, searchTerm, filterServiceType, filterIncoming]);

  // Helper function to check if a service is incoming maintenance
  // This must match the logic in summaryStats exactly
  const isIncomingService = useCallback((service: ScheduledService, vehiclesMap: Map<string, UnitOption>): boolean => {
    if (service.status === 'completed') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let isIncoming = false;

    // Check if service has a due date within 30 days
    if (service.dueDate) {
      const dueDate = new Date(service.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue >= 0 && daysUntilDue <= 30) {
        isIncoming = true;
      }
      // Also check if overdue by date
      if (daysUntilDue < 0) {
        isIncoming = true;
      }
    }

    // Check if service is due based on mileage (within 7,500 km)
    // Use service odometer, or try to get from vehicle
    const vehicle = service.unitNo ? vehiclesMap.get(service.unitNo) : null;
    const serviceOdometer = service.odometer ?? (vehicle?.currentOdometer ?? null);
    
    if (service.dueMileage && serviceOdometer !== null && serviceOdometer !== undefined) {
      const remainingKm = service.dueMileage - serviceOdometer;
      if (remainingKm >= 0 && remainingKm <= 7500) {
        isIncoming = true;
      }
      // Also check if overdue by mileage
      if (remainingKm < 0) {
        isIncoming = true;
      }
    }

    // Check using vehicle service intervals if available
    if (vehicle) {
      // Check mileage interval from vehicle (if available in future)
      if (vehicle.serviceIntervalMileage && vehicle.currentOdometer !== undefined && vehicle.currentOdometer !== null) {
        // Calculate next service mileage based on interval
        const lastServiceMileage = service.dueMileage 
          ? service.dueMileage - vehicle.serviceIntervalMileage 
          : vehicle.currentOdometer;
        const nextServiceMileage = lastServiceMileage + vehicle.serviceIntervalMileage;
        const remainingKm = nextServiceMileage - vehicle.currentOdometer;
        
        if (remainingKm >= 0 && remainingKm <= 7500) {
          isIncoming = true;
        }
        if (remainingKm < 0) {
          isIncoming = true; // Overdue
        }
      }

      // Check days interval from vehicle (if available in future)
      if (vehicle.serviceIntervalDays && service.serviceDate) {
        const lastServiceDate = new Date(service.serviceDate);
        const nextServiceDate = new Date(lastServiceDate);
        nextServiceDate.setDate(nextServiceDate.getDate() + vehicle.serviceIntervalDays);
        const daysUntilDue = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue >= 0 && daysUntilDue <= 30) {
          isIncoming = true;
        }
        if (daysUntilDue < 0) {
          isIncoming = true; // Overdue
        }
      }
    }

    // Include all pending and in-progress services as incoming maintenance if not already marked
    if (!isIncoming && (service.status === 'pending' || service.status === 'in-progress')) {
      isIncoming = true;
    }

    return isIncoming;
  }, []);

  const filteredServices = useMemo(() => {
    // Create a map of vehicles by unitNo for quick lookup
    const vehiclesMap = new Map(
      units.map(unit => [unit.unitNo, unit])
    );

    // Combine regular services and Samsara services
    const allServices = [...services, ...samsaraServices];

    const filtered = allServices.filter((service) => {
      const matchesSearch =
        !searchTerm ||
        service.unitNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.makeModel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterServiceType === 'all' || service.serviceType === filterServiceType;
      
      // Apply incoming filter if active
      let matchesIncoming = true;
      if (filterIncoming) {
        matchesIncoming = isIncomingService(service, vehiclesMap);
      }
      
      return matchesSearch && matchesType && matchesIncoming;
    });

    console.log('🔍 [ScheduledServicesLog] Filtered services:', {
      totalServices: services.length,
      samsaraServices: samsaraServices.length,
      filterIncoming,
      filteredCount: filtered.length,
      unitsCount: units.length
    });

    return filtered;
  }, [services, samsaraServices, searchTerm, filterServiceType, filterIncoming, units, isIncomingService]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Create a map of vehicles by unitNo for quick lookup
    const vehiclesMap = new Map(
      units.map(unit => [unit.unitNo, unit])
    );

    // Combine regular services and Samsara services for stats
    const allServicesForStats = [...services, ...samsaraServices];
    
    // Calculate incoming maintenance (services due within next 7,500 km or 30 days)
    // Also considers vehicle service intervals (days and mileage)
    const incomingServices = allServicesForStats.filter((service) => {
      if (service.status === 'completed') return false;

      let isIncoming = false;

      // Check if service has a due date within 30 days
      if (service.dueDate) {
        const dueDate = new Date(service.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue >= 0 && daysUntilDue <= 30) {
          isIncoming = true;
        }
        // Also check if overdue
        if (daysUntilDue < 0) {
          isIncoming = true; // Overdue is also incoming
        }
      }

      // Check if service is due based on mileage (within 7,500 km)
      // Use service odometer, or try to get from vehicle
      const vehicle = service.unitNo ? vehiclesMap.get(service.unitNo) : null;
      const serviceOdometer = service.odometer ?? (vehicle?.currentOdometer ?? null);
      
      if (service.dueMileage && serviceOdometer !== null && serviceOdometer !== undefined) {
        const remainingKm = service.dueMileage - serviceOdometer;
        if (remainingKm >= 0 && remainingKm <= 7500) {
          isIncoming = true;
        }
        // Also check if overdue by mileage
        if (remainingKm < 0) {
          isIncoming = true;
        }
      }

      // Check using vehicle service intervals if available
      if (vehicle) {
        // Check mileage interval from vehicle (if available)
        if (vehicle.serviceIntervalMileage && vehicle.currentOdometer !== undefined && vehicle.currentOdometer !== null) {
          // Calculate next service mileage based on interval
          const lastServiceMileage = service.dueMileage 
            ? service.dueMileage - vehicle.serviceIntervalMileage 
            : vehicle.currentOdometer;
          const nextServiceMileage = lastServiceMileage + vehicle.serviceIntervalMileage;
          const remainingKm = nextServiceMileage - vehicle.currentOdometer;
          
          if (remainingKm >= 0 && remainingKm <= 7500) {
            isIncoming = true;
          }
          if (remainingKm < 0) {
            isIncoming = true; // Overdue
          }
        }

        // Check days interval from vehicle (if available)
        if (vehicle.serviceIntervalDays && service.serviceDate) {
          const lastServiceDate = new Date(service.serviceDate);
          const nextServiceDate = new Date(lastServiceDate);
          nextServiceDate.setDate(nextServiceDate.getDate() + vehicle.serviceIntervalDays);
          const daysUntilDue = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue >= 0 && daysUntilDue <= 30) {
            isIncoming = true;
          }
          if (daysUntilDue < 0) {
            isIncoming = true; // Overdue
          }
        }
      }

      return isIncoming;
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

    // Recent activity - completed services in last 30 days (only from regular services, not Samsara)
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
      const type = getServiceTypeLabel(service.serviceType, customServices);
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
        { header: 'Amount', key: 'amount', width: 16 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Description', key: 'description', width: 32 },
        { header: 'Service Provider', key: 'serviceProvider', width: 24 },
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
        // Get service provider name
        let serviceProviderName = 'N/A';
        if (service.assignedMechanic) {
          if (typeof service.assignedMechanic === 'object') {
            serviceProviderName = service.assignedMechanic.name || 'N/A';
          } else {
            const mechanic = mechanics.find(m => m._id === service.assignedMechanic);
            serviceProviderName = mechanic?.name || service.assignedMechanic || 'N/A';
          }
        } else if (service.serviceProvider) {
          const mechanic = mechanics.find(m => m._id === service.serviceProvider || m.name === service.serviceProvider);
          serviceProviderName = mechanic?.name || service.serviceProvider || 'N/A';
        }

        worksheet.addRow({
          unitNo: service.unitNo,
          unitType: service.unitType || 'N/A',
          makeModel: service.makeModel || 'N/A',
          serviceType: getServiceTypeLabel(service.serviceType, customServices),
          serviceDate: formatDate(service.serviceDate),
          dueDate: formatDate(service.dueDate),
          odometer: service.odometer ?? 'N/A',
          invoiceNo: service.invoiceNo || 'N/A',
          amount: (service.amount !== undefined && service.amount !== null) || service.amount === 0 ? new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(service.amount || 0) : 'N/A',
          status: service.status.replace(/-/g, ' ').toUpperCase(),
          description: service.description || 'N/A',
          serviceProvider: serviceProviderName,
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
      serviceType: (serviceTypeOptions[0]?.value || '') as VehicleServiceType,
      odometer: '',
      invoiceNo: '',
      notes: '',
      status: 'pending',
      amount: '',
      description: '',
      serviceProvider: ''
    });
    setShowAddModal(true);
  };

  const handleEditService = (service: ScheduledService) => {
    setNotification(null);
    setError(null);
    setFormError(null);
    setSelectedService(service);
    
    // Get mechanic ID from assignedMechanic or serviceProvider
    let mechanicId = '';
    if (service.assignedMechanic) {
      if (typeof service.assignedMechanic === 'object') {
        mechanicId = service.assignedMechanic._id;
      } else {
        mechanicId = service.assignedMechanic;
      }
    } else if (service.serviceProvider) {
      // Check if serviceProvider is a mechanic ID
      const mechanic = mechanics.find(m => m._id === service.serviceProvider || m.name === service.serviceProvider);
      if (mechanic) {
        mechanicId = mechanic._id;
      }
    }
    
    setFormData({
      serviceDate: service.serviceDate ? service.serviceDate.split('T')[0] : new Date().toISOString().split('T')[0],
      unitNo: service.unitNo,
      serviceType: service.serviceType,
      odometer: service.odometer?.toString() || '',
      invoiceNo: service.invoiceNo || '',
      notes: service.notes || '',
      status: service.status || 'pending',
      amount: service.amount !== undefined && service.amount !== null ? service.amount.toString() : '',
      description: (service as any).description || '',
      serviceProvider: mechanicId
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

    if (!formData.serviceProvider || formData.serviceProvider.trim() === '') {
      setFormError('Please select a Service Provider (mechanic).');
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
      assignedMechanic: formData.serviceProvider,
      description: formData.description || undefined,
      status: (formData.status as 'pending' | 'in-progress' | 'completed') || 'pending',
      serviceDate: formData.serviceDate,
      odometer: formData.odometer ? Number(formData.odometer) : undefined,
      invoiceNumber: formData.invoiceNo || undefined,
      notes: formData.notes || undefined,
      amount: formData.amount && formData.amount.trim() !== '' ? (Number(formData.amount) || 0) : undefined
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
      <div className="relative w-full mx-auto p-2">


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
        <div className="w-full mx-auto px-4 -mt-4">
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Upcoming Services</p>
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
              <div className="flex items-center gap-2 flex-wrap">
                {filterIncoming && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 border border-orange-300 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Incoming Maintenance</span>
                    <button
                      onClick={() => {
                        setFilterIncoming(false);
                        // Remove query parameter from URL
                        window.history.replaceState({}, '', location.pathname);
                      }}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                      title="Clear filter"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                )}
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
                  {serviceTypeOptions.length > 0 ? (
                    serviceTypeOptions.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))
                  ) : (
                    <option value="" disabled>No services configured</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Top Scrollbar - Only visible horizontal scrollbar */}
            <style>{`
              .top-scrollbar-container::-webkit-scrollbar {
                height: 8px;
              }
              .top-scrollbar-container::-webkit-scrollbar-track {
                background: #f7fafc;
              }
              .top-scrollbar-container::-webkit-scrollbar-thumb {
                background: #cbd5e0;
                border-radius: 4px;
              }
              .top-scrollbar-container::-webkit-scrollbar-thumb:hover {
                background: #a0aec0;
              }
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
              <table className="w-full" style={{ minWidth: '1400px' }}>
                <thead className="text-white" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Service Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Unit No.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Unit Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Make/Model</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Service Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Odometer/Hour</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Invoice No.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Service Provider</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Notes</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="px-6 py-12 text-center text-gray-500">
                        Loading services...
                      </td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-6 py-12 text-center">
                        {filterIncoming ? (
                          <div className="flex flex-col items-center gap-3">
                            <AlertCircle className="w-10 h-10 text-orange-500" />
                            <div>
                              <p className="text-lg font-semibold text-gray-900 mb-1">No incoming maintenance services found</p>
                              <p className="text-sm text-gray-500">
                                {services.length > 0 
                                  ? `There are ${services.length} total service${services.length !== 1 ? 's' : ''}, but none match the incoming maintenance criteria (due within 30 days or 7,500 km).`
                                  : 'No services have been created yet.'
                                }
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setFilterIncoming(false);
                                window.history.replaceState({}, '', location.pathname);
                              }}
                              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Show All Services
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-500">No services found</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => (
                      <tr 
                        key={service._id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedService(service);
                          setShowServiceDetails(true);
                        }}
                      >
                        <td className="px-6 py-4 text-gray-900">
                          {formatDate(service.serviceDate || service.dueDate)}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            {service.unitNo}
                            {service._id?.startsWith('samsara-') && (
                              <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800" title="From Samsara">
                                Samsara
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {service.unitType || 'Unit'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{service.makeModel || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: '#398bc3', color: '#063f6f' }}>
                            {getServiceTypeLabel(service.serviceType, customServices)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {service.odometer !== undefined ? `${service.odometer.toLocaleString()} km` : '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{service.invoiceNo || '—'}</td>
                        <td className="px-6 py-4 text-gray-900">
                          {service.amount !== undefined && service.amount !== null ? new Intl.NumberFormat('en-CA', {
                            style: 'currency',
                            currency: 'CAD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(service.amount) : '—'}
                        </td>
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
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={service.description || undefined}>
                          {service.description || '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {(() => {
                            if (service.assignedMechanic) {
                              if (typeof service.assignedMechanic === 'object') {
                                return service.assignedMechanic.name || '—';
                              } else {
                                const mechanic = mechanics.find(m => m._id === service.assignedMechanic);
                                return mechanic?.name || service.assignedMechanic || '—';
                              }
                            } else if (service.serviceProvider) {
                              const mechanic = mechanics.find(m => m._id === service.serviceProvider || m.name === service.serviceProvider);
                              return mechanic?.name || service.serviceProvider || '—';
                            }
                            return '—';
                          })()}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={service.notes || undefined}>
                          {service.notes || 'N/A'}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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

          {/* Service Details Sidebar */}
          {showServiceDetails && selectedService && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
                onClick={() => {
                  setShowServiceDetails(false);
                  setTimeout(() => setSelectedService(null), 300);
                }}
              ></div>

              {/* Sidebar Panel */}
              <div
                className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 translate-x-0"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Service Details</h2>
                    <button
                      onClick={() => {
                        setShowServiceDetails(false);
                        setTimeout(() => setSelectedService(null), 300);
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Service Header */}
                    <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white p-6 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-1">{selectedService.unitNo || 'N/A'}</h3>
                          <p className="text-blue-100 text-sm mb-2">
                            {getServiceTypeLabel(selectedService.serviceType, customServices)}
                          </p>
                          <span
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${selectedService.status === 'completed'
                              ? 'bg-emerald-500 text-white'
                              : selectedService.status === 'in-progress'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-blue-500 text-white'
                              }`}
                          >
                            {selectedService.status.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Service Information */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg">Service Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Unit Number</p>
                          <p className="font-medium text-gray-900">{selectedService.unitNo || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Unit Type</p>
                          <p className="font-medium text-gray-900">{selectedService.unitType || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Make / Model</p>
                          <p className="font-medium text-gray-900">{selectedService.makeModel || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Service Type</p>
                          <p className="font-medium text-gray-900">{getServiceTypeLabel(selectedService.serviceType, customServices)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Service Date</p>
                          <p className="font-medium text-gray-900">{formatDate(selectedService.serviceDate || selectedService.dueDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Due Date</p>
                          <p className="font-medium text-gray-900">{formatDate(selectedService.dueDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Odometer</p>
                          <p className="font-medium text-gray-900">
                            {selectedService.odometer !== undefined ? `${selectedService.odometer.toLocaleString()} km` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Invoice Number</p>
                          <p className="font-medium text-gray-900">{selectedService.invoiceNo || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Amount</p>
                          <p className="font-medium text-gray-900">
                            {selectedService.amount !== undefined && selectedService.amount !== null ? new Intl.NumberFormat('en-CA', {
                              style: 'currency',
                              currency: 'CAD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(selectedService.amount) : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Status</p>
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${selectedService.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : selectedService.status === 'in-progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                              }`}
                          >
                            {selectedService.status.replace('-', ' ')}
                          </span>
                        </div>
                        {selectedService.priority && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Priority</p>
                            <p className="font-medium text-gray-900">{selectedService.priority}</p>
                          </div>
                        )}
                        {selectedService.description && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Description</p>
                            <p className="font-medium text-gray-900">{selectedService.description}</p>
                          </div>
                        )}
                        {(selectedService.serviceProvider || selectedService.assignedMechanic) && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Service Provider</p>
                            <p className="font-medium text-gray-900">
                              {selectedService.assignedMechanic 
                                ? (typeof selectedService.assignedMechanic === 'object' 
                                    ? selectedService.assignedMechanic.name 
                                    : mechanics.find(m => m._id === selectedService.assignedMechanic)?.name || selectedService.assignedMechanic)
                                : selectedService.serviceProvider || '—'}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedService.notes && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-1">Notes</p>
                          <p className="font-medium text-gray-900">{selectedService.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                      <button
                        onClick={() => {
                          setShowServiceDetails(false);
                          setTimeout(() => setSelectedService(null), 300);
                        }}
                        className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-all"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setShowServiceDetails(false);
                          handleEditService(selectedService);
                        }}
                        className="px-6 py-2.5 bg-blue-600 !text-white font-medium rounded-lg hover:bg-blue-700 transition-all"
                      >
                        Edit Service
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

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
                        {serviceTypeOptions.length === 0 ? (
                          <div className="w-full px-4 py-2 border border-yellow-300 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              No services configured. Please add services in{' '}
                              <a 
                                href="/admin/company" 
                                target="_blank" 
                                className="underline font-semibold hover:text-yellow-900"
                              >
                                Company Settings
                              </a>
                              {' '}first.
                            </p>
                          </div>
                        ) : (
                          <select
                            value={formData.serviceType}
                            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as VehicleServiceType })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                            style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                            onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                            onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                            required
                          >
                            <option value="">Select Service Type</option>
                            {serviceTypeOptions.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        )}
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          placeholder="0.00 (optional)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Provider *</label>
                        <select
                          value={formData.serviceProvider}
                          onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                          style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                          onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        >
                          <option value="">Select a mechanic</option>
                          {mechanics.length === 0 ? (
                            <option value="" disabled>No mechanics found. Add an employee with a mechanic role to list service providers.</option>
                          ) : (
                            mechanics.map((mechanic) => (
                              <option key={mechanic._id} value={mechanic._id}>
                                {mechanic.name}
                              </option>
                            ))
                          )}
                        </select>
                        {mechanics.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Add an employee with a mechanic role to list service providers.
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                        onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                        onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                        placeholder="Enter service description..."
                      />
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
