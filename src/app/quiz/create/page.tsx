"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface QuestionInput {
  question: string;
  options: string[];
  correct: number;
}

export default function CreateQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [isGeneralCulture, setIsGeneralCulture] = useState(false);
  const [timeLimit, setTimeLimit] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { question: "", options: ["", "", "", ""], correct: 0 },
  ]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !["ADMIN", "TEACHER"].includes(session.user.role)) router.push("/dashboard");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/subjects").then(r => r.ok && r.json()).then(setSubjects).catch(() => {});
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correct: 0 }]);
  };

  const removeQuestion = (i: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i: number, field: keyof QuestionInput, value: string | number) => {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const q = [...questions];
    q[qi].options[oi] = value;
    setQuestions(q);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const valid = questions.every(q => q.question.trim() && q.options.every(o => o.trim()) && q.options.length >= 2);
    if (!valid || !title.trim()) {
      setError("Veuillez remplir tous les champs (titre, questions et options)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, subjectId: subjectId || undefined,
          isGeneralCulture, timeLimit: timeLimit || undefined, difficulty,
          questions: questions.map(q => ({
            question: q.question,
            options: q.options.filter(o => o.trim()),
            correct: q.correct,
          })),
        }),
      });

      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      router.push(`/quiz/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Nouveau quiz</h1>
              <p className="text-sm text-white/50">Créez un quiz pour vos élèves</p>
            </div>
          </div>

          {error && (
            <div className="glass border border-error/30 rounded-xl p-3 mb-6 flex items-center gap-2">
              <svg className="w-4 h-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Settings */}
            <div className="glass-strong rounded-2xl p-6 space-y-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                Paramètres
              </h2>
              <div>
                <label className="block text-sm text-white/70 mb-1.5 font-medium">Titre *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Ex: Quiz sur les fonctions linéaires" required />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1.5 font-medium">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field min-h-[60px] resize-none" placeholder="Description optionnelle" rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1.5 font-medium">Matière</label>
                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="select-field">
                    <option value="">Général</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5 font-medium">Temps (min)</label>
                  <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="input-field" placeholder="Optionnel" min="1" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1.5 font-medium">Difficulté</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="select-field">
                    <option value="EASY">Facile</option>
                    <option value="MEDIUM">Moyen</option>
                    <option value="HARD">Difficile</option>
                    <option value="LEGENDARY">Légendaire</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input type="checkbox" checked={isGeneralCulture} onChange={(e) => setIsGeneralCulture(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary focus:ring-primary" />
                <span className="text-sm text-white/70">Culture générale</span>
              </label>
            </div>

            {/* Questions */}
            {questions.map((q, qi) => (
              <motion.div key={qi} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-strong rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg gradient-btn flex items-center justify-center text-xs font-bold">
                      {qi + 1}
                    </span>
                    Question {qi + 1}
                  </h3>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qi)}
                      className="text-xs text-error/70 hover:text-error transition-colors flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="mb-4">
                  <input type="text" value={q.question} onChange={(e) => updateQuestion(qi, "question", e.target.value)}
                    className="input-field" placeholder="Entrez la question" required />
                </div>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-3">
                      <input type="radio" name={`correct-${qi}`} checked={q.correct === oi}
                        onChange={() => updateQuestion(qi, "correct", oi)}
                        className="w-4 h-4 text-primary bg-white/10 border-white/20 focus:ring-primary cursor-pointer" />
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-bold">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <input type="text" value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)}
                          className={`input-field pl-8 ${q.correct === oi ? "border-success/30" : ""}`}
                          placeholder={`Option ${oi + 1}`} required />
                      </div>
                      {q.correct === oi && (
                        <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  ))}
                  <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sélectionnez la bonne réponse avec le radio bouton
                  </p>
                </div>
              </motion.div>
            ))}

            <button type="button" onClick={addQuestion}
              className="w-full glass py-3.5 rounded-xl text-white/60 text-sm font-medium hover:bg-white/5 hover:text-white transition-all active:scale-[0.99] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter une question
            </button>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()}
                className="flex-1 glass py-3 rounded-xl text-white text-sm font-medium hover:bg-white/10 transition-all">
                Annuler
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 gradient-btn py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Créer le quiz
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
