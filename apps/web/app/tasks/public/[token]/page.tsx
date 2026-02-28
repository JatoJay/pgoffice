"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type Comment = {
  id: string;
  author_email: string;
  author_name: string | null;
  content: string;
  created_at: string;
};

type Task = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: number;
  due_at: string | null;
  estimated_cost: number | null;
};

type TaskData = {
  task: Task;
  comments: Comment[];
};

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", color: "#6b7280" },
  { value: "in_progress", label: "In Progress", color: "#f59e0b" },
  { value: "blocked", label: "Blocked", color: "#ef4444" },
  { value: "done", label: "Done", color: "#10b981" }
];

export default function PublicTaskPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [newComment, setNewComment] = useState("");
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/tasks/public/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Task not found or link has expired");
          }
          throw new Error("Failed to load task");
        }
        const data = await response.json();
        setTaskData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [token, apiUrl]);

  const handleStatusChange = async (newStatus: string) => {
    if (!taskData) return;
    setUpdating(true);
    setSuccess(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/tasks/public/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      setTaskData((prev) => prev ? { ...prev, task: data.task } : null);
      setSuccess("Status updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskData) return;

    setUpdating(true);
    setSuccess(null);

    try {
      const response = await fetch(`${apiUrl}/api/v1/tasks/public/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment })
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const refreshResponse = await fetch(`${apiUrl}/api/v1/tasks/public/${token}`);
      const refreshData = await refreshResponse.json();
      setTaskData(refreshData);
      setNewComment("");
      setSuccess("Comment added successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || "#6b7280";
  };

  if (loading) {
    return (
      <div className="public-task-container">
        <div className="loading-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p>Loading task...</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (error && !taskData) {
    return (
      <div className="public-task-container">
        <div className="error-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h2>Unable to Load Task</h2>
          <p>{error}</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  if (!taskData) return null;

  const { task, comments } = taskData;

  return (
    <div className="public-task-container">
      <header className="public-header">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>pgarcotoffice</span>
        </div>
      </header>

      <main className="public-main">
        {success && (
          <div className="success-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </div>
        )}

        {error && taskData && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="task-card">
          <div className="task-header">
            <h1>{task.name}</h1>
            <span className="status-pill" style={{ backgroundColor: getStatusColor(task.status) }}>
              {STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}
            </span>
          </div>

          {task.description && <p className="task-description">{task.description}</p>}

          <div className="task-meta">
            {task.due_at && (
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Due: {new Date(task.due_at).toLocaleDateString()}</span>
              </div>
            )}
            {task.estimated_cost && (
              <div className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Budget: ${task.estimated_cost.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="status-section">
            <h3>Update Status</h3>
            <div className="status-buttons">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`status-btn ${task.status === option.value ? "active" : ""}`}
                  style={{
                    borderColor: option.color,
                    backgroundColor: task.status === option.value ? option.color : "transparent",
                    color: task.status === option.value ? "white" : option.color
                  }}
                  onClick={() => handleStatusChange(option.value)}
                  disabled={updating || task.status === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="comments-section">
          <h2>Comments ({comments.length})</h2>

          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment or update..."
              rows={3}
            />
            <button type="submit" disabled={!newComment.trim() || updating}>
              {updating ? "Posting..." : "Post Comment"}
            </button>
          </form>

          {comments.length === 0 ? (
            <p className="no-comments">No comments yet. Be the first to add one!</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <strong>{comment.author_name || comment.author_email}</strong>
                    <span>{formatDate(comment.created_at)}</span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .public-task-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4ff 0%, #e5e7eb 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .public-header {
    background: #1a1a2e;
    padding: 1rem 2rem;
    color: white;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    font-size: 1.125rem;
  }

  .public-main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    gap: 1rem;
  }

  .error-state h2 {
    color: #dc2626;
    margin: 0;
  }

  .success-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #dcfce7;
    color: #166534;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .error-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fee2e2;
    color: #dc2626;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .error-banner button {
    background: transparent;
    border: none;
    color: #dc2626;
    cursor: pointer;
    text-decoration: underline;
  }

  .task-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .task-header h1 {
    margin: 0;
    font-size: 1.5rem;
    color: #1a1a2e;
  }

  .status-pill {
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .task-description {
    color: #4b5563;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .task-meta {
    display: flex;
    gap: 1.5rem;
    padding: 1rem 0;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 1.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }

  .status-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #374151;
  }

  .status-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .status-btn {
    padding: 0.625rem 1.25rem;
    border: 2px solid;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .status-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .status-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .comments-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .comments-section h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: #1a1a2e;
  }

  .comment-form {
    margin-bottom: 2rem;
  }

  .comment-form textarea {
    width: 100%;
    padding: 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    resize: vertical;
    font-family: inherit;
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .comment-form textarea:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .comment-form button {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .comment-form button:hover:not(:disabled) {
    background: #4338ca;
  }

  .comment-form button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .no-comments {
    text-align: center;
    color: #6b7280;
    padding: 2rem;
  }

  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .comment-item {
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
  }

  .comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .comment-header strong {
    color: #1a1a2e;
  }

  .comment-header span {
    color: #9ca3af;
  }

  .comment-item p {
    margin: 0;
    color: #4b5563;
    line-height: 1.5;
  }

  @media (max-width: 640px) {
    .public-main {
      padding: 1rem;
    }

    .task-card, .comments-section {
      padding: 1.5rem;
    }

    .task-header {
      flex-direction: column;
    }

    .task-meta {
      flex-direction: column;
      gap: 0.75rem;
    }

    .status-buttons {
      flex-direction: column;
    }

    .status-btn {
      width: 100%;
    }
  }
`;
