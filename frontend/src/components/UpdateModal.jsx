// components/UpdateModal.jsx
import { useEffect, useState } from 'react';
import { checkForUpdates } from '../services/updateService';
import { Dialog } from './ui/dialog';

const UpdateModal = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    // Check for updates when component mounts
    const checkUpdates = async () => {
      setCheckingUpdate(true);
      try {
        const result = await checkForUpdates();
        if (result.needsUpdate && !result.error) {
          setUpdateInfo(result);
          setShowModal(true);
        }
      } catch (error) {
        console.error('Update check failed:', error);
      } finally {
        setCheckingUpdate(false);
      }
    };

    // Check on mount
    checkUpdates();

    // Check every 5 minutes for updates
    const interval = setInterval(checkUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateNow = () => {
    if (updateInfo?.downloadUrl) {
      // Open Play Store or download link
      window.open(updateInfo.downloadUrl, '_blank');
    } else {
      // Fallback: redirect to a general update page
      alert('Please update the app from the Play Store or download the latest version from our website.');
    }
  };

  const handleRemindLater = () => {
    setShowModal(false);
    // Don't show again for this session
    sessionStorage.setItem('updateDismissed', 'true');
  };

  if (!showModal || !updateInfo) return null;

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-center mb-2 text-gray-900">
            Update Available
          </h2>

          <p className="text-gray-600 text-center mb-6">
            {updateInfo.updateMessage}
          </p>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Current Version:</span>
              <span className="text-sm font-semibold text-gray-700">
                {updateInfo.currentVersion}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Latest Version:</span>
              <span className="text-sm font-semibold text-blue-600">
                {updateInfo.latestVersion}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpdateNow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={handleRemindLater}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Remind Later
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </Dialog>
  );
};

export default UpdateModal;
