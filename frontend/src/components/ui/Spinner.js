import React from 'react';

const Spinner = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  const colors = {
    primary: 'text-primary-500',
    white: 'text-white',
    neutral: 'text-neutral-400'
  };
  
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg 
        className={`animate-spin ${sizes[size]} ${colors[color]}`}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

const SpinnerOverlay = ({ show, children }) => {
  if (!show) return children;
  
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-secondary-800 bg-opacity-75 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
        <Spinner />
      </div>
      <div className="opacity-50">
        {children}
      </div>
    </div>
  );
};

Spinner.Overlay = SpinnerOverlay;

export default Spinner;