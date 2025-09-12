import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

  return (
    <BrowserRouter basename="/login">
      <Routes>
        {/* If user is not authenticated, show auth page */}
        {!isAuthenticated ? (
          <Route path="*" element={<AuthPage />} />
        ) : (
          <>
            {/* If user is admin, show admin panel */}
            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <Route path="*" element={<AdminLayout />} />
            ) : (
              /* Regular user - show main app */
              <Route path="*" element={<BusinessCardApp />} />
            )}
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
