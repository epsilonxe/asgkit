import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading…
    </p>
  );
}
