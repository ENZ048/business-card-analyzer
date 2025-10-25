import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const OTPVerification = ({ phoneNumber, onVerify, onBack, isLoading }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length === 6) {
      onVerify(otp);
    } else {
      alert('Please enter a 6-digit OTP.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-premium-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 w-full sm:w-11/12 md:w-3/4 mx-auto max-w-[800px]"
    >
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-premium-black mb-2">Verify OTP</h2>
        <p className="text-premium-gray text-sm sm:text-base">
          Enter the 6-digit code sent to {phoneNumber}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <Label htmlFor="otpCode" className="text-premium-black text-sm sm:text-base">OTP Code *</Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-premium-gray w-5 h-5" />
            <Input
              id="otpCode"
              type="text"
              placeholder="Enter 6-digit OTP"
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-premium-border focus:ring-2 focus:ring-premium-orange focus:border-transparent transition-all duration-200 text-premium-black text-sm sm:text-base tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="pt-2 sm:pt-4">
          <Button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-premium-black hover:bg-premium-orange text-premium-white border-0 shadow-lg transition-all duration-200 h-11 sm:h-12 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="text-sm sm:text-base">Verifying...</span>
              </div>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
      
      <div className="mt-4 sm:mt-6 text-center">
        <button
          onClick={onBack}
          className="text-premium-orange hover:text-premium-black font-medium transition-colors duration-200 underline text-xs sm:text-sm flex items-center justify-center mx-auto"
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {phoneNumber ? 'login' : 'registration'}
        </button>
      </div>
    </motion.div>
  );
};

export default OTPVerification;
