"use client";

import { useEffect, useState } from "react";

const DEFAULT_ROWS_PER_PAGE = 5;

export function useRowsPerPage() {
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setRowsPerPage(data.rowsPerPage);
      setLoading(false);
    })();
  }, []);

  return { rowsPerPage, loading };
}
