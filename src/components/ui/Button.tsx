import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "danger-link";

const variantClasses: Record<Variant, string> = {
  primary:
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400 dark:shadow-none",
  secondary:
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800",
  "danger-link": "inline-flex items-center gap-1 text-sm text-red-600 hover:underline dark:text-red-400",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  icon: Icon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: LucideIcon }) {
  return (
    <button type={type} className={`${variantClasses[variant]} ${className}`} {...props}>
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
