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
// import { FLEET_COLORS } from "../colorUtils"; // Removing dependency on old colorUtils for new design
import { getTruckProfile } from "../../../../axios/api/admin";
import { listFleetUnits } from "../../../../axios/api/fleet.units";

// Helper Component for Stats
const StatCard = ({ title, value, subtitle, icon: Icon, bgColor, iconColor }: any) => (
  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-lg flex items-start justify-between">
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
  </div>
);

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
      <div className="min-h-screen bg-[#EDF8FF] p-6 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading {activeTab === "truck" ? "truck" : "trailer"} profile...</p>
        </div>
      </div>
    );
  }

  // No units available
  if (!selectedVehicle && units.length === 0) {
    return (
      <div className="min-h-screen bg-[#EDF8FF] p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="bg-white rounded-2xl p-10 shadow-lg inline-block">
            <FaExclamationTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No Units Found</h3>
            <p className="text-gray-500 mt-2">No {activeTab === "truck" ? "trucks" : "trailers"} are currently available in the system.</p>
          </div>
        </div>
      </div>
    );
  }

  // No selected vehicle
  if (!selectedVehicle) {
    return (
      <div className="min-h-screen bg-[#EDF8FF] p-6">
        <div className="max-w-7xl mx-auto text-center py-20">
          <div className="bg-white rounded-2xl p-10 shadow-lg inline-block">
            <FaExclamationTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No Profile Data</h3>
            <p className="text-gray-500 mt-2">No profile data available for the selected unit.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative max-w-7xl mx-auto">


        <div className="relative z-10 px-4 pt-6 pb-6">
          {/* Header & Filters Container */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            {/* Title Section */}
            <div>
              <div className="flex items-center gap-3 text-white mb-2">
                {activeTab === "truck" ? <FaTruck className="w-6 h-6 text-black" /> : <FaTrailer className="w-6 h-6 text-black" />}
                <h1 className="text-3xl font-bold text-black tracking-tight">{activeTab === "truck" ? "Truck Profile" : "Trailer Profile"}</h1>
              </div>
              <p className="text-black text-sm font-medium opacity-90 ml-9">
                Comprehensive analytics and maintenance history for {selectedVehicle.makeModel}
              </p>

              {/* Tab Switcher */}
              <div className="flex gap-2 mt-6 ml-1">
                <button
                  onClick={() => { setActiveTab("truck"); setSelectedUnit(""); }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "truck" ? "bg-white text-blue-600 shadow-md" : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                  Trucks
                </button>
                <button
                  onClick={() => { setActiveTab("trailer"); setSelectedUnit(""); }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "trailer" ? "bg-white text-blue-600 shadow-md" : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                >
                  Trailers
                </button>
              </div>

            </div>

            {/* Filters Section */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Select Unit</label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full sm:w-40 px-3 py-2 bg-white text-gray-800 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 border-none"
                >
                  {units.map((unit) => (
                    <option key={unit._id} value={unit.unitNo}>{unit.unitNo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Time Period</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="w-full sm:w-40 px-3 py-2 bg-white text-gray-800 text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 border-none"
                >
                  <option value="30d">Last 30 Days</option>
                  <option value="60d">Last 60 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Service Cost"
              value={`CA$ ${totalServiceCost.toLocaleString()}`}
              subtitle="Maintenance spend"
              icon={FaWrench}
              bgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Repair Downtime"
              value={`${totalRepairDowntime} hours`}
              subtitle="Total operational loss"
              icon={FaExclamationTriangle}
              bgColor="bg-orange-50"
              iconColor="text-orange-600"
            />
            <StatCard
              title="Tickets Issued"
              value={totalTickets}
              subtitle="Compliance violations"
              icon={FaTicketAlt}
              bgColor="bg-yellow-50"
              iconColor="text-yellow-600"
            />
            <StatCard
              title="Incidents & Accidents"
              value={totalIncidents}
              subtitle="Safety events reported"
              icon={FaShieldAlt}
              bgColor="bg-red-50"
              iconColor="text-red-600"
            />
          </div>


          {/* Vehicle Information Card */}
          <section className="rounded-xl border border-gray-100 shadow-lg bg-white p-6 grid grid-cols-1 gap-6 lg:grid-cols-4 mb-6 relative overflow-hidden">

            {/* Decorative side bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600"></div>

            <div className="lg:col-span-2 space-y-2">
              <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Vehicle Details</p>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{selectedVehicle.makeModel}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">{selectedVehicle.year}</span>
              </div>

              <p className="text-sm text-gray-500 font-medium">
                VIN: <span className="text-gray-800">{selectedVehicle.vinNo}</span> • Plate: <span className="text-gray-800">{selectedVehicle.licensePlate}</span>
              </p>
              {activeTab === "truck" && selectedVehicle.currentDriver && (
                <p className="text-sm text-gray-500 mt-2">
                  Driver: <span className="font-semibold text-blue-700">{selectedVehicle.currentDriver.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{selectedVehicle.currentDriver.phone}</span>
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-lg px-3 py-1 text-xs font-bold ${selectedVehicle.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {selectedVehicle.status}
                </span>
                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {selectedVehicle.operationStatus}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Odometer</p>
                <p className="text-xl font-bold text-gray-900 font-mono">
                  {activeTab === "truck" ? selectedVehicle.currentOdometer.toLocaleString() : "N/A"} <span className="text-sm text-gray-500 font-sans">{activeTab === "truck" ? "mi" : ""}</span>
                </p>
              </div>
              {selectedVehicle.currentLocation && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Location</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{selectedVehicle.currentLocation.address || "Unknown"}</p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-2">
              {selectedVehicle.currentAssignment && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Current Assignment</p>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-bold mb-1">
                      {selectedVehicle.currentAssignment.type === "load" ? "Load" : "Trip"}
                    </span>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedVehicle.currentAssignment.loadNumber || selectedVehicle.currentAssignment.tripNumber}
                    </p>
                  </div>
                </div>
              )}
              {!selectedVehicle.currentAssignment && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">Assignment</p>
                  <p className="text-sm font-medium text-gray-500 italic mt-1">Unassigned</p>
                </div>
              )}
            </div>
          </section>


          {/* Compliance Section */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <FaShieldAlt className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Compliance & Safety</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CVSA Card */}
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-200">

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <FaClipboardCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Last CVSA Inspection</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${selectedVehicle.compliance?.cvsa?.result === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                    {selectedVehicle.compliance?.cvsa?.result || "N/A"}
                  </span>
                </div>

                <div className="space-y-2 pl-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Date</span>
                    <span className="font-semibold text-gray-900">{selectedVehicle.compliance?.cvsa?.lastInspection || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Officer</span>
                    <span className="font-semibold text-gray-900">{selectedVehicle.compliance?.cvsa?.officer || "N/A"}</span>
                  </div>
                </div>

                {selectedVehicle.compliance?.cvsa?.violations && selectedVehicle.compliance.cvsa.violations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Violations Reported</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {selectedVehicle.compliance.cvsa.violations.map((v, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-400">•</span> {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tickets Card */}
              <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                      <FaTicketAlt className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Tickets</span>
                  </div>
                  {timeFilter !== "all" && (
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                      {filteredData.tickets?.length || 0} in period
                    </span>
                  )}
                </div>

                {filteredData.tickets && filteredData.tickets.length > 0 ? (
                  <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                    {filteredData.tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-gray-800">{ticket.category}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ticket.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            }`}>{ticket.status}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 mt-1">
                          <span>{ticket.issued}</span>
                          <span className="font-medium text-gray-900">CA$ {ticket.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <FaClipboardCheck className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs">No tickets recorded</p>
                  </div>
                )}
              </div>
            </div>
          </section>


          {/* Fleet Maintenance Section */}
          <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <FaWrench className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Fleet Maintenance</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Logs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-700">Service Logs</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filteredData.serviceLogs.length} Records</span>
                </div>
                <div className="space-y-3">
                  {filteredData.serviceLogs.length > 0 ? (
                    filteredData.serviceLogs.map((log) => (
                      <div key={log.id} className="group border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all bg-white">
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{log.description}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide">{log.vendor}</span>
                              <span>{log.date}</span>
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">CA$ {log.cost}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-xs text-gray-400">No service logs found in this period</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Repairs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-700">Repairs & Issues</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filteredData.repairs.length} Records</span>
                </div>
                <div className="space-y-3">
                  {filteredData.repairs.length > 0 ? (
                    filteredData.repairs.map((repair) => (
                      <div key={repair.id} className="group border border-gray-200 rounded-lg p-3 hover:border-orange-400 hover:shadow-sm transition-all bg-white">
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{repair.issue}</p>
                            <p className="text-xs text-gray-500 mt-1">{repair.date}</p>
                          </div>
                          <p className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{repair.downtimeHours}h Downtime</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-md">
                          <span className="font-semibold text-gray-700">Resolution:</span> {repair.resolution}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-xs text-gray-400">No repairs recorded in this period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-700 mb-4">Spare Parts Usage</h4>
              {selectedVehicle.fleet?.spareParts && selectedVehicle.fleet.spareParts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedVehicle.fleet.spareParts.map((part) => (
                    <div key={part.partNumber} className="border border-gray-200 bg-gray-50/50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{part.partName}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{part.partNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900">Qty: {part.quantity}</p>
                        <p className="text-xs font-medium text-gray-500">CA$ {part.cost}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No spare parts used.</p>
              )}
            </div>
          </section>

          {/* Assignment History */}
          {filteredData.assignmentHistory.length > 0 && (
            <section className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <FaRoute className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Assignment History</h3>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredData.assignmentHistory.length} assignments
                </span>
              </div>

              <div className="space-y-3">
                {filteredData.assignmentHistory.map((assignment) => (
                  <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${assignment.type === 'load' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {assignment.type === 'load' ? <FaTruck className="w-4 h-4" /> : <FaRoute className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {assignment.loadNumber || assignment.tripNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">{assignment.driver.name}</span> • {assignment.driver.phone}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 sm:mt-0 flex items-center gap-4">
                      {assignment.completedAt && (
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded inline-block">
                            Completed: {new Date(assignment.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      <span className={`px-3 py-1 text-xs font-bold rounded-lg ${assignment.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        }`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default TruckProfile;
