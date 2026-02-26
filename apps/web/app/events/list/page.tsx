import Link from "next/link";
import { Header } from "../../ui/header";
import { getEvents, getPrograms } from "../../lib/queries";
import { EventsTable } from "./events-table";
import { ProgramFilter } from "../../ui/program-filter";

export default async function EventsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; program_id?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const programId = params.program_id;
  const pageSize = 10;

  const [{ data, error }, { data: programData }] = await Promise.all([
    getEvents(programId),
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
            <p className="eyebrow">Events</p>
            <h1>{selectedProgram ? `${selectedProgram.name} Events` : "All Events"}</h1>
          </div>
          <div className="actions">
            <Link href="/events" className="action secondary">
              Back
            </Link>
            <Link href="/events#create-event" className="action primary">
              New Event
            </Link>
          </div>
        </div>

        <ProgramFilter
          programs={programs}
          selectedProgramId={programId}
          basePath="/events/list"
        />

        {error ? (
          <div className="empty">{error}</div>
        ) : (
          <EventsTable
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
