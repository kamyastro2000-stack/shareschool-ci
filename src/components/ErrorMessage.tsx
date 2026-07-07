export default function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="animate-fade-in glass border border-error/30 rounded-xl p-4 flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p className="text-sm text-error">{message}</p>
    </div>
  );
}
