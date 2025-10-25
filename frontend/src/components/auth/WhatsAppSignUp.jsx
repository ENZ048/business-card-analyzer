import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';

const WhatsAppSignUp = ({ onSwitchToSignIn, onShowPopup }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const { sendOTP, verifyOTP } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) return;

    setIsLoading(true);
    try {
      const result = await sendOTP(phoneNumber, fullName);
      if (result.success) {
        setShowOTP(true);
      } else {
        onShowPopup({
          isOpen: true,
          type: 'error',
          title: 'Failed to Send OTP',
          message: result.error || 'Failed to send OTP. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      onShowPopup({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to send OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setIsLoading(true);
    try {
      const result = await verifyOTP(phoneNumber, otp, fullName);
      if (!result.success) {
        onShowPopup({
          isOpen: true,
          type: 'error',
          title: 'OTP Verification Failed',
          message: result.error || 'Invalid OTP. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      onShowPopup({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to verify OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showOTP) {
    return (
      <OTPVerification 
        phoneNumber={phoneNumber}
        fullName={fullName}
        onVerify={handleVerifyOTP}
        isLoading={isLoading}
        onBack={() => setShowOTP(false)}
      />
    );
  }

  return (
    <div className="bg-premium-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 lg:p-8 w-full mx-auto">
      <div className="text-center mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-premium-black mb-1 sm:mb-2">Create Account</h2>
        <p className="text-xs sm:text-sm md:text-base text-premium-gray px-2">Join our business card analyzer platform</p>
      </div>
      
      <form onSubmit={handleSendOTP} className="space-y-3 sm:space-y-4 md:space-y-5">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-premium-black mb-1 sm:mb-2">
            Full Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-premium-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10 h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-premium-black mb-1 sm:mb-2">
            WhatsApp Number *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-premium-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <Input
              type="tel"
              placeholder="Enter your WhatsApp number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-10 h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base"
              required
            />
          </div>
        </div>

        <div className="pt-1 sm:pt-2 md:pt-4">
          <Button
            type="submit"
            disabled={isLoading || !fullName.trim() || !phoneNumber.trim()}
            className="w-full bg-premium-black hover:bg-premium-orange text-premium-white border-0 shadow-lg transition-all duration-200 h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                <span className="text-xs sm:text-sm md:text-base">Sending OTP...</span>
              </div>
            ) : (
              'Send OTP'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-3 sm:mt-4 md:mt-6 text-center">
        <p className="text-premium-gray text-xs sm:text-sm px-2">
          Already have an account?{' '}
          <button
            onClick={onSwitchToSignIn}
            className="text-premium-orange hover:text-premium-black font-medium transition-colors duration-200 underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

const OTPVerification = ({ phoneNumber, fullName, onVerify, isLoading, onBack }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length === 6) {
      onVerify(otp);
    }
  };

  return (
    <div className="bg-premium-white rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-4 md:p-6 lg:p-8 w-full mx-auto">
      <div className="text-center mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-premium-black mb-1 sm:mb-2">Verify OTP</h2>
        <p className="text-xs sm:text-sm md:text-base text-premium-gray px-2">
          Enter the 6-digit code sent to {phoneNumber}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-premium-black mb-1 sm:mb-2">
            OTP Code *
          </label>
          <Input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base text-center text-lg sm:text-xl md:text-2xl tracking-widest"
            maxLength={6}
            required
          />
        </div>

        <div className="pt-1 sm:pt-2 md:pt-4">
          <Button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-premium-black hover:bg-premium-orange text-premium-white border-0 shadow-lg transition-all duration-200 h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                <span className="text-xs sm:text-sm md:text-base">Verifying...</span>
              </div>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-3 sm:mt-4 md:mt-6 text-center">
        <button
          onClick={onBack}
          className="text-premium-gray hover:text-premium-orange text-xs sm:text-sm font-medium transition-colors duration-200 underline"
        >
          Back to registration
        </button>
      </div>
    </div>
  );
};

export default WhatsAppSignUp;
