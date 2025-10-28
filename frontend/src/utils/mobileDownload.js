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
    
    // For mobile platforms (iOS, Android), use Capacitor Filesystem + Share
    if (platform === 'ios' || platform === 'android') {
      console.log('📱 Mobile detected - Using Capacitor Filesystem');
      console.log('📝 File details:', { filename, mimeType, size: blob.size });
      
      // Dynamically import Capacitor plugins only on mobile
      const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      
      let fileData;
      let encoding;
      
      // Determine if this is a text file (CSV, VCF) or binary file (Excel)
      const isTextFile = mimeType.includes('text/') || mimeType.includes('vcard');
      
      if (isTextFile) {
        // For text files (CSV, VCF), convert to text and write as UTF8
        console.log('📄 Text file detected - Using UTF8 encoding');
        fileData = await blob.text();
        encoding = Encoding.UTF8;
      } else {
        // For binary files (Excel), use base64
        console.log('📦 Binary file detected - Using base64 encoding');
        fileData = await blobToBase64(blob);
        // No encoding means Capacitor treats it as base64
      }
      
      // Write file to device storage
      const writeOptions = {
        path: filename,
        data: fileData,
        directory: Directory.Documents,
        recursive: true
      };
      
      // Only add encoding for text files
      if (encoding) {
        writeOptions.encoding = encoding;
      }
      
      const result = await Filesystem.writeFile(writeOptions);
      
      console.log('✅ File saved to:', result.uri);
      
      // Get the actual file URI for sharing
      const fileUri = await Filesystem.getUri({
        path: filename,
        directory: Directory.Documents
      });
      
      console.log('📂 File URI:', fileUri.uri);
      
      // Share the file using native sharing
      try {
        await Share.share({
          title: 'Super Scanner Export',
          text: `Export from Super Scanner`,
          url: fileUri.uri,
          dialogTitle: 'Open or Share File'
        });
        console.log('✅ File shared successfully');
      } catch (shareError) {
        console.log('ℹ️ Share dialog closed or not available. File saved to Documents:', fileUri.uri);
        // Show a more helpful message to the user
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
