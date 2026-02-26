"use client";

import { useState } from "react";
import Link from "next/link";

type Phase = {
  id: string;
  name: string;
  description?: string | null;
  start_at?: string | null;
  end_at?: string | null;
};

export function PhaseCard({
  phase,
  programId,
  updateAction,
  deleteAction
}: {
  phase: Phase;
  programId: string;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const [showEditForm, setShowEditForm] = useState(false);

  if (showEditForm) {
    return (
      <div className="list-card" style={{ padding: "0.75rem" }}>
        <form
          action={async (formData) => {
            await updateAction(formData);
            setShowEditForm(false);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <input type="hidden" name="phase_id" value={phase.id} />
          <input
            name="name"
            defaultValue={phase.name}
            placeholder="Phase name"
            style={{ padding: "0.4rem 0.5rem" }}
            required
          />
          <textarea
            name="description"
            defaultValue={phase.description ?? ""}
            placeholder="Description"
            rows={2}
            style={{ padding: "0.4rem 0.5rem" }}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="date"
              name="start_at"
              defaultValue={phase.start_at?.split("T")[0] ?? ""}
              style={{ flex: 1, padding: "0.4rem 0.5rem" }}
            />
            <input
              type="date"
              name="end_at"
              defaultValue={phase.end_at?.split("T")[0] ?? ""}
              style={{ flex: 1, padding: "0.4rem 0.5rem" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="action ghost"
              style={{ padding: "0.25rem 0.5rem" }}
              onClick={() => setShowEditForm(false)}
            >
              Cancel
            </button>
            <button type="submit" className="action primary" style={{ padding: "0.25rem 0.5rem" }}>
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="list-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
      <Link href={`/programs/${programId}/phases/${phase.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
        <strong>{phase.name}</strong>
        {phase.description && <p style={{ margin: "0.25rem 0", fontSize: "0.85rem", opacity: 0.8 }}>{phase.description}</p>}
        <em>
          {phase.start_at
            ? new Date(phase.start_at).toLocaleDateString("en-US")
            : "No start"}{" "}
          -{" "}
          {phase.end_at
            ? new Date(phase.end_at).toLocaleDateString("en-US")
            : "No end"}
        </em>
      </Link>
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <button
          type="button"
          className="action ghost"
          style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
          onClick={() => setShowEditForm(true)}
        >
          Edit
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="phase_id" value={phase.id} />
          <button
            type="submit"
            className="action ghost"
            style={{ padding: "0.25rem 0.5rem", color: "#ef4444", fontSize: "0.85rem" }}
            onClick={(e) => {
              if (!confirm("Delete this phase? This will also delete all tasks.")) {
                e.preventDefault();
              }
            }}
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
