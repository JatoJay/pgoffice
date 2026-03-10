"use client";

import { useState, useEffect } from "react";
import { Header } from "../ui/header";

type User = {
  id: string;
  email: string | null;
  name: string | null;
  status: string;
  phone: string | null;
  role_id: string;
  role_key: string;
  role_name: string;
  permissions: Record<string, string[]>;
  created_at: string;
};

type Role = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  permissions: Record<string, string[]>;
  is_system: boolean;
};

type Invitation = {
  id: string;
  email: string;
  role_id: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  async function fetchData() {
    try {
      setLoading(true);
      const tenantId = document.cookie.split("; ").find(c => c.startsWith("pgm_tenant="))?.split("=")[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (tenantId) headers["x-tenant-id"] = tenantId;

      const [usersRes, rolesRes, invitationsRes] = await Promise.all([
        fetch(`${apiUrl}/users`, { headers, credentials: "include" }),
        fetch(`${apiUrl}/users/roles/list`, { headers, credentials: "include" }),
        fetch(`${apiUrl}/users/invitations/list`, { headers, credentials: "include" })
      ]);

      if (!usersRes.ok || !rolesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const invitationsData = invitationsRes.ok ? await invitationsRes.json() : { invitations: [] };

      setUsers(usersData.users || []);
      setRoles(rolesData.roles || []);
      setInvitations(invitationsData.invitations || []);
      if (rolesData.roles?.length > 0 && !inviteRoleId) {
        setInviteRoleId(rolesData.roles[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function initializeRoles() {
    try {
      const tenantId = document.cookie.split("; ").find(c => c.startsWith("pgm_tenant="))?.split("=")[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (tenantId) headers["x-tenant-id"] = tenantId;

      await fetch(`${apiUrl}/users/roles/initialize`, {
        method: "POST",
        headers,
        credentials: "include"
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize roles");
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      const tenantId = document.cookie.split("; ").find(c => c.startsWith("pgm_tenant="))?.split("=")[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (tenantId) headers["x-tenant-id"] = tenantId;

      const res = await fetch(`${apiUrl}/users/invitations`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail, role_id: inviteRoleId })
      });

      if (!res.ok) throw new Error("Failed to send invitation");

      setInviteEmail("");
      setShowInviteForm(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const tenantId = document.cookie.split("; ").find(c => c.startsWith("pgm_tenant="))?.split("=")[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (tenantId) headers["x-tenant-id"] = tenantId;

      const res = await fetch(`${apiUrl}/users/${editingUser.id}`, {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({
          name: editingUser.name,
          status: editingUser.status,
          role_id: editingUser.role_id
        })
      });

      if (!res.ok) throw new Error("Failed to update user");

      setEditingUser(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Remove this user from the organization?")) return;

    try {
      const tenantId = document.cookie.split("; ").find(c => c.startsWith("pgm_tenant="))?.split("=")[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (tenantId) headers["x-tenant-id"] = tenantId;

      await fetch(`${apiUrl}/users/${userId}`, {
        method: "DELETE",
        headers,
        credentials: "include"
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove user");
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    try {
      const tenantId = document.cookie.split("; ").find(c => c.startsWith("pgm_tenant="))?.split("=")[1];
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (tenantId) headers["x-tenant-id"] = tenantId;

      await fetch(`${apiUrl}/users/invitations/${invitationId}`, {
        method: "DELETE",
        headers,
        credentials: "include"
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invitation");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const pendingInvitations = invitations.filter(inv => !inv.accepted_at && new Date(inv.expires_at) > new Date());

  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h1>User Management</h1>
            <p className="lede">Manage users, roles, and permissions for your organization.</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {roles.length === 0 && (
              <button onClick={initializeRoles} className="action" style={{ background: "#3b82f6", borderColor: "#3b82f6", color: "#fff" }}>
                Initialize Roles
              </button>
            )}
            <button onClick={() => setShowInviteForm(true)} className="action primary" style={{ background: "#22c55e", borderColor: "#22c55e" }}>
              Invite User
            </button>
          </div>
        </div>

        {error && <div className="empty" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444" }}>{error}</div>}

        {showInviteForm && (
          <div className="detail-card" style={{ marginBottom: "1.5rem" }}>
            <h3>Invite New User</h3>
            <form onSubmit={handleInvite} className="form">
              <div className="form-grid">
                <label>
                  Email Address *
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </label>
                <label>
                  Role *
                  <select value={inviteRoleId} onChange={(e) => setInviteRoleId(e.target.value)} required>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="action primary" style={{ background: "#22c55e", borderColor: "#22c55e" }}>
                  Send Invitation
                </button>
                <button type="button" onClick={() => setShowInviteForm(false)} className="action">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {editingUser && (
          <div className="detail-card" style={{ marginBottom: "1.5rem" }}>
            <h3>Edit User</h3>
            <form onSubmit={handleUpdateUser} className="form">
              <div className="form-grid">
                <label>
                  Name
                  <input
                    type="text"
                    value={editingUser.name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="Full Name"
                  />
                </label>
                <label>
                  Status
                  <select value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </label>
                <label>
                  Role
                  <select value={editingUser.role_id} onChange={(e) => setEditingUser({ ...editingUser, role_id: e.target.value })}>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button type="submit" className="action primary" style={{ background: "#22c55e", borderColor: "#22c55e" }}>
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="action">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="detail-card" style={{ marginBottom: "1.5rem" }}>
          <h3>Users ({users.length})</h3>
          {loading ? (
            <p style={{ color: "#6b7280" }}>Loading...</p>
          ) : users.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No users found. Invite someone to get started.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>User</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>Role</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>Status</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>Joined</th>
                    <th style={{ padding: "0.75rem", textAlign: "right", color: "#9ca3af", fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                            {(user.name || user.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{user.name || "—"}</div>
                            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 500 }}>
                          {user.role_name}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span style={{
                          background: user.status === "active" ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: user.status === "active" ? "#22c55e" : "#ef4444",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          textTransform: "capitalize"
                        }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", color: "#9ca3af", fontSize: "0.875rem" }}>
                        {formatDate(user.created_at)}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button onClick={() => setEditingUser(user)} className="action sm">
                            Edit
                          </button>
                          <button onClick={() => handleDeleteUser(user.id)} className="action sm" style={{ color: "#ef4444" }}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pendingInvitations.length > 0 && (
          <div className="detail-card" style={{ marginBottom: "1.5rem" }}>
            <h3>Pending Invitations ({pendingInvitations.length})</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>Email</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>Sent</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", color: "#9ca3af", fontWeight: 500 }}>Expires</th>
                    <th style={{ padding: "0.75rem", textAlign: "right", color: "#9ca3af", fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvitations.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "0.75rem" }}>{inv.email}</td>
                      <td style={{ padding: "0.75rem", color: "#9ca3af", fontSize: "0.875rem" }}>{formatDate(inv.created_at)}</td>
                      <td style={{ padding: "0.75rem", color: "#9ca3af", fontSize: "0.875rem" }}>{formatDate(inv.expires_at)}</td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        <button onClick={() => handleRevokeInvitation(inv.id)} className="action sm" style={{ color: "#ef4444" }}>
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="detail-card">
          <h3>Roles ({roles.length})</h3>
          {roles.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No roles configured. Click "Initialize Roles" to set up default roles.</p>
          ) : (
            <div className="list-grid">
              {roles.map((role) => (
                <div key={role.id} className="list-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <strong>{role.name}</strong>
                    {role.is_system && (
                      <span style={{ background: "rgba(156, 163, 175, 0.2)", color: "#9ca3af", padding: "0.125rem 0.375rem", borderRadius: "4px", fontSize: "0.625rem", fontWeight: 500 }}>
                        SYSTEM
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>{role.description}</span>
                  <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                    {Object.entries(role.permissions || {}).map(([resource, perms]) => (
                      <span key={resource} style={{ background: "rgba(255,255,255,0.05)", padding: "0.125rem 0.375rem", borderRadius: "4px", fontSize: "0.75rem", color: "#9ca3af" }}>
                        {resource}: {(perms as string[]).join(", ")}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
