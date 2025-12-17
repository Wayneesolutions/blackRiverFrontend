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
  documents: {
    pending: number;
  };
  companyDocuments: {
    total: number;
    expiringSoon: number;
  };
  attendance: {
    presentToday: number;
  };
  employeePortfolio: {
    completed: number;
  };
  issues: {
    open: number;
  };
}

const Index = () => {
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

  const getBasePath = () => {
    const role = getUserRole();
    return role === 'hr' ? '/Management' : '/admin/Management';
  };

  const basePath = getBasePath();

  const features = [
    {
      id: 'employees',
      title: 'Total Employees',
      value: dashboardStats?.totalEmployees ?? 0,
      subtitle: 'Active workforce',
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100'
    },
    {
      id: 'documents',
      title: 'Pending Renewals',
      value: dashboardStats?.pendingDocumentRenewals ?? 0,
      subtitle: 'Documents requiring attention',
      icon: FileText,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-700',
      cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100'
    },
    {
      id: 'joiners',
      title: 'New Joiners',
      value: dashboardStats?.newJoinersThisMonth ?? 0,
      subtitle: 'Added this month',
      icon: UserPlus,
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-700',
      cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100'
    },
    {
      id: 'attendance',
      title: 'Present Today',
      value: dashboardStats?.attendance?.presentToday ?? 0,
      subtitle: 'Current attendance',
      icon: Clock,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100'
    }
  ];

  const quickActions = [
    {
      id: 'documents',
      title: 'Documents',
      subtitle: 'Pending',
      value: dashboardStats?.documents?.pending ?? 0,
      icon: FileText,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-700',
      path: `${basePath}/documents`
    },
    {
      id: 'company-documents',
      title: 'Company Docs',
      subtitle: `${dashboardStats?.companyDocuments?.expiringSoon ?? 0} expiring`,
      value: dashboardStats?.companyDocuments?.total ?? 0,
      icon: FolderOpen,
      bgColor: 'bg-sky-100',
      iconColor: 'text-sky-700',
      path: `${basePath}/company-documents`
    },
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: 'Present today',
      value: dashboardStats?.attendance?.presentToday ?? 0,
      icon: Clock,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      path: `${basePath}/attendence`
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      subtitle: 'Completed',
      value: dashboardStats?.employeePortfolio?.completed ?? 0,
      icon: Briefcase,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-700',
      path: `${basePath}/employee-profiles`
    },
    {
      id: 'issues',
      title: 'Issues',
      subtitle: 'Open',
      value: dashboardStats?.issues?.open ?? 0,
      icon: AlertCircle,
      bgColor: 'bg-rose-100',
      iconColor: 'text-rose-700',
      path: `${basePath}/issues`
    },
    {
      id: 'all-employees',
      title: 'All Employees',
      subtitle: 'View List',
      value: dashboardStats?.totalEmployees ?? 0,
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      path: `${basePath}/employeelist`
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-4 bg-[#EDF8FF] px-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
     <div className="w-full mx-auto p-2 relative">
        {/* Gradient band */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            background: `linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)`,
            height: '101px'
          }}
          aria-hidden="true"
        />

        {/* Main content */}
        <div className="relative z-10 px-4 pt-3 pb-6">
          {/* Header Section */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">HR Management</h1>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-xs">Dashboard Overview</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 -mt-2 mb-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={() => {
                    if (feature.id === 'employees' || feature.id === 'joiners') {
                      navigate(`${basePath}/employeelist`);
                    } else if (feature.id === 'documents') {
                      navigate(`${basePath}/documents`);
                    } else if (feature.id === 'attendance') {
                      navigate(`${basePath}/attendence`);
                    }
                  }}
                  className={`${feature.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex items-start justify-between mb-2">
                    {/* Left side content */}
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        {feature.title}
                      </h3>

                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xl font-bold text-gray-900">{feature.value}</span>
                      </div>

                      <p className="text-xs text-gray-400">{feature.subtitle}</p>
                    </div>

                    {/* Right side icon */}
                    <div className={`${feature.bgColor} rounded-lg p-2 shadow-sm`}>
                      <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions & Overview</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className="group p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`${action.bgColor} group-hover:bg-white p-2 rounded-lg transition-colors`}>
                        <Icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <span className="text-lg font-bold text-gray-900 group-hover:text-blue-700">
                        {action.value}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-800">{action.title}</p>
                    <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600">{action.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;