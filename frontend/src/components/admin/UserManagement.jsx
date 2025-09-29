import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Calendar,
  Shield,
  RefreshCw,
  Phone,
  Building
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { apiService } from '../../lib/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getAdminUsers(
        currentPage,
        20,
        filters.search,
        filters.role,
        filters.isActive
      );
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err.toastMessage || err.response?.data?.error || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleUserEdit = async (userId, userData) => {
    try {
      await apiService.updateAdminUser(userId, userData);
      toast.success('User updated successfully');
      fetchUsers();
      setShowUserModal(false);
    } catch (err) {
      const errorMessage = err.toastMessage || err.response?.data?.error || 'Failed to update user';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await apiService.deleteAdminUser(userId);
        toast.success('User deactivated successfully');
        fetchUsers();
      } catch (err) {
        const errorMessage = err.toastMessage || err.response?.data?.error || 'Failed to delete user';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const handleResetUsage = async (userId) => {
    if (window.confirm('Are you sure you want to reset this user\'s usage?')) {
      try {
        await apiService.resetUserUsage(userId);
        toast.success('User usage reset successfully');
        fetchUsers();
      } catch (err) {
        const errorMessage = err.toastMessage || err.response?.data?.error || 'Failed to reset usage';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const openUserModal = async (user) => {
    try {
      const response = await apiService.getAdminUserDetails(user._id);
      setSelectedUser(response);
      setShowUserModal(true);
    } catch (err) {
      const errorMessage = err.toastMessage || err.response?.data?.error || 'Failed to fetch user details';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-premium-black">User Management</h1>
          <p className="text-premium-gray text-sm">Manage users, roles, and permissions</p>
        </div>
        <Button
          onClick={fetchUsers}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-premium-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => setFilters({ search: '', role: '', isActive: '' })}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-premium-border overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-premium-gray">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-premium-black mb-2">No users found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-premium-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Company</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Joined</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-premium-border-light hover:bg-slate-50"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-5 w-5 text-premium-gray" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-premium-black">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-slate-500">ID: {user._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-premium-gray mr-2" />
                        <span className="text-sm text-premium-gray">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-premium-gray mr-2" />
                        <span className="text-sm text-premium-gray">{user.companyName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-premium-gray mr-2" />
                        <span className="text-sm text-premium-gray">{user.phoneNumber || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-premium-gray">
                        {user.currentPlan?.displayName || 'Starter Plan'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
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
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive 
                          ? 'bg-premium-orange-muted text-premium-orange'
                          : 'bg-premium-orange-muted text-premium-orange-dark'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-premium-gray mr-2" />
                        <span className="text-sm text-premium-gray">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-center space-y-2">
                        <Button
                          onClick={() => openUserModal(user)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 w-full"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          onClick={() => handleResetUsage(user._id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 w-full"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reset
                        </Button>
                        <Button
                          onClick={() => handleUserDelete(user._id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 w-full"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-premium-gray">
              Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalUsers)} of {pagination.totalUsers} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-premium-gray">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={!pagination.hasNext}
                variant="outline"
                size="sm"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setShowUserModal(false)}
          onSave={handleUserEdit}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: user.user.firstName,
    lastName: user.user.lastName,
    email: user.user.email,
    companyName: user.user.companyName,
    phoneNumber: user.user.phoneNumber,
    role: user.user.role,
    isActive: user.user.isActive
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(user.user._id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-premium-black">User Details</h2>
            <button
              onClick={onClose}
              className="text-premium-gray hover:text-premium-gray"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name
              </label>
              <Input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-slate-700">Active User</span>
              </label>
            </div>

            {/* Usage Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-premium-black mb-4">Usage Information</h3>
              {user.currentUsage && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-premium-gray">Scans Used:</span>
                    <span className="ml-2 font-medium">{user.currentUsage.cardScansUsed}</span>
                  </div>
                  <div>
                    <span className="text-premium-gray">Scans Limit:</span>
                    <span className="ml-2 font-medium">
                      {user.currentUsage.cardScansLimit === -1 ? 'Unlimited' : user.currentUsage.cardScansLimit}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;