import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const CustomPopup = ({ 
  isOpen, 
  onClose, 
  type = 'error', // 'error', 'success', 'info', 'warning'
  title, 
  message, 
  showCloseButton = true,
  autoClose = false,
  autoCloseDelay = 3000
}) => {
  React.useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          title: 'text-green-800',
          message: 'text-green-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          title: 'text-blue-800',
          message: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          title: 'text-red-800',
          message: 'text-red-700'
        };
    }
  };

  const colors = getColors();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Popup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className={`relative ${colors.bg} ${colors.border} border rounded-lg shadow-xl max-w-md w-full p-6`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Content */}
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  {getIcon()}
                </div>
                <div className="flex-1">
                  {title && (
                    <h3 className={`text-lg font-semibold ${colors.title} mb-2`}>
                      {title}
                    </h3>
                  )}
                  <p className={`text-sm ${colors.message}`}>
                    {message}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    type === 'success' 
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : type === 'warning'
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : type === 'info'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomPopup;
