// API Configuration
// Change this URL to point to your backend server
export const API_CONFIG = {
  // Development
  BASE_URL: 'https://cardscanner.0804.in',
  
  // Uncomment and modify for production:
  // BASE_URL: 'https://your-production-api.com',
  // BASE_URL: 'https://api.yourdomain.com',
  
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
