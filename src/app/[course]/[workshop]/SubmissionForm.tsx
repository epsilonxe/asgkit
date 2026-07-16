"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/formatBytes";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle, CheckCircle2, Trash2, UploadCloud, X } from "lucide-react";

type StagedFile = { file: File; relativePath: string };

// FileSystemEntry/FileSystemFileEntry/FileSystemDirectoryEntry and
// DataTransferItem.webkitGetAsEntry() are all in TS's DOM lib typings
// already - this is the non-standard but broadly supported (Chrome/Edge/
// Firefox/Safari) File and Directory Entries API, used to walk dropped
// folders.

async function readAllEntries(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  const all: FileSystemEntry[] = [];
  // readEntries() is not guaranteed to return every child in one call.
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject)
    );
    if (batch.length === 0) break;
    all.push(...batch);
  }
  return all;
}

async function collectEntry(
  entry: FileSystemEntry,
  basePath: string,
  out: StagedFile[]
): Promise<void> {
  const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject)
    );
    out.push({ file, relativePath });
  } else if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readAllEntries(reader);
    for (const child of children) {
      await collectEntry(child, relativePath, out);
    }
  }
}

export default function SubmissionForm({
  courseSlug,
  workshopSlug,
  maxFileSizeMb,
}: {
  courseSlug: string;
  workshopSlug: string;
  maxFileSizeMb: number;
}) {
  const [studentId, setStudentId] = useState("");
  const [items, setItems] = useState<StagedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ fileNames: string[]; submittedAt: string } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addItems(newItems: StagedFile[]) {
    setItems((prev) => [...prev, ...newItems]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).map((file) => ({
      file,
      relativePath: file.name,
    }));
    addItems(picked);
    e.target.value = "";
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);

    const dtItems = e.dataTransfer.items;
    const collected: StagedFile[] = [];

    const withEntries = dtItems && dtItems.length > 0 ? Array.from(dtItems) : [];
    const supportsEntries =
      withEntries.length > 0 && typeof withEntries[0].webkitGetAsEntry === "function";

    if (supportsEntries) {
      const entries = withEntries
        .map((item) => item.webkitGetAsEntry())
        .filter((entry): entry is FileSystemEntry => entry !== null);
      for (const entry of entries) {
        await collectEntry(entry, "", collected);
      }
    } else {
      // Fallback for browsers without entry-walking support: flat files only.
      for (const file of Array.from(e.dataTransfer.files)) {
        collected.push({ file, relativePath: file.name });
      }
    }

    addItems(collected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (items.length === 0) {
      setError("please add at least one file");
      return;
    }

    const formData = new FormData();
    formData.set("courseSlug", courseSlug);
    formData.set("workshopSlug", workshopSlug);
    formData.set("studentId", studentId);
    for (const item of items) {
      formData.append("files", item.file, item.relativePath);
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", { method: "POST", body: formData });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "submission failed");
        return;
      }
      setResult(body);
      setItems([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="studentId"
        label="Student ID"
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        placeholder="e.g. s12345"
        hint="Letters, numbers, dashes and underscores only."
        required
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Files
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400"
          }`}
        >
          <UploadCloud className="h-6 w-6 text-slate-400 dark:text-slate-500" />
          <span>
            Drag & drop files here
            <br />
            or <span className="text-blue-600 hover:underline dark:text-blue-400">click to browse</span>
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          You can upload multiple files. Max {maxFileSizeMb}MB per file.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        {items.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{items.length} file(s) staged</span>
              <Button type="button" variant="danger-link" icon={Trash2} onClick={() => setItems([])}>
                Clear all
              </Button>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
              {items.map((item, i) => (
                <li key={`${item.relativePath}-${i}`} className="flex items-center justify-between">
                  <span className="truncate">
                    {item.relativePath}{" "}
                    <span className="text-slate-400 dark:text-slate-500">
                      ({formatBytes(item.file.size)})
                    </span>
                  </span>
                  <Button
                    type="button"
                    variant="danger-link"
                    icon={X}
                    onClick={() => removeItem(i)}
                    className="ml-2"
                  >
                    remove
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button type="submit" icon={UploadCloud} disabled={submitting}>
        {submitting ? "Uploading…" : "Upload Submission"}
      </Button>

      {error && (
        <p className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {result && (
        <p className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Submitted {result.fileNames.join(", ")} at{" "}
          {new Date(result.submittedAt).toLocaleString()}
        </p>
      )}
    </form>
  );
}
