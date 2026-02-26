"use client";

import Link from "next/link";
import type { EventSummary } from "../../lib/queries";

type Props = {
  data: EventSummary[];
  page: number;
  pageSize: number;
  total: number;
  programId?: string;
};

export function EventsTable({ data, page, pageSize, total, programId }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const baseUrl = programId ? `/events/list?program_id=${programId}&` : "/events/list?";

  return (
    <div className="data-table-container">
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Date</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  No events found
                </td>
              </tr>
            ) : (
              data.map((event) => (
                <tr
                  key={event.id}
                  onClick={() => (window.location.href = `/events/${event.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{event.name}</strong>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{event.type}</td>
                  <td>
                    <span className={`status-badge ${event.status}`}>
                      {event.status}
                    </span>
                  </td>
                  <td>
                    {event.start_at
                      ? new Date(event.start_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{event.location || "-"}</td>
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
