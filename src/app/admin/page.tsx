"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";

interface AdminUser {
  id: string; firstName: string; lastName: string; email: string;
  role: string; isActive: boolean; createdAt: string;
  classe: { name: string; level: { name: string }; series?: { name: string } | null } | null;
}

interface AdminStats {
  totalUsers: number; totalResources: number; pendingResources: number;
  studentsCount: number; teachersCount: number; classRepsCount: number;
}

interface AdminResource {
  id: string; title: string; description: string | null; type: string; status: string;
  fileUrl: string; createdAt: string;
  author: { firstName: string; lastName: string; role: string };
  subject: { name: string } | null;
  classe: { name: string; level: { name: string }; series?: { name: string } | null } | null;
  validations: { id: string; createdAt: string; validator: { firstName: string; lastName: string } }[];
}

interface RegistryClass {
  id: string; classId: string; name: string; level: string; isActive: boolean; createdAt: string;
}

interface AvailableClass {
  id: string; name: string; level: string;
}

const statCards = [
  { key: "totalUsers", label: "Utilisateurs", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197", color: "text-primary-light", tab: "users" as const },
  { key: "totalResources", label: "Ressources", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", color: "text-success", tab: "resources" as const },
  { key: "pendingResources", label: "En attente", icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-warning", tab: "resources" as const, params: { status: "PENDING" } },
  { key: "teachersCount", label: "Professeurs", icon: "M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2", color: "text-accent", tab: "users" as const },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "resources" | "registry">("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [registered, setRegistered] = useState<RegistryClass[]>([]);
  const [available, setAvailable] = useState<AvailableClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [actingOnUser, setActingOnUser] = useState<string | null>(null);

  const [resFilter, setResFilter] = useState({ status: "", subject: "", type: "", search: "" });
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && session.user.role !== "ADMIN") router.push("/dashboard");
  }, [status, session, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "overview") {
        const res = await fetch("/api/admin/stats");
        if (res.ok) setStats(await res.json());
      } else if (activeTab === "users") {
        const res = await fetch("/api/users");
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === "resources") {
        const params = new URLSearchParams();
        if (resFilter.status) params.set("status", resFilter.status);
        if (resFilter.subject) params.set("subjectId", resFilter.subject);
        if (resFilter.type) params.set("type", resFilter.type);
        if (resFilter.search) params.set("search", resFilter.search);
        const [res, subRes] = await Promise.all([
          fetch(`/api/admin/resources?${params}`),
          fetch("/api/subjects"),
        ]);
        if (res.ok) setResources(await res.json());
        if (subRes.ok) setSubjects(await subRes.json());
      } else if (activeTab === "registry") {
        const res = await fetch("/api/admin/registry");
        if (res.ok) { const d = await res.json(); setRegistered(d.registered); setAvailable(d.available); }
      }
    } catch { setError("Erreur lors du chargement"); }
    finally { setLoading(false); }
  }, [activeTab, resFilter]);

  useEffect(() => {
    if (status === "authenticated" && session.user.role === "ADMIN") loadData();
  }, [status, activeTab, loadData, session]);

  const handleValidate = async (id: string, action: string) => {
    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: id, action }),
    });
    if (res.ok) loadData(); else { const e = await res.json(); setError(e.error); }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm("Supprimer définitivement cette ressource ?")) return;
    const res = await fetch(`/api/admin/resources?id=${id}`, { method: "DELETE" });
    if (res.ok) loadData(); else { const e = await res.json(); setError(e.error); }
  };

  const handleAddClass = async (classId: string) => {
    const res = await fetch("/api/admin/registry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    });
    if (res.ok) loadData(); else { const e = await res.json(); setError(e.error); }
  };

  const handleAdminAction = async (userId: string, action: string) => {
    setActingOnUser(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) { const e = await res.json(); setError(e.error); }
      else loadData();
    } catch { setError("Erreur"); }
    finally { setActingOnUser(null); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Supprimer définitivement cet utilisateur ? Cette action est irréversible.")) return;
    setActingOnUser(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) { const e = await res.json(); setError(e.error); }
      else loadData();
    } catch { setError("Erreur lors de la suppression"); }
    finally { setActingOnUser(null); }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setChangingRole(userId);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) { const e = await res.json(); setError(e.error); }
      else loadData();
    } catch { setError("Erreur"); }
    finally { setChangingRole(null); }
  };

  const handleRemoveClass = async (classId: string) => {
    if (!confirm("Retirer cette classe du registre ?")) return;
    const res = await fetch("/api/admin/registry", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    });
    if (res.ok) loadData(); else { const e = await res.json(); setError(e.error); }
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner text="Chargement..." /></div>;
  if (session?.user.role !== "ADMIN") return null;

  const tabs = [
    { id: "overview" as const, label: "Vue d'ensemble", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" },
    { id: "users" as const, label: "Utilisateurs", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
    { id: "resources" as const, label: "Ressources", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { id: "registry" as const, label: "Registre", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  ];

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { APPROVED: "badge badge-success", PENDING: "badge badge-warning", REJECTED: "badge badge-error" };
    const l: Record<string, string> = { APPROVED: "Publié", PENDING: "En attente", REJECTED: "Rejeté" };
    return <span className={m[status] || "badge"}>{l[status] || status}</span>;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Administration</h1>
              <p className="text-sm text-white/50">{session.user.establishmentName}</p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 glass rounded-xl p-1 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id ? "gradient-btn text-white" : "text-white/50 hover:text-white hover:bg-white/5"
              }`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="glass border border-error/30 rounded-xl p-3 mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            {loading ? <LoadingSpinner text="Chargement..." /> : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((item, i) => (
                  <button key={i} onClick={() => setActiveTab(item.tab)}
                    className="glass-card rounded-2xl p-6 text-left w-full">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-white/50">{item.label}</p>
                      <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                        <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                      </div>
                    </div>
                    <p className={`text-3xl font-bold ${item.color}`}>
                      {stats[item.key as keyof AdminStats]}
                    </p>
                  </button>
                ))}
              </div>
            ) : <div className="text-center py-12"><p className="text-white/50">Aucune donnée</p></div>}
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <div>
            {loading ? <LoadingSpinner text="Chargement..." /> : users.length === 0 ? (
              <div className="text-center py-12"><p className="text-white/50">Aucun utilisateur</p></div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-sm text-white/50 font-medium">Nom</th>
                        <th className="text-left p-4 text-sm text-white/50 font-medium">Email</th>
                        <th className="text-left p-4 text-sm text-white/50 font-medium">Classe</th>
                        <th className="text-left p-4 text-sm text-white/50 font-medium">Rôle</th>
                        <th className="text-left p-4 text-sm text-white/50 font-medium">Statut</th>
                        <th className="text-left p-4 text-sm text-white/50 font-medium">Inscription</th>
                        <th className="text-left p-4 text-sm text-white/50 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center text-white font-bold text-xs">
                                {user.firstName[0]}{user.lastName[0]}
                              </div>
                              <span className="text-sm text-white">{user.firstName} {user.lastName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-white/60">{user.email}</td>
                          <td className="p-4 text-sm text-white/60">
                            {user.classe ? `${user.classe.level.name}${user.classe.series?.name ? " " + user.classe.series.name : ""} ${user.classe.name}` : "-"}
                          </td>
                          <td className="p-4">
                            {user.role === "ADMIN" ? (
                              <span className="badge badge-primary">Admin</span>
                            ) : (
                              <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={changingRole === user.id}
                                className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/70 border border-white/10 focus:outline-none focus:border-primary-light disabled:opacity-50">
                                <option value="STUDENT">Élève</option>
                                <option value="CLASS_REP">Chef</option>
                                <option value="TEACHER">Professeur</option>
                              </select>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={user.isActive ? "badge badge-success" : "badge badge-error"}>
                              {user.isActive ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-white/40">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              {!user.isActive && (
                                <>
                                  <button onClick={() => handleAdminAction(user.id, "activate")} disabled={actingOnUser === user.id}
                                    className="px-2 py-1 rounded bg-success/20 text-success text-xs font-medium hover:bg-success/30 disabled:opacity-50 transition-all">
                                    Activer
                                  </button>
                                  <button onClick={() => handleAdminAction(user.id, "resend_verification")} disabled={actingOnUser === user.id}
                                    className="px-2 py-1 rounded bg-primary/20 text-primary-light text-xs font-medium hover:bg-primary/30 disabled:opacity-50 transition-all">
                                    Code
                                  </button>
                                </>
                              )}
                              {user.role !== "ADMIN" && (
                                <button onClick={() => handleDeleteUser(user.id)} disabled={actingOnUser === user.id}
                                  className="px-2 py-1 rounded bg-error/20 text-error text-xs font-medium hover:bg-error/30 disabled:opacity-50 transition-all">
                                  Suppr.
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resources */}
        {activeTab === "resources" && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              <input type="text" value={resFilter.search} onChange={(e) => setResFilter(p => ({ ...p, search: e.target.value }))}
                placeholder="Rechercher..." className="input-field max-w-xs" />
              <select value={resFilter.status} onChange={(e) => setResFilter(p => ({ ...p, status: e.target.value }))} className="select-field max-w-[140px]">
                <option value="">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="APPROVED">Publié</option>
                <option value="REJECTED">Rejeté</option>
              </select>
              <select value={resFilter.subject} onChange={(e) => setResFilter(p => ({ ...p, subject: e.target.value }))} className="select-field max-w-[180px]">
                <option value="">Toutes matières</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={resFilter.type} onChange={(e) => setResFilter(p => ({ ...p, type: e.target.value }))} className="select-field max-w-[140px]">
                <option value="">Tous types</option>
                <option value="PDF">PDF</option><option value="DOC">DOC</option><option value="PPT">PPT</option><option value="IMAGE">Image</option>
              </select>
            </div>

            {loading ? <LoadingSpinner text="Chargement..." /> : resources.length === 0 ? (
              <div className="text-center py-12"><p className="text-white/50">Aucune ressource</p></div>
            ) : (
              <div className="space-y-3">
                {resources.map((r) => (
                  <div key={r.id} className="glass-card rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {statusBadge(r.status)}
                          <span className="badge bg-white/10 text-white/60">{r.type}</span>
                          {r.subject && <span className="badge badge-primary">{r.subject.name}</span>}
                        </div>
                        <h3 className="text-white font-semibold text-base mb-1 truncate">{r.title}</h3>
                        {r.description && <p className="text-sm text-white/50 line-clamp-2 mb-2">{r.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {r.author.firstName} {r.author.lastName}
                          </span>
                          {r.classe && <span>{r.classe.level.name}{r.classe.series?.name ? " " + r.classe.series.name : ""} {r.classe.name}</span>}
                          <span>{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                        {r.validations?.length > 0 && (
                          <p className="text-xs text-white/30 mt-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Validé par {r.validations[0].validator.firstName} {r.validations[0].validator.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="gradient-btn px-4 py-2 rounded-lg text-white text-xs font-medium text-center">Voir</a>
                        {r.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button onClick={() => handleValidate(r.id, "APPROVED")}
                              className="px-3 py-1.5 rounded-lg bg-success/20 text-success text-xs font-medium hover:bg-success/30 transition-all">✓</button>
                            <button onClick={() => handleValidate(r.id, "REJECTED")}
                              className="px-3 py-1.5 rounded-lg bg-error/20 text-error text-xs font-medium hover:bg-error/30 transition-all">✗</button>
                          </div>
                        )}
                        <button onClick={() => handleDeleteResource(r.id)}
                          className="px-3 py-1.5 rounded-lg bg-error/10 text-error/70 text-xs font-medium hover:bg-error/20 transition-all">Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Registry */}
        {activeTab === "registry" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Classes enregistrées
              </h2>
              {loading ? <LoadingSpinner /> : registered.length === 0 ? (
                <p className="text-white/50 text-sm">Aucune classe enregistrée</p>
              ) : (
                <div className="space-y-2">
                  {registered.map((r) => (
                    <div key={r.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-white/40">Ajoutée le {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <button onClick={() => handleRemoveClass(r.classId)}
                        className="px-3 py-1.5 rounded-lg bg-error/10 text-error/70 text-xs font-medium hover:bg-error/20 transition-all">Retirer</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ajouter une classe
              </h2>
              {available.length === 0 ? (
                <p className="text-white/50 text-sm">Toutes les classes sont déjà enregistrées</p>
              ) : (
                <div className="space-y-2">
                  {available.map((c) => (
                    <div key={c.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                      <p className="text-white text-sm">{c.name}</p>
                      <button onClick={() => handleAddClass(c.id)}
                        className="gradient-btn px-3 py-1.5 rounded-lg text-white text-xs font-medium">Ajouter</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
