import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch last 7 pain logs for the trend mini chart
  const { data: recentLogsRaw } = await supabase
    .from('pain_logs')
    .select('log_date, intensity')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false })
    .limit(7)

  const recentLogs = recentLogsRaw as { log_date: string; intensity: number }[] | null

  // Check if logged today
  const today = new Date().toISOString().split('T')[0]
  const loggedToday = recentLogs?.some(l => l.log_date === today)

  // Last log entry
  const lastLog = recentLogs?.[0]

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Header */}
      <header className="px-6 pt-14 pb-6">
        <p className="text-on-surface-variant font-label text-sm">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </p>
        <h1 className="text-2xl font-bold font-headline mt-1">
          {greeting}, {firstName}
        </h1>
      </header>

      <main className="px-6 space-y-4">

        {/* Today's log status */}
        {!loggedToday ? (
          <Link href="/log">
            <div className="bg-primary-container/20 border border-primary/20 rounded-2xl p-6 flex items-center justify-between group hover:bg-primary-container/30 transition-colors">
              <div>
                <p className="font-label text-xs uppercase tracking-widest text-primary mb-1">
                  Not logged today
                </p>
                <p className="font-headline font-semibold text-on-surface">
                  How is your pain today?
                </p>
              </div>
              <span className="material-symbols-outlined text-primary text-3xl group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </Link>
        ) : (
          <div className="bg-surface-container rounded-2xl p-6">
            <p className="font-label text-xs uppercase tracking-widest text-primary mb-1">
              Logged today
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-4xl font-extrabold font-headline text-primary">
                {lastLog?.intensity}
              </span>
              <span className="text-on-surface-variant font-label mb-1">/ 10</span>
            </div>
            <Link href="/log" className="text-xs font-label text-on-surface-variant mt-2 inline-block hover:text-primary transition-colors">
              Update today's log →
            </Link>
          </div>
        )}

        {/* 7-day pain summary */}
        <div className="bg-surface-container rounded-2xl p-6">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-4">
            Last 7 days
          </p>
          {recentLogs && recentLogs.length > 0 ? (
            <div className="flex items-end gap-2 h-16">
              {/* Simple bar chart — 7 days */}
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (6 - i))
                const dateStr = date.toISOString().split('T')[0]
                const log = recentLogs.find(l => l.log_date === dateStr)
                const intensity = log?.intensity ?? 0
                const height = intensity ? Math.max((intensity / 10) * 100, 8) : 4

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-full transition-all"
                      style={{
                        height: `${height}%`,
                        backgroundColor: intensity
                          ? `rgba(255, 200, 128, ${0.3 + (intensity / 10) * 0.7})`
                          : '#191e35',
                        minHeight: '4px'
                      }}
                    />
                    <span className="text-[9px] font-label text-on-surface-variant">
                      {date.toLocaleDateString('en', { weekday: 'narrow' })}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm font-label">
              Start logging to see your pain trends here.
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/exercises">
            <div className="bg-surface-container rounded-2xl p-5 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-primary text-2xl mb-3 block"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                fitness_center
              </span>
              <p className="font-headline font-semibold text-sm text-on-surface">Exercises</p>
              <p className="font-label text-xs text-on-surface-variant mt-1">Today's routine</p>
            </div>
          </Link>

          <Link href="/trends">
            <div className="bg-surface-container rounded-2xl p-5 hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-primary text-2xl mb-3 block"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                query_stats
              </span>
              <p className="font-headline font-semibold text-sm text-on-surface">Trends</p>
              <p className="font-label text-xs text-on-surface-variant mt-1">Pain patterns</p>
            </div>
          </Link>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
