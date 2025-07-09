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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import { Separator } from './ui/separator.jsx';
import AuthModal from './AuthModal';
import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';

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
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Use AuthContext
  const { user, isAuthenticated, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  // Debug: Log user data to console (remove in production)
  useEffect(() => {
    if (user) {
      console.log('User data:', {
        email: user.email,
        provider: user.app_metadata?.provider,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata
      });
    }
  }, [user]);

  const getUserDisplayName = () => {
    // Check if user signed in with Google OAuth
    const isGoogleUser = user?.app_metadata?.provider === 'google';
    
    if (isGoogleUser) {
      // For Google users, try to get first name from the full name
      if (user?.user_metadata?.full_name) {
        const firstName = user.user_metadata.full_name.split(' ')[0];
        return firstName;
      }
      if (user?.user_metadata?.name) {
        const firstName = user.user_metadata.name.split(' ')[0];
        return firstName;
      }
      if (user?.user_metadata?.given_name) {
        return user.user_metadata.given_name;
      }
    }
    
    // For manual signup users, use their provided name
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    
    // Fallback to email if no name is available
    return user?.email || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    if (name === 'User') return 'U';
    
    // Handle single names (like just first name) and multiple names
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 1) {
      // Single name - take first two characters or just first if name is short
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    // Multiple names - take first character of first two parts
    return nameParts.slice(0, 2).map(n => n[0]).join('').toUpperCase();
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
          {isAuthenticated && (
            <div className="px-6 py-4 border-b border-secondary-600">
              <Link
                to="/account"
                className="flex items-center hover:bg-secondary-700 rounded-lg p-2 -m-2 transition-colors duration-200"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-gradient-to-br from-primary-600 to-sage-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-100">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {user?.email}
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

            <div className="my-6">
              <Separator className="bg-secondary-600" />
            </div>

            <div className="space-y-1">
              <button className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-300 rounded-lg hover:bg-secondary-700 hover:text-neutral-100 transition-all duration-200">
                <BellIcon className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-300" />
                <span className="flex-1 text-left">Notifications</span>
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
            >
              <SparklesIcon className="h-8 w-8 text-white mr-2" />
              <h1 className="text-xl font-bold text-white">TradeShare</h1>
            </Link>
          </div>
          
          {/* User Profile Section */}
          {isAuthenticated && (
            <div className="px-6 py-4 border-b border-secondary-600">
              <Link
                to="/account"
                className="flex items-center hover:bg-secondary-700 rounded-lg p-2 -m-2 transition-colors duration-200"
              >
                <div className="flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={getUserDisplayName()} />
                    <AvatarFallback className="bg-gradient-to-br from-primary-600 to-sage-600 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-neutral-100">
                    {getUserDisplayName()}
                  </p>
                  {/* <p className="text-xs text-neutral-400">
                    {user?.email}
                  </p> */}
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

            <div className="my-6">
              <Separator className="bg-secondary-600" />
            </div>

            <div className="space-y-1">
              <button className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-300 rounded-lg hover:bg-secondary-700 hover:text-neutral-100 transition-all duration-200">
                <BellIcon className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-300" />
                <span className="flex-1 text-left">Notifications</span>
              </button>
            </div>
          </nav>

          {/* Logout Button */}
          {isAuthenticated && (
            <div className="p-4 border-t border-secondary-600">
              <button
                onClick={handleLogout}
                className="group flex items-center w-full px-3 py-2.5 text-sm font-medium text-neutral-400 rounded-lg hover:bg-secondary-700 hover:text-neutral-100 transition-all duration-200"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-300" />
                <span>Logout</span>
              </button>
            </div>
          )}
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
                        <span>{getUserDisplayName()}</span>
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