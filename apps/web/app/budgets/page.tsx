import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { api } from "../lib/api";
import { getBudgets, getPrograms } from "../lib/queries";
import { resolveActiveTenantId } from "../lib/tenant";

export default async function BudgetsPage() {
  const [{ data, error }, { data: programData }] = await Promise.all([getBudgets(), getPrograms()]);
  const programs = programData?.items ?? [];

  async function createBudget(formData: FormData) {
    "use server";
    const tenantId = await resolveActiveTenantId();

    const name = String(formData.get("name") ?? "").trim();
    const programId = String(formData.get("program_id") ?? "").trim();
    const currency = String(formData.get("currency") ?? "USD").trim() || "USD";
    const amountRaw = String(formData.get("total_amount") ?? "").trim();
    const totalAmount = amountRaw ? Number(amountRaw) : undefined;

    if (!name) {
      throw new Error("Budget name is required");
    }

    const { error } = await api.post<{ item: unknown }>("/api/v1/budgets", {
      tenant_id: tenantId,
      name,
      program_id: programId || undefined,
      total_amount: Number.isFinite(totalAmount) ? totalAmount : undefined,
      currency
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath("/budgets");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Budgeting</p>
            <h1>Program Budgets</h1>
            <p className="lede">Track planned vs. actual spend.</p>
          </div>
          <a className="action primary" href="#create-budget">
            New budget
          </a>
        </div>

        <section className="detail-card">
          <h3 id="create-budget">New budget</h3>
          <form action={createBudget} className="form">
            <div className="form-grid">
              <label>
                Budget name
                <input name="name" placeholder="2026 Program Budget" required />
              </label>
              <label>
                Program
                <select name="program_id">
                  <option value="">Unassigned</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Total amount
                <input type="number" name="total_amount" min="0" step="0.01" />
              </label>
              <label>
                Currency
                <input name="currency" defaultValue="USD" />
              </label>
            </div>
            <button className="action primary" type="submit">
              Create budget
            </button>
          </form>
        </section>

        {error ? <div className="empty">{error}</div> : null}
        {!error && (!data?.items || data.items.length === 0) ? (
          <div className="empty">No budgets yet. Create the first budget allocation.</div>
        ) : null}

        {data?.items && data.items.length > 0 && (
          <section className="detail-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Recent Budgets</h3>
              <Link href="/budgets/list" className="action secondary">
                View all ({data.items.length})
              </Link>
            </div>
            <div className="list-grid">
              {data.items.slice(0, 3).map((budget, index) => (
                <Link key={budget.id ?? index} href={`/budgets/${budget.id}`} className="list-card">
                  <strong>{budget.name ?? "Budget"}</strong>
                  <span className={`status-badge ${budget.status}`}>{budget.status ?? "draft"}</span>
                  <em>{budget.total_amount != null ? `$${budget.total_amount.toLocaleString()}` : "No amount set"}</em>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
