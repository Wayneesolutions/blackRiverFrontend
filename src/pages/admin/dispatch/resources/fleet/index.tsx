import { useState, useEffect, useMemo, useCallback } from "react";
import { listFleetUnits } from "../../../../../axios/api/fleet.units";
import { listTrip, listOrder } from "../../../../../axios/api/distapcher";
import { Search } from "lucide-react";
import { FLEET_COLORS } from "../../../fleetMaintenance/colorUtils";

interface FleetUnit {
  _id?: string;
  unitNo?: string;
  unitType?: string;
  makeModel?: string;
  make?: string;
  model?: string;
  vinNo?: string;
  licensePlate?: string;
  year?: string | number;
  currentOdometer?: string | number;
  capacity?: string;
  status?: string;
  reason?: string;
  type?: string;
}

interface UnitAssignmentSummary {
  tripId: string;
  tripNumber?: string;
  driverName?: string;
  status?: string;
  route?: string;
  orders: number;
  plannedStartDate?: string;
}

interface UnitAssignmentInsight {
  activeTrips: UnitAssignmentSummary[];
  pastTrips: UnitAssignmentSummary[];
  pairedUnits: string[];
}

interface UnitLoadStats {
  totalLoads: number;
  pendingLoads: number;
}

const formatNumber = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric.toLocaleString();
};

const formatStatusBadge = (status?: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "active") {
    return "bg-green-50 text-green-700";
  }
  if (normalized === "inactive") {
    return "bg-red-50 text-red-600";
  }
  return "bg-gray-100 text-gray-600";
};

const normalizeAddress = (value: string) => value?.replace(/\s+/g, " ").trim() || "";

const extractLocationString = (location: any): string => {
  if (!location) return "";
  if (typeof location === "string") return normalizeAddress(location);
  if (typeof location !== "object") return "";
  if (location.place) return normalizeAddress(location.place);
  if (location.placeId) {
    const place = location.placeId;
    if (typeof place === "string") return normalizeAddress(place);
    if (place?.currentLocation?.address) return normalizeAddress(place.currentLocation.address);
    if (place?.name) return normalizeAddress(place.name);
  }
  if (location.currentLocation?.address) return normalizeAddress(location.currentLocation.address);
  if (location.address) return normalizeAddress(location.address);
  if (location.name) return normalizeAddress(location.name);
  return "";
};

