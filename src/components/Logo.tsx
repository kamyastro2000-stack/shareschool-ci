import Link from "next/link";

interface LogoProps {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  link?: boolean;
}

export default function Logo({ showText = true, size = "md", link = true }: LogoProps) {
  const iconSizes = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-12 h-12" };
  const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  const content = (
    <div className="flex items-center gap-2.5 group">
      <div className={`relative ${iconSizes[size]} flex-shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#f77f00] to-[#009e60] rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#f77f00] to-[#009e60] rounded-xl opacity-30 blur-md group-hover:opacity-50 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light to-primary rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105">
          <svg viewBox="0 0 24 24" className="w-4/5 h-4/5 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold text-white ${textSizes[size]} tracking-tight`}>
            Share<span className="gradient-text">School</span>
          </span>
          <span className="text-[0.6rem] font-medium tracking-widest uppercase -mt-0.5 flex items-center gap-1">
            <span style={{ color: "#f77f00" }}>Côte</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>d&apos;</span>
            <span style={{ color: "#009e60" }}>Ivoire</span>
          </span>
        </div>
      )}
    </div>
  );

  if (link) {
    return <Link href="/">{content}</Link>;
  }

  return content;
}
