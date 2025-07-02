import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  SignalIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  SparklesIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Badge } from './ui';
import AuthModal from './AuthModal';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Trading', href: '/trading', icon: CurrencyDollarIcon },
  { name: 'Data Streams', href: '/data-streams', icon: SignalIcon },
  { name: 'Indicators', href: '/indicators', icon: Cog6ToothIcon },
  { name: 'Account', href: '/account', icon: UserIcon },
];

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const navigate = useNavigate();
  const isDemoMode = localStorage.getItem('demo_mode') === 'true';

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('demo_mode');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-secondary-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-secondary-900 bg-opacity-75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-secondary-800 border-r border-secondary-700 shadow-2xl">
          <div className="flex h-16 items-center justify-between px-6 bg-gradient-to-r from-primary-600 to-sage-600">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-white mr-2" />
              <h1 className="text-xl font-bold text-white">CryptoBot</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/80 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          {/* User Profile Section */}
          {(isAuthenticated || isDemoMode) && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {isDemoMode ? 'Demo User' : (user?.first_name || user?.email || 'User')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isDemoMode && <Badge variant="warning" size="sm">Demo Mode</Badge>}
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 px-4 py-6">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <ChevronRightIcon className="h-4 w-4 text-primary-600" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-gray-200" />

            {/* Additional Actions */}
            <div className="space-y-1">
              <button className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
                <BellIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                <span className="flex-1 text-left">Notifications</span>
                <Badge variant="danger" size="sm">3</Badge>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-6 bg-gradient-to-r from-primary-600 to-primary-700">
            <SparklesIcon className="h-8 w-8 text-white mr-2" />
            <h1 className="text-xl font-bold text-white">CryptoBot</h1>
          </div>
          {/* User Profile Section */}
          {(isAuthenticated || isDemoMode) && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {isDemoMode ? 'Demo User' : (user?.first_name || user?.email || 'User')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isDemoMode && <Badge variant="warning" size="sm">Demo Mode</Badge>}
                  </p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <ChevronRightIcon className="h-4 w-4 text-primary-600" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-gray-200" />

            {/* Additional Actions */}
            <div className="space-y-1">
              <button className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200">
                <BellIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                <span className="flex-1 text-left">Notifications</span>
                <Badge variant="danger" size="sm">3</Badge>
              </button>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4 lg:px-8">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {isDemoMode ? 'Demo Mode' : (user?.first_name || user?.email)}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
}

export default Layout;