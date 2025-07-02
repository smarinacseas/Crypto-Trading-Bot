import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  helpText,
  icon,
  fullWidth = false,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'block rounded-lg border bg-secondary-700 px-3 py-2 text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200';
  const errorClasses = error ? 'border-danger-500 focus:ring-danger-500' : 'border-secondary-600 focus:border-primary-600';
  const widthClass = fullWidth ? 'w-full' : '';
  const iconPadding = icon ? 'pl-10' : '';
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-neutral-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-neutral-400">{icon}</span>
          </div>
        )}
        <input
          ref={ref}
          className={`${baseClasses} ${errorClasses} ${widthClass} ${iconPadding} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger-500">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-neutral-400">{helpText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;