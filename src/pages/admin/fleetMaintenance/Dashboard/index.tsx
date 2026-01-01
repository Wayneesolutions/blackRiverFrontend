import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Truck,
  Clock,
  FileText,
  XCircle,
  Wrench,
  Activity
} from 'lucide-react';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { getUserRole } from '../../../../utils/auth';
import {
  type ComplianceDashboardResponse,
  type ComplianceSafetyAlert,
  type CompliancePmUnit,
  type ComplianceDocument,
  fetchComplianceDashboard
} from '../../../../axios/api/complianceDashboard';

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
};

const formatCurrency = (amount: number) => {
  return `CA$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)}`;
};

const ComplianceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'ytd'>('month');
  const [data, setData] = useState<ComplianceDashboardResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresCompanySetup, setRequiresCompanySetup] = useState(false);

  const getBasePath = () => {
    const role = getUserRole();
    return role === 'Fleet Maintenance Manager' ? '/fleetmaintenance' : '/admin/fleetmaintenance';
  };

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      setRequiresCompanySetup(false);
      try {
        const response = await fetchComplianceDashboard();
        if (response?.success && response.data) {
          setData(response.data);
          if (response.requiresCompanySetup) {
            setRequiresCompanySetup(true);
          }
        } else {
          setError(response?.message || 'Failed to load dashboard data');
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err?.response?.data?.message || 'An error occurred while loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Static data initialization - REMOVED - Now using API
  /* useEffect(() => {
    // Initialize with static data instead of API call
    const staticData: ComplianceDashboardResponse['data'] = {
      fleetOperational: {
        activeTrucks: 45,
        outOfServiceTrucks: 3,
        vehiclesUnderRepair: 5,
        vehiclesWithPendingService: 8
      },
      safetyAlerts: [
        {
          unitNo: 'TR-001',
          makeModel: 'Freightliner Cascadia 2020',
          safetyExpiry: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          daysUntilExpiry: -5,
          status: 'expired'
        },
        {
          unitNo: 'TR-015',
          makeModel: 'Peterbilt 579 2021',
          safetyExpiry: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          daysUntilExpiry: 15,
          status: 'warning'
        },
        {
          unitNo: 'TR-028',
          makeModel: 'Kenworth T680 2019',
          safetyExpiry: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
          daysUntilExpiry: 22,
          status: 'warning'
        }
      ],
      pmStatus: [
        {
          unitNo: 'TR-005',
          makeModel: 'Volvo VNL 2022',
          currentOdometer: 145000,
          overdueCount: 1,
          dueCount: 2,
          nextServices: [
            {
              type: 'Oil Change',
              dueAt: 140000,
              kmRemaining: -5000,
              status: 'overdue'
            },
            {
              type: 'Tire Rotation',
              dueAt: 150000,
              kmRemaining: 5000,
              status: 'due'
            }
          ]
        },
        {
          unitNo: 'TR-012',
          makeModel: 'Mack Anthem 2021',
          currentOdometer: 98000,
          overdueCount: 0,
          dueCount: 1,
          nextServices: [
            {
              type: 'Brake Inspection',
              dueAt: 100000,
              kmRemaining: 2000,
              status: 'due'
            }
          ]
        },
        {
          unitNo: 'TR-020',
          makeModel: 'International LT 2020',
          currentOdometer: 125000,
          overdueCount: 0,
          dueCount: 0,
          nextServices: [
            {
              type: 'Regular Service',
              dueAt: 130000,
              kmRemaining: 5000,
              status: 'ok'
            }
          ]
        }
      ],
      invoiceSummary: {
        month: {
          total: 45678.50,
          byType: {
            scheduled: 23456.00,
            general: 15678.50,
            safety: 6544.00
          },
          count: 28
        },
        ytd: {
          total: 345678.90,
          byType: {
            scheduled: 187654.50,
            general: 115678.40,
            safety: 42346.00
          },
          count: 198
        }
      },
      inactiveUnits: 7,
      complianceDocuments: [
        {
          _id: 'doc-001',
          documentType: 'safety_inspection',
          documentNumber: 'SI-2024-001',
          expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'expired',
          daysUntilExpiry: -10,
          assetType: 'vehicle',
          unitNo: 'TR-003',
          makeModel: 'Freightliner Cascadia 2019',
          plateNumber: 'ABC-1234',
          unitType: 'Truck'
        },
        {
          _id: 'doc-002',
          documentType: 'registration',
          documentNumber: 'REG-2024-045',
          expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 5,
          assetType: 'vehicle',
          unitNo: 'TR-007',
          makeModel: 'Peterbilt 579 2020',
          plateNumber: 'XYZ-5678',
          unitType: 'Truck'
        },
        {
          _id: 'doc-003',
          documentType: 'insurance',
          documentNumber: 'INS-2024-089',
          expiryDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 12,
          assetType: 'vehicle',
          unitNo: 'TR-011',
          makeModel: 'Kenworth T680 2021',
          plateNumber: 'DEF-9012',
          unitType: 'Truck'
        },
        {
          _id: 'doc-004',
          documentType: 'cvor',
          documentNumber: 'CVOR-2024-012',
          expiryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'expired',
          daysUntilExpiry: -3,
          assetType: 'vehicle',
          unitNo: 'TR-018',
          makeModel: 'Volvo VNL 2018',
          plateNumber: 'GHI-3456',
          unitType: 'Truck'
        },
        {
          _id: 'doc-005',
          documentType: 'annual_inspection',
          documentNumber: 'AI-2024-023',
          expiryDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 18,
          assetType: 'vehicle',
          unitNo: 'TR-025',
          makeModel: 'Mack Anthem 2022',
          plateNumber: 'JKL-7890',
          unitType: 'Truck'
        },
        {
          _id: 'doc-006',
          documentType: 'permit',
          documentNumber: 'PER-2024-056',
          expiryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'expired',
          daysUntilExpiry: -7,
          assetType: 'trailer',
          unitNo: 'TL-002',
          makeModel: 'Utility Trailer 53ft',
          plateNumber: 'TL-2345',
          unitType: 'Trailer'
        },
        {
          _id: 'doc-007',
          documentType: 'dot_number',
          documentNumber: 'DOT-987654',
          expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 25,
          assetType: 'vehicle',
          unitNo: 'TR-032',
          makeModel: 'International LT 2021',
          plateNumber: 'MNO-1357',
          unitType: 'Truck'
        },
        {
          _id: 'doc-008',
          documentType: 'safety_inspection',
          documentNumber: 'SI-2024-078',
          expiryDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 35,
          assetType: 'vehicle',
          unitNo: 'TR-014',
          makeModel: 'Freightliner Cascadia 2021',
          plateNumber: 'PQR-2468',
          unitType: 'Truck'
        },
        {
          _id: 'doc-009',
          documentType: 'registration',
          documentNumber: 'REG-2024-091',
          expiryDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 42,
          assetType: 'trailer',
          unitNo: 'TL-005',
          makeModel: 'Great Dane Trailer 48ft',
          plateNumber: 'TL-5678',
          unitType: 'Trailer'
        },
        {
          _id: 'doc-010',
          documentType: 'insurance',
          documentNumber: 'INS-2024-112',
          expiryDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 50,
          assetType: 'vehicle',
          unitNo: 'TR-019',
          makeModel: 'Peterbilt 389 2020',
          plateNumber: 'STU-3691',
          unitType: 'Truck'
        },
        {
          _id: 'doc-011',
          documentType: 'cvor',
          documentNumber: 'CVOR-2024-045',
          expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 28,
          assetType: 'vehicle',
          unitNo: 'TR-023',
          makeModel: 'Kenworth W900 2019',
          plateNumber: 'VWX-4826',
          unitType: 'Truck'
        },
        {
          _id: 'doc-012',
          documentType: 'annual_inspection',
          documentNumber: 'AI-2024-067',
          expiryDate: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 38,
          assetType: 'vehicle',
          unitNo: 'TR-029',
          makeModel: 'Volvo VNR 2022',
          plateNumber: 'YZA-7043',
          unitType: 'Truck'
        },
        {
          _id: 'doc-013',
          documentType: 'permit',
          documentNumber: 'PER-2024-084',
          expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 45,
          assetType: 'trailer',
          unitNo: 'TL-008',
          makeModel: 'Wabash Trailer 45ft',
          plateNumber: 'TL-8024',
          unitType: 'Trailer'
        },
        {
          _id: 'doc-014',
          documentType: 'dot_number',
          documentNumber: 'DOT-654321',
          expiryDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 55,
          assetType: 'vehicle',
          unitNo: 'TR-036',
          makeModel: 'Mack Pinnacle 2021',
          plateNumber: 'BCD-9157',
          unitType: 'Truck'
        },
        {
          _id: 'doc-015',
          documentType: 'safety_inspection',
          documentNumber: 'SI-2024-102',
          expiryDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'due',
          daysUntilExpiry: 32,
          assetType: 'trailer',
          unitNo: 'TL-011',
          makeModel: 'Timpte Trailer 53ft',
          plateNumber: 'TL-1065',
          unitType: 'Trailer'
        }
      ]
    };

    setData(staticData);
    setLoading(false);
  }, []); */

  const safetyAlerts = useMemo<ComplianceSafetyAlert[]>(() => data?.safetyAlerts || [], [data]);
  const pmStatus = useMemo<CompliancePmUnit[]>(() => data?.pmStatus || [], [data]);
  const invoiceSummary = useMemo(() => data?.invoiceSummary || null, [data]);
  const inactiveUnits = data?.inactiveUnits || 0;
  const fleetOperational = data?.fleetOperational || {
    activeTrucks: 0,
    outOfServiceTrucks: 0,
    vehiclesUnderRepair: 0,
    vehiclesWithPendingService: 0
  };
  const complianceDocuments = useMemo<ComplianceDocument[]>(() => data?.complianceDocuments || [], [data]);

  const currentInvoices =
    selectedPeriod === 'month' ? invoiceSummary?.month : invoiceSummary?.ytd;

  const totalOverdueServices = pmStatus.reduce((sum, unit) => sum + unit.overdueCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen p-4 bg-[#EDF8FF] px-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  const features = [
    {
      id: 'active-trucks',
      title: 'Active Trucks',
      value: fleetOperational.activeTrucks,
      subtitle: 'In service',
      icon: Activity,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-700',
      cardBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      onClick: () => navigate(`${getBasePath()}/fleet-units`)
    },
    {
      id: 'out-of-service',
      title: 'Out of Service',
      value: fleetOperational.outOfServiceTrucks,
      subtitle: 'Requires attention',
      icon: XCircle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-700',
      cardBg: 'bg-gradient-to-br from-red-50 to-red-100',
      onClick: () => navigate(`${getBasePath()}/fleet-units`)
    },
    {
      id: 'under-repair',
      title: 'Under Repair',
      value: fleetOperational.vehiclesUnderRepair,
      subtitle: 'In maintenance',
      icon: Wrench,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-700',
      cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      onClick: () => navigate(`${getBasePath()}/general-repairs-log`)
    },
    {
      id: 'pending-service',
      title: 'Pending Service',
      value: fleetOperational.vehiclesWithPendingService,
      subtitle: 'Service due',
      icon: Clock,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-700',
      cardBg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      onClick: () => navigate(`${getBasePath()}/scheduled-services-log`)
    },
    {
      id: 'safety',
      title: 'Safety Alerts',
      value: safetyAlerts.length,
      subtitle: 'Expiring/Expired',
      icon: AlertTriangle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-700',
      cardBg: 'bg-gradient-to-br from-red-50 to-red-100',
      onClick: () => navigate(`${getBasePath()}/regulatory-safety`)
    },
    {
      id: 'overdue',
      title: 'Overdue Services',
      value: totalOverdueServices,
      subtitle: 'Requires attention',
      icon: Clock,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-700',
      cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      onClick: () => navigate(`${getBasePath()}/scheduled-services-log`)
    },
    {
      id: 'maintenance',
      title: 'Total Maintenance',
      value: currentInvoices ? formatCurrency(currentInvoices.total) : 'CA$0.00',
      subtitle: selectedPeriod === 'month' ? 'This Month' : 'Year to Date',
      icon: DollarSign,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-700',
      cardBg: 'bg-gradient-to-br from-green-50 to-green-100',
      onClick: () => navigate(`${getBasePath()}/invoices`)
    },
    {
      id: 'inactive',
      title: 'Inactive Units',
      value: inactiveUnits,
      subtitle: 'Retired / Maintenance',
      icon: Truck,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-700',
      cardBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
      onClick: () => navigate(`${getBasePath()}/fleet-units`)
    }
  ];

  const invoiceBreakdown = [
    {
      id: 'scheduled',
      title: 'Scheduled',
      subtitle: `${currentInvoices?.count || 0} invoices`,
      value: currentInvoices ? formatCurrency(currentInvoices.byType.scheduled) : 'CA$0.00',
      icon: Calendar,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-700'
    },
    {
      id: 'general',
      title: 'General',
      subtitle: `${currentInvoices?.count || 0} invoices`,
      value: currentInvoices ? formatCurrency(currentInvoices.byType.general) : 'CA$0.00',
      icon: FileText,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-700'
    },
    {
      id: 'safety',
      title: 'Safety',
      subtitle: `${currentInvoices?.count || 0} invoices`,
      value: currentInvoices ? formatCurrency(currentInvoices.byType.safety) : 'CA$0.00',
      icon: AlertTriangle,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-700'
    }
  ];

  return (
    <>
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
              <h1 className="text-xl font-bold text-white">Overview</h1>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-xs">Fleet Maintenance</span>
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {requiresCompanySetup && (
            <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg shadow-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Please complete your company settings to view compliance data.</span>
            </div>
          )}

          {error && !requiresCompanySetup && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Period Selector */}
          <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-gray-500">Reporting Period</p>
                <h3 className="text-base font-bold text-gray-900">
                  {selectedPeriod === 'month' ? 'This Month' : 'Year to Date'}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPeriod('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedPeriod === 'month'
                    ? 'bg-gradient-to-r from-[#42aeec] to-[#0ea3d8] !text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setSelectedPeriod('ytd')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedPeriod === 'ytd'
                    ? 'bg-gradient-to-r from-[#42aeec] to-[#0ea3d8] !text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Year to Date
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* Fleet Operational Stats - First Row */}
            {features.slice(0, 4).map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={feature.onClick}
                  className={`${feature.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xl font-bold text-gray-900">{feature.value}</span>
                      </div>
                      <p className="text-xs text-gray-400">{feature.subtitle}</p>
                    </div>
                    <div className={`${feature.bgColor} rounded-lg p-2 shadow-sm`}>
                      <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Stats Cards - Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {features.slice(4).map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={feature.onClick}
                  className={`${feature.cardBg} rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-[#42aeec]/20 hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        {feature.title}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xl font-bold text-gray-900">{feature.value}</span>
                      </div>
                      <p className="text-xs text-gray-400">{feature.subtitle}</p>
                    </div>
                    <div className={`${feature.bgColor} rounded-lg p-2 shadow-sm`}>
                      <Icon className={feature.iconColor} size={21} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invoice Breakdown Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Invoice Breakdown</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {invoiceBreakdown.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`${getBasePath()}/invoices`)}
                    className="group p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`${item.bgColor} group-hover:bg-white p-2 rounded-lg transition-colors`}>
                        <Icon className={`h-5 w-5 ${item.iconColor}`} />
                      </div>
                      <span className="text-lg font-bold text-gray-900 group-hover:text-blue-700">
                        {item.value}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-blue-800">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1 group-hover:text-blue-600">{item.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safety Fleet Monitor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div
              onClick={() => navigate(`${getBasePath()}/regulatory-safety`)}
              className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                 Regulatory & Safety
                </h3>
                <span className="text-sm text-gray-500">View All →</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">Units with safety expiry within 30 days or expired</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unit No.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Make/Model</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Safety Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Until Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {safetyAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FaCheckCircle className="text-green-500" size={32} />
                          <p>All safety certifications are up to date!</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    safetyAlerts.map((alert) => (
                      <tr
                        key={`${alert.unitNo}-${alert.safetyExpiry}`}
                        className={`hover:bg-gray-50 transition-colors ${alert.status === 'expired' ? 'bg-red-50' : 'bg-yellow-50'
                          }`}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">{alert.unitNo}</td>
                        <td className="px-6 py-4 text-gray-900">{alert.makeModel || '—'}</td>
                        <td className="px-6 py-4 text-gray-900">{formatDate(alert.safetyExpiry)}</td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${alert.daysUntilExpiry < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                            {alert.daysUntilExpiry < 0
                              ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
                              : `${alert.daysUntilExpiry} days remaining`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${alert.status === 'expired'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}
                          >
                            {alert.status === 'expired' ? (
                              <>
                                <FaExclamationCircle className="mr-1" size={12} /> EXPIRED
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="mr-1" size={12} /> WARNING
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance Documents - Expired/Due Documents */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div
              onClick={() => navigate(`${getBasePath()}/vehicle-documents`)}
              className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Compliance Documents (7 Mandatory Regulatory Requirements)
                </h3>
                <span className="text-sm text-gray-500">View All →</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">Expired, due, and documents going to expire for trucks and trailers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unit No.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Document Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Document Number</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Days Until Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complianceDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FaCheckCircle className="text-green-500" size={32} />
                          <p>All compliance documents are up to date!</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    complianceDocuments.map((doc) => {
                      const isExpired = doc.daysUntilExpiry !== null && doc.daysUntilExpiry < 0;
                      const isDueSoon = doc.daysUntilExpiry !== null && doc.daysUntilExpiry >= 0 && doc.daysUntilExpiry <= 30;
                      const isGoingToExpire = doc.daysUntilExpiry !== null && doc.daysUntilExpiry > 30 && doc.daysUntilExpiry <= 60;
                      
                      let rowBgColor = '';
                      let statusBadgeColor = '';
                      let statusText = '';
                      let statusIcon = null;
                      let daysTextColor = '';

                      if (isExpired) {
                        rowBgColor = 'bg-red-50';
                        statusBadgeColor = 'bg-red-100 text-red-800';
                        statusText = 'EXPIRED';
                        statusIcon = <FaExclamationCircle className="mr-1" size={12} />;
                        daysTextColor = 'text-red-600';
                      } else if (isDueSoon) {
                        rowBgColor = 'bg-yellow-50';
                        statusBadgeColor = 'bg-yellow-100 text-yellow-800';
                        statusText = 'DUE SOON';
                        statusIcon = <AlertTriangle className="mr-1" size={12} />;
                        daysTextColor = 'text-yellow-600';
                      } else if (isGoingToExpire) {
                        rowBgColor = 'bg-orange-50';
                        statusBadgeColor = 'bg-orange-100 text-orange-800';
                        statusText = 'GOING TO EXPIRE';
                        statusIcon = <Clock className="mr-1" size={12} />;
                        daysTextColor = 'text-orange-600';
                      } else {
                        rowBgColor = 'bg-yellow-50';
                        statusBadgeColor = 'bg-yellow-100 text-yellow-800';
                        statusText = 'DUE';
                        statusIcon = <AlertTriangle className="mr-1" size={12} />;
                        daysTextColor = 'text-yellow-600';
                      }

                      return (
                        <tr
                          key={doc._id}
                          className={`hover:bg-gray-50 transition-colors ${rowBgColor}`}
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{doc.unitNo}</td>
                          <td className="px-6 py-4 text-gray-900">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                              {doc.unitType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            <span className="capitalize">{doc.documentType.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-900">{doc.documentNumber}</td>
                          <td className="px-6 py-4 text-gray-900">{formatDate(doc.expiryDate)}</td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${daysTextColor}`}>
                              {doc.daysUntilExpiry === null
                                ? 'N/A'
                                : doc.daysUntilExpiry < 0
                                ? `Expired ${Math.abs(doc.daysUntilExpiry)} days ago`
                                : `${doc.daysUntilExpiry} days remaining`}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeColor}`}>
                              {statusIcon}
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scheduled Service Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div
              onClick={() => navigate(`${getBasePath()}/scheduled-services-log`)}
              className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Scheduled Service Status
                </h3>
                <span className="text-sm text-gray-500">View All →</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">Next service due for each active unit</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unit No.</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Make/Model</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Current Odometer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Next Service Due</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pmStatus.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No data available. Schedule preventive maintenance to populate this section.
                      </td>
                    </tr>
                  ) : (
                    pmStatus.map((unit) => {
                      const nextService = [...unit.nextServices]
                        .filter((svc) => svc.status !== 'ok')
                        .sort((a, b) => a.kmRemaining - b.kmRemaining)[0];

                      return (
                        <tr
                          key={unit.unitNo}
                          className={`hover:bg-gray-50 transition-colors ${unit.overdueCount > 0 ? 'bg-red-50' : unit.dueCount > 0 ? 'bg-yellow-50' : ''
                            }`}
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">{unit.unitNo}</td>
                          <td className="px-6 py-4 text-gray-900">{unit.makeModel || '—'}</td>
                          <td className="px-6 py-4 text-gray-900">{unit.currentOdometer.toLocaleString()} km</td>
                          <td className="px-6 py-4">
                            {nextService ? (
                              <div>
                                <p className="font-medium text-gray-900">{nextService.type}</p>
                                <p className="text-sm text-gray-500">
                                  {nextService.kmRemaining <= 0
                                    ? `OVERDUE by ${Math.abs(nextService.kmRemaining).toLocaleString()} km`
                                    : `${nextService.kmRemaining.toLocaleString()} km remaining`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-green-600 font-medium">All services up to date</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {unit.overdueCount > 0 ? (
                              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                <XCircle className="mr-1" size={12} /> {unit.overdueCount} Overdue
                              </span>
                            ) : unit.dueCount > 0 ? (
                              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                <AlertTriangle className="mr-1" size={12} /> {unit.dueCount} Due Soon
                              </span>
                            ) : (
                              <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                <FaCheckCircle className="mr-1" size={12} /> OK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ComplianceDashboard;