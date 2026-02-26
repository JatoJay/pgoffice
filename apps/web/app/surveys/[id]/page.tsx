import Link from "next/link";
import { Header } from "../../ui/header";
import { api } from "../../lib/api";

type Survey = {
  id: string;
  name: string;
  status?: string | null;
  description?: string | null;
  created_at: string;
};

async function getSurvey(id: string) {
  return api.get<{ item: Survey }>(`/api/v1/surveys/${id}`);
}

interface SurveyPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: SurveyPageProps) {
  const { id } = await params;
  const { data, error } = await getSurvey(id);
  const survey = data?.item;

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Survey</p>
            <h1>{survey?.name ?? "Survey detail"}</h1>
            <p className="lede">View survey details and responses.</p>
          </div>
          <Link href="/surveys" className="action secondary">
            Back to Surveys
          </Link>
        </div>

        {error ? <div className="empty">{error}</div> : null}

        {survey && (
          <section className="detail-grid">
            <div className="detail-card">
              <h3>Survey Information</h3>
              <dl style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.5rem" }}>
                <dt><strong>Status</strong></dt>
                <dd><span className={`status-badge ${survey.status}`}>{survey.status ?? "draft"}</span></dd>
                <dt><strong>Description</strong></dt>
                <dd>{survey.description || "No description"}</dd>
                <dt><strong>Created</strong></dt>
                <dd>{new Date(survey.created_at).toLocaleDateString()}</dd>
              </dl>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
