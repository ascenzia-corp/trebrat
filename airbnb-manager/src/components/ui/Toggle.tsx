
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center justify-between min-h-[44px] cursor-pointer">
      {label && <span className="text-[17px] text-ios-text">{label}</span>}
      <input
        type="checkbox"
        className="ios-toggle"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        aria-label={label}
      />
    </label>
  );
}
