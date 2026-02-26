"use client";

import Link from "next/link";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  linkPrefix?: string;
  page: number;
  pageSize: number;
  total: number;
  baseUrl: string;
};

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  linkPrefix,
  page,
  pageSize,
  total,
  baseUrl,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="data-table-container">
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-row">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const key = String(item[keyField]);
                const row = (
                  <tr key={key}>
                    {columns.map((col) => (
                      <td key={String(col.key)}>
                        {col.render
                          ? col.render(item)
                          : String(item[col.key as keyof T] ?? "-")}
                      </td>
                    ))}
                  </tr>
                );
                if (linkPrefix) {
                  return (
                    <Link
                      key={key}
                      href={`${linkPrefix}/${key}`}
                      className="table-row-link"
                      style={{ display: "contents" }}
                    >
                      {row}
                    </Link>
                  );
                }
                return row;
              })
            )}
          </tbody>
        </table>
      </div>
      {total > 0 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {start}-{end} of {total}
          </span>
          <div className="pagination-controls">
            <Link
              href={`${baseUrl}?page=${Math.max(1, page - 1)}`}
              className={`pagination-btn ${page <= 1 ? "disabled" : ""}`}
              aria-disabled={page <= 1}
            >
              Previous
            </Link>
            <span className="pagination-page">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`${baseUrl}?page=${Math.min(totalPages, page + 1)}`}
              className={`pagination-btn ${page >= totalPages ? "disabled" : ""}`}
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
