import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "../ui/header";
import { getInstances } from "../lib/queries";
import { createClient } from "@/app/lib/supabase/server";

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
    redirect("/projects");
  }

  async function createNewInstance(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (!name || !slug) {
      throw new Error("Name and slug are required");
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    let orgId: string;
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", `user-${user.id}`)
      .single();

    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: user.email?.split("@")[0] || "My Organization",
          slug: `user-${user.id}`
        })
        .select()
        .single();

      if (orgError) {
        throw new Error("Failed to create organization: " + orgError.message);
      }
      orgId = newOrg.id;
    }

    const { data: newInstance, error: instanceError } = await supabase
      .from("instances")
      .insert({
        organization_id: orgId,
        name,
        slug,
        status: "active",
        subscription_tier: "starter"
      })
      .select()
      .single();

    if (instanceError) {
      throw new Error(instanceError.message);
    }

    const cookieStore = await cookies();
    cookieStore.set("pgm_tenant", newInstance.id, { path: "/", sameSite: "lax" });
    redirect("/projects");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Instances</h1>
            <p className="lede">Manage your instances. Each instance has its own projects and data.</p>
          </div>
        </div>

        {error ? <div className="empty">{error}</div> : null}

        <div className="detail-card" style={{ marginBottom: "1.5rem" }}>
          <h3>Create New Instance</h3>
          <p className="lede">Create a new instance to organize a separate set of projects.</p>
          <form action={createNewInstance} className="form">
            <div className="form-grid">
              <label>
                Instance Name *
                <input name="name" placeholder="My New Project" required />
              </label>
              <label>
                Slug *
                <input name="slug" placeholder="my-new-project" required />
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  URL-friendly identifier (lowercase, no spaces)
                </span>
              </label>
            </div>
            <button className="action primary" type="submit" style={{ background: "#22c55e", borderColor: "#22c55e" }}>
              Create Instance
            </button>
          </form>
        </div>

        <div className="detail-card" style={{ marginBottom: "1.5rem" }}>
          <h3>Your Instances</h3>
          {!error && (!data?.items || data.items.length === 0) ? (
            <p style={{ color: "#6b7280" }}>No instances found. Create one above to get started.</p>
          ) : (
            <div className="list-grid">
              {data?.items?.map((instance) => (
                <div key={instance.id} className="list-card">
                  <strong>{instance.name ?? "Instance"}</strong>
                  <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>{instance.id}</span>
                  <em>Tier: {instance.subscription_tier ?? "starter"}</em>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <form action={setActiveInstance}>
                      <input type="hidden" name="instance_id" value={instance.id} />
                      <button className="action primary" type="submit">
                        Set active
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <button className="action" type="submit">
              Save instance
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
