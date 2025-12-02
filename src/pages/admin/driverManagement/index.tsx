import { 
  Users, 
  FileText,
  UserPlus,
  FolderOpen,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../../../utils/auth';
import { 
  getHRDashboard
} from '../../../axios/api/driverDashboard';

interface HRDashboardStats {
  recentDriverActivity: {
    active: number;
    inactive: number;
  };
  pendingDocumentRenewals: number;
  totalEmployees: number;
  activeDrivers: number;
  totalLoads: number;
  newJoinersThisMonth: number;
}

// Minimal static fallback data
const STATIC_FALLBACK = {
  totalEmployees: 8,
  pendingDocumentRenewals: 3,
  newJoinersThisMonth: 2,
  documents: {
    pending: 3,
    total: 45
  },
  companyDocuments: {
    total: 12,
    expiringSoon: 2
  },
  attendance: {
    presentToday: 7,
    absentToday: 1
  },
  employeePortfolio: {
    completed: 6,
    inProgress: 2
  },
  issues: {
    open: 2,
    resolved: 15
  }
};

const index = () => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<HRDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch HR dashboard data
      const dashboardRes = await getHRDashboard();
      setDashboardStats(dashboardRes.success && dashboardRes.data ? dashboardRes.data : null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 bg-gray-50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getBasePath = () => {
    const role = getUserRole();
    return role === 'hr' ? '/Management' : '/admin/Management';
  };

  const basePath = getBasePath();

  return (
    <div className="space-y-6 bg-gray-50 p-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Employees */}
        <div 
          onClick={() => navigate(`${basePath}/employeelist`)}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardStats?.totalEmployees || STATIC_FALLBACK.totalEmployees}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Pending Document Renewals */}
        <div 
          onClick={() => navigate(`${basePath}/documents`)}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Document Renewals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardStats?.pendingDocumentRenewals || STATIC_FALLBACK.pendingDocumentRenewals}
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* New Joiners This Month */}
        <div 
          onClick={() => navigate(`${basePath}/employeelist`)}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">New Joiners This Month</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {dashboardStats?.newJoinersThisMonth || STATIC_FALLBACK.newJoinersThisMonth}
              </p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg">
              <UserPlus className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Documents */}
        <div 
          onClick={() => navigate(`${basePath}/documents`)}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-orange-50 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-lg font-bold text-gray-900">{STATIC_FALLBACK.documents.pending}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Documents</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>

        {/* Company Documents */}
        <div 
          onClick={() => navigate(`${basePath}/company-documents`)}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-50 p-2 rounded-lg">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-lg font-bold text-gray-900">{STATIC_FALLBACK.companyDocuments.total}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Company Docs</p>
          <p className="text-xs text-gray-500 mt-1">{STATIC_FALLBACK.companyDocuments.expiringSoon} expiring</p>
        </div>

        {/* Attendance */}
        <div 
          onClick={() => navigate(`${basePath}/attendence`)}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-50 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-lg font-bold text-green-600">{STATIC_FALLBACK.attendance.presentToday}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Attendance</p>
          <p className="text-xs text-gray-500 mt-1">Present today</p>
        </div>

        {/* Employee Portfolio */}
        <div 
          onClick={() => navigate(`${basePath}/employee-profiles`)}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-indigo-50 p-2 rounded-lg">
              <Briefcase className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-lg font-bold text-gray-900">{STATIC_FALLBACK.employeePortfolio.completed}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Portfolio</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>

        {/* Issues */}
        <div 
          onClick={() => navigate(`${basePath}/issues`)}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-red-50 p-2 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-lg font-bold text-red-600">{STATIC_FALLBACK.issues.open}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Issues</p>
          <p className="text-xs text-gray-500 mt-1">Open</p>
        </div>

        {/* Employees */}
        <div 
          onClick={() => navigate(`${basePath}/employeelist`)}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-50 p-2 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-lg font-bold text-gray-900">{dashboardStats?.totalEmployees || STATIC_FALLBACK.totalEmployees}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Employees</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
      </div>
    </div>
  )
}

export default index