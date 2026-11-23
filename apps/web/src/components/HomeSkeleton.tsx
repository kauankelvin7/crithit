export default function HomeLoading() {
  return (
    <div aria-busy="true" aria-label="Carregando capa editorial CritHit!" className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* Skeleton da dobra principal */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard">
            <div className="editorial-skeleton aspect-[16/9] w-full bg-surface-alt" />
            <div className="space-y-3 p-6">
              <div className="editorial-skeleton h-5 w-32 rounded bg-surface-alt" />
              <div className="editorial-skeleton h-10 w-5/6 rounded bg-surface-alt" />
              <div className="editorial-skeleton h-4 w-full rounded bg-surface-alt" />
              <div className="editorial-skeleton h-4 w-3/4 rounded bg-surface-alt" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded border-2 border-border-strong bg-surface shadow-hard-sm"
              >
                <div className="editorial-skeleton aspect-video w-full bg-surface-alt" />
                <div className="space-y-2 p-3.5">
                  <div className="editorial-skeleton h-4 w-20 rounded bg-surface-alt" />
                  <div className="editorial-skeleton h-5 w-full rounded bg-surface-alt" />
                  <div className="editorial-skeleton h-4 w-2/3 rounded bg-surface-alt" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="overflow-hidden rounded border-2 border-border-strong bg-chrome shadow-hard">
            <div className="editorial-skeleton aspect-[4/5] w-full bg-chrome-surface" />
          </div>
          <div className="space-y-3 rounded border-2 border-border-strong bg-surface p-4 shadow-hard">
            <div className="editorial-skeleton h-6 w-44 rounded bg-surface-alt" />
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3 rounded border border-border-subtle bg-surface-alt p-3">
                <div className="editorial-skeleton h-20 w-20 shrink-0 rounded bg-surface" />
                <div className="flex-1 space-y-2">
                  <div className="editorial-skeleton h-4 w-16 rounded bg-surface" />
                  <div className="editorial-skeleton h-4 w-full rounded bg-surface" />
                  <div className="editorial-skeleton h-4 w-2/3 rounded bg-surface" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
