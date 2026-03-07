export default function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="border-2 border-gray-200 border-t-ios-primary rounded-full animate-spin"
        style={{ width: size, height: size }}
        role="status"
        aria-label="Chargement"
      />
    </div>
  );
}
