import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ShoppingBagIcon,
  ArrowPathIcon,
  Bars3Icon,
  XMarkIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import ErrorBoundary from './ErrorBoundary';
import { useBasket } from '../contexts/BasketContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: ChartBarIcon },
  { name: 'Screener', href: '/screener', icon: TableCellsIcon },
  { name: 'Sectors', href: '/sectors', icon: Squares2X2Icon },
  { name: 'Basket', href: '/basket', icon: ShoppingBagIcon, badge: 'basket' },
  { name: 'Refresh', href: '/refresh', icon: ArrowPathIcon },
];

function NavItems({ onNavigate }) {
  const location = useLocation();
  const { items: basketItems } = useBasket();

  return (
    <div className="space-y-0.5">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href ||
          (item.href !== '/' && location.pathname.startsWith(item.href));
        const badgeCount = item.badge === 'basket' ? basketItems.length : null;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={onNavigate}
            className={`group flex items-center px-3 py-2 text-sm rounded-md transition-all ${
              isActive
                ? 'bg-primary-600/20 text-primary-200 border border-primary-600/30'
                : 'text-neutral-300 hover:bg-secondary-700/60 hover:text-neutral-100 border border-transparent'
            }`}
          >
            <item.icon className={`mr-2.5 h-4 w-4 ${isActive ? 'text-primary-300' : 'text-neutral-400'}`} />
            <span className="flex-1">{item.name}</span>
            {badgeCount != null && badgeCount > 0 && (
              <span className="num text-[10px] bg-primary-600/40 text-primary-100 rounded px-1.5 py-0.5">
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function SidebarBody({ onNavigate }) {
  return (
    <>
      <div className="flex h-14 items-center px-5 border-b border-secondary-700">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2 hover:opacity-80">
          <CommandLineIcon className="h-5 w-5 text-primary-400" />
          <h1 className="ticker text-base font-semibold text-neutral-100 tracking-wide">STOCKDASH</h1>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="section-label px-3 mb-2">Navigation</div>
        <NavItems onNavigate={onNavigate} />
      </nav>
      <div className="p-3 border-t border-secondary-700 text-[10px] text-neutral-500 uppercase tracking-wider">
        EOD · Local mode
      </div>
    </>
  );
}

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPage = navigation.find((i) =>
    i.href === location.pathname || (i.href !== '/' && location.pathname.startsWith(i.href)),
  );

  return (
    <div className="min-h-screen bg-secondary-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-secondary-900/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-secondary-800 border-r border-secondary-700">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-4 text-neutral-400 hover:text-neutral-100 z-10"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <SidebarBody onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col">
        <div className="flex flex-col flex-grow bg-secondary-800 border-r border-secondary-700">
          <SidebarBody />
        </div>
      </div>

      {/* Main */}
      <div className="lg:pl-60">
        <div className="sticky top-0 z-40 flex h-14 bg-secondary-800/95 backdrop-blur border-b border-secondary-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-neutral-400 lg:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4 lg:px-6">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold text-neutral-100">
                {currentPage?.name || 'StockDash'}
              </h2>
              <span className="section-label hidden md:inline">/ {location.pathname}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-neutral-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>
        <main className="p-4 lg:p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default Layout;
