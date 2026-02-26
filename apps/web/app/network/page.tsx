import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { api } from "../lib/api";
import { getProfiles } from "../lib/queries";
import { resolveActiveTenantId } from "../lib/tenant";

export default async function NetworkPage() {
  const { data, error } = await getProfiles();

  async function createProfile(formData: FormData) {
    "use server";
    const tenantId = await resolveActiveTenantId();

    const type = String(formData.get("type") ?? "participant").trim() || "participant";
    const displayName = String(formData.get("display_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const organization = String(formData.get("organization") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();

    if (!displayName) {
      throw new Error("Display name is required");
    }

    const { error } = await api.post<{ item: unknown }>("/api/v1/profiles", {
      tenant_id: tenantId,
      type,
      display_name: displayName,
      email: email || undefined,
      organization: organization || undefined,
      title: title || undefined
    });

    if (error) {
      throw new Error(error);
    }

    revalidatePath("/network");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Network</p>
            <h1>Audience & Relationships</h1>
            <p className="lede">Manage profiles, tags, and engagement logs.</p>
          </div>
          <a className="action primary" href="#create-profile">
            Add profile
          </a>
        </div>

        <section className="detail-card">
          <h3 id="create-profile">Add profile</h3>
          <form action={createProfile} className="form">
            <div className="form-grid">
              <label>
                Role
                <select name="type">
                  <option value="participant">Participant</option>
                  <option value="mentor">Mentor</option>
                  <option value="advisor">Advisor</option>
                  <option value="partner">Partner</option>
                  <option value="investor">Investor</option>
                  <option value="staff">Staff</option>
                  <option value="contributor">Contributor</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </label>
              <label>
                Display name
                <input name="display_name" placeholder="Ariana Brooks" required />
              </label>
              <label>
                Email
                <input name="email" type="email" placeholder="name@example.com" />
              </label>
              <label>
                Organization
                <input name="organization" placeholder="Company or collective" />
              </label>
              <label>
                Title
                <input name="title" placeholder="Role / Title" />
              </label>
            </div>
            <button className="action primary" type="submit">
              Create profile
            </button>
          </form>
        </section>

        {error ? <div className="empty">{error}</div> : null}
        {!error && (!data?.items || data.items.length === 0) ? (
          <div className="empty">No profiles yet. Import your first cohort.</div>
        ) : null}

        <div className="list-grid">
          {data?.items?.map((profile, index) => (
            <div key={index} className="list-card">
              <strong>{String(profile.display_name ?? profile.email ?? "Profile")}</strong>
              <span>{String(profile.type ?? "participant")}</span>
              <em>{String(profile.organization ?? "Independent")}</em>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
