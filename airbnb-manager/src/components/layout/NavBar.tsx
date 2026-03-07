import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface NavBarProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  largeTitle?: boolean;
}

export default function NavBar({ title, showBack, rightAction, largeTitle = true }: NavBarProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-ios-bg/90 backdrop-blur-xl" style={{ paddingTop: 'var(--sat, 0px)' }}>
      <div className="flex items-center justify-between h-[44px] px-4 max-w-[430px] mx-auto">
        <div className="w-20">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center min-w-[44px] min-h-[44px] text-ios-primary"
              aria-label="Retour"
            >
              <ChevronLeft size={28} />
              <span className="text-[17px]">Retour</span>
            </button>
          )}
        </div>
        {!largeTitle && <h1 className="text-[17px] font-semibold text-center flex-1">{title}</h1>}
        <div className="w-20 flex justify-end">{rightAction}</div>
      </div>
      {largeTitle && (
        <div className="px-5 pb-2 max-w-[430px] mx-auto">
          <h1 className="text-[28px] font-bold text-ios-text">{title}</h1>
        </div>
      )}
    </header>
  );
}
