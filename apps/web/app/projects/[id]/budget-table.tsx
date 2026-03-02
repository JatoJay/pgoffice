"use client";

import { useState } from "react";

type BudgetItem = {
  id: string;
  category: string;
  description: string | null;
  estimated_amount: number;
  actual_amount: number | null;
  order_index: number;
};

type BudgetTableProps = {
  budgetItems: BudgetItem[];
  currency: string;
  totalBudget: number;
  projectId: string;
  tenantId: string;
};

export function BudgetTable({ budgetItems: initialItems, currency, totalBudget, projectId, tenantId }: BudgetTableProps) {
  const [budgetItems, setBudgetItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BudgetItem>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    }).format(amount);
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingId(item.id);
    setEditForm({
      category: item.category,
      description: item.description || "",
      estimated_amount: item.estimated_amount,
      actual_amount: item.actual_amount
    });
  };

  const handleSave = async (itemId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/ai-projects/budget-items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        },
        body: JSON.stringify({
          category: editForm.category,
          description: editForm.description,
          estimated_amount: Number(editForm.estimated_amount),
          actual_amount: editForm.actual_amount ? Number(editForm.actual_amount) : null
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update: ${res.status}`);
      }

      setBudgetItems(budgetItems.map(item =>
        item.id === itemId ? {
          ...item,
          category: editForm.category || item.category,
          description: editForm.description || null,
          estimated_amount: Number(editForm.estimated_amount),
          actual_amount: editForm.actual_amount ? Number(editForm.actual_amount) : null
        } : item
      ));

      setSuccess("Budget item updated");
      setEditingId(null);
      setEditForm({});
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Delete this budget item?")) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/v1/ai-projects/budget-items/${itemId}`, {
        method: "DELETE",
        headers: {
          "x-tenant-id": tenantId,
          "x-super-admin": "true"
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to delete: ${res.status}`);
      }

      setBudgetItems(budgetItems.filter(item => item.id !== itemId));
      setSuccess("Budget item deleted");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: "0.5rem",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "4px",
    fontSize: "0.875rem",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#fff",
    width: "100%"
  };

  if (budgetItems.length === 0) {
    return (
      <section className="detail-card">
        <h3>Budget Breakdown</h3>
        <p style={{ color: "#9ca3af", marginTop: "1rem" }}>No budget items yet.</p>
      </section>
    );
  }

  const totalEstimated = budgetItems.reduce((sum, item) => sum + item.estimated_amount, 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

  return (
    <section className="detail-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Budget Breakdown</h3>
        <strong style={{ fontSize: "1.25rem", color: "#22c55e" }}>
          Total: {formatCurrency(totalBudget)}
        </strong>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
          {success}
        </div>
      )}

      <div className="table-container" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem" }}>Category</th>
              <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem" }}>Description</th>
              <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem" }}>Estimated</th>
              <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem" }}>Actual</th>
              <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem" }}>Variance</th>
              <th style={{ textAlign: "center", padding: "0.75rem 0.5rem", color: "#9ca3af", fontWeight: 600, fontSize: "0.875rem", width: "100px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.sort((a, b) => a.order_index - b.order_index).map((item) => {
              const variance = item.actual_amount ? item.estimated_amount - item.actual_amount : null;
              const varianceColor = variance === null ? "#9ca3af" : variance >= 0 ? "#22c55e" : "#ef4444";
              const isEditing = editingId === item.id;

              return (
                <tr key={item.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  {isEditing ? (
                    <>
                      <td style={{ padding: "0.5rem" }}>
                        <input
                          type="text"
                          value={editForm.category || ""}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <input
                          type="text"
                          value={editForm.description || ""}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <input
                          type="number"
                          value={editForm.estimated_amount || ""}
                          onChange={(e) => setEditForm({ ...editForm, estimated_amount: Number(e.target.value) })}
                          style={{ ...inputStyle, textAlign: "right" }}
                        />
                      </td>
                      <td style={{ padding: "0.5rem" }}>
                        <input
                          type="number"
                          value={editForm.actual_amount || ""}
                          onChange={(e) => setEditForm({ ...editForm, actual_amount: e.target.value ? Number(e.target.value) : null })}
                          placeholder="0"
                          style={{ ...inputStyle, textAlign: "right" }}
                        />
                      </td>
                      <td style={{ padding: "0.5rem", textAlign: "right", color: "#9ca3af" }}>-</td>
                      <td style={{ padding: "0.5rem", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                          <button
                            onClick={() => handleSave(item.id)}
                            disabled={loading}
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "#22c55e",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              cursor: loading ? "wait" : "pointer",
                              fontSize: "0.75rem"
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditForm({}); }}
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "rgba(255, 255, 255, 0.1)",
                              color: "#9ca3af",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.75rem"
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "0.875rem 0.5rem", fontWeight: 500, color: "#fff" }}>{item.category}</td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "#9ca3af" }}>{item.description || "-"}</td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", color: "#fff" }}>{formatCurrency(item.estimated_amount)}</td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", color: "#fff" }}>
                        {item.actual_amount ? formatCurrency(item.actual_amount) : "-"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", color: varianceColor }}>
                        {variance !== null ? (variance >= 0 ? "+" : "") + formatCurrency(variance) : "-"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                          <button
                            onClick={() => handleEdit(item)}
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "transparent",
                              color: "#9ca3af",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.75rem"
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              padding: "0.25rem 0.5rem",
                              background: "transparent",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.75rem"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", fontWeight: 600 }}>
              <td style={{ padding: "0.875rem 0.5rem", color: "#fff" }} colSpan={2}>Total</td>
              <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", color: "#22c55e" }}>{formatCurrency(totalEstimated)}</td>
              <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", color: "#fff" }}>
                {totalActual > 0 ? formatCurrency(totalActual) : "-"}
              </td>
              <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", color: totalActual > 0 ? (totalEstimated - totalActual >= 0 ? "#22c55e" : "#ef4444") : "#9ca3af" }}>
                {totalActual > 0 ? (totalEstimated - totalActual >= 0 ? "+" : "") + formatCurrency(totalEstimated - totalActual) : "-"}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
