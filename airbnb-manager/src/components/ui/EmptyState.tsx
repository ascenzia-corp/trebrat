import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-ios-text-secondary mb-4 opacity-50">{icon}</div>
      <h3 className="text-[17px] font-semibold text-ios-text mb-1">{title}</h3>
      {description && <p className="text-[15px] text-ios-text-secondary">{description}</p>}
    </div>
  );
}
