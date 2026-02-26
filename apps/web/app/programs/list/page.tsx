import Link from "next/link";
import { Header } from "../../ui/header";
import { getPrograms } from "../../lib/queries";
import { ProgramsTable } from "./programs-table";

export default async function ProgramsListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 10;
  const { data, error } = await getPrograms();

  const items = data?.items ?? [];
  const total = items.length;
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Programs</p>
            <h1>All Programs</h1>
          </div>
          <div className="actions">
            <Link href="/programs" className="action secondary">
              Back
            </Link>
            <Link href="/programs#create-program" className="action primary">
              New Program
            </Link>
          </div>
        </div>

        {error ? (
          <div className="empty">{error}</div>
        ) : (
          <ProgramsTable
            data={paginatedItems}
            page={page}
            pageSize={pageSize}
            total={total}
          />
        )}
      </main>
    </div>
  );
}
