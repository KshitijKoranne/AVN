'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { href: '/dashboard', icon: 'home', label: 'Home' },
  { href: '/log', icon: 'edit_note', label: 'Log' },
  { href: '/exercises', icon: 'fitness_center', label: 'Exercises' },
  { href: '/trends', icon: 'query_stats', label: 'Trends' },
  { href: '/profile', icon: 'person', label: 'Profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="glass-nav fixed bottom-0 left-0 w-full z-50 rounded-t-[2rem] flex justify-around items-center pt-3 pb-8 px-2">
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 active:scale-90',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              {item.icon}
            </span>
            <span className="font-label text-[10px] uppercase tracking-wider mt-1">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
