import { Header } from "../../ui/header";

export default function NewProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Header />
      {children}
    </div>
  );
}
