import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  listVehicleServices,
  updateServiceStatus,
  updateVehicleService,
  type VehicleServiceResponse,
  type ServiceFilters,
} from "../../../../axios/api/vehicleService";
import { getAllSpareParts } from "../../../../axios/api/fleet.spareparts";
import { getUserId } from "../../../../utils/auth";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Wrench,
  Car,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Package,
  X,
  Trash2,
} from "lucide-react";
import { getUserRole } from "../../../../utils/auth";

const formatDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const statusBadge = (status: string) => {
  const s = (status || "").toLowerCase();
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    "in-progress": "bg-blue-100 text-blue-800",
    pending: "bg-amber-100 text-amber-800",
  };
  const style = styles[s] || "bg-gray-100 text-gray-800";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {status || "—"}
    </span>
  );
};

const priorityBadge = (priority: string) => {
  const p = (priority || "").toLowerCase();
  const styles: Record<string, string> = {
    urgent: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-gray-100 text-gray-800",
  };
  const style = styles[p] || "bg-gray-100 text-gray-800";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {priority || "—"}
    </span>
  );
};

interface PartRow {
  id: string;
  partId?: string;
  partName: string;
  partNumber: string;
  quantity: number;
  cost: number;
}

interface SparePartOption {
  _id: string;
  partNumber: string;
  partName: string;
  sellingPrice?: number;
  buyingPrice?: number;
  stockQty?: number;
}

