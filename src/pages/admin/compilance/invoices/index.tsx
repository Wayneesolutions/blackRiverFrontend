import { useMemo, useState, useEffect } from "react";
import ExcelJS from "exceljs";
import {
  Download,
  Filter,
  Search,
} from "lucide-react";
import { FaFileInvoiceDollar, FaClipboardList, FaTools } from "react-icons/fa";
import { getComplianceInvoices } from "../../../../axios/api/admin";

const StatCard = ({ title, value, subtitle, icon: Icon, bgColor, iconColor }: any) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
  </div>
);

type MechanicInvoice = {
  id: string;
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
        console.error('Error fetching fleet invoices:', error);
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
        (invoice.parts || []).reduce((partsSum, part) => partsSum + (Number(part.cost) || 0), 0)
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
      const worksheet = workbook.addWorksheet("Fleet Invoices");

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
      link.download = `Fleet_Invoices_${new Date()
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

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative max-w-7xl mx-auto">

        <div className="relative z-10 px-4 pt-3 pb-6">
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-black">Fleet Invoices</h1>
                <div className="flex items-center gap-2 text-black/90">
                  <span className="text-xs">Manage maintenance invoices</span>
                </div>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#0ea3d8] rounded-lg hover:bg-white/90 shadow-sm transition-all font-bold text-sm"
              >
                <Download className="w-4 h-4" />
                {exporting ? "Exporting..." : "Export to Excel"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 -mt-2 mb-4">
            <StatCard title="Total Invoices" value={summary.total} subtitle="All time" icon={FaClipboardList} bgColor="bg-blue-50" iconColor="text-blue-600" />
            <StatCard title="Total Parts Spend" value={`$${summary.totalPartsSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Parts & Materials" icon={FaFileInvoiceDollar} bgColor="bg-green-50" iconColor="text-green-600" />
            <StatCard title="Follow-up Required" value={summary.followUps} subtitle="Pending inspections" icon={FaTools} bgColor="bg-orange-50" iconColor="text-orange-600" />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-2 text-gray-700 font-semibold mb-3 text-sm">
              <Filter className="w-4 h-4 text-blue-600" />
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  Mechanics
                </label>
                <select
                  value={mechanicFilter}
                  onChange={(event) => setMechanicFilter(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <div className="mt-1 flex items-center rounded-lg border border-gray-200 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Invoice #, Unit, Mechanic..."
                    className="ml-2 w-full border-none text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              <button
                onClick={resetFilters}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Service Date",
                      "Unit",
                      "Driver",
                      "Service Provider",
                      "Description",
                      "Service Performed",
                      "Odometer",
                      "Parts",
                      "Invoice #",
                      "Location / Notes",
                      "Passed",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-2 text-xs font-semibold text-gray-900">
                        {invoice.serviceDate ? new Date(invoice.serviceDate).toLocaleDateString() : 'N/A'}
                        <div className="text-[10px] text-gray-500">{invoice.location}</div>
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-900">
                        <div className="font-semibold">{invoice.unitNumber}</div>
                        <div className="text-[10px] text-gray-500">{invoice.makeModel}</div>
                        <div className="text-[10px] text-gray-400">{invoice.vinOrPlate}</div>
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-900">
                        {invoice.driver}
                        <div className="text-[10px] text-gray-500">{invoice.serviceCategory}</div>
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-900">
                        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {invoice.serviceProvider}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{invoice.location}</div>
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-700">
                        <div className="font-medium text-gray-900">{invoice.description}</div>
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-900">
                        <div className="font-semibold">{invoice.serviceCategory}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Captured via fleet log</div>
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-900">
                        {invoice.odometer ? `${invoice.odometer.toLocaleString()} km` : "N/A"}
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-900">
                        {invoice.parts && invoice.parts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {invoice.parts.map((part, idx) => (
                              <span
                                key={`${invoice.id}-${part.name || idx}`}
                                className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700"
                              >
                                {part.name || 'Part'} ${(Number(part.cost) || 0).toFixed(2)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[10px]">No parts listed</span>
                        )}
                      </td>
                      <td className="px-6 py-2 text-xs font-semibold text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-2 text-xs text-gray-900">
                        <div className="font-semibold">{invoice.location}</div>
                      </td>
                      <td className="px-6 py-2 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${invoice.passedInspection
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {invoice.passedInspection ? "Passed" : "Follow-up"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {loading && (
                    <tr>
                      <td className="px-6 py-8 text-center text-xs text-gray-500" colSpan={11}>
                        Loading invoices...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredInvoices.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-xs text-gray-500" colSpan={11}>
                        No invoices found. {total > 0 ? 'Try adjusting your filters.' : 'No invoices have been created yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 rounded-b-lg shadow-sm">
              <div className="text-xs text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} invoices
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-xs font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceInvoices;
