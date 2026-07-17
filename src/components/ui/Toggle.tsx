type ToggleProps = {
  pressed: boolean;
  onChange: () => void;
  onLabel?: string;
  offLabel?: string;
  className?: string;
};

export function Toggle({
  pressed,
  onChange,
  onLabel = "Open",
  offLabel = "Closed",
  className = "",
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      onClick={onChange}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        pressed
          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400 dark:hover:bg-green-900/60"
          : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
      } ${className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${pressed ? "bg-green-600 dark:bg-green-400" : "bg-slate-500 dark:bg-slate-400"}`}
      />
      {pressed ? onLabel : offLabel}
    </button>
  );
}
