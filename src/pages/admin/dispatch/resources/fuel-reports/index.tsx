import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { message } from "antd";
import NewFuelReportSidebar from "./NewFuelReportSidebar";
import {
  listFuelReport,
  deleteFuelReport,
  updateStatusFuelReport,
  updateFuelReport,
} from "../../../../../axios/api/dispatcher.fuelreport";
import { useDrivers } from "../../../../../customHooks/useDrivers";
import { useVehicles } from "../../../../../customHooks/useVehicles";

interface FuelReportType {
  _id: string;
  reporter: { _id: string; name: string };
  driver: { _id: string; name: string };
  vehicle: { _id: string; plateNumber: string; vinNumber: string };
  volume: string;
  type: string;
  odometer: string;
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

const FuelReports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fuelReports, setFuelReports] = useState<FuelReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  const { drivers } = useDrivers();
  const { vehicles } = useVehicles();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userInfo");
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error parsing userInfo from localStorage:", error);
    } finally {
      setUserInfoReady(true);
    }
  }, []);

  const fetchFuelReports = async () => {
    try {
      setLoading(true);
      const res = await listFuelReport();
      if (res.success) {
        const data = Array.isArray(res.data) ? res.data : [];
        setFuelReports(data);
        if (res.message && data.length === 0) {
          setEmptyStateMessage(res.message);
        } else {
          setEmptyStateMessage(null);
        }
      } else {
        message.error(res.message || "Failed to fetch fuel reports");
        setFuelReports([]);
        setEmptyStateMessage(res?.message || "Failed to fetch fuel reports");
      }
    } catch (error: any) {
      console.error(error);
      setFuelReports([]);
      setEmptyStateMessage(error?.message || "Failed to fetch fuel reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfoReady) {
      return;
    }

    const userRole = userInfo?.role || userInfo?.userData?.role;
    const userCompany = userInfo?.company || userInfo?.userData?.company;
    const isSuperadmin = userRole === "superadmin";
    const isComplianceManager = userRole === "Compliance Manager";
    const hasCompany = Boolean(userCompany);

    if (!isSuperadmin && !hasCompany && !isComplianceManager) {
      setFuelReports([]);
      setEmptyStateMessage(null);
      return;
    }

    fetchFuelReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoReady, userInfo]);

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
        await fetchFuelReports();
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

  const filteredReports = useMemo(
    () =>
      fuelReports.filter(
        (report) =>
          report.reporter?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.driver?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.vehicle?.plateNumber
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          report.status?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [fuelReports, searchTerm]
  );

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Fuel Reports
          </h1>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search Fuel Reports"
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Fuel Report</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Odometer
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No fuel reports found
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {report.reporter?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {report.driver?.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {report.vehicle?.plateNumber} - {report.vehicle?.vinNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
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
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {report.volume} {report.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {report.odometer}
                      </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEditModal(report)}
                        className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors h-9 w-9 shadow-sm border border-blue-100"
                        title="Edit fuel report"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(report)}
                        className="inline-flex items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors h-9 w-9 shadow-sm border border-red-100"
                        title="Delete fuel report"
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
      </div>

      {/* Sidebar Component */}
      <NewFuelReportSidebar
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          fetchFuelReports();
        }}
      />

      {/* Edit Modal */}
      {editModalOpen && editingReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Edit Fuel Report</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                <input
                  type="text"
                  value={editingReport.reporter?.name || ""}
                  disabled
                  className="w-full border px-3 py-2 rounded bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                <select
                  value={editForm.driverId}
                  onChange={(e) => handleEditFieldChange("driverId", e.target.value)}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.plateNumber} - {vehicle.vinNumber}
                    </option>
                  ))}
                  {editForm.vehicleId &&
                    !vehicles.some((vehicle) => vehicle._id === editForm.vehicleId) && (
                      <option value={editForm.vehicleId}>
                        {editingReport.vehicle?.plateNumber} - {editingReport.vehicle?.vinNumber}
                      </option>
                    )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => handleEditFieldChange("status", e.target.value)}
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
                <div className="flex">
                  <input
                    type="number"
                    min={0}
                    value={editForm.volume}
                    onChange={(e) => handleEditFieldChange("volume", e.target.value)}
                    placeholder="Enter volume"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={editForm.type}
                    onChange={(e) => handleEditFieldChange("type", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Odometer</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.odometer}
                  onChange={(e) => handleEditFieldChange("odometer", e.target.value)}
                  placeholder="Enter odometer"
                  className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeEditModal}
                disabled={editSubmitting}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                disabled={editSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
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
                  <span className="font-medium text-gray-800">{deleteTarget.vehicle?.plateNumber}</span>?
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
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
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

