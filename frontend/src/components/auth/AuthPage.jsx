import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WhatsAppSignIn from './WhatsAppSignIn';
import WhatsAppSignUp from './WhatsAppSignUp';
import CustomPopup from '../ui/CustomPopup';

const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [popup, setPopup] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  const handleSwitchToSignUp = () => {
    setMode('register');
  };

  const handleSwitchToSignIn = () => {
    setMode('login');
  };

  const handleShowPopup = (popupData) => {
    setPopup(popupData);
  };

  const handleClosePopup = () => {
    setPopup({ ...popup, isOpen: false });
  };

  return (
    <div className="min-h-screen bg-premium-beige flex items-center justify-center p-2 sm:p-4 pt-4 sm:pt-8 md:pt-12 lg:pt-16">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 sm:mb-6 md:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-premium-black mb-1 sm:mb-2">
            Super Scanner
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-premium-gray px-2">
            Extract and manage contact information with AI-powered OCR
          </p>
          <p className="text-xs sm:text-sm text-premium-gray-light mt-1 sm:mt-2 px-2">
            Powered by{' '}
            <a
              href="https://troikatech.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-semibold decoration-2 underline-offset-2 transition-colors"
            >
              Troika Tech
            </a>
          </p>
        </motion.div>

        {/* Auth Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <WhatsAppSignIn 
                  onSwitchToSignUp={handleSwitchToSignUp}
                  onShowPopup={handleShowPopup}
                />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <WhatsAppSignUp 
                  onSwitchToSignIn={handleSwitchToSignIn}
                  onShowPopup={handleShowPopup}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Global Popup - persists during component transitions */}
      <CustomPopup
        isOpen={popup.isOpen}
        onClose={handleClosePopup}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        autoClose={popup.autoClose}
        autoCloseDelay={popup.autoCloseDelay}
      />
    </div>
  );
};

export default AuthPage;
