import { useMemo, useState, useEffect } from "react";
import ExcelJS from "exceljs";
import {
  Download,
  Filter,
  Truck as TruckIcon,
  UserCog,
  Users,
  Wrench,
  ClipboardList,
  Search,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import { getComplianceInvoices, updateComplianceInvoice, deleteComplianceInvoice } from "../../../../axios/api/admin";

type MechanicInvoice = {
  id: string;
  type?: 'general' | 'scheduled' | 'safety';
  serviceDate: string;
  unitNumber: string;
  makeModel: string;
  vinOrPlate: string;
  description: string;
  odometer: number;
  parts: { name: string; cost: number }[];
  notes: string;
  serviceProvider: string;
  invoiceNumber: string;
  passedInspection: boolean;
  driver: string;
  serviceCategory: string;
  location: string;
};

interface Notification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: Notification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10000] ${bgColors[notification.type]} animate-slide-in`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
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

// Removed static data - now fetching from API

const ComplianceInvoices = () => {
  const [truckFilter, setTruckFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [mechanicFilter, setMechanicFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<MechanicInvoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editModal, setEditModal] = useState<{ show: boolean; invoice: MechanicInvoice | null }>({ show: false, invoice: null });
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; invoice: MechanicInvoice | null }>({ show: false, invoice: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    invoiceNumber: '',
    serviceProvider: '',
    notes: '',
    odometer: 0,
    parts: '',
    description: '',
  });

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: currentPage,
          limit: pageSize
        };
        
        if (truckFilter !== "all") params.unitNumber = truckFilter;
        if (driverFilter !== "all") params.driver = driverFilter;
        if (mechanicFilter !== "all") params.serviceProvider = mechanicFilter;
        if (searchTerm.trim()) params.search = searchTerm.trim();

        const response = await getComplianceInvoices(params);
        
        if (response?.success && response?.data) {
          // Map API response to MechanicInvoice format
          const mappedInvoices: MechanicInvoice[] = response.data.map((invoice: any) => ({
            id: invoice.id || invoice._id || '',
            type: invoice.type || 'general',
            serviceDate: invoice.serviceDate || new Date().toISOString(),
            unitNumber: invoice.unitNumber || 'N/A',
            makeModel: invoice.makeModel || 'N/A',
            vinOrPlate: invoice.vinOrPlate || 'N/A',
            description: invoice.description || '',
            odometer: invoice.odometer || 0,
            parts: invoice.parts || [],
            notes: invoice.notes || '',
            serviceProvider: invoice.serviceProvider || 'N/A',
            invoiceNumber: invoice.invoiceNumber || 'N/A',
            passedInspection: invoice.passedInspection !== false,
            driver: invoice.driver || 'N/A',
            serviceCategory: invoice.serviceCategory || 'N/A',
            location: invoice.location || 'N/A'
          }));
          
          setInvoices(mappedInvoices);
          
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
            setTotal(response.pagination.total || 0);
          }
        } else {
          setInvoices([]);
        }
      } catch (error) {
        console.error('Error fetching compliance invoices:', error);
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [truckFilter, driverFilter, mechanicFilter, searchTerm, currentPage]);

  // Get unique values for filters
  const uniqueTrucks = useMemo(
    () => ["all", ...new Set(invoices.map((invoice) => invoice.unitNumber))],
    [invoices]
  );
  const uniqueDrivers = useMemo(
    () => ["all", ...new Set(invoices.map((invoice) => invoice.driver))],
    [invoices]
  );
  const uniqueMechanics = useMemo(
    () => ["all", ...new Set(invoices.map((invoice) => invoice.serviceProvider))],
    [invoices]
  );

  const filteredInvoices = invoices; // Already filtered by API

  const summary = useMemo(() => {
    const passed = filteredInvoices.filter((invoice) => invoice.passedInspection).length;
    const followUps = filteredInvoices.length - passed;
    const totalPartsSpend = filteredInvoices.reduce((sum, invoice) => {
      return (
        sum +
        invoice.parts.reduce((partsSum, part) => partsSum + part.cost, 0)
      );
    }, 0);

    return {
      total: filteredInvoices.length,
      passed,
      followUps,
      totalPartsSpend,
    };
  }, [filteredInvoices]);

  // Removed serviceReminders - can be added later if needed

  const handleExport = async () => {
    if (!filteredInvoices.length) {
      alert("No invoice data available for the current filters.");
      return;
    }

    try {
      setExporting(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Compliance Invoices");

      worksheet.columns = [
        { header: "Invoice Number", key: "invoiceNumber", width: 18 },
        { header: "Service Date", key: "serviceDate", width: 16 },
        { header: "Unit Number", key: "unitNumber", width: 14 },
        { header: "Driver", key: "driver", width: 16 },
        { header: "Make / Model", key: "makeModel", width: 24 },
        { header: "VIN / License Plate", key: "vinOrPlate", width: 24 },
        { header: "Description", key: "description", width: 32 },
        { header: "Odometer", key: "odometer", width: 14 },
        { header: "Parts Used", key: "parts", width: 32 },
        { header: "Service Provider (Mechanic)", key: "serviceProvider", width: 26 },
        { header: "Location", key: "location", width: 20 },
        { header: "Passed Inspection", key: "passedInspection", width: 18 },
        { header: "Notes", key: "notes", width: 40 },
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0EA5E9" },
      };

      filteredInvoices.forEach((invoice) => {
        worksheet.addRow({
          invoiceNumber: invoice.invoiceNumber || "N/A",
          serviceDate: invoice.serviceDate ? new Date(invoice.serviceDate).toLocaleDateString() : "N/A",
          unitNumber: invoice.unitNumber || "N/A",
          driver: invoice.driver || "N/A",
          makeModel: invoice.makeModel || "N/A",
          vinOrPlate: invoice.vinOrPlate || "N/A",
          description: invoice.description || "N/A",
          odometer: invoice.odometer ? invoice.odometer.toLocaleString() : "N/A",
          parts: invoice.parts && invoice.parts.length > 0 
            ? invoice.parts.map((part) => `${part.name || 'Part'} ($${(part.cost || 0).toFixed(2)})`).join(", ")
            : "No parts listed",
          serviceProvider: invoice.serviceProvider || "N/A",
          location: invoice.location || "N/A",
          passedInspection: invoice.passedInspection ? "Passed" : "Follow-up Required",
          notes: invoice.notes || "",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Compliance_Invoices_${new Date()
        .toISOString()
        .split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export invoices:", error);
      alert("Unable to export invoices. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setTruckFilter("all");
    setDriverFilter("all");
    setMechanicFilter("all");
    setSearchTerm("");
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleEdit = (invoice: MechanicInvoice) => {
    setEditForm({
      invoiceNumber: invoice.invoiceNumber || '',
      serviceProvider: invoice.serviceProvider || '',
      notes: invoice.notes || '',
      odometer: invoice.odometer || 0,
      parts: invoice.parts && invoice.parts.length > 0 
        ? invoice.parts.map(p => `${p.name}${p.cost > 0 ? ` $${p.cost.toFixed(2)}` : ''}`).join(', ')
        : '',
      description: invoice.description || '',
    });
    setEditModal({ show: true, invoice });
  };

  const handleSaveEdit = async () => {
    if (!editModal.invoice) return;

    setSaving(true);
    try {
      const updateData: any = {
        type: editModal.invoice.type || 'general',
        invoiceNumber: editForm.invoiceNumber,
        serviceProvider: editForm.serviceProvider,
        notes: editForm.notes,
        odometer: editForm.odometer,
        parts: editForm.parts,
        description: editForm.description,
      };

      // Add type-specific fields
      if (editModal.invoice.type === 'scheduled') {
        // VehicleService specific fields can be added here if needed
      } else if (editModal.invoice.type === 'general') {
        // GeneralRepair specific fields
      } else if (editModal.invoice.type === 'safety') {
        // RegulatorySafety specific fields
        updateData.invoiceNo = editForm.invoiceNumber;
        updateData.shopName = editForm.serviceProvider;
      }

      const response = await updateComplianceInvoice(editModal.invoice.id, updateData);
      
      if (response?.success) {
        showNotification('success', response.message || 'Invoice updated successfully');
        setEditModal({ show: false, invoice: null });
        // Refresh invoices
        const params: any = {
          page: currentPage,
          limit: pageSize
        };
        if (truckFilter !== "all") params.unitNumber = truckFilter;
        if (driverFilter !== "all") params.driver = driverFilter;
        if (mechanicFilter !== "all") params.serviceProvider = mechanicFilter;
        if (searchTerm.trim()) params.search = searchTerm.trim();
        const updatedResponse = await getComplianceInvoices(params);
        if (updatedResponse?.success && updatedResponse?.data) {
          const mappedInvoices: MechanicInvoice[] = updatedResponse.data.map((invoice: any) => ({
            id: invoice.id || invoice._id || '',
            type: invoice.type || 'general',
            serviceDate: invoice.serviceDate || new Date().toISOString(),
            unitNumber: invoice.unitNumber || 'N/A',
            makeModel: invoice.makeModel || 'N/A',
            vinOrPlate: invoice.vinOrPlate || 'N/A',
            description: invoice.description || '',
            odometer: invoice.odometer || 0,
            parts: invoice.parts || [],
            notes: invoice.notes || '',
            serviceProvider: invoice.serviceProvider || 'N/A',
            invoiceNumber: invoice.invoiceNumber || 'N/A',
            passedInspection: invoice.passedInspection !== false,
            driver: invoice.driver || 'N/A',
            serviceCategory: invoice.serviceCategory || 'N/A',
            location: invoice.location || 'N/A'
          }));
          setInvoices(mappedInvoices);
          if (updatedResponse.pagination) {
            setTotalPages(updatedResponse.pagination.totalPages || 1);
            setTotal(updatedResponse.pagination.total || 0);
          }
        }
      } else {
        showNotification('error', response?.message || 'Failed to update invoice');
      }
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to update invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (invoice: MechanicInvoice) => {
    setDeleteModal({ show: true, invoice });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.invoice) return;

    setDeleting(true);
    try {
      const response = await deleteComplianceInvoice(deleteModal.invoice.id, deleteModal.invoice.type || 'general');
      
      if (response?.success) {
        showNotification('success', response.message || 'Invoice deleted successfully');
        setDeleteModal({ show: false, invoice: null });
        // Refresh invoices
        const params: any = {
          page: currentPage,
          limit: pageSize
        };
        if (truckFilter !== "all") params.unitNumber = truckFilter;
        if (driverFilter !== "all") params.driver = driverFilter;
        if (mechanicFilter !== "all") params.serviceProvider = mechanicFilter;
        if (searchTerm.trim()) params.search = searchTerm.trim();
        const updatedResponse = await getComplianceInvoices(params);
        if (updatedResponse?.success && updatedResponse?.data) {
          const mappedInvoices: MechanicInvoice[] = updatedResponse.data.map((invoice: any) => ({
            id: invoice.id || invoice._id || '',
            type: invoice.type || 'general',
            serviceDate: invoice.serviceDate || new Date().toISOString(),
            unitNumber: invoice.unitNumber || 'N/A',
            makeModel: invoice.makeModel || 'N/A',
            vinOrPlate: invoice.vinOrPlate || 'N/A',
            description: invoice.description || '',
            odometer: invoice.odometer || 0,
            parts: invoice.parts || [],
            notes: invoice.notes || '',
            serviceProvider: invoice.serviceProvider || 'N/A',
            invoiceNumber: invoice.invoiceNumber || 'N/A',
            passedInspection: invoice.passedInspection !== false,
            driver: invoice.driver || 'N/A',
            serviceCategory: invoice.serviceCategory || 'N/A',
            location: invoice.location || 'N/A'
          }));
          setInvoices(mappedInvoices);
          if (updatedResponse.pagination) {
            setTotalPages(updatedResponse.pagination.totalPages || 1);
            setTotal(updatedResponse.pagination.total || 0);
          }
        }
      } else {
        showNotification('error', response?.message || 'Failed to delete invoice');
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      showNotification('error', error?.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg text-white">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fleet Invoices</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Invoices automatically generated from Fleet Maintenance records.
              </p>
              <p className="text-xs text-gray-500">
                Includes General Repairs, Scheduled Services, and Safety Inspections with invoice numbers from the Fleet Maintenance module.
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-semibold !text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Preparing Excel..." : "Export to Excel"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Filter className="w-5 h-5 text-blue-600" />
            Filter Invoices
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Trucks (Unit Number)
              </label>
              <select
                value={truckFilter}
                onChange={(event) => setTruckFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {uniqueTrucks.map((truck) => (
                  <option key={truck} value={truck}>
                    {truck === "all" ? "All Trucks" : truck}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Drivers
              </label>
              <select
                value={driverFilter}
                onChange={(event) => setDriverFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {uniqueDrivers.map((driver) => (
                  <option key={driver} value={driver}>
                    {driver === "all" ? "All Drivers" : driver}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Mechanics (Service Provider)
              </label>
              <select
                value={mechanicFilter}
                onChange={(event) => setMechanicFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {uniqueMechanics.map((mechanic) => (
                  <option key={mechanic} value={mechanic}>
                    {mechanic === "all" ? "All Mechanics" : mechanic}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Quick Search
              </label>
              <div className="mt-1 flex items-center rounded-xl border border-gray-200 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Invoice #, Unit, Mechanic..."
                  className="ml-2 w-full border-none text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetFilters}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <TruckIcon className="w-5 h-5 text-blue-500" />
              Invoices logged
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <Users className="w-5 h-5 text-green-500" />
              Passed inspection
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{summary.passed}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <UserCog className="w-5 h-5 text-amber-500" />
              Needs follow-up
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{summary.followUps}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <Wrench className="w-5 h-5 text-purple-500" />
              Parts spend (static)
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              ${summary.totalPartsSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

     

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-lg">
          <table className="min-w-[1400px] divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Service Date",
                  "Unit Number",
                  "Make/Model",
                  "VIN/Plate",
                  "Description",
                  "Odometer",
                  "Parts",
                  "Service Provider",
                  "Invoice #",
                  "Type",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm text-gray-900 font-semibold whitespace-nowrap">
                    {invoice.serviceDate ? new Date(invoice.serviceDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }) : 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 font-semibold">
                    {invoice.unitNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {invoice.makeModel || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 font-mono text-xs">
                    {invoice.vinOrPlate || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700 max-w-xs">
                    <div className="font-medium text-gray-900">{invoice.description || 'N/A'}</div>
                    {invoice.notes && (
                      <p className="text-xs text-gray-500 mt-1 leading-snug">{invoice.notes}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {invoice.odometer ? `${invoice.odometer.toLocaleString()} km` : "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {invoice.parts && invoice.parts.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {invoice.parts.map((part, idx) => (
                          <span
                            key={`${invoice.id}-${part.name || idx}`}
                            className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                          >
                            {part.name || 'Part'}
                            {part.cost > 0 && <span className="ml-1 text-gray-500">${(part.cost || 0).toFixed(2)}</span>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No parts</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {invoice.serviceProvider || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 font-mono">
                    {invoice.invoiceNumber || 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {(() => {
                      const invoiceType = (invoice as any).type || 'general';
                      return (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          invoiceType === 'general' 
                            ? 'bg-purple-100 text-purple-700' 
                            : invoiceType === 'scheduled'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {invoice.serviceCategory || 'N/A'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        invoice.passedInspection
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {invoice.passedInspection ? "Passed" : "Follow-up"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit invoice"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-gray-500" colSpan={12}>
                    Loading invoices...
                  </td>
                </tr>
              )}
              {!loading && filteredInvoices.length === 0 && (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-gray-500" colSpan={12}>
                    No invoices found. {total > 0 ? 'Try adjusting your filters.' : 'No invoices have been created yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} invoices
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 z-[10000] space-y-2">
          {notifications.map((notification) => (
            <ToastNotification
              key={notification.id}
              notification={notification}
              onClose={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />
          ))}
        </div>

        {/* Edit Modal */}
        {editModal.show && editModal.invoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Invoice</h2>
                <button
                  onClick={() => setEditModal({ show: false, invoice: null })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={editForm.invoiceNumber}
                    onChange={(e) => setEditForm({ ...editForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Provider</label>
                  <input
                    type="text"
                    value={editForm.serviceProvider}
                    onChange={(e) => setEditForm({ ...editForm, serviceProvider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    value={editForm.odometer}
                    onChange={(e) => setEditForm({ ...editForm, odometer: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parts (comma-separated, e.g., "tire $50, oil $30")</label>
                  <textarea
                    value={editForm.parts}
                    onChange={(e) => setEditForm({ ...editForm, parts: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="tire $50, oil $30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setEditModal({ show: false, invoice: null })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.show && deleteModal.invoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Delete Invoice</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete invoice <strong>{deleteModal.invoice.invoiceNumber}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteModal({ show: false, invoice: null })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceInvoices;

