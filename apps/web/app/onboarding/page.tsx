import { Header } from "../ui/header";
import { createOnboarding } from "./actions";

export default function OnboardingPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Onboarding</p>
            <h1>Launch a new instance</h1>
            <p className="lede">Set up a branded space for your next program.</p>
          </div>
        </div>

        <form className="form" action={createOnboarding}>
          <div className="form-grid">
            <label>
              Organization name
              <input name="organization_name" required placeholder="PG MONITOR Foundation" />
            </label>
            <label>
              Instance name
              <input name="instance_name" required placeholder="Anthem Tracker" />
            </label>
            <label>
              Program name
              <input name="program_name" placeholder="Rhythms of Return" />
            </label>
            <label>
              Admin email
              <input name="admin_email" type="email" placeholder="admin@pgmonitor.com" />
            </label>
          </div>
          <div>
            <button className="action primary" type="submit">
              Create instance
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
