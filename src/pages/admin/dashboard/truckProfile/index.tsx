import { useMemo, useState, useCallback } from "react";
import {
  FaTruck,
  FaGasPump,
  FaRoute,
  FaClock,
  FaShieldAlt,
  FaClipboardCheck,
  FaTicketAlt,
  FaExclamationTriangle,
  FaWrench,
  FaTools,
  FaBoxes,
} from "react-icons/fa";
import { FLEET_COLORS } from "../../fleetMaintenance/colorUtils";

type ComplianceSnapshot = {
  cvsa: {
    lastInspection: string;
    result: "Pass" | "Fail";
    violations: string[];
    officer: string;
  };
  tickets: Array<{
    id: string;
    issued: string;
    category: string;
    amount: number;
    status: "Paid" | "Open" | "Contested";
  }>;
  incidents: Array<{
    id: string;
    date: string;
    type: string;
    severity: "Low" | "Medium" | "High";
    resolution: string;
  }>;
};

type Assignment = {
  driver: string;
  started: string;
  ended?: string;
  notes?: string;
};

type TripSegment = {
  start: string;
  end: string;
  trips: number;
  miles: number;
  avgFuelMpg: number;
  avgLoadLbs: number;
  utilization: number;
  summary: string;
};

type FleetSnapshot = {
  vehicle: {
    makeModel: string;
    vin: string;
    plate: string;
    status: string;
    base: string;
    assignedDriver: string;
    odometer: number;
    lastTelematicsPing: string;
  };
  serviceLogs: Array<{
    id: string;
    date: string;
    vendor: string;
    description: string;
    cost: number;
  }>;
  repairs: Array<{
    id: string;
    date: string;
    issue: string;
    resolution: string;
    downtimeHours: number;
  }>;
  spareParts: Array<{
    part: string;
    quantity: number;
    cost: number;
    reference: string;
  }>;
  trips: {
    totalTrips: number;
    totalMiles: number;
    avgFuel: string;
    avgLoad: string;
    primaryLanes: string[];
    utilization: number;
  };
  tripHistory: TripSegment[];
  assignments: Assignment[];
};

type TruckProfileRecord = {
  unitNumber: string;
  compliance: ComplianceSnapshot;
  fleet: FleetSnapshot;
};

