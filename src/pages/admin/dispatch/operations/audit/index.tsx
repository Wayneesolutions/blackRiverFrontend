import { useState, useMemo, useEffect } from "react";
import {
  FaHistory,
  FaSearch,
  FaUser,
  FaTruck,
  FaRoute,
  FaEdit,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
} from "react-icons/fa";
import { getAuditTrail } from "../../../../../axios/api/distapcher";
import { Loader2 } from "lucide-react";

interface AuditTrailEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: "Order" | "Trip" | "Driver" | "Vehicle" | "Route" | "Customer" | "Document";
  entityId: string;
  entityName: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  details: string;
}

const AuditTrail = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [filterEntityType, setFilterEntityType] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditTrail();
  }, []);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      const response = await getAuditTrail();
      if (response.success && response.data) {
        // Map backend data to frontend format
        const mappedEntries: AuditTrailEntry[] = response.data.map((entry: any) => ({
          id: entry.id || entry._id || Math.random().toString(),
          timestamp: entry.timestamp,
          user: entry.user || 'Unknown',
          action: entry.action || 'Updated',
          entityType: entry.entityType || 'Order',
          entityId: entry.entityId || '',
          entityName: entry.entityName || '',
          changes: entry.changes || [],
          details: entry.details || ''
        }));
        setAuditTrail(mappedEntries);
      }
    } catch (error) {
      console.error("Error fetching audit trail:", error);
    } finally {
      setLoading(false);
    }
  };


  // Get unique users, entity types, and actions for filters
  const uniqueUsers = useMemo(() => {
    const users = new Set(auditTrail.map((entry) => entry.user));
    return Array.from(users).sort();
  }, [auditTrail]);

  const uniqueEntityTypes = useMemo(() => {
    const types = new Set(auditTrail.map((entry) => entry.entityType));
    return Array.from(types).sort();
  }, [auditTrail]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(auditTrail.map((entry) => entry.action));
    return Array.from(actions).sort();
  }, [auditTrail]);

  // Filter audit trail
  const filteredAuditTrail = useMemo(() => {
    return auditTrail.filter((entry) => {
      const matchesSearch =
        entry.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.details.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesUser = filterUser === "all" || entry.user === filterUser;
      const matchesEntityType = filterEntityType === "all" || entry.entityType === filterEntityType;
      const matchesAction = filterAction === "all" || entry.action === filterAction;

      // Date filter (simplified - you can enhance this)
      let matchesDate = true;
      if (dateFilter === "today") {
        const entryDate = new Date(entry.timestamp);
        const today = new Date();
        matchesDate =
          entryDate.getDate() === today.getDate() &&
          entryDate.getMonth() === today.getMonth() &&
          entryDate.getFullYear() === today.getFullYear();
      } else if (dateFilter === "week") {
        const entryDate = new Date(entry.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = entryDate >= weekAgo;
      } else if (dateFilter === "month") {
        const entryDate = new Date(entry.timestamp);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = entryDate >= monthAgo;
      }

      return matchesSearch && matchesUser && matchesEntityType && matchesAction && matchesDate;
    });
  }, [auditTrail, searchTerm, filterUser, filterEntityType, filterAction, dateFilter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "Created":
        return <FaPlus className="text-green-600" />;
      case "Updated":
        return <FaEdit className="text-blue-600" />;
      case "Deleted":
        return <FaTrash className="text-red-600" />;
      case "Assigned":
        return <FaCheckCircle className="text-purple-600" />;
      case "Uploaded":
        return <FaFileAlt className="text-orange-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "Order":
        return <FaFileAlt className="text-blue-500" />;
      case "Trip":
        return <FaRoute className="text-green-500" />;
      case "Driver":
        return <FaUser className="text-purple-500" />;
      case "Vehicle":
        return <FaTruck className="text-orange-500" />;
      case "Route":
        return <FaRoute className="text-indigo-500" />;
      case "Customer":
        return <FaUser className="text-teal-500" />;
      case "Document":
        return <FaFileAlt className="text-gray-500" />;
      default:
        return <FaFileAlt className="text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FaHistory className="text-2xl text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
          </div>
          <p className="text-gray-600">
            Track all changes made in the dispatch system. Monitor order modifications, assignments, and updates.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order, user, or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* User Filter */}
            <div>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {uniqueEntityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDateFilter("all")}
              className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter("today")}
              className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === "today"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateFilter("month")}
              className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredAuditTrail.length}</span> of{" "}
          <span className="font-semibold">{auditTrail.length}</span> audit trail entries
        </div>

        {/* Audit Trail List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Loader2 className="mx-auto w-8 h-8 animate-spin text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading audit trail...</h3>
              <p className="text-gray-500">Please wait while we fetch the audit trail entries.</p>
            </div>
          ) : filteredAuditTrail.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FaHistory className="mx-auto text-4xl text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No audit trail entries found</h3>
              <p className="text-gray-500">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            filteredAuditTrail.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getActionIcon(entry.action)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(entry.entityType)}
                        <div>
                          <h3 className="font-semibold text-gray-900">{entry.entityName}</h3>
                          <p className="text-sm text-gray-500">{entry.entityId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{formatTimestamp(entry.timestamp)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {entry.action}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {entry.entityType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{entry.details}</p>
                    </div>

                    {/* Changes */}
                    {entry.changes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Changes:</div>
                        <div className="space-y-1">
                          {entry.changes.map((change, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700">{change.field}:</span>
                              <span className="text-red-600 line-through">{change.oldValue}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-green-600 font-medium">{change.newValue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaUser className="text-gray-400" />
                        <span>Changed by: <span className="font-medium text-gray-900">{entry.user}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;

