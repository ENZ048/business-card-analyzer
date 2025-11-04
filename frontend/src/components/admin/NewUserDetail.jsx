import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Phone, Mail, Calendar, Filter, RefreshCw, UserPlus, X, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import { apiService } from '../../lib/api';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const NewUserDetail = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [plans, setPlans] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    companyName: '',
    role: 'user',
    currentPlan: ''
  });
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    companyName: '',
    role: 'user',
    currentPlan: ''
  });
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

  const fetchPlans = async () => {
    try {
      const response = await apiService.getAdminPlans();
      setPlans(response.plans || []);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  };

  useEffect(() => {
    loadUsers();
    loadStats();
    fetchPlans();
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phoneNumber || !formData.companyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsCreating(true);
      await apiService.createAdminUser(formData);
      toast.success('User created successfully! They can now login directly.');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        companyName: '',
        role: 'user',
        currentPlan: ''
      });
      
      setShowAddUserModal(false);
      
      // Reload users and stats
      loadUsers();
      loadStats();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create user';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
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

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setTogglingStatus(prev => ({ ...prev, [userId]: true }));
      await apiService.updateAdminUser(userId, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
      loadStats();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update user status';
      toast.error(errorMessage);
    } finally {
      setTogglingStatus(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
      phoneNumber: user.phoneNumber ? user.phoneNumber.replace(/^91/, '') : '',
      companyName: user.companyName || '',
      role: user.role || 'user',
      currentPlan: user.currentPlan?._id || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!editFormData.firstName || !editFormData.lastName || !editFormData.email || !editFormData.phoneNumber || !editFormData.companyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editFormData.password && editFormData.password.length > 0 && editFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsUpdating(true);
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phoneNumber: editFormData.phoneNumber,
        companyName: editFormData.companyName,
        role: editFormData.role,
        currentPlan: editFormData.currentPlan || null
      };
      
      // Only include password if provided
      if (editFormData.password && editFormData.password.trim().length > 0) {
        updateData.password = editFormData.password;
      }

      await apiService.updateAdminUser(editingUser._id, updateData);
      toast.success('User updated successfully!');
      
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        companyName: '',
        role: 'user',
        currentPlan: ''
      });
      
      // Reload users and stats
      loadUsers();
      loadStats();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update user';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center px-4 py-2 bg-premium-orange text-white rounded-lg hover:bg-premium-orange-dark transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-premium-gray uppercase tracking-wider">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-premium-border">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-premium-orange mr-2" />
                      <span className="text-premium-gray">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
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
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.isActive}
                            onChange={() => handleToggleStatus(user._id, user.isActive)}
                            disabled={togglingStatus[user._id]}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-premium-orange-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                        <span className={`text-xs font-medium ${
                          user.isActive 
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {togglingStatus[user._id] ? 'Updating...' : (user.isActive ? 'Active' : 'Inactive')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-premium-gray">
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-premium-orange bg-premium-orange-muted rounded-lg hover:bg-premium-orange hover:text-white transition-colors"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
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

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          formData={formData}
          setFormData={setFormData}
          plans={plans}
          isCreating={isCreating}
          onSubmit={handleAddUser}
          onClose={() => {
            setShowAddUserModal(false);
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              phoneNumber: '',
              companyName: '',
              role: 'user',
              currentPlan: ''
            });
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          formData={editFormData}
          setFormData={setEditFormData}
          plans={plans}
          isUpdating={isUpdating}
          onSubmit={handleUpdateUser}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
            setEditFormData({
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              phoneNumber: '',
              companyName: '',
              role: 'user',
              currentPlan: ''
            });
          }}
        />
      )}
    </div>
  );
};

// Add User Modal Component
const AddUserModal = ({ formData, setFormData, plans, isCreating, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-premium-black">Add New User</h2>
            <button
              onClick={onClose}
              className="text-premium-gray hover:text-premium-black text-2xl leading-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                placeholder="Minimum 6 characters"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">User can change password after first login</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
                placeholder="10-digit phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                required
                placeholder="Enter company name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-premium-orange"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Plan
                </label>
                <select
                  value={formData.currentPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPlan: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-premium-orange"
                >
                  <option value="">Select Plan (Optional)</option>
                  {plans.map(plan => (
                    <option key={plan._id} value={plan._id}>
                      {plan.displayName} ({plan.cardScansLimit === -1 ? 'Unlimited' : plan.cardScansLimit} scans)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">If no plan selected, Starter Plan will be assigned</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-premium-orange hover:bg-premium-orange-dark"
              >
                {isCreating ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ formData, setFormData, plans, isUpdating, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-premium-black">Edit User</h2>
            <button
              onClick={onClose}
              className="text-premium-gray hover:text-premium-black text-2xl leading-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Leave blank to keep current password"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to keep the current password. Minimum 6 characters if changing.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
                placeholder="10-digit phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                required
                placeholder="Enter company name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-premium-orange"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Plan
                </label>
                <select
                  value={formData.currentPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentPlan: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-premium-orange focus:border-premium-orange"
                >
                  <option value="">No Plan</option>
                  {plans.map(plan => (
                    <option key={plan._id} value={plan._id}>
                      {plan.displayName} ({plan.cardScansLimit === -1 ? 'Unlimited' : plan.cardScansLimit} scans)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="bg-premium-orange hover:bg-premium-orange-dark"
              >
                {isUpdating ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewUserDetail;
