import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { message, Modal, Input, Select, Button, Switch, Tag } from 'antd';
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
    withoutHR: {
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

const Billing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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
    monthly: {
      fullApp: { price: 699, currency: 'CAD', enabled: true },
      withoutHR: { price: 500, currency: 'CAD', enabled: true }
    },
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
      console.log('Plans API Response:', response); // Debug log
      if (response?.success) {
        setPlans(response.data || []);
        console.log('Plans loaded:', response.data?.length || 0); // Debug log
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
      monthly: {
        fullApp: { price: 699, currency: 'CAD', enabled: true },
        withoutHR: { price: 500, currency: 'CAD', enabled: true }
      },
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
      monthly: plan.monthly || {
        fullApp: { price: 699, currency: 'CAD', enabled: true },
        withoutHR: { price: 500, currency: 'CAD', enabled: true }
      },
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
    Modal.confirm({
      title: 'Delete Plan',
      content: `Are you sure you want to delete "${plan.planName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await deletePlan(plan._id);
          if (response?.success) {
            message.success(response.message || 'Plan deleted successfully');
            fetchPlans();
          } else {
            message.error(response?.message || 'Failed to delete plan');
          }
        } catch (error: any) {
          console.error('Error deleting plan:', error);
          message.error(error?.message || 'Failed to delete plan');
        }
      }
    });
  };

  const handleView = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const formatPrice = (price: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
              Plan Management
            </h1>
            <p className="text-gray-600 mt-1">Create and manage pricing plans for customers</p>
          </div>
          <Button
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Create Plan
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No plans found</h3>
            <p className="text-gray-500 mb-4">Create your first pricing plan to get started.</p>
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{plan.planName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag color={plan.planType === 'lifetime' ? 'blue' : 'green'}>
                          {plan.planType === 'lifetime' ? 'Lifetime' : 'Monthly'}
                        </Tag>
                        {plan.isDefault && (
                          <Tag color="purple">Default</Tag>
                        )}
                        <Tag color={plan.status === 'active' ? 'success' : 'default'}>
                          {plan.status}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  {plan.planType === 'lifetime' && plan.lifetime && (
                    <div className="space-y-2 mb-4">
                      <div className="text-sm">
                        <span className="text-gray-600">One-time: </span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(plan.lifetime.oneTime.price, plan.lifetime.oneTime.currency)}
                        </span>
                      </div>
                      {plan.lifetime.installments.threeMonths.enabled && (
                        <div className="text-sm">
                          <span className="text-gray-600">3 installments: </span>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(plan.lifetime.installments.threeMonths.price, plan.lifetime.installments.threeMonths.currency)}/mo
                          </span>
                        </div>
                      )}
                      {plan.lifetime.installments.sixMonths.enabled && (
                        <div className="text-sm">
                          <span className="text-gray-600">6 installments: </span>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(plan.lifetime.installments.sixMonths.price, plan.lifetime.installments.sixMonths.currency)}/mo
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {plan.planType === 'monthly' && plan.monthly && (
                    <div className="space-y-2 mb-4">
                      {plan.monthly.fullApp.enabled && (
                        <div className="text-sm">
                          <span className="text-gray-600">Full App: </span>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(plan.monthly.fullApp.price, plan.monthly.fullApp.currency)}/mo
                          </span>
                        </div>
                      )}
                      {plan.monthly.withoutHR.enabled && (
                        <div className="text-sm">
                          <span className="text-gray-600">Without HR: </span>
                          <span className="font-semibold text-gray-900">
                            {formatPrice(plan.monthly.withoutHR.price, plan.monthly.withoutHR.currency)}/mo
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {plan.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.description}</p>
                  )}

                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Button
                      type="text"
                      icon={<Eye className="w-4 h-4" />}
                      onClick={() => handleView(plan)}
                      size="small"
                    >
                      View
                    </Button>
                    <Button
                      type="text"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => handleEdit(plan)}
                      size="small"
                    >
                      Edit
                    </Button>
                    <Button
                      type="text"
                      danger
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDelete(plan)}
                      size="small"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Full App</label>
                  <Switch
                    checked={formData.monthly.fullApp.enabled}
                    onChange={(checked) => setFormData({
                      ...formData,
                      monthly: {
                        ...formData.monthly,
                        fullApp: {
                          ...formData.monthly.fullApp,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                {formData.monthly.fullApp.enabled && (
                  <Input
                    type="number"
                    value={formData.monthly.fullApp.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      monthly: {
                        ...formData.monthly,
                        fullApp: {
                          ...formData.monthly.fullApp,
                          price: parseFloat(e.target.value) || 0
                        }
                      }
                    })}
                    placeholder="699"
                    addonAfter="CAD/month"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Without HR</label>
                  <Switch
                    checked={formData.monthly.withoutHR.enabled}
                    onChange={(checked) => setFormData({
                      ...formData,
                      monthly: {
                        ...formData.monthly,
                        withoutHR: {
                          ...formData.monthly.withoutHR,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                {formData.monthly.withoutHR.enabled && (
                  <Input
                    type="number"
                    value={formData.monthly.withoutHR.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      monthly: {
                        ...formData.monthly,
                        withoutHR: {
                          ...formData.monthly.withoutHR,
                          price: parseFloat(e.target.value) || 0
                        }
                      }
                    })}
                    placeholder="500"
                    addonAfter="CAD/month"
                  />
                )}
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
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Full App</label>
                  <Switch
                    checked={formData.monthly.fullApp.enabled}
                    onChange={(checked) => setFormData({
                      ...formData,
                      monthly: {
                        ...formData.monthly,
                        fullApp: {
                          ...formData.monthly.fullApp,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                {formData.monthly.fullApp.enabled && (
                  <Input
                    type="number"
                    value={formData.monthly.fullApp.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      monthly: {
                        ...formData.monthly,
                        fullApp: {
                          ...formData.monthly.fullApp,
                          price: parseFloat(e.target.value) || 0
                        }
                      }
                    })}
                    placeholder="699"
                    addonAfter="CAD/month"
                  />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Without HR</label>
                  <Switch
                    checked={formData.monthly.withoutHR.enabled}
                    onChange={(checked) => setFormData({
                      ...formData,
                      monthly: {
                        ...formData.monthly,
                        withoutHR: {
                          ...formData.monthly.withoutHR,
                          enabled: checked
                        }
                      }
                    })}
                  />
                </div>
                {formData.monthly.withoutHR.enabled && (
                  <Input
                    type="number"
                    value={formData.monthly.withoutHR.price}
                    onChange={(e) => setFormData({
                      ...formData,
                      monthly: {
                        ...formData.monthly,
                        withoutHR: {
                          ...formData.monthly.withoutHR,
                          price: parseFloat(e.target.value) || 0
                        }
                      }
                    })}
                    placeholder="500"
                    addonAfter="CAD/month"
                  />
                )}
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
          title="Plan Details"
          open={showViewModal}
          onCancel={() => setShowViewModal(false)}
          footer={[
            <Button key="close" onClick={() => setShowViewModal(false)}>Close</Button>,
            <Button key="edit" type="primary" onClick={() => {
              setShowViewModal(false);
              handleEdit(selectedPlan);
            }} className="bg-purple-600 hover:bg-purple-700">
              Edit
            </Button>
          ]}
          width={600}
        >
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <p className="text-gray-900">{selectedPlan.planName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
              <Tag color={selectedPlan.planType === 'lifetime' ? 'blue' : 'green'}>
                {selectedPlan.planType === 'lifetime' ? 'Lifetime' : 'Monthly'}
              </Tag>
            </div>
            {selectedPlan.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{selectedPlan.description}</p>
              </div>
            )}
            {selectedPlan.planType === 'lifetime' && selectedPlan.lifetime && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Lifetime Pricing</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">One-time: </span>
                    <span className="font-semibold">{formatPrice(selectedPlan.lifetime.oneTime.price, selectedPlan.lifetime.oneTime.currency)}</span>
                  </div>
                  {selectedPlan.lifetime.installments.threeMonths.enabled && (
                    <div>
                      <span className="text-sm text-gray-600">3 installments: </span>
                      <span className="font-semibold">{formatPrice(selectedPlan.lifetime.installments.threeMonths.price, selectedPlan.lifetime.installments.threeMonths.currency)}/month</span>
                    </div>
                  )}
                  {selectedPlan.lifetime.installments.sixMonths.enabled && (
                    <div>
                      <span className="text-sm text-gray-600">6 installments: </span>
                      <span className="font-semibold">{formatPrice(selectedPlan.lifetime.installments.sixMonths.price, selectedPlan.lifetime.installments.sixMonths.currency)}/month</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedPlan.planType === 'monthly' && selectedPlan.monthly && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Monthly Pricing</h4>
                <div className="space-y-2">
                  {selectedPlan.monthly.fullApp.enabled && (
                    <div>
                      <span className="text-sm text-gray-600">Full App: </span>
                      <span className="font-semibold">{formatPrice(selectedPlan.monthly.fullApp.price, selectedPlan.monthly.fullApp.currency)}/month</span>
                    </div>
                  )}
                  {selectedPlan.monthly.withoutHR.enabled && (
                    <div>
                      <span className="text-sm text-gray-600">Without HR: </span>
                      <span className="font-semibold">{formatPrice(selectedPlan.monthly.withoutHR.price, selectedPlan.monthly.withoutHR.currency)}/month</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="border-t pt-4 flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Tag color={selectedPlan.status === 'active' ? 'success' : 'default'}>
                  {selectedPlan.status}
                </Tag>
              </div>
              {selectedPlan.isDefault && (
                <Tag color="purple">Default Plan</Tag>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Billing;
