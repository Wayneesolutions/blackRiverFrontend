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
import { getAllPlans, getMySubscription, getMySubscriptions, createCheckoutSession, cancelSubscription, getTrialStatus } from '../../../axios/api/subscription';
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
      tiers: { minTrucks: number; maxTrucks: number; totalPrice: number; currency: string; _id: string }[];
      extraTruckPrice: number;
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
  const [selectedTier, setSelectedTier] = useState<{ minTrucks: number; maxTrucks: number; totalPrice: number; currency: string; _id: string } | null>(null);
  const [truckCount, setTruckCount] = useState<number>(1);


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

  const handleTruckSubscribe = (plan: Plan, tier: { minTrucks: number; maxTrucks: number; totalPrice: number; currency: string; _id: string }) => {
    setSelectedPlan(plan);
    setSelectedType('1-month');
    setSelectedTier(tier);
    setTruckCount(tier.minTrucks);
    setShowSubscribeModal(true);
  };

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const response = await createCheckoutSession({
        planId: selectedPlan._id,
        subscriptionType: selectedType,
        ...((selectedType === '1-month' || selectedType === '1-year') && { truckCount }),
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

    if (status === 'success' && sessionId) {
      message.success('Payment successful! Your subscription is being activated.');
      fetchData();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'cancel') {
      message.info('Payment was cancelled.');
      window.history.replaceState({}, '', window.location.pathname);
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

                    {activeSubscription.installments && (
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200 md:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            <span className="text-gray-700 text-sm font-medium">Installment Progress</span>
                          </div>
                          <span className="text-gray-900 font-bold">
                            {activeSubscription.installments.paid} / {activeSubscription.installments.total}
                          </span>
                        </div>
                        <Progress
                          percent={Math.round((activeSubscription.installments.paid / activeSubscription.installments.total) * 100)}
                          strokeColor={{
                            '0%': '#6366f1',
                            '100%': '#4f46e5',
                          }}
                          className="mb-2"
                        />
                        <p className="text-gray-600 text-xs">
                          {activeSubscription.installments.remaining} payments remaining
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {plans.map((plan) => {
                const currentPlanId = typeof activeSubscription?.plan === 'object' ? activeSubscription.plan?._id : null;
                const isCurrentPlan = currentPlanId === plan._id;
                return (
                  <div
                    key={plan._id}
                    className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 flex flex-col ${isCurrentPlan
                        ? 'border-blue-300 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-blue-300'
                      }`}
                    style={isCurrentPlan ? { borderColor: '#93c5fd', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15)' } : cardAccentStyle}
                  >
                    {/* Plan Header with Light Background */}
                    <div
                      className={`relative p-6 ${isCurrentPlan
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-b-2 border-blue-200'
                          : 'bg-gradient-to-br from-gray-50 to-blue-50 border-b-2 border-gray-200'
                        }`}
                    >
                      {isCurrentPlan && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Crown className="w-3 h-3" />
                            Current Plan {plan.planType}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-2xl font-bold ${isCurrentPlan ? 'text-gray-900' : 'text-gray-900'}`}>
                          {plan.planName}
                        </h3>
                        <Tag
                          color={plan.planType === 'lifetime' ? 'blue' : 'green'}
                        >
                          {plan.planType}
                        </Tag>
                      </div>
                      {plan.description && (
                        <p className={`text-sm ${isCurrentPlan ? 'text-gray-700' : 'text-gray-600'}`}>
                          {plan.description}
                        </p>
                      )}
                    </div>

                    {((plan.planType === 'lifetime' && plan.lifetime) || (plan.planType === 'monthly' && plan.monthly && (plan.monthly.fullApp?.enabled || plan.monthly.withoutHR?.enabled || plan.monthly.yearly?.enabled || (plan.monthly.truckPricing?.tiers?.length ?? 0) > 0))) && (
                      <div className="p-6">
                        {/* Pricing Options */}
                        {plan.planType === 'lifetime' && plan.lifetime && (
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-semibold text-gray-900">One-time Payment</span>
                                </div>
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={!isCurrentPlan && <ArrowRight className="w-3 h-3" />}
                                  onClick={() => handleSubscribe(plan, 'one-time')}
                                  disabled={isCurrentPlan}
                                  style={isCurrentPlan ? {
                                    background: '#3b82f6',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'default'
                                  } : primaryButtonStyle}
                                >
                                  {isCurrentPlan ? 'Current' : 'Subscribe'}
                                </Button>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(plan.lifetime.oneTime.price, plan.lifetime.oneTime.currency)}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">One-time payment, lifetime access</p>
                            </div>

                            {plan.lifetime.installments?.threeMonths?.enabled && (
                              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-gray-900">3 Monthly Installments</span>
                                  </div>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={!isCurrentPlan && <ArrowRight className="w-3 h-3" />}
                                    onClick={() => handleSubscribe(plan, '3-months')}
                                    disabled={isCurrentPlan}
                                    style={isCurrentPlan ? {
                                      background: '#3b82f6',
                                      color: '#fff',
                                      border: 'none',
                                      cursor: 'default'
                                    } : primaryButtonStyle}
                                  >
                                    {isCurrentPlan ? 'Current' : 'Subscribe'}
                                  </Button>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatPrice(plan.lifetime.installments.threeMonths.price, plan.lifetime.installments.threeMonths.currency)}
                                  <span className="text-sm font-normal text-gray-600">/month</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">3 payments of {formatPrice(plan.lifetime.installments.threeMonths.price, plan.lifetime.installments.threeMonths.currency)}</p>
                              </div>
                            )}

                            {plan.lifetime.installments?.sixMonths?.enabled && (
                              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-semibold text-gray-900">6 Monthly Installments</span>
                                  </div>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={!isCurrentPlan && <ArrowRight className="w-3 h-3" />}
                                    onClick={() => handleSubscribe(plan, '6-months')}
                                    disabled={isCurrentPlan}
                                    style={isCurrentPlan ? {
                                      background: '#3b82f6',
                                      color: '#fff',
                                      border: 'none',
                                      cursor: 'default'
                                    } : primaryButtonStyle}
                                  >
                                    {isCurrentPlan ? 'Current' : 'Subscribe'}
                                  </Button>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatPrice(plan.lifetime.installments.sixMonths.price, plan.lifetime.installments.sixMonths.currency)}
                                  <span className="text-sm font-normal text-gray-600">/month</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">6 payments of {formatPrice(plan.lifetime.installments.sixMonths.price, plan.lifetime.installments.sixMonths.currency)}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {plan.planType === 'monthly' && plan.monthly && (
                          <>
                            {plan.monthly.fullApp?.enabled && (plan.monthly.fullApp.price ?? 0) > 0 && (
                              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-gray-900">Full App</span>
                                  </div>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={!isCurrentPlan && <ArrowRight className="w-3 h-3" />}
                                    onClick={() => handleSubscribe(plan, 'full-app')}
                                    disabled={isCurrentPlan}
                                    style={isCurrentPlan ? {
                                      background: '#3b82f6',
                                      color: '#fff',
                                      border: 'none',
                                      cursor: 'default'
                                    } : primaryButtonStyle}
                                  >
                                    {isCurrentPlan ? 'Current' : 'Subscribe'}
                                  </Button>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatPrice(plan.monthly.fullApp.price, plan.monthly.fullApp.currency)}
                                  <span className="text-sm font-normal text-gray-600">/month</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Complete feature bundle</p>
                              </div>
                            )}

                            {plan.monthly.truckPricing?.tiers && plan.monthly.truckPricing.tiers.length > 0 && (
                              <div className="mt-4 rounded-xl border-2 border-orange-200 overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                                  <Truck className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-semibold text-gray-900">Monthly — Truck-Based Pricing</span>
                                </div>
                                <div className="divide-y divide-orange-100">
                                  {plan.monthly.truckPricing.tiers.map((tier) => (
                                    <div key={tier._id} className="flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors">
                                      <div>
                                        <span className="text-sm font-medium text-gray-900">{tier.minTrucks}–{tier.maxTrucks} Trucks</span>
                                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                                          {formatPrice(tier.totalPrice, tier.currency)}
                                          <span className="text-xs font-normal text-gray-500 ml-1">/month</span>
                                        </p>
                                      </div>
                                      <Button
                                        type="primary"
                                        size="small"
                                        icon={!isCurrentPlan && <ArrowRight className="w-3 h-3" />}
                                        onClick={() => handleTruckSubscribe(plan, tier)}
                                        disabled={isCurrentPlan}
                                        style={isCurrentPlan ? { background: '#3b82f6', color: '#fff', border: 'none', cursor: 'default' } : primaryButtonStyle}
                                      >
                                        {isCurrentPlan ? 'Current' : 'Subscribe'}
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {plan.monthly.yearly?.enabled && (
                              <div className="mt-4 p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-semibold text-gray-900">Annual Plan</span>
                                    <Tag color="green" className="text-xs">Best Value</Tag>
                                  </div>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={!isCurrentPlan && <ArrowRight className="w-3 h-3" />}
                                    onClick={() => handleSubscribe(plan, '1-year')}
                                    disabled={isCurrentPlan}
                                    style={isCurrentPlan ? { background: '#3b82f6', color: '#fff', border: 'none', cursor: 'default' } : primaryButtonStyle}
                                  >
                                    {isCurrentPlan ? 'Current' : 'Subscribe'}
                                  </Button>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatPrice(plan.monthly.yearly.price, plan.monthly.yearly.currency)}
                                  <span className="text-sm font-normal text-gray-600">/year</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Billed annually — save vs monthly</p>
                              </div>
                            )}

                            {plan.monthly.withoutHR?.enabled && (
                              <div className={`p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors ${plan.monthly.fullApp?.enabled ? 'mt-4' : ''}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-semibold text-gray-900">Without HR</span>
                                  </div>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={!isCurrentPlan && <ArrowRight className="w-3 h-3" />}
                                    onClick={() => handleSubscribe(plan, 'without-hr')}
                                    disabled={isCurrentPlan}
                                    style={isCurrentPlan ? {
                                      background: '#3b82f6',
                                      color: '#fff',
                                      border: 'none',
                                      cursor: 'default'
                                    } : primaryButtonStyle}
                                  >
                                    {isCurrentPlan ? 'Current' : 'Subscribe'}
                                  </Button>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatPrice(plan.monthly.withoutHR.price, plan.monthly.withoutHR.currency)}
                                  <span className="text-sm font-normal text-gray-600">/month</span>
                                </p>
                                <p className="text-xs text-gray-600 mt-1">Access without HR features</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
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
                        {formatPrice(selectedPlan.lifetime.installments.threeMonths.price, selectedPlan.lifetime.installments.threeMonths.currency)}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600">3 monthly payments of {formatPrice(selectedPlan.lifetime.installments.threeMonths.price, selectedPlan.lifetime.installments.threeMonths.currency)}</p>
                    </div>
                  )}
                  {selectedType === '6-months' && (
                    <div>
                      <p className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPrice(selectedPlan.lifetime.installments.sixMonths.price, selectedPlan.lifetime.installments.sixMonths.currency)}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600">6 monthly payments of {formatPrice(selectedPlan.lifetime.installments.sixMonths.price, selectedPlan.lifetime.installments.sixMonths.currency)}</p>
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
                  {selectedType === '1-month' && selectedTier && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Truck className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-gray-600">Tier: {selectedTier.minTrucks}–{selectedTier.maxTrucks} Trucks — {formatPrice(selectedTier.totalPrice, selectedTier.currency)}/month</span>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your exact truck count</label>
                      <input
                        type="number"
                        min={selectedTier.minTrucks}
                        max={selectedTier.maxTrucks}
                        value={truckCount}
                        onChange={(e) => setTruckCount(Math.max(selectedTier.minTrucks, Math.min(selectedTier.maxTrucks, Number(e.target.value))))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be between {selectedTier.minTrucks} and {selectedTier.maxTrucks}</p>
                    </div>
                  )}
                  {selectedType === '1-year' && selectedPlan.monthly.yearly && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-600">Annual billing — {formatPrice(selectedPlan.monthly.yearly.price, selectedPlan.monthly.yearly.currency)}/year</span>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your truck count</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={truckCount}
                        onChange={(e) => setTruckCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be between 1 and 20</p>
                    </div>
                  )}
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

