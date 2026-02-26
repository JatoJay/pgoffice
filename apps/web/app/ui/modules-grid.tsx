import Link from "next/link";

const modules = [
  {
    title: "Experience Builder",
    description: "Design journeys, phases, and module activations.",
    meta: "4 active journeys",
    href: "/programs",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    color: "accent"
  },
  {
    title: "Projects & Tasks",
    description: "Track milestones and execution commitments.",
    meta: "86 tasks in motion",
    href: "/projects",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    color: "success"
  },
  {
    title: "Events",
    description: "Coordinate sessions, attendance, and feedback.",
    meta: "12 upcoming",
    href: "/events",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    color: "tertiary"
  },
  {
    title: "Budgeting",
    description: "Align spend with outcomes and ROI.",
    meta: "$480k tracked",
    href: "/budgets",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/>
      </svg>
    ),
    color: "warning"
  },
  {
    title: "Network",
    description: "Manage relationships, profiles, and segmentation.",
    meta: "1,284 profiles",
    href: "/network",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>
        <path d="M12 8v4M8.5 16.5L12 12M15.5 16.5L12 12"/>
      </svg>
    ),
    color: "accent"
  },
  {
    title: "Connections",
    description: "Match mentors, peers, and partners.",
    meta: "62 matches",
    href: "/connections",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    color: "secondary"
  },
  {
    title: "Pipeline",
    description: "Track opportunities and commitments.",
    meta: "$1.8M pipeline",
    href: "/pipelines",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    color: "success"
  },
  {
    title: "Surveys",
    description: "Capture sentiment and qualitative metrics.",
    meta: "3 active surveys",
    href: "/surveys",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    ),
    color: "tertiary"
  },
  {
    title: "KPIs & Impact",
    description: "Configure and monitor success metrics.",
    meta: "18 KPIs",
    href: "/kpis",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>
      </svg>
    ),
    color: "accent"
  }
];

const colorMap: Record<string, string> = {
  accent: "rgba(99, 102, 241, 0.15)",
  secondary: "rgba(139, 92, 246, 0.15)",
  tertiary: "rgba(6, 182, 212, 0.15)",
  success: "rgba(34, 197, 94, 0.15)",
  warning: "rgba(245, 158, 11, 0.15)"
};

const iconColorMap: Record<string, string> = {
  accent: "#818cf8",
  secondary: "#a78bfa",
  tertiary: "#22d3ee",
  success: "#4ade80",
  warning: "#fbbf24"
};

export const ModulesGrid = () => {
  return (
    <section className="modules">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Modules</p>
          <h2>Everything a movement needs to grow.</h2>
        </div>
        <button className="action ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Customize modules
        </button>
      </div>
      <div className="modules-grid">
        {modules.map((module, index) => (
          <Link
            key={module.title}
            href={module.href}
            className="module-card"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className="module-icon"
              style={{
                background: colorMap[module.color],
                color: iconColorMap[module.color]
              }}
            >
              {module.icon}
            </div>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
            <span>{module.meta}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};
