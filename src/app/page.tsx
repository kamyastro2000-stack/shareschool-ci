"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import { useEffect, useState, useRef, useCallback } from "react";

function ScrambleText({ words, className }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState(words[0]);
  const frameRef = useRef<number>(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let wordIndex = index;
    let iteration = 0;
    const target = words[wordIndex];
    const totalTicks = target.length * 2 + 10;

    const tick = () => {
      iteration++;
      if (iteration <= target.length) {
        setDisplay(
          target
            .split("")
            .map((c, i) => (i < iteration ? c : chars[Math.floor(Math.random() * chars.length)]))
            .join("")
        );
        frameRef.current = requestAnimationFrame(tick);
      } else if (iteration < totalTicks) {
        setDisplay(target);
        frameRef.current = requestAnimationFrame(tick);
      } else {
        const nextIndex = (wordIndex + 1) % words.length;
        wordIndex = nextIndex;
        setIndex(nextIndex);
        iteration = 0;
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    if (!startedRef.current) {
      startedRef.current = true;
      const timer = setTimeout(() => {
        frameRef.current = requestAnimationFrame(tick);
      }, 1500);
      return () => {
        clearTimeout(timer);
        cancelAnimationFrame(frameRef.current);
      };
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return <span className={className}>{display}</span>;
}

function MagneticButton({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({
      x: (e.clientX - cx) * 0.15,
      y: (e.clientY - cy) * 0.15,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      {children}
    </Link>
  );
}

function AnimatedCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number;
    let rafId: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [hasStarted, end, duration]);

  return <span ref={ref}>{count.toLocaleString("fr-FR")}</span>;
}

function BentoCard3D({ children, className, gradient }: { children: React.ReactNode; className?: string; gradient?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glare: 0, mx: 50, my: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rotateX: (0.5 - y) * 12,
      rotateY: (x - 0.5) * 12,
      glare: 0.18,
      mx: x * 100,
      my: y * 100,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setTilt({ rotateX: 0, rotateY: 0, glare: 0, mx: 50, my: 50 }), []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${className} bento-card-3d`}
      style={{
        transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateY(-4px)`,
        transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        className="bento-card-glare"
        style={{
          background: `radial-gradient(600px circle at ${tilt.mx}% ${tilt.my}%, ${gradient || "rgba(30,58,95,0.25)"}, transparent 40%)`,
          opacity: tilt.glare,
        }}
      />
      <div className="bento-card-border-light" style={{ opacity: tilt.glare * 0.6, left: `${tilt.mx}%`, top: `${tilt.my}%` }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

const stagger = {
  hidden: { opacity: 0 } as const,
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const features = [
  {
    title: "Partage de ressources",
    desc: "Déposez et accédez à des cours, exposés, devoirs et exercices en un clic.",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    bentoClass: "bento-icon",
    color: "from-primary/20",
  },
  {
    title: "Quiz interactifs",
    desc: "Créez et passez des QCM avec suivi des résultats et classement.",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    bentoClass: "bento-icon bento-icon-accent",
    color: "from-accent/20",
  },
  {
    title: "Gamification",
    desc: "Gagnez de l'XP, débloquez des badges et montez dans le classement.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    bentoClass: "bento-icon bento-icon-success",
    color: "from-success/20",
  },
  {
    title: "Chat par niveau",
    desc: "Discutez avec les élèves de votre classe dans des salons dédiés.",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    bentoClass: "bento-icon bento-icon-info",
    color: "from-blue-500/20",
  },
  {
    title: "Validation par les pairs",
    desc: "Les documents sont vérifiés par vos camarades avant publication.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    bentoClass: "bento-icon",
    color: "from-primary/20",
  },
  {
    title: "Espace établissement",
    desc: "Chaque école a son environnement privé, sécurisé et personnalisé.",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    bentoClass: "bento-icon bento-icon-ci",
    color: "from-ci-green/20",
  },
];

const steps = [
  { step: "01", title: "Créez votre compte", desc: "Inscrivez-vous avec votre établissement et votre classe. Recevez un code de vérification par email." },
  { step: "02", title: "Explorez & partagez", desc: "Accédez aux ressources de votre classe, déposez vos documents et participez aux quiz." },
  { step: "03", title: "Progressez ensemble", desc: "Gagnez des points, débloquez des badges et montez dans le classement !" },
];

export default function Home() {
  const [publicStats, setPublicStats] = useState({ students: 0, resources: 0, quizzes: 0, establishments: 0 });

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then((data) => setPublicStats(data))
      .catch(() => {});
  }, []);

  const stats = [
    { label: "Élèves actifs", end: publicStats.students, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" },
    { label: "Ressources partagées", end: publicStats.resources, icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { label: "Quiz complétés", end: publicStats.quizzes, icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
    { label: "Établissements", end: publicStats.establishments, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  ];

  return (
    <div className="min-h-screen">
      {/* ============ HERO ============ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080c14]" />

        {/* Hero orbs */}
        <div className="orb orb-primary" style={{ width: "600px", height: "600px", top: "5%", left: "-15%", animation: "glow-pulse 4s ease-in-out infinite" }} />
        <div className="orb orb-accent" style={{ width: "450px", height: "450px", bottom: "5%", right: "-10%", animation: "glow-pulse 5s ease-in-out infinite 1s" }} />
        <div className="orb orb-ci-green" style={{ width: "350px", height: "350px", top: "40%", left: "60%", animation: "glow-pulse 6s ease-in-out infinite 2s" }} />

        {/* CI flag decorative strip */}
        <div className="absolute top-20 left-0 right-0 flex justify-center z-10">
          <div className="flex gap-1 opacity-40">
            <div className="w-8 h-1 rounded-full bg-[#f77f00]" />
            <div className="w-8 h-1 rounded-full bg-white" />
            <div className="w-8 h-1 rounded-full bg-[#009e60]" />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-white/60 mb-6 border border-[#f77f00]/20">
                <span className="w-2 h-2 rounded-full bg-[#f77f00] animate-pulse" />
                <span className="gradient-text-ci font-medium">Côte d&apos;Ivoire</span>
                <span className="text-white/30">·</span>
                Plateforme éducative
              </motion.div>

              <motion.h1 variants={fadeUp} className="mega-title text-white mb-6">
                Partager pour{" "}
                <ScrambleText
                  words={["réussir", "apprendre", "progresser", "briller", "grandir"]}
                  className="gradient-text-full inline-block min-w-[6ch]"
                />
                <br />
                ensemble
              </motion.h1>

              <motion.p variants={fadeUp} className="mega-subtitle mx-auto lg:mx-0 mb-8">
                La première plateforme ivoirienne de mutualisation de cours, exposés et devoirs
                entre élèves. Chaque établissement dispose de son espace privé et sécurisé.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <MagneticButton
                  href="/register"
                  className="gradient-btn-ci px-8 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg shadow-[#009e60]/25 hover:shadow-[#009e60]/40 transition-shadow w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 group"
                >
                  Commencer gratuitement
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </MagneticButton>
                <MagneticButton
                  href="/login"
                  className="glass px-8 py-3.5 rounded-xl text-white font-semibold text-base hover:bg-white/10 transition-all w-full sm:w-auto text-center border border-white/10"
                >
                  Se connecter
                </MagneticButton>
              </motion.div>

              <motion.div variants={fadeUp} className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {["#f77f00", "#009e60", "#1e3a5f", "#c9a84c"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#080c14]" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-sm text-white/40">
                  {publicStats.students > 0
                    ? <>Rejoint par <span className="text-white/70 font-semibold">{publicStats.students.toLocaleString("fr-FR")}+</span> élèves</>
                    : "Plateforme en cours de déploiement"}
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f77f00]/15 via-[#009e60]/10 to-transparent rounded-3xl blur-3xl" />
                <div className="relative overflow-hidden rounded-2xl gradient-border-ci">
                  <motion.img
                    src="/images/Gemini_Generated_Image_vozoydvozoydvozo.png"
                    alt="Élèves ivoiriens en classe"
                    className="w-full h-auto object-cover"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-transparent"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.1 }}
                    className="absolute bottom-0 left-0 right-0 p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-white/70">
                        {publicStats.establishments > 0
                          ? `Côte d'Ivoire · ${publicStats.establishments} école${publicStats.establishments > 1 ? "s" : ""} connectée${publicStats.establishments > 1 ? "s" : ""}`
                          : "Côte d'Ivoire · Plateforme éducative"}
                      </span>
                    </div>
                    <div className="flex -space-x-2">
                      {["#f77f00", "#009e60", "#1e3a5f", "#c9a84c"].map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-[#080c14]" style={{ background: c }} />
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="premium-card gradient-border bg-gradient-to-br from-[#f77f00]/[0.03] to-[#009e60]/[0.03]"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {stats.map((stat, i) => (
                <motion.div key={i} variants={fadeUp} className="text-center">
                  <div className="bento-icon mx-auto mb-4">
                    <svg className="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                    </svg>
                  </div>
                  <p className="stat-value gradient-text-full">
                    <AnimatedCounter end={stat.end} />+
                  </p>
                  <p className="stat-label">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} className="section-title block mb-3">Fonctionnalités</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tout ce dont vous avez besoin
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-2xl mx-auto">
              Une plateforme complète pour la réussite scolaire des élèves ivoiriens
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeUp}>
                <BentoCard3D className="bg-gradient-to-br from-transparent to-white/[0.01]">
                  <div className={`${feature.bentoClass} mb-4`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
                </BentoCard3D>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ TRUSTED SCHOOLS ============ */}
      {publicStats.establishments > 0 && (
        <section className="relative py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="text-center mb-12"
            >
              <motion.span variants={fadeUp} className="section-title block mb-3">Ils nous font confiance</motion.span>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Nos établissements partenaires
              </motion.h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[...Array(Math.min(publicStats.establishments, 4))].map((_, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`bento-card text-center bg-gradient-to-b ${["from-[#f77f00]/20", "from-[#009e60]/20", "from-primary/20", "from-accent/20"][i % 4]} to-transparent`}
                >
                  <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold">Établissement {i + 1}</h3>
                  <p className="text-sm text-white/40 mt-1">Partenaire certifié</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ============ HOW IT WORKS ============ */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span variants={fadeUp} className="section-title block mb-3">Comment ça marche</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Prêt en 3 étapes
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-2xl mx-auto">
              Rejoindre ShareSchool CI et commencer à partager
            </motion.p>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-1/2 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-[#f77f00] via-[#009e60] to-[#1e3a5f] opacity-20 -translate-y-1/2" />

            <div className="grid sm:grid-cols-3 gap-6">
              {steps.map((item, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="bento-card text-center bg-gradient-to-b from-white/[0.02] to-transparent"
                >
                  <div className="w-14 h-14 rounded-2xl gradient-btn-ci flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white animate-float-3d">
                    {item.step}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="premium-card text-center relative overflow-hidden gradient-border-ci"
            style={{
              background: "linear-gradient(135deg, rgba(247,127,0,0.06), rgba(0,158,96,0.04), rgba(30,58,95,0.04))",
            }}
          >
            {/* CTA orbs */}
            <div className="orb orb-ci-orange" style={{ width: "400px", height: "400px", top: "-60%", right: "-25%" }} />
            <div className="orb orb-ci-green" style={{ width: "300px", height: "300px", bottom: "-60%", left: "-25%" }} />

            <div className="relative z-10">
              <motion.span variants={fadeUp} className="section-title block mb-3">Prêt à commencer ?</motion.span>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Rejoignez l&apos;aventure <span className="gradient-text-ci">ShareSchool</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-white/50 mb-8 max-w-lg mx-auto text-lg">
                {publicStats.students > 0
                  ? `Rejoignez ${publicStats.students.toLocaleString("fr-FR")}+ élèves ivoiriens qui partagent et apprennent ensemble.`
                  : "Rejoignez les élèves ivoiriens qui partagent et apprennent ensemble."}
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <MagneticButton
                  href="/register"
                  className="gradient-btn-ci px-8 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg shadow-[#009e60]/25 hover:shadow-[#009e60]/40 transition-shadow inline-flex items-center gap-2 group"
                >
                  Créer un compte gratuit
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </MagneticButton>
                <MagneticButton
                  href="/login"
                  className="glass px-8 py-3.5 rounded-xl text-white font-semibold text-base hover:bg-white/10 transition-all border border-white/10"
                >
                  J&apos;ai déjà un compte
                </MagneticButton>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-white/[0.05] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* CI Flag */}
          <div className="ci-flag-strip mb-12 max-w-xs mx-auto" />

          <div className="grid sm:grid-cols-4 gap-8 mb-12">
            <div className="sm:col-span-2">
              <Logo />
              <p className="text-sm text-white/40 mt-4 max-w-sm leading-relaxed">
                La plateforme ivoirienne de partage de ressources pédagogiques.
                Mutualisons nos connaissances pour une éducation de qualité.
              </p>
              <div className="flex items-center gap-3 mt-5">
                {["#f77f00", "#009e60", "#1e3a5f", "#c9a84c"].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg glass flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all hover:border-primary/30">
                    <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Plateforme</h4>
              <div className="space-y-2.5">
                {["Ressources", "Quiz", "Classement", "Discussion"].map((item) => (
                  <p key={item} className="text-sm text-white/40 hover:text-white/60 transition-colors cursor-default">{item}</p>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Contact</h4>
              <div className="space-y-2.5 text-sm text-white/40">
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f77f00]" />
                  support@shareschool.ci
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#009e60]" />
                  Abidjan, Côte d&apos;Ivoire
                </p>
                <p className="text-sm text-white/40 hover:text-white/60 transition-colors cursor-default flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  +225 XX XX XX XX
                </p>
              </div>
            </div>
          </div>
          <div className="section-divider" />
          <p className="text-center text-sm text-white/30 mt-8">
            ShareSchool CI © {new Date().getFullYear()} — Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}
