import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Settings,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import PlanManagement from './PlanManagement';
import UsageAnalytics from './UsageAnalytics';

const AdminLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'plans', label: 'Plan Management', icon: CreditCard },
    { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'plans':
        return <PlanManagement />;
      case 'analytics':
        return <UsageAnalytics />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EFEAE3' }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-premium-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-premium-border flex-shrink-0">
          <div className="flex items-center">
            <img 
              src="/logo-black.png" 
              alt="Logo" 
              className="h-6 w-6 mr-2 object-contain"
            />
            <h1 className="text-lg font-bold text-premium-black">Admin Panel</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-premium-gray hover:text-premium-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-3 border-b border-premium-border bg-premium-beige-light flex-shrink-0">
          <div className="flex items-center">
            <div className="h-9 w-9 bg-premium-orange rounded-full flex items-center justify-center mr-3 shadow-lg">
              <span className="text-xs font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-premium-black truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-premium-gray truncate">{user?.email}</p>
              <div className="mt-1">
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                  user?.role === 'super_admin' 
                    ? 'bg-premium-orange-muted text-premium-orange-dark'
                    : 'bg-premium-orange-muted text-premium-orange'
                }`}>
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2.5 text-left transition-all duration-200 rounded-lg mb-1 ${
                  activeTab === item.id
                    ? 'bg-black text-white shadow-md'
                    : 'text-premium-gray hover:bg-premium-beige hover:text-premium-black'
                }`}
              >
                <Icon className={`h-4 w-4 mr-3 ${activeTab === item.id ? 'text-white' : 'text-premium-gray'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-premium-border">
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2.5 text-left transition-all duration-200 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-3" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-premium-border h-14 flex items-center justify-between px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-premium-gray hover:text-premium-black p-2 rounded-lg hover:bg-premium-beige transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-premium-gray">
              Welcome back, <span className="font-semibold text-premium-black">{user?.firstName}</span>
            </div>
            <div className="h-7 w-7 bg-premium-orange rounded-full flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">
                {user?.role === 'super_admin' ? 'SA' : 'A'}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 overflow-y-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
