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
    
    // For mobile platforms (iOS, Android), use browser download fallback
    if (platform === 'ios' || platform === 'android') {
      console.log('📱 Mobile detected - Using browser download with Share fallback');
      console.log('📝 File details:', { filename, mimeType, size: blob.size });
      
      // Try native browser download first (works in some WebViews)
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Wait a bit before cleanup
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('✅ Download triggered via anchor tag');
        toast.success(`Downloading ${filename}...`);
        
        return { success: true };
      } catch (anchorError) {
        console.log('⚠️ Anchor download failed, trying Share API:', anchorError);
        
        // Fallback to Share API
        try {
          const { Share } = await import('@capacitor/share');
          
          // Convert blob to base64 data URL
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          const dataUrl = await base64Promise;
          
          console.log('📤 Sharing file via Share API');
          
          await Share.share({
            title: filename,
            text: `Download ${filename}`,
            url: dataUrl,
            dialogTitle: 'Save File'
          });
          
          console.log('✅ File shared successfully');
          toast.success(`File ready to save`);
          
          return { success: true };
        } catch (shareError) {
          console.error('❌ Share API also failed:', shareError);
          toast.error('Unable to download file. Please try from web browser.');
          throw shareError;
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
 * Get readable file size
 */
export const getFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
