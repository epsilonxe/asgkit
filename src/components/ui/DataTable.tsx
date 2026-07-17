"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
}

type SortDir = "asc" | "desc";

function defaultSortValue<T>(row: T, key: string): string | number {
  const value = (row as unknown as Record<string, unknown>)[key];
  return typeof value === "number" ? value : String(value ?? "");
}

export function DataTable<T>({
  rows,
  columns,
  rowsPerPage,
  getRowKey,
  emptyMessage = "Nothing to show yet.",
}: {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowsPerPage: number;
  getRowKey: (row: T) => string | number;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return rows;
    const getValue = column.sortValue ?? ((row: T) => defaultSortValue(row, column.key));

    return [...rows].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      const cmp =
        typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sortedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function toggleSort(column: DataTableColumn<T>) {
    if (!column.sortable) return;
    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
    setPage(1);
  }

  if (rows.length === 0) {
    return <EmptyState>{emptyMessage}</EmptyState>;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 py-2 font-medium ${column.sortable ? "cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-100" : ""} ${column.className ?? ""}`}
                  onClick={() => toggleSort(column)}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.label}
                    {column.sortable &&
                      sortKey === column.key &&
                      (sortDir === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-t border-slate-200 align-top dark:border-slate-700"
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-2 ${column.className ?? ""}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-end gap-3 text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={currentPage >= pageCount}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
