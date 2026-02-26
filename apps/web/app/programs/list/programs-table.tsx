"use client";

import Link from "next/link";
import { ProgramSummary } from "../../lib/queries";

type Props = {
  data: ProgramSummary[];
  page: number;
  pageSize: number;
  total: number;
};

export function ProgramsTable({ data, page, pageSize, total }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="data-table-container">
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Description</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  No programs found
                </td>
              </tr>
            ) : (
              data.map((program) => (
                <tr
                  key={program.id}
                  onClick={() =>
                    (window.location.href = `/programs/${program.id}`)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{program.name}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${program.status ?? "draft"}`}>
                      {program.status ?? "draft"}
                    </span>
                  </td>
                  <td>{program.description || "-"}</td>
                  <td>{new Date(program.created_at).toLocaleDateString()}</td>
                </tr>
              ))
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
              href={`/programs/list?page=${Math.max(1, page - 1)}`}
              className={`pagination-btn ${page <= 1 ? "disabled" : ""}`}
            >
              Previous
            </Link>
            <span className="pagination-page">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/programs/list?page=${Math.min(totalPages, page + 1)}`}
              className={`pagination-btn ${page >= totalPages ? "disabled" : ""}`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
