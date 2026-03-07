import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-[13px] text-ios-text-secondary font-medium uppercase tracking-wide">{label}</label>}
      <input
        className={`w-full h-[44px] px-4 rounded-[10px] bg-ios-bg text-[17px] text-ios-text placeholder:text-ios-text-secondary/60 outline-none focus:ring-2 focus:ring-ios-primary/30 transition-shadow ${error ? 'ring-2 ring-ios-danger/30' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[13px] text-ios-danger">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className = '', ...props }: TextAreaProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-[13px] text-ios-text-secondary font-medium uppercase tracking-wide">{label}</label>}
      <textarea
        className={`w-full px-4 py-3 rounded-[10px] bg-ios-bg text-[17px] text-ios-text placeholder:text-ios-text-secondary/60 outline-none focus:ring-2 focus:ring-ios-primary/30 transition-shadow resize-none ${className}`}
        {...props}
      />
    </div>
  );
}
