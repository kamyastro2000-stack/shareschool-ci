"use client";

import { motion } from "framer-motion";

interface ResourceCardProps {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  author: { firstName: string; lastName: string; role: string };
  subject?: { name: string } | null;
  classe?: {
    name: string;
    level: { name: string };
    series?: { name: string } | null;
  } | null;
  fileUrl: string;
  createdAt: string;
  validations?: { id: string; createdAt: string; validator: { firstName: string; lastName: string } }[];
  onValidate?: (id: string, action: string) => void;
  showActions?: boolean;
  index?: number;
}

const typeIcons: Record<string, string> = {
  PDF: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  DOC: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  PPT: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  IMAGE: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
};

const typeColors: Record<string, string> = {
  PDF: "bg-error/20 text-error border-error/20",
  DOC: "bg-info/20 text-info border-info/20",
  PPT: "bg-accent/20 text-accent border-accent/20",
  IMAGE: "bg-success/20 text-success border-success/20",
};

export default function ResourceCard({
  id,
  title,
  description,
  type,
  status,
  author,
  subject,
  classe,
  fileUrl,
  createdAt,
  validations,
  onValidate,
  showActions,
  index = 0,
}: ResourceCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "APPROVED":
        return <span className="badge badge-success">Publié</span>;
      case "PENDING":
        return <span className="badge badge-warning">En attente</span>;
      case "REJECTED":
        return <span className="badge badge-error">Rejeté</span>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`hidden sm:flex w-12 h-12 rounded-xl items-center justify-center flex-shrink-0 border ${typeColors[type] || "bg-white/10 text-white/60 border-white/10"}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[type] || typeIcons.PDF} />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {getStatusBadge()}
              <span className={`badge ${typeColors[type] || "bg-white/10 text-white/60"}`}>
                {type}
              </span>
              {subject && (
                <span className="badge badge-primary">{subject.name}</span>
              )}
            </div>

            <h3 className="text-white font-semibold text-base mb-1 leading-snug">
              {title}
            </h3>

            {description && (
              <p className="text-sm text-white/50 line-clamp-2 mb-3 leading-relaxed">
                {description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-white/40 flex-wrap">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {author.firstName} {author.lastName}
              </span>
              {classe && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {classe.level.name}{classe.series?.name ? " " + classe.series.name : ""} {classe.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-btn-ci px-4 py-2 rounded-lg text-white text-xs font-medium whitespace-nowrap inline-flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir
            </a>

            {showActions && onValidate && status === "PENDING" && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => onValidate(id, "APPROVED")}
                  className="px-3 py-1.5 rounded-lg bg-[#009e60]/15 text-[#009e60] text-xs font-medium hover:bg-[#009e60]/25 transition-all active:scale-95"
                >
                  Approuver
                </button>
                <button
                  onClick={() => onValidate(id, "REJECTED")}
                  className="px-3 py-1.5 rounded-lg bg-error/15 text-error text-xs font-medium hover:bg-error/25 transition-all active:scale-95"
                >
                  Rejeter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {validations && validations.length > 0 && (
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02]">
          <p className="text-xs text-white/30 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Validé par {validations[0].validator.firstName} {validations[0].validator.lastName} le{" "}
            {new Date(validations[0].createdAt).toLocaleDateString("fr-FR")}
          </p>
        </div>
      )}
    </motion.div>
  );
}
