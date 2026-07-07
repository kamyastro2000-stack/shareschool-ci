"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface Result {
  id: string; score: number; maxScore: number; answers: string;
  startedAt: string; completedAt: string | null;
  quiz: { id: string; title: string; subject?: { name: string } | null; difficulty: string };
  xpAwarded?: number;
}

export default function QuizResultsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/quiz/results")
      .then(r => r.ok ? r.json() : [])
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const getScoreColor = (pct: number) => {
    if (pct >= 90) return "text-success";
    if (pct >= 70) return "text-primary-light";
    if (pct >= 50) return "text-warning";
    return "text-error";
  };

  const getScoreBg = (pct: number) => {
    if (pct >= 90) return "bg-success";
    if (pct >= 70) return "bg-primary-light";
    if (pct >= 50) return "bg-warning";
    return "bg-error";
  };

  const getDiffBadge = (d: string) => {
    const m: Record<string, { l: string; c: string }> = {
      EASY: { l: "Facile", c: "bg-success/20 text-success" },
      MEDIUM: { l: "Moyen", c: "bg-warning/20 text-warning" },
      HARD: { l: "Difficile", c: "bg-error/20 text-error" },
      LEGENDARY: { l: "Légendaire", c: "bg-primary/20 text-primary-light" },
    };
    return m[d] || m.EASY;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Mes résultats</h1>
              <p className="text-sm text-white/50">Historique de vos quiz</p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <span className="w-8 h-8 border-2 border-white/20 border-t-primary-light rounded-full animate-spin" />
            <p className="text-sm text-white/40">Chargement de vos résultats...</p>
          </div>
        ) : results.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-white/50 text-lg font-medium mb-2">Aucun résultat</p>
            <p className="text-white/30 text-sm mb-6">Vous n&apos;avez pas encore terminé de quiz</p>
            <Link href="/quiz" className="gradient-btn px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98]">
              Faire un quiz
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {results.map((r, i) => {
              const pct = r.completedAt ? Math.round((r.score / r.maxScore) * 100) : 0;
              const diff = getDiffBadge(r.quiz.difficulty);
              const scoreColor = getScoreColor(pct);
              const scoreBg = getScoreBg(pct);
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/quiz/${r.quiz.id}`} className="block glass rounded-2xl p-5 card-hover">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {r.quiz.subject && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-light font-medium">
                              {r.quiz.subject.name}
                            </span>
                          )}
                          {r.completedAt && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${diff.c}`}>
                              {diff.l}
                            </span>
                          )}
                          {r.xpAwarded && r.xpAwarded > 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              +{r.xpAwarded} XP
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-white font-semibold truncate text-lg">{r.quiz.title}</h3>
                        <p className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {r.completedAt
                            ? `Terminé le ${new Date(r.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                            : "Non terminé"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {r.completedAt ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-2xl font-black ${scoreColor}`}>{pct}%</span>
                              <span className="text-xs text-white/30">/100</span>
                            </div>
                            <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div className={`h-full rounded-full ${scoreBg} transition-all duration-700`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-xs text-white/40">{r.score}/{r.maxScore} bonnes réponses</p>
                          </div>
                        ) : (
                          <span className="text-xs px-3 py-1.5 rounded-full bg-warning/20 text-warning font-medium">En cours</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
