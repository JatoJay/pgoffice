import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "../ui/header";
import { getInstances } from "../lib/queries";

export default async function InstancesPage() {
  const { data, error } = await getInstances();

  async function setActiveInstance(formData: FormData) {
    "use server";
    const instanceId = String(formData.get("instance_id") || formData.get("tenant_id") || "").trim();
    if (!instanceId) {
      throw new Error("Instance id is required");
    }
    const cookieStore = await cookies();
    cookieStore.set("pgm_tenant", instanceId, { path: "/", sameSite: "lax" });
    redirect("/programs");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Instances</p>
            <h1>Active Instance</h1>
            <p className="lede">Pick which tenant to manage and create new modules for.</p>
          </div>
          <a className="action primary sm" href="/onboarding">
            New instance
          </a>
        </div>

        {error ? <div className="empty">{error}</div> : null}

        {!error && (!data?.items || data.items.length === 0) ? (
          <div className="empty">No instances found. Use onboarding to create your first instance.</div>
        ) : null}

        <div className="list-grid">
          {data?.items?.map((instance) => (
            <form key={instance.id} action={setActiveInstance} className="list-card">
              <strong>{instance.name ?? "Instance"}</strong>
              <span>ID: {instance.id}</span>
              <em>Tier: {instance.subscription_tier ?? "starter"}</em>
              <input type="hidden" name="instance_id" value={instance.id} />
              <button className="action" type="submit">
                Set active
              </button>
            </form>
          ))}
        </div>

        <div className="detail-card">
          <h3>Set by ID</h3>
          <p className="lede">If you already know the instance UUID, paste it here.</p>
          <form action={setActiveInstance} className="form">
            <div className="form-grid">
              <label>
                Instance ID
                <input name="tenant_id" placeholder="UUID" />
              </label>
            </div>
            <button className="action primary" type="submit">
              Save instance
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
