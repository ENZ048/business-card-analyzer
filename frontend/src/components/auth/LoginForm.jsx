import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthLoading } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password to continue.');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success(`Welcome back, ${result.user?.firstName || 'User'}! You have been successfully logged in.`);
      } else {
        // Handle specific error messages from backend
        const errorMessage = result.error || 'Login failed. Please try again.';
        if (errorMessage.includes('Invalid email or password')) {
          toast.error('Invalid email or password. Please check your credentials and try again.');
        } else if (errorMessage.includes('Account is deactivated')) {
          toast.error('Your account has been deactivated. Please contact support for assistance.');
        } else if (errorMessage.includes('Email and password are required')) {
          toast.error('Please enter both email and password to continue.');
        } else if (errorMessage.includes('Server error')) {
          toast.error('Server error occurred. Please try again in a few moments.');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (err) {
      toast.error('Network error occurred. Please check your internet connection and try again.');
    }
  };

  return (
    <div className="bg-premium-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-premium-black mb-2">Welcome Back</h2>
          <p className="text-premium-gray">Sign in to your account</p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your password"
                className="pl-10 pr-10"
                required
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

           <Button
             type="submit"
             disabled={isAuthLoading}
             className="w-full bg-premium-black hover:bg-premium-orange text-premium-white border-0 shadow-lg transition-colors duration-200"
           >
             {isAuthLoading ? 'Signing In...' : 'Sign In'}
           </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-premium-gray">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-premium-orange hover:text-premium-black font-medium transition-colors duration-200"
            >
              Sign up
            </button>
          </p>
        </div>
    </div>
  );
};

export default LoginForm;
