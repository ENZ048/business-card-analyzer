import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Calendar,
  Filter,
} from 'lucide-react';
import { apiService } from '../../lib/api';

const UsageAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: ''
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAdminUsage(filters.year, filters.month);
      setAnalyticsData(response);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  const getMaxUsage = (trends) => {
    return Math.max(...trends.map(trend => trend.totalScans), 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-premium-orange"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const { usageStats, monthlyTrends, topUsers } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-premium-black">Usage Analytics</h1>
        <p className="text-premium-gray mt-2">Track usage patterns and user behavior</p>
      </div>

      {/* Single Container for All Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-premium-border p-6 space-y-6"
      >
        {/* Filters */}
        <div>
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-premium-gray" />
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-premium-black mb-1">
                  Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-premium-border rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-premium-orange"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-premium-black mb-1">
                  Month (Optional)
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                  className="px-3 py-2 border border-premium-border rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-premium-orange"
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{getMonthName(month)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-premium-gray">Total Scans</p>
              <p className="text-3xl font-bold text-premium-black">{usageStats.totalScans}</p>
            </div>
            <div className="h-12 w-12 bg-premium-orange rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-premium-gray">Active Users</p>
              <p className="text-3xl font-bold text-premium-black">{usageStats.totalUsers}</p>
            </div>
            <div className="h-12 w-12 bg-premium-orange rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-premium-gray">Avg Scans/User</p>
              <p className="text-3xl font-bold text-premium-black">{usageStats.averageScansPerUser}</p>
            </div>
            <div className="h-12 w-12 bg-premium-orange rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-premium-black">Monthly Trends</h3>
              <BarChart3 className="h-5 w-5 text-premium-gray" />
            </div>
            
            {monthlyTrends.length > 0 ? (
              <div className="space-y-4">
                {monthlyTrends.map((trend, index) => {
                  const maxUsage = getMaxUsage(monthlyTrends);
                  const percentage = (trend.totalScans / maxUsage) * 100;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-premium-gray mr-2" />
                          <span className="text-sm font-medium text-premium-black">
                            {getMonthName(trend.month)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-premium-black">
                            {trend.totalScans}
                          </span>
                          <span className="text-xs text-premium-gray-light ml-1">
                            ({trend.uniqueUsers} users)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-premium-orange to-orange-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-premium-gray-light">No usage data available for the selected period</p>
              </div>
            )}
          </div>

          {/* Top Users */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-premium-black">Top Users</h3>
              <Users className="h-5 w-5 text-premium-gray" />
            </div>
            
            {topUsers.length > 0 ? (
              <div className="space-y-4">
                {topUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-premium-orange-muted rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-bold text-premium-orange">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-premium-black">
                          {user.user.firstName} {user.user.lastName}
                        </p>
                        <p className="text-xs text-premium-gray-light">{user.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-premium-black">
                        {user.totalScans}
                      </p>
                      <p className="text-xs text-premium-gray-light">scans</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-premium-gray-light">No user data available for the selected period</p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Summary */}
        <div>
          <h3 className="text-lg font-semibold text-premium-black mb-4">Usage Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-premium-black mb-2">Period Overview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-premium-gray">Total Scans:</span>
                  <span className="font-medium">{usageStats.totalScans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-premium-gray">Active Users:</span>
                  <span className="font-medium">{usageStats.totalUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-premium-gray">Average per User:</span>
                  <span className="font-medium">{usageStats.averageScansPerUser}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-premium-black mb-2">Peak Usage</h4>
              {monthlyTrends.length > 0 && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-premium-gray">Highest Month:</span>
                    <span className="font-medium">
                      {getMonthName(monthlyTrends.reduce((max, trend) => 
                        trend.totalScans > max.totalScans ? trend : max
                      ).month)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-premium-gray">Peak Scans:</span>
                    <span className="font-medium">
                      {Math.max(...monthlyTrends.map(t => t.totalScans))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UsageAnalytics;
