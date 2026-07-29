import Link from 'next/link'
import { Bell } from 'lucide-react'

/** Bell + real unread badge, linking to the notifications page. No zero badge. */
export function HeaderNotifications({ unreadCount }: { unreadCount: number }) {
  const has = unreadCount > 0
  return (
    <Link
      href="/dashboard/notifications"
      aria-label={has ? `Njoftimet, ${unreadCount} të palexuara` : 'Njoftimet'}
      className="relative rounded-control p-2 text-ink-muted hover:bg-surface-sunken hover:text-ink"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {has && (
        <span className="absolute top-0 right-0 min-w-[1.1rem] h-[1.1rem] px-1 rounded-pill bg-danger text-white text-[10px] font-semibold grid place-items-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
