import { getApiBaseUrl } from '../config/api';

export const CURRENT_VERSION = '1.0.0';

/**
 * Compare two semantic version strings
 * @param {string} v1 - Version 1
 * @param {string} v2 - Version 2
 * @returns {number} -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
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
 * Check for app updates from the backend
 * @returns {Promise<Object>} Update information object
 */
export const checkForUpdate = async () => {
  try {
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
