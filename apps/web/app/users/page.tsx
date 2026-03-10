import { Header } from "../ui/header";
import { UsersContent } from "./users-content";

export default function UsersPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <UsersContent />
      </main>
    </div>
  );
}
