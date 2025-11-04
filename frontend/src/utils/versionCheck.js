import { getApiBaseUrl } from '../config/api';

// Get current app version from package.json (set during build)
export const CURRENT_VERSION = '1.0.0'; // This should match package.json version

/**
 * Compare two version strings (e.g., "1.0.0" vs "1.0.1")
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export const compareVersions = (v1, v2) => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
};

/**
 * Check if an update is available by comparing current version with server version
 */
export const checkForUpdate = async () => {
  try {
    // Create a simple API call (not using apiService to avoid auth requirement)
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}/api/app/version`);
    const data = await response.json();
    
    if (data.version && compareVersions(CURRENT_VERSION, data.version) < 0) {
      return {
        hasUpdate: true,
        latestVersion: data.version,
        currentVersion: CURRENT_VERSION,
        updateRequired: data.updateRequired || false,
        updateMessage: data.updateMessage || 'A new version is available!',
        downloadUrl: data.downloadUrl || null,
        releaseNotes: data.releaseNotes || []
      };
    }
    
    return {
      hasUpdate: false,
      currentVersion: CURRENT_VERSION,
      latestVersion: data.version || CURRENT_VERSION
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      hasUpdate: false,
      error: 'Failed to check for updates'
    };
  }
};
