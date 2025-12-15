import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Download, Filter, Wrench, DollarSign, Package, TrendingUp, Calendar, FileText, AlertCircle, X } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import {
  getMaintenanceExpenseSummary,
  getPartsCostLog,
  createPartsCostLog,
  updatePartsCostLog,
  deletePartsCostLog,
  getLaborRates,
  createLaborRate,
  updateLaborRate,
  deleteLaborRate,
  getMaintenancePlans,
  createMaintenancePlan,
  updateMaintenancePlan,
  deleteMaintenancePlan,
  getFleetMaintenanceStats
} from '../../../../axios/api/account.fleetMaintenance';
import { listFleetUnits } from '../../../../axios/api/fleet.units';

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const ToastNotificationComponent = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-blue-500" size={24} />,
    warning: <FaExclamationCircle className="text-yellow-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10000] ${bgColors[notification.type]} min-w-[300px] max-w-[500px]`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

interface ExpenseSummaryItem {
  vehicle: string;
  totalExpense: number;
  costPerMile: number;
  breakdown: string;
  topExpenses: string[];
}

interface PartsCostLogItem {
  _id?: string;
  id?: string;
  partNumber: string;
  description: string;
  unitCost: number;
  quantity: number;
  totalCost?: number;
  dateOfUse: string;
  vehicle: string;
  vehicleId?: string;
}

interface LaborRateItem {
  _id?: string;
  id?: string;
  rateType: string;
  description: string;
  rate: number;
  isActive: boolean;
}

interface MaintenancePlanItem {
  _id?: string;
  id?: string;
  planName: string;
  vehicle: string;
  vehicleId?: string;
  plannedCost: number;
  actualCost: number;
  variance: number;
  status: string;
}

