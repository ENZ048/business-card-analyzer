import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { apiService } from '../lib/api';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      toast.error('Password does not meet requirements');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.changePassword(formData.currentPassword, formData.newPassword);
      
      if (response.success) {
        toast.success(response.message || 'Password changed successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(response.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.newPassword);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-premium-white border border-premium-border rounded-2xl p-8 shadow-lg"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-premium-black">Change Password</h1>
          <p className="text-premium-gray mt-2">Update your account password</p>
        </div>

        {/* Password Change Form */}
        <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-premium-black text-sm font-medium mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-5 h-5" />
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-premium-gray hover:text-premium-black"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-premium-black text-sm font-medium mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-5 h-5" />
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                className="pl-10 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-premium-gray hover:text-premium-black"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-premium-black">Password Requirements:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-premium-gray'}`}>
                    {passwordValidation.minLength ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-premium-gray'}`}>
                    {passwordValidation.hasUpperCase ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-premium-gray'}`}>
                    {passwordValidation.hasLowerCase ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    One lowercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-premium-gray'}`}>
                    {passwordValidation.hasNumbers ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    One number
                  </div>
                  <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-premium-gray'}`}>
                    {passwordValidation.hasSpecialChar ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    One special character
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-premium-black text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-5 h-5" />
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                className="pl-10 pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-premium-gray hover:text-premium-black"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>


          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !passwordValidation.isValid || formData.newPassword !== formData.confirmPassword}
            className="w-full bg-premium-orange hover:bg-premium-orange-dark text-premium-white border-0 shadow-lg"
          >
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
        </div>

        {/* Security Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 border border-premium-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-premium-black mb-4">Security Tips</h3>
          <ul className="space-y-2 text-sm text-premium-gray">
            <li className="flex items-start gap-2">
              <span className="text-premium-orange mt-1">•</span>
              Use a unique password that you don't use elsewhere
            </li>
            <li className="flex items-start gap-2">
              <span className="text-premium-orange mt-1">•</span>
              Consider using a password manager to generate and store secure passwords
            </li>
            <li className="flex items-start gap-2">
              <span className="text-premium-orange mt-1">•</span>
              Change your password regularly for better security
            </li>
            <li className="flex items-start gap-2">
              <span className="text-premium-orange mt-1">•</span>
              Never share your password with anyone
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ChangePassword;
