import { useMemo, useState } from "react";
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
} from "lucide-react";

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

const mechanicInvoices: MechanicInvoice[] = [
  {
    id: "1",
    serviceDate: "2025-01-12",
    unitNumber: "TRK-204",
    makeModel: "Freightliner Cascadia",
    vinOrPlate: "1FUJGLDR2CL123456",
    description: "DOT annual inspection with full brake adjustment",
    odometer: 452130,
    parts: [
      { name: "Brake chamber kit", cost: 320 },
      { name: "Rear slack adjuster", cost: 115 },
    ],
    notes: "Adjusted drive axle brakes, replaced offside slack adjuster, torqued undercarriage hardware.",
    serviceProvider: "North Ridge Mechanics",
    invoiceNumber: "INV-FM-2412",
    passedInspection: true,
    driver: "Marcus Lee",
    serviceCategory: "Annual Inspection",
    location: "Edmonton Hub",
  },
  {
    id: "2",
    serviceDate: "2025-01-18",
    unitNumber: "TRK-117",
    makeModel: "Kenworth T680",
    vinOrPlate: "1XKYD49X0KJ284576",
    description: "After-hours roadside repair for coolant hose + visual inspection",
    odometer: 389410,
    parts: [
      { name: "Coolant hose kit", cost: 210 },
      { name: "Extended-life coolant", cost: 96 },
    ],
    notes: "Roadside assist near Regina. Cooling system pressure test performed after hose install.",
    serviceProvider: "Prairie Mobile Mechanics",
    invoiceNumber: "INV-RR-1180",
    passedInspection: false,
    driver: "Alicia Gomez",
    serviceCategory: "Roadside Repair",
    location: "Regina Yard",
  },
  {
    id: "3",
    serviceDate: "2025-01-20",
    unitNumber: "DRV-44",
    makeModel: "Great Dane Dry Van",
    vinOrPlate: "2G1WS5E33B9173842",
    description: "Trailer ABS fault diagnosis, wheel-end inspection",
    odometer: 0,
    parts: [
      { name: "ABS sensor harness", cost: 180 },
      { name: "Hub seal", cost: 64 },
    ],
    notes: "Cleared fault codes after replacing harness. Documented hub seal seepage.",
    serviceProvider: "Metro Fleet Services",
    invoiceNumber: "INV-TLR-9034",
    passedInspection: true,
    driver: "Randy Holmes",
    serviceCategory: "Trailer Compliance",
    location: "Calgary Distribution",
  },
  {
    id: "4",
    serviceDate: "2025-01-21",
    unitNumber: "TRK-305",
    makeModel: "Volvo VNL 760",
    vinOrPlate: "4V4NC9EJ9GN938411",
    description: "Scheduled service – oil analysis, DEF dosing test",
    odometer: 512908,
    parts: [
      { name: "Oil analysis kit", cost: 48 },
      { name: "DEF dosing nozzle", cost: 265 },
    ],
    notes: "DEF spray pattern restored; suggested follow-up in 60 days.",
    serviceProvider: "Summit Mechanics",
    invoiceNumber: "INV-SRV-6612",
    passedInspection: true,
    driver: "Keisha Monroe",
    serviceCategory: "Scheduled Service",
    location: "Maintenance HQ",
  },
  {
    id: "5",
    serviceDate: "2025-01-23",
    unitNumber: "TRK-117",
    makeModel: "Kenworth T680",
    vinOrPlate: "1XKYD49X0KJ284576",
    description: "Alignment follow-up + steering gear torque audit",
    odometer: 389890,
    parts: [
      { name: "Steering gear hardware kit", cost: 142 },
    ],
    notes: "Documented slight cupping on steer tires; scheduled tire rotation.",
    serviceProvider: "Prairie Mobile Mechanics",
    invoiceNumber: "INV-FUP-1188",
    passedInspection: true,
    driver: "Alicia Gomez",
    serviceCategory: "Follow-up",
    location: "Regina Yard",
  },
  {
    id: "6",
    serviceDate: "2025-01-24",
    unitNumber: "TRK-412",
    makeModel: "Peterbilt 579",
    vinOrPlate: "1XPBDP9X3LD715820",
    description: "General repair – DPF bake, charge air leak test",
    odometer: 601245,
    parts: [
      { name: "DPF gaskets", cost: 78 },
      { name: "Charge air clamps", cost: 52 },
    ],
    notes: "DPF restored, no leaks detected. Marked for regulatory review due to repeated clog alerts.",
    serviceProvider: "Metro Fleet Services",
    invoiceNumber: "INV-GEN-7721",
    passedInspection: false,
    driver: "Noah Sanderson",
    serviceCategory: "General Repairs",
    location: "Calgary Distribution",
  },
];

