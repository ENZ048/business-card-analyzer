import axios from 'axios';
import { getApiBaseUrl } from '../config/api.js';

// API Configuration
const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout (for large batch uploads)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    
    // Enhanced error handling for better toast messages
    if (error.response) {
      const { status, data } = error.response;
      
      // Add more specific error information
      error.toastMessage = data.message || data.error || 'An error occurred';
      error.errorCode = data.code || null;
      error.statusCode = status;
      
      // Handle specific error types
      if (status === 413) {
        error.toastMessage = '⚠️ File size too large! Please upload images in smaller batches (total size less than 1GB per upload).';
      } else if (status === 403 && data.code === 'USAGE_LIMIT_EXCEEDED') {
        error.toastMessage = data.error || 'Usage limit exceeded';
      } else if (status === 401) {
        error.toastMessage = data.error || 'Authentication required';
      } else if (status === 403) {
        error.toastMessage = data.error || 'Access denied';
      } else if (status === 404) {
        error.toastMessage = data.error || 'Resource not found';
      } else if (status >= 500) {
        error.toastMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      error.toastMessage = 'Network error. Please check your connection.';
    } else {
      error.toastMessage = 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Authentication
  login: async (email, password) => {
    const response = await api.post('/api/users/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/users/register', userData);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/api/users/profile', userData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/api/users/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // User Usage Analytics
  getUserUsage: async () => {
    const response = await api.get('/api/users/usage');
    return response.data;
  },

  getProcessingHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/api/users/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Plan Management
  getPlans: async () => {
    const response = await api.get('/api/plans');
    return response.data;
  },

  getCurrentPlan: async () => {
    const response = await api.get('/api/plans/current');
    return response.data;
  },

  upgradePlan: async (planId) => {
    const response = await api.post('/api/plans/upgrade', { planId });
    return response.data;
  },

  getUsageHistory: async (year) => {
    const response = await api.get(`/api/plans/usage?year=${year}`);
    return response.data;
  },

  checkUsage: async (scanCount = 1) => {
    const response = await api.post('/api/plans/check-usage', { scanCount });
    return response.data;
  },

  // Admin API
  getAdminDashboard: async () => {
    const response = await api.get('/api/admin/dashboard');
    return response.data;
  },

  getAdminUsers: async (page = 1, limit = 20, search = '', role = '', isActive = '') => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    if (isActive) params.append('isActive', isActive);
    
    const response = await api.get(`/api/admin/users?${params}`);
    return response.data;
  },

  getAdminUserDetails: async (userId) => {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  updateAdminUser: async (userId, userData) => {
    const response = await api.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteAdminUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  getAdminPlans: async () => {
    const response = await api.get('/api/admin/plans');
    return response.data;
  },

  updateAdminPlan: async (planId, planData) => {
    const response = await api.put(`/api/admin/plans/${planId}`, planData);
    return response.data;
  },

  getAdminUsage: async (year, month) => {
    const params = new URLSearchParams({ year });
    if (month) params.append('month', month);
    
    const response = await api.get(`/api/admin/usage?${params}`);
    return response.data;
  },

  resetUserUsage: async (userId) => {
    const response = await api.post(`/api/admin/users/${userId}/reset-usage`);
    return response.data;
  },

  // Demo Users Management
  getDemoUsers: async () => {
    const response = await api.get('/api/admin/demo-users');
    return response.data;
  },

  createDemoUser: async (userData) => {
    const response = await api.post('/api/admin/demo-users', userData);
    return response.data;
  },

  updateDemoUser: async (userId, userData) => {
    const response = await api.put(`/api/admin/demo-users/${userId}`, userData);
    return response.data;
  },

  deleteDemoUser: async (userId) => {
    const response = await api.delete(`/api/admin/demo-users/${userId}`);
    return response.data;
  },

  // OCR Processing
  uploadSingleCard: async (userId, frontImage, backImage = null, onUploadProgress = null) => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('mode', 'single');
    formData.append('frontImage', frontImage);
    if (backImage) {
      formData.append('backImage', backImage);
    }

    const response = await api.post('/api/ocr/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes for uploads (compression + OCR + GPT)
      onUploadProgress: onUploadProgress,
    });
    return response.data;
  },

  uploadBulkCards: async (userId, images, onUploadProgress = null) => {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('mode', 'bulk');
    images.forEach((image) => {
      formData.append('files', image);
    });

    const response = await api.post('/api/ocr/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 900000, // 15 minutes for bulk uploads (handles 100 images with delays)
      onUploadProgress: onUploadProgress,
    });
    return response.data;
  },

  // Export Functions
  exportVCF: async (contact) => {
    const response = await api.post('/api/export/vcf', { contact }, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportBulkVCF: async (contacts) => {
    const response = await api.post('/api/export/vcf-bulk', { contacts }, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportCSV: async (contacts, fields) => {
    const response = await api.post('/api/export/csv', { contacts, fields }, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportXLSX: async (contacts, fields) => {
    const response = await api.post('/api/export/xlsx', { contacts, fields }, {
      responseType: 'blob',
    });
    return response.data;
  },

  generateQR: async (contact = null, contacts = null) => {
    const requestBody = contacts ? { contacts } : { contact };
    const response = await api.post('/api/export/qr', requestBody);
    return response.data;
  },
};

// Export the axios instance for custom requests if needed
export { api };

// Export the base URL for reference
export { API_BASE_URL };
