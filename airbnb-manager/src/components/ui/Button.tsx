import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-ios-primary text-white active:bg-blue-600',
  secondary: 'bg-gray-200 text-ios-text active:bg-gray-300',
  danger: 'bg-ios-danger text-white active:bg-red-600',
  ghost: 'bg-transparent text-ios-primary active:bg-gray-100',
};

const sizes = {
  sm: 'h-9 px-3 text-[15px]',
  md: 'h-[50px] px-5 text-[17px]',
  lg: 'h-14 px-6 text-[17px]',
};

export default function Button({ variant = 'primary', size = 'md', fullWidth, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`ios-btn ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} rounded-[10px] font-semibold transition-opacity disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
