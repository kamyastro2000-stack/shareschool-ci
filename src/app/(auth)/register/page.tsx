"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

interface Level {
  id: string;
  name: string;
  order: number;
  series: { id: string; name: string }[];
}

interface Classe {
  id: string;
  name: string;
  levelId: string;
  seriesId: string | null;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
}

const steps = [
  { num: 1, label: "Informations" },
  { num: 2, label: "Classe" },
  { num: 3, label: "Confirmation" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [establishmentSlug, setEstablishmentSlug] = useState("");
  const [levelId, setLevelId] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [classId, setClassId] = useState("");
  const [classRepCode, setClassRepCode] = useState("");

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/establishments");
      if (res.ok) setEstablishments(await res.json());
    }
    load();
  }, []);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/classes/levels");
      if (res.ok) setLevels(await res.json());
    }
    load();
  }, []);

  const selectedLevel = useMemo(() => levelId ? levels.find(l => l.id === levelId) || null : null, [levelId, levels]);
  const availableSeries = useMemo(() => selectedLevel?.series || [], [selectedLevel]);

  useEffect(() => { setSeriesId(""); setClassId(""); }, [levelId]);

  useEffect(() => {
    if (!levelId || !establishmentSlug) return;
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams({ levelId });
      if (seriesId) params.set("seriesId", seriesId);
      const res = await fetch(`/api/classes?${params.toString()}`);
      if (res.ok && !cancelled) setClasses(await res.json());
    }
    setClasses([]);
    load();
    return () => { cancelled = true; };
  }, [levelId, seriesId, establishmentSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName, lastName, email, password, establishmentSlug, classId,
          classRepCode: classRepCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      if (data.requiresVerification) {
        sessionStorage.setItem("pendingVerification", JSON.stringify({ email: data.email, password }));
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        setSuccess("Compte créé avec succès ! Bienvenue sur ShareSchool.");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  const canGoNext = (s: number) => {
    if (s === 1) return establishmentSlug && firstName && lastName && email && password;
    if (s === 2) return !!classId;
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid" />
      <div className="ci-flag-strip absolute top-24 left-1/2 -translate-x-1/2 max-w-xs opacity-30" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#f77f00]/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#009e60]/12 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-strong rounded-2xl p-8 shadow-2xl border border-white/10">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Logo link={false} />
            </div>
            <h1 className="text-2xl font-bold text-white">Inscription</h1>
            <p className="text-sm text-white/50 mt-1">
              Rejoignez votre établissement sur ShareSchool
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step >= s.num ? "gradient-btn-ci text-white shadow-lg shadow-[#009e60]/25" : "glass text-white/40"
                  }`}>
                    {step > s.num ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.num}
                  </div>
                  <span className={`text-xs hidden sm:block ${step >= s.num ? "text-white/70" : "text-white/30"}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${step > s.num ? "bg-[#009e60]" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass border border-error/30 rounded-xl p-3 mb-4 flex items-start gap-2"
            >
              <svg className="w-4 h-4 text-error flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-error">{error}</p>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass border border-success/30 rounded-xl p-6 mb-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">Compte créé !</p>
              <p className="text-sm text-success">{success}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Établissement</label>
                    <select
                      value={establishmentSlug}
                      onChange={(e) => setEstablishmentSlug(e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="">Sélectionnez votre établissement</option>
                      {establishments.map((est) => (
                        <option key={est.id} value={est.slug}>{est.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Prénom</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="input-field"
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Nom</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="input-field"
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Email</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-field pl-10"
                        placeholder="exemple@email.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Mot de passe</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Au moins 8 caractères"
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canGoNext(1)}
                    className="w-full gradient-btn-ci py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Niveau</label>
                    <select
                      value={levelId}
                      onChange={(e) => setLevelId(e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="">Sélectionnez votre niveau</option>
                      {levels.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  {availableSeries.length > 0 && (
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5 font-medium">Série</label>
                      <select
                        value={seriesId}
                        onChange={(e) => setSeriesId(e.target.value)}
                        className="select-field"
                        required
                      >
                        <option value="">Sélectionnez votre série</option>
                        {availableSeries.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">Classe</label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="select-field"
                      required
                    >
                      <option value="">Sélectionnez votre classe</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {selectedLevel?.name} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1.5 font-medium">
                      Code chef de classe <span className="text-white/30">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={classRepCode}
                      onChange={(e) => setClassRepCode(e.target.value)}
                      className="input-field"
                      placeholder="Si vous avez un code, saisissez-le"
                    />
                    <p className="text-xs text-white/30 mt-1">Si vous possédez un code chef de classe, saisissez-le pour obtenir le rôle</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 glass py-3 rounded-xl text-white font-semibold text-sm hover:bg-white/10 transition-all"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!canGoNext(2)}
                      className="flex-1 gradient-btn-ci py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="glass rounded-xl p-5 space-y-3">
                    <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#009e60]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Vérifiez vos informations
                    </h3>
                    <div className="space-y-2.5 text-sm">
                      {[
                        { label: "Prénom & Nom", value: `${firstName} ${lastName}` },
                        { label: "Email", value: email },
                        { label: "Établissement", value: establishments.find(e => e.slug === establishmentSlug)?.name },
                        { label: "Classe", value: `${selectedLevel?.name} ${seriesId ? availableSeries.find(s => s.id === seriesId)?.name + " " : ""}${classes.find(c => c.id === classId)?.name}` },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-white/50">{item.label}</span>
                          <span className="text-white font-medium text-right max-w-[60%] truncate">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 glass py-3 rounded-xl text-white font-semibold text-sm hover:bg-white/10 transition-all"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 gradient-btn-ci py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Inscription...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                          Créer mon compte
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary-light hover:text-primary transition-colors font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
