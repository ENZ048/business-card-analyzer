import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Phone, Mail, Calendar, Filter, RefreshCw } from 'lucide-react';
import { apiService } from '../../lib/api';

const NewUserDetail = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    whatsappUsers: 0,
    newThisMonth: 0
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminUsers(
        currentPage, 
        20, 
        searchTerm, 
        filterRole, 
        filterActive
      );
      
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.getAdminDashboard();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [currentPage, searchTerm, filterRole, filterActive]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'role') {
      setFilterRole(value);
    } else if (filterType === 'active') {
      setFilterActive(value);
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'N/A';
    // Remove country code and format
    const cleaned = phoneNumber.replace(/^91/, '');
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-premium-black">New User Details</h1>
          <p className="text-premium-gray mt-1">
            Manage and view all users who signed up via website signup form
          </p>
        </div>
        <button
          onClick={() => {
            loadUsers();
            loadStats();
          }}
          className="flex items-center px-4 py-2 bg-premium-black text-white rounded-lg hover:bg-premium-orange transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-premium-border"
        >
          <div className="flex items-center">
            <div className="p-2 bg-premium-orange-muted rounded-lg">
              <Users className="h-5 w-5 text-premium-orange" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-premium-gray">Total Users</p>
              <p className="text-2xl font-bold text-premium-black">{stats.totalUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-premium-border"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-premium-gray">Active Users</p>
              <p className="text-2xl font-bold text-premium-black">{stats.activeUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-premium-border"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-premium-gray">WhatsApp Users</p>
              <p className="text-2xl font-bold text-premium-black">{stats.whatsappUsers}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-premium-border"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-premium-gray">New This Month</p>
              <p className="text-2xl font-bold text-premium-black">{stats.newThisMonth}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-premium-border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-premium-gray" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-premium-border rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="md:w-48">
            <select
              value={filterRole}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-premium-border rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          {/* Active Filter */}
          <div className="md:w-48">
            <select
              value={filterActive}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              className="w-full px-3 py-2 border border-premium-border rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-premium-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-premium-beige">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-premium-gray uppercase tracking-wider">
                  User Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-premium-gray uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-premium-gray uppercase tracking-wider">
                  Plan & Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-premium-gray uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-premium-gray uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-premium-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-premium-orange mr-2" />
                      <span className="text-premium-gray">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-premium-gray">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-premium-beige-light transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-premium-orange rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-white">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-premium-black">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-premium-gray">
                            {user.companyName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-premium-gray">
                          <Mail className="h-4 w-4 mr-2" />
                          {user.email || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-premium-gray">
                          <Phone className="h-4 w-4 mr-2" />
                          {formatPhoneNumber(user.phoneNumber)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-premium-black">
                          {user.currentPlan?.displayName || 'No Plan'}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'super_admin' 
                              ? 'bg-premium-orange-muted text-premium-orange-dark'
                              : user.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'super_admin' ? 'Super Admin' : 
                             user.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                          {user.isWhatsAppUser && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              WhatsApp
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-premium-gray">
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-premium-border bg-premium-beige">
            <div className="flex items-center justify-between">
              <div className="text-sm text-premium-gray">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-premium-border rounded hover:bg-premium-beige disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-premium-border rounded hover:bg-premium-beige disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewUserDetail;
