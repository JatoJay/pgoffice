import Link from "next/link";
import { Header } from "../../ui/header";
import { api } from "../../lib/api";

type Budget = {
  id: string;
  name: string;
  status?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  created_at: string;
};

async function getBudget(id: string) {
  return api.get<{ item: Budget }>(`/api/v1/budgets/${id}`);
}

interface BudgetPageProps {
  params: Promise<{ id: string }>;
}

export default async function BudgetDetailPage({ params }: BudgetPageProps) {
  const { id } = await params;
  const { data, error } = await getBudget(id);
  const budget = data?.item;

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Budget</p>
            <h1>{budget?.name ?? "Budget detail"}</h1>
            <p className="lede">View budget allocation and spending.</p>
          </div>
          <Link href="/budgets" className="action secondary">
            Back to Budgets
          </Link>
        </div>

        {error ? <div className="empty">{error}</div> : null}

        {budget && (
          <section className="detail-grid">
            <div className="detail-card">
              <h3>Budget Information</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.5rem" }}>
                <dt><strong>Status</strong></dt>
                <dd><span className={`status-badge ${budget.status}`}>{budget.status ?? "draft"}</span></dd>
                <dt><strong>Total Amount</strong></dt>
                <dd>{budget.total_amount != null ? `${budget.currency ?? "$"}${budget.total_amount.toLocaleString()}` : "Not set"}</dd>
                <dt><strong>Currency</strong></dt>
                <dd>{budget.currency || "USD"}</dd>
                <dt><strong>Created</strong></dt>
                <dd>{new Date(budget.created_at).toLocaleDateString()}</dd>
              </dl>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
