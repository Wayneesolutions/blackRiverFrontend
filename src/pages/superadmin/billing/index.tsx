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
  TrendingUp,
} from 'lucide-react';
import { message, Modal, Input, Select, Button, Switch, Tag, Tooltip, Dropdown } from 'antd';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '../../../axios/api/superadmin';

interface TruckTier {
  minTrucks: number;
  maxTrucks: number;
  monthlyPrice: number;
  currency: string;
}

interface TruckPricing {
  tiers: TruckTier[];
  extraTruckPrice: number;
  extraTruckCurrency: string;
  sixMonthBonusDays: number;
  annualFreeMonths: number;
}

interface Plan {
  _id: string;
  planName: string;
  planType: 'lifetime' | 'monthly';
  description: string;
  lifetime?: {
    oneTime: { price: number; currency: string; };
    installments: {
      threeMonths: { price: number; currency: string; enabled: boolean; };
      sixMonths: { price: number; currency: string; enabled: boolean; };
    };
  };
  monthly?: {
    fullApp: { price: number; currency: string; enabled: boolean; };
    truckPricing?: TruckPricing;
    yearly?: { price: number; currency: string; enabled: boolean; };
  };
  features?: Array<{ name: string; included: boolean }>;
  allowedRoles?: string[];
  blockedRoles?: string[];
  status: 'active' | 'inactive';
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'active' | 'inactive' | 'default';
type SortType = 'name' | 'price' | 'created' | 'status';

const ROLE_OPTIONS = [
  { value: 'driver', label: 'Driver' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'hr', label: 'HR' },
  { value: 'contact', label: 'Contact' },
  { value: 'customer', label: 'Customer' },
  { value: 'reporter', label: 'Reporter' },
  { value: 'Maintenance Crew (Mechanics)', label: 'Maintenance Crew (Mechanics)' },
  { value: 'Fleet Maintenance Manager', label: 'Fleet Maintenance Manager' },
  { value: 'Compliance Manager', label: 'Compliance Manager' },
  { value: 'safety officer', label: 'Safety Officer' },
];

const createDefaultTruckPricing = (): TruckPricing => ({
  tiers: [
    { minTrucks: 1,  maxTrucks: 10, monthlyPrice: 199, currency: 'CAD' },
    { minTrucks: 11, maxTrucks: 20, monthlyPrice: 399, currency: 'CAD' },
  ],
  extraTruckPrice: 19.99,
  extraTruckCurrency: 'CAD',
  sixMonthBonusDays: 15,
  annualFreeMonths: 1,
});

const createDefaultMonthly = () => ({
  fullApp: { price: 0, currency: 'CAD', enabled: false },
  truckPricing: createDefaultTruckPricing(),
  yearly: { price: 0, currency: 'CAD', enabled: false },
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
  const [previewTab, setPreviewTab] = useState<'monthly' | '6months' | 'annual'>('monthly');
  const [editDescription, setEditDescription] = useState('');

  const [formData, setFormData] = useState({
    planName: '',
    planType: 'monthly' as 'lifetime' | 'monthly',
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
    allowedRoles: [] as string[],
    blockedRoles: [] as string[],
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

  // Only monthly plans are shown
  const monthlyPlans = plans.filter(p => p.planType === 'monthly');

  // Calculate statistics
  const stats = {
    totalPlans: monthlyPlans.length,
    activePlans: monthlyPlans.filter(p => p.status === 'active').length,
    defaultPlan: monthlyPlans.find(p => p.isDefault) || null,
  };

  // Filter and sort plans (lifetime always hidden)
  const filteredAndSortedPlans = monthlyPlans
    .filter(plan => {
      if (searchTerm && !plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !plan.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filterType === 'active' && plan.status !== 'active') return false;
      if (filterType === 'inactive' && plan.status !== 'inactive') return false;
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
      planType: 'monthly',
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
      allowedRoles: [],
      blockedRoles: [],
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
    setEditDescription(plan.description || '');
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedPlan) return;
    try {
      const response = await updatePlan(selectedPlan._id, { description: editDescription });
      if (response?.success) {
        message.success('Description updated successfully');
        setShowEditModal(false);
        fetchPlans();
      } else {
        message.error(response?.message || 'Failed to update plan');
      }
    } catch (error: any) {
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
      const tp = plan.monthly?.truckPricing;
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
        monthly: {
          fullApp: { price: plan.monthly?.fullApp?.price ?? 0, currency: 'CAD', enabled: plan.monthly?.fullApp?.enabled ?? false },
          truckPricing: {
            tiers: tp?.tiers ?? [],
            extraTruckPrice: tp?.extraTruckPrice ?? 0,
            extraTruckCurrency: tp?.extraTruckCurrency ?? 'CAD',
            sixMonthBonusDays: tp?.sixMonthBonusDays ?? 15,
            annualFreeMonths: tp?.annualFreeMonths ?? 1,
          },
          yearly: { price: plan.monthly?.yearly?.price ?? 0, currency: 'CAD', enabled: plan.monthly?.yearly?.enabled ?? false },
        },
        features: plan.features || [],
        allowedRoles: plan.allowedRoles || [],
        blockedRoles: plan.blockedRoles || [],
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

  const updateTruckPricing = (field: keyof TruckPricing, value: any) => {
    setFormData(prev => ({
      ...prev,
      monthly: { ...prev.monthly, truckPricing: { ...prev.monthly.truckPricing!, [field]: value } }
    }));
  };

  const addTier = () => {
    const tiers = formData.monthly.truckPricing?.tiers || [];
    const lastMax = tiers[tiers.length - 1]?.maxTrucks ?? 0;
    updateTruckPricing('tiers', [...tiers, { minTrucks: lastMax + 1, maxTrucks: lastMax + 10, monthlyPrice: 0, currency: 'CAD' }]);
  };

  const removeTier = (idx: number) => {
    updateTruckPricing('tiers', (formData.monthly.truckPricing?.tiers || []).filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, field: keyof TruckTier, value: number | string) => {
    updateTruckPricing('tiers', (formData.monthly.truckPricing?.tiers || []).map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const addFeature = () => setFormData(prev => ({ ...prev, features: [...prev.features, { name: '', included: true }] }));
  const removeFeature = (idx: number) => setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }));
  const updateFeature = (idx: number, field: 'name' | 'included', value: string | boolean) =>
    setFormData(prev => ({ ...prev, features: prev.features.map((f, i) => i === idx ? { ...f, [field]: value } : f) }));

  const renderPricingPreview = (tiers: TruckTier[], tp: TruckPricing, tab: 'monthly' | '6months' | 'annual', onTabChange: (t: 'monthly' | '6months' | 'annual') => void) => {
    const bonusDays = tp.sixMonthBonusDays ?? 15;
    const freeMonths = tp.annualFreeMonths ?? 1;
    const extraPrice = tp.extraTruckPrice ?? 0;

    return (
      <div className="bg-[#f7f7f5] rounded-xl p-4 mt-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['monthly', '6months', 'annual'] as const).map(t => (
            <button key={t} onClick={() => onTabChange(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${tab === t ? 'bg-white border-gray-300 shadow-sm text-gray-900' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'monthly' ? 'Monthly' : t === '6months' ? (
                <span className="flex items-center gap-1.5">6 Months {bonusDays > 0 && <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">+{bonusDays} days free</span>}</span>
              ) : (
                <span className="flex items-center gap-1.5">Annual {freeMonths > 0 && <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">{freeMonths} month free</span>}</span>
              )}
            </button>
          ))}
        </div>

        {/* Bonus banner */}
        {tab === '6months' && bonusDays > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-3 text-sm text-green-800">
            <strong>6-month bonus:</strong> Pay upfront for 6 months and receive {bonusDays} extra days of usage at no additional cost.
          </div>
        )}
        {tab === 'annual' && freeMonths > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-3 text-sm text-blue-800">
            <strong>Annual incentive:</strong> Pay for 12 months and get {freeMonths} full month{freeMonths > 1 ? 's' : ''} free — {12 + freeMonths} months of access for the price of 12.
          </div>
        )}

        {tiers.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-4 italic">Add truck tiers above to see pricing preview</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tiers.map((tier, i) => {
              const isPopular = i === 1 || (tiers.length === 1 && i === 0);
              const isLastTier = i === tiers.length - 1;
              let price: number;
              let priceLabel: string;
              let strikethrough: number | null = null;
              let saveLine: string | null = null;
              if (tab === 'monthly') {
                price = tier.monthlyPrice;
                priceLabel = '/month';
              } else if (tab === '6months') {
                price = tier.monthlyPrice * 6;
                priceLabel = ' for 6 months';
                saveLine = `${formatPrice(tier.monthlyPrice, tier.currency)}/month equivalent`;
              } else {
                price = tier.monthlyPrice * 12;
                strikethrough = tier.monthlyPrice * (12 + freeMonths);
                priceLabel = '/year';
                saveLine = `${formatPrice(tier.monthlyPrice, tier.currency)}/month · save ${formatPrice(tier.monthlyPrice * freeMonths, tier.currency)} vs monthly`;
              }
              return (
                <div key={i} className={`relative bg-white rounded-xl p-4 border-2 transition-shadow ${isPopular ? 'border-blue-500 shadow-md' : 'border-gray-200'}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">Most popular</div>
                  )}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{tier.minTrucks} – {tier.maxTrucks} Trucks</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    {strikethrough !== null && <span className="text-sm text-gray-400 line-through mr-1">{formatPrice(strikethrough, tier.currency)}</span>}
                    <span className="text-3xl font-bold text-gray-900">{formatPrice(price, tier.currency)}</span>
                    <span className="text-sm text-gray-500">{priceLabel}</span>
                  </div>
                  {saveLine && <p className="text-xs text-gray-500 mb-3">{saveLine}</p>}
                  <hr className="border-gray-100 mb-3" />
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      Up to {tier.maxTrucks} trucks included
                    </li>
                    {tab === '6months' && bonusDays > 0 && (
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {bonusDays} bonus days at no extra cost
                      </li>
                    )}
                    {tab === 'annual' && freeMonths > 0 && (
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {freeMonths} month{freeMonths > 1 ? 's' : ''} free — {12 + freeMonths} months total
                      </li>
                    )}
                    {isLastTier && extraPrice > 0 && (
                      <li className="flex items-center gap-2 text-sm text-orange-700">
                        <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        +{formatPrice(extraPrice, tp.extraTruckCurrency ?? 'CAD')}/truck/mo beyond {tier.maxTrucks}
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {extraPrice > 0 && tiers.length > 0 && (() => {
          const lastTierMax = tiers[tiers.length - 1]?.maxTrucks ?? 0;
          const extraCur = tp.extraTruckCurrency ?? 'CAD';
          const periodPrice = tab === 'monthly' ? extraPrice : tab === '6months' ? extraPrice * 6 : extraPrice * 12;
          const periodLabel = tab === 'monthly' ? '/truck / month' : tab === '6months' ? '/truck / 6 months' : '/truck / year';
          return (
            <div className="mt-3 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 border-b border-orange-200">
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wide">Additional Trucks Beyond {lastTierMax}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-3">
                <p className="text-sm text-gray-700">
                  Base rate: <strong>{formatPrice(extraPrice, extraCur)}/truck/month</strong>
                  {tab !== 'monthly' && <span className="text-gray-500"> (applied per month within your billing period)</span>}
                </p>
                <div className="text-right">
                  <span className="text-xl font-bold text-orange-600">{formatPrice(periodPrice, extraCur)}</span>
                  <span className="text-xs text-orange-500 ml-1">{periodLabel}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderPlanFormBody = () => {
    const tp = formData.monthly.truckPricing || createDefaultTruckPricing();
    const tiers = tp.tiers.length >= 2 ? tp.tiers : createDefaultTruckPricing().tiers;

    return (
      <div className="space-y-6 py-4">

        {/* ── Identity ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name <span className="text-red-500">*</span></label>
            <Input
              value={formData.planName}
              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              placeholder="e.g. Standard Fleet Plan"
              size="large"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select value={formData.status} onChange={(value) => setFormData({ ...formData, status: value })} className="w-full" size="large">
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Input.TextArea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Briefly describe what this plan includes..."
            rows={2}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
          <Switch checked={formData.isDefault} onChange={(checked) => setFormData({ ...formData, isDefault: checked })} />
          <div>
            <p className="text-sm font-semibold text-gray-800">Set as Default Plan</p>
            <p className="text-xs text-gray-500">New admins will be shown this plan first</p>
          </div>
        </div>

        {/* ── Fleet Tier Pricing ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-bold text-gray-800">Fleet Tier Pricing</span>
            <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">Fixed: 2 tiers</span>
          </div>

          <div className="p-5 grid grid-cols-2 gap-4">
            {/* Tier 1: 1–10 Trucks */}
            <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Tier 1</p>
                  <p className="text-sm font-bold text-gray-900">1 – 10 Trucks</p>
                </div>
              </div>
              <label className="block text-xs text-gray-500 mb-1">Monthly Price (CAD)</label>
              <Input
                type="number"
                size="large"
                value={tiers[0]?.monthlyPrice ?? 199}
                min={0}
                prefix="$"
                addonAfter="CAD/mo"
                onChange={(e) => updateTier(0, 'monthlyPrice', parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Tier 2: 11–20 Trucks */}
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Tier 2</p>
                  <p className="text-sm font-bold text-gray-900">11 – 20 Trucks</p>
                </div>
              </div>
              <label className="block text-xs text-gray-500 mb-1">Monthly Price (CAD)</label>
              <Input
                type="number"
                size="large"
                value={tiers[1]?.monthlyPrice ?? 399}
                min={0}
                prefix="$"
                addonAfter="CAD/mo"
                onChange={(e) => updateTier(1, 'monthlyPrice', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Extra truck price */}
          <div className="px-5 pb-5">
            <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50/50 p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-800 mb-0.5">Additional Truck Rate</label>
                  <p className="text-xs text-gray-500 mb-2">Charged per truck beyond 20 (last tier max)</p>
                  <Input
                    type="number"
                    value={tp.extraTruckPrice}
                    min={0}
                    prefix="$"
                    addonAfter="CAD / truck / month"
                    onChange={(e) => updateTruckPricing('extraTruckPrice', parseFloat(e.target.value) || 0)}
                    placeholder="19.99"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Billing bonuses */}
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Billing Period Bonuses</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <label className="text-sm font-semibold text-gray-800">6-Month Bonus</label>
                </div>
                <p className="text-xs text-gray-500 mb-2">Free days added when paying 6 months upfront</p>
                <Input
                  type="number"
                  value={tp.sixMonthBonusDays}
                  min={0}
                  addonAfter="days free"
                  onChange={(e) => updateTruckPricing('sixMonthBonusDays', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-3.5 h-3.5 text-green-500" />
                  <label className="text-sm font-semibold text-gray-800">Annual Free Months</label>
                </div>
                <p className="text-xs text-gray-500 mb-2">Free months added when paying annually</p>
                <Input
                  type="number"
                  value={tp.annualFreeMonths}
                  min={0}
                  addonAfter="month(s) free"
                  onChange={(e) => updateTruckPricing('annualFreeMonths', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Live Pricing Preview</p>
            {renderPricingPreview(tiers, tp, previewTab, setPreviewTab)}
          </div>
        </div>

        {/* ── Features ── */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-bold text-gray-800">Plan Features</span>
            </div>
            <Button size="small" icon={<Plus className="w-3 h-3" />} onClick={addFeature}>Add Feature</Button>
          </div>
          <div className="p-5">
            {formData.features.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-3">No features yet — click "Add Feature" to start</p>
            )}
            <div className="space-y-2">
              {formData.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Switch size="small" checked={feature.included} onChange={(checked) => updateFeature(idx, 'included', checked)} />
                  <Input
                    value={feature.name}
                    onChange={(e) => updateFeature(idx, 'name', e.target.value)}
                    placeholder="e.g. Fleet Maintenance Tracking"
                    className="flex-1"
                    size="small"
                  />
                  <Button size="small" danger onClick={() => removeFeature(idx)}>×</Button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90 mb-1">Default Plan</p>
                  <p className="text-lg font-bold truncate">{stats.defaultPlan ? stats.defaultPlan.planName : 'None'}</p>
                </div>
                <Star className="w-8 h-8 opacity-80 flex-shrink-0" />
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
          <div className="space-y-8">
            {filteredAndSortedPlans.map((plan) => {
              const tiers = plan.monthly?.truckPricing?.tiers ?? [];
              const tp = plan.monthly?.truckPricing;
              const extraPrice = tp?.extraTruckPrice ?? 0;
              const bonusDays = tp?.sixMonthBonusDays ?? 15;
              const freeMonths = tp?.annualFreeMonths ?? 1;
              const planTab = previewTab;

              return (
                <div
                  key={plan._id}
                  className={`bg-white rounded-3xl shadow-xl overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl ${
                    plan.isDefault ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* ── Plan Header ── */}
                  <div className={`px-8 py-6 bg-gradient-to-r ${getPlanGradient(plan)} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20" />
                    <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <div className="p-2 bg-white/20 rounded-xl">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white">{plan.planName}</h3>
                          {plan.isDefault && (
                            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-900" /> Default
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize border ${plan.status === 'active' ? 'bg-white/20 border-white/30 text-white' : 'bg-black/20 border-black/30 text-white/80'}`}>
                            {plan.status}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-white/75 text-sm mt-1 max-w-xl">{plan.description}</p>
                        )}
                      </div>
                      {/* Action buttons in header */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Tooltip title="View Details">
                          <Button size="small" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => handleView(plan)} className="bg-white/20 border-white/30 text-white hover:bg-white/30">View</Button>
                        </Tooltip>
                        <Tooltip title="Edit Description">
                          <Button size="small" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => handleEdit(plan)} className="bg-white/20 border-white/30 text-white hover:bg-white/30">Edit</Button>
                        </Tooltip>
                        <Tooltip title="Duplicate Plan">
                          <Button size="small" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => handleDuplicate(plan)} className="bg-white/20 border-white/30 text-white hover:bg-white/30" />
                        </Tooltip>
                        <Tooltip title="Delete Plan">
                          <Button size="small" danger icon={<Trash2 className="w-3.5 h-3.5" />} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(plan); }} className="bg-red-500/80 border-red-400/50 text-white hover:bg-red-600" />
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    {tiers.length > 0 && (
                      <>
                        {/* ── Billing Period Selector ── */}
                        <div className="flex justify-center mb-8">
                          <div className="inline-flex bg-gray-100 rounded-2xl p-1 gap-1">
                            {(['monthly', '6months', 'annual'] as const).map((tab) => (
                              <button
                                key={tab}
                                onClick={() => setPreviewTab(tab)}
                                className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex flex-col items-center min-w-[110px] ${
                                  planTab === tab
                                    ? 'bg-white shadow-md text-purple-700 ring-1 ring-purple-100'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                <span>{tab === 'monthly' ? 'Monthly' : tab === '6months' ? '6 Months' : 'Annual'}</span>
                                <span className={`text-[10px] font-bold mt-0.5 ${
                                  planTab === tab
                                    ? tab === '6months' ? 'text-amber-500' : tab === 'annual' ? 'text-green-600' : 'text-transparent'
                                    : 'text-gray-400'
                                }`}>
                                  {tab === '6months' ? `+${bonusDays} days free` : tab === 'annual' ? `+${freeMonths} mo free` : '‎'}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── Bonus Banner ── */}
                        {planTab === '6months' && bonusDays > 0 && (
                          <div className="mb-6 flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-4">
                            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-amber-900">6-Month Plan Bonus</p>
                              <p className="text-xs text-amber-700 mt-0.5">Admins pay for 6 months and receive <strong>{bonusDays} extra days</strong> of access free</p>
                            </div>
                            <div className="ml-auto flex-shrink-0">
                              <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full">+{bonusDays} Days</span>
                            </div>
                          </div>
                        )}
                        {planTab === 'annual' && freeMonths > 0 && (
                          <div className="mb-6 flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-6 py-4">
                            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-900">Annual Plan — Best Value</p>
                              <p className="text-xs text-green-700 mt-0.5">Admins get <strong>{freeMonths} month{freeMonths > 1 ? 's' : ''} free</strong> when paying annually</p>
                            </div>
                            <div className="ml-auto flex-shrink-0">
                              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">+{freeMonths} Mo Free</span>
                            </div>
                          </div>
                        )}

                        {/* ── Tier Cards ── */}
                        <div className={`grid gap-5 mb-6 ${tiers.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : tiers.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                          {tiers.map((tier, idx) => {
                            const currency = tier.currency ?? 'CAD';
                            const baseMonthly = tier.monthlyPrice;
                            const displayPrice = planTab === 'monthly' ? baseMonthly : planTab === '6months' ? baseMonthly * 6 : baseMonthly * 12;
                            const strikethroughPrice = planTab === 'annual' ? baseMonthly * (12 + freeMonths) : null;
                            const isPopular = idx === 1 || (tiers.length === 1 && idx === 0);
                            const isLastTier = idx === tiers.length - 1;

                            return (
                              <div
                                key={idx}
                                className={`relative rounded-2xl border-2 p-6 transition-all duration-200 flex flex-col ${
                                  isPopular
                                    ? 'border-purple-400 bg-gradient-to-b from-purple-50 to-indigo-50 shadow-xl ring-2 ring-purple-100'
                                    : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-lg'
                                }`}
                              >
                                {isPopular && (
                                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
                                    Most Popular
                                  </div>
                                )}

                                <div className="flex items-center gap-3 mb-5">
                                  <div className={`p-2.5 rounded-xl ${isPopular ? 'bg-purple-600' : 'bg-orange-100'}`}>
                                    <BarChart3 className={`w-5 h-5 ${isPopular ? 'text-white' : 'text-orange-600'}`} />
                                  </div>
                                  <div>
                                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Fleet Size</p>
                                    <p className="text-xl font-bold text-gray-900">{tier.minTrucks}–{tier.maxTrucks} Trucks</p>
                                  </div>
                                </div>

                                <div className="mb-5 flex-1">
                                  {strikethroughPrice && (
                                    <p className="text-sm text-gray-400 line-through mb-0.5">{formatPrice(strikethroughPrice, currency)}</p>
                                  )}
                                  <div className="flex items-baseline gap-1.5">
                                    <span className={`text-4xl font-extrabold ${isPopular ? 'text-purple-700' : 'text-gray-900'}`}>
                                      {formatPrice(displayPrice, currency)}
                                    </span>
                                    <span className="text-sm text-gray-400 font-medium">
                                      {planTab === 'monthly' ? '/mo' : planTab === '6months' ? '/6 mo' : '/yr'}
                                    </span>
                                  </div>
                                  {planTab !== 'monthly' && (
                                    <p className="text-xs text-gray-400 mt-1.5">
                                      {formatPrice(baseMonthly, currency)}/mo equivalent
                                    </p>
                                  )}
                                </div>

                                {/* Additional truck note */}
                                {extraPrice > 0 && (() => {
                                  const lastTierMax = tiers[tiers.length - 1]?.maxTrucks ?? tier.maxTrucks;
                                  const billingFactor = planTab === 'monthly' ? 1 : planTab === '6months' ? 6 : 12;
                                  const billingLabel = planTab === 'monthly' ? '/mo' : planTab === '6months' ? '/6 mo' : '/yr';
                                  return (
                                    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 overflow-hidden">
                                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 border-b border-orange-200">
                                        <TrendingUp className="w-3 h-3 text-orange-500" />
                                        <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wide">Additional Trucks</span>
                                      </div>
                                      <div className="flex items-center justify-between px-3 py-2">
                                        <span className="text-xs text-gray-600">Beyond {lastTierMax} trucks</span>
                                        <span className="text-xs font-bold text-orange-600">+{formatPrice(extraPrice * billingFactor, tp?.extraTruckCurrency ?? 'CAD')}{billingLabel}/truck</span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                <div className={`h-px mb-5 ${isPopular ? 'bg-purple-200' : 'bg-gray-100'}`} />

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    Up to {tier.maxTrucks} trucks included
                                  </div>
                                  {planTab === '6months' && bonusDays > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      {bonusDays} bonus days free
                                    </div>
                                  )}
                                  {planTab === 'annual' && freeMonths > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      {freeMonths} month{freeMonths > 1 ? 's' : ''} free — {12 + freeMonths} months total
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* ── Additional Truck Pricing ── */}
                        {extraPrice > 0 && (() => {
                          const billingFactor = planTab === 'monthly' ? 1 : planTab === '6months' ? 6 : 12;
                          const billingLabel = planTab === 'monthly' ? '/truck / month' : planTab === '6months' ? '/truck / 6 months' : '/truck / year';
                          const extraDisplayPrice = extraPrice * billingFactor;
                          const lastTierMax = tiers[tiers.length - 1]?.maxTrucks ?? 0;
                          const extraCur = tp?.extraTruckCurrency ?? 'CAD';
                          return (
                            <div className="mb-6 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 overflow-hidden">
                              <div className="flex items-center gap-2 px-5 py-3 bg-orange-100 border-b border-orange-200">
                                <TrendingUp className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-bold text-orange-800">Additional Trucks Beyond {lastTierMax}</span>
                              </div>
                              <div className="flex items-center gap-5 flex-wrap px-5 py-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-700">Admins with more than <strong>{lastTierMax} trucks</strong> are charged a flat per-truck rate.</p>
                                  <p className="text-xs text-gray-500 mt-1">Base rate: {formatPrice(extraPrice, extraCur)}/truck/month</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-2xl font-extrabold text-orange-600">{formatPrice(extraDisplayPrice, extraCur)}</p>
                                  <p className="text-xs text-orange-500 font-medium">{billingLabel}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}

                    {/* ── Features ── */}
                    {plan.features && plan.features.filter(f => f.included).length > 0 && (
                      <div className={`${tiers.length > 0 ? 'border-t border-gray-100 pt-6' : ''}`}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">What's Included</p>
                        <div className={`grid gap-2.5 ${plan.features.filter(f => f.included).length > 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                          {plan.features.filter(f => f.included).map((f, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2.5">
                              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                              </div>
                              <span className="text-sm text-gray-700">{f.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
        onCancel={() => { setShowCreateModal(false); resetForm(); }}
        footer={null}
        width={860}
      >
        <div className="overflow-y-auto max-h-[75vh]">
          {renderPlanFormBody()}
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t mt-2">
          <Button onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
          <Button type="primary" onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700 !ml-2">Create Plan</Button>
        </div>
      </Modal>

      {/* Edit Plan Modal — description only */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Edit className="w-4 h-4 text-purple-600" />
            <span>Edit Plan — {selectedPlan?.planName}</span>
          </div>
        }
        open={showEditModal}
        onCancel={() => setShowEditModal(false)}
        footer={null}
        width={500}
      >
        <div className="py-4 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-800">
            Only the plan description can be edited after creation.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Input.TextArea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter plan description"
              rows={4}
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button type="primary" onClick={handleUpdate} className="bg-purple-600 hover:bg-purple-700">Save Description</Button>
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

            {selectedPlan.planType === 'monthly' && selectedPlan.monthly && (selectedPlan.monthly.truckPricing?.tiers?.length ?? 0) > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-500" />
                  Pricing Plans
                </h4>
                {renderPricingPreview(
                  selectedPlan.monthly.truckPricing!.tiers,
                  selectedPlan.monthly.truckPricing as TruckPricing,
                  previewTab,
                  setPreviewTab
                )}
              </div>
            )}

            {/* Features */}
            {(selectedPlan.features?.length ?? 0) > 0 && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPlan.features!.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {f.included
                        ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                      <span className={f.included ? 'text-gray-900' : 'text-gray-400 line-through'}>{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roles */}
            {((selectedPlan.allowedRoles?.length ?? 0) > 0 || (selectedPlan.blockedRoles?.length ?? 0) > 0) && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Role Access</h4>
                {(selectedPlan.allowedRoles?.length ?? 0) > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Allowed Roles</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlan.allowedRoles!.map(r => <Tag key={r} color="blue">{r}</Tag>)}
                    </div>
                  </div>
                )}
                {(selectedPlan.blockedRoles?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Blocked Roles</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlan.blockedRoles!.map(r => <Tag key={r} color="red">{r}</Tag>)}
                    </div>
                  </div>
                )}
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
