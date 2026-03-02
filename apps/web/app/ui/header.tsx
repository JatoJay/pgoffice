import Link from "next/link";
import { cookies } from "next/headers";
import { getUser } from "@/app/lib/supabase/server";
import { signOutAction } from "@/app/login/actions";

const navItems = [
  { href: "/", label: "Dashboard", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )},
  { href: "/instances", label: "Instances", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>
    </svg>
  )},
  { href: "/projects", label: "AI Projects", icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  )}
];

export const Header = async () => {
  const cookieStore = await cookies();
  const activeTenant = cookieStore.get("pgm_tenant")?.value ?? process.env.NEXT_PUBLIC_TENANT_ID ?? "";
  const tenantLabel = activeTenant ? `${activeTenant.slice(0, 8)}…` : "Not set";

  const user = await getUser();
  const userEmail = user?.email ?? "";
  const userName = user?.user_metadata?.full_name ?? userEmail.split("@")[0] ?? "User";

  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark">PG</span>
        <div>
          <p className="brand-label">pgarcotoffice</p>
          <p className="brand-subtitle">Impact Management Platform</p>
        </div>
      </div>
      <nav className="nav">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="nav-link">
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="profile">
        <div className="profile-avatar">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="profile-status">
          <span className="profile-name">{userName}</span>
          <strong className="profile-tenant">{tenantLabel}</strong>
        </div>
        <div className="profile-actions">
          <Link className="action soft sm" href="/instances">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5"/>
            </svg>
            Switch
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="action ghost sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
