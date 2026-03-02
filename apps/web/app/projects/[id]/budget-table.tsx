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
  formatCurrency: (amount: number) => string;
  totalBudget: number;
};

export function BudgetTable({ budgetItems, formatCurrency, totalBudget }: BudgetTableProps) {
  if (budgetItems.length === 0) {
    return (
      <section className="detail-card">
        <h3>Budget Breakdown</h3>
        <p style={{ color: "#6b7280", marginTop: "1rem" }}>No budget items yet.</p>
      </section>
    );
  }

  const totalEstimated = budgetItems.reduce((sum, item) => sum + item.estimated_amount, 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

  return (
    <section className="detail-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Budget Breakdown</h3>
        <strong style={{ fontSize: "1.25rem", color: "#4f46e5" }}>
          Total: {formatCurrency(totalBudget)}
        </strong>
      </div>

      <div className="table-container" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 600 }}>Category</th>
              <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 600 }}>Description</th>
              <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 600 }}>Estimated</th>
              <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 600 }}>Actual</th>
              <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "#6b7280", fontWeight: 600 }}>Variance</th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.sort((a, b) => a.order_index - b.order_index).map((item) => {
              const variance = item.actual_amount ? item.estimated_amount - item.actual_amount : null;
              const varianceColor = variance === null ? "#6b7280" : variance >= 0 ? "#059669" : "#dc2626";

              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.75rem 0.5rem", fontWeight: 500 }}>{item.category}</td>
                  <td style={{ padding: "0.75rem 0.5rem", color: "#6b7280" }}>{item.description || "-"}</td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>{formatCurrency(item.estimated_amount)}</td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                    {item.actual_amount ? formatCurrency(item.actual_amount) : "-"}
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", color: varianceColor }}>
                    {variance !== null ? (variance >= 0 ? "+" : "") + formatCurrency(variance) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #e5e7eb", fontWeight: 600 }}>
              <td style={{ padding: "0.75rem 0.5rem" }} colSpan={2}>Total</td>
              <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>{formatCurrency(totalEstimated)}</td>
              <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                {totalActual > 0 ? formatCurrency(totalActual) : "-"}
              </td>
              <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", color: totalActual > 0 ? (totalEstimated - totalActual >= 0 ? "#059669" : "#dc2626") : "#6b7280" }}>
                {totalActual > 0 ? (totalEstimated - totalActual >= 0 ? "+" : "") + formatCurrency(totalEstimated - totalActual) : "-"}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
