import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Crown,
  Zap,
  Shield,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Info,
  BadgeCheck,
  X,
  History,
  Package,
  Star,
} from 'lucide-react';
import { message, Modal, Button, Tag, Card, Spin, Tabs, Progress } from 'antd';
import { getAllPlans, getMySubscription, getMySubscriptions, createCheckoutSession, cancelSubscription } from '../../../axios/api/subscription';
import { getAllowedRolesForAdmin } from '../../../axios/api/superadmin';

interface Plan {
  _id: string;
  planName: string;
  planType: 'lifetime' | 'monthly';
  description: string;
  lifetime?: {
    oneTime: { price: number; currency: string };
    installments: {
      threeMonths: { price: number; currency: string; enabled: boolean };
      sixMonths: { price: number; currency: string; enabled: boolean };
    };
  };
  monthly?: {
    fullApp: { price: number; currency: string; enabled: boolean };
    withoutHR: { price: number; currency: string; enabled: boolean };
  };
  allowedRoles?: string[];
  blockedRoles?: string[];
  status: 'active' | 'inactive';
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
  installments?: {
    total: number;
    paid: number;
    remaining: number;
  };
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
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSubscriptionId, setCancelSubscriptionId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subscriptionRes, subscriptionsRes, allowedRolesRes] = await Promise.all([
        getAllPlans(),
        getMySubscription(),
        getMySubscriptions(),
        getAllowedRolesForAdmin(),
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

      if (allowedRolesRes?.success && allowedRolesRes.data?.allowedRoles) {
        setAllowedRoles(allowedRolesRes.data.allowedRoles || []);
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
    setShowSubscribeModal(true);
  };

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const response = await createCheckoutSession({
        planId: selectedPlan._id,
        subscriptionType: selectedType,
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Subscription & Plans
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Manage your subscription and choose from available plans
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Active Subscription Card */}
        {activeSubscription && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 shadow-2xl">
            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 pointer-events-none"></div>
            
            <div className="relative p-8 z-10">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Crown className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        Active Subscription
                        {getStatusIcon(activeSubscription.status)}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag color={getStatusColor(activeSubscription.status)} className="bg-white/20 text-white border-white/30">
                          {activeSubscription.status.toUpperCase()}
                        </Tag>
                        <Tag color={activeSubscription.paymentStatus === 'paid' ? 'success' : 'warning'} className="bg-white/20 text-white border-white/30">
                          {activeSubscription.paymentStatus.toUpperCase()}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-yellow-300" />
                        <span className="text-white/80 text-sm font-medium">Plan Name</span>
                      </div>
                      <p className="text-white text-xl font-bold">
                        {typeof activeSubscription.plan === 'object' 
                          ? activeSubscription.plan?.planName 
                          : activeSubscription.planSnapshot?.planName || 'Plan'}
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-yellow-300" />
                        <span className="text-white/80 text-sm font-medium">Subscription Type</span>
                      </div>
                      <p className="text-white text-xl font-bold capitalize">
                        {activeSubscription.planType} - {activeSubscription.subscriptionType.replace('-', ' ')}
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-yellow-300" />
                        <span className="text-white/80 text-sm font-medium">Amount</span>
                      </div>
                      <p className="text-white text-2xl font-bold">
                        {formatPrice(activeSubscription.amount, activeSubscription.currency)}
                        {activeSubscription.planType === 'monthly' && (
                          <span className="text-base font-normal">/month</span>
                        )}
                      </p>
                    </div>

                    {activeSubscription.nextBillingDate && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-yellow-300" />
                          <span className="text-white/80 text-sm font-medium">Next Billing</span>
                        </div>
                        <p className="text-white text-xl font-bold">
                          {new Date(activeSubscription.nextBillingDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {activeSubscription.installments && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 md:col-span-2">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-yellow-300" />
                            <span className="text-white/80 text-sm font-medium">Installment Progress</span>
                          </div>
                          <span className="text-white font-bold">
                            {activeSubscription.installments.paid} / {activeSubscription.installments.total}
                          </span>
                        </div>
                        <Progress
                          percent={Math.round((activeSubscription.installments.paid / activeSubscription.installments.total) * 100)}
                          strokeColor={{
                            '0%': '#fbbf24',
                            '100%': '#f59e0b',
                          }}
                          className="mb-2"
                        />
                        <p className="text-white/70 text-xs">
                          {activeSubscription.installments.remaining} payments remaining
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Role Permissions */}
                  {activeSubscription && (() => {
                    // Use planSnapshot if available (what admin paid for), otherwise fall back to populated plan
                    const plan = typeof activeSubscription.plan === 'object' ? activeSubscription.plan : null;
                    const planSnapshot = activeSubscription.planSnapshot;
                    const blockedRoles = planSnapshot?.blockedRoles || plan?.blockedRoles || [];
                    const allowedRoles = planSnapshot?.allowedRoles || plan?.allowedRoles || [];
                    
                    if (!plan && !planSnapshot) return null;
                    
                    return (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Shield className="w-5 h-5 text-yellow-300" />
                          <h3 className="text-white font-semibold">Role Creation Permissions</h3>
                          {planSnapshot && (
                            <Tag color="blue" className="ml-auto">
                              Snapshot Protected
                            </Tag>
                          )}
                        </div>
                        <div className="space-y-3">
                          {blockedRoles && blockedRoles.length > 0 && (
                            <div>
                              <p className="text-red-200 text-xs font-medium mb-2 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Cannot Create These Roles:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {blockedRoles.map((role: string) => (
                                  <Tag key={role} color="red" className="bg-red-500/20 text-red-100 border-red-400/30">
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )}
                          {allowedRoles && allowedRoles.length > 0 ? (
                            <div>
                              <p className="text-green-200 text-xs font-medium mb-2 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Can Only Create These Roles:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {allowedRoles.map((role: string) => (
                                  <Tag key={role} color="green" className="bg-green-500/20 text-green-100 border-green-400/30">
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          ) : (!blockedRoles || blockedRoles.length === 0) ? (
                            <div className="flex items-center gap-2 text-blue-200">
                              <BadgeCheck className="w-4 h-4" />
                              <p className="text-sm font-medium">All roles allowed</p>
                            </div>
                          ) : null}
                          {allowedRoles.length > 0 && (
                            <div className="pt-3 border-t border-white/20">
                              <p className="text-blue-200 text-xs font-medium mb-2 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Your Current Permissions:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {allowedRoles.map((role: string) => (
                                  <Tag key={role} color="blue" className="bg-blue-500/20 text-blue-100 border-blue-400/30">
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-2 text-white/80 text-sm">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const currentPlanId = typeof activeSubscription?.plan === 'object' ? activeSubscription.plan?._id : null;
                const isCurrentPlan = currentPlanId === plan._id;
                return (
                  <div
                    key={plan._id}
                    className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${
                      isCurrentPlan
                        ? 'border-purple-500 ring-4 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {/* Plan Header with Gradient */}
                    <div
                      className={`relative p-6 ${
                        isCurrentPlan
                          ? 'bg-gradient-to-br from-purple-600 to-blue-600'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100'
                      }`}
                    >
                      {isCurrentPlan && (
                        <div className="absolute top-4 right-4">
                          <div className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Crown className="w-3 h-3" />
                            Current Plan
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-2xl font-bold ${isCurrentPlan ? 'text-white' : 'text-gray-900'}`}>
                          {plan.planName}
                        </h3>
                        <Tag
                          color={plan.planType === 'lifetime' ? 'blue' : 'green'}
                          className={`${
                            isCurrentPlan
                              ? 'bg-white/20 text-white border-white/30'
                              : ''
                          }`}
                        >
                          {plan.planType}
                        </Tag>
                      </div>
                      {plan.description && (
                        <p className={`text-sm ${isCurrentPlan ? 'text-white/90' : 'text-gray-600'}`}>
                          {plan.description}
                        </p>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Role Restrictions */}
                      {(plan.blockedRoles && plan.blockedRoles.length > 0) ||
                      (plan.allowedRoles && plan.allowedRoles.length > 0) ? (
                        <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-4 h-4 text-gray-600" />
                            <p className="text-xs font-semibold text-gray-700">Role Restrictions:</p>
                          </div>
                          {plan.blockedRoles && plan.blockedRoles.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                Cannot Create:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {plan.blockedRoles.map((role) => (
                                  <Tag key={role} color="red" className="text-xs">
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )}
                          {plan.allowedRoles && plan.allowedRoles.length > 0 && (
                            <div>
                              <p className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Can Only Create:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {plan.allowedRoles.map((role) => (
                                  <Tag key={role} color="green" className="text-xs">
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <div className="flex items-center gap-2">
                            <BadgeCheck className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-blue-700 font-medium">All roles allowed</p>
                          </div>
                        </div>
                      )}

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
                                icon={<ArrowRight className="w-3 h-3" />}
                                onClick={() => handleSubscribe(plan, 'one-time')}
                                disabled={isCurrentPlan}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 hover:from-blue-700 hover:to-indigo-700"
                              >
                                {isCurrentPlan ? 'Current' : 'Subscribe'}
                              </Button>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatPrice(plan.lifetime.oneTime.price, plan.lifetime.oneTime.currency)}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">One-time payment, lifetime access</p>
                          </div>

                          {plan.lifetime.installments.threeMonths.enabled && (
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-semibold text-gray-900">3 Monthly Installments</span>
                                </div>
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<ArrowRight className="w-3 h-3" />}
                                  onClick={() => handleSubscribe(plan, '3-months')}
                                  disabled={isCurrentPlan}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 hover:from-purple-700 hover:to-pink-700"
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

                          {plan.lifetime.installments.sixMonths.enabled && (
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-semibold text-gray-900">6 Monthly Installments</span>
                                </div>
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<ArrowRight className="w-3 h-3" />}
                                  onClick={() => handleSubscribe(plan, '6-months')}
                                  disabled={isCurrentPlan}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 hover:from-green-700 hover:to-emerald-700"
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
                        <div className="space-y-4">
                          {plan.monthly.fullApp.enabled && (
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-semibold text-gray-900">Full App</span>
                                </div>
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<ArrowRight className="w-3 h-3" />}
                                  onClick={() => handleSubscribe(plan, 'full-app')}
                                  disabled={isCurrentPlan}
                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 hover:from-blue-700 hover:to-indigo-700"
                                >
                                  {isCurrentPlan ? 'Current' : 'Subscribe'}
                                </Button>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatPrice(plan.monthly.fullApp.price, plan.monthly.fullApp.currency)}
                                <span className="text-sm font-normal text-gray-600">/month</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Full access to all features</p>
                            </div>
                          )}

                          {plan.monthly.withoutHR.enabled && (
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-semibold text-gray-900">Without HR</span>
                                </div>
                                <Button
                                  type="primary"
                                  size="small"
                                  icon={<ArrowRight className="w-3 h-3" />}
                                  onClick={() => handleSubscribe(plan, 'without-hr')}
                                  disabled={isCurrentPlan}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 hover:from-purple-700 hover:to-pink-700"
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
                      className="hover:shadow-lg transition-all duration-300 border-2 border-gray-200 hover:border-purple-300"
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
        }}
        footer={[
          <Button
            key="cancel"
            size="large"
            onClick={() => {
              setShowSubscribeModal(false);
              setSelectedPlan(null);
              setSelectedType('');
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
            className="bg-gradient-to-r from-purple-600 to-blue-600 border-0 hover:from-purple-700 hover:to-blue-700 font-semibold shadow-lg"
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
                        {formatPrice(selectedPlan.monthly.fullApp.price, selectedPlan.monthly.fullApp.currency)}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600">Full access to all features</p>
                    </div>
                  )}
                  {selectedType === 'without-hr' && (
                    <div>
                      <p className="text-3xl font-bold text-gray-900 mb-2">
                        {formatPrice(selectedPlan.monthly.withoutHR.price, selectedPlan.monthly.withoutHR.currency)}
                        <span className="text-lg font-normal text-gray-600">/month</span>
                      </p>
                      <p className="text-sm text-gray-600">Access without HR features</p>
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

