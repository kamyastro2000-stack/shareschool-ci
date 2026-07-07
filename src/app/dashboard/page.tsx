"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ResourceCard from "@/components/ResourceCard";
import UploadModal from "@/components/UploadModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getGreeting } from "@/lib/utils";
import { getLevel, getXPProgress } from "@/lib/xp-client";
import Link from "next/link";

interface Subject {
  id: string;
  name: string;
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  fileUrl: string;
  createdAt: string;
  author: { firstName: string; lastName: string; role: string };
  subject: { name: string } | null;
  classe: {
    name: string;
    level: { name: string };
    series?: { name: string } | null;
  } | null;
  validations?: { id: string; createdAt: string; validator: { firstName: string; lastName: string } }[];
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  const displayValue = typeof value === "number" ? value.toLocaleString("fr-FR") : value;
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-value gradient-text-full">{displayValue}</p>
          <p className="stat-label">{label}</p>
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color }}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"browse" | "my" | "pending">("browse");
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ resourceCount: 0, quizCount: 0 });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadStats = async () => {
    try {
      const [resourcesRes, quizRes] = await Promise.all([
        fetch("/api/resources?status=APPROVED"),
        fetch("/api/quiz/results"),
      ]);
      if (resourcesRes.ok) {
        const data = await resourcesRes.json();
        setStats(prev => ({ ...prev, resourceCount: Array.isArray(data) ? data.length : 0 }));
      }
      if (quizRes.ok) {
        const data = await quizRes.json();
        setStats(prev => ({ ...prev, quizCount: Array.isArray(data) ? data.length : 0 }));
      }
    } catch {}
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSubject) params.set("subjectId", filterSubject);
      if (filterType) params.set("type", filterType);
      if (search) params.set("search", search);
      if (activeTab === "pending") params.set("status", "PENDING");
      else if (activeTab !== "my") params.set("status", "APPROVED");

      const res = await fetch(`/api/resources?${params.toString()}`);
      if (res.ok) setResources(await res.json());
    } catch {
      setError("Erreur lors du chargement des ressources");
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) setSubjects(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadResources();
      loadSubjects();
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filterSubject, filterType, search, activeTab]);

  const handleValidate = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: id, action }),
      });
      if (res.ok) loadResources();
      else setError((await res.json()).error);
    } catch {
      setError("Erreur lors de la validation");
    }
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner text="Chargement..." /></div>;
  }

  if (!session?.user) return null;

  const user = session.user;
  const role = user.role;
  const isPlayer = role !== "TEACHER" && role !== "ADMIN";
  const canUpload = ["STUDENT", "TEACHER", "CLASS_REP", "ADMIN"].includes(role);
  const canValidate = ["CLASS_REP", "TEACHER", "ADMIN"].includes(role);

  const xpProgress = isPlayer ? getXPProgress(user.totalXP || 0) : null;
  const quickActions = [
    ...(isPlayer ? [
      { href: "/profil", label: "Mon profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", desc: "XP, badges, progression" },
      { href: "/classement", label: "Classement", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", desc: "Voir le classement" },
    ] : []),
    { href: "/quiz", label: "Quiz", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", desc: "Tests et QCM" },
    { href: "/chat", label: "Discussion", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", desc: "Salons par niveau" },
    ...(role === "ADMIN" ? [
      { href: "/admin", label: "Administration", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", desc: "Gérer la plateforme" },
    ] : []),
    ...(role === "ADMIN" || role === "TEACHER" ? [
      { href: "/quiz/create", label: "Créer un quiz", icon: "M12 4v16m8-8H4", desc: "Nouveau QCM" },
    ] : []),
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* Header */}
          <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <span className="section-title block mb-1">Tableau de bord</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {getGreeting()}, {user.firstName} 👋
              </h1>
              <p className="text-white/50 mt-1 flex items-center gap-2 text-sm">
                <span>{user.establishmentName}</span>
                {user.className && <><span className="text-white/20">·</span><span>{user.className}</span></>}
                {isPlayer && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="badge badge-accent flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Niveau {user.level || 1}
                    </span>
                  </>
                )}
              </p>
            </div>
            {canUpload && (
              <button
                onClick={() => setShowUpload(true)}
                className="gradient-btn-ci px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Publier
              </button>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="Niveau" value={user.level || 1} icon="M13 10V3L4 14h7v7l9-11h-7z" color="#2d5a8e" />
            <StatCard label="XP totale" value={user.totalXP || 0} icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" color="#f77f00" />
            <StatCard label="Ressources" value={stats.resourceCount} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" color="#c9a84c" />
            <StatCard label="Quiz réussis" value={stats.quizCount} icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" color="#4a8bc2" />
          </motion.div>

          {/* Quick Actions (Bento) */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bento-card text-center p-4"
              >
                <div className="bento-icon mx-auto mb-3">
                  <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                  </svg>
                </div>
                <p className="text-sm text-white font-medium">{action.label}</p>
                <p className="text-[0.65rem] text-white/40 mt-0.5">{action.desc}</p>
              </Link>
            ))}
          </motion.div>

          {/* Player XP Card */}
          {isPlayer && (
            <motion.div variants={fadeUp} className="bento-card-accent mb-8 flex items-center gap-5 flex-wrap">
              <div className="w-16 h-16 rounded-2xl gradient-btn-ci flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {user.level || 1}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-semibold">Niveau {getLevel(user.totalXP || 0)}</p>
                  <p className="text-sm text-[#f77f00] font-bold">{user.totalXP || 0} XP</p>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill bg-gradient-to-r from-[#f77f00] to-[#009e60]"
                    style={{ width: `${Math.round((xpProgress?.progress ?? 0) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-white/40 mt-1.5">Continuez comme ça ! Plus que {xpProgress ? xpProgress.next - xpProgress.current : 0} XP au prochain niveau</p>
              </div>
              <Link
                href="/profil"
                className="btn-ghost px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-all shrink-0"
              >
                Voir mon profil →
              </Link>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div variants={fadeUp} className="flex gap-1 glass rounded-xl p-1 mb-6 overflow-x-auto">
            {[
              { id: "browse" as const, label: "Bibliothèque", icon: "M4 6h16M4 12h16M4 18h16" },
              { id: "my" as const, label: "Mes publications", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
              ...(canValidate ? [{ id: "pending" as const, label: "À valider", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "gradient-btn-ci text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Filters */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="input-field pl-9 max-w-xs"
              />
            </div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="select-field max-w-[180px]"
            >
              <option value="">Toutes les matières</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="select-field max-w-[140px]"
            >
              <option value="">Tous les types</option>
              <option value="PDF">PDF</option>
              <option value="DOC">DOC</option>
              <option value="PPT">PPT</option>
              <option value="IMAGE">Image</option>
            </select>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div variants={fadeUp} className="glass border border-error/30 rounded-xl p-3 mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 text-error shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-error">{error}</p>
            </motion.div>
          )}

          {/* Resources */}
          <motion.div variants={fadeUp}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass rounded-xl p-5">
                    <div className="skeleton h-4 w-24 mb-3" />
                    <div className="skeleton h-5 w-3/4 mb-2" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : resources.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-white/50">Aucune ressource trouvée</p>
                {activeTab === "browse" && canUpload && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="mt-4 text-[#f77f00] hover:text-[#009e60] transition-colors text-sm font-medium"
                  >
                    Soyez le premier à publier !
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((resource, i) => (
                  <ResourceCard
                    key={resource.id}
                    {...resource}
                    showActions={canValidate && activeTab === "pending"}
                    onValidate={handleValidate}
                    index={i}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        subjects={subjects}
        onSuccess={loadResources}
      />
    </div>
  );
}
