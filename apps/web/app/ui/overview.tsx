import Link from "next/link";

const statRows = [
  {
    label: "Active Programs",
    value: "4",
    delta: "+2 this quarter",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    )
  },
  {
    label: "Participants",
    value: "1,284",
    delta: "+18% retention",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    label: "Total Events",
    value: "36",
    delta: "12 upcoming",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    )
  },
  {
    label: "Pipeline Value",
    value: "$1.8M",
    delta: "+22% MoM",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    )
  }
];

const alerts = [
  {
    title: "Survey response rate below target",
    description: "Growth cohort in Week 3 is at 54% completion.",
    type: "warning"
  },
  {
    title: "Mentor matches pending",
    description: "13 participants still need a mentor assignment.",
    type: "info"
  }
];

export const Overview = () => {
  return (
    <section className="overview">
      <div className="overview-content">
        <p className="eyebrow">Impact Overview</p>
        <h1>Orchestrate programs with measurable outcomes.</h1>
        <p className="lede">
          Track engagement, relationships, budgets, and outcomes across every
          program. pgarcotoffice keeps the narrative and the numbers aligned.
        </p>
        <div className="overview-actions">
          <Link className="action primary" href="/onboarding">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Launch a program
          </Link>
          <Link className="action ghost" href="/programs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            View all programs
          </Link>
        </div>
      </div>
      <div className="stat-grid">
        {statRows.map((row, index) => (
          <div key={row.label} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="stat-header">
              <span className="stat-icon">{row.icon}</span>
              <span>{row.label}</span>
            </div>
            <strong>{row.value}</strong>
            <small>{row.delta}</small>
          </div>
        ))}
        <div className="alert-card">
          <div className="alert-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h3>Needs attention</h3>
          </div>
          <ul>
            {alerts.map((alert) => (
              <li key={alert.title} className={`alert-item alert-${alert.type}`}>
                <strong>{alert.title}</strong>
                <span>{alert.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
