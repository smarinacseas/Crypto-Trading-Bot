import React, { useState, useEffect, createContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  FireIcon,
  BeakerIcon,
  PlayIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Badge } from './ui/badge.jsx';
import AuthModal from './AuthModal';
import ErrorBoundary from './ErrorBoundary';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Strategies', href: '/strategies', icon: FireIcon },
  { name: 'Backtesting', href: '/backtesting', icon: BeakerIcon },
  { name: 'Paper Trading', href: '/paper-trading', icon: PlayIcon },
  { name: 'Trading', href: '/trading', icon: CurrencyDollarIcon },
  { name: 'Data Streams', href: '/data-streams', icon: SignalIcon },
  { name: 'Indicators', href: '/indicators', icon: Cog6ToothIcon },
  { name: 'Account', href: '/account', icon: UserIcon },
];

// Create a context for live data connection status
export const LiveDataContext = createContext({ isConnected: false });

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
      // Clear demo mode if user is authenticated
      localStorage.removeItem('demo_mode');
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

  // Only consider demo mode if user is NOT authenticated
  const isDemoMode = !isAuthenticated && localStorage.getItem('demo_mode') === 'true';

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('demo_mode');
    
    // Reset state
    setIsAuthenticated(false);
    setUser(null);
    
    // Force navigation to landing page
    window.location.href = '/';
  };

  // WebSocket connection for live data status
  useEffect(() => {
    console.log('Attempting WebSocket connection...');
    const ws = new window.WebSocket('ws://localhost:8000/ws/ws');
    
    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      ws.send(JSON.stringify({
        action: 'start_stream',
        stream_type: 'standard',
        symbol: 'btcusdt',
      }));
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Optionally, try to reconnect after a delay
      // setTimeout(() => connectWebSocket(), 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    return () => {
      console.log('Cleaning up WebSocket connection');
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-secondary-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-secondary-900 bg-opacity-75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-secondary-800 border-r border-secondary-700">
          <div className="flex h-16 items-center justify-between px-6 bg-gradient-to-r from-primary-600 to-sage-600">
            <Link 
              to="/dashboard" 
              className="flex items-center hover:opacity-80 transition-opacity duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <SparklesIcon className="h-8 w-8 text-white mr-2" />
              <h1 className="text-xl font-bold text-white">TradeShare</h1>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/80 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          {/* User Profile Section */}
          {(isAuthenticated || isDemoMode) && (
            <div className="px-6 py-4 border-b border-secondary-600">
              <Link
                to="/account"
                className="flex items-center hover:bg-secondary-700 rounded-lg p-2 -m-2 transition-colors duration-200"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-sage-600 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-100">
                    {isDemoMode ? 'Demo User' : (user?.first_name || user?.email || 'User')}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {isDemoMode && <Badge variant="warning" size="sm">Demo Mode</Badge>}
                  </p>
                </div>
              </Link>
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
                        ? 'bg-primary-600/20 text-primary-300 shadow-sm border border-primary-600/30'
                        : 'text-neutral-300 hover:bg-secondary-700 hover:text-neutral-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                      isActive ? 'text-primary-400' : 'text-neutral-400 group-hover:text-neutral-300'
                    }`} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <ChevronRightIcon className="h-4 w-4 text-primary-400" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-secondary-600" />

            {/* Additional Actions */}
            <div className="space-y-1">
              <button className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-300 rounded-lg hover:bg-secondary-700 hover:text-neutral-100 transition-all duration-200">
                <BellIcon className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-300" />
                <span className="flex-1 text-left">Notifications</span>
                <Badge variant="danger" size="sm">3</Badge>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-secondary-800 border-r border-secondary-700">
          <div className="flex h-16 items-center px-6 bg-gradient-to-r from-primary-600 to-sage-600">
            <Link 
              to="/dashboard" 
              className="flex items-center hover:opacity-80 transition-opacity duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <SparklesIcon className="h-8 w-8 text-white mr-2" />
              <h1 className="text-xl font-bold text-white">TradeShare</h1>
            </Link>
          </div>
          {/* User Profile Section */}
          {(isAuthenticated || isDemoMode) && (
            <div className="px-6 py-4 border-b border-secondary-600">
              <Link
                to="/account"
                className="flex items-center hover:bg-secondary-700 rounded-lg p-2 -m-2 transition-colors duration-200"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-600 to-sage-600 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-100">
                    {isDemoMode ? 'Demo User' : (user?.first_name || user?.email || 'User')}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {isDemoMode && <Badge variant="warning" size="sm">Demo Mode</Badge>}
                  </p>
                </div>
              </Link>
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
                        ? 'bg-primary-600/20 text-primary-300 shadow-sm border border-primary-600/30'
                        : 'text-neutral-300 hover:bg-secondary-700 hover:text-neutral-100'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${
                      isActive ? 'text-primary-400' : 'text-neutral-400 group-hover:text-neutral-300'
                    }`} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <ChevronRightIcon className="h-4 w-4 text-primary-400" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-secondary-600" />

            {/* Additional Actions */}
            <div className="space-y-1">
              <button className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-300 rounded-lg hover:bg-secondary-700 hover:text-neutral-100 transition-all duration-200">
                <BellIcon className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-300" />
                <span className="flex-1 text-left">Notifications</span>
                <Badge variant="danger" size="sm">3</Badge>
              </button>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-secondary-600">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-300" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 bg-secondary-800 border-b border-secondary-700 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4 lg:px-8">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-neutral-100">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <button className="relative p-2 text-neutral-400 hover:text-neutral-200 transition-colors">
                    <BellIcon className="h-6 w-6" />
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-500 ring-2 ring-secondary-800" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="relative"
                      onMouseEnter={() => setShowUserDropdown(true)}
                      onMouseLeave={() => setShowUserDropdown(false)}
                    >
                      <button className="flex items-center space-x-1 text-sm text-neutral-300 hover:text-neutral-100 transition-colors">
                        <span>{isDemoMode ? 'Demo Mode' : (user?.first_name || user?.email)}</span>
                        <ChevronDownIcon className="h-4 w-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {showUserDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-secondary-800 border border-secondary-600 rounded-lg shadow-lg z-50">
                          <div className="py-1">
                            <Link
                              to="/account"
                              className="flex items-center px-4 py-2 text-sm text-neutral-300 hover:bg-secondary-700 hover:text-neutral-100 transition-colors"
                              onClick={() => setShowUserDropdown(false)}
                            >
                              <UserIcon className="h-4 w-4 mr-2" />
                              Account Settings
                            </Link>
                            <button
                              onClick={() => {
                                setShowUserDropdown(false);
                                handleLogout();
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-neutral-300 hover:bg-secondary-700 hover:text-neutral-100 transition-colors"
                            >
                              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                    <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {/* {isConnected ? 'Live' : 'Disconnected'} */}
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
          <ErrorBoundary>
            <LiveDataContext.Provider value={{ isConnected }}>
              {children}
            </LiveDataContext.Provider>
          </ErrorBoundary>
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