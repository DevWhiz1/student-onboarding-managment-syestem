import React from 'react';
import { clsx } from 'clsx';

const Input = ({ 
  label, 
  error, 
  helperText,
  icon: Icon,
  iconPosition = 'left',
  className,
  ...props 
}) => {
  const inputClasses = clsx(
    'block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500',
    {
      'pl-10': Icon && iconPosition === 'left',
      'pr-10': Icon && iconPosition === 'right',
      'px-3 py-2': !Icon,
      'border-red-300 focus:border-red-500 focus:ring-red-500': error,
    },
    className
  );

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input className={inputClasses} {...props} />
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
