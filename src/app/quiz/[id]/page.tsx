"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Question {
  id: string; question: string; options: string; order: number;
}

interface QuizData {
  id: string; title: string; description?: string | null;
  isGeneralCulture: boolean; timeLimit?: number | null;
  difficulty: string; subject?: { name: string } | null;
  questions: Question[];
  _count: { attempts: number };
}

const DIFFICULTY_STYLES: Record<string, { label: string; color: string }> = {
  EASY: { label: "Facile", color: "badge badge-success" },
  MEDIUM: { label: "Moyen", color: "badge badge-warning" },
  HARD: { label: "Difficile", color: "badge badge-error" },
  LEGENDARY: { label: "Légendaire", color: "badge badge-accent" },
};

export default function QuizTakePage() {
  const { status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; maxScore: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const loadQuiz = async () => {
    try {
      const res = await fetch(`/api/quiz/${params.id}`);
      if (!res.ok) throw new Error("Quiz non trouvé");
      const data = await res.json();
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(-1));
      if (data.timeLimit) setTimeLeft(data.timeLimit * 60);
    } catch { setError("Quiz non trouvé"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (status !== "authenticated" || !params.id) return;
    loadQuiz();
  }, [status, params.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    const unanswered = answers.filter(a => a === -1).length;
    if (unanswered > 0 && !confirm(`${unanswered} question(s) sans réponse. Soumettre quand même ?`)) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, attemptId }),
      });
      if (!res.ok) throw new Error("Erreur soumission");
      setResult(await res.json());
    } catch { setError("Erreur lors de la soumission"); }
    finally { setSubmitting(false); }
  }, [answers, attemptId, params.id]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) handleSubmit();
  }, [timeLeft, handleSubmit]);

  const startQuiz = async () => {
    try {
      const res = await fetch(`/api/quiz/${params.id}/attempt`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setAttemptId(data.attemptId);
    } catch { setError("Erreur lors du démarrage"); }
  };

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    const a = [...answers];
    a[questionIndex] = optionIndex;
    setAnswers(a);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (error || !quiz) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/50 mb-4">{error || "Quiz non trouvé"}</p>
        <button onClick={() => router.push("/quiz")} className="gradient-btn px-6 py-2.5 rounded-xl text-white text-sm">Retour</button>
      </div>
    </div>
  );

  const questions = quiz.questions.map(q => ({ ...q, options: JSON.parse(q.options) as string[] }));
  const answeredCount = answers.filter(a => a !== -1).length;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Result screen */}
        {result ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="glass-strong rounded-3xl p-8 md:p-12 text-center mb-6">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center relative"
                style={{ background: result.percentage >= 50 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
                <div className="absolute inset-0 rounded-full animate-pulse-glow" />
                <span className="text-4xl font-bold" style={{ color: result.percentage >= 50 ? "#009e60" : "#ef4444" }}>
                  {result.percentage}%
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {result.percentage >= 80 ? "Excellent ! 🎉" : result.percentage >= 50 ? "Pas mal ! 👏" : "Peut mieux faire 💪"}
              </h2>
              <p className="text-white/60 text-lg mb-4">{result.score} / {result.maxScore} bonnes réponses</p>
              <div className="progress-bar max-w-xs mx-auto mb-6">
                <div className="progress-bar-fill" style={{ width: `${result.percentage}%`, background: result.percentage >= 50 ? "linear-gradient(135deg, #009e60, #007a4b)" : "linear-gradient(135deg, #ef4444, #dc2626)" }} />
              </div>
              <button onClick={() => router.push("/quiz")}
                className="gradient-btn px-8 py-3 rounded-xl text-white font-semibold">
                Retour aux quiz
              </button>
            </div>
          </motion.div>
        ) : !attemptId ? (
          // Start screen
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-strong rounded-3xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-2xl gradient-btn flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">{quiz.title}</h1>
              {quiz.description && <p className="text-white/50 mb-6">{quiz.description}</p>}
              <div className="flex justify-center gap-3 text-sm flex-wrap mb-8">
                <span className="badge bg-white/10 text-white/60 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {questions.length} questions
                </span>
                {quiz.timeLimit && (
                  <span className="badge bg-white/10 text-white/60 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {quiz.timeLimit} min
                  </span>
                )}
                {quiz.subject && <span className="badge badge-primary">{quiz.subject.name}</span>}
                <span className={DIFFICULTY_STYLES[quiz.difficulty]?.color || "badge"}>
                  {DIFFICULTY_STYLES[quiz.difficulty]?.label || quiz.difficulty}
                </span>
              </div>
              <button onClick={startQuiz}
                className="gradient-btn px-10 py-4 rounded-xl text-white font-bold text-base active:scale-95 transition-all shadow-lg shadow-primary/25">
                Commencer le quiz
              </button>
            </div>
          </motion.div>
        ) : (
          // Quiz in progress
          <div>
            {/* Header */}
            <div className="glass rounded-xl p-4 mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">{quiz.title}</p>
                <p className="text-xs text-white/40">{answeredCount}/{questions.length} répondues</p>
              </div>
              <div className="flex items-center gap-3">
                {timeLeft !== null && (
                  <span className={`flex items-center gap-1 text-sm font-mono px-3 py-1 rounded-lg ${
                    timeLeft <= 60 ? "bg-error/20 text-error" : "bg-white/10 text-white/60"
                  }`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(timeLeft)}
                  </span>
                )}
                <button onClick={handleSubmit} disabled={submitting}
                  className="gradient-btn px-5 py-2 rounded-lg text-white text-xs font-medium disabled:opacity-50 transition-all active:scale-95">
                  {submitting ? "Soumission..." : "Terminer"}
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-bar mb-6">
              <div className="progress-bar-fill gradient-btn" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
            </div>

            {/* Question nav pills */}
            <div className="flex gap-1.5 mb-6 flex-wrap">
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    i === current ? "gradient-btn text-white" :
                    answers[i] !== -1 ? "bg-success/20 text-success border border-success/30" : "glass text-white/40"
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.15 }}
              >
                <div className="glass-strong rounded-2xl p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="badge bg-primary/20 text-primary-light">Question {current + 1} / {questions.length}</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-6 leading-relaxed">{questions[current].question}</h3>
                  <div className="space-y-3">
                    {questions[current].options.map((opt, oi) => (
                      <button key={oi} onClick={() => selectAnswer(current, oi)}
                        className={`w-full text-left p-4 rounded-xl text-sm transition-all active:scale-[0.99] ${
                          answers[current] === oi
                            ? "gradient-btn text-white shadow-lg shadow-primary/20"
                            : "glass text-white/70 hover:bg-white/10 hover:text-white"
                        }`}>
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold mr-3 ${
                          answers[current] === oi ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
                        }`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}
                className="btn-ghost px-5 py-2.5 rounded-xl text-sm text-white/60 disabled:opacity-30 hover:text-white transition-all flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Précédente
              </button>
              <button onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))} disabled={current === questions.length - 1}
                className="gradient-btn px-5 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-30 transition-all flex items-center gap-1.5">
                Suivante
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
