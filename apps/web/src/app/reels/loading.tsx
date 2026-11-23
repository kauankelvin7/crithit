export default function ReelsLoading() {
  return (
    <div
      data-chrome="dark"
      aria-busy="true"
      aria-label="Carregando feed CritHit Reels 9:16"
      className="min-h-[calc(100dvh-64px)] bg-[var(--scrim-reels)] text-white"
    >
      <div className="border-b border-white/10 bg-chrome/95 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="editorial-skeleton h-8 w-20 rounded bg-chrome-surface" />
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl items-center justify-center px-2 py-4 sm:px-4">
        <div className="editorial-skeleton h-[calc(100dvh-152px)] w-full max-w-[430px] rounded-lg border-2 border-white/15 bg-chrome-surface sm:h-[min(820px,calc(100dvh-160px))]" />
      </div>
    </div>
  );
}
