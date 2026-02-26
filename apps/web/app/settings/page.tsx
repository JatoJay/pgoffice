import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Header } from "../ui/header";
import { getInstanceBranding, updateInstanceBranding } from "../lib/queries";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("pgm_tenant")?.value;

  let branding = null;
  let brandingError = null;

  if (tenantId) {
    const result = await getInstanceBranding(tenantId);
    if (result.error) {
      brandingError = result.error;
    } else {
      branding = result.data?.item;
    }
  }

  async function saveBranding(formData: FormData) {
    "use server";
    const cookieStore = await cookies();
    const tenantId = cookieStore.get("pgm_tenant")?.value;

    if (!tenantId) {
      return;
    }

    const primary_color = formData.get("primary_color") as string;
    const secondary_color = formData.get("secondary_color") as string;
    const accent_color = formData.get("accent_color") as string;
    const domain = formData.get("custom_domain") as string;
    const logo_url = formData.get("logo_url") as string;

    await updateInstanceBranding(tenantId, {
      primary_color: primary_color || undefined,
      secondary_color: secondary_color || undefined,
      accent_color: accent_color || undefined,
      domain: domain || undefined,
      logo_url: logo_url || undefined,
    });

    revalidatePath("/settings");
    redirect("/settings");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Organization Settings</h1>
            <p className="lede">
              Customize your organization&apos;s branding, colors, and appearance.
            </p>
          </div>
        </div>

        {!tenantId && (
          <div className="settings-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Select an instance first to customize its settings. <a href="/instances" style={{color: "var(--accent-strong)"}}>Go to Instances</a></span>
          </div>
        )}

        {brandingError && (
          <div className="settings-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Could not load branding: {brandingError}. Make sure the API is running.</span>
          </div>
        )}

        <form action={saveBranding}>
          <div className="settings-grid">
            <section className="settings-section">
              <div className="settings-section-header">
                <div className="settings-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v10M1 12h6m6 0h10" />
                  </svg>
                </div>
                <div>
                  <h2>Brand Identity</h2>
                  <p>Set your organization name and logo</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-field">
                  <label htmlFor="logo_url">Logo URL</label>
                  <input
                    type="url"
                    id="logo_url"
                    name="logo_url"
                    placeholder="https://example.com/logo.png"
                    defaultValue={branding?.logo_url || ""}
                    className="settings-input"
                  />
                  <span className="field-hint">Direct URL to your logo image (PNG, JPG, SVG)</span>
                </div>

                <div className="settings-field">
                  <label htmlFor="custom_domain">Custom Domain</label>
                  <input
                    type="text"
                    id="custom_domain"
                    name="custom_domain"
                    placeholder="app.yourcompany.com"
                    defaultValue={branding?.domain || ""}
                    className="settings-input"
                  />
                  <span className="field-hint">Point your CNAME to our servers</span>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-section-header">
                <div className="settings-icon color-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3" />
                  </svg>
                </div>
                <div>
                  <h2>Color Theme</h2>
                  <p>Customize your brand colors</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="color-grid">
                  <div className="color-field">
                    <label htmlFor="primary_color">Primary Color</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        id="primary_color"
                        name="primary_color"
                        defaultValue={branding?.primary_color || "#10b981"}
                        className="color-picker"
                      />
                      <input
                        type="text"
                        defaultValue={branding?.primary_color || "#10b981"}
                        className="color-hex"
                        placeholder="#10b981"
                        readOnly
                      />
                    </div>
                    <span className="color-hint">Main brand color, buttons</span>
                  </div>

                  <div className="color-field">
                    <label htmlFor="secondary_color">Secondary Color</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        id="secondary_color"
                        name="secondary_color"
                        defaultValue={branding?.secondary_color || "#059669"}
                        className="color-picker"
                      />
                      <input
                        type="text"
                        defaultValue={branding?.secondary_color || "#059669"}
                        className="color-hex"
                        placeholder="#059669"
                        readOnly
                      />
                    </div>
                    <span className="color-hint">Hover states, accents</span>
                  </div>

                  <div className="color-field">
                    <label htmlFor="accent_color">Accent Color</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        id="accent_color"
                        name="accent_color"
                        defaultValue={branding?.accent_color || "#14b8a6"}
                        className="color-picker"
                      />
                      <input
                        type="text"
                        defaultValue={branding?.accent_color || "#14b8a6"}
                        className="color-hex"
                        placeholder="#14b8a6"
                        readOnly
                      />
                    </div>
                    <span className="color-hint">Highlights, badges</span>
                  </div>
                </div>

                <div className="color-preview">
                  <h4>Preview</h4>
                  <div className="preview-buttons">
                    <button type="button" className="action primary">Primary Button</button>
                    <button type="button" className="action soft">Secondary Button</button>
                    <button type="button" className="action ghost">Ghost Button</button>
                  </div>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-section-header">
                <div className="settings-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <div>
                  <h2>Layout & Appearance</h2>
                  <p>Configure dashboard layout preferences</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-field">
                  <label htmlFor="sidebar_style">Sidebar Style</label>
                  <select id="sidebar_style" name="sidebar_style" className="settings-select">
                    <option value="expanded">Expanded (with labels)</option>
                    <option value="compact">Compact (icons only)</option>
                    <option value="auto">Auto (responsive)</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label htmlFor="theme_mode">Theme Mode</label>
                  <select id="theme_mode" name="theme_mode" className="settings-select">
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System preference</option>
                  </select>
                </div>

                <div className="settings-toggle-group">
                  <div className="settings-toggle">
                    <label htmlFor="show_animations">Enable animations</label>
                    <input type="checkbox" id="show_animations" name="show_animations" defaultChecked />
                  </div>
                  <div className="settings-toggle">
                    <label htmlFor="compact_mode">Compact mode</label>
                    <input type="checkbox" id="compact_mode" name="compact_mode" />
                  </div>
                  <div className="settings-toggle">
                    <label htmlFor="show_hints">Show helpful hints</label>
                    <input type="checkbox" id="show_hints" name="show_hints" defaultChecked />
                  </div>
                </div>
              </div>
            </section>

            <section className="settings-section">
              <div className="settings-section-header">
                <div className="settings-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h2>White Label</h2>
                  <p>Custom domain and email settings</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-field">
                  <label htmlFor="email_from">Email From Address</label>
                  <input
                    type="email"
                    id="email_from"
                    name="email_from"
                    placeholder="notifications@yourcompany.com"
                    className="settings-input"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="email_name">Email From Name</label>
                  <input
                    type="text"
                    id="email_name"
                    name="email_name"
                    placeholder="Your Company"
                    className="settings-input"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="settings-actions">
            <a href="/settings" className="action ghost">Reset</a>
            <button type="submit" className="action primary" disabled={!tenantId}>Save all changes</button>
          </div>
        </form>
      </main>
    </div>
  );
}
