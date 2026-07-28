import { Landmark, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfficialSourceLabelProps {
  /** Institution or dataset name, e.g. "ASK" or "Eurostat, nama_10_co3_p3". */
  source: string
  url?: string | null
  className?: string
}

/**
 * Labels a fact with its official source and, when available, a link to it.
 * The platform must never hide the source of official information.
 */
export function OfficialSourceLabel({ source, url, className }: OfficialSourceLabelProps) {
  const inner = (
    <>
      <Landmark className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">
        <span className="text-ink-subtle">Burim zyrtar: </span>
        {source}
      </span>
      {url && <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />}
    </>
  )
  const base = 'inline-flex items-center gap-1.5 text-xs max-w-full'
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, 'text-link hover:underline', className)}
      >
        {inner}
      </a>
    )
  }
  return <span className={cn(base, 'text-ink-muted', className)}>{inner}</span>
}
