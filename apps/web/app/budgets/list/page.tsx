import Link from "next/link";
import { Header } from "../../ui/header";
import { getBudgets, getPrograms } from "../../lib/queries";
import { BudgetsTable } from "./budgets-table";
import { ProgramFilter } from "../../ui/program-filter";

export default async function BudgetsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; program_id?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const programId = params.program_id;
  const pageSize = 10;

  const [{ data, error }, { data: programData }] = await Promise.all([
    getBudgets(programId),
    getPrograms()
  ]);

  const programs = programData?.items ?? [];
  const selectedProgram = programId ? programs.find(p => p.id === programId) : null;
  const items = data?.items ?? [];
  const total = items.length;
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Budgets</p>
            <h1>{selectedProgram ? `${selectedProgram.name} Budgets` : "All Budgets"}</h1>
          </div>
          <div className="actions">
            <Link href="/budgets" className="action secondary">
              Back
            </Link>
            <Link href="/budgets#create-budget" className="action primary">
              New Budget
            </Link>
          </div>
        </div>

        <ProgramFilter
          programs={programs}
          selectedProgramId={programId}
          basePath="/budgets/list"
        />

        {error ? (
          <div className="empty">{error}</div>
        ) : (
          <BudgetsTable
            data={paginatedItems}
            page={page}
            pageSize={pageSize}
            total={total}
            programId={programId}
          />
        )}
      </main>
    </div>
  );
}
