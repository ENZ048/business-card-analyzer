import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Activity,
  Calendar,
  BarChart3,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { apiService } from '../../lib/api';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const response = await apiService.getAdminDashboard();
      setDashboardData(response);
      setLastUpdated(new Date());
      
      if (isAutoRefresh) {
        toast.success('Dashboard data refreshed successfully');
      }
    } catch (err) {
      const errorMessage = err.toastMessage || err.response?.data?.error || 'Failed to fetch dashboard data';
      setError(errorMessage);
      if (!isAutoRefresh) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-premium-orange"></div>
        <span className="ml-3 text-premium-gray">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-premium-black mb-2">No data available</h3>
        <p className="text-slate-500">Create some test data to see the dashboard</p>
      </div>
    );
  }

  const { stats, recentUsers } = dashboardData;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-premium-black">Admin Dashboard</h1>
            <p className="text-premium-gray">Overview of your business card analyzer platform</p>
            {lastUpdated && (
              <div className="flex items-center mt-2 text-sm text-premium-gray-light">
                <Clock className="h-4 w-4 mr-1" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border border-premium-border p-5 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-premium-gray">Total Users</p>
              <p className="text-3xl font-bold text-premium-black">{stats.totalUsers}</p>
            </div>
            <div className="h-12 w-12 bg-premium-orange rounded-lg flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-semibold">+{stats.newUsersThisMonth}</span>
            <span className="text-slate-500 ml-1">new this month</span>
            {isRefreshing && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-premium-border p-5 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-premium-gray">Active Users</p>
              <p className="text-3xl font-bold text-premium-black">{stats.activeUsers}</p>
            </div>
            <div className="h-12 w-12 bg-premium-orange rounded-lg flex items-center justify-center shadow-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500">
              {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total
            </span>
            {isRefreshing && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600"></div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-premium-border p-5 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-premium-gray">Scans This Month</p>
              <p className="text-3xl font-bold text-premium-black">{stats.totalScansThisMonth}</p>
            </div>
            <div className="h-12 w-12 bg-premium-orange rounded-lg flex items-center justify-center shadow-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500">Card scans processed</span>
            {isRefreshing && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-purple-600"></div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg border border-premium-border p-5 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-premium-gray">Plan Distribution</p>
              <p className="text-3xl font-bold text-premium-black">{stats.planDistribution.length}</p>
            </div>
            <div className="h-12 w-12 bg-premium-orange rounded-lg flex items-center justify-center shadow-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500">Active plans</span>
            {isRefreshing && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-600"></div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-premium-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-premium-black">Usage Trends</h3>
            <div className="flex items-center">
              {isRefreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b border-premium-orange mr-2"></div>
              )}
              <BarChart3 className="h-5 w-5 text-slate-400" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.usageTrends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-slate-400 mr-2" />
                  <span className="text-sm text-premium-gray">
                    Month {trend.month}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-premium-black">{trend.totalScans}</p>
                  <p className="text-xs text-slate-500">{trend.uniqueUsers} users</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-premium-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-premium-black">Plan Distribution</h3>
            <div className="flex items-center">
              {isRefreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b border-premium-orange mr-2"></div>
              )}
              <TrendingUp className="h-5 w-5 text-slate-400" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.planDistribution.map((plan, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-premium-gray">{plan.planName}</span>
                <div className="flex items-center">
                  <div className="w-20 bg-slate-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-premium-orange h-2 rounded-full" 
                      style={{ 
                        width: `${(plan.count / stats.totalUsers) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-premium-black w-8 text-right">
                    {plan.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-sm border border-premium-border p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-premium-black">Recent Users</h3>
          <div className="flex items-center">
            {isRefreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b border-premium-orange mr-2"></div>
            )}
            <Users className="h-5 w-5 text-slate-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-premium-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Plan</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user, index) => (
                <tr key={index} className="border-b border-premium-border-light">
                  <td className="py-3 px-4 text-sm text-premium-black">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="py-3 px-4 text-sm text-premium-gray">{user.email}</td>
                  <td className="py-3 px-4 text-sm text-premium-gray">
                    {user.currentPlan?.displayName || 'No Plan'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'super_admin' 
                        ? 'bg-premium-orange-muted text-premium-orange-dark'
                        : user.role === 'admin'
                        ? 'bg-premium-orange-muted text-premium-orange-dark'
                        : 'bg-premium-orange-muted text-premium-orange'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-premium-gray">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
