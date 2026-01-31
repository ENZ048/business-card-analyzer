// utils/mobileDownload.js
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';

/**
 * Request storage permissions on Android
 */
const requestStoragePermissions = async () => {
  try {
    const platform = Capacitor.getPlatform();
    
    // Only request permissions on Android
    if (platform !== 'android') {
      return true;
    }
    
    // Check Android version - permissions work differently on Android 13+
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    const androidVersion = parseInt(info.osVersion);
    
    console.log('📱 Android version:', androidVersion);
    
    // Android 13+ (API 33+) uses different permission model
    if (androidVersion >= 13) {
      console.log('ℹ️ Android 13+ detected - Using scoped storage (no permissions needed)');
      return true;
    }
    
    // Android 6-12 requires runtime permissions
    const { Filesystem } = await import('@capacitor/filesystem');
    
    try {
      const permission = await Filesystem.checkPermissions();
      console.log('📋 Current permissions:', permission);
      
      if (permission.publicStorage !== 'granted') {
        console.log('🔐 Requesting storage permissions...');
        const result = await Filesystem.requestPermissions();
        console.log('📋 Permission result:', result);
        
        if (result.publicStorage !== 'granted') {
          toast.error('Storage permission is required to download files');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Permission check/request failed:', error);
      return true; // Continue anyway, might work on newer Android
    }
  } catch (error) {
    console.error('❌ Permission handling error:', error);
    return true; // Continue anyway
  }
};

/**
 * Download or share a file based on the platform
 * @param {Blob} blob - The file blob
 * @param {string} filename - The name for the downloaded file
 * @param {string} mimeType - The MIME type of the file
 */
export const downloadFile = async (blob, filename, mimeType = 'application/octet-stream') => {
  try {
    const platform = Capacitor.getPlatform();
    
    // For mobile platforms (iOS, Android), save file and open with native app
    if (platform === 'ios' || platform === 'android') {
      console.log('📱 Mobile detected - Using Filesystem + FileOpener');
      console.log('📝 File details:', { filename, mimeType, size: blob.size });
      
      try {
        // Dynamically import Capacitor plugins
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        
        // Ensure blob is valid
        if (!blob || blob.size === 0) {
          throw new Error('Invalid or empty file');
        }
        
        // Convert blob to base64
        const base64 = await blobToBase64(blob);
        
        console.log('📦 Base64 data length:', base64.length);
        
        // Write file to Cache directory (no permissions needed)
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Cache
        });
        
        console.log('✅ File written to cache:', result.uri);
        
        // Get the full path
        const fileUri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Cache
        });
        
        console.log('📂 File URI:', fileUri.uri);
        
        // Normalize MIME type for better compatibility
        const normalizedMimeType = normalizeMimeType(mimeType, filename);
        console.log('🔧 Using MIME type:', normalizedMimeType);
        
        // Use Share API to let user save/open the file
        await Share.share({
          title: filename,
          text: `Open or save ${filename}`,
          url: fileUri.uri,
          dialogTitle: 'Save or Open File'
        });
        
        console.log('✅ File shared successfully');
        toast.success(`File ready: ${filename}`);
        
        return { success: true, uri: fileUri.uri };
      } catch (error) {
        console.error('❌ File download/open failed:', error);
        
        // Fallback: Try direct download to external storage
        try {
          console.log('🔄 Trying fallback method...');
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          
          const base64 = await blobToBase64(blob);
          
          // Try writing to external storage Download folder
          const downloadPath = `Download/${filename}`;
          const result = await Filesystem.writeFile({
            path: downloadPath,
            data: base64,
            directory: Directory.External
          });
          
          console.log('✅ Fallback: File saved to Downloads:', result.uri);
          toast.success(`File saved to Downloads: ${filename}`);
          
          return { success: true, uri: result.uri };
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          toast.error(`Failed to save file: ${error.message || 'Unknown error'}`);
          throw error;
        }
      }
    } 
    // For web, use traditional download
    else {
      console.log('🌐 Web detected - Using traditional download');
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    }
  } catch (error) {
    console.error('❌ Download failed:', error);
    throw error;
  }
};

/**
 * Convert blob to base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1]; // Remove data:... prefix
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Normalize MIME type for better mobile compatibility
 */
const normalizeMimeType = (mimeType, filename) => {
  // Check file extension
  const ext = filename.toLowerCase().split('.').pop();
  
  // Map common file types to proper MIME types
  const mimeMap = {
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'vcf': 'text/vcard',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json'
  };
  
  return mimeMap[ext] || mimeType;
};

/**
 * Get readable file size
 */
export const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
