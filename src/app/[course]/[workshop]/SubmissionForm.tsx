"use client";

import { useRef, useState } from "react";
import { formatBytes } from "@/lib/formatBytes";

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
}: {
  courseSlug: string;
  workshopSlug: string;
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
      <div>
        <label className="mb-1 block text-sm font-medium">Student ID</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="e.g. s12345"
          required
        />
        <p className="mt-1 text-xs text-gray-400">
          Letters, numbers, dashes and underscores only.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Files</label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`rounded border-2 border-dashed px-4 py-6 text-center text-sm ${
            dragging ? "border-black bg-gray-50" : "border-gray-300 text-gray-500"
          }`}
        >
          Drag & drop files or a folder here
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 rounded border px-4 py-2 hover:bg-gray-50"
        >
          Browse files
        </button>

        {items.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>{items.length} file(s) staged</span>
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-red-600 hover:underline"
              >
                Clear all
              </button>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded border p-2 text-sm">
              {items.map((item, i) => (
                <li key={`${item.relativePath}-${i}`} className="flex items-center justify-between">
                  <span className="truncate">
                    {item.relativePath}{" "}
                    <span className="text-gray-400">({formatBytes(item.file.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="ml-2 text-red-600 hover:underline"
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        disabled={submitting}
        className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <p className="text-green-700">
          Submitted {result.fileNames.join(", ")} at{" "}
          {new Date(result.submittedAt).toLocaleString()}
        </p>
      )}
    </form>
  );
}