const truncateText = (value: string, max: number = 40) => {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

const formatTripRoute = (trip: any) => {
  const order = Array.isArray(trip?.orders) && trip.orders.length > 0 ? trip.orders[0] : null;
  if (!order) return "Route pending";
  const pickup = normalizeAddress(extractLocationString(order.pickupLocation) || "Origin");
  const dropoff = normalizeAddress(extractLocationString(order.deliveryLocation) || "Destination");
  return `${truncateText(pickup)} → ${truncateText(dropoff)}`;
};

const normalizeKey = (type: "truck" | "trailer", value?: string | number | null) => {
  if (value === null || value === undefined) return null;
  return `${type}:${String(value).trim().toLowerCase()}`;
};

const buildUnitAssignments = (trips: any[]) => {
  const map: Record<string, UnitAssignmentInsight> = {};
  const ensure = (key: string) => {
    if (!map[key]) {
      map[key] = { activeTrips: [], pastTrips: [], pairedUnits: [] };
    }
    return map[key];
  };

  trips.forEach((trip) => {
    const summary: UnitAssignmentSummary = {
      tripId: trip._id,
      tripNumber: trip.tripNumber,
      driverName: trip.driver?.name,
      status: trip.status,
      route: formatTripRoute(trip),
      orders: Array.isArray(trip.orders) ? trip.orders.length : 0,
      plannedStartDate: trip.plannedStartDate
    };

    const truckIdentifiers = [
      normalizeKey("truck", trip.truck?._id),
      normalizeKey("truck", trip.truck?.unitNo),
      normalizeKey("truck", trip.truck?.internalId),
      normalizeKey("truck", trip.truck?.plateNumber)
    ].filter(Boolean) as string[];

    const trailerIdentifiers = [
      normalizeKey("trailer", trip.trailer?._id),
      normalizeKey("trailer", trip.trailer?.unitNo),
      normalizeKey("trailer", trip.trailer?.trailerNumber),
      normalizeKey("trailer", trip.trailer?.plateNumber)
    ].filter(Boolean) as string[];

    const trailerLabel = trip.trailer?.unitNo || trip.trailer?.trailerNumber || trip.trailer?.plateNumber;
    const truckLabel = trip.truck?.unitNo || trip.truck?.internalId || trip.truck?.plateNumber;

    truckIdentifiers.forEach((key) => {
      const store = ensure(key);
      if (trip.status === "completed" || trip.status === "cancelled") {
        store.pastTrips.push(summary);
      } else {
        store.activeTrips.push(summary);
      }
      if (trailerLabel && !store.pairedUnits.includes(trailerLabel)) {
        store.pairedUnits.push(trailerLabel);
      }
    });

    trailerIdentifiers.forEach((key) => {
      const store = ensure(key);
      if (trip.status === "completed" || trip.status === "cancelled") {
        store.pastTrips.push(summary);
      } else {
        store.activeTrips.push(summary);
      }
      if (truckLabel && !store.pairedUnits.includes(truckLabel)) {
        store.pairedUnits.push(truckLabel);
      }
    });
  });

  return map;
};

const buildUnitLoadStats = (orders: any[]) => {
  const map: Record<string, UnitLoadStats> = {};
  orders.forEach((order) => {
    const loadStatus = (order?.status || "").toLowerCase();
    const truckKeys = [
      normalizeKey("truck", order?.truckNo),
      normalizeKey("truck", order?.truckNumber),
      normalizeKey("truck", order?.truckId)
    ].filter(Boolean) as string[];
    const trailerKeys = [
      normalizeKey("trailer", order?.trailerNo),
      normalizeKey("trailer", order?.trailerNumber),
      normalizeKey("trailer", order?.trailerId)
    ].filter(Boolean) as string[];

    [...truckKeys, ...trailerKeys].forEach((key) => {
      if (!key) return;
      if (!map[key]) {
        map[key] = { totalLoads: 0, pendingLoads: 0 };
      }
      map[key].totalLoads += 1;
      if (loadStatus !== "completed") {
        map[key].pendingLoads += 1;
      }
    });
  });
  return map;
};

const getUnitIdentifiers = (unit: FleetUnit, type: "truck" | "trailer") => {
  return [
    normalizeKey(type, unit._id),
    normalizeKey(type, unit.unitNo),
    normalizeKey(type, unit.licensePlate),
    normalizeKey(type, unit.vinNo)
  ].filter(Boolean) as string[];
};


const Index = () => {
  const [fleetTab, setFleetTab] = useState<"trucks" | "trailers">("trucks");
  const [fleetUnitsLoading, setFleetUnitsLoading] = useState(false);
  const [fleetUnits, setFleetUnits] = useState<{ trucks: FleetUnit[]; trailers: FleetUnit[] }>({
    trucks: [],
    trailers: [],
  });
  const [fleetError, setFleetError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [unitAssignments, setUnitAssignments] = useState<Record<string, UnitAssignmentInsight>>({});
  const [unitLoadStats, setUnitLoadStats] = useState<Record<string, UnitLoadStats>>({});
  const [previewUnitId, setPreviewUnitId] = useState<string | null>(null);

  const loadFleetUnits = useCallback(async () => {
    try {
      setFleetUnitsLoading(true);
      setFleetError(null);
      const [truckRes, trailerRes] = await Promise.all([
        listFleetUnits({ category: "trucks" }),
        listFleetUnits({ category: "trailers" }),
      ]);

      const parseUnits = (res: any) => {
        if (!res?.success) return [];
        const payload = res.data ?? res.data?.data;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(res.data?.data)) return res.data.data;
        return res.data?.units || [];
      };

      setFleetUnits({
        trucks: parseUnits(truckRes),
        trailers: parseUnits(trailerRes),
      });
    } catch (error: any) {
      console.error("Error fetching fleet units:", error);
      setFleetError(error?.response?.data?.message || "Unable to load fleet units");
      setFleetUnits({ trucks: [], trailers: [] });
    } finally {
      setFleetUnitsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFleetUnits();
  }, [loadFleetUnits]);

  const fetchFleetInsights = useCallback(async () => {
    try {
      const [tripRes, orderRes] = await Promise.all([
        listTrip({ page: 1, limit: 500 }),
        listOrder({ page: 1, limit: 500 })
      ]);
      if (tripRes?.success && Array.isArray(tripRes.data)) {
        setUnitAssignments(buildUnitAssignments(tripRes.data));
      } else {
        setUnitAssignments({});
      }
      const orderPayload = Array.isArray(orderRes?.data)
        ? orderRes.data
        : Array.isArray(orderRes?.data?.data)
          ? orderRes.data.data
          : [];
      if (orderRes?.success && Array.isArray(orderPayload)) {
        setUnitLoadStats(buildUnitLoadStats(orderPayload));
      } else {
        setUnitLoadStats({});
      }
    } catch (error) {
      console.error("Error building fleet insights:", error);
      setUnitAssignments({});
      setUnitLoadStats({});
    }
  }, []);

  useEffect(() => {
    fetchFleetInsights();
  }, [fetchFleetInsights]);

  const visibleFleetUnits = useMemo(() => fleetUnits[fleetTab] || [], [fleetUnits, fleetTab]);

  const getAssignmentForUnit = useCallback(
    (unit: FleetUnit) => {
      const type = fleetTab === "trucks" ? "truck" : "trailer";
      const identifiers = getUnitIdentifiers(unit, type);
      for (const id of identifiers) {
        if (unitAssignments[id]) {
          return unitAssignments[id];
        }
      }
      return undefined;
    },
    [fleetTab, unitAssignments]
  );

  const getLoadStatsForUnit = useCallback(
    (unit: FleetUnit) => {
      const type = fleetTab === "trucks" ? "truck" : "trailer";
      const identifiers = getUnitIdentifiers(unit, type);
      for (const id of identifiers) {
        if (unitLoadStats[id]) {
          return unitLoadStats[id];
        }
      }
      return undefined;
    },
    [fleetTab, unitLoadStats]
  );

  const filteredUnits = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return visibleFleetUnits.filter((unit) => {
      const matchesSearch =
        !query ||
        [unit.unitNo, unit.licensePlate, unit.makeModel, unit.make, unit.model, unit.vinNo]
          .filter(Boolean)
          .some((value) => value!.toString().toLowerCase().includes(query));
      const matchesStatus =
        statusFilter === "all" || (unit.status || "").toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [visibleFleetUnits, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const total = visibleFleetUnits.length;
    const active = visibleFleetUnits.filter(
      (unit) => (unit.status || "").toLowerCase() === "active"
    ).length;
    const standby = total - active;
    return { total, active, standby };
  }, [visibleFleetUnits]);

  const assignmentSnapshot = useMemo(() => {
    let unitsWithActiveTrips = 0;
    let availableUnits = 0;
    visibleFleetUnits.forEach((unit) => {
      const type = fleetTab === "trucks" ? "truck" : "trailer";
      const identifiers = getUnitIdentifiers(unit, type);
      const assignment = identifiers
        .map((id) => unitAssignments[id])
        .find(Boolean);
      if (assignment?.activeTrips.length) {
        unitsWithActiveTrips += 1;
      } else {
        availableUnits += 1;
      }
    });
    return { unitsWithActiveTrips, availableUnits };
  }, [visibleFleetUnits, fleetTab, unitAssignments]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Dispatch Fleet</p>
            <h1 className="text-3xl font-bold text-gray-900">Fleet Units</h1>
            <p className="text-sm text-gray-500">
              View the same truck and trailer roster configured inside Fleet Maintenance.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1 w-fit">
            {(["trucks", "trailers"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setFleetTab(tab);
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-2xl transition-colors ${
                  fleetTab === tab ? "bg-white text-blue-600 shadow" : "text-gray-500"
                }`}
              >
                {tab === "trucks" ? "Trucks" : "Trailers"}
              </button>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl p-5 text-white shadow-lg" style={{ background: FLEET_COLORS.gradient }}>
            <p className="text-xs font-semibold uppercase text-white/80">Total Units</p>
            <p className="text-3xl font-bold mt-1">{summary.total}</p>
            <p className="text-xs text-white/80">
              {fleetTab === "trucks" ? "Primary power units" : "All trailers in pool"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Active</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{summary.active}</p>
            <p className="text-xs text-gray-500">Passing checks / ready for assignment</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Currently Dispatched</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{assignmentSnapshot.unitsWithActiveTrips}</p>
            <p className="text-xs text-gray-500">
              {assignmentSnapshot.availableUnits} available in pool
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 px-4 py-2 bg-gray-50">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={`Search ${fleetTab === "trucks" ? "trucks" : "trailers"} by unit #, VIN, plate…`}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Unit No.</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Type</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Make / Model</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">VIN</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">License Plate</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Year</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Odometer</th>
                    {fleetTab === "trailers" && (
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">Capacity</th>
                    )}
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Dispatch Snapshot</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {fleetUnitsLoading ? (
                    <tr>
                      <td
                        colSpan={fleetTab === "trailers" ? 11 : 10}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Loading fleet units…
                      </td>
                    </tr>
                  ) : fleetError ? (
                    <tr>
                      <td
                        colSpan={fleetTab === "trailers" ? 11 : 10}
                        className="px-6 py-8 text-center text-red-500"
                      >
                        {fleetError}
                      </td>
                    </tr>
                  ) : filteredUnits.length ? (
                    filteredUnits.map((unit, index) => {
                      const makeModel =
                        unit.makeModel ||
                        [unit.make, unit.model]
                          .filter(Boolean)
                          .join(" ")
                          .trim();
                      const previewKey =
                        unit._id ||
                        unit.unitNo ||
                        unit.licensePlate ||
                        unit.vinNo ||
                        unit.makeModel ||
                        `unit-${index}`;
                      return (
                        <tr key={previewKey}>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {unit.unitNo || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{unit.unitType || unit.type || "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{makeModel || "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{unit.vinNo || "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{unit.licensePlate || "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{unit.year || "—"}</td>
                          <td className="px-6 py-4 text-gray-600">{formatNumber(unit.currentOdometer)}</td>
                          {fleetTab === "trailers" && (
                            <td className="px-6 py-4 text-gray-600">{unit.capacity || "—"}</td>
                          )}
                          <td className="px-6 py-4 text-sm text-gray-600 align-top">
                            {(() => {
                              const assignment = getAssignmentForUnit(unit);
                              const loadStats = getLoadStatsForUnit(unit);
                              const activeTrip = assignment?.activeTrips[0];
                              return (
                                <div
                                  className="relative flex items-start gap-2"
                                  onMouseLeave={() => setPreviewUnitId((prev) => (prev === previewKey ? null : prev))}
                                >
                                  <button
                                    type="button"
                                    className={`mt-1 rounded-full border p-2 text-xs font-semibold uppercase ${
                                      activeTrip ? "text-blue-600 border-blue-200" : "text-gray-400 border-gray-200"
                                    }`}
                                    title={activeTrip ? "View assignment details" : "No active assignment"}
                                    onMouseEnter={() => setPreviewUnitId(previewKey)}
                                    onFocus={() => setPreviewUnitId(previewKey)}
                                    onClick={() => setPreviewUnitId((prev) => (prev === previewKey ? null : previewKey))}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke="currentColor"
                                      className="w-4 h-4"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M2.25 12s3-6.75 9.75-6.75S21.75 12 21.75 12s-3 6.75-9.75 6.75S2.25 12 2.25 12z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                  </button>
                                  <div className="space-y-1">
                                    <div className="font-semibold text-gray-900">
                                      {activeTrip?.route ? truncateText(activeTrip.route, 32) : "Available"}
                                    </div>
                                    {activeTrip ? (
                                      <div className="text-xs text-gray-500">
                                        #{activeTrip.tripNumber || "Trip"} · {activeTrip.orders} load{activeTrip.orders === 1 ? "" : "s"} · Driver{" "}
                                        {activeTrip.driverName || "TBD"}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-400">No active assignment</div>
                                    )}
                                    {assignment?.pairedUnits?.length ? (
                                      <div className="flex flex-wrap gap-1 pt-1">
                                        {assignment.pairedUnits.map((label) => (
                                          <span
                                            key={`${unit._id}-pair-${label}`}
                                            className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 font-semibold uppercase"
                                          >
                                            {fleetTab === "trucks" ? "Trailer" : "Truck"} {label}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null}
                                    {loadStats && (
                                      <div className="text-xs text-gray-500">
                                        {loadStats.pendingLoads}/{loadStats.totalLoads} loads pending
                                      </div>
                                    )}
                                  </div>
                                  {previewUnitId === previewKey && (
                                    <div className="absolute left-12 top-0 z-20 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                                      <p className="text-xs font-semibold text-gray-500">Dispatch preview</p>
                                      <p className="mt-1 text-sm font-semibold text-gray-900">
                                        {activeTrip?.route || "No active assignment"}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Trip #{activeTrip?.tripNumber || "—"} • Loads {activeTrip?.orders ?? 0}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Driver {activeTrip?.driverName || "Not assigned"}
                                      </p>
                                      {assignment?.pairedUnits?.length ? (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Paired: {assignment.pairedUnits.join(", ")}
                                        </p>
                                      ) : null}
                                      {loadStats && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {loadStats.pendingLoads}/{loadStats.totalLoads} loads pending
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${formatStatusBadge(
                                unit.status
                              )}`}
                            >
                              {unit.status || "Unknown"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{unit.reason || "—"}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={fleetTab === "trailers" ? 11 : 10}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No {fleetTab === "trucks" ? "truck" : "trailer"} units match your filters.
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

export default Index;
