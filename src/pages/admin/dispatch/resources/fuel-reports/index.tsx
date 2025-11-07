import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
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

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fuelReports, setFuelReports] = useState<FuelReportType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingReport, setEditingReport] = useState<FuelReportType | null>(null);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState(false);

  const { drivers, loading: loadingDrivers } = useDrivers();
  const { vehicles, loading: loadingVehicles } = useVehicles();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
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
        alert(res.message || "Failed to fetch fuel reports");
        setFuelReports([]);
        setEmptyStateMessage(res?.message || 'Failed to fetch fuel reports');
      }
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      setFuelReports([]);
      setEmptyStateMessage(error?.message || 'Failed to fetch fuel reports');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfoReady) {
      return;
    }

    const isSuperadmin = userInfo?.role === 'superadmin';
    const hasCompany = Boolean(userInfo?.company);

    if (!isSuperadmin && !hasCompany) {
      setFuelReports([]);
      setEmptyStateMessage('No company assigned to the current admin.');
      return;
    }

    fetchFuelReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoReady, userInfo]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fuel report?")) return;
    try {
      const res = await deleteFuelReport(id);
      if (res.success) {
        setFuelReports(prev => prev.filter(report => report._id !== id));
        alert(res.message || "Fuel report deleted successfully");
      } else alert(res.message || "Failed to delete fuel report");
    } catch (error) {
      console.error(error);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await updateStatusFuelReport(id, { status });
      if (res.success) {
        setFuelReports(prev =>
          prev.map(report =>
            report._id === id ? { ...report, status } : report
          )
        );
        alert(res.message || "Status updated successfully");
      } else alert(res.message || "Failed to update status");
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!editingReport) return;
    try {
      const res = await updateFuelReport(editingReport._id, editingReport);
      if (res.success) {
        setFuelReports(prev =>
          prev.map(report =>
            report._id === editingReport._id ? editingReport : report
          )
        );
        alert(res.message || "Fuel report updated successfully");
        setEditingReport(null);
      } else alert(res.message || "Failed to update fuel report");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredReports = fuelReports.filter(report =>
    report.reporter?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.vehicle?.plateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.status?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h2 className="text-2xl font-semibold text-gray-800">No fuel reports available</h2>
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
          <h1 className="text-2xl font-semibold text-gray-900">Fuel Reports</h1>
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
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Odometer</th>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td></tr>
                ) : filteredReports.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-4 text-center text-gray-500">No fuel reports found</td></tr>
                ) : (
                  filteredReports.map((report, index) => (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{report.reporter?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{report.driver?.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{report.vehicle?.plateNumber} - {report.vehicle?.vinNumber}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}
                          onClick={() => handleStatusUpdate(report._id, report.status === 'approved' ? 'pending' : 'approved')}
                          style={{ cursor: 'pointer' }}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{report.volume} {report.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{report.odometer}</td>
                      <td className="px-6 py-4 flex space-x-2">
                        <button onClick={() => setEditingReport(report)} className="text-blue-500 hover:text-blue-700">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(report._id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
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
     {editingReport && (
  <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-96 space-y-4 max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold">Edit Fuel Report</h2>

      {/* Reporter (readonly) */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
        <input
          type="text"
          value={editingReport.reporter?.name || ""}
          disabled
          className="w-full border px-3 py-2 rounded bg-gray-100 cursor-not-allowed"
        />
      </div>

      {/* Driver */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
        <select
          value={editingReport.driver?._id || ""}
          onChange={e => {
            const selected = drivers.find(d => d._id === e.target.value);
            if (selected) setEditingReport({ ...editingReport, driver: selected });
          }}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Driver</option>
          {drivers.map(driver => (
            <option key={driver._id} value={driver._id}>{driver.name}</option>
          ))}
        </select>
      </div>

      {/* Vehicle */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
        <select
          value={editingReport.vehicle?._id || ""}
          onChange={e => {
            const selected = vehicles.find(v => v._id === e.target.value);
            if (selected) setEditingReport({ ...editingReport, vehicle: selected });
          }}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Vehicle</option>
          {vehicles.map(vehicle => (
            <option key={vehicle._id} value={vehicle._id}>{vehicle.plateNumber} - {vehicle.vinNumber}</option>
          ))}
        </select>
      </div>

      {/* Volume */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Volume</label>
        <div className="flex">
          <input
            type="number"
            value={editingReport.volume}
            onChange={e => setEditingReport({ ...editingReport, volume: e.target.value })}
            placeholder="Enter volume"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={editingReport.type}
            onChange={e => setEditingReport({ ...editingReport, type: e.target.value })}
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

      {/* Odometer */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Odometer</label>
        <input
          type="number"
          value={editingReport.odometer}
          onChange={e => setEditingReport({ ...editingReport, odometer: e.target.value })}
          placeholder="Enter odometer"
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={editingReport.status}
          onChange={e => setEditingReport({ ...editingReport, status: e.target.value })}
          className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setEditingReport(null)}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateSubmit}
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Index;
