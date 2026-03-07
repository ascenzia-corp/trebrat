import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`flex-1 overflow-y-auto ios-scroll pb-[calc(83px+var(--sab,0px))] ${className}`}>
      <div className="max-w-[430px] mx-auto">
        {children}
      </div>
    </div>
  );
}
