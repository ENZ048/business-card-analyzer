import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  UserPlus,
  Edit2,
  Trash2,
  AlertCircle,
  Save,
  X,
  Users,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../../lib/api';

const DemoUserManagement = () => {
  const [demoUsers, setDemoUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phoneNumber: '',
    demoCardScans: 5
  });

  useEffect(() => {
    fetchDemoUsers();
  }, []);

  const fetchDemoUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getDemoUsers();
      setDemoUsers(response.demoUsers);
    } catch (err) {
      const errorMessage = err.toastMessage || 'Failed to fetch demo users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDemoUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiService.createDemoUser(formData);
      toast.success(response.message);
      setShowCreateModal(false);
      resetForm();
      fetchDemoUsers();
    } catch (err) {
      const errorMessage = err.toastMessage || 'Failed to create demo user';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDemoUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiService.updateDemoUser(editingUser._id, formData);
      toast.success(response.message);
      setEditingUser(null);
      resetForm();
      fetchDemoUsers();
    } catch (err) {
      const errorMessage = err.toastMessage || 'Failed to update demo user';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDemoUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this demo user? This action cannot be undone!')) {
      return;
    }

    try {
      const response = await apiService.deleteDemoUser(userId);
      toast.success(response.message);
      fetchDemoUsers();
    } catch (err) {
      const errorMessage = err.toastMessage || 'Failed to delete demo user';
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      companyName: '',
      phoneNumber: '',
      demoCardScans: 5
    });
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '', // Don't populate password
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      phoneNumber: user.phoneNumber,
      demoCardScans: user.demoCardScans,
      isActive: user.isActive
    });
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-premium-orange"></div>
        <span className="ml-3 text-premium-gray">Loading demo users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-premium-black">Demo User Management</h1>
          <p className="text-premium-gray">Create and manage demo users with 5 card scans (no time limit)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDemoUsers}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Demo User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-premium-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-premium-gray">Total Demo Users</p>
              <p className="text-3xl font-bold text-premium-black">{demoUsers.length}</p>
            </div>
            <div className="h-12 w-12 bg-premium-orange rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-premium-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-premium-gray">Active Demo Users</p>
              <p className="text-3xl font-bold text-premium-black">
                {demoUsers.filter(u => u.isActive).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-premium-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-premium-gray">Total Demo Scans</p>
              <p className="text-3xl font-bold text-premium-black">
                {demoUsers.reduce((sum, u) => sum + u.demoCardScans, 0)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Demo Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-premium-border p-6">
        <h3 className="text-lg font-semibold text-premium-black mb-4">Demo Users</h3>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-premium-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Email</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Company</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Card Scans</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Actions</th>
              </tr>
            </thead>
            <tbody>
              {demoUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-premium-gray">
                    No demo users found. Create one to get started.
                  </td>
                </tr>
              ) : (
                demoUsers.map((user) => (
                  <tr key={user._id} className="border-b border-premium-border-light hover:bg-premium-beige-light transition-colors">
                    <td className="py-3 px-4 text-sm text-premium-black">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-3 px-4 text-sm text-premium-gray">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-premium-gray">{user.companyName}</td>
                    <td className="py-3 px-4 text-sm text-premium-gray">{user.phoneNumber}</td>
                    <td className="py-3 px-4 text-sm text-premium-black font-semibold">{user.demoCardScans}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDemoUser(user._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Deactivate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-premium-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-premium-black">
                {editingUser ? 'Edit Demo User' : 'Create Demo User'}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 text-premium-gray hover:bg-premium-beige rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleUpdateDemoUser : handleCreateDemoUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-premium-gray mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-premium-border rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-orange"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-premium-gray mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-premium-border rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-orange"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-premium-gray mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-premium-border rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-orange"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-premium-gray mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-premium-border rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-orange"
                    required={!editingUser}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-premium-gray mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-premium-border rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-orange"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-premium-gray mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-premium-border rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-orange"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-premium-gray mb-1">
                  Demo Card Scans
                </label>
                <input
                  type="number"
                  value={formData.demoCardScans}
                  onChange={(e) => setFormData({ ...formData, demoCardScans: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-premium-border rounded-lg focus:outline-none focus:ring-2 focus:ring-premium-orange"
                  min="0"
                  required
                />
                <p className="text-xs text-premium-gray mt-1">Number of card scans available (no time limit)</p>
              </div>

              {editingUser && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-premium-orange focus:ring-premium-orange border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-premium-gray">
                    Active
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-premium-gray hover:bg-premium-beige rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DemoUserManagement;