const SERVICE_INTERVAL_KM = 7500;
const SERVICE_INTERVAL_DAYS = 30;
const CADENCE_REFERENCE_DATE = new Date("2025-01-30");

type FleetServiceRecord = {
  unitNumber: string;
  driver: string;
  servicePerformed: string;
  lastServiceDate: string;
  lastServiceOdometer: number;
  currentOdometer: number;
  maintenanceModule: string;
  summary: string;
};

const fleetServiceRecords: FleetServiceRecord[] = [
  {
    unitNumber: "TRK-204",
    driver: "Marcus Lee",
    servicePerformed: "PM-A Inspection + Brake Adjustment",
    lastServiceDate: "2025-01-04",
    lastServiceOdometer: 444900,
    currentOdometer: 452130,
    maintenanceModule: "Scheduled Services Log",
    summary: "Re-torqued drive axle hardware and verified brake travel readings.",
  },
  {
    unitNumber: "TRK-117",
    driver: "Alicia Gomez",
    servicePerformed: "Roadside Repair Follow-up",
    lastServiceDate: "2025-01-11",
    lastServiceOdometer: 383200,
    currentOdometer: 389890,
    maintenanceModule: "General Repairs Log",
    summary: "Cooling system pressure test + steering-gear torque audit.",
  },
  {
    unitNumber: "DRV-44",
    driver: "Randy Holmes",
    servicePerformed: "Trailer ABS Audit",
    lastServiceDate: "2025-01-15",
    lastServiceOdometer: 0,
    currentOdometer: 0,
    maintenanceModule: "Regulatory & Safety",
    summary: "Replaced ABS harness, cleared code history, documented hub seal seepage.",
  },
  {
    unitNumber: "TRK-412",
    driver: "Noah Sanderson",
    servicePerformed: "DPF Bake & Charge-Air Leak Test",
    lastServiceDate: "2025-01-09",
    lastServiceOdometer: 594700,
    currentOdometer: 601245,
    maintenanceModule: "Fleet Spare Parts",
    summary: "DPF reinstalled with new gaskets; spare clamps deducted from inventory.",
  },
];

