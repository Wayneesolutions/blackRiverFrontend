import { useState, useEffect } from "react";
import {
  FaTruck,
  FaRoute,
  FaShieldAlt,
  FaClipboardCheck,
  FaTicketAlt,
  FaExclamationTriangle,
  FaWrench,
  FaTrailer,
  FaSpinner,
} from "react-icons/fa";
import { FLEET_COLORS } from "../colorUtils";
import { getTruckProfile } from "../../../../axios/api/admin";
import { listFleetUnits } from "../../../../axios/api/fleet.units";

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


const sectionCardStyle = {
  borderColor: FLEET_COLORS.focusRing,
  boxShadow: `0 18px 35px ${FLEET_COLORS.focusRing}`,
};

const TruckProfile = () => {
  const [activeTab, setActiveTab] = useState<"truck" | "trailer">("truck");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"30d" | "60d" | "90d" | "all">("30d");
  const [units, setUnits] = useState<Array<{ unitNo: string; _id: string; unitType: string }>>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch units list when tab changes
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true);
        const category = activeTab === "truck" ? "trucks" : "trailers";
        const response = await listFleetUnits({ category });
        if (response?.success && response?.data) {
          const unitList = response.data.map((u: any) => ({
            unitNo: u.unitNo,
            _id: u._id,
            unitType: u.unitType
          }));
          setUnits(unitList);
          if (unitList.length > 0 && (!selectedUnit || !unitList.find((u: any) => u.unitNo === selectedUnit))) {
            setSelectedUnit(unitList[0].unitNo);
          }
        } else {
          setUnits([]);
        }
      } catch (error) {
        console.error("Error fetching units:", error);
        setUnits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [activeTab]);

  // Fetch profile when unit or timeFilter changes
  useEffect(() => {
    if (!selectedUnit) {
      setSelectedVehicle(null);
      return;
    }

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const unitType = activeTab === "truck" ? "Truck" : "trailer";
        const dateRange = timeFilter === "all" ? undefined : timeFilter;
        const response = await getTruckProfile(selectedUnit, dateRange, "all", unitType);
        if (response?.success && response?.data) {
          // Map API response to VehicleProfileData format
          const profileData: VehicleProfileData = {
            _id: response.data._id,
            unitNumber: response.data.unitNumber,
            licensePlate: response.data.licensePlate,
            vinNo: response.data.vinNo,
            make: response.data.make,
            model: response.data.model,
            makeModel: response.data.makeModel,
            year: response.data.year,
            status: response.data.status,
            operationStatus: response.data.operationStatus,
            currentOdometer: response.data.currentOdometer || 0,
            currentLocation: response.data.currentLocation || {},
            internalId: response.data.internalId,
            currentDriver: response.data.currentDriver || null,
            currentAssignment: response.data.currentAssignment || null,
            assignmentHistory: response.data.assignmentHistory || [],
            compliance: response.data.compliance || {
              cvsa: {
                lastInspection: "No inspections",
                result: "N/A",
                violations: [],
                officer: "N/A"
              },
              tickets: [],
              incidents: [],
              accidents: []
            },
            fleet: response.data.fleet || {
              serviceLogs: [],
              repairs: [],
              spareParts: []
            }
          };
          setSelectedVehicle(profileData);
        } else {
          setSelectedVehicle(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setSelectedVehicle(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [selectedUnit, activeTab, timeFilter]);

  // Use data directly from selectedVehicle (already filtered by backend based on timeFilter)
  const filteredData = selectedVehicle ? {
    serviceLogs: selectedVehicle.fleet.serviceLogs || [],
    repairs: selectedVehicle.fleet.repairs || [],
    tickets: selectedVehicle.compliance.tickets || [],
    incidents: selectedVehicle.compliance.incidents || [],
    accidents: selectedVehicle.compliance.accidents || [],
    assignmentHistory: selectedVehicle.assignmentHistory || []
  } : {
    serviceLogs: [],
    repairs: [],
    tickets: [],
    incidents: [],
    accidents: [],
    assignmentHistory: []
  };

  const totalServiceCost = filteredData.serviceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const totalRepairDowntime = filteredData.repairs.reduce((sum, repair) => sum + (repair.downtimeHours || 0), 0);
  const totalTickets = filteredData.tickets.length;
  const totalIncidents = filteredData.incidents.length + filteredData.accidents.length;

  // Loading state
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading {activeTab === "truck" ? "truck" : "trailer"} profile...</p>
        </div>
      </div>
    );
  }

  // No units available
  if (!selectedVehicle && units.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600 text-center py-12">No {activeTab === "truck" ? "trucks" : "trailers"} found.</p>
        </div>
      </div>
    );
  }

  // No selected vehicle
  if (!selectedVehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600 text-center py-12">No profile data available for selected unit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF8FF] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">

          {/* TOP ROW → LEFT (title) | RIGHT (filters) */}
          <div className="flex justify-between items-start">

            {/* LEFT SIDE → Title + Description */}
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-2xl shadow-lg"
                style={{ background: FLEET_COLORS.gradient }}
              >
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

            {/* RIGHT SIDE → Filters in a vertical stack */}
            <div className="flex flex-col gap-4 text-right pt-2">

              {/* SELECT TRUCK / TRAILER */}
              <div className="flex items-center gap-3 justify-end">
                <label className="font-semibold text-gray-700 whitespace-nowrap">
                  Select {activeTab === "truck" ? "Truck" : "Trailer"}:
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: FLEET_COLORS.focusRing }}
                >
                  {units.map((unit) => (
                    <option key={unit._id} value={unit.unitNo}>
                      {unit.unitNo}
                    </option>
                  ))}
                </select>
              </div>

              {/* TIME PERIOD */}
              <div className="flex items-center gap-3 justify-end">
                <label className="font-semibold text-gray-700 whitespace-nowrap">
                  Time Period:
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) =>
                    setTimeFilter(e.target.value as "30d" | "60d" | "90d" | "all")
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: FLEET_COLORS.focusRing }}
                >
                  <option value="30d">Last 30 Days</option>
                  <option value="60d">Last 60 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABS BELOW TITLE */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => {
                setActiveTab("truck");
                setSelectedUnit("");
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === "truck"
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
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === "trailer"
                  ? "!text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              style={activeTab === "trailer" ? { background: FLEET_COLORS.gradient } : {}}
            >
              <FaTrailer className="inline mr-2" />
              Trailer Profile
            </button>
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
          <div className="border border-gray-300 rounded-lg p-4">

              <div className="flex items-center justify-between mb-3">
                <FaClipboardCheck className="w-5 h-5 text-blue-500" />
                <span className={`px-2 py-1 text-xs font-semibold rounded ${selectedVehicle.compliance?.cvsa?.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                  {selectedVehicle.compliance?.cvsa?.result || "N/A"}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-700">Last CVSA Inspection</p>
              <p className="text-xs text-gray-500 mt-1">{selectedVehicle.compliance?.cvsa?.lastInspection || "N/A"}</p>
              <p className="text-xs text-gray-500">Officer: {selectedVehicle.compliance?.cvsa?.officer || "N/A"}</p>
              {selectedVehicle.compliance?.cvsa?.violations && selectedVehicle.compliance.cvsa.violations.length > 0 && (
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

            <div className="border border-gray-300 rounded-lg p-4">

              <div className="flex items-center gap-2 mb-3">
                <FaTicketAlt className="w-5 h-5 text-yellow-500" />
                <p className="text-sm font-semibold text-gray-700">Tickets</p>
                {timeFilter !== "all" && (
                  <span className="text-xs text-gray-500">({filteredData.tickets?.length || 0} in period)</span>
                )}
              </div>
              {filteredData.tickets && filteredData.tickets.length > 0 ? (
                <div className="space-y-2">
                  {filteredData.tickets.map((ticket) => (
                    <div key={ticket.id} className="text-xs">
                      <p className="font-medium text-gray-900">{ticket.category}</p>
                      <p className="text-gray-500">CA$ {ticket.amount} • {ticket.issued}</p>
                      <p className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${ticket.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Service Logs</h4>
                {timeFilter !== "all" && (
                  <span className="text-xs text-gray-500">({filteredData.serviceLogs.length} in period)</span>
                )}
              </div>
              <div className="space-y-2.5">
                {filteredData.serviceLogs.length > 0 ? (
                  filteredData.serviceLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-blue-500 bg-blue-50/30 rounded-lg p-3 hover:bg-blue-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{log.description}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{log.vendor} • {log.date}</p>
                        </div>
                        <p className="text-sm font-semibold text-blue-700 ml-3">CA$ {log.cost}</p>
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
              <div className="space-y-2.5">
                {filteredData.repairs.length > 0 ? (
                  filteredData.repairs.map((repair) => (
                    <div key={repair.id} className="border-l-4 border-orange-500 bg-orange-50/30 rounded-lg p-3 hover:bg-orange-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{repair.issue}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{repair.date}</p>
                        </div>
                        <p className="text-xs font-semibold text-orange-700 ml-3">{repair.downtimeHours}h</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{repair.resolution}</p>
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
            {selectedVehicle.fleet?.spareParts && selectedVehicle.fleet.spareParts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedVehicle.fleet.spareParts.map((part) => (
                  <div key={part.partNumber} className="border-l-4 border-purple-500 bg-purple-50/30 rounded-lg p-3 hover:bg-purple-50/50 transition-colors">
                    <p className="text-sm font-medium text-gray-900">{part.partName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{part.partNumber}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-600">Qty: {part.quantity}</p>
                      <p className="text-xs font-semibold text-purple-700">CA$ {part.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No spare parts usage found</p>
            )}
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
                <span className="text-sm text-gray-500">({filteredData.assignmentHistory?.length || 0} in period)</span>
              )}
            </div>

            <div className="space-y-3">
              {filteredData.assignmentHistory.map((assignment) => (
                <div key={assignment.id} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {assignment.loadNumber || assignment.tripNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        Driver: {assignment.driver.name} • {assignment.driver.phone}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${assignment.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
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

