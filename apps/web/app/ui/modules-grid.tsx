const features = [
  {
    title: "AI Project Generation",
    description: "Create complete projects with tasks and budgets using AI.",
    meta: "Powered by Gemini",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    color: "accent"
  },
  {
    title: "Project Management",
    description: "Track milestones, tasks, and execution commitments.",
    meta: "Full lifecycle tracking",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    color: "success"
  },
  {
    title: "Document Generation",
    description: "AI-generated project documents with OnlyOffice editing.",
    meta: "Word, Excel, PowerPoint",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    ),
    color: "tertiary"
  },
  {
    title: "Budget Tracking",
    description: "Manage project budgets and track expenses.",
    meta: "Real-time insights",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/>
      </svg>
    ),
    color: "warning"
  },
  {
    title: "Task Management",
    description: "Create, assign, and track tasks within projects.",
    meta: "Drag-and-drop ordering",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    color: "secondary"
  },
  {
    title: "Multi-Instance",
    description: "Manage multiple organizations from one account.",
    meta: "Team collaboration",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
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
          <p className="eyebrow">Features</p>
          <h2>Everything you need to manage projects.</h2>
        </div>
        <Link href="/projects/new" className="action primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New AI Project
        </Link>
      </div>
      <div className="modules-grid">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="module-card"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className="module-icon"
              style={{
                background: colorMap[feature.color],
                color: iconColorMap[feature.color]
              }}
            >
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <span>{feature.meta}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
