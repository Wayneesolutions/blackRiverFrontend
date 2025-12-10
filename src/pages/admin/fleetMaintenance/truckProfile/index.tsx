import { useState, useEffect } from "react";
import {
  FaTruck,
  FaRoute,
  FaShieldAlt,
  FaClipboardCheck,
  FaTicketAlt,
  FaExclamationTriangle,
  FaWrench,
  FaBoxes,
  FaUser,
  FaTrailer,
} from "react-icons/fa";
import { FLEET_COLORS } from "../colorUtils";

// Static data types
type VehicleProfileData = {
  _id: string;
  unitNumber: string;
  licensePlate: string;
  vinNo: string;
  make: string;
  model: string;
  makeModel: string;
  year?: number;
  status: string;
  operationStatus: string;
  currentOdometer: number;
  currentLocation?: {
    address?: string;
    longitude?: string;
    latitude?: string;
  };
  internalId?: string;
  currentDriver?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  currentAssignment?: {
    type: 'load' | 'trip';
    id: string;
    loadNumber?: string;
    tripNumber?: string;
    status: string;
    customer?: string;
    route?: {
      pickup: string;
      dropoff: string;
    };
  } | null;
  assignmentHistory: Array<{
    type: 'load' | 'trip';
    id: string;
    loadNumber?: string;
    tripNumber?: string;
    driver: {
      _id: string;
      name: string;
      email: string;
      phone: string;
    };
    status: string;
    assignedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
  }>;
  compliance: {
    cvsa: {
      lastInspection: string;
      result: string;
      violations: string[];
      officer: string;
    };
    tickets: Array<{
      id: string;
      issued: string;
      category: string;
      amount: number;
      status: string;
    }>;
    incidents: Array<{
      id: string;
      date: string;
      type: string;
      severity: string;
      resolution: string;
    }>;
    accidents: Array<{
      id: string;
      date: string;
      type: string;
      severity: string;
      resolution: string;
    }>;
  };
  fleet: {
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
      partNumber: string;
      partName: string;
      description?: string;
      category?: string;
      quantity: number;
      cost: number;
      reference: string;
    }>;
  };
};

// Static data for trucks
const staticTrucks: VehicleProfileData[] = [
  {
    _id: "truck-001",
    unitNumber: "TRK-001",
    licensePlate: "ABC-1234",
    vinNo: "1HGBH41JXMN109186",
    make: "Freightliner",
    model: "Cascadia",
    makeModel: "Freightliner Cascadia",
    year: 2022,
    status: "Active",
    operationStatus: "In Service",
    currentOdometer: 125430,
    currentLocation: {
      address: "Toronto, ON",
      longitude: "-79.3832",
      latitude: "43.6532",
    },
    internalId: "INT-TRK-001",
    currentDriver: {
      _id: "driver-001",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1-555-0101",
    },
    currentAssignment: {
      type: "load",
      id: "load-001",
      loadNumber: "LD-2024-001",
      status: "In Transit",
      customer: "ABC Logistics",
      route: {
        pickup: "Toronto, ON",
        dropoff: "Montreal, QC",
      },
    },
    assignmentHistory: [
      {
        type: "load",
        id: "load-002",
        loadNumber: "LD-2024-002",
        driver: {
          _id: "driver-001",
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "+1-555-0101",
        },
        status: "Completed",
        assignedAt: new Date("2024-01-15"),
        startedAt: new Date("2024-01-15"),
        completedAt: new Date("2024-01-16"),
      },
    ],
    compliance: {
      cvsa: {
        lastInspection: "2024-01-10",
        result: "Pass",
        violations: [],
        officer: "Officer Johnson",
      },
      tickets: [
        {
          id: "ticket-001",
          issued: "2024-01-05",
          category: "Speeding",
          amount: 150,
          status: "Paid",
        },
      ],
      incidents: [],
      accidents: [],
    },
    fleet: {
      serviceLogs: [
        {
          id: "service-001",
          date: "2024-01-20",
          vendor: "Fleet Service Center",
          description: "Oil Change & Inspection",
          cost: 250,
        },
        {
          id: "service-002",
          date: "2023-12-15",
          vendor: "Fleet Service Center",
          description: "Tire Replacement",
          cost: 1200,
        },
      ],
      repairs: [
        {
          id: "repair-001",
          date: "2024-01-18",
          issue: "Brake System Malfunction",
          resolution: "Replaced brake pads and rotors",
          downtimeHours: 8,
        },
      ],
      spareParts: [
        {
          partNumber: "SP-001",
          partName: "Air Filter",
          description: "Heavy-duty air filter",
          category: "Filters",
          quantity: 2,
          cost: 45,
          reference: "REF-001",
        },
      ],
    },
  },
  {
    _id: "truck-002",
    unitNumber: "TRK-002",
    licensePlate: "XYZ-5678",
    vinNo: "1HGBH41JXMN109187",
    make: "Peterbilt",
    model: "579",
    makeModel: "Peterbilt 579",
    year: 2023,
    status: "Active",
    operationStatus: "In Service",
    currentOdometer: 89500,
    currentLocation: {
      address: "Vancouver, BC",
      longitude: "-123.1216",
      latitude: "49.2827",
    },
    internalId: "INT-TRK-002",
    currentDriver: {
      _id: "driver-002",
      name: "Jane Doe",
      email: "jane.doe@example.com",
      phone: "+1-555-0102",
    },
    currentAssignment: {
      type: "trip",
      id: "trip-001",
      tripNumber: "TR-2024-001",
      status: "Scheduled",
      customer: "XYZ Transport",
      route: {
        pickup: "Vancouver, BC",
        dropoff: "Calgary, AB",
      },
    },
    assignmentHistory: [],
    compliance: {
      cvsa: {
        lastInspection: "2024-01-12",
        result: "Pass",
        violations: [],
        officer: "Officer Williams",
      },
      tickets: [],
      incidents: [],
      accidents: [],
    },
    fleet: {
      serviceLogs: [
        {
          id: "service-003",
          date: "2024-01-15",
          vendor: "Fleet Service Center",
          description: "Regular Maintenance",
          cost: 350,
        },
      ],
      repairs: [],
      spareParts: [
        {
          partNumber: "SP-002",
          partName: "Oil Filter",
          description: "Premium oil filter",
          category: "Filters",
          quantity: 4,
          cost: 25,
          reference: "REF-002",
        },
      ],
    },
  },
];

