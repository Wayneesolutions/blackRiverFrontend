import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  Truck,
  TrendingUp,
  Clock,
  FileText,
  XCircle
} from 'lucide-react';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import {
  fetchComplianceDashboard,
  type ComplianceDashboardResponse,
  type ComplianceSafetyAlert,
  type CompliancePmUnit
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
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'ytd'>('month');
  const [data, setData] = useState<ComplianceDashboardResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresCompanySetup, setRequiresCompanySetup] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchComplianceDashboard();
        if (response.success) {
          setData(response.data);
          setRequiresCompanySetup(!!response.requiresCompanySetup);
        } else {
          setData(null);
          setRequiresCompanySetup(!!response.requiresCompanySetup);
          setError(response.message || 'Failed to load compliance data');
        }
      } catch (err: any) {
        setData(null);
        setError(err?.response?.data?.message || err?.message || 'Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const safetyAlerts = useMemo<ComplianceSafetyAlert[]>(() => data?.safetyAlerts || [], [data]);
  const pmStatus = useMemo<CompliancePmUnit[]>(() => data?.pmStatus || [], [data]);
  const invoiceSummary = useMemo(() => data?.invoiceSummary || null, [data]);
  const inactiveUnits = data?.inactiveUnits || 0;

  const currentInvoices =
    selectedPeriod === 'month' ? invoiceSummary?.month : invoiceSummary?.ytd;

  const totalOverdueServices = pmStatus.reduce((sum, unit) => sum + unit.overdueCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(to bottom right, #016ab2, #063f6f)' }}>
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1
                className="text-4xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, #016ab2, #063f6f)' }}
              >
                Fleet Compliance Dashboard
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Aggregated view for Compliance & Safety teams
              </p>
            </div>
          </div>

          {requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Please complete your company settings to view compliance data.
            </div>
          )}

          {error && !requiresCompanySetup && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-gray-500 text-sm">Reporting Period</p>
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedPeriod === 'month' ? 'This Month' : 'Year to Date'}
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedPeriod('ytd')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedPeriod === 'ytd'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Year to Date
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center text-gray-500">
            Loading compliance data...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Safety Alerts</p>
                    <p className="text-3xl font-bold text-red-600">{safetyAlerts.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Expiring/Expired</p>
                  </div>
                  <AlertTriangle className="text-red-600" size={32} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Overdue Services</p>
                    <p className="text-3xl font-bold text-orange-600">{totalOverdueServices}</p>
                    <p className="text-xs text-gray-500 mt-1">Requires attention</p>
                  </div>
                  <Clock className="text-orange-600" size={32} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Total Maintenance</p>
                    <p className="text-2xl font-bold text-green-600">
                      {currentInvoices ? formatCurrency(currentInvoices.total) : 'CA$0.00'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedPeriod === 'month' ? 'This Month' : 'Year to Date'}
                    </p>
                  </div>
                  <DollarSign className="text-green-600" size={32} />
                </div>
                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Scheduled</span>
                    <span>
                      {currentInvoices ? formatCurrency(currentInvoices.byType.scheduled) : 'CA$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>General</span>
                    <span>
                      {currentInvoices ? formatCurrency(currentInvoices.byType.general) : 'CA$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety</span>
                    <span>
                      {currentInvoices ? formatCurrency(currentInvoices.byType.safety) : 'CA$0.00'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Inactive Units</p>
                    <p className="text-3xl font-bold text-gray-600">{inactiveUnits}</p>
                    <p className="text-xs text-gray-500 mt-1">Retired / In Maintenance</p>
                  </div>
                  <Truck className="text-gray-600" size={32} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Safety Compliance Monitor</h2>
                    <p className="text-sm text-gray-500">Units with safety expiry within 30 days or expired</p>
                  </div>
                </div>
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
                          className={`hover:bg-gray-50 transition-colors ${
                            alert.status === 'expired' ? 'bg-red-50' : 'bg-yellow-50'
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
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                alert.status === 'expired'
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

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Scheduled PM Status</h2>
                    <p className="text-sm text-gray-500">Next service due for each active unit</p>
                  </div>
                </div>
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
                            className={`hover:bg-gray-50 transition-colors ${
                              unit.overdueCount > 0 ? 'bg-red-50' : unit.dueCount > 0 ? 'bg-yellow-50' : ''
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

            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Invoice Breakdown</h2>
                    <p className="text-sm text-gray-500">
                      Compare scheduled, general, and safety maintenance spending
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['scheduled', 'general', 'safety'] as const).map((type) => (
                  <div key={type} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase">{type}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {currentInvoices ? formatCurrency(currentInvoices.byType[type]) : 'CA$0.00'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {currentInvoices?.count || 0} invoices this period
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ComplianceDashboard;