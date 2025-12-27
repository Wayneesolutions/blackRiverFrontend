import { useState } from "react";
import { User, Calendar, Phone, Mail, Search, ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserRole } from "../../../../../utils/auth";

// Static data for drivers on leave
const staticDriversOnLeave = [
  {
    id: "DRV001",
    name: "John Doe",
    employeeCode: "EMP001",
    email: "john.doe@example.com",
    phone: "+1 (204) 555-0101",
    leaveStartDate: "2024-01-10",
    leaveEndDate: "2024-01-20",
    leaveType: "Vacation",
    status: "On Leave",
    daysRemaining: 5,
  },
  {
    id: "DRV002",
    name: "Jane Smith",
    employeeCode: "EMP002",
    email: "jane.smith@example.com",
    phone: "+1 (403) 555-0102",
    leaveStartDate: "2024-01-12",
    leaveEndDate: "2024-01-18",
    leaveType: "Sick Leave",
    status: "On Leave",
    daysRemaining: 3,
  },
  {
    id: "DRV003",
    name: "Bob Johnson",
    employeeCode: "EMP003",
    email: "bob.johnson@example.com",
    phone: "+1 (416) 555-0103",
    leaveStartDate: "2024-01-15",
    leaveEndDate: "2024-01-25",
    leaveType: "Personal Leave",
    status: "On Leave",
    daysRemaining: 10,
  },
  {
    id: "DRV004",
    name: "Alice Williams",
    employeeCode: "EMP004",
    email: "alice.williams@example.com",
    phone: "+1 (780) 555-0104",
    leaveStartDate: "2024-01-14",
    leaveEndDate: "2024-01-21",
    leaveType: "Vacation",
    status: "On Leave",
    daysRemaining: 7,
  },
  {
    id: "DRV005",
    name: "Mike Brown",
    employeeCode: "EMP005",
    email: "mike.brown@example.com",
    phone: "+1 (604) 555-0105",
    leaveStartDate: "2024-01-16",
    leaveEndDate: "2024-01-22",
    leaveType: "Emergency Leave",
    status: "On Leave",
    daysRemaining: 6,
  },
];

const DriversOnLeavePage = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const isDispatcher = userRole === 'dispatcher';
  const basePath = isDispatcher ? '/dispatch' : '/admin/dispatch';

  const [searchTerm, setSearchTerm] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");

  const filteredDrivers = staticDriversOnLeave.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm);

    const matchesLeaveType = leaveTypeFilter === "all" || driver.leaveType === leaveTypeFilter;

    return matchesSearch && matchesLeaveType;
  });

  const getLeaveTypeBadge = (leaveType: string) => {
    const typeLower = leaveType.toLowerCase();
    if (typeLower.includes("vacation")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {leaveType}
        </span>
      );
    }
    if (typeLower.includes("sick")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {leaveType}
        </span>
      );
    }
    if (typeLower.includes("emergency")) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          {leaveType}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {leaveType}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative w-full mx-auto">
      

        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
           
                <h1 className="text-xl font-bold text-black">Drivers on Leave</h1>
              </div>
              <div className="text-black/90 text-sm">
                Total: {staticDriversOnLeave.length} drivers
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-4 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                />
              </div>
              <div className="md:w-48">
                <select
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                >
                  <option value="all">All Leave Types</option>
                  <option value="Vacation">Vacation</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Personal Leave">Personal Leave</option>
                  <option value="Emergency Leave">Emergency Leave</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drivers Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Driver Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Employee Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Leave Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Days Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No drivers on leave found
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                              <div className="text-xs text-gray-500">ID: {driver.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.employeeCode}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <Mail className="w-3 h-3 mr-1 text-gray-400" />
                              {driver.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-gray-400" />
                              {driver.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            <div>
                              <div>{formatDate(driver.leaveStartDate)}</div>
                              <div className="text-xs text-gray-500">to {formatDate(driver.leaveEndDate)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getLeaveTypeBadge(driver.leaveType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm font-medium text-orange-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {calculateDaysRemaining(driver.leaveEndDate)} days
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {driver.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriversOnLeavePage;

