"use client";

import { KpiLineChart, KpiAreaChart, KpiBarChart, KpiPieChart, MultiLineChart } from "./charts";

const engagementData = [
  { name: "Jan", value: 65 },
  { name: "Feb", value: 72 },
  { name: "Mar", value: 68 },
  { name: "Apr", value: 78 },
  { name: "May", value: 82 },
  { name: "Jun", value: 88 },
];

const participantGrowth = [
  { name: "Jan", value: 120 },
  { name: "Feb", value: 145 },
  { name: "Mar", value: 178 },
  { name: "Apr", value: 210 },
  { name: "May", value: 256 },
  { name: "Jun", value: 312 },
];

const outcomesByProgram = [
  { name: "Mentorship", value: 35 },
  { name: "Training", value: 28 },
  { name: "Networking", value: 22 },
  { name: "Grants", value: 15 },
];

const monthlyMetrics = [
  { name: "Jan", events: 12, participants: 145, outcomes: 23 },
  { name: "Feb", events: 15, participants: 167, outcomes: 31 },
  { name: "Mar", events: 18, participants: 189, outcomes: 42 },
  { name: "Apr", events: 22, participants: 234, outcomes: 48 },
  { name: "May", events: 25, participants: 278, outcomes: 56 },
  { name: "Jun", events: 28, participants: 312, outcomes: 67 },
];

const budgetAllocation = [
  { name: "Q1", planned: 25000, actual: 23500 },
  { name: "Q2", planned: 30000, actual: 28900 },
  { name: "Q3", planned: 35000, actual: 32100 },
  { name: "Q4", planned: 40000, actual: 0 },
];

type KpiSummary = {
  id?: string;
  name?: string;
  unit?: string;
  formula?: string;
  description?: string;
};

type KpiDashboardProps = {
  kpis: KpiSummary[];
};

export function KpiDashboard({ kpis }: KpiDashboardProps) {
  return (
    <div className="kpi-dashboard">
      <div className="kpi-summary-row">
        <div className="kpi-summary-card">
          <div className="kpi-summary-header">
            <span className="kpi-summary-label">Total Participants</span>
            <span className="kpi-trend up">+22%</span>
          </div>
          <strong className="kpi-summary-value">312</strong>
          <span className="kpi-summary-period">Last 6 months</span>
        </div>
        <div className="kpi-summary-card">
          <div className="kpi-summary-header">
            <span className="kpi-summary-label">Engagement Rate</span>
            <span className="kpi-trend up">+8%</span>
          </div>
          <strong className="kpi-summary-value">88%</strong>
          <span className="kpi-summary-period">Current month</span>
        </div>
        <div className="kpi-summary-card">
          <div className="kpi-summary-header">
            <span className="kpi-summary-label">Total Outcomes</span>
            <span className="kpi-trend up">+15%</span>
          </div>
          <strong className="kpi-summary-value">267</strong>
          <span className="kpi-summary-period">Year to date</span>
        </div>
        <div className="kpi-summary-card">
          <div className="kpi-summary-header">
            <span className="kpi-summary-label">Budget Utilization</span>
            <span className="kpi-trend neutral">On track</span>
          </div>
          <strong className="kpi-summary-value">94%</strong>
          <span className="kpi-summary-period">vs. planned</span>
        </div>
      </div>

      <div className="kpi-charts-grid">
        <div className="kpi-chart-card">
          <div className="kpi-chart-header">
            <h3>Engagement Trend</h3>
            <span className="kpi-chart-subtitle">Monthly engagement rate (%)</span>
          </div>
          <KpiAreaChart data={engagementData} height={220} />
        </div>

        <div className="kpi-chart-card">
          <div className="kpi-chart-header">
            <h3>Participant Growth</h3>
            <span className="kpi-chart-subtitle">Cumulative participants</span>
          </div>
          <KpiLineChart data={participantGrowth} height={220} />
        </div>

        <div className="kpi-chart-card">
          <div className="kpi-chart-header">
            <h3>Outcomes by Program</h3>
            <span className="kpi-chart-subtitle">Distribution of outcomes</span>
          </div>
          <KpiPieChart data={outcomesByProgram} height={220} />
        </div>

        <div className="kpi-chart-card">
          <div className="kpi-chart-header">
            <h3>Monthly Activity</h3>
            <span className="kpi-chart-subtitle">Events held per month</span>
          </div>
          <KpiBarChart data={monthlyMetrics} dataKey="events" height={220} />
        </div>
      </div>

      <div className="kpi-chart-card kpi-chart-wide">
        <div className="kpi-chart-header">
          <h3>Program Metrics Overview</h3>
          <span className="kpi-chart-subtitle">Events, participants, and outcomes over time</span>
        </div>
        <MultiLineChart
          data={monthlyMetrics}
          lines={[
            { key: "events", color: "#10b981", name: "Events" },
            { key: "participants", color: "#14b8a6", name: "Participants" },
            { key: "outcomes", color: "#22c55e", name: "Outcomes" },
          ]}
          height={280}
        />
      </div>

      <div className="kpi-chart-card kpi-chart-wide">
        <div className="kpi-chart-header">
          <h3>Budget: Planned vs Actual</h3>
          <span className="kpi-chart-subtitle">Quarterly budget comparison ($)</span>
        </div>
        <MultiLineChart
          data={budgetAllocation}
          lines={[
            { key: "planned", color: "#8b9e8b", name: "Planned" },
            { key: "actual", color: "#10b981", name: "Actual" },
          ]}
          height={250}
        />
      </div>

      {kpis.length > 0 && (
        <div className="kpi-definitions">
          <h3>Defined KPIs</h3>
          <div className="kpi-definitions-grid">
            {kpis.map((kpi, index) => (
              <div key={index} className="kpi-definition-card">
                <div className="kpi-definition-header">
                  <strong>{String(kpi.name ?? "KPI")}</strong>
                  {kpi.unit && <span className="kpi-unit">{kpi.unit}</span>}
                </div>
                {kpi.formula && <code className="kpi-formula">{kpi.formula}</code>}
                {kpi.description && <p className="kpi-description">{kpi.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
