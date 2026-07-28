import { cn } from '@/lib/utils'

/**
 * A loading placeholder. Uses a subtle pulse that is disabled under
 * prefers-reduced-motion (see globals.css).
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-control bg-surface-sunken', className)}
      {...props}
    />
  )
}

/** A card-shaped skeleton for grid/list loading states. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Duke u ngarkuar"
      className={cn('rounded-card border border-line bg-surface p-4 space-y-3', className)}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-control" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  )
}
