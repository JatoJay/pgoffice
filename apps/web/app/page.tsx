import { Header } from "./ui/header";
import { Overview } from "./ui/overview";
import { ModulesGrid } from "./ui/modules-grid";
import { ActivityPanel } from "./ui/activity-panel";

export default function Home() {
  return (
    <div className="app-shell">
      <Header />
      <main className="dashboard">
        <Overview />
        <ModulesGrid />
        <ActivityPanel />
      </main>
    </div>
  );
}
