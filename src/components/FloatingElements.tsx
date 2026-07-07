"use client";

import { useEffect, useState } from "react";

interface FloatingItem {
  id: number;
  type: "book" | "cap" | "pencil" | "number" | "atom" | "star" | "scroll" | "map" | "tree" | "globe";
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  opacity: number;
  rotation: number;
  driftX: number;
  driftY: number;
}

function BookIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function CapIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function PencilIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function AtomIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <path d="M20.2 20.2c-4.5 4.5-11.9 4.5-16.4 0s-4.5-11.9 0-16.4" />
      <path d="M3.8 20.2c4.5 4.5 11.9 4.5 16.4 0s4.5-11.9 0-16.4" />
    </svg>
  );
}

function StarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ScrollIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function MapIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

function TreeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22v-8m0 0a4 4 0 004-4V8a4 4 0 00-8 0v2a4 4 0 004 4z" />
      <path d="M8 12a6 6 0 016-6" />
      <path d="M8 14a8 8 0 018-8" />
    </svg>
  );
}

function GlobeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function NumberIcon({ size, seed }: { size: number; seed: number }) {
  const nums = ["1", "2", "3", "A", "B", "C", "X", "Y", "π", "∑", "∞", "Δ"];
  const num = nums[seed % nums.length];
  return (
    <div className="flex items-center justify-center font-extrabold tracking-tight text-white/40" style={{ width: size, height: size, fontSize: size * 0.55 }}>
      {num}
    </div>
  );
}

export default function FloatingElements() {
  const [items, setItems] = useState<FloatingItem[]>([]);

  useEffect(() => {
    const types: FloatingItem["type"][] = [
      "book", "cap", "pencil", "number", "atom", "star", "scroll",
      "book", "cap", "pencil", "atom", "star", "map", "tree", "globe",
      "number", "scroll", "book", "cap", "tree", "map", "globe",
      "star", "atom", "pencil", "number", "scroll", "book", "cap", "star"
    ];
    const generated: FloatingItem[] = [];
    for (let i = 0; i < 35; i++) {
      generated.push({
        id: i,
        type: types[i % types.length],
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 14 + Math.random() * 32,
        speed: 25 + Math.random() * 45,
        delay: Math.random() * -50,
        opacity: 0.05 + Math.random() * 0.12,
        rotation: Math.random() * 360,
        driftX: -70 + Math.random() * 140,
        driftY: -50 + Math.random() * 100,
      });
    }
    setItems(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {items.map((item) => {
        const isCi = item.type === "tree" || item.type === "map";
        return (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              opacity: item.opacity,
              animation: `fe-float-${item.id % 5} ${item.speed}s ease-in-out ${item.delay}s infinite`,
              color: isCi
                ? item.id % 2 === 0 ? "#f77f00" : "#009e60"
                : item.id % 3 === 0
                  ? "var(--color-primary-light)"
                  : item.id % 3 === 1
                    ? "var(--color-accent-light)"
                    : "inherit",
            }}
          >
            <IconRenderer item={item} />
          </div>
        );
      })}
    </div>
  );
}

function IconRenderer({ item }: { item: FloatingItem }) {
  const size = item.size;
  switch (item.type) {
    case "book": return <BookIcon size={size} />;
    case "cap": return <CapIcon size={size} />;
    case "pencil": return <PencilIcon size={size} />;
    case "atom": return <AtomIcon size={size} />;
    case "star": return <StarIcon size={size} />;
    case "scroll": return <ScrollIcon size={size} />;
    case "map": return <MapIcon size={size} />;
    case "tree": return <TreeIcon size={size} />;
    case "globe": return <GlobeIcon size={size} />;
    case "number": return <NumberIcon size={size} seed={item.id} />;
    default: return <BookIcon size={size} />;
  }
}
