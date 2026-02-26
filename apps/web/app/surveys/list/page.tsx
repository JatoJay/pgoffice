import Link from "next/link";
import { Header } from "../../ui/header";
import { getSurveys, getPrograms } from "../../lib/queries";
import { SurveysTable } from "./surveys-table";
import { ProgramFilter } from "../../ui/program-filter";

export default async function SurveysListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; program_id?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const programId = params.program_id;
  const pageSize = 10;

  const [{ data, error }, { data: programData }] = await Promise.all([
    getSurveys(programId),
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
            <p className="eyebrow">Surveys</p>
            <h1>{selectedProgram ? `${selectedProgram.name} Surveys` : "All Surveys"}</h1>
          </div>
          <div className="actions">
            <Link href="/surveys" className="action secondary">
              Back
            </Link>
            <Link href="/surveys#create-survey" className="action primary">
              New Survey
            </Link>
          </div>
        </div>

        <ProgramFilter
          programs={programs}
          selectedProgramId={programId}
          basePath="/surveys/list"
        />

        {error ? (
          <div className="empty">{error}</div>
        ) : (
          <SurveysTable
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
