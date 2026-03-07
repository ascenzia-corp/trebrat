import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  statusColor?: 'blue' | 'green' | 'gray' | 'red';
}

const statusColors = {
  blue: 'border-l-4 border-l-ios-primary',
  green: 'border-l-4 border-l-ios-success',
  gray: 'border-l-4 border-l-ios-text-secondary',
  red: 'border-l-4 border-l-ios-danger',
};

export default function Card({ children, className = '', onClick, statusColor }: CardProps) {
  return (
    <div
      className={`ios-card p-4 ${statusColor ? statusColors[statusColor] : ''} ${onClick ? 'cursor-pointer active:opacity-80' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
