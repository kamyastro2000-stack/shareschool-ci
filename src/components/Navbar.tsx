"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/verify-email";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isAuthPage) return null;
  const isHomePage = pathname === "/";

  const user = session?.user;
  const role = user?.role;
  const isPlayer = role !== "TEACHER" && role !== "ADMIN";

  const roleBadge = () => {
    const labels: Record<string, string> = {
      STUDENT: "Élève",
      CLASS_REP: "Chef de classe",
      TEACHER: "Professeur",
      ADMIN: "Administrateur",
    };
    const colors: Record<string, string> = {
      STUDENT: "badge-info",
      CLASS_REP: "badge-success",
      TEACHER: "badge-accent",
      ADMIN: "badge-primary",
    };
    return <span className={`badge ${colors[role || "STUDENT"]}`}>{labels[role || "STUDENT"]}</span>;
  };

  const navLinks = () => {
    const links: { href: string; label: string; icon: string }[] = [
      { href: "/dashboard", label: "Tableau de bord", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    ];
    if (isPlayer) {
      links.push({ href: "/profil", label: "Mon profil", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" });
      links.push({ href: "/classement", label: "Classement", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" });
    }
    links.push({ href: "/quiz", label: "Quiz", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" });
    links.push({ href: "/chat", label: "Discussion", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" });
    if (role === "ADMIN") {
      links.push({ href: "/admin", label: "Administration", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" });
      links.push({ href: "/quiz/create", label: "Créer un quiz", icon: "M12 4v16m8-8H4" });
    }
    if (role === "TEACHER") {
      links.push({ href: "/quiz/create", label: "Créer un quiz", icon: "M12 4v16m8-8H4" });
    }
    return links;
  };

  const isActiveLink = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className={isHomePage ? "" : "glass border-b border-white/[0.06]"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="sm" />

            {!isHomePage && user && (
              <div className="flex items-center gap-3">
                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                  {navLinks().slice(0, 4).map((link) => {
                    const isActive = isActiveLink(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                          isActive
                            ? "bg-primary/20 text-primary-light"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                        </svg>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                {/* User section */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    {isPlayer && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#f77f00]/15 to-[#009e60]/15 border border-[#f77f00]/20">
                        <svg className="w-3.5 h-3.5 text-[#f77f00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-xs font-bold text-[#f77f00]">{user.totalXP || 0} XP</span>
                      </div>
                    )}
                  </div>

                  {/* Mobile menu button */}
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden w-9 h-9 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {showMobileMenu
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      }
                    </svg>
                  </button>

                  {/* Profile button */}
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="w-9 h-9 rounded-xl gradient-btn-ci flex items-center justify-center text-white text-sm font-bold hover:shadow-lg hover:shadow-[#009e60]/25 transition-all active:scale-95"
                    >
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </button>

                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-64 glass-strong rounded-xl shadow-2xl z-20 overflow-hidden"
                        >
                          {/* User info */}
                          <div className="p-4 border-b border-white/10">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl gradient-btn-ci flex items-center justify-center text-white font-bold text-sm">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">
                                  {user.firstName} {user.lastName}
                                </p>
                                <p className="text-xs text-white/40 truncate">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {roleBadge()}
                              {isPlayer && (
                                <span className="badge badge-accent flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Niv. {user.level || 1}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Nav links */}
                          <div className="p-2 space-y-0.5">
                            {navLinks().map((link) => {
                              const isActive = isActiveLink(link.href);
                              return (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  onClick={() => { setShowMenu(false); setShowMobileMenu(false); }}
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                                    isActive
                                      ? "bg-primary/15 text-primary-light"
                                      : "text-white/70 hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                                  </svg>
                                  {link.label}
                                </Link>
                              );
                            })}
                          </div>

                          {/* Logout */}
                          <div className="p-2 border-t border-white/10">
                            <button
                              onClick={() => { setShowMenu(false); signOut({ callbackUrl: "/login" }); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-error/80 hover:bg-error/10 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Déconnexion
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {showMobileMenu && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="glass border-b border-white/[0.06] md:hidden overflow-hidden"
          >
            <div className="p-3 space-y-0.5">
              {navLinks().map((link) => {
                const isActive = isActiveLink(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-primary/15 text-primary-light"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
