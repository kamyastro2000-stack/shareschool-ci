export default function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="animate-fade-in glass border border-[#009e60]/30 rounded-xl p-4 flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[#009e60]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-[#009e60]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm text-[#009e60]">{message}</p>
    </div>
  );
}
