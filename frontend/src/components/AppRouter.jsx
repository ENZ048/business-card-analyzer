import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import BusinessCardApp from './BusinessCardApp';
import AdminLayout from './admin/AdminLayout';
import AuthPage from './auth/AuthPage';
import LoadingSpinner from './ui/LoadingSpinner';

const AppRouter = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If user is not authenticated, show auth page
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // If user is admin, show admin panel
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    return <AdminLayout />;
  }

  // Regular user - show main app
  return <BusinessCardApp />;
};

export default AppRouter;
