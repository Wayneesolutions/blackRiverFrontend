import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Calendar, DollarSign, Truck, TrendingUp, Clock, FileText, XCircle } from 'lucide-react';
import { FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

// SPM&I Service Intervals (in km)
const SERVICE_INTERVALS: Record<string, Record<string, number>> = {
  'Oil Change': 15000,
  'DPF Filter': 50000,
  'Valve Adjustment': 100000,
  'Radiator Change': 200000,
  'Oil Pump': 150000,
  'Coolant Filter': 30000,
  'After Treatment System': 40000,
  'Transmission Service': 80000,
  'Brake Inspection': 25000
};

interface Unit {
  unitNo: string;
  unitType: string;
  makeModel: string;
  currentOdometer: number;
  status: 'Active' | 'Inactive';
}

interface SafetyRecord {
  unitNo: string;
  makeModel: string;
  safetyExpiry: string;
  status: 'expired' | 'warning' | 'ok';
}

interface ScheduledService {
  unitNo: string;
  serviceType: string;
  odometer: number;
  serviceDate: string;
}

interface Invoice {
  invoiceNo: string;
  amount: number;
  date: string;
  type: 'Scheduled' | 'General' | 'Safety';
}

// Static data
const staticUnits: Unit[] = [
  { unitNo: '1001', unitType: 'Truck', makeModel: 'Kenworth T680', currentOdometer: 125000, status: 'Active' },
  { unitNo: '1002', unitType: 'Truck', makeModel: 'Peterbilt 579', currentOdometer: 98000, status: 'Active' },
  { unitNo: '1003', unitType: 'Truck', makeModel: 'Freightliner Cascadia', currentOdometer: 156000, status: 'Active' },
  { unitNo: 'BRV001', unitType: 'Reefer Trailer', makeModel: 'Utility 4000R', currentOdometer: 45000, status: 'Active' },
  { unitNo: 'BRV002', unitType: 'Tri-Axle Trailer', makeModel: 'Great Dane', currentOdometer: 32000, status: 'Active' },
  { unitNo: 'BRV003', unitType: 'Dry Van', makeModel: 'Wabash National', currentOdometer: 28000, status: 'Active' },
  { unitNo: '1004', unitType: 'Truck', makeModel: 'Volvo VNL', currentOdometer: 0, status: 'Inactive' },
  { unitNo: 'BRV004', unitType: 'Reefer Trailer', makeModel: 'Carrier Transicold', currentOdometer: 0, status: 'Inactive' }
];

const staticSafetyRecords: SafetyRecord[] = [
  { unitNo: '1001', makeModel: 'Kenworth T680', safetyExpiry: '2024-12-15', status: 'ok' },
  { unitNo: '1002', makeModel: 'Peterbilt 579', safetyExpiry: '2024-11-20', status: 'ok' },
  { unitNo: 'BRV001', makeModel: 'Utility 4000R', safetyExpiry: '2024-10-05', status: 'ok' },
  { unitNo: '1003', makeModel: 'Freightliner Cascadia', safetyExpiry: '2024-09-30', status: 'ok' },
  { unitNo: 'BRV002', makeModel: 'Great Dane', safetyExpiry: '2024-08-15', status: 'warning' },
  { unitNo: 'BRV003', makeModel: 'Wabash National', safetyExpiry: '2024-03-20', status: 'expired' }
];

const staticServices: ScheduledService[] = [
  { unitNo: '1001', serviceType: 'Oil Change', odometer: 125000, serviceDate: '2024-01-15' },
  { unitNo: '1001', serviceType: 'DPF Filter', odometer: 100000, serviceDate: '2023-12-01' },
  { unitNo: '1002', serviceType: 'Oil Change', odometer: 98000, serviceDate: '2024-01-20' },
  { unitNo: '1002', serviceType: 'DPF Filter', odometer: 95000, serviceDate: '2024-01-20' },
  { unitNo: '1003', serviceType: 'Oil Change', odometer: 156000, serviceDate: '2024-02-01' },
  { unitNo: 'BRV001', serviceType: 'Coolant Filter', odometer: 45000, serviceDate: '2024-02-01' }
];

const staticInvoices: Invoice[] = [
  { invoiceNo: 'INV-2024-001', amount: 250.00, date: '2024-01-15', type: 'Scheduled' },
  { invoiceNo: 'INV-2024-002', amount: 450.00, date: '2024-01-20', type: 'Scheduled' },
  { invoiceNo: 'INV-REP-2024-001', amount: 850.00, date: '2024-01-10', type: 'General' },
  { invoiceNo: 'INV-SAF-2024-001', amount: 150.00, date: '2024-01-15', type: 'Safety' },
  { invoiceNo: 'INV-2024-003', amount: 320.00, date: '2024-01-25', type: 'Scheduled' },
  { invoiceNo: 'INV-REP-2024-002', amount: 1200.00, date: '2024-01-18', type: 'General' },
  { invoiceNo: 'INV-2024-004', amount: 180.00, date: '2024-02-01', type: 'Scheduled' },
  { invoiceNo: 'INV-SAF-2024-002', amount: 150.00, date: '2024-01-20', type: 'Safety' }
];

const ComplianceDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'ytd'>('month');

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Safety Compliance Monitor
  const safetyAlerts = useMemo(() => {
    return staticSafetyRecords
      .map(record => ({
        ...record,
        daysUntilExpiry: getDaysUntilExpiry(record.safetyExpiry),
        status: getDaysUntilExpiry(record.safetyExpiry) < 0 ? 'expired' as const :
                getDaysUntilExpiry(record.safetyExpiry) <= 30 ? 'warning' as const : 'ok' as const
      }))
      .filter(record => record.status !== 'ok')
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, []);

  // Scheduled PM Status
  const pmStatus = useMemo(() => {
    const activeUnits = staticUnits.filter(u => u.status === 'Active');
    
    return activeUnits.map(unit => {
      const services = staticServices.filter(s => s.unitNo === unit.unitNo);
      const nextServices: Array<{ type: string; dueAt: number; status: 'due' | 'overdue' | 'ok'; kmRemaining: number }> = [];

      Object.entries(SERVICE_INTERVALS).forEach(([serviceType, interval]) => {
        const lastService = services
          .filter(s => s.serviceType === serviceType)
          .sort((a, b) => b.odometer - a.odometer)[0];
        
        const lastOdometer = lastService?.odometer || 0;
        const nextDueOdometer = lastOdometer + interval;
        const kmRemaining = nextDueOdometer - unit.currentOdometer;
        
        let status: 'due' | 'overdue' | 'ok' = 'ok';
        if (kmRemaining <= 0) {
          status = 'overdue';
        } else if (kmRemaining <= 5000) {
          status = 'due';
        }

        nextServices.push({
          type: serviceType,
          dueAt: nextDueOdometer,
          status,
          kmRemaining
        });
      });

      const overdueServices = nextServices.filter(s => s.status === 'overdue');
      const dueServices = nextServices.filter(s => s.status === 'due');

      return {
        unitNo: unit.unitNo,
        makeModel: unit.makeModel,
        currentOdometer: unit.currentOdometer,
        nextServices,
        overdueCount: overdueServices.length,
        dueCount: dueServices.length
      };
    });
  }, []);

  // Invoice Summary
  const invoiceSummary = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const filterDate = selectedPeriod === 'month' ? startOfMonth : startOfYear;

    const filtered = staticInvoices.filter(inv => new Date(inv.date) >= filterDate);
    
    const total = filtered.reduce((sum, inv) => sum + inv.amount, 0);
    const byType = {
      Scheduled: filtered.filter(inv => inv.type === 'Scheduled').reduce((sum, inv) => sum + inv.amount, 0),
      General: filtered.filter(inv => inv.type === 'General').reduce((sum, inv) => sum + inv.amount, 0),
      Safety: filtered.filter(inv => inv.type === 'Safety').reduce((sum, inv) => sum + inv.amount, 0)
    };

    return { total, byType, count: filtered.length };
  }, [selectedPeriod]);

  const inactiveUnitCount = staticUnits.filter(u => u.status === 'Inactive').length;

  const formatCurrency = (amount: number) => {
    return `CA$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl shadow-lg" style={{ background: 'linear-gradient(to bottom right, #016ab2, #063f6f)' }}>
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
                Fleet Maintenance Dashboard
              </h1>
              <p className="text-gray-600 mt-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Aggregated view for Compliance & Safety Manager
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
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
                <p className="text-3xl font-bold text-orange-600">
                  {pmStatus.reduce((sum, unit) => sum + unit.overdueCount, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Requires attention</p>
              </div>
              <Clock className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Maintenance</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(invoiceSummary.total)}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedPeriod === 'month' ? 'This Month' : 'Year to Date'}</p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Inactive Units</p>
                <p className="text-3xl font-bold text-gray-600">{inactiveUnitCount}</p>
                <p className="text-xs text-gray-500 mt-1">Retired/Sold</p>
              </div>
              <Truck className="text-gray-600" size={32} />
            </div>
          </div>
        </div>

        {/* Safety Compliance Monitor */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
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
                    <tr key={alert.unitNo} className={`hover:bg-gray-50 transition-colors ${
                      alert.status === 'expired' ? 'bg-red-50' : 'bg-yellow-50'
                    }`}>
                      <td className="px-6 py-4 font-medium text-gray-900">{alert.unitNo}</td>
                      <td className="px-6 py-4 text-gray-900">{alert.makeModel}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {new Date(alert.safetyExpiry).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          alert.daysUntilExpiry < 0 ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {alert.daysUntilExpiry < 0 
                            ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
                            : `${alert.daysUntilExpiry} days remaining`
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          alert.status === 'expired' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.status === 'expired' ? (
                            <><FaExclamationCircle className="mr-1" size={12} /> EXPIRED</>
                          ) : (
                            <><AlertTriangle className="mr-1" size={12} /> WARNING</>
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

        {/* Scheduled PM Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
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
                {pmStatus.map((unit) => {
                  const overdueServices = unit.nextServices.filter(s => s.status === 'overdue');
                  const dueServices = unit.nextServices.filter(s => s.status === 'due');
                  const nextService = [...overdueServices, ...dueServices].sort((a, b) => a.kmRemaining - b.kmRemaining)[0];

                  return (
                    <tr key={unit.unitNo} className={`hover:bg-gray-50 transition-colors ${
                      unit.overdueCount > 0 ? 'bg-red-50' : unit.dueCount > 0 ? 'bg-yellow-50' : ''
                    }`}>
                      <td className="px-6 py-4 font-medium text-gray-900">{unit.unitNo}</td>
                      <td className="px-6 py-4 text-gray-900">{unit.makeModel}</td>
                      <td className="px-6 py-4 text-gray-900">{unit.currentOdometer.toLocaleString()} km</td>
                      <td className="px-6 py-4">
                        {nextService ? (
                          <div>
                            <p className="font-medium text-gray-900">{nextService.type}</p>
                            <p className="text-sm text-gray-500">
                              {nextService.kmRemaining <= 0 
                                ? `OVERDUE by ${Math.abs(nextService.kmRemaining).toLocaleString()} km`
                                : `${nextService.kmRemaining.toLocaleString()} km remaining`
                              }
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
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Invoice Summary</h2>
                  <p className="text-sm text-gray-500">Total maintenance spend by period</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPeriod('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === 'month'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedPeriod === 'month' ? { background: 'linear-gradient(to right, #016ab2, #063f6f)' } : {}}
                >
                  This Month
                </button>
                <button
                  onClick={() => setSelectedPeriod('ytd')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === 'ytd'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedPeriod === 'ytd' ? { background: 'linear-gradient(to right, #016ab2, #063f6f)' } : {}}
                >
                  Year to Date
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(invoiceSummary.total)}</p>
                <p className="text-xs text-green-600 mt-1">{invoiceSummary.count} invoices</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 mb-1">Scheduled Services</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(invoiceSummary.byType.Scheduled)}</p>
              </div>
              <div className="rounded-lg p-4 border" style={{ background: 'linear-gradient(to bottom right, rgba(57, 139, 195, 0.1), rgba(57, 139, 195, 0.2))', borderColor: '#398bc3' }}>
                <p className="text-sm mb-1" style={{ color: '#016ab2' }}>General Repairs</p>
                <p className="text-2xl font-bold" style={{ color: '#063f6f' }}>{formatCurrency(invoiceSummary.byType.General)}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-600 mb-1">Safety Inspections</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(invoiceSummary.byType.Safety)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inactive Unit Count */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Truck className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Inactive Units</h2>
                  <p className="text-sm text-gray-500">Units marked as retired, sold, or returned</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-600">{inactiveUnitCount}</p>
                <p className="text-sm text-gray-500">Total inactive</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;

