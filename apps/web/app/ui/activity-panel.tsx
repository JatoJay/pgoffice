const activities = [
  {
    title: "Rhythms of Return Summit",
    meta: "Event feedback",
    badge: "94% positive",
    time: "2 hours ago",
    type: "success"
  },
  {
    title: "Mentor match confirmations",
    meta: "Connections",
    badge: "8 approvals",
    time: "Yesterday",
    type: "info"
  },
  {
    title: "Budget reconciliation",
    meta: "Budgeting",
    badge: "Q1 update",
    time: "2 days ago",
    type: "warning"
  }
];

const signals = [
  { label: "Engagement", value: "High", trend: "up" },
  { label: "Retention", value: "Stable", trend: "neutral" },
  { label: "Momentum", value: "Rising", trend: "up" }
];

const trendIcons: Record<string, JSX.Element> = {
  up: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 15l-6-6-6 6"/>
    </svg>
  ),
  down: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  neutral: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14"/>
    </svg>
  )
};

const typeColors: Record<string, { bg: string; color: string }> = {
  success: { bg: "rgba(34, 197, 94, 0.15)", color: "#4ade80" },
  info: { bg: "rgba(99, 102, 241, 0.15)", color: "#818cf8" },
  warning: { bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }
};

export const ActivityPanel = () => {
  return (
    <section className="activity">
      <div className="activity-card pulse-card">
        <div className="activity-card-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <h3>Program Pulse</h3>
        </div>
        <div className="pulse-grid">
          {signals.map((signal) => (
            <div key={signal.label} className={`pulse-item pulse-${signal.trend}`}>
              <span>{signal.label}</span>
              <div className="pulse-value">
                <strong>{signal.value}</strong>
                <span className="pulse-trend">{trendIcons[signal.trend]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="activity-card">
        <div className="activity-card-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <h3>Recent Activity</h3>
        </div>
        <ul>
          {activities.map((item) => (
            <li key={item.title} className="activity-item">
              <div className="activity-content">
                <strong>{item.title}</strong>
                <div className="activity-meta">
                  <span className="activity-category">{item.meta}</span>
                  <span
                    className="activity-badge"
                    style={{
                      background: typeColors[item.type].bg,
                      color: typeColors[item.type].color
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
              </div>
              <em className="activity-time">{item.time}</em>
            </li>
          ))}
        </ul>
        <button className="activity-view-all">
          View all activity
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </section>
  );
};
