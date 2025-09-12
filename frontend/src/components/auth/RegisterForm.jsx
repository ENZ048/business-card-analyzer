import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
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
    confirmPassword: ''
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
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
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
        password: formData.password
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
      console.error('Registration error:', err);
      toast.error('Network error occurred. Please check your internet connection and try again.');
    }
  };

  return (
    <div className="bg-premium-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-premium-black mb-2">Create Account</h2>
          <p className="text-premium-gray">Join our business card analyzer platform</p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-premium-black text-sm font-medium mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-5 h-5" />
                <Input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-premium-black text-sm font-medium mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-5 h-5" />
                <Input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-premium-black text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-5 h-5" />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-premium-black text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-5 h-5" />
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-premium-gray hover:text-premium-gray"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-premium-black text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-premium-gray w-5 h-5" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="pl-10 pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-premium-gray hover:text-premium-gray"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isAuthLoading || formData.password !== formData.confirmPassword}
            className="w-full bg-premium-black hover:bg-premium-orange text-premium-white border-0 shadow-lg transition-colors duration-200"
          >
            {isAuthLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-premium-gray">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-premium-orange hover:text-premium-black font-medium transition-colors duration-200"
            >
              Sign in
            </button>
          </p>
        </div>
    </div>
  );
};

export default RegisterForm;
