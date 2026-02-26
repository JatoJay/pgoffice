"use client";

import Link from "next/link";
import type { ProjectSummary } from "../../lib/queries";

type Props = {
  data: ProjectSummary[];
  page: number;
  pageSize: number;
  total: number;
  programId?: string;
};

export function ProjectsTable({ data, page, pageSize, total, programId }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const baseUrl = programId ? `/projects/list?program_id=${programId}&` : "/projects/list?";

  return (
    <div className="data-table-container">
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  No projects found
                </td>
              </tr>
            ) : (
              data.map((project) => (
                <tr
                  key={project.id}
                  onClick={() =>
                    (window.location.href = `/projects/${project.id}`)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{project.name}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${project.status}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>
                    {project.start_at
                      ? new Date(project.start_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {project.end_at
                      ? new Date(project.end_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{new Date(project.created_at).toLocaleDateString()}</td>
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
