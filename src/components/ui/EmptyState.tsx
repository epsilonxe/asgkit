import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-200 py-8 text-center text-slate-400 dark:border-slate-700 dark:text-slate-500">
      <Inbox className="h-6 w-6" />
      <p>{children}</p>
    </div>
  );
}