export default function FleetMaintenanceFinance() {
  const [activeTab, setActiveTab] = useState('expense-summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  // Data states
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummaryItem[]>([]);
  const [partsCostLog, setPartsCostLog] = useState<PartsCostLogItem[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRateItem[]>([]);
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlanItem[]>([]);
  const [fleetUnits, setFleetUnits] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalMaintenanceCost: 0,
    avgCostPerMile: 0,
    partsInventoryValue: 0,
    partsInventoryCount: 0,
    pendingPMPlans: 0,
    percentChange: 0
  });

  // Modal states
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showLaborModal, setShowLaborModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingParts, setEditingParts] = useState<PartsCostLogItem | null>(null);
  const [editingLabor, setEditingLabor] = useState<LaborRateItem | null>(null);
  const [editingPlan, setEditingPlan] = useState<MaintenancePlanItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'parts' | 'labor' | 'plan' } | null>(null);

  // Form data
  const [partsFormData, setPartsFormData] = useState({
    partNumber: '',
    description: '',
    unitCost: '',
    quantity: '',
    dateOfUse: new Date().toISOString().split('T')[0],
    vehicle: '',
    vehicleId: ''
  });

  const [laborFormData, setLaborFormData] = useState({
    rateType: '',
    description: '',
    rate: '',
    isActive: true
  });

  const [planFormData, setPlanFormData] = useState({
    planName: '',
    vehicle: '',
    vehicleId: '',
    plannedCost: '',
    actualCost: '',
    status: 'Scheduled',
    plannedDate: '',
    completedDate: ''
  });

  const tabs = [
    { id: 'expense-summary', label: 'Maintenance Expense Summary', icon: TrendingUp },
    { id: 'parts-cost-log', label: 'Parts Cost Log', icon: Package },
    { id: 'labor-rates', label: 'Shop Labor Rate Setup', icon: Wrench },
    { id: 'plan-financials', label: 'Maintenance Plan Financials', icon: Calendar }
  ];

  // Fetch all data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchStats(),
        fetchFleetUnits(),
        fetchExpenseSummary(),
        fetchPartsCostLog(),
        fetchLaborRates(),
        fetchMaintenancePlans()
      ]);
    };
    loadInitialData();
  }, []);

  // Fetch filtered data when tab/search changes
  useEffect(() => {
    if (activeTab === 'expense-summary') {
      fetchExpenseSummary();
    } else if (activeTab === 'parts-cost-log') {
      fetchPartsCostLog();
    } else if (activeTab === 'labor-rates') {
      fetchLaborRates();
    } else if (activeTab === 'plan-financials') {
      fetchMaintenancePlans();
    }
  }, [activeTab, searchTerm]);

  const fetchStats = async () => {
    try {
      const response = await getFleetMaintenanceStats();
      if (response?.success && response.data) {
        setStats({
          totalMaintenanceCost: response.data.totalMaintenanceCost || 0,
          avgCostPerMile: response.data.avgCostPerMile || 0,
          partsInventoryValue: response.data.partsInventoryValue || 0,
          partsInventoryCount: response.data.partsInventoryCount || 0,
          pendingPMPlans: response.data.pendingPMPlans || 0,
          percentChange: response.data.percentChange || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Calculate stats from page data (called after data is loaded)
  const calculateStatsFromPageData = () => {
    // Calculate total maintenance cost from expense summary
    const totalExpense = expenseSummary.reduce((sum, exp) => sum + (exp.totalExpense || 0), 0);

    // Calculate avg cost per mile from expense summary (weighted average)
    const totalCostPerMileSum = expenseSummary.reduce((sum, exp) => sum + (exp.costPerMile || 0), 0);
    const avgCostPerMileFromData = expenseSummary.length > 0
      ? totalCostPerMileSum / expenseSummary.length
      : 0;

    // Count pending PM plans
    const pendingPlans = maintenancePlans.filter(p => p.status === 'Scheduled').length;

    // Update stats - always use calculated values from page data
    setStats(prev => ({
      totalMaintenanceCost: totalExpense, // Always use calculated from expense summary
      avgCostPerMile: avgCostPerMileFromData || prev.avgCostPerMile, // Use calculated or fallback to API
      partsInventoryValue: prev.partsInventoryValue || 0, // Keep from API (SpareParts)
      partsInventoryCount: prev.partsInventoryCount || 0, // Keep from API (SpareParts)
      pendingPMPlans: pendingPlans, // Always use calculated from maintenance plans
      percentChange: prev.percentChange || 0 // Keep from API
    }));
  };

  // Recalculate stats when expense summary or maintenance plans change
  useEffect(() => {
    // Always recalculate when data changes (even if empty, to show 0 correctly)
    calculateStatsFromPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseSummary, maintenancePlans]);

  const fetchFleetUnits = async () => {
    try {
      const response = await listFleetUnits();
      if (response?.success && Array.isArray(response.data)) {
        setFleetUnits(response.data);
      }
    } catch (error) {
      console.error('Error fetching fleet units:', error);
    }
  };

  const fetchExpenseSummary = async () => {
    setLoading(true);
    try {
      const response = await getMaintenanceExpenseSummary({ search: searchTerm || undefined });
      if (response?.success && Array.isArray(response.data)) {
        setExpenseSummary(response.data);
      } else {
        showNotification('error', response?.message || 'Failed to fetch expense summary');
      }
    } catch (error: any) {
      console.error('Error fetching expense summary:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while fetching expense summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartsCostLog = async () => {
    setLoading(true);
    try {
      const response = await getPartsCostLog({ search: searchTerm || undefined });
      if (response?.success && Array.isArray(response.data)) {
        const formatted = response.data.map((item: any) => ({
          _id: item._id,
          partNumber: item.partNumber,
          description: item.description,
          unitCost: item.unitCost,
          quantity: item.quantity,
          totalCost: item.totalCost || (item.unitCost * item.quantity),
          dateOfUse: new Date(item.dateOfUse).toISOString().split('T')[0],
          vehicle: item.vehicle,
          vehicleId: item.vehicleId?._id || item.vehicleId
        }));
        setPartsCostLog(formatted);
      } else {
        showNotification('error', response?.message || 'Failed to fetch parts cost log');
      }
    } catch (error: any) {
      console.error('Error fetching parts cost log:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while fetching parts cost log');
    } finally {
      setLoading(false);
    }
  };

  const fetchLaborRates = async () => {
    setLoading(true);
    try {
      const response = await getLaborRates({ search: searchTerm || undefined });
      if (response?.success && Array.isArray(response.data)) {
        setLaborRates(response.data);
      } else {
        showNotification('error', response?.message || 'Failed to fetch labor rates');
      }
    } catch (error: any) {
      console.error('Error fetching labor rates:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while fetching labor rates');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenancePlans = async () => {
    setLoading(true);
    try {
      const response = await getMaintenancePlans({ search: searchTerm || undefined });
      if (response?.success && Array.isArray(response.data)) {
        const formatted = response.data.map((item: any) => ({
          _id: item._id,
          planName: item.planName,
          vehicle: item.vehicle,
          vehicleId: item.vehicleId?._id || item.vehicleId,
          plannedCost: item.plannedCost,
          actualCost: item.actualCost || 0,
          variance: item.variance || (item.actualCost - item.plannedCost),
          status: item.status
        }));
        setMaintenancePlans(formatted);
      } else {
        showNotification('error', response?.message || 'Failed to fetch maintenance plans');
      }
    } catch (error: any) {
      console.error('Error fetching maintenance plans:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while fetching maintenance plans');
    } finally {
      setLoading(false);
    }
  };

  // Parts Cost Log handlers
  const handleCreateParts = async () => {
    try {
      const data = {
        partNumber: partsFormData.partNumber,
        description: partsFormData.description,
        unitCost: parseFloat(partsFormData.unitCost),
        quantity: parseInt(partsFormData.quantity),
        dateOfUse: partsFormData.dateOfUse,
        vehicle: partsFormData.vehicle,
        vehicleId: partsFormData.vehicleId || undefined
      };

      const response = editingParts?._id
        ? await updatePartsCostLog(editingParts._id, data)
        : await createPartsCostLog(data);

      if (response?.success) {
        setShowPartsModal(false);
        resetPartsForm();
        await fetchPartsCostLog();
        await fetchStats();
        showNotification('success', editingParts?._id ? 'Parts cost log updated successfully' : 'Parts cost log created successfully');
      } else {
        showNotification('error', response?.message || 'Failed to save parts cost log');
      }
    } catch (error: any) {
      console.error('Error saving parts cost log:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while saving parts cost log');
    }
  };

  const handleEditParts = (item: PartsCostLogItem) => {
    setEditingParts(item);
    // Find the vehicle in fleet units to get the correct ID format
    const vehicleUnit = fleetUnits.find(u =>
      u._id === item.vehicleId ||
      u.internalId === item.vehicle ||
      u.unitNo === item.vehicle
    );

    setPartsFormData({
      partNumber: item.partNumber,
      description: item.description,
      unitCost: item.unitCost.toString(),
      quantity: item.quantity.toString(),
      dateOfUse: item.dateOfUse,
      vehicle: item.vehicle,
      vehicleId: vehicleUnit?._id || item.vehicleId || ''
    });
    setShowPartsModal(true);
  };

  const handleDeleteParts = (id: string) => {
    setItemToDelete({ id, type: 'parts' });
    setShowDeleteModal(true);
  };

  const resetPartsForm = () => {
    setPartsFormData({
      partNumber: '',
      description: '',
      unitCost: '',
      quantity: '',
      dateOfUse: new Date().toISOString().split('T')[0],
      vehicle: '',
      vehicleId: ''
    });
    setEditingParts(null);
  };

  // Labor Rates handlers
  const handleCreateLabor = async () => {
    try {
      const data = {
        rateType: laborFormData.rateType,
        description: laborFormData.description,
        rate: parseFloat(laborFormData.rate),
        isActive: laborFormData.isActive
      };

      const response = editingLabor?._id
        ? await updateLaborRate(editingLabor._id, data)
        : await createLaborRate(data);

      if (response?.success) {
        setShowLaborModal(false);
        resetLaborForm();
        await fetchLaborRates();
        await fetchStats();
        showNotification('success', editingLabor?._id ? 'Labor rate updated successfully' : 'Labor rate created successfully');
      } else {
        showNotification('error', response?.message || 'Failed to save labor rate');
      }
    } catch (error: any) {
      console.error('Error saving labor rate:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while saving labor rate');
    }
  };

  const handleEditLabor = (item: LaborRateItem) => {
    setEditingLabor(item);
    setLaborFormData({
      rateType: item.rateType,
      description: item.description,
      rate: item.rate.toString(),
      isActive: item.isActive
    });
    setShowLaborModal(true);
  };

  const handleDeleteLabor = (id: string) => {
    setItemToDelete({ id, type: 'labor' });
    setShowDeleteModal(true);
  };

  const resetLaborForm = () => {
    setLaborFormData({
      rateType: '',
      description: '',
      rate: '',
      isActive: true
    });
    setEditingLabor(null);
  };

  // Maintenance Plan handlers
  const handleCreatePlan = async () => {
    try {
      const data = {
        planName: planFormData.planName,
        vehicle: planFormData.vehicle,
        vehicleId: planFormData.vehicleId || undefined,
        plannedCost: parseFloat(planFormData.plannedCost),
        actualCost: planFormData.actualCost ? parseFloat(planFormData.actualCost) : 0,
        status: planFormData.status,
        plannedDate: planFormData.plannedDate || undefined,
        completedDate: planFormData.completedDate || undefined
      };

      const response = editingPlan?._id
        ? await updateMaintenancePlan(editingPlan._id, data)
        : await createMaintenancePlan(data);

      if (response?.success) {
        setShowPlanModal(false);
        resetPlanForm();
        await fetchMaintenancePlans();
        await fetchStats();
        showNotification('success', editingPlan?._id ? 'Maintenance plan updated successfully' : 'Maintenance plan created successfully');
      } else {
        showNotification('error', response?.message || 'Failed to save maintenance plan');
      }
    } catch (error: any) {
      console.error('Error saving maintenance plan:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while saving maintenance plan');
    }
  };

  const handleEditPlan = (item: MaintenancePlanItem) => {
    setEditingPlan(item);
    // Find the vehicle in fleet units to get the correct ID format
    const vehicleUnit = fleetUnits.find(u =>
      u._id === item.vehicleId ||
      u.internalId === item.vehicle ||
      u.unitNo === item.vehicle
    );

    setPlanFormData({
      planName: item.planName,
      vehicle: item.vehicle,
      vehicleId: vehicleUnit?._id || item.vehicleId || '',
      plannedCost: item.plannedCost.toString(),
      actualCost: item.actualCost.toString(),
      status: item.status,
      plannedDate: '',
      completedDate: ''
    });
    setShowPlanModal(true);
  };

  const handleDeletePlan = (id: string) => {
    setItemToDelete({ id, type: 'plan' });
    setShowDeleteModal(true);
  };

  const resetPlanForm = () => {
    setPlanFormData({
      planName: '',
      vehicle: '',
      vehicleId: '',
      plannedCost: '',
      actualCost: '',
      status: 'Scheduled',
      plannedDate: '',
      completedDate: ''
    });
    setEditingPlan(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      let response;
      if (itemToDelete.type === 'parts') {
        response = await deletePartsCostLog(itemToDelete.id);
        if (response?.success) {
          await fetchPartsCostLog();
          await fetchStats();
          showNotification('success', 'Parts cost log deleted successfully');
        }
      } else if (itemToDelete.type === 'labor') {
        response = await deleteLaborRate(itemToDelete.id);
        if (response?.success) {
          await fetchLaborRates();
          await fetchStats();
          showNotification('success', 'Labor rate deleted successfully');
        }
      } else if (itemToDelete.type === 'plan') {
        response = await deleteMaintenancePlan(itemToDelete.id);
        if (response?.success) {
          await fetchMaintenancePlans();
          await fetchStats();
          showNotification('success', 'Maintenance plan deleted successfully');
        }
      }

      if (!response?.success) {
        showNotification('error', response?.message || 'Failed to delete item');
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);
      showNotification('error', error?.response?.data?.message || 'An error occurred while deleting item');
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Toast notification helpers
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now();
    setNotifications((prev: ToastNotification[]) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev: ToastNotification[]) => prev.filter((n: ToastNotification) => n.id !== id));
  };


  // Summary Cards Data
  const summaryCards = [
    {
      title: 'Total Maintenance Cost',
      value: `$${stats.totalMaintenanceCost.toLocaleString()}`,
      change: stats.percentChange !== 0
        ? `${stats.percentChange > 0 ? '+' : ''}${stats.percentChange.toFixed(1)}% vs last month`
        : 'No previous data',
      icon: DollarSign,
      color: 'blue'
    },
    {
      title: 'Avg Cost Per Mile',
      value: `$${stats.avgCostPerMile.toFixed(2)}`,
      change: 'Fleet Average',
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Parts Inventory Value',
      value: `$${stats.partsInventoryValue.toLocaleString()}`,
      change: `${stats.partsInventoryCount || 0} items in stock`,
      icon: Package,
      color: 'purple'
    },
    {
      title: 'Pending PM Plans',
      value: stats.pendingPMPlans.toString(),
      change: 'Due this month',
      icon: AlertCircle,
      color: 'orange'
    }
  ];

  return (
    <div className="min-h-screen bg-[#EDF8FF]">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10000] space-y-2">
        {notifications.map(notification => (
          <ToastNotificationComponent
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
      {/* Header */}
      <div className='p-5'>
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold border-none" style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fleet & Maintenance Finance</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Financial reporting and tracking for maintenance operations, parts costs, and service expenses
                </p>
              </div>
              {activeTab === 'parts-cost-log' && (
                <button
                  onClick={() => {
                    resetPartsForm();
                    setShowPartsModal(true);
                  }}
                  className="px-4 py-2 !text-white rounded-lg transition-all flex items-center gap-2 hover:shadow-lg hover:scale-105 transform duration-200"
                  style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}
                >
                  <Plus className="w-4 h-4" />
                  New Parts Entry
                </button>
              )}
              {activeTab === 'labor-rates' && (
                <button
                  onClick={() => {
                    resetLaborForm();
                    setShowLaborModal(true);
                  }}
                  className="px-4 py-2 !text-white rounded-lg transition-all flex items-center gap-2 hover:shadow-lg hover:scale-105 transform duration-200"
                  style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}
                >
                  <Plus className="w-4 h-4" />
                  New Labor Rate
                </button>
              )}
              {activeTab === 'plan-financials' && (
                <button
                  onClick={() => {
                    resetPlanForm();
                    setShowPlanModal(true);
                  }}
                  className="px-4 py-2 !text-white rounded-lg transition-all flex items-center gap-2 hover:shadow-lg hover:scale-105 transform duration-200"
                  style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}
                >
                  <Plus className="w-4 h-4" />
                  New Maintenance Plan
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                      ? 'border-[#42aeec] text-[#016ab2]'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className={`rounded-xl shadow-sm border p-6 ${card.color === 'blue' ? 'bg-[#E3F2FD] border-blue-100' :
                card.color === 'green' ? 'bg-[#E8F5E9] border-green-100' :
                  card.color === 'purple' ? 'bg-[#F3E5F5] border-purple-100' :
                    'bg-[#FFF3E0] border-orange-100'
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-full bg-white">
                    <Icon className={`w-6 h-6 ${card.color === 'blue' ? 'text-[#42aeec]' :
                      card.color === 'green' ? 'text-[#0ea3d8]' :
                        card.color === 'purple' ? 'text-[#1db5f5]' :
                          'text-[#42aeec]'
                      }`} />
                  </div>
                  <span className={`text-sm font-medium ${card.color === 'blue' ? 'text-[#063f6f]' :
                    card.color === 'green' ? 'text-[#063f6f]' :
                      'text-[#063f6f]'
                    }`}>{card.change}</span>
                </div>
                <h3 className="text-[#063f6f] text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-[#016ab2]">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
              <button className="px-4 py-2 text-sm !text-white rounded-lg transition-all flex items-center gap-2 hover:shadow-lg hover:scale-105 transform duration-200" style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}>
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>

          {loading && (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          )}

          {/* Maintenance Expense Summary */}
          {activeTab === 'expense-summary' && !loading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Maintenance Expense</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost per Mile/KM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breakdown by Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top 5 Expense Types</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenseSummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No data available</td>
                    </tr>
                  ) : (
                    expenseSummary.map((expense, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{expense.vehicle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${expense.totalExpense.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${expense.costPerMile.toFixed(2)}/mi</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{expense.breakdown}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {expense.topExpenses.map((type, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                {type}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                              <FileText className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Download Report">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Parts Cost Log */}
          {activeTab === 'parts-cost-log' && !loading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Use</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {partsCostLog.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">No parts cost log entries</td>
                    </tr>
                  ) : (
                    partsCostLog.map((part) => (
                      <tr key={part._id || part.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{part.partNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{part.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${part.unitCost.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${(part.totalCost || (part.unitCost * part.quantity)).toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.dateOfUse}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {part.vehicle}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditParts(part)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteParts(part._id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Shop Labor Rate Setup */}
          {activeTab === 'labor-rates' && !loading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate (per hour)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {laborRates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No labor rates configured</td>
                    </tr>
                  ) : (
                    laborRates.map((rate) => (
                      <tr key={rate._id || rate.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rate.rateType}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{rate.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${rate.rate.toFixed(2)}/hr</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${rate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {rate.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEditLabor(rate)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteLabor(rate._id!)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Maintenance Plan Financials */}
          {activeTab === 'plan-financials' && !loading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {maintenancePlans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No maintenance plans</td>
                    </tr>
                  ) : (
                    maintenancePlans.map((plan) => (
                      <tr key={plan._id || plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{plan.planName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{plan.vehicle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${plan.plannedCost.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {plan.actualCost > 0 ? `$${plan.actualCost.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {plan.variance !== 0 ? (
                            <span className={`font-semibold ${plan.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {plan.variance > 0 ? '+' : ''}${plan.variance.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            plan.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {plan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Report">
                              <FileText className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEditPlan(plan)} className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeletePlan(plan._id!)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Parts Cost Log Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingParts ? 'Edit Parts Cost Log Entry' : 'New Parts Cost Log Entry'}
              </h2>
              <button onClick={() => {
                setShowPartsModal(false);
                resetPartsForm();
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                <input
                  type="text"
                  value={partsFormData.partNumber}
                  onChange={(e) => setPartsFormData({ ...partsFormData, partNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={partsFormData.description}
                  onChange={(e) => setPartsFormData({ ...partsFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={partsFormData.unitCost}
                    onChange={(e) => setPartsFormData({ ...partsFormData, unitCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={partsFormData.quantity}
                    onChange={(e) => setPartsFormData({ ...partsFormData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Use</label>
                <input
                  type="date"
                  value={partsFormData.dateOfUse}
                  onChange={(e) => setPartsFormData({ ...partsFormData, dateOfUse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Assigned To</label>
                <select
                  value={partsFormData.vehicleId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    // Find unit by _id
                    const selected = fleetUnits.find(u => u._id === selectedId);

                    if (selected) {
                      // Use the actual unit identifier (internalId or unitNo) for display
                      const displayValue = selected.internalId || selected.unitNo || selected._id;

                      setPartsFormData({
                        ...partsFormData,
                        vehicle: displayValue,
                        vehicleId: selected._id
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {fleetUnits.map(unit => {
                    const displayName = unit.internalId || unit.unitNo || unit._id;
                    const displayText = `${displayName}${unit.makeModel ? ` - ${unit.makeModel}` : ''}`;
                    return (
                      <option key={unit._id} value={unit._id}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPartsModal(false);
                    resetPartsForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateParts}
                  style={{
                    background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                  }}
                  className="px-4 py-2  !text-white rounded-lg transition-colors"
                >
                  {editingParts ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Labor Rate Modal */}
      {showLaborModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLabor ? 'Edit Labor Rate' : 'New Labor Rate'}
              </h2>
              <button onClick={() => {
                setShowLaborModal(false);
                resetLaborForm();
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Type</label>
                <input
                  type="text"
                  value={laborFormData.rateType}
                  onChange={(e) => setLaborFormData({ ...laborFormData, rateType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={laborFormData.description}
                  onChange={(e) => setLaborFormData({ ...laborFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate (per hour)</label>
                <input
                  type="number"
                  step="0.01"
                  value={laborFormData.rate}
                  onChange={(e) => setLaborFormData({ ...laborFormData, rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={laborFormData.isActive}
                    onChange={(e) => setLaborFormData({ ...laborFormData, isActive: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowLaborModal(false);
                    resetLaborForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLabor}
                  style={{
                    background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                  }}
                  className="px-4 py-2  !text-white rounded-lg  transition-colors"
                >
                  {editingLabor ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPlan ? 'Edit Maintenance Plan' : 'New Maintenance Plan'}
              </h2>
              <button onClick={() => {
                setShowPlanModal(false);
                resetPlanForm();
              }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={planFormData.planName}
                  onChange={(e) => setPlanFormData({ ...planFormData, planName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={planFormData.vehicleId || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    // Find unit by _id
                    const selected = fleetUnits.find(u => u._id === selectedId);

                    if (selected) {
                      // Use the actual unit identifier (internalId or unitNo) for display
                      const displayValue = selected.internalId || selected.unitNo || selected._id;

                      setPlanFormData({
                        ...planFormData,
                        vehicle: displayValue,
                        vehicleId: selected._id
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Vehicle</option>
                  {fleetUnits.map(unit => {
                    const displayName = unit.internalId || unit.unitNo || unit._id;
                    const displayText = `${displayName}${unit.makeModel ? ` - ${unit.makeModel}` : ''}`;
                    return (
                      <option key={unit._id} value={unit._id}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Planned Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={planFormData.plannedCost}
                    onChange={(e) => setPlanFormData({ ...planFormData, plannedCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={planFormData.actualCost}
                    onChange={(e) => setPlanFormData({ ...planFormData, actualCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={planFormData.status}
                  onChange={(e) => setPlanFormData({ ...planFormData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowPlanModal(false);
                    resetPlanForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  style={{
                    background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                  }}
                  className="px-4 py-2 !text-white rounded-lg  transition-colors"
                >
                  {editingPlan ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 !text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
