import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  primary: 'bg-blue-100 text-ios-primary',
  success: 'bg-green-100 text-ios-success',
  warning: 'bg-orange-100 text-ios-warning',
  danger: 'bg-red-100 text-ios-danger',
  gray: 'bg-gray-100 text-ios-text-secondary',
};

export default function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
