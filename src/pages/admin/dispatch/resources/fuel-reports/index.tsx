import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { FaFileInvoiceDollar, FaGasPump, FaClipboardList } from "react-icons/fa";
import { message } from "antd";
import NewFuelReportSidebar from "./NewFuelReportSidebar";
import {
  listFuelReport,
  deleteFuelReport,
  updateStatusFuelReport,
  updateFuelReport,
  getFuelTypes,
  createFuelType,
  getUnits,
  createUnit,
  getFuelVendors,
  createFuelVendor,
} from "../../../../../axios/api/dispatcher.fuelreport";
import { useDrivers } from "../../../../../customHooks/useDrivers";
import { listFleetUnits } from "../../../../../axios/api/fleet.units";
import { FLEET_COLORS } from "../../../fleetMaintenance/colorUtils";
import AddressSearch from "../../../../../components/common/AddressSearch";

interface FuelReportType {
  _id: string;
  reporter: { _id: string; name?: string; email?: string };
  reporterName?: string;
  reporterEmail?: string;
  driver?: { _id: string; name: string }; // Keep for backward compatibility
  vehicle: { _id: string; plateNumber?: string; vinNumber?: string; unitNo?: string; unitType?: string; makeModel?: string };
  trip?: any; // Keep for backward compatibility
  // New fields
  state?: string;
  unit?: { _id: string; unitNo?: string; unitType?: string; makeModel?: string };
  types?: string[];
  fuelAmounts?: number[];
  transactionAmount?: number;
  currentOdometer?: string;
  units?: string[];
  measurementUnit?: string;
  currency?: string;
  date?: string | Date;
  fuelVendors?: string[];
  fuelVendor?: string;
  fuelAmount?: number;
  transactionNumber?: string;
  // Legacy fields
  volume?: string;
  type?: string;
  odometer?: string;
  cost?: number;
  status: string;
  createdAt: string;
}

interface FuelReportEditForm {
  unit: string;
  state: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  fullAddress: string;
  type: string;
  transactionAmount: string;
  currentOdometer: string;
  measurementUnit: string;
  currency: string;
  date: string;
  fuelVendor: string;
  fuelAmount: string;
  status: string;
}

interface FleetUnitOption {
  id: string;
  unitNo: string;
  unitType?: string;
  makeModel?: string;
  licensePlate?: string;
}

