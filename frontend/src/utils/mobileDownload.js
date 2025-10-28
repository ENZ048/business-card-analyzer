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
    
    // For mobile platforms (iOS, Android), use native download + share
    if (platform === 'ios' || platform === 'android') {
      console.log('📱 Mobile detected - Using native file handling');
      console.log('📝 File details:', { filename, mimeType, size: blob.size });
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      
      try {
        // Try to trigger download using anchor tag (works on some Android browsers)
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('✅ Download triggered successfully');
        toast.success(`${filename} download started. Check your Downloads folder.`);
        
        // Clean up after a delay
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
        
        return { success: true };
      } catch (error) {
        console.error('❌ Direct download failed, trying Share API:', error);
        
        // Fallback: Try using Share API with the blob
        try {
          const { Share } = await import('@capacitor/share');
          
          // Convert blob to base64 for sharing
          const base64 = await blobToBase64(blob);
          const dataUrl = `data:${mimeType};base64,${base64}`;
          
          await Share.share({
            title: filename,
            text: `Download ${filename}`,
            url: dataUrl,
            dialogTitle: 'Save or Share File'
          });
          
          console.log('✅ File shared successfully');
          return { success: true };
        } catch (shareError) {
          console.error('❌ Share also failed:', shareError);
          throw new Error('Failed to download or share file');
        } finally {
          URL.revokeObjectURL(url);
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
