"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import type { Theme } from "@/lib/settings";
import { Save, CheckCircle2 } from "lucide-react";

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(50);
  const [theme, setTheme] = useState<Theme>("system");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setMaxFileSizeMb(data.maxFileSizeMb);
      setTheme(data.theme);
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxFileSizeMb, theme }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "failed to save settings");
        return;
      }

      // Instant feedback for this tab; router.refresh() keeps the
      // server-rendered <html> class consistent with the DB going forward.
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      }

      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <main className="mx-auto max-w-2xl p-8">
        <Loading />
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Input
          id="maxFileSizeMb"
          label="Max file size (MB)"
          type="number"
          min={1}
          value={maxFileSizeMb}
          onChange={(e) => setMaxFileSizeMb(Number(e.target.value))}
          hint="Applies to each uploaded file on the student submission page."
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Theme
          </label>
          <div className="flex gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  theme === opt.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Sets the default appearance for every visitor.
          </p>
        </div>

        {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" icon={Save} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </form>
    </main>
  );
}
