import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { message, Modal, Button, Tag, Card, Spin } from 'antd';
import { getAllPlans, getMySubscription, getMySubscriptions, createCheckoutSession, cancelSubscription } from '../../../axios/api/subscription';

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
  status: 'active' | 'inactive';
}

interface Subscription {
  _id: string;
  plan: Plan;
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subscriptionRes, subscriptionsRes] = await Promise.all([
        getAllPlans(),
        getMySubscription(),
        getMySubscriptions(),
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
    } catch (error: any) {
      console.error('Error fetching data:', error);
      message.error(error?.message || 'Failed to fetch data');
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

  const handleCancelSubscription = async (subscriptionId: string) => {
    Modal.confirm({
      title: 'Cancel Subscription',
      content: 'Are you sure you want to cancel this subscription? This action cannot be undone.',
      okText: 'Cancel Subscription',
      okType: 'danger',
      cancelText: 'Keep Subscription',
      onOk: async () => {
        try {
          const response = await cancelSubscription(subscriptionId);
          if (response?.success) {
            message.success('Subscription cancelled successfully');
            fetchData();
          } else {
            message.error(response?.message || 'Failed to cancel subscription');
          }
        } catch (error: any) {
          console.error('Error cancelling subscription:', error);
          message.error(error?.message || 'Failed to cancel subscription');
        }
      },
    });
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-purple-600" />
            Subscription & Plans
          </h1>
          <p className="text-gray-600 mt-2">Manage your subscription and choose from available plans</p>
        </div>

        {/* Active Subscription */}
        {activeSubscription && (
          <Card className="mb-6 border-2 border-purple-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {getStatusIcon(activeSubscription.status)}
                  <h2 className="text-xl font-semibold text-gray-900">Active Subscription</h2>
                  <Tag color={getStatusColor(activeSubscription.status)}>
                    {activeSubscription.status.toUpperCase()}
                  </Tag>
                  <Tag color={activeSubscription.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {activeSubscription.paymentStatus.toUpperCase()}
                  </Tag>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Plan:</span> {activeSubscription.plan?.planName}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Type:</span> {activeSubscription.planType} - {activeSubscription.subscriptionType}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Amount:</span>{' '}
                    {formatPrice(activeSubscription.amount, activeSubscription.currency)}
                    {activeSubscription.planType === 'monthly' && '/month'}
                  </p>
                  {activeSubscription.installments && (
                    <p className="text-gray-700">
                      <span className="font-medium">Installments:</span>{' '}
                      {activeSubscription.installments.paid} of {activeSubscription.installments.total} paid
                    </p>
                  )}
                  {activeSubscription.nextBillingDate && (
                    <p className="text-gray-700">
                      <span className="font-medium">Next Billing:</span>{' '}
                      {new Date(activeSubscription.nextBillingDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-gray-700">
                    <span className="font-medium">Started:</span>{' '}
                    {new Date(activeSubscription.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {activeSubscription.status === 'active' && (
                <Button
                  danger
                  onClick={() => handleCancelSubscription(activeSubscription._id)}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Available Plans */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan._id}
                className="hover:shadow-lg transition-shadow"
                title={
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{plan.planName}</span>
                    <Tag color={plan.planType === 'lifetime' ? 'blue' : 'green'}>
                      {plan.planType}
                    </Tag>
                  </div>
                }
                extra={
                  activeSubscription?.plan?._id === plan._id ? (
                    <Tag color="success">Current Plan</Tag>
                  ) : null
                }
              >
                {plan.description && (
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                )}

                {plan.planType === 'lifetime' && plan.lifetime && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">One-time Payment</span>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleSubscribe(plan, 'one-time')}
                          disabled={activeSubscription?.plan?._id === plan._id}
                        >
                          Subscribe
                        </Button>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatPrice(plan.lifetime.oneTime.price, plan.lifetime.oneTime.currency)}
                      </p>
                    </div>

                    {plan.lifetime.installments.threeMonths.enabled && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">3 Monthly Installments</span>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleSubscribe(plan, '3-months')}
                            disabled={activeSubscription?.plan?._id === plan._id}
                          >
                            Subscribe
                          </Button>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(plan.lifetime.installments.threeMonths.price, plan.lifetime.installments.threeMonths.currency)}
                          <span className="text-sm font-normal text-gray-600">/month</span>
                        </p>
                      </div>
                    )}

                    {plan.lifetime.installments.sixMonths.enabled && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">6 Monthly Installments</span>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleSubscribe(plan, '6-months')}
                            disabled={activeSubscription?.plan?._id === plan._id}
                          >
                            Subscribe
                          </Button>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(plan.lifetime.installments.sixMonths.price, plan.lifetime.installments.sixMonths.currency)}
                          <span className="text-sm font-normal text-gray-600">/month</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {plan.planType === 'monthly' && plan.monthly && (
                  <div className="space-y-3">
                    {plan.monthly.fullApp.enabled && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Full App</span>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleSubscribe(plan, 'full-app')}
                            disabled={activeSubscription?.plan?._id === plan._id}
                          >
                            Subscribe
                          </Button>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(plan.monthly.fullApp.price, plan.monthly.fullApp.currency)}
                          <span className="text-sm font-normal text-gray-600">/month</span>
                        </p>
                      </div>
                    )}

                    {plan.monthly.withoutHR.enabled && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Without HR</span>
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleSubscribe(plan, 'without-hr')}
                            disabled={activeSubscription?.plan?._id === plan._id}
                          >
                            Subscribe
                          </Button>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(plan.monthly.withoutHR.price, plan.monthly.withoutHR.currency)}
                          <span className="text-sm font-normal text-gray-600">/month</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Subscription History */}
        {subscriptions.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription History</h2>
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <Card key={sub._id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(sub.status)}
                        <h3 className="font-semibold text-gray-900">{sub.plan?.planName}</h3>
                        <Tag color={getStatusColor(sub.status)}>{sub.status}</Tag>
                        <Tag color={sub.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {sub.paymentStatus}
                        </Tag>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <p className="font-medium">
                            {formatPrice(sub.amount, sub.currency)}
                            {sub.planType === 'monthly' && '/month'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Started:</span>
                          <p className="font-medium">{new Date(sub.startDate).toLocaleDateString()}</p>
                        </div>
                        {sub.nextBillingDate && (
                          <div>
                            <span className="text-gray-600">Next Billing:</span>
                            <p className="font-medium">{new Date(sub.nextBillingDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {sub.installments && (
                          <div>
                            <span className="text-gray-600">Installments:</span>
                            <p className="font-medium">
                              {sub.installments.paid}/{sub.installments.total}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {sub.status === 'active' && (
                      <Button
                        danger
                        size="small"
                        onClick={() => handleCancelSubscription(sub._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subscribe Confirmation Modal */}
      <Modal
        title="Confirm Subscription"
        open={showSubscribeModal}
        onCancel={() => {
          setShowSubscribeModal(false);
          setSelectedPlan(null);
          setSelectedType('');
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setShowSubscribeModal(false);
              setSelectedPlan(null);
              setSelectedType('');
            }}
          >
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={processing}
            onClick={confirmSubscribe}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {processing ? 'Processing...' : 'Proceed to Checkout'}
          </Button>,
        ]}
      >
        {selectedPlan && (
          <div className="space-y-4">
            <p className="text-gray-700">
              You are about to subscribe to <strong>{selectedPlan.planName}</strong> with the following option:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900 capitalize mb-2">
                {selectedType.replace('-', ' ')}
              </p>
              {selectedPlan.planType === 'lifetime' && selectedPlan.lifetime && (
                <>
                  {selectedType === 'one-time' && (
                    <p className="text-lg font-bold">
                      {formatPrice(selectedPlan.lifetime.oneTime.price, selectedPlan.lifetime.oneTime.currency)}
                    </p>
                  )}
                  {selectedType === '3-months' && (
                    <p className="text-lg font-bold">
                      {formatPrice(selectedPlan.lifetime.installments.threeMonths.price, selectedPlan.lifetime.installments.threeMonths.currency)}
                      /month for 3 months
                    </p>
                  )}
                  {selectedType === '6-months' && (
                    <p className="text-lg font-bold">
                      {formatPrice(selectedPlan.lifetime.installments.sixMonths.price, selectedPlan.lifetime.installments.sixMonths.currency)}
                      /month for 6 months
                    </p>
                  )}
                </>
              )}
              {selectedPlan.planType === 'monthly' && selectedPlan.monthly && (
                <>
                  {selectedType === 'full-app' && (
                    <p className="text-lg font-bold">
                      {formatPrice(selectedPlan.monthly.fullApp.price, selectedPlan.monthly.fullApp.currency)}
                      /month
                    </p>
                  )}
                  {selectedType === 'without-hr' && (
                    <p className="text-lg font-bold">
                      {formatPrice(selectedPlan.monthly.withoutHR.price, selectedPlan.monthly.withoutHR.currency)}
                      /month
                    </p>
                  )}
                </>
              )}
            </div>
            <p className="text-sm text-gray-600">
              You will be redirected to Stripe checkout to complete your payment.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionPage;

