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
    
    // For mobile platforms (iOS, Android), use Capacitor Filesystem
    if (platform === 'ios' || platform === 'android') {
      console.log('📱 Mobile detected - Using Capacitor Filesystem');
      console.log('📝 File details:', { filename, mimeType, size: blob.size });
      
      // Dynamically import Capacitor plugins
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      
      // Read blob as ArrayBuffer then convert to base64
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert Uint8Array to base64 string
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      const base64Data = btoa(binaryString);
      
      console.log('📦 Converted to base64, length:', base64Data.length);
      
      // Write file to device
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents
        // NO encoding - this tells Capacitor the data is already base64
      });
      
      console.log('✅ File written:', result.uri);
      
      // Get the file URI for sharing
      const fileUri = await Filesystem.getUri({
        path: filename,
        directory: Directory.Documents
      });
      
      console.log('📂 File URI:', fileUri.uri);
      
      // Share the file
      try {
        await Share.share({
          title: 'Super Scanner Export',
          text: filename,
          url: fileUri.uri,
          dialogTitle: 'Open or Share File'
        });
        console.log('✅ File shared successfully');
        toast.success(`${filename} ready to open or save`);
      } catch (shareError) {
        console.log('ℹ️ Share dismissed');
        toast.info(`File saved to Documents folder: ${filename}`);
      }
      
      return { success: true, uri: fileUri.uri };
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
