import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit, 
  Save, 
  X, 
  Plus,
  DollarSign,
  Users,
  Zap,
  Crown,
  Building
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { apiService } from '../../lib/api';

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [planStats, setPlanStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAdminPlans();
      setPlans(response.plans);
      setPlanStats(response.planStats);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan._id);
    setEditForm({
      displayName: plan.displayName,
      description: plan.description,
      cardScansLimit: plan.cardScansLimit,
      price: plan.price,
      features: plan.features.join('\n'),
      isActive: plan.isActive,
      isPopular: plan.isPopular
    });
  };

  const handleSavePlan = async (planId) => {
    try {
      const planData = {
        ...editForm,
        features: editForm.features.split('\n').filter(f => f.trim())
      };
      
      await apiService.updateAdminPlan(planId, planData);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update plan');
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setEditForm({});
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'starter':
        return <Users className="h-6 w-6" />;
      case 'growth':
        return <Zap className="h-6 w-6" />;
      case 'pro':
        return <Crown className="h-6 w-6" />;
      case 'enterprise':
        return <Building className="h-6 w-6" />;
      default:
        return <DollarSign className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'starter':
        return 'bg-premium-orange-muted text-premium-orange';
      case 'growth':
        return 'bg-premium-orange-muted text-premium-orange';
      case 'pro':
        return 'bg-premium-orange-muted text-premium-orange';
      case 'enterprise':
        return 'bg-premium-orange-muted text-premium-orange';
      default:
        return 'bg-slate-100 text-premium-gray';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-premium-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-premium-black">Plan Management</h1>
        <p className="text-premium-gray mt-2">Manage subscription plans and pricing</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 relative ${
              plan.isPopular ? 'border-premium-orange' : 'border-premium-border'
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-premium-orange text-premium-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${getPlanColor(plan.name)}`}>
                {getPlanIcon(plan.name)}
              </div>
              
              {editingPlan === plan._id ? (
                <Input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="text-center font-bold text-lg mb-2"
                />
              ) : (
                <h3 className="text-xl font-bold text-premium-black mb-2">{plan.displayName}</h3>
              )}

              {editingPlan === plan._id ? (
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="text-center text-premium-gray text-sm"
                />
              ) : (
                <p className="text-premium-gray text-sm">{plan.description}</p>
              )}
            </div>

            <div className="text-center mb-6">
              {editingPlan === plan._id ? (
                <div className="space-y-2">
                  <Input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                    className="text-center text-3xl font-bold"
                    placeholder="0.00"
                  />
                  <Input
                    type="number"
                    value={editForm.cardScansLimit === -1 ? '' : editForm.cardScansLimit}
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      cardScansLimit: e.target.value === '' ? -1 : parseInt(e.target.value) 
                    }))}
                    className="text-center text-sm"
                    placeholder="Unlimited scans"
                  />
                </div>
              ) : (
                <div>
                  <div className="text-3xl font-bold text-premium-black">
                    ${plan.price}
                    <span className="text-lg font-normal text-premium-gray">/year</span>
                  </div>
                  <div className="text-sm text-premium-gray mt-1">
                    {plan.cardScansLimit === -1 ? 'Unlimited' : plan.cardScansLimit.toLocaleString()} scans
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              {editingPlan === plan._id ? (
                <textarea
                  value={editForm.features}
                  onChange={(e) => setEditForm(prev => ({ ...prev, features: e.target.value }))}
                  className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                  rows={6}
                  placeholder="Enter features (one per line)"
                />
              ) : (
                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm text-premium-gray">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3">
              {editingPlan === plan._id ? (
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-700">Active Plan</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editForm.isPopular}
                      onChange={(e) => setEditForm(prev => ({ ...prev, isPopular: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-slate-700">Popular Plan</span>
                  </label>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleSavePlan(plan._id)}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button
                    onClick={() => handleEditPlan(plan)}
                    variant="outline"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Plan
                  </Button>
                  
                  {/* Plan Stats */}
                  {planStats.find(stat => stat.planName === plan.displayName) && (
                    <div className="mt-3 text-center">
                      <div className="text-sm text-premium-gray">
                        {planStats.find(stat => stat.planName === plan.displayName)?.userCount || 0} users
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Plan Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-premium-border p-6">
        <h3 className="text-lg font-semibold text-premium-black mb-4">Plan Distribution</h3>
        <div className="space-y-4">
          {planStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-premium-gray">{stat.planName}</span>
              <div className="flex items-center">
                <div className="w-32 bg-slate-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-premium-orange h-2 rounded-full" 
                    style={{ 
                      width: `${(stat.userCount / planStats.reduce((sum, s) => sum + s.userCount, 0)) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-premium-black w-8 text-right">
                  {stat.userCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlanManagement;
