"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getXPProgress } from "@/lib/xp-client";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  xpReward: number;
  earned: boolean;
  earnedAt: string | null;
}

interface XPTransaction {
  id: string;
  points: number;
  action: string;
  description: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [transactions, setTransactions] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const isPlayer = session?.user?.role !== "TEACHER" && session?.user?.role !== "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !isPlayer) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      fetch("/api/badges").then((r) => r.ok ? r.json() : []),
      fetch("/api/xp").then((r) => r.ok ? r.json() : []),
    ]).then(([b, t]) => {
      setBadges(b);
      setTransactions(t);
    }).finally(() => setLoading(false));
  }, [status, isPlayer]);

  if (status === "loading" || (loading && status === "authenticated")) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner text="Chargement..." /></div>;
  }

  if (!session?.user) return null;

  const user = session.user;
  const progress = getXPProgress(user.totalXP || 0);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Mon profil</h1>
        </motion.div>

        {/* Carte info utilisateur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-6 mb-6 bg-gradient-to-r from-primary/5 to-transparent"
        >
          <div className="flex items-center gap-6 flex-wrap">
            <div className="avatar avatar-xl">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-white font-bold text-xl">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-white/50">{user.email}</p>
              <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {user.establishmentName}{user.className && ` · ${user.className}`}
              </p>
            </div>
            <span className="badge badge-primary text-sm px-4 py-1.5 capitalize">
              {user.role === "CLASS_REP" ? "Chef de classe" : user.role === "TEACHER" ? "Professeur" : user.role === "ADMIN" ? "Administrateur" : "Élève"}
            </span>
          </div>
        </motion.div>

        {isPlayer && (
          <>
            {/* Carte XP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-6 mb-6 bg-gradient-to-r from-accent/5 to-transparent"
            >
              <div className="flex items-center gap-6 flex-wrap">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl gradient-btn flex items-center justify-center text-3xl font-bold text-white relative z-10">
                    {user.level || 1}
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-accent/30 to-primary/30 blur-sm" />
                </div>
                <div className="flex-1 min-w-[250px]">
                  <p className="text-white font-bold text-xl">Niveau {user.level || 1}</p>
                  <p className="text-sm text-white/50 mb-3">{user.totalXP || 0} XP accumulés</p>
                  <div className="progress-bar max-w-md mb-1">
                    <div
                      className="progress-bar-fill bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${Math.min(progress.progress * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/40">{progress.current} / {progress.next} XP avant niveau {(user.level || 0) + 1}</p>
                </div>
              </div>
            </motion.div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Badges
                </h2>
                <span className="text-sm text-white/40">{badges.filter((b) => b.earned).length}/{badges.length}</span>
              </div>
              {badges.length === 0 ? (
                <p className="text-white/50 text-sm">Aucun badge disponible</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {badges.map((badge, i) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.04 }}
                      className={`glass-card rounded-xl p-4 text-center ${!badge.earned ? "opacity-40" : ""}`}
                    >
                      <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-xl ${badge.earned ? "gradient-btn" : "glass"}`}>
                        {badge.iconUrl || "🏆"}
                      </div>
                      <p className="text-white text-sm font-medium truncate">{badge.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {badge.earned ? new Date(badge.earnedAt!).toLocaleDateString("fr-FR") : badge.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Historique XP */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activité récente
              </h2>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-white/50 text-sm">Aucune activité pour le moment</p>
                  <p className="text-xs text-white/30 mt-1">Publiez des ressources ou faites des quiz pour gagner de l&apos;XP !</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 20).map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="glass rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.points > 0 ? "gradient-btn" : "glass"}`}>
                          {t.points > 0 ? (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white">{t.description || t.action}</p>
                          <p className="text-xs text-white/40">{new Date(t.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                      {t.points > 0 && (
                        <span className="text-sm font-bold text-accent flex items-center gap-0.5">
                          +{t.points}
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Non-player view */}
        {!isPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-lg mb-1">Compte {user.role === "TEACHER" ? "Professeur" : "Administrateur"}</h2>
            <p className="text-sm text-white/50 max-w-md mx-auto">
              Les fonctionnalités de jeu (XP, badges, classement) sont réservées aux élèves.
              Vous pouvez publier des ressources et gérer la plateforme.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
