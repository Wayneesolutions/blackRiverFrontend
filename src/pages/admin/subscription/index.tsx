import { useState, useEffect, type CSSProperties } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Crown,
  Zap,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Info,
  X,
  History,
  Package,
  Star,
  Truck,
} from 'lucide-react';
import { message, Modal, Button, Tag, Card, Spin, Tabs, Progress, Alert } from 'antd';
import { getAllPlans, getMySubscription, getMySubscriptions, createCheckoutSession, cancelSubscription, getTrialStatus, verifyCheckoutSession, addExtraTrucksCheckout } from '../../../axios/api/subscription';
import { FLEET_COLORS } from '../fleetMaintenance/colorUtils';

interface Plan {
  _id: string;
  planName: string;
  planType: 'lifetime' | 'monthly';
  description: string;
  lifetime?: {
    oneTime: { price: number; currency: string };
    installments?: {
      threeMonths?: { price: number; currency: string; enabled: boolean };
      sixMonths?: { price: number; currency: string; enabled: boolean };
    };
  };
  monthly?: {
    fullApp?: { price: number; currency: string; enabled: boolean };
    withoutHR?: { price: number; currency: string; enabled: boolean };
    yearly?: { price: number; currency: string; enabled: boolean };
    truckPricing?: {
      tiers: { minTrucks: number; maxTrucks: number; monthlyPrice: number; currency: string; _id: string }[];
      extraTruckPrice: number;
      extraTruckCurrency?: string;
      sixMonthBonusDays?: number;
      annualFreeMonths?: number;
    };
  };
  allowedRoles?: string[];
  blockedRoles?: string[];
  status: 'active' | 'inactive';
  isDefault?: boolean;
  features?: { name: string; included: boolean; _id: string }[];
}

interface Subscription {
  _id: string;
  plan: Plan | string; // Can be populated Plan object or just plan ID
  planSnapshot?: {
    planName: string;
    allowedRoles?: string[];
    blockedRoles?: string[];
    snapshotDate?: string;
  };
  planType: 'lifetime' | 'monthly';
  subscriptionType: string;
  amount: number;
  currency: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'past_due';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  startDate: string;
  endDate?: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  stripeSessionId?: string;
  truckCount?: number;
  maxTrucks?: number;
  usedTrucks?: number;
  extraTrucksPurchased?: number;
  installments?: {
    total: number;
    paid: number;
    remaining: number;
  };
}

interface TrialStatus {
  hasActiveSubscription: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  hasTrial: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  daysUsed?: number;
  daysRemaining?: number;
  message?: string;
}

const SubscriptionPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSubscriptionId, setCancelSubscriptionId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [selectedTier, setSelectedTier] = useState<{ minTrucks: number; maxTrucks: number; monthlyPrice: number; currency: string; _id: string } | null>(null);
  const [truckCount, setTruckCount] = useState<number>(1);
  const [extraTrucks, setExtraTrucks] = useState<number>(0);
  const [pricingTabs, setPricingTabs] = useState<Record<string, 'monthly' | '6months' | 'annual'>>({});
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [addTruckCount, setAddTruckCount] = useState(1);
  const [addTruckProcessing, setAddTruckProcessing] = useState(false);


  const primaryButtonStyle: CSSProperties = {
    background: FLEET_COLORS.gradient,
    color: '#fff',
    border: 'none',
    boxShadow: `0 18px 32px ${FLEET_COLORS.focusRing}`,
  };
  const cardAccentStyle: CSSProperties = {
    borderColor: FLEET_COLORS.focusRing,
    boxShadow: `0 25px 45px ${FLEET_COLORS.focusRing}`,
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subscriptionRes, subscriptionsRes, trialRes] = await Promise.all([
        getAllPlans(),
        getMySubscription(),
        getMySubscriptions(),
        getTrialStatus(),
      ]);

      if (plansRes?.success) {
        setPlans(plansRes.data || []);
      }

      if (subscriptionRes?.success) {
        setActiveSubscription(subscriptionRes.data || null);
      }

      if (subscriptionsRes?.success) {
        setSubscriptions(subscriptionsRes.data || []);
      }

      if (trialRes?.success && trialRes.data) {
        setTrialStatus(trialRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching subscription data:', error);
      // Don't show error message if it's just a missing subscription
      if (!error?.message?.includes('No active subscription')) {
        message.error(error?.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const handleSubscribe = async (plan: Plan, subscriptionType: string) => {
    setSelectedPlan(plan);
    setSelectedType(subscriptionType);
    setSelectedTier(null);
    setTruckCount(1);
    setShowSubscribeModal(true);
  };

  const handleTierSubscribe = (plan: Plan, tier: { minTrucks: number; maxTrucks: number; monthlyPrice: number; currency: string; _id: string }, subscriptionType: string) => {
    setSelectedPlan(plan);
    setSelectedType(subscriptionType);
    setSelectedTier(tier);
    setTruckCount(tier.maxTrucks);
    setExtraTrucks(0);
    setShowSubscribeModal(true);
  };

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const response = await createCheckoutSession({
        planId: selectedPlan._id,
        subscriptionType: selectedType,
        ...((selectedType === '1-month' || selectedType === '6-months' || selectedType === '1-year') && {
          truckCount: selectedTier ? selectedTier.maxTrucks + extraTrucks : truckCount,
        }),
      });

      if (response?.success && response.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        message.error(response?.message || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      message.error(error?.message || 'Failed to create checkout session');
    } finally {
      setProcessing(false);
    }
  };

  const confirmAddTrucks = async () => {
    if (!activeSubscription) return;
    const planId = typeof activeSubscription.plan === 'object' ? activeSubscription.plan?._id : activeSubscription.plan as string;
    if (!planId) return;

    setAddTruckProcessing(true);
    try {
      const response = await addExtraTrucksCheckout({ planId, extraTruck: addTruckCount });
      if (response?.success && response.data?.url) {
        window.location.href = response.data.url;
      } else {
        message.error(response?.message || 'Failed to create checkout session');
      }
    } catch (error: any) {
      message.error(error?.message || 'Failed to create checkout session');
    } finally {
      setAddTruckProcessing(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('Cancel subscription clicked for:', subscriptionId);
    setCancelSubscriptionId(subscriptionId);
    setShowCancelModal(true);
  };

  const confirmCancelSubscription = async () => {
    if (!cancelSubscriptionId) return;

    console.log('Confirming cancellation for:', cancelSubscriptionId);
    setCancelling(true);

    try {
      console.log('Calling cancelSubscription API with ID:', cancelSubscriptionId);
      const response = await cancelSubscription(cancelSubscriptionId);
      console.log('Cancel subscription API response:', response);

      if (response?.success) {
        message.success('Subscription cancelled successfully');
        setShowCancelModal(false);
        setCancelSubscriptionId(null);
        fetchData();
      } else {
        message.error(response?.message || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      message.error(error?.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'default';
      case 'expired':
      case 'past_due':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  // Check if returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const sessionId = params.get('session_id');
    window.history.replaceState({}, '', window.location.pathname);

    if (status === 'success' && sessionId) {
      // Verify payment directly with Stripe — don't rely solely on webhook
      verifyCheckoutSession(sessionId).then((res) => {
        if (res?.success && res?.data?.status === 'active') {
          message.success('Payment successful! Your subscription is now active.');
        } else {
          message.info('Payment received. Activating your subscription...');
        }
        fetchData();
      }).catch(() => {
        message.info('Payment received. Loading your subscription...');
        fetchData();
      });
    } else if (status === 'cancel') {
      message.info('Payment was cancelled.');
    }
  }, []);

  const [activeTab, setActiveTab] = useState<string>('plans');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50" >
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-black">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDF8FF]">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-2xl shadow-lg"

              >
                <CreditCard className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-4xl font-bold" style={{ color: FLEET_COLORS.light }}>
                  Subscription & Plans
                </h1>
                <p className="text-black/90 mt-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Manage your subscription and choose from available plans
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prominent Alert Banner for Expired Trial or No Subscription */}
        {((trialStatus && trialStatus.isTrialExpired && !trialStatus.hasActiveSubscription) || 
          (trialStatus && !trialStatus.hasActiveSubscription && !trialStatus.hasTrial)) && (
          <div className="mb-6">
            <Alert
              message={
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  <div>
                    <div className="font-bold text-lg">Subscription Required</div>
                    <div className="text-sm mt-1">
                      {trialStatus?.isTrialExpired 
                        ? "Your free trial has expired. You don't have an active subscription plan to use this software. Please subscribe to a plan to continue."
                        : "You don't have an active subscription plan to use this software. Please subscribe to a plan to continue."}
                    </div>
                  </div>
                </div>
              }
              type="error"
              showIcon={false}
              closable={false}
              className="border-2 border-red-500"
              style={{
                backgroundColor: '#fef2f2',
                borderColor: '#ef4444',
                padding: '20px'
              }}
            />
          </div>
        )}

        {/* Trial Status Card */}
        {trialStatus && !trialStatus.hasActiveSubscription && trialStatus.hasTrial && (
          <div className={`mb-8 relative overflow-hidden rounded-2xl shadow-2xl ${trialStatus.isTrialExpired
              ? 'bg-gradient-to-br from-red-500 via-red-600 to-orange-600'
              : trialStatus.daysRemaining && trialStatus.daysRemaining <= 2
                ? 'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500'
                : 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600'
            }`}>
            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>

            <div className="relative p-8 z-10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      {trialStatus.isTrialExpired ? (
                        <XCircle className="w-6 h-6 text-white" />
                      ) : (
                        <Clock className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {trialStatus.isTrialExpired ? 'Free Trial Expired' : 'Free Trial Active'}
                      </h2>
                      <p className="text-white/90 mt-1">
                        {trialStatus.isTrialExpired
                          ? 'Your 7-day free trial has ended. Subscribe now to continue using the platform.'
                          : trialStatus.daysRemaining && trialStatus.daysRemaining <= 2
                            ? `⚠️ Your free trial is expiring soon! Only ${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'} remaining.`
                            : `You have ${trialStatus.daysRemaining || 0} days remaining in your free trial.`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-white" />
                        <span className="text-white/80 text-sm font-medium">Days Used</span>
                      </div>
                      <p className="text-white text-2xl font-bold">
                        {trialStatus.daysUsed || 0} / 7
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-white" />
                        <span className="text-white/80 text-sm font-medium">Days Remaining</span>
                      </div>
                      <p className="text-white text-2xl font-bold">
                        {trialStatus.daysRemaining || 0}
                      </p>
                    </div>

                    {trialStatus.trialEndDate && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-white" />
                          <span className="text-white/80 text-sm font-medium">Expires On</span>
                        </div>
                        <p className="text-white text-lg font-bold">
                          {new Date(trialStatus.trialEndDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {trialStatus.daysRemaining !== undefined && trialStatus.daysRemaining > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm font-medium">Trial Progress</span>
                        <span className="text-white text-sm font-bold">
                          {Math.round(((7 - (trialStatus.daysRemaining || 0)) / 7) * 100)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.round(((7 - (trialStatus.daysRemaining || 0)) / 7) * 100)}
                        strokeColor="#ffffff"
                        trailColor="rgba(255,255,255,0.3)"
                        showInfo={false}
                      />
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="primary"
                      size="large"
                      style={primaryButtonStyle}
                      onClick={() => setActiveTab('plans')}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      {trialStatus.isTrialExpired ? 'Subscribe Now' : 'View Plans'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Active Subscription Card */}
        {activeSubscription && (
          <div
            className="mb-8 relative overflow-hidden rounded-2xl shadow-2xl bg-white border-2 border-gray-200"
            style={{ boxShadow: `0 35px 55px ${FLEET_COLORS.focusRing}` }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-50 rounded-full -ml-24 -mb-24 pointer-events-none"></div>

            <div className="relative p-8 z-10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                      <Crown className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Active Subscription
                        {getStatusIcon(activeSubscription.status)}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag color={getStatusColor(activeSubscription.status)}>
                          {activeSubscription.status.toUpperCase()}
                        </Tag>
                        <Tag color={activeSubscription.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {activeSubscription.paymentStatus.toUpperCase()}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700 text-sm font-medium">Plan Name</span>
                      </div>
                      <p className="text-gray-900 text-xl font-bold">
                        {typeof activeSubscription.plan === 'object'
                          ? activeSubscription.plan?.planName
                          : activeSubscription.planSnapshot?.planName || 'Plan'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <span className="text-gray-700 text-sm font-medium">Subscription Type</span>
                      </div>
                      <p className="text-gray-900 text-xl font-bold capitalize">
                        {activeSubscription.planType} - {activeSubscription.subscriptionType.replace('-', ' ')}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-gray-700 text-sm font-medium">Amount</span>
                      </div>
                      <p className="text-gray-900 text-2xl font-bold">
                        {formatPrice(activeSubscription.amount, activeSubscription.currency)}
                        {activeSubscription.planType === 'monthly' && (
                          <span className="text-base font-normal">/month</span>
                        )}
                      </p>
                    </div>

                    {activeSubscription.nextBillingDate && (
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-yellow-600" />
                          <span className="text-gray-700 text-sm font-medium">Next Billing</span>
                        </div>
                        <p className="text-gray-900 text-xl font-bold">
                          {new Date(activeSubscription.nextBillingDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {activeSubscription.maxTrucks != null && activeSubscription.maxTrucks > 0 && (
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200 md:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            <span className="text-gray-700 text-sm font-medium">Truck Usage</span>
                          </div>
                          <span className="text-gray-900 font-bold">
                            {activeSubscription.usedTrucks ?? 0} / {activeSubscription.maxTrucks}
                          </span>
                        </div>
                        <Progress
                          percent={Math.min(
                            100,
                            Math.round(((activeSubscription.usedTrucks ?? 0) / activeSubscription.maxTrucks) * 100)
                          )}
                          strokeColor={
                            (activeSubscription.usedTrucks ?? 0) >= activeSubscription.maxTrucks
                              ? { '0%': '#ef4444', '100%': '#dc2626' }
                              : { '0%': '#6366f1', '100%': '#4f46e5' }
                          }
                          className="mb-2"
                        />
                        <p className="text-gray-600 text-xs">
                          {Math.max(0, activeSubscription.maxTrucks - (activeSubscription.usedTrucks ?? 0))} truck slot{Math.max(0, activeSubscription.maxTrucks - (activeSubscription.usedTrucks ?? 0)) !== 1 ? 's' : ''} remaining
                          {activeSubscription.extraTrucksPurchased ? ` (includes ${activeSubscription.extraTrucksPurchased} extra purchased)` : ''}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Started on {new Date(activeSubscription.startDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>

                {activeSubscription.status === 'active' && (
                  <div className="lg:self-start">
                    <Button
                      danger
                      size="large"
                      icon={<X className="w-4 h-4" />}
                      onClick={(e) => handleCancelSubscription(activeSubscription._id, e)}
                      className="bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600 text-white font-semibold shadow-lg"
                      style={{ pointerEvents: 'auto', zIndex: 10 }}
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Add More Trucks (active subscription only) ── */}
        {activeSubscription && activeSubscription.status === 'active' && (() => {
          const activePlan = typeof activeSubscription.plan === 'object' ? activeSubscription.plan as Plan : null;
          const extraTruckPrice = activePlan?.monthly?.truckPricing?.extraTruckPrice ?? 0;
          const extraTruckCurrency = activePlan?.monthly?.truckPricing?.extraTruckCurrency ?? 'CAD';
          const currentMaxTrucks = activeSubscription.maxTrucks ?? activeSubscription.truckCount ?? 0;
          const extraAlreadyPurchased = activeSubscription.extraTrucksPurchased ?? 0;
          if (extraTruckPrice <= 0) return null;
          return (
            <div className="mb-8 bg-white rounded-2xl shadow-lg border-2 border-orange-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Need More Trucks?</h3>
                    <p className="text-white/80 text-sm">Add extra trucks to your current plan — no plan change needed</p>
                  </div>
                </div>
                <Button
                  size="large"
                  icon={<TrendingUp className="w-4 h-4" />}
                  onClick={() => { setAddTruckCount(1); setShowAddTruckModal(true); }}
                  className="bg-white text-orange-600 border-white font-bold hover:bg-orange-50 flex-shrink-0"
                >
                  Add Trucks
                </Button>
              </div>
              <div className="px-6 py-4 flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Current Truck Limit</p>
                    <p className="text-lg font-bold text-gray-900">{currentMaxTrucks} trucks</p>
                  </div>
                </div>
                {extraAlreadyPurchased > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Extra Trucks Added</p>
                      <p className="text-lg font-bold text-gray-900">+{extraAlreadyPurchased} trucks</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Rate Per Extra Truck</p>
                    <p className="text-lg font-bold text-orange-600">{formatPrice(extraTruckPrice, extraTruckCurrency)}<span className="text-sm font-normal text-gray-500">/truck/mo</span></p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Enhanced Available Plans with Tabs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Available Plans</h2>
            </div>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'plans',
                label: (
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    All Plans
                  </span>
                ),
              },
              {
                key: 'history',
                label: (
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Subscription History
                  </span>
                ),
              },
            ]}
            className="mb-6"
          />

          {activeTab === 'plans' && (
            <div className="space-y-8">
              {plans.filter(p => p.planType === 'monthly').map((plan) => {
                const currentPlanId = typeof activeSubscription?.plan === 'object' ? activeSubscription.plan?._id : null;
                const isCurrentPlan = currentPlanId === plan._id;
                const tiers = plan.monthly?.truckPricing?.tiers ?? [];
                const tp = plan.monthly?.truckPricing;
                const extraPrice = tp?.extraTruckPrice ?? 0;
                const extraCurrency = tp?.extraTruckCurrency ?? 'CAD';
                const bonusDays = tp?.sixMonthBonusDays ?? 15;
                const freeMonths = tp?.annualFreeMonths ?? 1;

                // Auto-select the tab matching the current subscription's billing period
                const activeSubType = activeSubscription?.subscriptionType;
                const defaultTab: 'monthly' | '6months' | 'annual' =
                  isCurrentPlan && activeSubType === '6-months' ? '6months' :
                  isCurrentPlan && activeSubType === '1-year' ? 'annual' : 'monthly';
                const planTab = pricingTabs[plan._id] ?? defaultTab;

                // Determine which tier index matches the active subscription
                const activeTierIndex = (() => {
                  if (!isCurrentPlan || !activeSubscription?.amount) return -1;
                  const factor = activeSubType === '1-month' ? 1 : activeSubType === '6-months' ? 6 : 12;
                  const monthlyEquiv = activeSubscription.amount / factor;
                  return tiers.findIndex(t => Math.abs(t.monthlyPrice - monthlyEquiv) < 0.01);
                })();

                return (
                  <div
                    key={plan._id}
                    className={`bg-white rounded-3xl shadow-xl overflow-hidden border-2 transition-all duration-300 ${isCurrentPlan ? 'border-blue-400 ring-4 ring-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    {/* ── Plan Header ── */}
                    <div className={`px-8 py-6 ${isCurrentPlan ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-slate-700 to-slate-800'}`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <div className="p-2 bg-white/20 rounded-xl">
                              <Truck className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">{plan.planName}</h3>
                            {plan.isDefault && (
                              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">Default</span>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-white/75 text-sm mt-1 max-w-xl">{plan.description}</p>
                          )}
                        </div>
                        {isCurrentPlan && (
                          <div className="bg-white/15 backdrop-blur border border-white/30 px-4 py-2 rounded-xl flex items-center gap-2 flex-shrink-0">
                            <Crown className="w-4 h-4 text-yellow-300" />
                            <span className="text-white font-bold text-sm">Your Active Plan</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-8">
                      {tiers.length > 0 && (
                        <>
                          {/* ── Billing Period Selector ── */}
                          <div className="flex justify-center mb-8">
                            <div className="inline-flex bg-gray-100 rounded-2xl p-1 gap-1">
                              {(['monthly', '6months', 'annual'] as const).map((tab) => {
                                const isActiveTab = planTab === tab;
                                const isCurrentBillingTab = isCurrentPlan && (
                                  (tab === 'monthly' && activeSubType === '1-month') ||
                                  (tab === '6months' && activeSubType === '6-months') ||
                                  (tab === 'annual' && activeSubType === '1-year')
                                );
                                return (
                                  <button
                                    key={tab}
                                    onClick={() => setPricingTabs(prev => ({ ...prev, [plan._id]: tab }))}
                                    className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex flex-col items-center min-w-[110px] ${
                                      isActiveTab
                                        ? 'bg-white shadow-md text-blue-700 ring-1 ring-blue-100'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                  >
                                    <span>{tab === 'monthly' ? 'Monthly' : tab === '6months' ? '6 Months' : 'Annual'}</span>
                                    <span className={`text-[10px] font-bold mt-0.5 ${
                                      isActiveTab
                                        ? tab === '6months' ? 'text-amber-500' : tab === 'annual' ? 'text-green-600' : 'text-transparent'
                                        : 'text-gray-400'
                                    }`}>
                                      {tab === '6months' ? `+${bonusDays} days free` : tab === 'annual' ? `+${freeMonths} mo free` : '‎'}
                                    </span>
                                    {isCurrentBillingTab && (
                                      <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* ── Savings / Bonus Banner ── */}
                          {planTab === '6months' && (
                            <div className="mb-6 flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-4">
                              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Zap className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-amber-900">6-Month Plan Bonus</p>
                                <p className="text-xs text-amber-700 mt-0.5">Pay for 6 months and receive <strong>{bonusDays} extra days</strong> of access — completely free</p>
                              </div>
                              <div className="ml-auto text-right flex-shrink-0">
                                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full">+{bonusDays} Days</span>
                              </div>
                            </div>
                          )}
                          {planTab === 'annual' && (
                            <div className="mb-6 flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl px-6 py-4">
                              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Star className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-green-900">Annual Plan — Best Value</p>
                                <p className="text-xs text-green-700 mt-0.5">Pay 12 months upfront and get <strong>{freeMonths} month{freeMonths > 1 ? 's' : ''} completely free</strong></p>
                              </div>
                              <div className="ml-auto text-right flex-shrink-0">
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
                              const subscriptionType = planTab === 'monthly' ? '1-month' : planTab === '6months' ? '6-months' : '1-year';

                              // Is this tier the one the user is currently on (any billing period)?
                              const isActiveTier = idx === activeTierIndex && isCurrentPlan;
                              // Is this tier active AND on the same billing period currently shown?
                              const isCurrentTabAndTier = isActiveTier && (
                                (planTab === 'monthly' && activeSubType === '1-month') ||
                                (planTab === '6months' && activeSubType === '6-months') ||
                                (planTab === 'annual' && activeSubType === '1-year')
                              );

                              return (
                                <div
                                  key={tier._id}
                                  className={`relative rounded-2xl border-2 p-6 transition-all duration-200 flex flex-col ${
                                    isCurrentTabAndTier
                                      ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-indigo-50 shadow-xl ring-2 ring-blue-100'
                                      : isActiveTier
                                        ? 'border-blue-200 bg-blue-50/40 shadow-md'
                                        : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-lg'
                                  }`}
                                >
                                  {/* "Your Current Plan" badge */}
                                  {isCurrentTabAndTier && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1.5 shadow-lg whitespace-nowrap">
                                      <CheckCircle className="w-3 h-3" />
                                      Your Current Plan
                                    </div>
                                  )}
                                  {/* "Same tier, different billing" hint */}
                                  {isActiveTier && !isCurrentTabAndTier && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-400 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap shadow">
                                      Your Tier
                                    </div>
                                  )}

                                  {/* Tier label */}
                                  <div className="flex items-center gap-3 mb-5">
                                    <div className={`p-2.5 rounded-xl ${isCurrentTabAndTier ? 'bg-blue-600' : 'bg-orange-100'}`}>
                                      <Truck className={`w-5 h-5 ${isCurrentTabAndTier ? 'text-white' : 'text-orange-600'}`} />
                                    </div>
                                    <div>
                                      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Fleet Size</p>
                                      <p className="text-xl font-bold text-gray-900">{tier.minTrucks}–{tier.maxTrucks} Trucks</p>
                                    </div>
                                  </div>

                                  {/* Price block */}
                                  <div className="mb-5 flex-1">
                                    {strikethroughPrice && (
                                      <p className="text-sm text-gray-400 line-through mb-0.5">{formatPrice(strikethroughPrice, currency)}</p>
                                    )}
                                    <div className="flex items-baseline gap-1.5">
                                      <span className={`text-4xl font-extrabold ${isCurrentTabAndTier ? 'text-blue-700' : 'text-gray-900'}`}>
                                        {formatPrice(displayPrice, currency)}
                                      </span>
                                      <span className="text-sm text-gray-400 font-medium">
                                        {planTab === 'monthly' ? '/mo' : planTab === '6months' ? '/6 mo' : '/yr'}
                                      </span>
                                    </div>
                                    {planTab !== 'monthly' && (
                                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        {formatPrice(baseMonthly, currency)}/mo equivalent
                                      </p>
                                    )}
                                  </div>

                                  {/* Additional truck note — shown on every tier */}
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
                                          <span className="text-xs font-bold text-orange-600">+{formatPrice(extraPrice * billingFactor, extraCurrency)}{billingLabel}/truck</span>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Divider */}
                                  <div className={`h-px mb-5 ${isCurrentTabAndTier ? 'bg-blue-200' : 'bg-gray-100'}`} />

                                  {/* CTA */}
                                  <Button
                                    type="primary"
                                    size="middle"
                                    block
                                    icon={isCurrentTabAndTier
                                      ? <CheckCircle className="w-4 h-4" />
                                      : <ArrowRight className="w-4 h-4" />}
                                    onClick={() => { if (!isCurrentTabAndTier) handleTierSubscribe(plan, tier, subscriptionType); }}
                                    disabled={isCurrentTabAndTier}
                                    style={isCurrentTabAndTier
                                      ? { background: '#2563eb', color: '#fff', border: 'none', cursor: 'default', opacity: 1, fontWeight: 600 }
                                      : { ...primaryButtonStyle, fontWeight: 600 }}
                                  >
                                    {isCurrentTabAndTier ? 'Current Plan' : isCurrentPlan ? 'Switch to This' : 'Subscribe Now'}
                                  </Button>
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
                            return (
                              <div className="mb-6 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 overflow-hidden">
                                <div className="flex items-center gap-2 px-5 py-3 bg-orange-100 border-b border-orange-200">
                                  <TrendingUp className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-bold text-orange-800">Additional Trucks Beyond {lastTierMax}</span>
                                </div>
                                <div className="flex items-center gap-5 flex-wrap px-5 py-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700">Have more than <strong>{lastTierMax} trucks</strong>? Add extras at a flat per-truck rate — no plan change needed.</p>
                                    <p className="text-xs text-gray-500 mt-1">Base rate: {formatPrice(extraPrice, extraCurrency)}/truck/month</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-2xl font-extrabold text-orange-600">{formatPrice(extraDisplayPrice, extraCurrency)}</p>
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
          )}

          {/* Subscription History Tab */}
          {activeTab === 'history' && (
            <div>
              {subscriptions.length > 0 ? (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <Card
                      key={sub._id}
                      className="hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-purple-300 !mb-4"
                      style={cardAccentStyle}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            {getStatusIcon(sub.status)}
                            <h3 className="text-xl font-bold text-gray-900">
                              {typeof sub.plan === 'object'
                                ? sub.plan?.planName
                                : sub.planSnapshot?.planName || 'Plan'}
                            </h3>
                            <Tag color={getStatusColor(sub.status)}>{sub.status.toUpperCase()}</Tag>
                            <Tag color={sub.paymentStatus === 'paid' ? 'success' : 'warning'}>
                              {sub.paymentStatus.toUpperCase()}
                            </Tag>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                              <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                <span className="text-xs text-gray-600 font-medium">Amount</span>
                              </div>
                              <p className="text-lg font-bold text-gray-900">
                                {formatPrice(sub.amount, sub.currency)}
                                {sub.planType === 'monthly' && (
                                  <span className="text-sm font-normal text-gray-600">/month</span>
                                )}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span className="text-xs text-gray-600 font-medium">Started</span>
                              </div>
                              <p className="text-sm font-bold text-gray-900">
                                {new Date(sub.startDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            {sub.nextBillingDate && (
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-gray-600 font-medium">Next Billing</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                  {new Date(sub.nextBillingDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            )}
                            {sub.installments && (
                              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp className="w-4 h-4 text-yellow-600" />
                                  <span className="text-xs text-gray-600 font-medium">Installments</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                  {sub.installments.paid}/{sub.installments.total}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {sub.status === 'active' && (
                          <Button
                            danger
                            size="large"
                            icon={<X className="w-4 h-4" />}
                            onClick={(e) => handleCancelSubscription(sub._id, e)}
                            className="lg:self-start"
                            style={{ pointerEvents: 'auto', zIndex: 10 }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subscription History</h3>
                  <p className="text-gray-600">You don't have any past subscriptions yet.</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Subscribe Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Confirm Subscription</span>
          </div>
        }
        open={showSubscribeModal}
        onCancel={() => {
          setShowSubscribeModal(false);
          setSelectedPlan(null);
          setSelectedType('');
          setSelectedTier(null);
          setTruckCount(1);
          setExtraTrucks(0);
        }}
        footer={[
          <Button
            key="cancel"
            size="large"
            onClick={() => {
              setShowSubscribeModal(false);
              setSelectedPlan(null);
              setSelectedType('');
              setSelectedTier(null);
              setTruckCount(1);
            }}
            className="font-semibold"
          >
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            size="large"
            loading={processing}
            onClick={confirmSubscribe}
            icon={<ArrowRight className="w-4 h-4" />}
            style={primaryButtonStyle}
          >
            {processing ? 'Processing...' : 'Proceed to Checkout'}
          </Button>,
        ]}
        width={600}
      >
        {selectedPlan && (
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
              <p className="text-gray-700 mb-2">
                You are about to subscribe to
              </p>
              <h3 className="text-2xl font-bold text-purple-900 mb-4">{selectedPlan.planName}</h3>
              <div className="flex items-center gap-2">
                <Tag color={selectedPlan.planType === 'lifetime' ? 'blue' : 'green'}>
                  {selectedPlan.planType}
                </Tag>
                <span className="text-gray-600 text-sm">with the following option:</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <p className="font-bold text-gray-900 text-lg capitalize">
                    {selectedType.replace('-', ' ')}
                  </p>
                </div>
              </div>
              {selectedPlan.planType === 'lifetime' && selectedPlan.lifetime && (
                <>
                  {selectedType === 'one-time' && (
                    <div>
                      <p className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPrice(selectedPlan.lifetime.oneTime.price, selectedPlan.lifetime.oneTime.currency)}
                      </p>
                      <p className="text-sm text-gray-600">One-time payment, lifetime access</p>
                    </div>
                  )}
                  {selectedType === '3-months' && (
                    <div>
                      <p className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPrice(selectedPlan.lifetime.installments?.threeMonths?.price ?? 0, selectedPlan.lifetime.installments?.threeMonths?.currency ?? 'CAD')}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600">3 monthly payments of {formatPrice(selectedPlan.lifetime.installments?.threeMonths?.price ?? 0, selectedPlan.lifetime.installments?.threeMonths?.currency ?? 'CAD')}</p>
                    </div>
                  )}
                  {selectedType === '6-months' && (
                    <div>
                      <p className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPrice(selectedPlan.lifetime.installments?.sixMonths?.price ?? 0, selectedPlan.lifetime.installments?.sixMonths?.currency ?? 'CAD')}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600">6 monthly payments of {formatPrice(selectedPlan.lifetime.installments?.sixMonths?.price ?? 0, selectedPlan.lifetime.installments?.sixMonths?.currency ?? 'CAD')}</p>
                    </div>
                  )}
                </>
              )}
              {selectedPlan.planType === 'monthly' && selectedPlan.monthly && (
                <>
                  {selectedType === 'full-app' && (
                    <div>
                      <p className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPrice(selectedPlan.monthly.fullApp?.price ?? 0, selectedPlan.monthly.fullApp?.currency ?? 'CAD')}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600">Complete feature bundle</p>
                    </div>
                  )}
                  {selectedType === 'without-hr' && (
                    <div>
                      <p className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPrice(selectedPlan.monthly.withoutHR?.price ?? 0, selectedPlan.monthly.withoutHR?.currency ?? 'CAD')}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600">Streamlined experience without HR</p>
                    </div>
                  )}
                  {(selectedType === '1-month' || selectedType === '6-months' || selectedType === '1-year') && selectedTier && (() => {
                    const billingFactor = selectedType === '1-month' ? 1 : selectedType === '6-months' ? 6 : 12;
                    const billingLabel = selectedType === '1-month' ? '/month' : selectedType === '6-months' ? '/6 months' : '/year';
                    const allTiers = selectedPlan?.monthly?.truckPricing?.tiers ?? [];
                    const globalMaxTrucks = allTiers.length > 0 ? allTiers[allTiers.length - 1].maxTrucks : selectedTier.maxTrucks;
                    const extraTruckPrice = selectedPlan?.monthly?.truckPricing?.extraTruckPrice ?? 0;
                    const extraTruckCurrency = selectedPlan?.monthly?.truckPricing?.extraTruckCurrency ?? selectedTier.currency;
                    const basePriceTotal = selectedTier.monthlyPrice * billingFactor;
                    const extraCostTotal = extraTrucks * extraTruckPrice * billingFactor;
                    const grandTotal = basePriceTotal + extraCostTotal;

                    return (
                      <div className="space-y-4">
                        {/* Tier base price row */}
                        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-semibold text-gray-800">{selectedTier.minTrucks}–{selectedTier.maxTrucks} Trucks (base)</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {formatPrice(basePriceTotal, selectedTier.currency)}<span className="text-xs font-normal text-gray-500">{billingLabel}</span>
                            </span>
                          </div>

                          {/* Extra trucks row — shown for all tiers */}
                          {extraTruckPrice > 0 && (
                            <div className="px-4 py-3 border-b border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Extra trucks (beyond {globalMaxTrucks})</span>
                                <span className="text-xs text-orange-600 font-medium">{formatPrice(extraTruckPrice, extraTruckCurrency)}/truck/mo</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setExtraTrucks(Math.max(0, extraTrucks - 1))}
                                  className="w-8 h-8 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-lg leading-none"
                                >−</button>
                                <span className="w-12 text-center font-bold text-lg text-gray-900">{extraTrucks}</span>
                                <button
                                  onClick={() => setExtraTrucks(extraTrucks + 1)}
                                  className="w-8 h-8 rounded-lg border border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-lg leading-none"
                                >+</button>
                                {extraTrucks > 0 && (
                                  <span className="ml-auto text-sm font-semibold text-orange-600">
                                    +{formatPrice(extraCostTotal, extraTruckCurrency)}{billingLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Grand total */}
                          <div className="flex items-center justify-between px-4 py-3 bg-blue-50">
                            <span className="text-sm font-bold text-gray-800">Total</span>
                            <div className="text-right">
                              <span className="text-xl font-extrabold text-blue-700">{formatPrice(grandTotal, selectedTier.currency)}</span>
                              <span className="text-xs text-gray-500 ml-1">{billingLabel}</span>
                              {selectedType !== '1-month' && (
                                <p className="text-xs text-gray-400 mt-0.5">{formatPrice(grandTotal / billingFactor, selectedTier.currency)}/mo equivalent</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                You will be redirected to <strong>Stripe checkout</strong> to complete your payment securely.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Extra Trucks Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Add Extra Trucks</span>
          </div>
        }
        open={showAddTruckModal}
        onCancel={() => { setShowAddTruckModal(false); setAddTruckCount(1); }}
        footer={[
          <Button key="cancel" size="large" onClick={() => { setShowAddTruckModal(false); setAddTruckCount(1); }}>Cancel</Button>,
          <Button
            key="confirm"
            type="primary"
            size="large"
            loading={addTruckProcessing}
            onClick={confirmAddTrucks}
            icon={<ArrowRight className="w-4 h-4" />}
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)', border: 'none', fontWeight: 600 }}
          >
            {addTruckProcessing ? 'Processing...' : 'Proceed to Checkout'}
          </Button>,
        ]}
        width={500}
      >
        {activeSubscription && (() => {
          const activePlan = typeof activeSubscription.plan === 'object' ? activeSubscription.plan as Plan : null;
          const extraTruckPrice = activePlan?.monthly?.truckPricing?.extraTruckPrice ?? 0;
          const extraTruckCurrency = activePlan?.monthly?.truckPricing?.extraTruckCurrency ?? 'CAD';
          const currentMaxTrucks = activeSubscription.maxTrucks ?? activeSubscription.truckCount ?? 0;
          const totalCost = addTruckCount * extraTruckPrice;

          return (
            <div className="space-y-5 py-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm text-gray-700 mb-1">You are adding extra trucks to:</p>
                <p className="text-lg font-bold text-orange-900">
                  {activePlan?.planName || 'Your Current Plan'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current limit: {currentMaxTrucks} trucks</p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">How many extra trucks do you need?</p>
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => setAddTruckCount(Math.max(1, addTruckCount - 1))}
                    className="w-10 h-10 rounded-xl border-2 border-gray-300 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-xl leading-none"
                  >−</button>
                  <span className="w-16 text-center font-bold text-2xl text-gray-900">{addTruckCount}</span>
                  <button
                    onClick={() => setAddTruckCount(addTruckCount + 1)}
                    className="w-10 h-10 rounded-xl border-2 border-orange-400 bg-orange-50 flex items-center justify-center text-orange-600 hover:bg-orange-100 font-bold text-xl leading-none"
                  >+</button>
                  <div className="ml-2">
                    <p className="text-xs text-gray-500">truck{addTruckCount > 1 ? 's' : ''} to add</p>
                    <p className="text-xs text-gray-400">New limit: <strong>{currentMaxTrucks + addTruckCount}</strong> trucks</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{addTruckCount} truck{addTruckCount > 1 ? 's' : ''} × {formatPrice(extraTruckPrice, extraTruckCurrency)}/truck/mo</span>
                    <span className="font-semibold text-gray-900">{formatPrice(totalCost, extraTruckCurrency)}/mo</span>
                  </div>
                  <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-bold text-gray-800">Total charge now</span>
                    <span className="text-xl font-extrabold text-orange-600">{formatPrice(totalCost, extraTruckCurrency)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  You will be redirected to <strong>Stripe checkout</strong> to complete the payment. Your truck limit will be increased immediately after payment.
                </p>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="text-xl font-bold">Cancel Subscription</span>
          </div>
        }
        open={showCancelModal}
        onCancel={() => {
          setShowCancelModal(false);
          setCancelSubscriptionId(null);
        }}
        footer={[
          <Button
            key="cancel"
            size="large"
            onClick={() => {
              setShowCancelModal(false);
              setCancelSubscriptionId(null);
            }}
            disabled={cancelling}
            className="font-semibold"
          >
            Keep Subscription
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            size="large"
            loading={cancelling}
            onClick={confirmCancelSubscription}
            icon={<X className="w-4 h-4" />}
            className="bg-red-500 hover:bg-red-600 border-red-500 hover:border-red-600 font-semibold shadow-lg"
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
          </Button>,
        ]}
        width={500}
        centered
        maskClosable={!cancelling}
      >
        <div className="py-4">
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Are you sure you want to cancel this subscription?
            </p>
            <p className="text-red-600 font-semibold">
              This action cannot be undone.
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                Your subscription will remain active until the end of the current billing period.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionPage;