// Static data for trailers
const staticTrailers: VehicleProfileData[] = [
  {
    _id: "trailer-001",
    unitNumber: "TRL-001",
    licensePlate: "TRL-1234",
    vinNo: "1HGBH41JXMN109200",
    make: "Great Dane",
    model: "Reefer",
    makeModel: "Great Dane Reefer",
    year: 2021,
    status: "Active",
    operationStatus: "In Service",
    currentOdometer: 0, // Trailers don't have odometers
    currentLocation: {
      address: "Toronto, ON",
      longitude: "-79.3832",
      latitude: "43.6532",
    },
    internalId: "INT-TRL-001",
    currentDriver: null,
    currentAssignment: {
      type: "load",
      id: "load-001",
      loadNumber: "LD-2024-001",
      status: "In Transit",
      customer: "ABC Logistics",
      route: {
        pickup: "Toronto, ON",
        dropoff: "Montreal, QC",
      },
    },
    assignmentHistory: [
      {
        type: "load",
        id: "load-003",
        loadNumber: "LD-2024-003",
        driver: {
          _id: "driver-001",
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "+1-555-0101",
        },
        status: "Completed",
        assignedAt: new Date("2024-01-10"),
        startedAt: new Date("2024-01-10"),
        completedAt: new Date("2024-01-11"),
      },
    ],
    compliance: {
      cvsa: {
        lastInspection: "2024-01-08",
        result: "Pass",
        violations: [],
        officer: "Officer Johnson",
      },
      tickets: [],
      incidents: [],
      accidents: [],
    },
    fleet: {
      serviceLogs: [
        {
          id: "service-004",
          date: "2024-01-18",
          vendor: "Trailer Service Center",
          description: "Refrigeration Unit Service",
          cost: 450,
        },
        {
          id: "service-005",
          date: "2023-12-20",
          vendor: "Trailer Service Center",
          description: "Brake System Inspection",
          cost: 180,
        },
      ],
      repairs: [
        {
          id: "repair-002",
          date: "2024-01-12",
          issue: "Refrigeration Unit Failure",
          resolution: "Replaced compressor unit",
          downtimeHours: 12,
        },
      ],
      spareParts: [
        {
          partNumber: "SP-003",
          partName: "Trailer Light",
          description: "LED tail light",
          category: "Lighting",
          quantity: 2,
          cost: 35,
          reference: "REF-003",
        },
      ],
    },
  },
  {
    _id: "trailer-002",
    unitNumber: "TRL-002",
    licensePlate: "TRL-5678",
    vinNo: "1HGBH41JXMN109201",
    make: "Utility",
    model: "Dry Van",
    makeModel: "Utility Dry Van",
    year: 2022,
    status: "Active",
    operationStatus: "In Service",
    currentOdometer: 0,
    currentLocation: {
      address: "Vancouver, BC",
      longitude: "-123.1216",
      latitude: "49.2827",
    },
    internalId: "INT-TRL-002",
    currentDriver: null,
    currentAssignment: {
      type: "trip",
      id: "trip-001",
      tripNumber: "TR-2024-001",
      status: "Scheduled",
      customer: "XYZ Transport",
      route: {
        pickup: "Vancouver, BC",
        dropoff: "Calgary, AB",
      },
    },
    assignmentHistory: [],
    compliance: {
      cvsa: {
        lastInspection: "2024-01-14",
        result: "Pass",
        violations: ["Minor tire wear"],
        officer: "Officer Williams",
      },
      tickets: [],
      incidents: [],
      accidents: [],
    },
    fleet: {
      serviceLogs: [
        {
          id: "service-006",
          date: "2024-01-16",
          vendor: "Trailer Service Center",
          description: "Annual Inspection",
          cost: 200,
        },
      ],
      repairs: [],
      spareParts: [
        {
          partNumber: "SP-004",
          partName: "Trailer Door Seal",
          description: "Weatherproof door seal",
          category: "Seals",
          quantity: 1,
          cost: 85,
          reference: "REF-004",
        },
      ],
    },
  },
];

