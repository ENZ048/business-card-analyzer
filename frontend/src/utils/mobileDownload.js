// utils/mobileDownload.js
import { Capacitor } from '@capacitor/core';
import { toast } from 'react-toastify';

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
        const { FileOpener } = await import('@capacitor-community/file-opener');
        
        // Ensure blob is valid
        if (!blob || blob.size === 0) {
          throw new Error('Invalid or empty file');
        }
        
        // Convert blob to base64
        const base64 = await blobToBase64(blob);
        
        console.log('📦 Base64 data length:', base64.length);
        
        // Write file to Documents directory with proper extension
        const result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
          recursive: true
        });
        
        console.log('✅ File written:', result.uri);
        
        // Get the full path for FileOpener
        const fileUri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Documents
        });
        
        console.log('📂 Opening file with native app:', fileUri.uri);
        
        // Normalize MIME type for better compatibility
        const normalizedMimeType = normalizeMimeType(mimeType, filename);
        console.log('🔧 Using MIME type:', normalizedMimeType);
        
        // Open the file with the appropriate native app
        await FileOpener.open({
          filePath: fileUri.uri,
          contentType: normalizedMimeType,
          openWithDefault: true
        });
        
        console.log('✅ File opened successfully');
        toast.success(`Opening ${filename}...`);
        
        return { success: true, uri: fileUri.uri };
      } catch (error) {
        console.error('❌ File download/open failed:', error);
        toast.error(`Failed to open file: ${error.message || 'Unknown error'}`);
        throw error;
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
