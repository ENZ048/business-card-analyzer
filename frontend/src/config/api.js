// API Configuration
// Change this URL to point to your backend server
export const API_CONFIG = {
  // Development
  BASE_URL: 'http://localhost:5000',

  //made changes
  
  // Production - Backend API URL
  // BASE_URL: 'https://api.superscanai.com',
  // BASE_URL: 'https://your-backend-domain.com',
  
  // Timeout settings
  TIMEOUT: 3000000, // 5 minutes (for large batch uploads with compression & retries)
  
  // Other configuration options
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Simple configuration - no environment variables
export const getApiBaseUrl = () => {
  return API_CONFIG.BASE_URL;
};
