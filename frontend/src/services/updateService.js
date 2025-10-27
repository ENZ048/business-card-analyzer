// services/updateService.js
import axios from 'axios';

// Get current app version
export const getCurrentVersion = () => {
  return '1.0.0'; // Update this when releasing a new version
};

// Check for updates from backend
export const checkForUpdates = async () => {
  try {
    const currentVersion = getCurrentVersion();
    const response = await axios.get('https://api.superscanai.com/api/app/version');
    
    const latestVersion = response.data.version;
    const needsUpdate = compareVersions(currentVersion, latestVersion);
    
    return {
      needsUpdate,
      currentVersion,
      latestVersion,
      downloadUrl: response.data.downloadUrl,
      updateMessage: response.data.updateMessage || 'A new version is available. Please update to continue using the app.'
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      needsUpdate: false,
      error: 'Failed to check for updates'
    };
  }
};

// Compare version strings (e.g., "1.0.0" vs "1.0.1")
const compareVersions = (current, latest) => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;
    
    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }
  
  return false;
};

// Open download URL (will redirect to Play Store or download link)
export const openUpdateURL = (url) => {
  window.open(url, '_blank');
};
