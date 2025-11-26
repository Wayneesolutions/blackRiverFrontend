import { useState, useEffect, useMemo, useCallback } from "react";
import { listFleetUnits } from "../../../../../axios/api/fleet.units";
import { Search } from "lucide-react";

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

  const visibleFleetUnits = useMemo(() => fleetUnits[fleetTab] || [], [fleetUnits, fleetTab]);

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
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Total units</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{summary.total}</p>
            <p className="text-xs text-gray-500">
              {fleetTab === "trucks" ? "Primary power units" : "All trailers in pool"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{summary.active}</p>
            <p className="text-xs text-gray-500">Passing checks / ready for assignment</p>
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
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {fleetUnitsLoading ? (
                    <tr>
                      <td
                        colSpan={fleetTab === "trailers" ? 10 : 9}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Loading fleet units…
                      </td>
                    </tr>
                  ) : fleetError ? (
                    <tr>
                      <td
                        colSpan={fleetTab === "trailers" ? 10 : 9}
                        className="px-6 py-8 text-center text-red-500"
                      >
                        {fleetError}
                      </td>
                    </tr>
                  ) : filteredUnits.length ? (
                    filteredUnits.map((unit) => {
                      const makeModel =
                        unit.makeModel ||
                        [unit.make, unit.model]
                          .filter(Boolean)
                          .join(" ")
                          .trim();
                      return (
                        <tr key={unit._id || unit.unitNo}>
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
                        colSpan={fleetTab === "trailers" ? 10 : 9}
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
