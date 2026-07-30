import Link from 'next/link'
import { Building2, Rocket, Compass } from 'lucide-react'

export function DashboardIndividualCta() {
  return (
    <section className="rounded-card border border-line bg-surface-sunken p-6">
      <h2 className="text-lg font-semibold text-ink mb-2">Ke biznes ose ide biznesi?</h2>
      <p className="text-sm text-ink-muted mb-4 max-w-xl">Me llogari biznesi merr grante të përzgjedhura për sektorin tënd, panaire, udhëzues eksporti, profil në Rrjetin e bizneseve dhe lidhje me blerës nga diaspora.</p>
      <div className="flex flex-wrap gap-2">
        {[{ label: 'Biznes Kosovar', icon: Building2 }, { label: 'Start Up', icon: Rocket }, { label: 'Diaspora', icon: Compass }].map((r) => {
          const Icon = r.icon
          return <span key={r.label} className="inline-flex items-center gap-1.5 rounded-pill bg-surface border border-line px-3 py-1.5 text-sm font-medium text-ink"><Icon className="h-4 w-4" aria-hidden="true" /> {r.label}</span>
        })}
      </div>
      <p className="text-xs text-ink-subtle mt-3">Regjistrohu me email tjetër te <Link href="/register" className="text-link hover:underline font-medium">faqja e regjistrimit</Link> dhe zgjidh rolin që të përshtatet.</p>
    </section>
  )
}
