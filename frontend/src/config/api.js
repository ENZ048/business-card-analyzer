// API Configuration
// Change this URL to point to your backend server
export const API_CONFIG = {
  // Development
  // BASE_URL: 'http://localhost:5000',
  
  // Production - Update this to your actual backend URL
  BASE_URL: 'https://superscanai.com/api',
  // BASE_URL: 'https://your-backend-domain.com',
  
  // Timeout settings
  TIMEOUT: 30000, // 30 seconds
  
  // Other configuration options
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Environment-based configuration
export const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fall back to config file
  return API_CONFIG.BASE_URL;
};
