"use client";

import { useRouter } from "next/navigation";
import type { ProgramSummary } from "../lib/queries";

type ProgramFilterProps = {
  programs: ProgramSummary[];
  selectedProgramId?: string;
  basePath: string;
};

export function ProgramFilter({ programs, selectedProgramId, basePath }: ProgramFilterProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      router.push(`${basePath}?program_id=${value}`);
    } else {
      router.push(basePath);
    }
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>Filter by program:</span>
        <select
          value={selectedProgramId ?? ""}
          onChange={handleChange}
          style={{ minWidth: "200px" }}
        >
          <option value="">All programs</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
