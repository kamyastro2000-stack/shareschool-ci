"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getXPProgress } from "@/lib/xp-client";

interface Leader {
  id: string;
  firstName: string;
  lastName: string;
  totalXP: number;
  level: number;
  role: string;
  classe: { name: string; level: { name: string }; series?: { name: string } | null } | null;
  _count: { badges: number };
}

interface ClassLeader {
  classId: string;
  className: string;
  levelName: string;
  seriesName: string | null;
  levelOrder: number;
  avgXP: number;
  totalXP: number;
  studentCount: number;
}

function Podium({ leaders }: { leaders: Leader[] }) {
  const top3 = leaders.slice(0, 3);
  const podiumPositions = [
    { rank: 2, height: "h-24", delay: 0.2 },
    { rank: 0, height: "h-32", delay: 0 },
    { rank: 1, height: "h-20", delay: 0.1 },
  ];

  return (
    <div className="flex items-end justify-center gap-4 mb-8 px-4">
      {podiumPositions.map(({ rank, height, delay }) => {
        const user = top3[rank];
        if (!user) return null;
        const medals = ["🥇", "🥈", "🥉"];
        return (
          <motion.div
            key={rank}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <div className="text-3xl mb-2">{medals[rank]}</div>
            <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center text-white font-bold text-lg mb-2 shadow-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <p className="text-white font-semibold text-sm text-center truncate max-w-[100px]">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-accent font-bold">{user.totalXP} XP</p>
            <p className="text-xs text-white/40">Niveau {user.level}</p>
            <div className={`w-20 ${height} rounded-t-xl mt-2 ${
              rank === 0 ? "bg-gradient-to-t from-accent/30 to-accent/10 border border-accent/30" :
              rank === 1 ? "bg-gradient-to-t from-primary/30 to-primary/10 border border-primary/30" :
              "bg-gradient-to-t from-accent/20 to-transparent border border-accent/20"
            }`} />
          </motion.div>
        );
      })}
    </div>
  );
}

const roleLabel = (role: string) => {
  const map: Record<string, string> = { STUDENT: "Élève", CLASS_REP: "Chef", TEACHER: "Professeur" };
  return map[role] || role;
};

const medals = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "classes">("users");
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [classLeaders, setClassLeaders] = useState<ClassLeader[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userClassRank, setUserClassRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);

    if (tab === "users") {
      fetch("/api/leaderboard")
        .then((r) => r.ok ? r.json() : { leaders: [], userRank: null })
        .then((data) => { setLeaders(data.leaders); setUserRank(data.userRank); })
        .finally(() => setLoading(false));
    } else {
      fetch("/api/leaderboard/classes")
        .then((r) => r.ok ? r.json() : { classes: [], userClassRank: null })
        .then((data) => { setClassLeaders(data.classes); setUserClassRank(data.userClassRank); })
        .finally(() => setLoading(false));
    }
  }, [status, tab]);

  const filteredLeaders = useMemo(() => {
    if (!search.trim()) return leaders;
    const q = search.toLowerCase();
    return leaders.filter(u =>
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    );
  }, [leaders, search]);

  const xpData = session?.user ? getXPProgress(session.user.totalXP || 0) : null;

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner text="Chargement..." /></div>;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Classement
          </h1>
          {(tab === "users" && userRank) || (tab === "classes" && userClassRank) ? (
            <p className="text-white/50 mt-1">
              {tab === "users" ? `Votre position : #${userRank}` : `Votre classe : #${userClassRank}`}
            </p>
          ) : null}
        </motion.div>

        {/* User XP card */}
        {session?.user && xpData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-5 mb-6 flex items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent"
          >
            <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center text-xl font-bold text-white shrink-0">
              {session.user.level || 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{session.user.firstName} {session.user.lastName}</p>
              <p className="text-xs text-white/50">
                Niveau {session.user.level || 1} · {session.user.totalXP || 0} XP
                {tab === "users" && userRank ? ` · #${userRank}` : ""}
              </p>
              <div className="progress-bar mt-2 max-w-md">
                <div
                  className="progress-bar-fill bg-gradient-to-r from-primary to-accent"
                  style={{ width: `${Math.min((xpData?.progress || 0) * 100, 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-1 glass rounded-xl p-1 mb-6">
          <button onClick={() => setTab("users")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === "users" ? "gradient-btn text-white" : "text-white/50 hover:text-white"
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
            </svg>
            Élèves
          </button>
          <button onClick={() => setTab("classes")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === "classes" ? "gradient-btn text-white" : "text-white/50 hover:text-white"
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Par classe
          </button>
        </div>

        {/* Search for users tab */}
        {tab === "users" && (
          <div className="relative max-w-xs mb-6">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un élève..."
              className="input-field pl-9"
            />
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Chargement..." />
        ) : tab === "users" && filteredLeaders.length > 0 ? (
          <>
            {/* Podium */}
            <Podium leaders={filteredLeaders} />

            {/* Leader list */}
            <div className="space-y-2">
              {filteredLeaders.slice(3).map((user) => {
                const realIndex = leaders.findIndex(u => u.id === user.id);
                const isMe = user.id === session?.user?.id;
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: realIndex * 0.02 }}
                    className={`glass-card rounded-xl px-5 py-4 flex items-center gap-4 ${isMe ? "border border-primary/40" : ""}`}
                  >
                    <div className="w-8 text-center text-lg font-bold shrink-0">
                      {realIndex < 3 ? medals[realIndex] : <span className="text-sm text-white/40">#{realIndex + 1}</span>}
                    </div>
                    <div className="avatar avatar-md">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {user.firstName} {user.lastName}
                        {isMe && <span className="badge badge-primary ml-2 text-[0.6rem] px-1.5 py-0">Vous</span>}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {user.classe ? `${user.classe.level.name}${user.classe.series?.name ? " " + user.classe.series.name : ""} ${user.classe.name}` : roleLabel(user.role)}
                        {" · "}{user._count.badges} badge{user._count.badges > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-bold flex items-center gap-1">
                        {user.totalXP}
                        <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </p>
                      <p className="text-xs text-white/40">Niveau {user.level}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : tab === "classes" && classLeaders.length > 0 ? (
          <div className="space-y-2">
            {classLeaders.map((cls, i) => {
              const isMyClass = cls.classId === session?.user?.classId;
              return (
                <motion.div
                  key={cls.classId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card rounded-xl px-5 py-4 flex items-center gap-4 ${isMyClass ? "border border-primary/40" : ""}`}
                >
                  <div className="w-8 text-center text-lg font-bold shrink-0">
                    {i < 3 ? medals[i] : <span className="text-sm text-white/40">#{i + 1}</span>}
                  </div>
                  <div className="avatar avatar-md">
                    {cls.levelName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {cls.levelName} {cls.seriesName ? cls.seriesName + " " : ""}{cls.className}
                      {isMyClass && <span className="badge badge-primary ml-2 text-[0.6rem] px-1.5 py-0">Votre classe</span>}
                    </p>
                    <p className="text-xs text-white/40">
                      {cls.studentCount} élève{cls.studentCount > 1 ? "s" : ""} · {cls.totalXP} XP total
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-primary-light font-bold">{cls.avgXP}</p>
                    <p className="text-xs text-white/40">Moyenne</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-white/50">Aucun classement disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
