import React, { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-[430px] bg-white rounded-t-[20px] max-h-[90vh] overflow-y-auto ios-scroll animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(20px + var(--sab, 0px))' }}
      >
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>
        {title && (
          <div className="px-5 py-3 border-b border-ios-separator/50">
            <h2 className="text-[20px] font-semibold text-center">{title}</h2>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