const ComplianceInvoices = () => {
  const [truckFilter, setTruckFilter] = useState<string>("all");
  const [driverFilter, setDriverFilter] = useState<string>("all");
  const [mechanicFilter, setMechanicFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);

  const uniqueTrucks = useMemo(
    () => ["all", ...new Set(mechanicInvoices.map((invoice) => invoice.unitNumber))],
    []
  );
  const uniqueDrivers = useMemo(
    () => ["all", ...new Set(mechanicInvoices.map((invoice) => invoice.driver))],
    []
  );
  const uniqueMechanics = useMemo(
    () => ["all", ...new Set(mechanicInvoices.map((invoice) => invoice.serviceProvider))],
    []
  );

  const filteredInvoices = useMemo(() => {
    return mechanicInvoices.filter((invoice) => {
      const matchesTruck =
        truckFilter === "all" ? true : invoice.unitNumber === truckFilter;
      const matchesDriver =
        driverFilter === "all" ? true : invoice.driver === driverFilter;
      const matchesMechanic =
        mechanicFilter === "all" ? true : invoice.serviceProvider === mechanicFilter;
      const matchesSearch =
        searchTerm.trim().length === 0
          ? true
          : [
              invoice.invoiceNumber,
              invoice.unitNumber,
              invoice.makeModel,
              invoice.serviceProvider,
              invoice.description,
            ]
              .join(" ")
              .toLowerCase()
              .includes(searchTerm.toLowerCase());

      return matchesTruck && matchesDriver && matchesMechanic && matchesSearch;
    });
  }, [truckFilter, driverFilter, mechanicFilter, searchTerm]);

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

  const serviceReminders = useMemo(() => {
    return fleetServiceRecords.map((record) => {
      const kmSince = Math.max(record.currentOdometer - record.lastServiceOdometer, 0);
      const daysSince = Math.max(
        Math.round(
          (CADENCE_REFERENCE_DATE.getTime() - new Date(record.lastServiceDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        0
      );
      const mileageDue = kmSince >= SERVICE_INTERVAL_KM;
      const timeDue = daysSince >= SERVICE_INTERVAL_DAYS;
      const status = mileageDue || timeDue ? "due" : "ok";
      const mileageDetail = mileageDue
        ? `${(kmSince - SERVICE_INTERVAL_KM).toLocaleString()} km over`
        : `${(SERVICE_INTERVAL_KM - kmSince).toLocaleString()} km remaining`;
      const timeDetail = timeDue
        ? `${daysSince - SERVICE_INTERVAL_DAYS} days over`
        : `${SERVICE_INTERVAL_DAYS - daysSince} days remaining`;

      return {
        ...record,
        kmSince,
        daysSince,
        status,
        cadenceDetail: `${mileageDetail} • ${timeDetail}`,
      };
    });
  }, []);

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
          invoiceNumber: invoice.invoiceNumber,
          serviceDate: invoice.serviceDate,
          unitNumber: invoice.unitNumber,
          driver: invoice.driver,
          makeModel: invoice.makeModel,
          vinOrPlate: invoice.vinOrPlate,
          description: invoice.description,
          odometer: invoice.odometer || "N/A",
          parts: invoice.parts.map((part) => `${part.name} ($${part.cost})`).join(", "),
          serviceProvider: invoice.serviceProvider,
          location: invoice.location,
          passedInspection: invoice.passedInspection ? "Passed" : "Follow-up Required",
          notes: invoice.notes,
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
              <h1 className="text-3xl font-bold text-gray-900">Compliance Invoices</h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Static log of mechanic invoices tied to fleet compliance work.
              </p>
              <p className="text-xs text-gray-500">
                Service Provider identifies the mechanic responsible for the repairs.
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
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
          <table className="min-w-[1200px] divide-y divide-gray-100">
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
                  <td className="px-4 py-4 text-sm text-gray-900 font-semibold">
                    {new Date(invoice.serviceDate).toLocaleDateString()}
                    <div className="text-xs text-gray-500">{invoice.location}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="font-semibold">{invoice.unitNumber}</div>
                    <div className="text-xs text-gray-500">{invoice.makeModel}</div>
                    <div className="text-xs text-gray-400">{invoice.vinOrPlate}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {invoice.driver}
                    <div className="text-xs text-gray-500">{invoice.serviceCategory}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      {invoice.serviceProvider}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{invoice.location}</div>
                    <p className="text-xs text-gray-400">Mechanic of record captured in compliance module.</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{invoice.description}</div>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{invoice.notes}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="font-semibold">{invoice.serviceCategory}</div>
                    <div className="text-xs text-gray-500">{invoice.location}</div>
                    <p className="text-xs text-gray-400 mt-1">Captured via compliance visit log.</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {invoice.odometer ? `${invoice.odometer.toLocaleString()} km` : "N/A"}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {invoice.parts.map((part) => (
                        <span
                          key={`${invoice.id}-${part.name}`}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                        >
                          {part.name} (${part.cost})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    <div className="font-semibold">{invoice.location}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Logged after unit returned to yard and paperwork was uploaded.
                    </p>
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
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td className="px-4 py-16 text-center text-sm text-gray-500" colSpan={11}>
                    No invoices match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceInvoices;

