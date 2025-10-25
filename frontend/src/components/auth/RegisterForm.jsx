import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, Building } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';

const RegisterForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isAuthLoading } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.companyName || !formData.phoneNumber) {
      toast.error('Please fill in all required fields to create your account.');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long for security.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match. Please check and try again.');
      return;
    }

    // Check for strong password (optional but helpful)
    if (formData.password.length < 8) {
      toast.warning('For better security, consider using a password with at least 8 characters.');
    }

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        phoneNumber: formData.phoneNumber
      });
      if (result.success) {
        toast.success(`Welcome to our platform, ${formData.firstName}! Your account has been created successfully.`);
      } else {
        // Handle specific error messages from backend
        const errorMessage = result.error || 'Registration failed. Please try again.';
        if (errorMessage.includes('User already exists with this email')) {
          toast.error('An account with this email already exists. Please try logging in or use a different email.');
        } else if (errorMessage.includes('All fields are required')) {
          toast.error('Please fill in all required fields to create your account.');
        } else if (errorMessage.includes('Password must be at least 6 characters long')) {
          toast.error('Password must be at least 6 characters long for security.');
        } else if (errorMessage.includes('Server error')) {
          toast.error('Server error occurred during registration. Please try again in a few moments.');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (err) {
      toast.error('Network error occurred. Please check your internet connection and try again.');
    }
  };

  return (
    <div className="bg-premium-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 w-full sm:w-11/12 md:w-3/4 mx-auto max-w-[800px]">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-premium-black mb-2">Create Account</h2>
        <p className="text-premium-gray text-sm sm:text-base">Join our business card analyzer platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* First Line: First Name and Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-premium-black text-sm font-medium mb-2">
              First Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-4 h-4" />
              <Input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                className="pl-10 h-11"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-premium-black text-sm font-medium mb-2">
              Last Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-4 h-4" />
              <Input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                className="pl-10 h-11"
                required
              />
            </div>
          </div>
        </div>

        {/* Second Line: Email */}
        <div>
          <label className="block text-premium-black text-sm font-medium mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-4 h-4" />
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        {/* Third Line: Company Name */}
        <div>
          <label className="block text-premium-black text-sm font-medium mb-2">
            Company Name *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-4 h-4" />
            <Input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Enter your company name"
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        {/* Fourth Line: Phone Number */}
        <div>
          <label className="block text-premium-black text-sm font-medium mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-4 h-4" />
            <Input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="pl-10 h-11"
              required
            />
          </div>
        </div>

        {/* Fifth Line: Password */}
        <div>
          <label className="block text-premium-black text-sm font-medium mb-2">
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-4 h-4" />
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="pl-10 pr-10 h-11"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-premium-gray hover:text-premium-orange transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-premium-gray mt-1">Minimum 6 characters</p>
        </div>

        {/* Sixth Line: Confirm Password */}
        <div>
          <label className="block text-premium-black text-sm font-medium mb-2">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-4 h-4" />
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className="pl-10 pr-10 h-11"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-premium-gray hover:text-premium-orange transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <span className="mr-1">⚠️</span>
              Passwords do not match
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2 sm:pt-4">
          <Button
            type="submit"
            disabled={isAuthLoading || formData.password !== formData.confirmPassword}
            className="w-full bg-premium-black hover:bg-premium-orange text-premium-white border-0 shadow-lg transition-all duration-200 h-11 sm:h-12 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span className="text-sm sm:text-base">Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-premium-gray text-xs sm:text-sm">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-premium-orange hover:text-premium-black font-medium transition-colors duration-200 underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