const FuelReports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fuelReports, setFuelReports] = useState<FuelReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingReport, setEditingReport] = useState<FuelReportType | null>(null);
  const [editForm, setEditForm] = useState<FuelReportEditForm>({
    unit: "",
    state: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    latitude: "",
    longitude: "",
    fullAddress: "",
    type: "",
    transactionAmount: "",
    currentOdometer: "",
    measurementUnit: "",
    currency: "USA",
    date: new Date().toISOString().split('T')[0],
    fuelVendor: "",
    fuelAmount: "",
    status: "pending",
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFuelTypes, setEditFuelTypes] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingEditFuelTypes, setLoadingEditFuelTypes] = useState(false);
  const [showEditAddTypeModal, setShowEditAddTypeModal] = useState(false);
  const [newEditTypeName, setNewEditTypeName] = useState('');
  const [addingEditType, setAddingEditType] = useState(false);
  const [editMeasurementUnits, setEditMeasurementUnits] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingEditMeasurementUnits, setLoadingEditMeasurementUnits] = useState(false);
  const [showEditAddUnitModal, setShowEditAddUnitModal] = useState(false);
  const [newEditUnitName, setNewEditUnitName] = useState('');
  const [addingEditUnit, setAddingEditUnit] = useState(false);
  const [editFuelVendors, setEditFuelVendors] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingEditFuelVendors, setLoadingEditFuelVendors] = useState(false);
  const [showEditAddVendorModal, setShowEditAddVendorModal] = useState(false);
  const [newEditVendorName, setNewEditVendorName] = useState('');
  const [addingEditVendor, setAddingEditVendor] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FuelReportType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState(false);
  const [units, setUnits] = useState<FleetUnitOption[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  const { drivers } = useDrivers();
  const unitsMap = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const focusRingStyle = useMemo(
    () =>
      ({
        "--tw-ring-color": FLEET_COLORS.primary
      }) as React.CSSProperties & { "--tw-ring-color": string },
    []
  );

  const formatUnitLabel = useCallback((unit?: FleetUnitOption | null) => {
    if (!unit) return "N/A";
    const base = [unit.unitNo, unit.makeModel].filter(Boolean).join(" - ");
    return unit.unitType ? `${base} (${unit.unitType})` : base || "Unit";
  }, []);

  const getVehicleDetails = useCallback(
    (report: FuelReportType | null) => {
      if (!report) {
        return { primary: "N/A", secondary: "", badge: "" };
      }
      const vehicleId = report.vehicle?._id || "";
      const matched = vehicleId ? unitsMap.get(vehicleId) : undefined;
      if (matched) {
        return {
          primary: matched.unitNo || matched.licensePlate || "Unit",
          secondary: matched.makeModel || matched.licensePlate || "",
          badge: matched.unitType || ""
        };
      }
      const primary =
        (report.vehicle?.unitNo && report.vehicle.unitNo !== 'N/A' ? report.vehicle.unitNo : null) ||
        report.vehicle?.plateNumber ||
        report.vehicle?.vinNumber ||
        (report.unit?.unitNo && report.unit.unitNo !== 'N/A' ? report.unit.unitNo : null) ||
        report.unit?.makeModel ||
        "N/A";
      const secondary = [
        report.vehicle?.makeModel, 
        report.unit?.makeModel,
        report.vehicle?.plateNumber, 
        report.vehicle?.vinNumber
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        primary,
        secondary,
        badge: (report.vehicle?.unitType && report.vehicle.unitType !== 'N/A' ? report.vehicle.unitType : null) ||
               (report.unit?.unitType && report.unit.unitType !== 'N/A' ? report.unit.unitType : null) ||
               ""
      };
    },
    [unitsMap]
  );

  const renderVehicleLabel = useCallback(
    (report: FuelReportType | null) => {
      const details = getVehicleDetails(report);
      return [details.primary, details.secondary].filter(Boolean).join(" - ") || "N/A";
    },
    [getVehicleDetails]
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userInfo");
      if (stored) {
        const parsedInfo = JSON.parse(stored);
        setUserInfo(parsedInfo);
        setUserInfoReady(true);
      } else {
        // No stored userInfo, but still mark as ready to prevent infinite waiting
        setUserInfoReady(true);
      }
    } catch (error) {
      console.error("Error parsing userInfo from localStorage:", error);
      setUserInfoReady(true);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const fetchFuelReports = useCallback(async () => {
    try {
      setLoading(true);
      setEmptyStateMessage(null);
      hasFetchedRef.current = true;

      console.log('Fetching fuel reports with params:', { currentPage, pageSize, debouncedSearch, statusFilter });

      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await listFuelReport(params);
      console.log('Fuel reports API response:', res);
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        // Clear existing data and set new data to avoid duplicates
        setFuelReports(data);
        if (res.pagination) {
          setTotal(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
          // If current page is beyond total pages, reset to last page
          if (currentPage > res.pagination.totalPages && res.pagination.totalPages > 0) {
            setCurrentPage(res.pagination.totalPages);
          }
        }
        if (res.message && data.length === 0) {
          setEmptyStateMessage(res.message);
        } else {
          setEmptyStateMessage(null);
        }
      } else {
        message.error(res.message || "Failed to fetch fuel reports");
        setFuelReports([]);
        setTotal(0);
        setTotalPages(0);
        setEmptyStateMessage(res?.message || "Failed to fetch fuel reports");
      }
    } catch (error: any) {
      console.error("Error fetching fuel reports:", error);
      setFuelReports([]);
      setTotal(0);
      setTotalPages(0);
      setEmptyStateMessage(error?.message || "Failed to fetch fuel reports");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter]);

  const getCurrentUserId = useMemo(
    () => userInfo?._id || userInfo?.userData?._id || "",
    [userInfo]
  );
  const getCurrentUserName = useMemo(
    () =>
      userInfo?.name ||
      userInfo?.userData?.name ||
      [userInfo?.userData?.firstName, userInfo?.userData?.lastName].filter(Boolean).join(" ").trim(),
    [userInfo]
  );
  const getCurrentUserEmail = useMemo(
    () => userInfo?.email || userInfo?.userData?.email || "",
    [userInfo]
  );

  const getReporterDetails = useCallback(
    (report: FuelReportType) => {
      const name =
        report.reporter?.name ||
        report.reporterName ||
        (report.reporter?._id === getCurrentUserId ? getCurrentUserName : "") ||
        "N/A";
      const email =
        report.reporter?.email ||
        report.reporterEmail ||
        (report.reporter?._id === getCurrentUserId ? getCurrentUserEmail : undefined);
      return { name, email };
    },
    [getCurrentUserEmail, getCurrentUserId, getCurrentUserName]
  );

  const loadUnits = useCallback(async () => {
    setUnitsLoading(true);
    try {
      const res = await listFleetUnits({ category: "all" });
      if (res?.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data.map((unit: any) => ({
          id: unit._id,
          unitNo: unit.unitNo || unit.internalId || unit.licensePlate || "Unit",
          unitType: unit.unitType || (unit.source === "trailer" ? "Trailer" : unit.truckType ? "Truck" : unit.source),
          makeModel:
            unit.makeModel ||
            [unit.make, unit.model]
              .filter(Boolean)
              .join(" ")
              .trim(),
          licensePlate: unit.licensePlate || unit.vinNo || ""
        }));
        setUnits(normalized);
      } else {
        setUnits([]);
      }
    } catch (error) {
      console.error("Failed to load fleet units", error);
      setUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  }, []);

  // Fetch fuel reports when user info is ready and when filters/pagination change
  useEffect(() => {
    console.log('Fetch effect triggered:', { userInfoReady, hasUserInfo: !!userInfo, currentPage, pageSize, debouncedSearch, statusFilter });

    // Wait for userInfo to be loaded from localStorage
    if (!userInfoReady) {
      console.log('Waiting for userInfoReady...');
      return;
    }

    // If no userInfo is available, try to get it from localStorage directly
    let effectiveUserInfo = userInfo;
    if (!effectiveUserInfo) {
      try {
        const stored = localStorage.getItem("userInfo");
        if (stored) {
          effectiveUserInfo = JSON.parse(stored);
          console.log('Loaded userInfo from localStorage:', effectiveUserInfo);
        }
      } catch (error) {
        console.error("Error getting userInfo from localStorage:", error);
      }
    }

    // If still no userInfo, don't fetch (user might not be logged in)
    if (!effectiveUserInfo) {
      console.log('No userInfo available, skipping fetch');
      setFuelReports([]);
      setEmptyStateMessage("No user information available");
      return;
    }

    const userRole = effectiveUserInfo?.role || effectiveUserInfo?.userData?.role;
    const userCompany = effectiveUserInfo?.company || effectiveUserInfo?.userData?.company;
    const isSuperadmin = userRole === "superadmin";
    const isComplianceManager = userRole === "Compliance Manager";
    const isFleetMaintenanceManager = userRole === "Fleet Maintenance Manager";
    const hasCompany = Boolean(userCompany);

    console.log('User permission check:', { userRole, userCompany, isSuperadmin, isComplianceManager, isFleetMaintenanceManager, hasCompany });

    // Allow superadmin, Fleet Maintenance Manager, Compliance Manager, or users with company
    if (!isSuperadmin && !isFleetMaintenanceManager && !isComplianceManager && !hasCompany) {
      console.log('User does not have permission to view fuel reports');
      setFuelReports([]);
      setEmptyStateMessage(null);
      return;
    }

    // Always fetch when dependencies change - this ensures data is fresh on page refresh
    console.log('Calling fetchFuelReports...');
    fetchFuelReports();
  }, [userInfoReady, userInfo, currentPage, pageSize, debouncedSearch, statusFilter, fetchFuelReports]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const openDeleteModal = (report: FuelReportType) => {
    setDeleteTarget(report);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await deleteFuelReport(deleteTarget._id);
      if (res.success) {
        message.success(res.message || "Fuel report deleted successfully");
        // If we're on the last page and it becomes empty, go to previous page
        if (fuelReports.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          await fetchFuelReports();
        }
        closeDeleteModal();
      } else {
        message.error(res.message || "Failed to delete fuel report");
      }
    } catch (error: any) {
      console.error(error);
      message.error(error?.message || "Failed to delete fuel report");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await updateStatusFuelReport(id, { status });
      if (res.success) {
        setFuelReports((prev) =>
          prev.map((report) =>
            report._id === id ? { ...report, status } : report
          )
        );
        message.success(res.message || "Status updated successfully");
      } else {
        message.error(res.message || "Failed to update status");
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to update status");
    }
  };

  // Fetch fuel types, units, and vendors for edit modal
  const fetchEditFuelTypes = useCallback(async () => {
    setLoadingEditFuelTypes(true);
    try {
      const response = await getFuelTypes();
      if (response?.success) {
        setEditFuelTypes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching fuel types:', error);
    } finally {
      setLoadingEditFuelTypes(false);
    }
  }, []);

  const fetchEditMeasurementUnits = useCallback(async () => {
    setLoadingEditMeasurementUnits(true);
    try {
      const response = await getUnits();
      if (response?.success) {
        setEditMeasurementUnits(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching measurement units:', error);
    } finally {
      setLoadingEditMeasurementUnits(false);
    }
  }, []);

  const fetchEditFuelVendors = useCallback(async () => {
    setLoadingEditFuelVendors(true);
    try {
      const response = await getFuelVendors();
      if (response?.success) {
        setEditFuelVendors(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching fuel vendors:', error);
    } finally {
      setLoadingEditFuelVendors(false);
    }
  }, []);

  const handleEditAddNewType = async () => {
    if (!newEditTypeName.trim()) {
      message.warning('Please enter a fuel type name');
      return;
    }
    setAddingEditType(true);
    try {
      const response = await createFuelType(newEditTypeName.trim());
      if (response?.success) {
        await fetchEditFuelTypes();
        setShowEditAddTypeModal(false);
        setNewEditTypeName('');
        if (response.data) {
          setEditForm(prev => ({
            ...prev,
            type: response.data.name
          }));
        }
        message.success('Fuel type added successfully');
      } else {
        message.error(response?.message || 'Failed to create fuel type');
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to create fuel type');
    } finally {
      setAddingEditType(false);
    }
  };

  const handleEditAddNewUnit = async () => {
    if (!newEditUnitName.trim()) {
      message.warning('Please enter a unit name');
      return;
    }
    setAddingEditUnit(true);
    try {
      const response = await createUnit(newEditUnitName.trim());
      if (response?.success) {
        await fetchEditMeasurementUnits();
        setShowEditAddUnitModal(false);
        setNewEditUnitName('');
        if (response.data) {
          setEditForm(prev => ({
            ...prev,
            measurementUnit: response.data.name
          }));
        }
        message.success('Unit added successfully');
      } else {
        message.error(response?.message || 'Failed to create unit');
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to create unit');
    } finally {
      setAddingEditUnit(false);
    }
  };

  const handleEditAddNewVendor = async () => {
    if (!newEditVendorName.trim()) {
      message.warning('Please enter a fuel vendor name');
      return;
    }
    setAddingEditVendor(true);
    try {
      const response = await createFuelVendor(newEditVendorName.trim());
      if (response?.success) {
        await fetchEditFuelVendors();
        setShowEditAddVendorModal(false);
        setNewEditVendorName('');
        if (response.data) {
          setEditForm(prev => ({
            ...prev,
            fuelVendor: response.data.name
          }));
        }
        message.success('Fuel vendor added successfully');
      } else {
        message.error(response?.message || 'Failed to create fuel vendor');
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to create fuel vendor');
    } finally {
      setAddingEditVendor(false);
    }
  };

  const openEditModal = (report: FuelReportType) => {
    setEditingReport(report);
    // Fetch fuel types, units, and vendors when opening modal
    fetchEditFuelTypes();
    fetchEditMeasurementUnits();
    fetchEditFuelVendors();
    
    // Get location data
    const location = report.location || {};
    const fullAddress = location.address || report.state || '';
    
    // Format date
    const reportDate = report.date 
      ? (typeof report.date === 'string' ? report.date.split('T')[0] : new Date(report.date).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0];

    setEditForm({
      unit: report.unit?._id || report.vehicle?._id || "",
      state: report.state || "",
      address: location.address || "",
      city: "",
      postalCode: "",
      country: "",
      latitude: location.latitude || "",
      longitude: location.longitude || "",
      fullAddress: fullAddress,
      type: report.type || (report.types && report.types.length > 0 ? report.types[0] : ""),
      transactionAmount: report.transactionAmount?.toString() || "",
      currentOdometer: report.currentOdometer || report.odometer || "",
      measurementUnit: report.measurementUnit || (report.units && report.units.length > 0 ? report.units[0] : ""),
      currency: report.currency || "USA",
      date: reportDate,
      fuelVendor: report.fuelVendor || (report.fuelVendors && report.fuelVendors.length > 0 ? report.fuelVendors[0] : ""),
      fuelAmount: report.fuelAmount?.toString() || "",
      status: report.status || "pending",
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (editSubmitting) return;
    setEditModalOpen(false);
    setEditingReport(null);
    setEditForm({
      unit: "",
      state: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      latitude: "",
      longitude: "",
      fullAddress: "",
      type: "",
      transactionAmount: "",
      currentOdometer: "",
      measurementUnit: "",
      currency: "USA",
      date: new Date().toISOString().split('T')[0],
      fuelVendor: "",
      fuelAmount: "",
      status: "pending",
    });
  };

  const handleEditFieldChange = (
    field: keyof FuelReportEditForm,
    value: string
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateSubmit = async () => {
    if (!editingReport) return;
    if (!editForm.unit) {
      message.warning("Please select a unit");
      return;
    }
    if (!editForm.fullAddress && !editForm.state) {
      message.warning("Please select a location");
      return;
    }
    if (!editForm.type || !editForm.type.trim()) {
      message.warning("Please select a fuel type");
      return;
    }
    try {
      setEditSubmitting(true);
      const payload = {
        unit: editForm.unit,
        state: editForm.state,
        address: editForm.address || editForm.fullAddress,
        location: {
          address: editForm.fullAddress || editForm.address || '',
          latitude: editForm.latitude || '',
          longitude: editForm.longitude || ''
        },
        type: editForm.type,
        transactionAmount: editForm.transactionAmount ? parseFloat(editForm.transactionAmount) : null,
        currentOdometer: editForm.currentOdometer || null,
        measurementUnit: editForm.measurementUnit,
        currency: editForm.currency,
        date: editForm.date || new Date().toISOString(),
        fuelVendor: editForm.fuelVendor,
        fuelAmount: editForm.fuelAmount ? parseFloat(editForm.fuelAmount) : null,
        status: editForm.status || 'pending',
      };
      const res = await updateFuelReport(editingReport._id, payload);
      if (res.success) {
        message.success(res.message || "Fuel report updated successfully");
        await fetchFuelReports();
        closeEditModal();
      } else {
        message.error(res.message || "Failed to update fuel report");
      }
    } catch (error: any) {
      console.error(error);
      message.error(error?.message || "Failed to update fuel report");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // No need for client-side filtering since backend handles it
  const filteredReports = fuelReports;

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
    subtitle: string;
    icon: any;
    bgColor: string;
    iconColor: string;
  }) => (
    <div className="bg-white rounded-lg p-3 shadow-sm border border-transparent hover:border-blue-100 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-xl font-bold text-gray-900">{value}</span>
          </div>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className={`${bgColor} rounded-lg p-2 shadow-sm`}>
          <Icon className={iconColor} size={20} />
        </div>
      </div>
    </div>
  );

  const totalReports = fuelReports.length;
  
  // Calculate total volume - use fuelAmount (new) or volume (legacy), convert to liters if needed
  const totalVolume = fuelReports.reduce((acc, r) => {
    // Try new field first (fuelAmount)
    if (r.fuelAmount !== null && r.fuelAmount !== undefined) {
      return acc + r.fuelAmount;
    }
    // Try fuelAmounts array
    if (r.fuelAmounts && r.fuelAmounts.length > 0) {
      return acc + r.fuelAmounts.reduce((sum, amt) => sum + amt, 0);
    }
    // Fall back to legacy volume field
    const volume = parseFloat(r.volume || '0');
    return acc + volume;
  }, 0);
  
  // Calculate total cost - use transactionAmount (new) or cost (legacy)
  const totalCost = fuelReports.reduce((acc, r) => {
    // Try new field first (transactionAmount)
    if (r.transactionAmount !== null && r.transactionAmount !== undefined) {
      return acc + Number(r.transactionAmount);
    }
    // Fall back to legacy cost field
    return acc + (Number(r.cost) || 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading fuel reports...</p>
        </div>
      </div>
    );
  }

  if (emptyStateMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-4 px-6">
        <div className="text-5xl text-gray-300">⛽</div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800">
            No fuel reports available
          </h2>
          <p className="text-gray-500">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative w-full mx-auto p-2">

        <div className="relative z-10 px-4 pt-3 pb-6">
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black">Fuel Reports</h1>
                <div className="flex items-center gap-2 text-black/90">
                  <span className="text-xs">Manage fuel consumption</span>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-2 !text-white rounded-lg shadow-sm transition-all font-bold text-sm hover:opacity-90"
                style={{ background: FLEET_COLORS.gradient }}
              >
                <Plus className="w-4 h-4" />
                Create Fuel Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 -mt-2 mb-4">
            <StatCard title="Total Reports" value={totalReports} subtitle="All time" icon={FaClipboardList} bgColor="bg-blue-50" iconColor="text-blue-600" />
            <StatCard title="Total Fuel Cost" value={`$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Estimated spend" icon={FaFileInvoiceDollar} bgColor="bg-green-50" iconColor="text-green-600" />
            <StatCard 
              title="Total Volume" 
              value={`${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${fuelReports.length > 0 && fuelReports[0]?.measurementUnit ? fuelReports[0].measurementUnit : 'L'}`} 
              subtitle="Fuel consumed" 
              icon={FaGasPump} 
              bgColor="bg-orange-50" 
              iconColor="text-orange-600" 
            />
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reporter, driver, vehicle, trip or status..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-sm"
                style={{ '--tw-ring-color': FLEET_COLORS.primary } as React.CSSProperties & { '--tw-ring-color': string }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': FLEET_COLORS.primary } as React.CSSProperties & { '--tw-ring-color': string }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mx-4 mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Transaction #
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    State
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Unit
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Type
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Fuel Amount
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Transaction Amount
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Current Odometer
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Units
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Currency
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Date
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Fuel Vendor
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No fuel reports found
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    // Use unit if available, otherwise use vehicle
                    const unitData = report.unit || report.vehicle;
                    const unitDetails = unitData ? getVehicleDetails({ vehicle: unitData } as any) : getVehicleDetails(report);
                    const types = report.types || (report.type ? [report.type] : []);
                    const fuelAmounts = report.fuelAmounts || [];
                    const fuelAmount = report.fuelAmount || null;
                    const units = report.units || [];
                    const fuelVendors = report.fuelVendors || [];
                    const fuelVendor = report.fuelVendor || '';
                    const measurementUnit = report.measurementUnit || '';
                    const transactionNumber = report.transactionNumber || report._id.slice(-8);
                    
                    return (
                      <tr key={report._id} className="hover:bg-gray-50">
                        <td className="px-6 py-2 text-xs font-semibold text-gray-900">
                          {transactionNumber}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {report.state || 'N/A'}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-gray-900">
                              {unitDetails.primary !== 'N/A' ? unitDetails.primary : (report.vehicle?.plateNumber || report.unit?.makeModel || 'N/A')}
                            </div>
                            {unitDetails.secondary && unitDetails.secondary !== 'N/A' && (
                              <div className="text-[10px] text-gray-500">{unitDetails.secondary}</div>
                            )}
                            {unitDetails.badge && unitDetails.badge !== 'N/A' && (
                              <span
                                className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                style={{
                                  backgroundColor:
                                    unitDetails.badge.toLowerCase().includes("trailer")
                                      ? "rgba(34, 197, 94, 0.15)"
                                      : "rgba(1, 106, 178, 0.15)",
                                  color:
                                    unitDetails.badge.toLowerCase().includes("trailer")
                                      ? "#15803d"
                                      : FLEET_COLORS.primary
                                }}
                              >
                                {unitDetails.badge}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {types.length > 0 ? (
                            <div className="space-y-1">
                              {types.map((type, idx) => (
                                <div key={idx} className="font-medium">{type}</div>
                              ))}
                            </div>
                          ) : (report.type ? report.type : 'N/A')}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {fuelAmounts.length > 0 ? (
                            <div className="space-y-1">
                              {fuelAmounts.map((amount, idx) => (
                                <div key={idx}>{amount.toFixed(2)}</div>
                              ))}
                            </div>
                          ) : (fuelAmount !== null && fuelAmount !== undefined ? fuelAmount.toFixed(2) : (report.volume ? `${report.volume} ${report.type || ''}` : 'N/A'))}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {report.transactionAmount 
                            ? `${report.currency === 'CAD' ? 'C$' : '$'}${Number(report.transactionAmount).toFixed(2)}`
                            : (report.cost ? `$${Number(report.cost).toFixed(2)}` : '-')}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {report.currentOdometer || report.odometer || 'N/A'}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {units.length > 0 ? (
                            <div className="space-y-1">
                              {units.map((unit, idx) => (
                                <div key={idx}>{unit}</div>
                              ))}
                            </div>
                          ) : (measurementUnit ? measurementUnit : 'N/A')}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {report.currency || 'USA'}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {report.date 
                            ? new Date(report.date).toLocaleDateString()
                            : new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-2 text-xs text-gray-500">
                          {fuelVendors.length > 0 ? (
                            <div className="space-y-1">
                              {fuelVendors.map((vendor, idx) => (
                                <div key={idx}>{vendor}</div>
                              ))}
                            </div>
                          ) : (fuelVendor ? fuelVendor : 'N/A')}
                        </td>
                        <td className="px-6 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(report)}
                              className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors h-7 w-7 shadow-sm border border-blue-100"
                              title="Edit fuel report"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(report)}
                              className="inline-flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors h-7 w-7 shadow-sm border border-red-100"
                              title="Delete fuel report"
                            >
                              <Trash2 className="w-3 h-3" />
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

          {/* Pagination Controls */}
          {total > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                <span className="font-medium">{total}</span> fuel reports
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
                    <ChevronLeft size={14} />
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
                            ? 'bg-blue-600 text-white border-blue-600'
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
                    <ChevronRight size={14} />
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
      </div>

      {/* Sidebar Component */}
      <NewFuelReportSidebar
        isOpen={isSidebarOpen}
        onClose={async (shouldRefresh = true) => {
          setIsSidebarOpen(false);
          if (shouldRefresh) {
            // Reset to page 1 to show the newly created report (since sorted by createdAt desc)
            setCurrentPage(1);
            // Directly call fetchFuelReports to refresh the table immediately
            await fetchFuelReports();
          }
        }}
        units={units}
        unitsLoading={unitsLoading}
        currentUser={userInfo}
      />

      {/* Edit Modal */}
      {editModalOpen && editingReport && (
        <>
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={closeEditModal} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-[600px] bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0" style={{ background: FLEET_COLORS.gradient }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Edit Fuel Report</h2>
                <button onClick={closeEditModal} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
              <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Reporter</p>
                    <p className="text-gray-900 font-semibold">{getReporterDetails(editingReport).name}</p>
                    {getReporterDetails(editingReport).email && (
                      <p className="text-xs text-gray-500">{getReporterDetails(editingReport).email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                    <AddressSearch
                      placeholder="Search for an address..."
                      value={editForm.fullAddress}
                      onAddressSelect={(addressData) => {
                        setEditForm(prev => ({
                          ...prev,
                          state: addressData.state || prev.state,
                          address: addressData.address || '',
                          city: addressData.city || '',
                          postalCode: addressData.postalCode || '',
                          country: addressData.country || '',
                          latitude: addressData.latitude || '',
                          longitude: addressData.longitude || '',
                          fullAddress: addressData.fullAddress || ''
                        }));
                      }}
                      onChange={(value) => {
                        setEditForm(prev => ({
                          ...prev,
                          fullAddress: value
                        }));
                      }}
                      className="w-full"
                    />
                    {editForm.state && (
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {editForm.state} {editForm.city && `- ${editForm.city}`}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit <span className="text-red-500">*</span></label>
                    <select
                      value={editForm.unit}
                      onChange={(e) => handleEditFieldChange("unit", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    >
                      <option value="">Select Unit</option>
                      {unitsLoading ? (
                        <option>Loading units...</option>
                      ) : (
                        units?.map(unit => (
                          <option key={unit.id} value={unit.id}>
                            {formatUnitLabel(unit)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <select
                        value={editForm.type}
                        onChange={(e) => handleEditFieldChange("type", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                        style={focusRingStyle}
                      >
                        <option value="">Select Fuel Type</option>
                        {loadingEditFuelTypes ? (
                          <option disabled>Loading...</option>
                        ) : (
                          editFuelTypes.map((ft) => (
                            <option key={ft._id} value={ft.name}>
                              {ft.name}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditAddTypeModal(true);
                          setNewEditTypeName('');
                        }}
                        className="px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors whitespace-nowrap"
                        title="Add new fuel type"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.transactionAmount}
                      onChange={(e) => handleEditFieldChange("transactionAmount", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Odometer</label>
                    <input
                      type="text"
                      value={editForm.currentOdometer}
                      onChange={(e) => handleEditFieldChange("currentOdometer", e.target.value)}
                      placeholder="Enter odometer reading"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <div className="flex gap-2">
                      <select
                        value={editForm.measurementUnit}
                        onChange={(e) => handleEditFieldChange("measurementUnit", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                        style={focusRingStyle}
                      >
                        <option value="">Select Unit</option>
                        {loadingEditMeasurementUnits ? (
                          <option disabled>Loading...</option>
                        ) : (
                          editMeasurementUnits.map((u) => (
                            <option key={u._id} value={u.name}>
                              {u.name}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditAddUnitModal(true);
                          setNewEditUnitName('');
                        }}
                        className="px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors whitespace-nowrap"
                        title="Add new unit"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={editForm.currency}
                      onChange={(e) => handleEditFieldChange("currency", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    >
                      <option value="USA">USA</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => handleEditFieldChange("date", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Vendor</label>
                    <div className="flex gap-2">
                      <select
                        value={editForm.fuelVendor}
                        onChange={(e) => handleEditFieldChange("fuelVendor", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                        style={focusRingStyle}
                      >
                        <option value="">Select Fuel Vendor</option>
                        {loadingEditFuelVendors ? (
                          <option disabled>Loading...</option>
                        ) : (
                          editFuelVendors.map((v) => (
                            <option key={v._id} value={v.name}>
                              {v.name}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditAddVendorModal(true);
                          setNewEditVendorName('');
                        }}
                        className="px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors whitespace-nowrap"
                        title="Add new fuel vendor"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.fuelAmount}
                      onChange={(e) => handleEditFieldChange("fuelAmount", e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => handleEditFieldChange("status", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={closeEditModal}
                disabled={editSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                disabled={editSubmitting}
                className="px-6 py-2 rounded-lg !text-white font-semibold transition-colors disabled:opacity-60"
                style={{ background: FLEET_COLORS.gradient }}
              >
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Add Fuel Type Modal for Edit */}
          {showEditAddTypeModal && (
            <>
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[102]" onClick={() => setShowEditAddTypeModal(false)}></div>
              <div className="fixed inset-0 flex items-center justify-center z-[103] px-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Fuel Type</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuel Type Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newEditTypeName}
                        onChange={(e) => setNewEditTypeName(e.target.value)}
                        placeholder="e.g., Diesel, Gasoline, Electric"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                        style={focusRingStyle}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditAddNewType();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          setShowEditAddTypeModal(false);
                          setNewEditTypeName('');
                        }}
                        disabled={addingEditType}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditAddNewType}
                        disabled={addingEditType || !newEditTypeName.trim()}
                        className="px-4 py-2 rounded-lg !text-white transition-colors disabled:opacity-60"
                        style={{ background: FLEET_COLORS.gradient }}
                      >
                        {addingEditType ? 'Adding...' : 'Add Type'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Add Unit Modal for Edit */}
          {showEditAddUnitModal && (
            <>
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[102]" onClick={() => setShowEditAddUnitModal(false)}></div>
              <div className="fixed inset-0 flex items-center justify-center z-[103] px-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Unit</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newEditUnitName}
                        onChange={(e) => setNewEditUnitName(e.target.value)}
                        placeholder="e.g., L, gal, ml"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                        style={focusRingStyle}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditAddNewUnit();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          setShowEditAddUnitModal(false);
                          setNewEditUnitName('');
                        }}
                        disabled={addingEditUnit}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditAddNewUnit}
                        disabled={addingEditUnit || !newEditUnitName.trim()}
                        className="px-4 py-2 rounded-lg !text-white transition-colors disabled:opacity-60"
                        style={{ background: FLEET_COLORS.gradient }}
                      >
                        {addingEditUnit ? 'Adding...' : 'Add Unit'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Add Fuel Vendor Modal for Edit */}
          {showEditAddVendorModal && (
            <>
              <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[102]" onClick={() => setShowEditAddVendorModal(false)}></div>
              <div className="fixed inset-0 flex items-center justify-center z-[103] px-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Fuel Vendor</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuel Vendor Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newEditVendorName}
                        onChange={(e) => setNewEditVendorName(e.target.value)}
                        placeholder="e.g., Shell, Chevron, Petro-Canada"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                        style={focusRingStyle}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditAddNewVendor();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => {
                          setShowEditAddVendorModal(false);
                          setNewEditVendorName('');
                        }}
                        disabled={addingEditVendor}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEditAddNewVendor}
                        disabled={addingEditVendor || !newEditVendorName.trim()}
                        className="px-4 py-2 rounded-lg !text-white transition-colors disabled:opacity-60"
                        style={{ background: FLEET_COLORS.gradient }}
                      >
                        {addingEditVendor ? 'Adding...' : 'Add Vendor'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-3xl">⚠️</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Fuel Report</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete the fuel report for{" "}
                  <span className="font-medium text-gray-800">{renderVehicleLabel(deleteTarget)}</span>?
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 !text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelReports;

