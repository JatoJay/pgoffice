"use client";

import Link from "next/link";
import type { SurveySummary } from "../../lib/queries";

type Props = {
  data: SurveySummary[];
  page: number;
  pageSize: number;
  total: number;
  programId?: string;
};

export function SurveysTable({ data, page, pageSize, total, programId }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const baseUrl = programId ? `/surveys/list?program_id=${programId}&` : "/surveys/list?";

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
                  No surveys found
                </td>
              </tr>
            ) : (
              data.map((survey) => (
                <tr
                  key={survey.id}
                  onClick={() =>
                    (window.location.href = `/surveys/${survey.id}`)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{survey.name}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${survey.status}`}>
                      {survey.status}
                    </span>
                  </td>
                  <td>{survey.description || "-"}</td>
                  <td>{new Date(survey.created_at).toLocaleDateString()}</td>
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
              href={`${baseUrl}page=${Math.max(1, page - 1)}`}
              className={`pagination-btn ${page <= 1 ? "disabled" : ""}`}
            >
              Previous
            </Link>
            <span className="pagination-page">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`${baseUrl}page=${Math.min(totalPages, page + 1)}`}
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
