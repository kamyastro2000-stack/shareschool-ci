"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoSent = useRef(false);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError("");

    const res = await fetch("/api/verify-email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setResending(false);

    if (res.ok) {
      setCooldown(30);
      if (data.devCode) {
        setDevCode(data.devCode);
        setSuccess("Mode développement — utilisez le code affiché ci-dessous.");
      } else {
        setSuccess("Nouveau code envoyé ! Vérifiez votre email.");
      }
      setTimeout(() => setSuccess(""), 6000);
    } else {
      setError(data.error || "Erreur lors du renvoi");
    }
  }, [cooldown, email]);

  useEffect(() => {
    if (email && !autoSent.current) {
      autoSent.current = true;
      const t = setTimeout(() => handleResend(), 500);
      return () => clearTimeout(t);
    }
  }, [email, handleResend]);

  const handleChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[i] = value.slice(-1);
    setCode(newCode);
    if (value && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) { setError("Entrez le code complet à 6 chiffres"); return; }
    setError("");
    setLoading(true);

    const res = await fetch("/api/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: fullCode }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setSuccess("Email vérifié ! Connexion en cours...");

      const pending = sessionStorage.getItem("pendingVerification");
      let storedPassword = "";
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          if (parsed.email === email) storedPassword = parsed.password;
        } catch {}
        sessionStorage.removeItem("pendingVerification");
      }

      if (storedPassword) {
        const result = await signIn("credentials", {
          email,
          password: storedPassword,
          redirect: false,
        });
        if (result?.ok) {
          router.push("/dashboard");
          router.refresh();
          return;
        }
      }

      setLoading(false);
      setSuccess("Email vérifié ! Vous pouvez maintenant vous connecter.");
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setError(data.error || "Code incorrect");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo link={false} />
        </div>
        <h1 className="text-2xl font-bold text-white">Vérification</h1>
        <p className="text-sm text-white/50 mt-1">
          Un code à 6 chiffres a été envoyé à
        </p>
        <p className="text-sm text-[#f77f00] font-medium mt-0.5">{email || "votre email"}</p>
      </div>

      {devCode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass border border-[#f77f00]/30 rounded-xl p-4 mb-6 text-center"
        >
          <p className="text-xs text-white/40 mb-1">🔧 Mode développement — Code de vérification</p>
          <p className="text-3xl font-bold tracking-[0.25em] text-[#f77f00]">{devCode}</p>
          <p className="text-xs text-white/30 mt-1">Ce code n&apos;est affiché qu&apos;en développement</p>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass border border-error/30 rounded-xl p-3 mb-6">
          <p className="text-sm text-error text-center">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass border border-[#009e60]/30 rounded-xl p-4 mb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[#009e60]/20 flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-[#009e60]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-[#009e60] font-medium">{success}</p>
        </motion.div>
      )}

      {!email ? (
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Votre email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="exemple@email.com" required />
          </div>
          <button onClick={handleResend} disabled={resending || !email}
            className="w-full gradient-btn-ci py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50">
            {resending ? "Envoi..." : "Envoyer le code"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {code.map((digit, i) => (
              <input key={i} ref={(el) => { inputRefs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold text-white bg-white/5 border border-white/10 rounded-xl focus:border-[#f77f00] focus:outline-none focus:ring-2 focus:ring-[#f77f00]/20 transition-all"
                autoFocus={i === 0} />
            ))}
          </div>

          <button type="submit" disabled={loading || code.join("").length !== 6}
            className="w-full gradient-btn-ci py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all active:scale-[0.98]">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vérification...
              </span>
            ) : "Vérifier"}
          </button>

          <div className="text-center">
            <button type="button" onClick={handleResend} disabled={resending || cooldown > 0}
              className="text-sm text-white/50 hover:text-[#f77f00] transition-colors disabled:opacity-30">
              {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : resending ? "Envoi..." : "Renvoyer le code"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-white/50">
          <Link href="/login" className="text-[#f77f00] hover:text-[#009e60] transition-colors font-medium">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid" />
      <div className="ci-flag-strip absolute top-24 left-1/2 -translate-x-1/2 max-w-xs opacity-30" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-[#f77f00]/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-[#009e60]/12 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-strong rounded-2xl p-8 border border-white/10 shadow-2xl">
          <Suspense fallback={
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f77f00] to-[#009e60] flex items-center justify-center text-white font-bold text-sm">SC</div>
              </div>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            </div>
          }>
            <VerifyContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
