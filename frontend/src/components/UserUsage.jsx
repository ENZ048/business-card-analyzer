import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../lib/api';
import PlanDaysRemainingChart from './PlanDaysRemainingChart';

const UserUsage = () => {
  const [usageData, setUsageData] = useState({
    totalCards: 0,
    thisMonth: 0,
    lastMonth: 0,
    planLimit: 100,
    planType: 'Starter',
    planEndDate: null,
    daysRemaining: 0,
    isPlanExpired: false,
    recentActivity: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getUserUsage();
        if (response.success) {
          setUsageData(response.data);
        } else {
          toast.error('Failed to load usage data. Please try again.');
        }
      } catch (error) {
        const errorMessage = error.toastMessage || error.response?.data?.message || 'Failed to load usage data. Please check your connection and try again.';
        toast.error(errorMessage);
        // Fallback to mock data if API fails
        const mockData = {
          totalCards: 0,
          thisMonth: 0,
          lastMonth: 0,
          planLimit: 1000,
          planType: 'Starter Plan',
          planEndDate: null,
          daysRemaining: 0,
          isPlanExpired: false,
          recentActivity: []
        };
        setUsageData(mockData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  const usagePercentage = (usageData.thisMonth / usageData.planLimit) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-premium-orange"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-premium-border rounded-2xl p-8 shadow-lg"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-premium-black">Usage Analytics</h1>
          <p className="text-premium-gray mt-2">Track your business card processing activity</p>
        </div>

        {/* Usage Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Lifetime Scans - Highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-premium-orange bg-gradient-to-br from-premium-orange to-orange-600 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Lifetime Scans</p>
                <p className="text-4xl font-bold text-white">{usageData.totalCards}</p>
                <p className="text-orange-100 text-xs mt-1">All-time total</p>
              </div>
              <div className="h-14 w-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Current Plan Scans */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border border-premium-border rounded-xl p-6 bg-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-premium-gray text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold text-premium-black">{usageData.thisMonth}</p>
                <p className="text-premium-gray text-xs mt-1">Current plan period</p>
              </div>
              <div className="h-12 w-12 bg-premium-orange-muted rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-premium-orange" />
              </div>
            </div>
          </motion.div>

          {/* Last Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-premium-border rounded-xl p-6 bg-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-premium-gray text-sm font-medium">Last Month</p>
                <p className="text-3xl font-bold text-premium-black">{usageData.lastMonth}</p>
                <p className="text-premium-gray text-xs mt-1">Previous period</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          {/* Plan Limit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border border-premium-border rounded-xl p-6 bg-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-premium-gray text-sm font-medium">Plan Limit</p>
                <p className="text-3xl font-bold text-premium-black">
                  {usageData.planLimit === -1 ? '∞' : usageData.planLimit}
                </p>
                <p className="text-premium-gray text-xs mt-1">Monthly allocation</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Usage Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-premium-border rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-premium-black">Monthly Usage</h3>
            <span className="text-sm text-premium-gray">
              {usageData.thisMonth} / {usageData.planLimit} cards
            </span>
          </div>
          
          <div className="w-full bg-premium-beige rounded-full h-3 mb-2">
            <div 
              className="bg-premium-orange h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-premium-gray">
              {usagePercentage.toFixed(1)}% used
            </span>
            <span className="text-premium-gray">
              {usageData.planLimit - usageData.thisMonth} remaining
            </span>
          </div>
        </motion.div>

        {/* Plan Days Remaining Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <PlanDaysRemainingChart
            daysRemaining={usageData.daysRemaining}
            planEndDate={usageData.planEndDate}
            isPlanExpired={usageData.isPlanExpired}
            planType={usageData.planType}
          />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border border-premium-border rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-premium-black mb-4">Recent Activity</h3>
          
          <div className="space-y-3">
            {usageData.recentActivity.length > 0 ? (
              usageData.recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 border border-premium-border rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-premium-orange" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-premium-black">
                      {activity.type === 'single' ? 'Single Card Processed' : `Bulk Upload (${activity.count} cards)`}
                    </p>
                    <p className="text-xs text-premium-gray">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Clock className="h-4 w-4 text-premium-gray" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-premium-gray mx-auto mb-3" />
                <p className="text-premium-gray">No recent activity</p>
                <p className="text-sm text-premium-gray-light">Start processing business cards to see your activity here</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Plan Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="border border-premium-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-premium-black mb-4">Current Plan</h3>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-premium-black">{usageData.planType}</p>
              <p className="text-premium-gray">Up to {usageData.planLimit} cards per month</p>
            </div>
            <div className="sm:text-right">
              <button 
                onClick={() => toast.info('Plan upgrade feature coming soon!')}
                className="w-full sm:w-auto bg-premium-orange hover:bg-premium-orange-dark text-premium-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UserUsage;
