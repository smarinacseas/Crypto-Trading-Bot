import React, { useState } from 'react';

const Tabs = ({ 
  tabs, 
  defaultTab = 0,
  onChange,
  className = '',
  variant = 'default'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const handleTabClick = (index) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };
  
  const variants = {
    default: {
      list: 'border-b border-secondary-600',
      tab: 'pb-4 px-1 border-b-2 font-medium text-sm',
      activeTab: 'border-primary-500 text-primary-400',
      inactiveTab: 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-secondary-500'
    },
    pills: {
      list: 'bg-secondary-700 rounded-lg p-1',
      tab: 'px-3 py-2 rounded-md text-sm font-medium',
      activeTab: 'bg-primary-600 text-white shadow-sm',
      inactiveTab: 'text-neutral-300 hover:text-neutral-100 hover:bg-secondary-600'
    }
  };
  
  const variantConfig = variants[variant];
  
  return (
    <div className={className}>
      <div className={`${variantConfig.list}`}>
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => handleTabClick(index)}
              className={`
                ${variantConfig.tab}
                ${activeTab === index ? variantConfig.activeTab : variantConfig.inactiveTab}
                transition-colors duration-200
              `}
            >
              {tab.icon && (
                <span className="mr-2 inline-block">{tab.icon}</span>
              )}
              {tab.label}
              {tab.badge && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-500 text-neutral-100">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
};

export default Tabs;