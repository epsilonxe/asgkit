import type { Submission } from "@/types/domain";
import { formatBytes } from "@/lib/formatBytes";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";

export type SubmissionWithFiles = Omit<Submission, "file_names"> & {
  files: { name: string; size: number | null }[];
};

export function SubmissionsTable({
  submissions,
  showWorkshopColumn = false,
  rowsPerPage,
}: {
  submissions: SubmissionWithFiles[];
  showWorkshopColumn?: boolean;
  rowsPerPage: number;
}) {
  const columns: DataTableColumn<SubmissionWithFiles>[] = [
    {
      key: "student_id",
      label: "Student ID",
      sortable: true,
      render: (s) => s.student_id,
    },
    ...(showWorkshopColumn
      ? [
          {
            key: "workshop_name",
            label: "Workshop",
            sortable: true,
            render: (s: SubmissionWithFiles) => s.workshop_name,
          } satisfies DataTableColumn<SubmissionWithFiles>,
        ]
      : []),
    {
      key: "submitted_at",
      label: "Submitted At",
      sortable: true,
      className: "whitespace-nowrap",
      render: (s) => new Date(s.submitted_at).toLocaleString(),
    },
    {
      key: "files",
      label: "Files",
      render: (s) => (
        <ul className="space-y-0.5">
          {s.files.map((f) => (
            <li key={f.name}>
              {f.name}{" "}
              <span className="text-slate-400 dark:text-slate-500">
                ({f.size !== null ? formatBytes(f.size) : "missing"})
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: "device_id",
      label: "Device ID",
      className: "font-mono text-xs",
      render: (s) => (
        <span title={s.device_id ?? undefined}>{s.device_id ? s.device_id.slice(0, 8) : "—"}</span>
      ),
    },
  ];

  return (
    <DataTable
      rows={submissions}
      columns={columns}
      rowsPerPage={rowsPerPage}
      getRowKey={(s) => s.id}
      emptyMessage="No submissions yet."
    />
  );
}
