import { useMemo, useState, useEffect } from "react";
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
  FaSpinner,
} from "react-icons/fa";
import { FLEET_COLORS } from "../../fleetMaintenance/colorUtils";
import { getTruckProfile } from "../../../../axios/api/admin";
import { listFleetUnits } from "../../../../axios/api/fleet.units";



// Types for API response
type TruckProfileData = {
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
    updatedAt?: Date;
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
    assignedAt?: Date;
    startedAt?: Date;
    pickupDate?: Date;
    deliveryDate?: Date;
    customer?: string;
    route?: {
      pickup: string;
      dropoff: string;
    };
    actualStartDate?: Date;
    plannedStartDate?: Date;
    startLocation?: string;
    endLocation?: string;
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
    actualStartDate?: Date;
    actualEndDate?: Date;
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
  const [truckProfile, setTruckProfile] = useState<TruckProfileData | null>(null);
  const [trucks, setTrucks] = useState<Array<{ unitNo: string; _id: string }>>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"30d" | "60d" | "90d">("30d");
  const [driverFilter, setDriverFilter] = useState<"all" | string>("all");

  // Fetch all trucks on mount
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const response = await listFleetUnits({ category: "trucks" });
        if (response?.success && response?.data) {
          const truckList = response.data.map((t: any) => ({
            unitNo: t.unitNo,
            _id: t._id
          }));
          setTrucks(truckList);
          if (truckList.length > 0 && !selectedUnit) {
            setSelectedUnit(truckList[0].unitNo);
          }
        }
      } catch (error) {
        console.error("Error fetching trucks:", error);
      }
    };

    fetchTrucks();
  }, []);

  // Fetch truck profile when unit, dateRange, or driverFilter changes
  useEffect(() => {
    if (!selectedUnit) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await getTruckProfile(selectedUnit, dateRange, driverFilter);
        if (response?.success && response?.data) {
          setTruckProfile(response.data);
        } else {
          setTruckProfile(null);
        }
      } catch (error) {
        console.error("Error fetching truck profile:", error);
        setTruckProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [selectedUnit, dateRange, driverFilter]);

  // Assignment history is already filtered by backend, so use it directly
  const filteredAssignmentHistory = useMemo(() => {
    if (!truckProfile) return [];
    return truckProfile.assignmentHistory;
  }, [truckProfile]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading truck profile...</p>
        </div>
      </div>
    );
  }

  if (!truckProfile) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">No truck profile found.</p>
        </div>
      </div>
    );
  }

  const { compliance, fleet } = truckProfile;

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
                {truckProfile.unitNumber}
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
              {trucks.map((truck) => (
                <option key={truck._id} value={truck.unitNo}>
                  {truck.unitNo}
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
              {truckProfile && Array.from(new Set(truckProfile.assignmentHistory.map(a => a.driver.name))).map((driverName) => (
                <option key={driverName} value={driverName}>
                  {driverName}
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
              {truckProfile.makeModel}
            </h2>
            <p className="text-sm text-gray-500">
              VIN {truckProfile.vinNo} • Plate {truckProfile.licensePlate}
            </p>
            <p className="text-sm text-gray-500">
              {truckProfile.currentDriver ? (
                <>
              Assigned Driver:{" "}
              <span className="font-semibold text-gray-800">
                    {truckProfile.currentDriver.name}
                  </span>
                  {truckProfile.currentDriver.phone && (
                    <> • {truckProfile.currentDriver.phone}</>
                  )}
                </>
              ) : (
                <span className="text-gray-400">No driver assigned</span>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                {truckProfile.status}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {truckProfile.operationStatus}
              </span>
              {truckProfile.currentAssignment && (
                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                  {truckProfile.currentAssignment.type === 'load' ? 'Active Load' : 'Active Trip'}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-2 sm:flex-row">
            <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Odometer
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {truckProfile.currentOdometer.toLocaleString()} km
              </p>
              <p className="text-xs text-gray-500">Last recorded via CAN bus</p>
            </div>
            <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Utilization
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {truckProfile.currentAssignment ? 'Active' : 'Available'}
              </p>
              <p className="text-xs text-gray-500">
                {truckProfile.currentAssignment 
                  ? `${truckProfile.currentAssignment.type === 'load' ? 'Load' : 'Trip'}: ${truckProfile.currentAssignment.loadNumber || truckProfile.currentAssignment.tripNumber || 'N/A'}`
                  : 'No active assignment'}
              </p>
            </div>
          </div>
        </section>

        {/* Current Assignment Section */}
        {truckProfile.currentAssignment && (
          <section className="rounded-2xl border bg-white p-6" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
              <FaRoute className="text-blue-600" />
              Current Assignment
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {truckProfile.currentAssignment.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">
                  {truckProfile.currentAssignment.type === 'load' ? 'Load Number' : 'Trip Number'}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {truckProfile.currentAssignment.loadNumber || truckProfile.currentAssignment.tripNumber || 'N/A'}
                </p>
              </div>
              {truckProfile.currentAssignment.type === 'load' && truckProfile.currentAssignment.route && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Pickup</p>
                    <p className="text-sm font-medium text-gray-700">
                      {truckProfile.currentAssignment.route.pickup}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Dropoff</p>
                    <p className="text-sm font-medium text-gray-700">
                      {truckProfile.currentAssignment.route.dropoff}
                    </p>
                  </div>
                </>
              )}
              {truckProfile.currentAssignment.type === 'trip' && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Start Location</p>
                    <p className="text-sm font-medium text-gray-700">
                      {truckProfile.currentAssignment.startLocation || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">End Location</p>
                    <p className="text-sm font-medium text-gray-700">
                      {truckProfile.currentAssignment.endLocation || 'N/A'}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  truckProfile.currentAssignment.status === 'completed' || truckProfile.currentAssignment.status === 'delivered'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {truckProfile.currentAssignment.status}
                </span>
              </div>
              {truckProfile.currentAssignment.assignedAt && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Assigned At</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(truckProfile.currentAssignment.assignedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Assignment History Section */}
        <section className="rounded-2xl border bg-white p-6" style={sectionCardStyle}>
          <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
            <FaUser className="text-purple-600" />
            Assignment History
          </div>
          {filteredAssignmentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Driver</th>
                    <th className="px-3 py-2 text-left">Load/Trip #</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssignmentHistory.map((assignment) => (
                    <tr key={`${assignment.type}-${assignment.id}`} className="text-gray-700 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        {assignment.assignedAt 
                          ? new Date(assignment.assignedAt).toLocaleDateString()
                          : assignment.actualStartDate
                          ? new Date(assignment.actualStartDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-3 py-2">
                        <span className="capitalize">{assignment.type}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div>
                          <p className="font-semibold">{assignment.driver.name}</p>
                          {assignment.driver.phone && (
                            <p className="text-xs text-gray-500">{assignment.driver.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {assignment.loadNumber || assignment.tripNumber || 'N/A'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          assignment.status === 'completed' || assignment.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : assignment.status === 'in-progress' || assignment.status === 'in-delivery'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {assignment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No assignment history found.</p>
          )}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <span className={`font-semibold ${
                compliance.cvsa.result === 'Pass' ? 'text-green-700' : 
                compliance.cvsa.result === 'Fail' ? 'text-red-700' : 
                'text-amber-700'
              }`}>
                {compliance.cvsa.result}
              </span>
            </p>
            {compliance.cvsa.violations.length > 0 ? (
            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                {compliance.cvsa.violations.map((item, idx) => (
                  <li key={idx}>{item}</li>
              ))}
            </ul>
            ) : (
              <p className="text-xs text-gray-400">No violations</p>
            )}
            <p className="text-xs text-gray-400 mt-3">Officer {compliance.cvsa.officer}</p>
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-3" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaTicketAlt className="text-amber-600" />
              Tickets
            </div>
            {compliance.tickets.length > 0 ? (
              compliance.tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span className="font-semibold">{ticket.category}</span>
                    <span className={`${
                      ticket.status === 'Paid' ? 'text-green-600' : 
                      ticket.status === 'Contested' ? 'text-blue-600' : 
                      'text-red-600'
                    }`}>
                      {ticket.status}
                    </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>{ticket.issued}</span>
                  <span>${ticket.amount}</span>
                </div>
              </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No tickets</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-3" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaExclamationTriangle className="text-red-500" />
              Incidents
            </div>
            {compliance.incidents.length > 0 ? (
              compliance.incidents.map((incident) => (
              <div key={incident.id} className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                <div className="flex justify-between font-semibold">
                  <span>{incident.type}</span>
                    <span className={`${
                      incident.severity === 'Low' ? 'text-green-600' : 
                      incident.severity === 'Medium' ? 'text-amber-600' : 
                      'text-red-600'
                    }`}>
                      {incident.severity}
                    </span>
                </div>
                <p className="text-gray-500">{incident.date}</p>
                <p className="text-gray-600 mt-1">{incident.resolution}</p>
              </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No incidents</p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 space-y-3" style={sectionCardStyle}>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <FaExclamationTriangle className="text-orange-600" />
              Accidents
            </div>
            {compliance.accidents.length > 0 ? (
              compliance.accidents.map((accident) => (
                <div key={accident.id} className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  <div className="flex justify-between font-semibold">
                    <span>{accident.type}</span>
                    <span className={`${
                      accident.severity === 'Low' ? 'text-green-600' : 
                      accident.severity === 'Medium' ? 'text-amber-600' : 
                      'text-red-600'
                    }`}>
                      {accident.severity}
                    </span>
                  </div>
                  <p className="text-gray-500">{accident.date}</p>
                  <p className="text-gray-600 mt-1">{accident.resolution}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No accidents</p>
            )}
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
                  {fleet.serviceLogs.length > 0 ? (
                    fleet.serviceLogs.map((service) => (
                    <tr key={service.id} className="text-gray-700">
                      <td className="px-3 py-2">{service.date}</td>
                      <td className="px-3 py-2">{service.vendor}</td>
                      <td className="px-3 py-2">{service.description}</td>
                      <td className="px-3 py-2 font-semibold">${service.cost}</td>
                    </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                        No service logs found
                      </td>
                    </tr>
                  )}
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
                  {fleet.repairs.length > 0 ? (
                    fleet.repairs.map((repair) => (
                      <tr key={repair.id} className="text-gray-700">
                        <td className="px-3 py-2">{repair.date}</td>
                        <td className="px-3 py-2">{repair.issue}</td>
                        <td className="px-3 py-2">{repair.resolution}</td>
                        <td className="px-3 py-2">{repair.downtimeHours} hrs</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                        No repairs found
                      </td>
                    </tr>
                  )}
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
                  {fleet.spareParts.length > 0 ? (
                    fleet.spareParts.map((part) => (
                      <tr key={`${part.reference}-${part.partName}`} className="text-gray-700">
                        <td className="px-3 py-2 font-semibold">{part.partName}</td>
                        <td className="px-3 py-2">{part.quantity}</td>
                        <td className="px-3 py-2">${part.cost.toFixed(2)}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{part.reference}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                        No spare parts usage found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
};

export default TruckProfile;

