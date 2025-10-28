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
    
    // For mobile platforms (iOS, Android), use Filesystem with proper binary handling
    if (platform === 'ios' || platform === 'android') {
      console.log('📱 Mobile detected - Using Capacitor Filesystem with binary data');
      console.log('📝 File details:', { filename, mimeType, size: blob.size });
      
      // Dynamically import Capacitor plugins
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      
      try {
        // Convert blob to base64 using the proper method
        const base64 = await blobToBase64(blob);
        
        console.log('📦 Base64 length:', base64.length);
        
        // For Capacitor to decode base64 to binary, we need to write with DATA URI
        // Then immediately read it back and write as binary
        const tempPath = `temp_${Date.now()}_${filename}`;
        
        // First write with data URI format (this forces Capacitor to decode)
        await Filesystem.writeFile({
          path: tempPath,
          data: `data:${mimeType};base64,${base64}`,
          directory: Directory.Cache
        });
        
        // Read it back as binary
        const readResult = await Filesystem.readFile({
          path: tempPath,
          directory: Directory.Cache
        });
        
        // Write to Documents as actual file
        await Filesystem.writeFile({
          path: filename,
          data: readResult.data,
          directory: Directory.Documents
        });
        
        // Delete temp file
        await Filesystem.deleteFile({
          path: tempPath,
          directory: Directory.Cache
        });
        
        console.log('✅ File written to Documents');
        
        // Get the file URI
        const fileUri = await Filesystem.getUri({
          path: filename,
          directory: Directory.Documents
        });
        
        console.log('📂 File URI:', fileUri.uri);
        
        // Share the file
        await Share.share({
          title: 'Super Scanner Export',
          text: filename,
          url: fileUri.uri,
          dialogTitle: 'Open or Share File'
        });
        
        console.log('✅ File shared successfully');
        toast.success(`${filename} ready to open`);
        
        return { success: true, uri: fileUri.uri };
      } catch (error) {
        console.error('❌ Mobile download failed:', error);
        toast.error('Failed to save file. Please try again.');
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
 * Get readable file size
 */
export const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
