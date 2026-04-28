import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  TableCellsIcon,
  Squares2X2Icon,
  StarIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Separator } from './ui/separator.jsx';
import ErrorBoundary from './ErrorBoundary';

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  { name: 'Screener', href: '/screener', icon: TableCellsIcon },
  { name: 'Sectors', href: '/sectors', icon: Squares2X2Icon },
  { name: 'Watchlist', href: '/watchlist', icon: StarIcon },
];

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center px-6 bg-gradient-to-r from-primary-600 to-sage-600">
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity duration-200">
          <SparklesIcon className="h-8 w-8 text-white mr-2" />
          <h1 className="text-xl font-bold text-white">StockDash</h1>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-300 border border-primary-600/30'
                    : 'text-neutral-300 hover:bg-secondary-700 hover:text-neutral-100'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-primary-400' : 'text-neutral-400 group-hover:text-neutral-300'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="my-6"><Separator className="bg-secondary-600" /></div>
        <Link
          to="/refresh"
          onClick={() => setSidebarOpen(false)}
          className="group flex items-center px-3 py-2.5 text-sm font-medium text-neutral-300 rounded-lg hover:bg-secondary-700 hover:text-neutral-100 transition-all"
        >
          <ArrowPathIcon className="mr-3 h-5 w-5 text-neutral-400 group-hover:text-neutral-300" />
          Refresh data
        </Link>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-secondary-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-secondary-900 bg-opacity-75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-secondary-800 border-r border-secondary-700">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-4 text-white/80 hover:text-white z-10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-secondary-800 border-r border-secondary-700">
          {sidebarContent}
        </div>
      </div>

      {/* Main */}
      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 bg-secondary-800 border-b border-secondary-700 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-neutral-400 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center px-4 lg:px-8">
            <h2 className="text-2xl font-semibold text-neutral-100">
              {navigation.find((i) => i.href === location.pathname)?.name || 'StockDash'}
            </h2>
          </div>
        </div>
        <main className="p-4 lg:p-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default Layout;
