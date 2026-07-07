"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Quiz {
  id: string; title: string; description?: string | null;
  isGeneralCulture: boolean; timeLimit?: number | null;
  difficulty: string; createdAt: string;
  subject?: { name: string } | null;
  _count: { questions: number; attempts: number };
}

const DIFFICULTY_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  EASY: { label: "Facile", color: "badge badge-success", icon: "M5 3v4M3 5h4" },
  MEDIUM: { label: "Moyen", color: "badge badge-warning", icon: "M12 5v4M5 12h4" },
  HARD: { label: "Difficile", color: "badge badge-error", icon: "M19 3v4M21 5h-4" },
  LEGENDARY: { label: "Légendaire", color: "badge badge-accent", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
};

export default function QuizListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/quiz")
        .then(r => r.ok ? r.json() : [])
        .then(setQuizzes)
        .catch(() => setError("Erreur chargement"))
        .finally(() => setLoading(false));
    }
  }, [status]);

  const isPlayer = session?.user && !["ADMIN", "TEACHER"].includes(session.user.role);
  const canCreate = session?.user && ["ADMIN", "TEACHER"].includes(session.user.role);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Quiz</h1>
              <p className="text-sm text-white/50">Testez vos connaissances</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPlayer && (
              <Link href="/quiz/results"
                className="btn-ghost px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-all">
                Mes résultats
              </Link>
            )}
            {canCreate && (
              <Link href="/quiz/create"
                className="gradient-btn px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all active:scale-95 inline-flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nouveau quiz
              </Link>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="glass border border-error/30 rounded-xl p-3 mb-6 flex items-center gap-2">
            <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {loading ? (
          <LoadingSpinner text="Chargement..." />
        ) : quizzes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-1">Aucun quiz disponible</h3>
            <p className="text-sm text-white/40 mb-4">Les quiz disponibles apparaîtront ici</p>
            {canCreate && (
              <Link href="/quiz/create"
                className="gradient-btn px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Créer le premier quiz
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/quiz/${q.id}`} className="block glass-card rounded-2xl p-6 h-full flex flex-col">
                  <div className="flex items-start gap-2 mb-3 flex-wrap">
                    {q.isGeneralCulture && <span className="badge badge-accent">Culture G</span>}
                    {q.subject && <span className="badge badge-primary">{q.subject.name}</span>}
                    <span className={DIFFICULTY_STYLES[q.difficulty]?.color || "badge"}>
                      {DIFFICULTY_STYLES[q.difficulty]?.label || q.difficulty}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{q.title}</h3>
                  {q.description && <p className="text-sm text-white/50 line-clamp-2 mb-4 flex-1">{q.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-white/40 pt-4 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {q._count.questions} question{q._count.questions > 1 ? "s" : ""}
                    </span>
                    {q.timeLimit && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {q.timeLimit} min
                      </span>
                    )}
                    <span>{q._count.attempts} tentative{q._count.attempts > 1 ? "s" : ""}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
