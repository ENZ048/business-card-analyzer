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
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {isMandatory ? (
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                ) : (
                  <div className="p-2 bg-premium-orange-muted rounded-full">
                    <CheckCircle className="h-6 w-6 text-premium-orange" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-premium-black">
                    {isMandatory ? 'Update Required' : 'Update Available'}
                  </h2>
                  <p className="text-sm text-premium-gray">
                    Version {updateInfo.latestVersion} is now available
                  </p>
                </div>
              </div>
              {!isMandatory && (
                <button
                  onClick={onClose}
                  className="text-premium-gray hover:text-premium-black transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Message */}
            <div className="mb-4">
              <p className="text-premium-black mb-2">{updateInfo.updateMessage}</p>
              
              {/* Release Notes */}
              {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-premium-black mb-2">
                    What's New:
                  </h3>
                  <ul className="space-y-1">
                    {updateInfo.releaseNotes.map((note, index) => (
                      <li key={index} className="text-sm text-premium-gray flex items-start gap-2">
                        <span className="text-premium-orange mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Version Info */}
              <div className="mt-4 p-3 bg-premium-beige rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-premium-gray">Current Version:</span>
                  <span className="font-medium text-premium-black">
                    {updateInfo.currentVersion}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-premium-gray">Latest Version:</span>
                  <span className="font-medium text-premium-orange">
                    {updateInfo.latestVersion}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isMandatory ? (
                <button
                  onClick={onUpdate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-premium-orange text-white rounded-lg hover:bg-premium-orange-dark transition-colors font-medium"
                >
                  <Download className="h-5 w-5" />
                  Update Now
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-premium-border text-premium-black rounded-lg hover:bg-premium-beige transition-colors font-medium"
                  >
                    Later
                  </button>
                  <button
                    onClick={onUpdate}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-premium-orange text-white rounded-lg hover:bg-premium-orange-dark transition-colors font-medium"
                  >
                    <Download className="h-5 w-5" />
                    Update Now
                  </button>
                </>
              )}
            </div>

            {/* Download Link Info */}
            {updateInfo.downloadUrl && (
              <div className="mt-4 text-center">
                <a
                  href={updateInfo.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-premium-orange hover:text-premium-orange-dark transition-colors"
                  onClick={onUpdate}
                >
                  <ExternalLink className="h-4 w-4" />
                  Download from Play Store
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpdatePopup;
