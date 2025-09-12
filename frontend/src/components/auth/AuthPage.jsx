import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
  const [mode, setMode] = useState('login');

  return (
    <div className="min-h-screen bg-premium-beige flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-premium-black mb-2">
            Super Scanner
          </h1>
          <p className="text-premium-gray">
            Extract and manage contact information with AI-powered OCR
          </p>
          <p className="text-sm text-premium-gray-light mt-2">
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
                <LoginForm 
                  onSwitchToRegister={() => setMode('register')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <RegisterForm 
                  onSwitchToLogin={() => setMode('login')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