const TRUCK_PROFILES: Record<string, TruckProfileRecord> = {
  "TRK-204": {
    unitNumber: "TRK-204",
    compliance: {
      cvsa: {
        lastInspection: "2025-01-12 (Edmonton)",
        result: "Pass",
        violations: ["Minor brake adjustment noted", "Reflector replaced"],
        officer: "CVSA ID 43912",
      },
      tickets: [
        {
          id: "TCK-8821",
          issued: "2024-11-03",
          category: "Log book",
          amount: 320,
          status: "Paid",
        },
        {
          id: "TCK-8744",
          issued: "2024-08-29",
          category: "Equipment",
          amount: 185,
          status: "Paid",
        },
      ],
      incidents: [
        {
          id: "INC-332",
          date: "2024-09-18",
          type: "Minor yard collision",
          severity: "Low",
          resolution: "Closed – mirror replaced",
        },
      ],
    },
    fleet: {
      vehicle: {
        makeModel: "Freightliner Cascadia 126",
        vin: "1FUJGLDR2CL123456",
        plate: "BR-6295",
        status: "Active",
        base: "Edmonton HQ",
        assignedDriver: "Marcus Lee",
        odometer: 452130,
        lastTelematicsPing: "2025-01-26 16:42 MST",
      },
      serviceLogs: [
        {
          id: "SRV-9911",
          date: "2025-01-12",
          vendor: "North Ridge Mechanics",
          description: "PM-A inspection + brake adjustment",
          cost: 890,
        },
        {
          id: "SRV-9876",
          date: "2024-12-05",
          vendor: "Summit Diesel",
          description: "Aftertreatment DOC cleaning",
          cost: 560,
        },
      ],
      repairs: [
        {
          id: "REP-441",
          date: "2024-11-14",
          issue: "Coolant hose rupture",
          resolution: "Roadside repair + pressure test",
          downtimeHours: 6,
        },
        {
          id: "REP-399",
          date: "2024-10-02",
          issue: "Driver door latch sticking",
          resolution: "Latch assembly replaced",
          downtimeHours: 2,
        },
      ],
      spareParts: [
        {
          part: "Brake chamber kit",
          quantity: 2,
          cost: 320,
          reference: "SP-441",
        },
        {
          part: "DEF dosing nozzle",
          quantity: 1,
          cost: 265,
          reference: "SP-377",
        },
      ],
      trips: {
        totalTrips: 128,
        totalMiles: 612000,
        avgFuel: "6.7 mpg",
        avgLoad: "34,200 lb",
        primaryLanes: ["AB ↔ BC", "AB ↔ SK"],
        utilization: 92,
      },
      tripHistory: [
        {
          start: "2025-01-01",
          end: "2025-01-27",
          trips: 18,
          miles: 9200,
          avgFuelMpg: 6.8,
          avgLoadLbs: 34000,
          utilization: 93,
          summary: "Winter long-haul coverage",
        },
        {
          start: "2024-12-01",
          end: "2024-12-31",
          trips: 22,
          miles: 10400,
          avgFuelMpg: 6.6,
          avgLoadLbs: 34400,
          utilization: 90,
          summary: "Holiday surge lanes",
        },
      ],
      assignments: [
        {
          driver: "Marcus Lee",
          started: "2024-11-10",
          notes: "Primary linehaul operator",
        },
        {
          driver: "Randy Holmes",
          started: "2024-09-01",
          ended: "2024-11-09",
          notes: "Coverage during PM window",
        },
      ],
    },
  },
  "TRK-117": {
    unitNumber: "TRK-117",
    compliance: {
      cvsa: {
        lastInspection: "2025-01-09 (Regina)",
        result: "Pass",
        violations: ["Marker light replaced"],
        officer: "CVSA ID 50821",
      },
      tickets: [
        {
          id: "TCK-9102",
          issued: "2024-10-17",
          category: "Speed (5 mph over)",
          amount: 210,
          status: "Paid",
        },
      ],
      incidents: [
        {
          id: "INC-290",
          date: "2024-07-22",
          type: "Trailer tire blowout",
          severity: "Medium",
          resolution: "Closed – tire + rim replaced",
        },
      ],
    },
    fleet: {
      vehicle: {
        makeModel: "Kenworth T680",
        vin: "1XKYD49X0KJ284576",
        plate: "BR-5510",
        status: "Active",
        base: "Regina yard",
        assignedDriver: "Alicia Gomez",
        odometer: 389890,
        lastTelematicsPing: "2025-01-27 07:08 CST",
      },
      serviceLogs: [
        {
          id: "SRV-1002",
          date: "2025-01-18",
          vendor: "Prairie Mobile Mechanics",
          description: "Roadside repair – coolant hose + inspection",
          cost: 640,
        },
        {
          id: "SRV-992",
          date: "2025-01-23",
          vendor: "Prairie Mobile Mechanics",
          description: "Alignment follow-up + steering gear torque audit",
          cost: 430,
        },
      ],
      repairs: [
        {
          id: "REP-520",
          date: "2024-12-11",
          issue: "DPF differential pressure sensor",
          resolution: "Sensor replaced + forced regen",
          downtimeHours: 4,
        },
      ],
      spareParts: [
        {
          part: "Coolant hose kit",
          quantity: 1,
          cost: 210,
          reference: "SP-512",
        },
        {
          part: "Steering gear hardware kit",
          quantity: 1,
          cost: 142,
          reference: "SP-533",
        },
      ],
      trips: {
        totalTrips: 104,
        totalMiles: 488000,
        avgFuel: "6.4 mpg",
        avgLoad: "33,100 lb",
        primaryLanes: ["SK ↔ MB", "SK ↔ AB"],
        utilization: 88,
      },
      assignments: [
        {
          driver: "Alicia Gomez",
          started: "2024-10-15",
          notes: "Roadside response lead",
        },
        {
          driver: "Keisha Monroe",
          started: "2024-07-01",
          ended: "2024-10-14",
          notes: "Temporary coverage",
        },
      ],
    },
  },
};

