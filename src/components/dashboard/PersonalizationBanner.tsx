import Link from 'next/link'
import { SlidersHorizontal, Plus } from 'lucide-react'

interface Props {
  /** True when the personalization filter is active for this render. */
  active: boolean
  /** Human-readable Albanian label, e.g. "Druri dhe mobilje, TIK". */
  label: string
  /** True when the user has at least one sector picked. */
  hasSector: boolean
  /** Path of the current list page, e.g. `/dashboard/fairs`. */
  pathname: string
  /** Existing query params to preserve on toggle links. */
  preserveParams?: Record<string, string | undefined>
}

// Sits at the top of each filterable list. Two states:
//
//  - Active: a subtle indicator "Po filtron sipas sektorit tënd: X · [hiq filtrin]".
//    Clicking the pill toggles `?all=1` to show everything from this URL only
//    (no persisted preference).
//  - Override on (?all=1): a "Shfaq vetëm sektorin tim" pill that re-enables the filter.
//
// If the user has no sector yet, nudges them to pick one.
export function PersonalizationBanner({ active, label, hasSector, pathname, preserveParams }: Props) {
  if (!hasSector) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        Zgjidh industrinë te{' '}
        <Link href="/dashboard/settings" className="text-[#2E86C1] font-medium hover:underline">Cilësimet</Link>
        {' '}që KBH t&apos;i përshtasë mundësitë me biznesin tënd.
      </div>
    )
  }

  if (active) {
    const offHref = buildHref(pathname, { ...(preserveParams || {}), all: '1' })
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#1B4F72]/15 bg-[#1B4F72]/5 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <SlidersHorizontal className="h-4 w-4 text-[#1B4F72] shrink-0" />
          <p className="text-sm text-gray-700 min-w-0">
            Po filtron sipas sektorit tënd:{' '}
            <span className="font-semibold text-[#1B4F72]">{label}</span>
          </p>
        </div>
        <Link
          href={offHref}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-[#2E86C1] hover:text-[#1B4F72]"
        >
          <Plus className="h-3 w-3" />
          Shfaq edhe sektorë të tjerë
        </Link>
      </div>
    )
  }

  // Override active (showing everything): offer a way back.
  const onHref = buildHref(pathname, { ...(preserveParams || {}), all: undefined })
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <SlidersHorizontal className="h-4 w-4 text-gray-400 shrink-0" />
        <p className="text-sm text-gray-600 min-w-0">
          Po sheh të gjithë sektorët.{' '}
          <span className="text-gray-400">Sektori yt: {label}.</span>
        </p>
      </div>
      <Link
        href={onHref}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#1B4F72] bg-[#1B4F72] px-3 py-1 text-xs font-medium text-white hover:bg-[#2E86C1]"
      >
        Shfaq vetëm sektorin tim
      </Link>
    </div>
  )
}

function buildHref(pathname: string, params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v && v.length)
  if (entries.length === 0) return pathname
  return pathname + '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
}
