export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-10 h-10 border-2 border-[#f77f00]/30 border-t-[#009e60] rounded-full animate-spin" />
      {text && <p className="text-sm text-white/50">{text}</p>}
    </div>
  );
}
