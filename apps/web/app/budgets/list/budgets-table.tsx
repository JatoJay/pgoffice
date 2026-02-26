"use client";

import Link from "next/link";
import type { BudgetSummary } from "../../lib/queries";

type Props = {
  data: BudgetSummary[];
  page: number;
  pageSize: number;
  total: number;
  programId?: string;
};

export function BudgetsTable({ data, page, pageSize, total, programId }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const baseUrl = programId ? `/budgets/list?program_id=${programId}&` : "/budgets/list?";

  const formatCurrency = (amount?: number | null) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="data-table-container">
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Total Amount</th>
              <th>Fiscal Year</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-row">
                  No budgets found
                </td>
              </tr>
            ) : (
              data.map((budget) => (
                <tr
                  key={budget.id}
                  onClick={() =>
                    (window.location.href = `/budgets/${budget.id}`)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{budget.name}</strong>
                  </td>
                  <td>
                    <span className={`status-badge ${budget.status}`}>
                      {budget.status}
                    </span>
                  </td>
                  <td>{formatCurrency(budget.total_amount)}</td>
                  <td>{budget.fiscal_year || "-"}</td>
                  <td>{new Date(budget.created_at).toLocaleDateString()}</td>
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
