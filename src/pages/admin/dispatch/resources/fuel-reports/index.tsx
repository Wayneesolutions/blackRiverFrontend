import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { FaFileInvoiceDollar, FaGasPump, FaClipboardList } from "react-icons/fa";
import { message } from "antd";
import NewFuelReportSidebar from "./NewFuelReportSidebar";
import {
  listFuelReport,
  deleteFuelReport,
  updateStatusFuelReport,
  updateFuelReport,
} from "../../../../../axios/api/dispatcher.fuelreport";
import { useDrivers } from "../../../../../customHooks/useDrivers";
import { listFleetUnits } from "../../../../../axios/api/fleet.units";
import { FLEET_COLORS } from "../../../fleetMaintenance/colorUtils";

interface FuelReportType {
  _id: string;
  reporter: { _id: string; name?: string; email?: string };
  reporterName?: string;
  reporterEmail?: string;
  driver: { _id: string; name: string };
  vehicle: { _id: string; plateNumber?: string; vinNumber?: string; unitNo?: string; unitType?: string; makeModel?: string };
  volume: string;
  type: string;
  odometer: string;
  cost?: number; // Added cost field
  status: string;
  createdAt: string;
}

interface FuelReportEditForm {
  driverId: string;
  vehicleId: string;
  volume: string;
  type: string;
  odometer: string;
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
    driverId: "",
    vehicleId: "",
    volume: "",
    type: "l",
    odometer: "",
    status: "pending",
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
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
        report.vehicle?.unitNo ||
        report.vehicle?.plateNumber ||
        report.vehicle?.vinNumber ||
        "N/A";
      const secondary = [report.vehicle?.makeModel, report.vehicle?.plateNumber, report.vehicle?.vinNumber]
        .filter(Boolean)
        .join(" · ");
      return {
        primary,
        secondary,
        badge: report.vehicle?.unitType || ""
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

  const openEditModal = (report: FuelReportType) => {
    setEditingReport(report);
    setEditForm({
      driverId: report.driver?._id || "",
      vehicleId: report.vehicle?._id || "",
      volume: report.volume || "",
      type: report.type || "l",
      odometer: report.odometer || "",
      status: report.status || "pending",
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (editSubmitting) return;
    setEditModalOpen(false);
    setEditingReport(null);
    setEditForm({
      driverId: "",
      vehicleId: "",
      volume: "",
      type: "l",
      odometer: "",
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
    if (
      !editForm.driverId ||
      !editForm.vehicleId ||
      !editForm.volume ||
      !editForm.odometer
    ) {
      message.warning("Please fill in all required fields.");
      return;
    }
    try {
      setEditSubmitting(true);
      const payload = {
        driver: editForm.driverId,
        vehicle: editForm.vehicleId,
        volume: editForm.volume,
        type: editForm.type,
        odometer: editForm.odometer,
        status: editForm.status,
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
  // Parse volume as float just in case
  const totalVolume = fuelReports.reduce((acc, r) => acc + (parseFloat(r.volume) || 0), 0);
  const totalCost = fuelReports.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);

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
      <div className="relative max-w-7xl mx-auto">

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
            <StatCard title="Total Volume" value={`${totalVolume.toLocaleString()} L`} subtitle="Fuel consumed" icon={FaGasPump} bgColor="bg-orange-50" iconColor="text-orange-600" />
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reporter, driver, vehicle or status..."
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
                    Reporter
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Driver
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Vehicle
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Status
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Volume
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Cost
                  </th>
                  <th className="px-6 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
                    Odometer
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
                      colSpan={8}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No fuel reports found
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-2 text-xs">
                        {(() => {
                          const reporterInfo = getReporterDetails(report);
                          return (
                            <>
                              <div className="font-semibold text-gray-900">
                                {reporterInfo.name}
                              </div>
                              {reporterInfo.email && (
                                <div className="text-[10px] text-gray-500">
                                  {reporterInfo.email}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-500">
                        {report.driver?.name || "N/A"}
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-500">
                        {(() => {
                          const vehicleDetails = getVehicleDetails(report);
                          return (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-gray-900">{vehicleDetails.primary}</div>
                              {vehicleDetails.secondary && (
                                <div className="text-[10px] text-gray-500">{vehicleDetails.secondary}</div>
                              )}
                              {vehicleDetails.badge && (
                                <span
                                  className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                                  style={{
                                    backgroundColor:
                                      vehicleDetails.badge.toLowerCase().includes("trailer")
                                        ? "rgba(34, 197, 94, 0.15)"
                                        : "rgba(1, 106, 178, 0.15)",
                                    color:
                                      vehicleDetails.badge.toLowerCase().includes("trailer")
                                        ? "#15803d"
                                        : FLEET_COLORS.primary
                                  }}
                                >
                                  {vehicleDetails.badge}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusColor(
                            report.status
                          )}`}
                          onClick={() =>
                            handleStatusUpdate(
                              report._id,
                              report.status === "approved" ? "pending" : "approved"
                            )
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-500">
                        {report.volume} {report.type}
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-500">
                        {report.cost ? `$${Number(report.cost).toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-500">
                        {report.odometer}
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
        onClose={(shouldRefresh = true) => {
          setIsSidebarOpen(false);
          if (shouldRefresh) {
            // Reset to page 1 to show the newly created report (since sorted by createdAt desc)
            setCurrentPage(1);
            // The useEffect will trigger fetchFuelReports when currentPage changes
          }
        }}
        units={units}
        unitsLoading={unitsLoading}
        currentUser={userInfo}
      />

      {/* Edit Modal */}
      {/* Edit Sidebar */}
      {editModalOpen && editingReport && (
        <>
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={closeEditModal} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0" style={{ background: FLEET_COLORS.gradient }}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Edit Fuel Report</h2>
                <button
                  onClick={closeEditModal}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                  <div className="w-full border border-gray-300 px-3 py-2 rounded bg-gray-50 text-sm text-gray-700">
                    <div className="font-semibold">
                      {getReporterDetails(editingReport).name}
                    </div>
                    {getReporterDetails(editingReport).email && (
                      <div className="text-xs text-gray-500">
                        {getReporterDetails(editingReport).email}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                  <select
                    value={editForm.driverId}
                    onChange={(e) => handleEditFieldChange("driverId", e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:border-transparent"
                    style={focusRingStyle}
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name}
                      </option>
                    ))}
                    {editForm.driverId &&
                      !drivers.some((driver) => driver._id === editForm.driverId) && (
                        <option value={editForm.driverId}>
                          {editingReport.driver?.name || "Current driver"}
                        </option>
                      )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <select
                    value={editForm.vehicleId}
                    onChange={(e) => handleEditFieldChange("vehicleId", e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:border-transparent"
                    style={focusRingStyle}
                  >
                    <option value="">Select Unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {formatUnitLabel(unit)}
                      </option>
                    ))}
                    {editForm.vehicleId && !unitsMap.has(editForm.vehicleId) && (
                      <option value={editForm.vehicleId}>{renderVehicleLabel(editingReport)}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => handleEditFieldChange("status", e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:border-transparent"
                    style={focusRingStyle}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                  <div className="flex">
                    <input
                      type="number"
                      min={0}
                      value={editForm.volume}
                      onChange={(e) => handleEditFieldChange("volume", e.target.value)}
                      placeholder="Enter volume"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    />
                    <select
                      value={editForm.type}
                      onChange={(e) => handleEditFieldChange("type", e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:border-transparent"
                      style={focusRingStyle}
                    >
                      <option value="ml">ml</option>
                      <option value="cl">cl</option>
                      <option value="dl">dl</option>
                      <option value="dm³">dm³</option>
                      <option value="l">L</option>
                      <option value="gal">gal</option>
                      <option value="pt">pt</option>
                      <option value="qt">qt</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.odometer}
                    onChange={(e) => handleEditFieldChange("odometer", e.target.value)}
                    placeholder="Enter odometer"
                    className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-2 focus:border-transparent"
                    style={focusRingStyle}
                  />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={closeEditModal}
                disabled={editSubmitting}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                disabled={editSubmitting}
                className="px-6 py-2 rounded-lg !text-white transition-colors disabled:opacity-60"
                style={{ background: FLEET_COLORS.gradient }}
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
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

