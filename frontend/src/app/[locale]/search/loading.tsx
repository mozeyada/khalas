import {SiteShell} from '@/components/site-shell';

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] p-6 shadow-card">
      {/* Category badge */}
      <div className="mb-4 h-6 w-20 rounded-full bg-black/8" />
      {/* Name */}
      <div className="mb-2 h-5 w-3/4 rounded-xl bg-black/8" />
      {/* Location */}
      <div className="mb-4 h-4 w-1/2 rounded-xl bg-black/5" />
      {/* Description lines */}
      <div className="mb-1 h-3 w-full rounded-xl bg-black/5" />
      <div className="mb-6 h-3 w-5/6 rounded-xl bg-black/5" />
      {/* CTA */}
      <div className="h-11 w-full rounded-2xl bg-teal/15" />
    </div>
  );
}

export default function SearchLoading() {
  return (
    <SiteShell>
      {/* Search bar skeleton */}
      <div className="mb-8 animate-pulse overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-1)] shadow-float">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="h-5 w-5 rounded-full bg-black/10" />
          <div className="h-5 flex-1 rounded-xl bg-black/8" />
          <div className="h-9 w-20 rounded-full bg-teal/20" />
        </div>
        <div className="flex gap-3 px-5 py-4">
          <div className="h-4 w-32 rounded-xl bg-black/8" />
          <div className="h-4 w-16 rounded-full bg-black/5" />
          <div className="h-4 w-16 rounded-full bg-black/5" />
          <div className="h-4 w-16 rounded-full bg-black/5" />
        </div>
      </div>

      {/* Result cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({length: 6}).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </SiteShell>
  );
}
