import { Info } from 'lucide-react'

export function DashboardRestricted() {
  return (
    <div className="flex items-start gap-3 rounded-card border border-warning-line bg-warning-soft p-4">
      <Info className="h-5 w-5 shrink-0 text-warning-ink mt-0.5" aria-hidden="true" />
      <p className="text-sm text-warning-ink">
        Faqja që kërkove është për llogaritë e biznesit. Si Individ ke qasje në lajme, udhëzuesit bazë dhe konsultime.
        Nëse ke biznes ose ide biznesi, regjistrohu me llogari të re si Biznes Kosovar, Start Up ose Diaspora.
      </p>
    </div>
  )
}
