import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthModal = ({ isOpen = true, onClose }) => {
  const [mode, setMode] = useState('login');

  const handleClose = () => {
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute -top-4 -right-4 h-8 w-8 bg-premium-white rounded-full shadow-lg flex items-center justify-center text-premium-gray hover:text-premium-black z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Auth form */}
            {mode === 'login' ? (
              <LoginForm 
                onSwitchToRegister={() => setMode('register')}
                onClose={handleClose}
              />
            ) : (
              <RegisterForm 
                onSwitchToLogin={() => setMode('login')}
                onClose={handleClose}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