const sectionCardStyle = {
  borderColor: FLEET_COLORS.focusRing,
  boxShadow: `0 18px 35px ${FLEET_COLORS.focusRing}`,
};

const TruckProfile = () => {
  const [activeTab, setActiveTab] = useState<"truck" | "trailer">("truck");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"30d" | "60d" | "90d" | "all">("30d");

  const currentData = activeTab === "truck" ? staticTrucks : staticTrailers;
  const selectedVehicle = currentData.find((v) => v.unitNumber === selectedUnit) || currentData[0];

  // Set default selected unit when tab or data changes
  useEffect(() => {
    if (currentData.length > 0 && (!selectedUnit || !currentData.find((v) => v.unitNumber === selectedUnit))) {
      setSelectedUnit(currentData[0].unitNumber);
    }
  }, [activeTab, currentData, selectedUnit]);

  // Filter data based on time filter
  const getFilteredData = () => {
    if (!selectedVehicle) return { 
      serviceLogs: [], 
      repairs: [], 
      tickets: [], 
      incidents: [], 
      accidents: [],
      assignmentHistory: []
    };
    
    const now = new Date();
    let cutoffDate: Date | null = null;
    
    if (timeFilter === "30d") {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === "60d") {
      cutoffDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === "90d") {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const filterByDate = (dateString: string | Date | undefined) => {
      if (!cutoffDate) return true;
      if (!dateString) return false;
      const itemDate = dateString instanceof Date ? dateString : new Date(dateString);
      return itemDate >= cutoffDate;
    };

    return {
      serviceLogs: cutoffDate 
        ? selectedVehicle.fleet.serviceLogs.filter(log => filterByDate(log.date))
        : selectedVehicle.fleet.serviceLogs,
      repairs: cutoffDate
        ? selectedVehicle.fleet.repairs.filter(repair => filterByDate(repair.date))
        : selectedVehicle.fleet.repairs,
      tickets: cutoffDate
        ? selectedVehicle.compliance.tickets.filter(ticket => filterByDate(ticket.issued))
        : selectedVehicle.compliance.tickets,
      incidents: cutoffDate
        ? selectedVehicle.compliance.incidents.filter(incident => filterByDate(incident.date))
        : selectedVehicle.compliance.incidents,
      accidents: cutoffDate
        ? selectedVehicle.compliance.accidents.filter(accident => filterByDate(accident.date))
        : selectedVehicle.compliance.accidents,
      assignmentHistory: cutoffDate
        ? selectedVehicle.assignmentHistory.filter(assignment => 
            filterByDate(assignment.assignedAt) || 
            filterByDate(assignment.startedAt) || 
            filterByDate(assignment.completedAt)
          )
        : selectedVehicle.assignmentHistory,
    };
  };

  const filteredData = getFilteredData();

  const totalServiceCost = filteredData.serviceLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalRepairDowntime = filteredData.repairs.reduce((sum, repair) => sum + repair.downtimeHours, 0);
  const totalTickets = filteredData.tickets.length;
  const totalIncidents = filteredData.incidents.length + filteredData.accidents.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg" style={{ background: FLEET_COLORS.gradient }}>
                {activeTab === "truck" ? (
                  <FaTruck className="w-8 h-8 text-white" />
                ) : (
                  <FaTrailer className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1
                  className="text-4xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: FLEET_COLORS.gradient }}
                >
                  {activeTab === "truck" ? "Truck Profile" : "Trailer Profile"}
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive {activeTab === "truck" ? "truck" : "trailer"} information and analytics
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setActiveTab("truck");
                setSelectedUnit("");
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "truck"
                  ? "!text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              style={activeTab === "truck" ? { background: FLEET_COLORS.gradient } : {}}
            >
              <FaTruck className="inline mr-2" />
              Truck Profile
            </button>
            <button
              onClick={() => {
                setActiveTab("trailer");
                setSelectedUnit("");
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === "trailer"
                  ? "!text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              style={activeTab === "trailer" ? { background: FLEET_COLORS.gradient } : {}}
            >
              <FaTrailer className="inline mr-2" />
              Trailer Profile
            </button>
          </div>

          {/* Unit Selector and Time Filter */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Select {activeTab === "truck" ? "Truck" : "Trailer"}:</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: FLEET_COLORS.focusRing }}
              >
                {currentData.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle.unitNumber}>
                    {vehicle.unitNumber} - {vehicle.makeModel}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Time Period:</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as "30d" | "60d" | "90d" | "all")}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: FLEET_COLORS.focusRing }}
              >
                <option value="30d">Last 30 Days</option>
                <option value="60d">Last 60 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </header>

        {/* Vehicle Information Card */}
        <section
          className="rounded-2xl border bg-white p-6 grid grid-cols-1 gap-6 lg:grid-cols-4 mb-6"
          style={sectionCardStyle}
        >
          <div className="lg:col-span-2 space-y-2">
            <p className="text-xs font-semibold uppercase text-gray-500">{activeTab === "truck" ? "Vehicle" : "Trailer"}</p>
            <h2 className="text-2xl font-bold text-gray-900">{selectedVehicle.makeModel}</h2>
            <p className="text-sm text-gray-500">
              VIN {selectedVehicle.vinNo} • Plate {selectedVehicle.licensePlate}
            </p>
            {activeTab === "truck" && selectedVehicle.currentDriver && (
              <p className="text-sm text-gray-500">
                Assigned Driver:{" "}
                <span className="font-semibold text-gray-800">{selectedVehicle.currentDriver.name}</span>
                {selectedVehicle.currentDriver.phone && <> • {selectedVehicle.currentDriver.phone}</>}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                {selectedVehicle.status}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {selectedVehicle.operationStatus}
              </span>
              {selectedVehicle.currentAssignment && (
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  {selectedVehicle.currentAssignment.type === "load" ? "Active Load" : "Active Trip"}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Odometer</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeTab === "truck" ? selectedVehicle.currentOdometer.toLocaleString() : "N/A"} {activeTab === "truck" ? "mi" : ""}
              </p>
            </div>
            {selectedVehicle.currentLocation && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Location</p>
                <p className="text-sm font-medium text-gray-900">{selectedVehicle.currentLocation.address}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Year</p>
              <p className="text-2xl font-bold text-gray-900">{selectedVehicle.year || "N/A"}</p>
            </div>
            {selectedVehicle.currentAssignment && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Current Assignment</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedVehicle.currentAssignment.loadNumber || selectedVehicle.currentAssignment.tripNumber}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border p-6" style={sectionCardStyle}>
            <div className="flex items-center justify-between mb-2">
              <FaWrench className="w-6 h-6" style={{ color: FLEET_COLORS.primary }} />
              <span className="text-2xl font-bold text-gray-900">{totalServiceCost}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Total Service Cost</p>
            <p className="text-xs text-gray-500 mt-1">CA$ {totalServiceCost.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl border p-6" style={sectionCardStyle}>
            <div className="flex items-center justify-between mb-2">
              <FaExclamationTriangle className="w-6 h-6 text-orange-500" />
              <span className="text-2xl font-bold text-gray-900">{totalRepairDowntime}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Repair Downtime</p>
            <p className="text-xs text-gray-500 mt-1">{totalRepairDowntime} hours</p>
          </div>

          <div className="bg-white rounded-xl border p-6" style={sectionCardStyle}>
            <div className="flex items-center justify-between mb-2">
              <FaTicketAlt className="w-6 h-6 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">{totalTickets}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Tickets</p>
            <p className="text-xs text-gray-500 mt-1">Total violations</p>
          </div>

          <div className="bg-white rounded-xl border p-6" style={sectionCardStyle}>
            <div className="flex items-center justify-between mb-2">
              <FaShieldAlt className="w-6 h-6 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">{totalIncidents}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Incidents & Accidents</p>
            <p className="text-xs text-gray-500 mt-1">Total reported</p>
          </div>
        </div>

        {/* Compliance Section */}
        <section className="bg-white rounded-xl border p-6 mb-6" style={sectionCardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <FaShieldAlt className="w-6 h-6" style={{ color: FLEET_COLORS.primary }} />
            <h3 className="text-xl font-bold text-gray-900">Compliance & Safety</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <FaClipboardCheck className="w-5 h-5 text-blue-500" />
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  selectedVehicle.compliance.cvsa.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {selectedVehicle.compliance.cvsa.result}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-700">Last CVSA Inspection</p>
              <p className="text-xs text-gray-500 mt-1">{selectedVehicle.compliance.cvsa.lastInspection}</p>
              <p className="text-xs text-gray-500">Officer: {selectedVehicle.compliance.cvsa.officer}</p>
              {selectedVehicle.compliance.cvsa.violations.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-red-600">Violations:</p>
                  <ul className="text-xs text-gray-600 list-disc list-inside">
                    {selectedVehicle.compliance.cvsa.violations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaTicketAlt className="w-5 h-5 text-yellow-500" />
                <p className="text-sm font-semibold text-gray-700">Tickets</p>
                {timeFilter !== "all" && (
                  <span className="text-xs text-gray-500">({filteredData.tickets.length} in period)</span>
                )}
              </div>
              {filteredData.tickets.length > 0 ? (
                <div className="space-y-2">
                  {filteredData.tickets.map((ticket) => (
                    <div key={ticket.id} className="text-xs">
                      <p className="font-medium text-gray-900">{ticket.category}</p>
                      <p className="text-gray-500">CA$ {ticket.amount} • {ticket.issued}</p>
                      <p className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${
                        ticket.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {ticket.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No tickets</p>
              )}
            </div>
          </div>
        </section>

        {/* Fleet Maintenance Section */}
        <section className="bg-white rounded-xl border p-6 mb-6" style={sectionCardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <FaWrench className="w-6 h-6" style={{ color: FLEET_COLORS.primary }} />
            <h3 className="text-xl font-bold text-gray-900">Fleet Maintenance</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Service Logs</h4>
                {timeFilter !== "all" && (
                  <span className="text-xs text-gray-500">({filteredData.serviceLogs.length} in period)</span>
                )}
              </div>
              <div className="space-y-3">
                {filteredData.serviceLogs.length > 0 ? (
                  filteredData.serviceLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.description}</p>
                        <p className="text-xs text-gray-500">{log.vendor} • {log.date}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">CA$ {log.cost}</p>
                    </div>
                  </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No service logs in selected period</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Repairs</h4>
                {timeFilter !== "all" && (
                  <span className="text-xs text-gray-500">({filteredData.repairs.length} in period)</span>
                )}
              </div>
              <div className="space-y-3">
                {filteredData.repairs.length > 0 ? (
                  filteredData.repairs.map((repair) => (
                    <div key={repair.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{repair.issue}</p>
                          <p className="text-xs text-gray-500">{repair.date}</p>
                        </div>
                        <p className="text-xs font-semibold text-orange-600">{repair.downtimeHours}h</p>
                      </div>
                      <p className="text-xs text-gray-600">{repair.resolution}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No repairs in selected period</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Spare Parts</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedVehicle.fleet.spareParts.map((part) => (
                <div key={part.partNumber} className="border rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{part.partName}</p>
                  <p className="text-xs text-gray-500">{part.partNumber}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600">Qty: {part.quantity}</p>
                    <p className="text-xs font-semibold text-gray-900">CA$ {part.cost}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Assignment History */}
        {filteredData.assignmentHistory.length > 0 && (
          <section className="bg-white rounded-xl border p-6" style={sectionCardStyle}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FaRoute className="w-6 h-6" style={{ color: FLEET_COLORS.primary }} />
                <h3 className="text-xl font-bold text-gray-900">Assignment History</h3>
              </div>
              {timeFilter !== "all" && (
                <span className="text-sm text-gray-500">({filteredData.assignmentHistory.length} in period)</span>
              )}
            </div>

            <div className="space-y-3">
              {filteredData.assignmentHistory.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.loadNumber || assignment.tripNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        Driver: {assignment.driver.name} • {assignment.driver.phone}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      assignment.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                  {assignment.completedAt && (
                    <p className="text-xs text-gray-500">
                      Completed: {assignment.completedAt.toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TruckProfile;