const fleetUnits = Object.keys(TRUCK_PROFILES);

const sectionCardStyle = {
  borderColor: FLEET_COLORS.focusRing,
  boxShadow: `0 18px 35px ${FLEET_COLORS.focusRing}`,
};

const TruckProfile = () => {
  const [selectedUnit, setSelectedUnit] = useState(fleetUnits[0]);
  const [dateRange, setDateRange] = useState<"30d" | "60d" | "90d">("30d");
  const [driverFilter, setDriverFilter] = useState<"all" | string>("all");

  const currentProfile = useMemo(
    () => TRUCK_PROFILES[selectedUnit],
    [selectedUnit]
  );

  const { compliance, fleet } = currentProfile;

  return (
    <div
      className="min-h-screen p-6 bg-gray-50"
     
    >
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div
              className="p-3 rounded-2xl shadow-lg text-white"
              style={{
                background: FLEET_COLORS.gradient,
                boxShadow: `0 20px 40px ${FLEET_COLORS.focusRing}`,
              }}
            >
              <FaTruck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs tracking-wider text-black uppercase">
                Fleet Profile
              </p>
              <h1 className="text-4xl font-bold text-black">
                {currentProfile.unitNumber}
              </h1>
              <p className="text-sm text-black">
                Consolidated compliance + fleet health overview.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={selectedUnit}
              onChange={(event) => setSelectedUnit(event.target.value)}
              className="w-full md:w-48 rounded-2xl border-0 px-4 py-3 text-sm font-medium shadow-lg"
              style={{
                background: "#fff",
                color: FLEET_COLORS.dark,
                boxShadow: `0 15px 30px ${FLEET_COLORS.focusRing}`,
              }}
            >
              {fleetUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as "30d" | "60d" | "90d")}
              className="w-full md:w-48 rounded-2xl border-0 px-4 py-3 text-sm font-medium shadow-lg"
              style={{
                background: "#fff",
                color: FLEET_COLORS.dark,
                boxShadow: `0 15px 30px ${FLEET_COLORS.focusRing}`,
              }}
            >
              <option value="30d">Last 30 days</option>
              <option value="60d">Last 60 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <select
              value={driverFilter}
              onChange={(event) => setDriverFilter(event.target.value)}
              className="w-full md:w-48 rounded-2xl border-0 px-4 py-3 text-sm font-medium shadow-lg"
              style={{
                background: "#fff",
                color: FLEET_COLORS.dark,
                boxShadow: `0 15px 30px ${FLEET_COLORS.focusRing}`,
              }}
            >
              <option value="all">All drivers</option>
              {currentProfile.fleet.assignments?.map((assignment) => (
                <option key={`${assignment.driver}-${assignment.started}`} value={assignment.driver}>
                  {assignment.driver}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section
          className="rounded-2xl border bg-white p-6 grid grid-cols-1 gap-6 lg:grid-cols-4"
          style={sectionCardStyle}
        >
          <div className="lg:col-span-2 space-y-2">
            <p className="text-xs font-semibold uppercase text-gray-500">Vehicle</p>
            <h2 className="text-2xl font-bold text-gray-900">
              {fleet.vehicle.makeModel}
            </h2>
            <p className="text-sm text-gray-500">
              VIN {fleet.vehicle.vin} • Plate {fleet.vehicle.plate}
            </p>
            <p className="text-sm text-gray-500">
              Assigned Driver:{" "}
              <span className="font-semibold text-gray-800">
                {fleet.vehicle.assignedDriver}
              </span>{" "}
              • Base: {fleet.vehicle.base}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                {fleet.vehicle.status}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Last ping: {fleet.vehicle.lastTelematicsPing}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-2 sm:flex-row">
            <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Odometer
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {fleet.vehicle.odometer.toLocaleString()} km
              </p>
              <p className="text-xs text-gray-500">Last recorded via CAN bus</p>
            </div>
            <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Utilization
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {fleet.trips.utilization}%
              </p>
              <p className="text-xs text-gray-500">
                {fleet.trips.totalTrips} trips / {fleet.trips.totalMiles.toLocaleString()} miles
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaShieldAlt className="text-green-600" />
              CVSA Snapshot
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {compliance.cvsa.lastInspection}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Result:{" "}
              <span className="font-semibold text-green-700">{compliance.cvsa.result}</span>
            </p>
            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
              {compliance.cvsa.violations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mt-3">Officer {compliance.cvsa.officer}</p>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-3" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaTicketAlt className="text-amber-600" />
              Tickets
            </div>
            {compliance.tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span className="font-semibold">{ticket.category}</span>
                  <span className="text-gray-500">{ticket.status}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{ticket.issued}</span>
                  <span>${ticket.amount}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-3" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaExclamationTriangle className="text-red-500" />
              Incidents
            </div>
            {compliance.incidents.map((incident) => (
              <div key={incident.id} className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                <div className="flex justify-between font-semibold">
                  <span>{incident.type}</span>
                  <span className="text-gray-500">{incident.severity}</span>
                </div>
                <p className="text-gray-500">{incident.date}</p>
                <p className="text-gray-600 mt-1">{incident.resolution}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 space-y-4" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaClipboardCheck className="text-blue-600" />
              Service log with prices
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Vendor</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-left">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fleet.serviceLogs.map((service) => (
                    <tr key={service.id} className="text-gray-700">
                      <td className="px-3 py-2">{service.date}</td>
                      <td className="px-3 py-2">{service.vendor}</td>
                      <td className="px-3 py-2">{service.description}</td>
                      <td className="px-3 py-2 font-semibold">${service.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-4" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaWrench className="text-purple-600" />
              Issues & repairs
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Issue</th>
                    <th className="px-3 py-2 text-left">Resolution</th>
                    <th className="px-3 py-2 text-left">Downtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fleet.repairs.map((repair) => (
                    <tr key={repair.id} className="text-gray-700">
                      <td className="px-3 py-2">{repair.date}</td>
                      <td className="px-3 py-2">{repair.issue}</td>
                      <td className="px-3 py-2">{repair.resolution}</td>
                      <td className="px-3 py-2">{repair.downtimeHours} hrs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 space-y-4" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaBoxes className="text-indigo-600" />
              Spare parts usage
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Part</th>
                    <th className="px-3 py-2 text-left">Qty</th>
                    <th className="px-3 py-2 text-left">Cost</th>
                    <th className="px-3 py-2 text-left">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fleet.spareParts.map((part) => (
                    <tr key={`${part.reference}-${part.part}`} className="text-gray-700">
                      <td className="px-3 py-2 font-semibold">{part.part}</td>
                      <td className="px-3 py-2">{part.quantity}</td>
                      <td className="px-3 py-2">${part.cost}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{part.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-4" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaRoute className="text-green-600" />
              Trip & mileage stats
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Total trips</p>
                <p className="text-2xl font-bold text-gray-900">{fleet.trips.totalTrips}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Total miles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fleet.trips.totalMiles.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Avg fuel economy</p>
                <p className="text-2xl font-bold text-gray-900">{fleet.trips.avgFuel}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Avg load</p>
                <p className="text-2xl font-bold text-gray-900">{fleet.trips.avgLoad}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Primary lanes: {fleet.trips.primaryLanes.join(", ")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TruckProfile;