const Services: React.FC = () => {
  const userRole = getUserRole();
  const basePath = userRole === "Maintenance Crew (Mechanics)" ? "/mechanics" : "/admin/mechanics";
  const currentUserId = getUserId();

  const [allServicesData, setAllServicesData] = useState<VehicleServiceResponse[]>([]);
  const [services, setServices] = useState<VehicleServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    page: 1,
    totalPages: 1,
  });
  const [selectedService, setSelectedService] = useState<VehicleServiceResponse | null>(null);
  const [completeModal, setCompleteModal] = useState<VehicleServiceResponse | null>(null);
  const [completeForm, setCompleteForm] = useState({
    parts: [] as PartRow[],
  });
  const [spareParts, setSpareParts] = useState<SparePartOption[]>([]);
  const [sparePartsLoading, setSparePartsLoading] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Calculate stats from all services
  const stats = useMemo(() => {
    const total = allServicesData.length;
    const completed = allServicesData.filter((s) => s.status === "completed").length;
    const pending = allServicesData.filter((s) => s.status === "pending").length;
    const inProgress = allServicesData.filter((s) => s.status === "in-progress").length;
    return { total, completed, pending, inProgress };
  }, [allServicesData]);

  const loadServices = useCallback(async (pageNum = page) => {
    if (!currentUserId) {
      setError("User ID not found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("🔍 Loading services for mechanic:", currentUserId);
      
      const filters: ServiceFilters = {
        // Note: Backend automatically filters by mechanic ID for 'Maintenance Crew (Mechanics)' role
      };

      // Load ALL services for stats (no filters)
      const allResponse = await listVehicleServices({});
      if (allResponse?.success && allResponse?.data) {
        const allServices = Array.isArray(allResponse.data) ? allResponse.data : [];
        setAllServicesData(allServices);
      }

      // Apply filters for table display
      if (statusFilter !== "all") {
        filters.status = statusFilter as "pending" | "in-progress" | "completed";
      }

      if (priorityFilter !== "all") {
        filters.priority = priorityFilter as "low" | "medium" | "high" | "urgent";
      }

      console.log("📤 API Filters:", filters);
      const response = await listVehicleServices(filters);
      console.log("📥 API Response:", response);
      
      if (response?.success && response?.data) {
        let filteredServices = Array.isArray(response.data) ? response.data : [];
        
        console.log(`✅ Received ${filteredServices.length} services from API`);
        
        // Client-side filtering for search
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          filteredServices = filteredServices.filter((service) => {
            const unitNumber = (service.unitNumber || "").toLowerCase();
            const description = (service.description || "").toLowerCase();
            const serviceType = (service.serviceType || "").toLowerCase();
            const makeModel = (service.makeModel || "").toLowerCase();
            const invoiceNumber = (service.invoiceNumber || "").toLowerCase();
            return (
              unitNumber.includes(searchLower) ||
              description.includes(searchLower) ||
              serviceType.includes(searchLower) ||
              makeModel.includes(searchLower) ||
              invoiceNumber.includes(searchLower)
            );
          });
        }

        // Pagination
        const startIndex = (pageNum - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedServices = filteredServices.slice(startIndex, endIndex);

        setServices(paginatedServices);
        setPagination({
          totalCount: filteredServices.length,
          page: pageNum,
          totalPages: Math.ceil(filteredServices.length / limit),
        });
      } else {
        const errorMsg = response?.message || "Failed to load services";
        console.error("❌ API Error:", errorMsg);
        setError(errorMsg);
        setServices([]);
        setPagination({
          totalCount: 0,
          page: 1,
          totalPages: 1,
        });
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to load services";
      console.error("❌ Error loading services:", err);
      setError(errorMsg);
      setServices([]);
      setPagination({
        totalCount: 0,
        page: 1,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentUserId, statusFilter, priorityFilter, search, page, limit]);

  useEffect(() => {
    loadServices(page);
  }, [loadServices, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  const loadSpareParts = async () => {
    setSparePartsLoading(true);
    try {
      const res = await getAllSpareParts();
      if (res?.success && res?.data) {
        setSpareParts(Array.isArray(res.data) ? res.data : []);
      } else {
        setSpareParts([]);
      }
    } catch {
      setSpareParts([]);
    } finally {
      setSparePartsLoading(false);
    }
  };

  useEffect(() => {
    if (completeModal) loadSpareParts();
  }, [completeModal]);

  const handleUpdateStatus = async (serviceId: string, status: "pending" | "in-progress" | "completed") => {
    if (status === "completed") {
      // Open parts modal
      const service = allServicesData.find((s) => s._id === serviceId);
      if (service) {
        setCompleteModal(service);
        setCompleteForm({ parts: [] });
      }
    } else {
      // Update status directly
      setUpdatingStatus(serviceId);
      try {
        const response = await updateServiceStatus(serviceId, status);
        if (response?.success) {
          setNotification({ type: "success", message: `Service status updated to ${status}` });
          await loadServices(page);
        } else {
          setNotification({ type: "error", message: response?.message || "Failed to update status" });
        }
      } catch (err: any) {
        setNotification({ type: "error", message: err?.response?.data?.message || "Failed to update status" });
      } finally {
        setUpdatingStatus(null);
      }
    }
  };

  const handleCompleteService = async () => {
    if (!completeModal) return;

    setUpdatingStatus(completeModal._id);
    try {
      // Prepare parts data
      const partsData = completeForm.parts.map((p) => ({
        partId: p.partId || p.id,
        partName: p.partName,
        partNumber: p.partNumber,
        quantity: p.quantity,
        cost: p.cost,
      }));

      // Update service with status and parts
      const updateData: any = {
        status: "completed",
      };

      if (partsData.length > 0) {
        updateData.parts = partsData;
      }

      const response = await updateVehicleService(completeModal._id, updateData);
      if (response?.success) {
        setNotification({ type: "success", message: "Service marked as completed" });
        setCompleteModal(null);
        setCompleteForm({ parts: [] });
        await loadServices(page);
      } else {
        setNotification({ type: "error", message: response?.message || "Failed to complete service" });
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err?.response?.data?.message || "Failed to complete service" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const addPart = () => {
    if (!selectedPartId) return;
    const part = spareParts.find((p) => p._id === selectedPartId);
    if (!part) return;

    const newPart: PartRow = {
      id: `part-${Date.now()}`,
      partId: part._id,
      partName: part.partName || "",
      partNumber: part.partNumber || "",
      quantity: 1,
      cost: part.sellingPrice || part.buyingPrice || 0,
    };

    setCompleteForm({
      ...completeForm,
      parts: [...completeForm.parts, newPart],
    });
    setSelectedPartId("");
  };

  const removePart = (id: string) => {
    setCompleteForm({
      ...completeForm,
      parts: completeForm.parts.filter((p) => p.id !== id),
    });
  };

  const updatePart = (id: string, field: keyof PartRow, value: any) => {
    setCompleteForm({
      ...completeForm,
      parts: completeForm.parts.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    });
  };

  const partsTotal = useMemo(
    () => completeForm.parts.reduce((sum, p) => sum + (p.quantity || 0) * (p.cost || 0), 0),
    [completeForm.parts]
  );

  if (loading && services.length === 0) {
    return (
      <div className="p-6 min-h-screen bg-[#EDF8FF]">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#42aeec]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#EDF8FF] min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Assigned Services</h1>
        <p className="text-sm text-gray-500 mt-1">Services assigned to you</p>
      </div>

      {notification && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 ${
            notification.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notification.message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-100">
              <Clock className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <Play className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#42aeec]/5 to-transparent flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Services</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pagination.totalCount} service{pagination.totalCount !== 1 ? "s" : ""} found
              {pagination.totalPages > 1 && ` • Page ${pagination.page} of ${pagination.totalPages}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search unit, description..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg w-48 focus:border-[#42aeec] focus:ring-2 focus:ring-[#42aeec]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-[#42aeec] focus:ring-2 focus:ring-[#42aeec]/20"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-[#42aeec] focus:ring-2 focus:ring-[#42aeec]/20"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Make/Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    No services assigned to you
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(service.serviceDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {service.unitNumber || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.unitType || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.makeModel || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {service.serviceType || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={service.description || undefined}>
                      {service.description || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {priorityBadge(service.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {statusBadge(service.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {service.status !== "in-progress" && service.status !== "completed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(service._id, "in-progress");
                            }}
                            disabled={updatingStatus === service._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Play size={14} />
                            Start
                          </button>
                        )}
                        {service.status !== "completed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(service._id, "completed");
                            }}
                            disabled={updatingStatus === service._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={14} />
                            Complete
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                        >
                          <FileText size={14} />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * limit + 1}–{Math.min(pagination.page * limit, pagination.totalCount)} of {pagination.totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <span className="text-sm text-gray-600 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#42aeec]/5 to-transparent flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#42aeec]/10">
                  <Wrench className="text-[#42aeec]" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Service Details</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Unit {selectedService.unitNumber || "—"} • {formatDate(selectedService.serviceDate)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Status & Priority */}
              <div className="flex flex-wrap items-center gap-3">
                {statusBadge(selectedService.status)}
                {priorityBadge(selectedService.priority)}
              </div>

              {/* Service Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Number</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedService.unitNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Type</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedService.unitType || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Make/Model</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedService.makeModel || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service Type</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedService.serviceType || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Service Date</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatDate(selectedService.serviceDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Date</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatDate(selectedService.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Odometer</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {selectedService.odometer != null ? selectedService.odometer.toLocaleString() : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Due Mileage</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {selectedService.dueMileage != null ? selectedService.dueMileage.toLocaleString() : "—"}
                  </p>
                </div>
                {selectedService.description && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</p>
                    <p className="text-sm text-gray-700 mt-0.5">{selectedService.description}</p>
                  </div>
                )}
                {selectedService.notes && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-gray-700 mt-0.5">{selectedService.notes}</p>
                  </div>
                )}
                {selectedService.invoiceNumber && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice Number</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedService.invoiceNumber}</p>
                  </div>
                )}
                {selectedService.amount != null && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      ${selectedService.amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/30 flex-shrink-0">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Service Modal with Parts */}
      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#42aeec]/5 to-transparent flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Complete Service</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Unit {completeModal.unitNumber || "—"} • {completeModal.serviceType || "—"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCompleteModal(null);
                  setCompleteForm({ parts: [] });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Add Parts Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={18} />
                  Add Parts Used
                </h4>
                <div className="flex gap-2 mb-4">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-[#42aeec] focus:ring-2 focus:ring-[#42aeec]/20"
                    disabled={sparePartsLoading}
                  >
                    <option value="">Select a part...</option>
                    {spareParts.map((part) => (
                      <option key={part._id} value={part._id}>
                        {part.partNumber} - {part.partName} {part.stockQty !== undefined ? `(Stock: ${part.stockQty})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addPart}
                    disabled={!selectedPartId || sparePartsLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#42aeec] rounded-lg hover:bg-[#42aeec]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>

                {/* Parts List */}
                {completeForm.parts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide pb-2 border-b">
                      <div className="col-span-4">Part</div>
                      <div className="col-span-2">Part Number</div>
                      <div className="col-span-2">Quantity</div>
                      <div className="col-span-2">Cost</div>
                      <div className="col-span-2">Total</div>
                    </div>
                    {completeForm.parts.map((part) => (
                      <div key={part.id} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-100">
                        <div className="col-span-4 text-sm text-gray-900">{part.partName}</div>
                        <div className="col-span-2 text-sm text-gray-600">{part.partNumber}</div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={part.quantity}
                            onChange={(e) => updatePart(part.id, "quantity", parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-[#42aeec] focus:ring-1 focus:ring-[#42aeec]/20"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={part.cost}
                            onChange={(e) => updatePart(part.id, "cost", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-[#42aeec] focus:ring-1 focus:ring-[#42aeec]/20"
                          />
                        </div>
                        <div className="col-span-1 text-sm font-semibold text-gray-900">
                          ${((part.quantity || 0) * (part.cost || 0)).toFixed(2)}
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removePart(part.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 flex justify-end">
                      <div className="text-sm font-semibold text-gray-900">
                        Parts Total: <span className="text-lg">${partsTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/30 flex-shrink-0">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCompleteModal(null);
                    setCompleteForm({ parts: [] });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteService}
                  disabled={updatingStatus === completeModal._id}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus === completeModal._id ? "Completing..." : "Complete Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
