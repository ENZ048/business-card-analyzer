import axios from 'axios';
import { getApiBaseUrl } from '../config/api.js';

// API Configuration
const API_BASE_URL = getApiBaseUrl();

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (optional)
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // OCR Processing
  uploadSingleCard: async (userId, frontImage, backImage = null) => {
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
    });
    return response.data;
  },

  uploadBulkCards: async (userId, images) => {
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
