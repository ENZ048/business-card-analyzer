// utils/mobileDownload.js
import { Capacitor } from '@capacitor/core';

/**
 * Download or share a file based on the platform
 * @param {Blob} blob - The file blob
 * @param {string} filename - The name for the downloaded file
 * @param {string} mimeType - The MIME type of the file
 */
export const downloadFile = async (blob, filename, mimeType = 'application/octet-stream') => {
  try {
    const platform = Capacitor.getPlatform();
    
    // For mobile platforms (iOS, Android), use Capacitor Filesystem + Share
    if (platform === 'ios' || platform === 'android') {
      console.log('📱 Mobile detected - Using Capacitor Filesystem');
      
      // Dynamically import Capacitor plugins only on mobile
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      
      // Convert blob to base64
      const base64 = await blobToBase64(blob);
      
      // Write file to device storage
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });
      
      console.log('✅ File saved to:', result.uri);
      
      // Share the file using native sharing
      try {
        await Share.share({
          title: 'Super Scanner Export',
          text: `Downloaded ${filename}`,
          url: result.uri,
          dialogTitle: 'Share or save file'
        });
      } catch (shareError) {
        console.log('ℹ️ Share API not available, file saved to Documents folder');
      }
      
      return { success: true, uri: result.uri };
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
 * Get readable file size
 */
export const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
