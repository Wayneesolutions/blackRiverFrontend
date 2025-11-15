import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  Grid3x3,
  List,
  Star,
  Copy,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { message, Modal, Input, Select, Button, Switch, Tag, Tooltip, Dropdown } from 'antd';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '../../../axios/api/superadmin';

interface Plan {
  _id: string;
  planName: string;
  planType: 'lifetime' | 'monthly';
  description: string;
  lifetime?: {
    oneTime: {
      price: number;
      currency: string;
    };
    installments: {
      threeMonths: {
        price: number;
        currency: string;
        enabled: boolean;
      };
      sixMonths: {
        price: number;
        currency: string;
        enabled: boolean;
      };
    };
  };
  monthly?: {
    fullApp: {
      price: number;
      currency: string;
      enabled: boolean;
    };
  };
  features?: Array<{ name: string; included: boolean }>;
  status: 'active' | 'inactive';
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'active' | 'inactive' | 'lifetime' | 'monthly' | 'default';
type SortType = 'name' | 'price' | 'created' | 'status';

const createDefaultMonthly = () => ({
  fullApp: { price: 699, currency: 'CAD', enabled: true }
});

const Billing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deletePlanName, setDeletePlanName] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    planName: '',
    planType: 'lifetime' as 'lifetime' | 'monthly',
    description: '',
    lifetime: {
      oneTime: { price: 17999, currency: 'CAD' },
      installments: {
        threeMonths: { price: 6200, currency: 'CAD', enabled: true },
        sixMonths: { price: 3150, currency: 'CAD', enabled: true }
      }
    },
    monthly: createDefaultMonthly(),
    features: [] as Array<{ name: string; included: boolean }>,
    status: 'active' as 'active' | 'inactive',
    isDefault: false
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await getAllPlans();
      console.log('Plans API Response:', response);
      if (response?.success) {
        setPlans(response.data || []);
        console.log('Plans loaded:', response.data?.length || 0);
      } else {
        console.error('Failed to fetch plans:', response);
        message.error(response?.message || 'Failed to fetch plans');
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      console.error('Error details:', error?.response?.data || error);
      message.error(error?.response?.data?.message || error?.message || 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.status === 'active').length,
    lifetimePlans: plans.filter(p => p.planType === 'lifetime').length,
    monthlyPlans: plans.filter(p => p.planType === 'monthly').length,
    defaultPlan: plans.find(p => p.isDefault) || null,
  };

  // Filter and sort plans
  const filteredAndSortedPlans = plans
    .filter(plan => {
      // Search filter
      if (searchTerm && !plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !plan.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filterType === 'active' && plan.status !== 'active') return false;
      if (filterType === 'inactive' && plan.status !== 'inactive') return false;
      if (filterType === 'lifetime' && plan.planType !== 'lifetime') return false;
      if (filterType === 'monthly' && plan.planType !== 'monthly') return false;
      if (filterType === 'default' && !plan.isDefault) return false;
      
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortType) {
        case 'name':
          comparison = a.planName.localeCompare(b.planName);
          break;
        case 'price':
          const priceA = a.planType === 'lifetime' 
            ? (a.lifetime?.oneTime.price || 0)
            : (a.monthly?.fullApp.price || 0);
          const priceB = b.planType === 'lifetime'
            ? (b.lifetime?.oneTime.price || 0)
            : (b.monthly?.fullApp.price || 0);
          comparison = priceA - priceB;
          break;
        case 'created':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const resetForm = () => {
    setFormData({
      planName: '',
      planType: 'lifetime',
      description: '',
      lifetime: {
        oneTime: { price: 17999, currency: 'CAD' },
        installments: {
          threeMonths: { price: 6200, currency: 'CAD', enabled: true },
          sixMonths: { price: 3150, currency: 'CAD', enabled: true }
        }
      },
      monthly: createDefaultMonthly(),
      features: [],
      status: 'active',
      isDefault: false
    });
    setSelectedPlan(null);
  };

  const handleCreate = async () => {
    try {
      if (!formData.planName) {
        message.error('Plan name is required');
        return;
      }

      const response = await createPlan(formData);
      if (response?.success) {
        message.success(response.message || 'Plan created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchPlans();
      } else {
        message.error(response?.message || 'Failed to create plan');
      }
    } catch (error: any) {
      console.error('Error creating plan:', error);
      message.error(error?.message || 'Failed to create plan');
    }
  };

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData({
      planName: plan.planName,
      planType: plan.planType,
      description: plan.description || '',
      lifetime: plan.lifetime || {
        oneTime: { price: 17999, currency: 'CAD' },
        installments: {
          threeMonths: { price: 6200, currency: 'CAD', enabled: true },
          sixMonths: { price: 3150, currency: 'CAD', enabled: true }
        }
      },
      monthly: plan.monthly?.fullApp
        ? {
            fullApp: {
              price: plan.monthly.fullApp.price ?? 0,
              currency: plan.monthly.fullApp.currency ?? 'CAD',
              enabled: plan.monthly.fullApp.enabled ?? true,
            },
          }
        : createDefaultMonthly(),
      features: plan.features || [],
      status: plan.status,
      isDefault: plan.isDefault
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedPlan) return;

    try {
      if (!formData.planName) {
        message.error('Plan name is required');
        return;
      }

      const response = await updatePlan(selectedPlan._id, formData);
      if (response?.success) {
        message.success(response.message || 'Plan updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchPlans();
      } else {
        message.error(response?.message || 'Failed to update plan');
      }
    } catch (error: any) {
      console.error('Error updating plan:', error);
      message.error(error?.message || 'Failed to update plan');
    }
  };

  const handleDelete = (plan: Plan) => {
    setDeletePlanId(plan._id);
    setDeletePlanName(plan.planName);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletePlanId) return;

    setDeleting(true);
    try {
      const response = await deletePlan(deletePlanId);
      if (response?.success) {
        message.success(response.message || 'Plan deleted successfully');
        setShowDeleteModal(false);
        setDeletePlanId(null);
        setDeletePlanName('');
        fetchPlans();
      } else {
        message.error(response?.message || 'Failed to delete plan');
      }
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete plan';
      message.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleView = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const handleDuplicate = async (plan: Plan) => {
    try {
      setFormData({
        planName: `${plan.planName} (Copy)`,
        planType: plan.planType,
        description: plan.description || '',
      lifetime: plan.lifetime || {
        oneTime: { price: 17999, currency: 'CAD' },
        installments: {
          threeMonths: { price: 6200, currency: 'CAD', enabled: true },
          sixMonths: { price: 3150, currency: 'CAD', enabled: true }
        }
      },
      monthly: plan.monthly?.fullApp
        ? {
            fullApp: {
              price: plan.monthly.fullApp.price ?? 0,
              currency: plan.monthly.fullApp.currency ?? 'CAD',
              enabled: plan.monthly.fullApp.enabled ?? true,
            },
          }
        : createDefaultMonthly(),
        features: plan.features || [],
        status: 'inactive',
        isDefault: false
      });
      setShowCreateModal(true);
    } catch (error: any) {
      message.error('Failed to duplicate plan');
    }
  };

  const formatPrice = (price: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getPlanGradient = (plan: Plan) => {
    if (plan.isDefault) return 'from-purple-500 to-indigo-600';
    if (plan.planType === 'lifetime') return 'from-blue-500 to-cyan-600';
    return 'from-green-500 to-emerald-600';
  };

  const toggleSort = (type: SortType) => {
    if (sortType === type) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(type);
      setSortDirection('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <div className="relative">
              <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
                  <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
                </div>
              Plan Management
            </h1>
              <p className="text-gray-600 mt-2">Create, manage, and optimize pricing plans for your customers</p>
          </div>
            <div className="flex items-center gap-3">
              <Button
                icon={<BarChart3 className="w-4 h-4" />}
                onClick={() => {
                  setShowCompareModal(true);
                  if (selectedPlans.length === 0 && plans.length >= 2) {
                    // Auto-select first two plans if none selected
                    setSelectedPlans(plans.slice(0, 2).map(p => p._id));
                  }
                }}
              >
                Compare Plans
              </Button>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 hover:from-purple-700 hover:to-indigo-700 shadow-lg"
                size="large"
          >
            Create Plan
          </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Total Plans</p>
                  <p className="text-2xl font-bold">{stats.totalPlans}</p>
                </div>
                <CreditCard className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Active Plans</p>
                  <p className="text-2xl font-bold">{stats.activePlans}</p>
                </div>
                <CheckCircle className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Lifetime</p>
                  <p className="text-2xl font-bold">{stats.lifetimePlans}</p>
                </div>
                <Zap className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Monthly</p>
                  <p className="text-2xl font-bold">{stats.monthlyPlans}</p>
                </div>
                <Calendar className="w-8 h-8 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Default</p>
                  <p className="text-2xl font-bold">{stats.defaultPlan ? '1' : '0'}</p>
                </div>
                <Star className="w-8 h-8 opacity-80" />
              </div>
            </div>
          </div>

          {/* Search, Filter, and View Controls */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search plans by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
                size="large"
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filterType}
                onChange={setFilterType}
                className="w-40"
                size="large"
              >
                <Select.Option value="all">All Plans</Select.Option>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
                <Select.Option value="lifetime">Lifetime</Select.Option>
                <Select.Option value="monthly">Monthly</Select.Option>
                <Select.Option value="default">Default</Select.Option>
              </Select>

              <Dropdown
                menu={{
                  items: [
                    { key: 'name', label: 'Sort by Name', onClick: () => toggleSort('name') },
                    { key: 'price', label: 'Sort by Price', onClick: () => toggleSort('price') },
                    { key: 'created', label: 'Sort by Created', onClick: () => toggleSort('created') },
                    { key: 'status', label: 'Sort by Status', onClick: () => toggleSort('status') },
                  ]
                }}
                trigger={['click']}
              >
                <Button icon={<ArrowUpDown className="w-4 h-4" />} size="large">
                  Sort
                </Button>
              </Dropdown>

              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<Grid3x3 className="w-4 h-4" />}
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-purple-600' : ''}
                />
                <Button
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<List className="w-4 h-4" />}
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-purple-600' : ''}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Plans Display */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredAndSortedPlans.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <CreditCard className="w-20 h-20 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No plans found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first pricing plan to get started'}
            </p>
            {(!searchTerm && filterType === 'all') && (
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0"
                size="large"
            >
              Create Plan
            </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPlans.map((plan) => (
              <div
                key={plan._id}
                className={`bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  plan.isDefault ? 'border-purple-300 ring-2 ring-purple-200' : 'border-gray-200'
                }`}
              >
                {/* Header with Gradient */}
                <div className={`bg-gradient-to-r ${getPlanGradient(plan)} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold">{plan.planName}</h3>
                        {plan.isDefault && (
                        <Tooltip title="Default Plan">
                          <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-gray-900 border border-white shadow-md">
                        {plan.planType === 'lifetime' ? 'Lifetime' : 'Monthly'}
                      </span>
                      <span className={`bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-gray-900 border border-white shadow-md capitalize ${
                        plan.status === 'active' ? '' : 'opacity-75'
                      }`}>
                          {plan.status}
                      </span>
                      </div>
                    </div>
                  </div>

                <div className="p-6">
                  {/* Pricing */}
                  {plan.planType === 'lifetime' && plan.lifetime && (
                    <div className="space-y-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
                        <div className="text-xs text-gray-600 mb-1">One-time Payment</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(plan.lifetime.oneTime.price, plan.lifetime.oneTime.currency)}
                      </div>
                      </div>
                      {(plan.lifetime.installments.threeMonths.enabled || plan.lifetime.installments.sixMonths.enabled) && (
                        <div className="text-sm text-gray-600 space-y-1">
                      {plan.lifetime.installments.threeMonths.enabled && (
                            <div className="flex justify-between">
                              <span>3 installments:</span>
                              <span className="font-semibold">
                            {formatPrice(plan.lifetime.installments.threeMonths.price, plan.lifetime.installments.threeMonths.currency)}/mo
                          </span>
                        </div>
                      )}
                      {plan.lifetime.installments.sixMonths.enabled && (
                            <div className="flex justify-between">
                              <span>6 installments:</span>
                              <span className="font-semibold">
                            {formatPrice(plan.lifetime.installments.sixMonths.price, plan.lifetime.installments.sixMonths.currency)}/mo
                          </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {plan.planType === 'monthly' && plan.monthly && (
                    <div className="space-y-3 mb-4">
                      {plan.monthly.fullApp.enabled && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                          <div className="text-xs text-gray-600 mb-1">Monthly Price</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {formatPrice(plan.monthly.fullApp.price, plan.monthly.fullApp.currency)}<span className="text-sm font-normal text-gray-600">/mo</span>
                          </div>
                        </div>
                      )}
                  
                    </div>
                  )}

                  {plan.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <Tooltip title="View Details">
                    <Button
                      type="text"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => handleView(plan)}
                        className="flex-1"
                    >
                      View
                    </Button>
                    </Tooltip>
                    <Tooltip title="Edit Plan">
                    <Button
                      type="text"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => handleEdit(plan)}
                        className="flex-1"
                    >
                      Edit
                    </Button>
                    </Tooltip>
                    <Tooltip title="Duplicate Plan">
                      <Button
                        type="text"
                        icon={<Copy className="w-4 h-4" />}
                        onClick={() => handleDuplicate(plan)}
                        className="flex-1"
                      />
                    </Tooltip>
                    <Tooltip title="Delete Plan">
                    <Button
                      type="text"
                      danger
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(plan);
                      }}
                      className="flex-1"
                    />
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredAndSortedPlans.map((plan) => (
                <div
                  key={plan._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{plan.planName}</h3>
                        {plan.isDefault && <Tag color="purple" icon={<Star className="w-3 h-3" />}>Default</Tag>}
                        <Tag color={plan.planType === 'lifetime' ? 'blue' : 'green'}>
                          {plan.planType === 'lifetime' ? 'Lifetime' : 'Monthly'}
                        </Tag>
                        <Tag color={plan.status === 'active' ? 'success' : 'default'}>
                          {plan.status}
                        </Tag>
                  </div>
                      {plan.description && (
                        <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                      )}
                      
                      <div className="flex items-center gap-6 text-sm">
                        {plan.planType === 'lifetime' && plan.lifetime && (
                          <div>
                            <span className="text-gray-600">One-time: </span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(plan.lifetime.oneTime.price, plan.lifetime.oneTime.currency)}
                            </span>
                          </div>
                        )}
                        {plan.planType === 'monthly' && plan.monthly?.fullApp && (
                          <div>
                            <span className="text-gray-600">Monthly Price: </span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(plan.monthly.fullApp.price, plan.monthly.fullApp.currency)}/mo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button icon={<Eye className="w-4 h-4" />} onClick={() => handleView(plan)}>View</Button>
                      <Button icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(plan)}>Edit</Button>
                      <Button icon={<Copy className="w-4 h-4" />} onClick={() => handleDuplicate(plan)}>Duplicate</Button>
                      <Button 
                        danger 
                        icon={<Trash2 className="w-4 h-4" />} 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(plan);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      <Modal
        title="Create New Plan"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        footer={null}
        width={800}
      >
        <div className="space-y-6 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
            <Input
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              placeholder="Enter plan name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type *</label>
            <Select
              value={formData.planType}
              onChange={(value) => {
                setFormData({ ...formData, planType: value });
              }}
              className="w-full"
            >
              <Select.Option value="lifetime">Lifetime</Select.Option>
              <Select.Option value="monthly">Monthly</Select.Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Input.TextArea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter plan description"
              rows={3}
            />
          </div>

          {formData.planType === 'lifetime' && (
            <div className="space-y-4 border p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Lifetime Pricing</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">One-time Price (CAD) *</label>
                <Input
                  type="number"
                  value={formData.lifetime.oneTime.price}
                  onChange={(e) => setFormData({
                    ...formData,
                    lifetime: {
                      ...formData.lifetime,
                      oneTime: {
                        ...formData.lifetime.oneTime,
                        price: parseFloat(e.target.value) || 0
                      }
                    }
                  })}
                  placeholder="17999"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">3 Installments</label>
                  <Switch
                    checked={formData.lifetime.installments.threeMonths.enabled}
                    onChange={(checked) => setFormData({
                      ...formData,
                      lifetime: {
                        ...formData.lifetime,
                        installments: {
                          ...formData.lifetime.installments,
                          threeMonths: {
                            ...formData.lifetime.installments.threeMonths,
                            enabled: checked
                          }
                        }
                      }
                    })}
                  />
                </div>
                {formData.lifetime.installments.threeMonths.enabled && (
                  <Input
                    type="number"
                    value={formData.lifetime.installments.threeMonths.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      lifetime: {
                        ...formData.lifetime,
                        installments: {
                          ...formData.lifetime.installments,
                          threeMonths: {
                            ...formData.lifetime.installments.threeMonths,
                            price: parseFloat(e.target.value) || 0
                          }
                        }
                      }
                    })}
                    placeholder="6200"
                    addonAfter="CAD/month"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">6 Installments</label>
                  <Switch
                    checked={formData.lifetime.installments.sixMonths.enabled}
                    onChange={(checked) => setFormData({
                      ...formData,
                      lifetime: {
                        ...formData.lifetime,
                        installments: {
                          ...formData.lifetime.installments,
                          sixMonths: {
                            ...formData.lifetime.installments.sixMonths,
                            enabled: checked
                          }
                        }
                      }
                    })}
                  />
                </div>
                {formData.lifetime.installments.sixMonths.enabled && (
                  <Input
                    type="number"
                    value={formData.lifetime.installments.sixMonths.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      lifetime: {
                        ...formData.lifetime,
                        installments: {
                          ...formData.lifetime.installments,
                          sixMonths: {
                            ...formData.lifetime.installments.sixMonths,
                            price: parseFloat(e.target.value) || 0
                          }
                        }
                      }
                    })}
                    placeholder="3150"
                    addonAfter="CAD/month"
                  />
                )}
              </div>
            </div>
          )}

          {formData.planType === 'monthly' && (
            <div className="space-y-4 border p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Monthly Pricing</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Price (CAD) *</label>
                <Input
                  type="number"
                  value={formData.monthly.fullApp.price}
                  onChange={(e) => setFormData({
                    ...formData,
                    monthly: {
                      ...formData.monthly,
                      fullApp: {
                        ...formData.monthly.fullApp,
                        price: parseFloat(e.target.value) || 0,
                        enabled: true
                      }
                    }
                  })}
                  placeholder="699"
                  addonAfter="CAD/month"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                className="w-32"
              >
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Set as Default</label>
              <Switch
                checked={formData.isDefault}
                onChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
              Create Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        title="Edit Plan"
        open={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          resetForm();
        }}
        footer={null}
        width={800}
      >
        <div className="space-y-6 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
            <Input
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              placeholder="Enter plan name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type *</label>
            <Select
              value={formData.planType}
              onChange={(value) => {
                setFormData({ ...formData, planType: value });
              }}
              className="w-full"
            >
              <Select.Option value="lifetime">Lifetime</Select.Option>
              <Select.Option value="monthly">Monthly</Select.Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Input.TextArea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter plan description"
              rows={3}
            />
          </div>

          {formData.planType === 'lifetime' && (
            <div className="space-y-4 border p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Lifetime Pricing</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">One-time Price (CAD) *</label>
                <Input
                  type="number"
                  value={formData.lifetime.oneTime.price}
                  onChange={(e) => setFormData({
                    ...formData,
                    lifetime: {
                      ...formData.lifetime,
                      oneTime: {
                        ...formData.lifetime.oneTime,
                        price: parseFloat(e.target.value) || 0
                      }
                    }
                  })}
                  placeholder="17999"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">3 Installments</label>
                  <Switch
                    checked={formData.lifetime.installments.threeMonths.enabled}
                    onChange={(checked) => setFormData({
                      ...formData,
                      lifetime: {
                        ...formData.lifetime,
                        installments: {
                          ...formData.lifetime.installments,
                          threeMonths: {
                            ...formData.lifetime.installments.threeMonths,
                            enabled: checked
                          }
                        }
                      }
                    })}
                  />
                </div>
                {formData.lifetime.installments.threeMonths.enabled && (
                  <Input
                    type="number"
                    value={formData.lifetime.installments.threeMonths.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      lifetime: {
                        ...formData.lifetime,
                        installments: {
                          ...formData.lifetime.installments,
                          threeMonths: {
                            ...formData.lifetime.installments.threeMonths,
                            price: parseFloat(e.target.value) || 0
                          }
                        }
                      }
                    })}
                    placeholder="6200"
                    addonAfter="CAD/month"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">6 Installments</label>
                  <Switch
                    checked={formData.lifetime.installments.sixMonths.enabled}
                    onChange={(checked) => setFormData({
                      ...formData,
                      lifetime: {
                        ...formData.lifetime,
                        installments: {
                          ...formData.lifetime.installments,
                          sixMonths: {
                            ...formData.lifetime.installments.sixMonths,
                            enabled: checked
                          }
                        }
                      }
                    })}
                  />
                </div>
                {formData.lifetime.installments.sixMonths.enabled && (
                  <Input
                    type="number"
                    value={formData.lifetime.installments.sixMonths.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      lifetime: {
                        ...formData.lifetime,
                        installments: {
                          ...formData.lifetime.installments,
                          sixMonths: {
                            ...formData.lifetime.installments.sixMonths,
                            price: parseFloat(e.target.value) || 0
                          }
                        }
                      }
                    })}
                    placeholder="3150"
                    addonAfter="CAD/month"
                  />
                )}
              </div>
            </div>
          )}

          {formData.planType === 'monthly' && (
            <div className="space-y-4 border p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Monthly Pricing</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Price (CAD) *</label>
                <Input
                  type="number"
                  value={formData.monthly.fullApp.price}
                  onChange={(e) => setFormData({
                    ...formData,
                    monthly: {
                      ...formData.monthly,
                      fullApp: {
                        ...formData.monthly.fullApp,
                        price: parseFloat(e.target.value) || 0,
                        enabled: true
                      }
                    }
                  })}
                  placeholder="699"
                  addonAfter="CAD/month"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <Select
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                className="w-32"
              >
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Set as Default</label>
              <Switch
                checked={formData.isDefault}
                onChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button onClick={() => {
              setShowEditModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleUpdate} className="bg-purple-600 hover:bg-purple-700">
              Update Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Plan Modal */}
      {showViewModal && selectedPlan && (
        <Modal
          title={
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedPlan.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-xl font-bold">{selectedPlan.planName}</span>
              {selectedPlan.isDefault && (
                <Tag color="purple" icon={<Star className="w-3 h-3" />}>Default</Tag>
              )}
            </div>
          }
          open={showViewModal}
          onCancel={() => setShowViewModal(false)}
          footer={[
            <Button key="close" onClick={() => setShowViewModal(false)}>Close</Button>,
            <Button 
              key="edit" 
              type="primary" 
              onClick={() => {
              setShowViewModal(false);
              handleEdit(selectedPlan);
              }} 
              className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 hover:from-purple-700 hover:to-indigo-700"
              icon={<Edit className="w-4 h-4" />}
            >
              Edit Plan
            </Button>
          ]}
          width={700}
        >
          <div className="space-y-6 py-4">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm text-gray-600 mb-1">Plan Type</p>
                  <Tag color={selectedPlan.planType === 'lifetime' ? 'blue' : 'green'} className="text-sm">
                    {selectedPlan.planType === 'lifetime' ? 'Lifetime Plan' : 'Monthly Plan'}
                  </Tag>
            </div>
            <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Tag color={selectedPlan.status === 'active' ? 'success' : 'default'} className="text-sm">
                    {selectedPlan.status === 'active' ? 'Active' : 'Inactive'}
              </Tag>
            </div>
                {selectedPlan.createdAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedPlan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedPlan.description && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-900 leading-relaxed">{selectedPlan.description}</p>
                </div>
              </div>
            )}

            {/* Pricing Section */}
            {selectedPlan.planType === 'lifetime' && selectedPlan.lifetime && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  Lifetime Pricing Options
                </h4>
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                  <div>
                        <p className="text-sm text-gray-600 mb-1">One-time Payment</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {formatPrice(selectedPlan.lifetime.oneTime.price, selectedPlan.lifetime.oneTime.currency)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Best value - Pay once, own forever</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  {selectedPlan.lifetime.installments.threeMonths.enabled && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                    <div>
                          <p className="text-sm font-medium text-gray-700">3 Monthly Installments</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            {formatPrice(selectedPlan.lifetime.installments.threeMonths.price, selectedPlan.lifetime.installments.threeMonths.currency)}
                            <span className="text-sm font-normal text-gray-600">/month</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Total: {formatPrice(selectedPlan.lifetime.installments.threeMonths.price * 3, selectedPlan.lifetime.installments.threeMonths.currency)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedPlan.lifetime.installments.sixMonths.enabled && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                    <div>
                          <p className="text-sm font-medium text-gray-700">6 Monthly Installments</p>
                          <p className="text-xl font-bold text-gray-900 mt-1">
                            {formatPrice(selectedPlan.lifetime.installments.sixMonths.price, selectedPlan.lifetime.installments.sixMonths.currency)}
                            <span className="text-sm font-normal text-gray-600">/month</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Total: {formatPrice(selectedPlan.lifetime.installments.sixMonths.price * 6, selectedPlan.lifetime.installments.sixMonths.currency)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedPlan.planType === 'monthly' && selectedPlan.monthly && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Monthly Pricing Options
                </h4>
                <div className="space-y-3">
                  {selectedPlan.monthly.fullApp.enabled && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
                      <div className="flex items-center justify-between">
                    <div>
                          <p className="text-sm text-gray-600 mb-1">Monthly Pricing</p>
                          <p className="text-3xl font-bold text-gray-900">
                            {formatPrice(selectedPlan.monthly.fullApp.price, selectedPlan.monthly.fullApp.currency)}
                            <span className="text-lg font-normal text-gray-600">/month</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Includes all features</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Compare Plans Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>Compare Plans</span>
          </div>
        }
        open={showCompareModal}
        onCancel={() => {
          setShowCompareModal(false);
          setSelectedPlans([]);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowCompareModal(false);
            setSelectedPlans([]);
          }}>
            Close
          </Button>
        ]}
        width={1000}
      >
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">Select plans to compare (select at least 2 plans):</p>
            <div className="flex flex-wrap gap-2">
              {plans.map((plan) => (
                <Button
                  key={plan._id}
                  type={selectedPlans.includes(plan._id) ? 'primary' : 'default'}
                  onClick={() => {
                    if (selectedPlans.includes(plan._id)) {
                      setSelectedPlans(selectedPlans.filter(id => id !== plan._id));
                    } else {
                      setSelectedPlans([...selectedPlans, plan._id]);
                    }
                  }}
                  className={selectedPlans.includes(plan._id) ? 'bg-purple-600' : ''}
                >
                  {plan.planName}
                </Button>
              ))}
            </div>
          </div>
          
          {selectedPlans.length >= 2 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">Feature</th>
                    {selectedPlans.map(planId => {
                      const plan = plans.find(p => p._id === planId);
                      return plan ? (
                        <th key={planId} className="text-center p-3 font-semibold text-gray-700">
                          <div className="flex flex-col items-center gap-1">
                            <span>{plan.planName}</span>
                            <Tag color={plan.planType === 'lifetime' ? 'blue' : 'green'}>
                              {plan.planType === 'lifetime' ? 'Lifetime' : 'Monthly'}
                </Tag>
              </div>
                        </th>
                      ) : null;
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-700">Plan Type</td>
                    {selectedPlans.map(planId => {
                      const plan = plans.find(p => p._id === planId);
                      return plan ? (
                        <td key={planId} className="text-center p-3">
                          <Tag color={plan.planType === 'lifetime' ? 'blue' : 'green'}>
                            {plan.planType === 'lifetime' ? 'Lifetime' : 'Monthly'}
                          </Tag>
                        </td>
                      ) : null;
                    })}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-700">Status</td>
                    {selectedPlans.map(planId => {
                      const plan = plans.find(p => p._id === planId);
                      return plan ? (
                        <td key={planId} className="text-center p-3">
                          <Tag color={plan.status === 'active' ? 'success' : 'default'}>
                            {plan.status}
                          </Tag>
                        </td>
                      ) : null;
                    })}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-700">Default Plan</td>
                    {selectedPlans.map(planId => {
                      const plan = plans.find(p => p._id === planId);
                      return plan ? (
                        <td key={planId} className="text-center p-3">
                          {plan.isDefault ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}
                        </td>
                      ) : null;
                    })}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-700">One-time Price</td>
                    {selectedPlans.map(planId => {
                      const plan = plans.find(p => p._id === planId);
                      return plan ? (
                        <td key={planId} className="text-center p-3 font-semibold text-gray-900">
                          {plan.planType === 'lifetime' && plan.lifetime
                            ? formatPrice(plan.lifetime.oneTime.price, plan.lifetime.oneTime.currency)
                            : 'N/A'}
                        </td>
                      ) : null;
                    })}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-700">Monthly Price</td>
                    {selectedPlans.map(planId => {
                      const plan = plans.find(p => p._id === planId);
                      return plan ? (
                        <td key={planId} className="text-center p-3 font-semibold text-gray-900">
                          {plan.planType === 'monthly' && plan.monthly?.fullApp.enabled
                            ? formatPrice(plan.monthly.fullApp.price, plan.monthly.fullApp.currency) + '/mo'
                            : plan.planType === 'lifetime'
                            ? 'N/A'
                            : 'N/A'}
                        </td>
                      ) : null;
                    })}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-700">Description</td>
                    {selectedPlans.map(planId => {
                      const plan = plans.find(p => p._id === planId);
                      return plan ? (
                        <td key={planId} className="text-center p-3 text-sm text-gray-600">
                          {plan.description || 'No description'}
                        </td>
                      ) : null;
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          {selectedPlans.length < 2 && (
            <div className="text-center py-8 text-gray-500">
              Please select at least 2 plans to compare
            </div>
          )}
          </div>
        </Modal>

      {/* Delete Plan Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <span>Delete Plan</span>
          </div>
        }
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletePlanId(null);
          setDeletePlanName('');
        }}
        footer={[
          <Button 
            key="cancel"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletePlanId(null);
              setDeletePlanName('');
            }}
            disabled={deleting}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={confirmDelete}
            loading={deleting}
            className="bg-red-600 hover:bg-red-700 border-red-600"
          >
            {deleting ? 'Deleting...' : 'Delete Plan'}
          </Button>
        ]}
        width={500}
      >
        <div className="py-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Are you sure you want to delete this plan?
              </h3>
              <p className="text-gray-600 mb-4">
                You are about to delete the plan <span className="font-semibold text-gray-900">"{deletePlanName}"</span>. 
                This action cannot be undone.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> If this plan is associated with any active subscriptions, 
                  you may need to update those subscriptions before deleting this plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Billing;
