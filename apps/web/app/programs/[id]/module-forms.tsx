"use client";

import { useState } from "react";

type ModuleFormsProps = {
  programId: string;
  onSuccess: () => void;
};

export function CreateEventForm({ programId, onSuccess }: ModuleFormsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/v1/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: programId,
          name: formData.get("name"),
          type: formData.get("type") || "webinar",
          description: formData.get("description") || undefined,
          start_at: formData.get("start_at") || undefined,
          end_at: formData.get("end_at") || undefined,
          location: formData.get("location") || undefined
        })
      });
      if (res.ok) {
        setOpen(false);
        form.reset();
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="action primary sm" onClick={() => setOpen(true)}>
        Create Event
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Event</h3>
              <button type="button" className="modal-close" onClick={() => setOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-grid">
                <label>
                  Event name
                  <input name="name" placeholder="Founder Summit" required />
                </label>
                <label>
                  Type
                  <select name="type">
                    <option value="webinar">Webinar</option>
                    <option value="workshop">Workshop</option>
                    <option value="salon">Salon</option>
                    <option value="conference">Conference</option>
                    <option value="meetup">Meetup</option>
                  </select>
                </label>
                <label>
                  Start
                  <input type="datetime-local" name="start_at" />
                </label>
                <label>
                  End
                  <input type="datetime-local" name="end_at" />
                </label>
                <label>
                  Location
                  <input name="location" placeholder="Brooklyn, NY" />
                </label>
                <label>
                  Description
                  <textarea name="description" rows={2} placeholder="Optional details" />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="action ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="action primary" disabled={loading}>
                  {loading ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function CreateProjectForm({ programId, onSuccess }: ModuleFormsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: programId,
          name: formData.get("name"),
          description: formData.get("description") || undefined,
          start_at: formData.get("start_at") || undefined,
          end_at: formData.get("end_at") || undefined
        })
      });
      if (res.ok) {
        setOpen(false);
        form.reset();
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="action primary sm" onClick={() => setOpen(true)}>
        Create Project
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Project</h3>
              <button type="button" className="modal-close" onClick={() => setOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-grid">
                <label>
                  Project name
                  <input name="name" placeholder="Community Outreach" required />
                </label>
                <label>
                  Start date
                  <input type="date" name="start_at" />
                </label>
                <label>
                  End date
                  <input type="date" name="end_at" />
                </label>
                <label>
                  Description
                  <textarea name="description" rows={2} placeholder="Optional details" />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="action ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="action primary" disabled={loading}>
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function CreateBudgetForm({ programId, onSuccess }: ModuleFormsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const amountRaw = formData.get("total_amount") as string;
      const res = await fetch("/api/v1/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: programId,
          name: formData.get("name"),
          total_amount: amountRaw ? Number(amountRaw) : undefined,
          currency: formData.get("currency") || "USD"
        })
      });
      if (res.ok) {
        setOpen(false);
        form.reset();
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="action primary sm" onClick={() => setOpen(true)}>
        Create Budget
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Budget</h3>
              <button type="button" className="modal-close" onClick={() => setOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-grid">
                <label>
                  Budget name
                  <input name="name" placeholder="2026 Program Budget" required />
                </label>
                <label>
                  Total amount
                  <input type="number" name="total_amount" min="0" step="0.01" />
                </label>
                <label>
                  Currency
                  <input name="currency" defaultValue="USD" />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="action ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="action primary" disabled={loading}>
                  {loading ? "Creating..." : "Create Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function CreateSurveyForm({ programId, onSuccess }: ModuleFormsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/v1/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program_id: programId,
          name: formData.get("name"),
          description: formData.get("description") || undefined
        })
      });
      if (res.ok) {
        setOpen(false);
        form.reset();
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="action primary sm" onClick={() => setOpen(true)}>
        Create Survey
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Survey</h3>
              <button type="button" className="modal-close" onClick={() => setOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-grid">
                <label>
                  Survey name
                  <input name="name" placeholder="Pre-program feedback" required />
                </label>
                <label>
                  Description
                  <textarea name="description" rows={2} placeholder="Optional summary" />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="action ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="action primary" disabled={loading}>
                  {loading ? "Creating..." : "Create Survey"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
