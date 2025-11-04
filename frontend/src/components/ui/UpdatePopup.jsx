import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

const UpdatePopup = ({ updateInfo, onClose, onUpdate }) => {
  if (!updateInfo || !updateInfo.hasUpdate) {
    return null;
  }

  const isMandatory = updateInfo.updateRequired;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isMandatory ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-3">
              {isMandatory ? (
                <AlertCircle className="w-6 h-6 text-red-600" />
              ) : (
                <CheckCircle className="w-6 h-6 text-orange-600" />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isMandatory ? 'Update Required' : 'Update Available'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Version {updateInfo.latestVersion} is now available
                </p>
              </div>
            </div>
            {!isMandatory && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Current Version Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Current Version:</span>
                <span className="font-semibold text-gray-900">{updateInfo.currentVersion}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-600">Latest Version:</span>
                <span className="font-semibold text-green-600">{updateInfo.latestVersion}</span>
              </div>
            </div>

            {/* Update Message */}
            {updateInfo.updateMessage && (
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">
                  {updateInfo.updateMessage}
                </p>
              </div>
            )}

            {/* Release Notes */}
            {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">What's New:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {updateInfo.releaseNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warning for mandatory updates */}
            {isMandatory && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ This update is required to continue using the app. Please update now.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={`p-6 border-t bg-gray-50 flex gap-3 ${
            isMandatory ? 'justify-center' : 'justify-end'
          }`}>
            {!isMandatory && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Later
              </button>
            )}
            <button
              onClick={onUpdate}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isMandatory
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              Update Now
              {updateInfo.downloadUrl && <ExternalLink className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpdatePopup;
