import {
  Users,
  FileText,
  FolderOpen,
  Clock,
  Briefcase,
  AlertCircle,
  Truck,
  MapPin,
  Calendar,
  Gift,
  Award,
  UserCheck,
  UsersRound
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../../../utils/auth';
import {
  getHRDashboard
} from '../../../axios/api/driverDashboard';

interface UpcomingBirthday {
  name: string;
  birthday: string;
  daysUntil?: number;
  role?: string;
}

interface UpcomingAnniversary {
  name: string;
  anniversaryDate: string;
  yearsOfService: number;
  daysUntil?: number;
  role?: string;
}

interface DocumentExpiry {
  documentType: string;
  employeeOrDriverName: string;
  expiryDate: string;
  daysUntilExpiry?: number;
  role?: string;
}

interface HRDashboardStats {
  recentDriverActivity: {
    active: number;
    inactive: number;
  };
  pendingDocumentRenewals: number;
  totalDrivers: number;
  totalEmployees: number;
  totalOfficeEmployees: number;
  activeDrivers: number;
  soloDrivers: number;
  teamDrivers: number;
  totalLoads: number;
  newJoinersThisMonth: number;
  newEmployeesThisMonth: number;
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
  usBasedDrivers: number;
  canadaBasedDrivers: number;
  upcomingBirthdays: UpcomingBirthday[];
  upcomingWorkAnniversaries: UpcomingAnniversary[];
  documentExpiryTracking: DocumentExpiry[];
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
      setDashboardStats(null);
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
      id: 'total-drivers',
      title: 'Total Drivers',
      value: dashboardStats?.totalDrivers ?? 0,
      subtitle: `${dashboardStats?.recentDriverActivity?.active ?? 0} active, ${dashboardStats?.recentDriverActivity?.inactive ?? 0} inactive`,
      icon: Truck,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-700',
      cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      path: `${basePath}/drivers`
    },
    {
      id: 'employees',
      title: 'Total Employees',
      value: dashboardStats?.totalEmployees ?? 0,
      subtitle: 'Active workforce',
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700',
      cardBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      path: `${basePath}/employeelist`
    },
    {
      id: 'us-drivers',
      title: 'US-based Drivers',
      value: dashboardStats?.usBasedDrivers ?? 0,
      subtitle: 'United States based',
      icon: MapPin,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-700',
      cardBg: 'bg-gradient-to-br from-red-50 to-red-100',
      path: `${basePath}/drivers`
    },
    {
      id: 'canada-drivers',
      title: 'Canada-based Drivers',
      value: dashboardStats?.canadaBasedDrivers ?? 0,
      subtitle: 'Canada based',
      icon: MapPin,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-700',
      cardBg: 'bg-gradient-to-br from-cyan-50 to-cyan-100',
      path: `${basePath}/drivers`
    },
    {
      id: 'solo-drivers',
      title: 'Solo Drivers',
      value: dashboardStats?.soloDrivers ?? 0,
      subtitle: 'Individual drivers',
      icon: UserCheck,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      cardBg: 'bg-gradient-to-br from-green-50 to-green-100',
      path: `${basePath}/drivers`
    },
    {
      id: 'team-drivers',
      title: 'Team Drivers',
      value: dashboardStats?.teamDrivers ?? 0,
      subtitle: 'Team-based drivers',
      icon: UsersRound,
      bgColor: 'bg-teal-100',
      iconColor: 'text-teal-700',
      cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100',
      path: `${basePath}/drivers`
    },
    {
      id: 'active-drivers',
      title: 'Active Drivers',
      value: dashboardStats?.activeDrivers ?? 0,
      subtitle: `${dashboardStats?.recentDriverActivity?.active ?? 0} active, ${dashboardStats?.recentDriverActivity?.inactive ?? 0} inactive`,
      icon: Truck,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-700',
      cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      path: `${basePath}/drivers`
    },
    {
      id: 'documents',
      title: 'Pending Renewals',
      value: dashboardStats?.pendingDocumentRenewals ?? 0,
      subtitle: 'Documents requiring attention',
      icon: FileText,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-700',
      cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      path: `${basePath}/documents`
    },
    {
      id: 'attendance',
      title: 'Present Today',
      value: dashboardStats?.attendance?.presentToday ?? 0,
      subtitle: 'Current attendance',
      icon: Clock,
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
      cardBg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      path: `${basePath}/attendence`
    },
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
      <div className="min-h-screen p-4 bg-main px-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen" >
     <div className="w-full mx-auto p-2 relative">
        {/* Gradient band */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            background: `linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-blue) 40%, rgba(0,209,255,0.15) 100%)`,
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 -mt-2 mb-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={() => {
                    if (feature.path) {
                      navigate(feature.path);
                    }
                  }}
                  className={`${feature.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all ${feature.path ? 'cursor-pointer' : 'cursor-default'} border border-transparent hover:border-[var(--accent-blue)]/20 ${feature.path ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    {/* Left side content */}
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-primary mb-1">
                        {feature.title}
                      </h3>

                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xl font-bold text-primary">{feature.value}</span>
                      </div>

                      <p className="text-xs text-secondary">{feature.subtitle}</p>
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
          <div className="bg-card rounded-lg shadow-sm border border-theme overflow-hidden p-6 mb-4">
            <h2 className="text-lg font-bold text-primary mb-4">Quick Actions & Overview</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className="group p-4 rounded-xl border border-theme hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`${action.bgColor} group-hover:bg-card p-2 rounded-lg transition-colors`}>
                        <Icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <span className="text-lg font-bold text-primary group-hover:text-blue-700">
                        {action.value}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-primary group-hover:text-blue-800">{action.title}</p>
                    <p className="text-xs text-secondary mt-1 group-hover:text-[#00D1FF]">{action.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Information Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upcoming Birthdays */}
            <div className="bg-card rounded-lg shadow-sm border border-theme overflow-hidden p-6">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-5 w-5 text-pink-600" />
                <h2 className="text-lg font-bold text-primary">Upcoming Birthdays</h2>
              </div>
              <div className="space-y-3">
                {dashboardStats?.upcomingBirthdays && dashboardStats.upcomingBirthdays.length > 0 ? (
                  dashboardStats.upcomingBirthdays.slice(0, 5).map((birthday, index) => {
                    const birthdayDate = birthday.birthday ? new Date(birthday.birthday + 'T00:00:00') : null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    today.setMinutes(0, 0);
                    today.setSeconds(0, 0);
                    today.setMilliseconds(0);
                    
                    // Use daysUntil from backend if available, otherwise calculate
                    let daysUntil = birthday.daysUntil;
                    if (daysUntil === undefined && birthdayDate && !isNaN(birthdayDate.getTime())) {
                      daysUntil = Math.ceil((birthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    }
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-100">
                        <div>
                          <p className="text-sm font-semibold text-primary">{birthday.name || 'Unknown'}</p>
                          <p className="text-xs text-secondary">
                            {birthdayDate && !isNaN(birthdayDate.getTime()) 
                              ? birthdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : birthday.birthday 
                                ? new Date(birthday.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Date not available'}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-pink-700 bg-pink-100 px-2 py-1 rounded-full">
                          {daysUntil !== null && daysUntil !== undefined
                            ? (daysUntil === 0 ? 'Today' : daysUntil < 0 ? 'Past' : `${daysUntil} days`)
                            : 'N/A'}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-secondary">
                    <p className="text-sm">No upcoming birthdays in the next 30 days</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Work Anniversaries */}
            {(dashboardStats?.upcomingWorkAnniversaries && dashboardStats.upcomingWorkAnniversaries.length > 0) ? (
              <div className="bg-card rounded-lg shadow-sm border border-theme overflow-hidden p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-primary">Work Anniversaries</h2>
                </div>
                <div className="space-y-3">
                  {dashboardStats.upcomingWorkAnniversaries.slice(0, 5).map((anniversary, index) => {
                    const anniversaryDate = anniversary.anniversaryDate ? new Date(anniversary.anniversaryDate) : null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysUntil = anniversaryDate && !isNaN(anniversaryDate.getTime())
                      ? Math.ceil((anniversaryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                        <div>
                          <p className="text-sm font-semibold text-primary">{anniversary.name || 'Unknown'}</p>
                          <p className="text-xs text-secondary">
                            {anniversary.yearsOfService || 0} {(anniversary.yearsOfService || 0) === 1 ? 'year' : 'years'} • {anniversaryDate && !isNaN(anniversaryDate.getTime())
                              ? anniversaryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : 'Date not available'}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          {daysUntil !== null 
                            ? (daysUntil === 0 ? 'Today' : daysUntil < 0 ? 'Past' : `${daysUntil} days`)
                            : 'N/A'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-sm border border-theme overflow-hidden p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-primary">Upcoming Work Anniversaries</h2>
                </div>
                <div className="text-center py-8 text-secondary">
                  <p className="text-sm">No upcoming work anniversaries</p>
                </div>
              </div>
            )}
          </div>

          {/* Document Expiry Tracking */}
          {(dashboardStats?.documentExpiryTracking && dashboardStats.documentExpiryTracking.length > 0) ? (
            <div className="bg-card rounded-lg shadow-sm border border-theme overflow-hidden p-6 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-[#F59E0B]" />
                <h2 className="text-lg font-bold text-primary">Document Expiry Tracking</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Employee</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Document Type</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Expiry Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-primary uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {dashboardStats.documentExpiryTracking.slice(0, 10).map((doc, index) => {
                      const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const daysUntilExpiry = expiryDate && !isNaN(expiryDate.getTime())
                        ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      return (
                        <tr key={index} className="hover:bg-[rgba(255,255,255,0.03)]">
                          <td className="px-4 py-3 text-sm text-primary">{doc.employeeOrDriverName || 'Unknown'}</td>
                          <td className="px-4 py-3 text-sm text-secondary">{doc.documentType || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-secondary">
                            {expiryDate && !isNaN(expiryDate.getTime())
                              ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Date not available'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              daysUntilExpiry !== null && daysUntilExpiry < 0 
                                ? 'bg-red-100 text-red-700' 
                                : daysUntilExpiry !== null && daysUntilExpiry <= 30 
                                ? 'bg-orange-100 text-orange-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {daysUntilExpiry === null
                                ? 'N/A'
                                : daysUntilExpiry < 0 
                                ? 'Expired' 
                                : daysUntilExpiry === 0 
                                ? 'Expires Today' 
                                : `${daysUntilExpiry} days left`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-sm border border-theme overflow-hidden p-6 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-[#F59E0B]" />
                <h2 className="text-lg font-bold text-primary">Document Expiry Tracking</h2>
              </div>
              <div className="text-center py-8 text-secondary">
                <p className="text-sm">No document expiry records available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default Index;