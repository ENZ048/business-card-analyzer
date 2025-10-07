import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  AlertCircle,
  X,
  RefreshCw,
  History,
  Copy,
  CheckCircle
} from 'lucide-react';
import { apiService } from '../../lib/api';

const DemoUserManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScanHistory, setShowScanHistory] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);


  useEffect(() => {
    fetchAllScanActivities();
  }, []);

  const fetchAllScanActivities = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Fetching all scan activities...');
      const response = await apiService.getAllScanActivities(page, itemsPerPage);
      console.log('📊 Scan activities response:', response);
      setScanHistory(response.scanActivities || []);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      console.error('❌ Error fetching scan activities:', err);
      const errorMessage = err.toastMessage || 'Failed to fetch scan activities';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchScanHistory = async (userId, page = 1) => {
    try {
      setIsLoadingHistory(true);
      const response = await apiService.getDemoUserScanHistory(userId, page, itemsPerPage);
      setScanHistory(response.scanHistory);
      setSelectedUser(response.user);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      const errorMessage = err.toastMessage || 'Failed to fetch scan history';
      toast.error(errorMessage);
    } finally {
      setIsLoadingHistory(false);
    }
  };


  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-premium-orange"></div>
        <span className="ml-3 text-premium-gray">Loading scan activities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-premium-black">Demo User Management</h1>
          <p className="text-premium-gray">Demo user credentials and scan activity history</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchAllScanActivities(currentPage)}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Demo User Credentials */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Demo User Credentials
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="bd@troikatech.net"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
              <button
                onClick={() => copyToClipboard('bd@troikatech.net', 'Email')}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {copiedField === 'Email' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="p22gM27B7@iY"
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
              <button
                onClick={() => copyToClipboard('p22gM27B7@iY', 'Password')}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {copiedField === 'Password' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-sm text-blue-700 mt-3">
          These credentials can be used to test the demo user experience. The user gets 5 scans per session.
        </p>
      </div>

      {/* Scan History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-premium-border p-6">
        <h3 className="text-lg font-semibold text-premium-black mb-4">Scan Activity History</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-premium-orange"></div>
            <span className="ml-3 text-premium-gray">Loading scan activities...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="text-lg font-medium mb-2">Error Loading Scan Activities</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchAllScanActivities(currentPage)}
              className="px-4 py-2 bg-premium-orange text-white rounded-lg hover:bg-premium-orange-dark transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : scanHistory.length === 0 ? (
          <div className="text-center py-8 text-premium-gray">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No Scan Activities Found</p>
            <p className="text-sm">No scan activities have been recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-premium-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Session ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Scan Count</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Remaining</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Scan Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {scanHistory.map((activity, index) => (
                    <tr key={activity.id || index} className="border-b border-premium-border-light hover:bg-premium-beige-light transition-colors">
                      <td className="py-3 px-4 text-sm text-premium-gray font-mono">
                        {activity.sessionId ? activity.sessionId.substring(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-premium-black font-semibold">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          {activity.scanCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-premium-gray">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activity.scanType === 'bulk' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {activity.scanType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-premium-black font-semibold">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          activity.sessionScansRemaining > 0 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {activity.sessionScansRemaining}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-premium-gray">
                        {new Date(activity.scanDate).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-premium-gray font-mono">
                        {activity.ipAddress || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-premium-gray">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalActivities)} of {pagination.totalActivities} activities
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchAllScanActivities(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 text-sm border border-premium-border rounded-lg hover:bg-premium-beige disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-premium-gray">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchAllScanActivities(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 text-sm border border-premium-border rounded-lg hover:bg-premium-beige disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Scan History Modal */}
      {showScanHistory && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-premium-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-premium-black">
                  Scan History - {selectedUser.firstName} {selectedUser.lastName}
                </h2>
                <p className="text-premium-gray">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowScanHistory(false);
                  setSelectedUser(null);
                  setScanHistory([]);
                  setPagination(null);
                  setCurrentPage(1);
                }}
                className="p-2 text-premium-gray hover:bg-premium-beige rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-premium-orange"></div>
                  <span className="ml-3 text-premium-gray">Loading scan history...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {scanHistory.length === 0 ? (
                    <div className="text-center py-8 text-premium-gray">
                      No scan history found for this user.
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-premium-border">
                              <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Session ID</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Scan Count</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Type</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Files</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Remaining</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">Scan Date</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-premium-gray">IP Address</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scanHistory.map((activity, index) => (
                              <tr key={activity.id} className="border-b border-premium-border-light hover:bg-premium-beige-light transition-colors">
                                <td className="py-3 px-4 text-sm text-premium-gray font-mono">
                                  {activity.sessionId.substring(0, 8)}...
                                </td>
                                <td className="py-3 px-4 text-sm text-premium-black font-semibold">
                                  <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                                    {activity.scanCount}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-premium-gray">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    activity.scanType === 'bulk' 
                                      ? 'bg-purple-100 text-purple-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {activity.scanType}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-premium-gray">
                                  {activity.filesProcessed}
                                </td>
                                <td className="py-3 px-4 text-sm text-premium-black font-semibold">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    activity.sessionScansRemaining > 0 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {activity.sessionScansRemaining}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-premium-gray">
                                  {new Date(activity.scanDate).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-sm text-premium-gray font-mono">
                                  {activity.ipAddress || 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-premium-gray">
                              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalActivities)} of {pagination.totalActivities} activities
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => fetchScanHistory(selectedUser._id, currentPage - 1)}
                              disabled={!pagination.hasPrev}
                              className="px-3 py-1 text-sm border border-premium-border rounded-lg hover:bg-premium-beige disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1 text-sm text-premium-gray">
                              Page {currentPage} of {pagination.totalPages}
                            </span>
                            <button
                              onClick={() => fetchScanHistory(selectedUser._id, currentPage + 1)}
                              disabled={!pagination.hasNext}
                              className="px-3 py-1 text-sm border border-premium-border rounded-lg hover:bg-premium-beige disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DemoUserManagement;
