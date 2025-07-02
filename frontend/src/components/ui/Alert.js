import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/solid';

const Alert = ({ 
  children, 
  variant = 'info', 
  title,
  onClose,
  className = '' 
}) => {
  const variants = {
    info: {
      bg: 'bg-info-500/10',
      border: 'border-info-500/30',
      text: 'text-info-300',
      icon: InformationCircleIcon,
      iconColor: 'text-info-400'
    },
    success: {
      bg: 'bg-success-500/10',
      border: 'border-success-500/30',
      text: 'text-success-300',
      icon: CheckCircleIcon,
      iconColor: 'text-success-400'
    },
    warning: {
      bg: 'bg-warning-500/10',
      border: 'border-warning-500/30',
      text: 'text-warning-300',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-warning-400'
    },
    error: {
      bg: 'bg-danger-500/10',
      border: 'border-danger-500/30',
      text: 'text-danger-300',
      icon: XCircleIcon,
      iconColor: 'text-danger-400'
    }
  };
  
  const variantConfig = variants[variant];
  const Icon = variantConfig.icon;
  
  return (
    <div className={`rounded-lg border p-4 ${variantConfig.bg} ${variantConfig.border} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${variantConfig.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${variantConfig.text}`}>
              {title}
            </h3>
          )}
          <div className={`${title ? 'mt-2' : ''} text-sm ${variantConfig.text}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${variantConfig.text} hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-800 focus:ring-accent-500`}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;