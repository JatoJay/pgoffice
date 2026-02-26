import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { api } from "../lib/api";
import { getKpis } from "../lib/queries";
import { resolveActiveTenantId } from "../lib/tenant";
import { KpiDashboard } from "../ui/kpi-dashboard";

export default async function KpisPage() {
  const { data, error } = await getKpis();

  async function createKpi(formData: FormData) {
    "use server";
    const tenantId = await resolveActiveTenantId();

    const name = String(formData.get("name") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();
    const formula = String(formData.get("formula") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      throw new Error("KPI name is required");
    }

    const { error } = await api.post<{ item: unknown }>("/api/v1/kpis", {
      tenant_id: tenantId,
      name,
      unit: unit || undefined,
      formula: formula || undefined,
      description: description || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath("/kpis");
  }

  const kpis = (data?.items ?? []) as Array<{
    id?: string;
    name?: string;
    unit?: string;
    formula?: string;
    description?: string;
  }>;

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">KPIs</p>
            <h1>Impact Metrics</h1>
            <p className="lede">Design, monitor, and visualize the metrics that matter.</p>
          </div>
          <a className="action primary" href="#create-kpi">
            New KPI
          </a>
        </div>

        {error && <div className="settings-alert">{error}</div>}

        <KpiDashboard kpis={kpis} />

        <section className="detail-card" id="create-kpi">
          <h3>Define New KPI</h3>
          <form action={createKpi} className="form">
            <div className="form-grid">
              <label>
                KPI name
                <input name="name" placeholder="Engagement rate" required />
              </label>
              <label>
                Unit
                <input name="unit" placeholder="%" />
              </label>
              <label>
                Formula
                <input name="formula" placeholder="active_participants / total" />
              </label>
              <label>
                Description
                <textarea name="description" rows={3} placeholder="Optional summary" />
              </label>
            </div>
            <button className="action primary" type="submit">
              Create KPI
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
