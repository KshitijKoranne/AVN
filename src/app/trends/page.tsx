import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'

export default async function TrendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Last 30 days of pain logs
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const { data: logs } = await supabase
    .from('pain_logs')
    .select('log_date, intensity, locations, triggers')
    .eq('user_id', user.id)
    .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('log_date', { ascending: true })

  const logMap = new Map((logs ?? []).map(l => [l.log_date, l]))

  // Build 30-day array
  const days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    const dateStr = d.toISOString().split('T')[0]
    return {
      date: dateStr,
      label: d.toLocaleDateString('en', { day: 'numeric', month: 'short' }),
      shortLabel: d.toLocaleDateString('en', { weekday: 'narrow' }),
      log: logMap.get(dateStr) ?? null,
    }
  })

  const logged = days.filter(d => d.log !== null)
  const avgIntensity = logged.length > 0
    ? (logged.reduce((sum, d) => sum + (d.log?.intensity ?? 0), 0) / logged.length).toFixed(1)
    : null

  const maxIntensity = logged.length > 0
    ? Math.max(...logged.map(d => d.log?.intensity ?? 0))
    : null

  // Most common trigger
  const triggerCounts: Record<string, number> = {}
  logs?.forEach(l => {
    l.triggers?.forEach((t: string) => {
      triggerCounts[t] = (triggerCounts[t] ?? 0) + 1
    })
  })
  const topTrigger = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0]
    ?.replace(/_/g, ' ')

  return (
    <div className="min-h-screen bg-surface pb-36">
      <header className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold font-headline">Trends</h1>
        <p className="text-on-surface-variant font-label text-sm mt-1">Last 30 days</p>
      </header>

      <main className="px-6 space-y-6">

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container rounded-2xl p-4 text-center">
            <p className="text-3xl font-extrabold font-headline text-primary">
              {logged.length}
            </p>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
              Days logged
            </p>
          </div>
          <div className="bg-surface-container rounded-2xl p-4 text-center">
            <p className="text-3xl font-extrabold font-headline text-primary">
              {avgIntensity ?? '—'}
            </p>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
              Avg pain
            </p>
          </div>
          <div className="bg-surface-container rounded-2xl p-4 text-center">
            <p className="text-3xl font-extrabold font-headline text-primary">
              {maxIntensity ?? '—'}
            </p>
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
              Peak pain
            </p>
          </div>
        </div>

        {/* 30-day bar chart */}
        <div className="bg-surface-container rounded-2xl p-5">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-4">
            Pain intensity — 30 days
          </p>
          {logged.length === 0 ? (
            <p className="text-on-surface-variant text-sm font-label py-4 text-center">
              No data yet. Start logging your pain daily.
            </p>
          ) : (
            <div className="flex items-end gap-1 h-24">
              {days.map((day, i) => {
                const intensity = day.log?.intensity ?? 0
                const pct = intensity ? (intensity / 10) * 100 : 0
                const opacity = intensity ? 0.3 + (intensity / 10) * 0.7 : 0.1

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: `${Math.max(pct, intensity ? 8 : 4)}%`,
                        backgroundColor: `rgba(255, 200, 128, ${opacity})`,
                        minHeight: '3px',
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}
          {/* X axis labels — show every 5th */}
          <div className="flex items-center gap-1 mt-2">
            {days.map((day, i) => (
              <div key={i} className="flex-1 text-center">
                {i % 5 === 0 && (
                  <span className="font-label text-[8px] text-on-surface-variant">
                    {day.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top trigger */}
        {topTrigger && (
          <div className="bg-surface-container rounded-2xl p-5">
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
              Most common trigger
            </p>
            <p className="font-headline font-bold text-xl text-on-surface capitalize">
              {topTrigger}
            </p>
            <p className="font-label text-xs text-on-surface-variant mt-1">
              Appeared {triggerCounts[topTrigger.replace(/ /g, '_')] ?? triggerCounts[Object.keys(triggerCounts)[0]]} times this month
            </p>
          </div>
        )}

        {/* Logging streak */}
        <div className="bg-surface-container rounded-2xl p-5">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">
            Logging history
          </p>
          <div className="flex flex-wrap gap-1.5">
            {days.map((day, i) => (
              <div
                key={i}
                title={`${day.label}: ${day.log ? `Pain ${day.log.intensity}/10` : 'Not logged'}`}
                className="w-7 h-7 rounded-lg transition-colors"
                style={{
                  backgroundColor: day.log
                    ? `rgba(255, 200, 128, ${0.2 + (day.log.intensity / 10) * 0.8})`
                    : '#191e35'
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#191e35' }} />
              <span className="font-label text-[10px] text-on-surface-variant">Not logged</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(255,200,128,0.9)' }} />
              <span className="font-label text-[10px] text-on-surface-variant">High pain</span>
            </div>
          </div>
        </div>

      </main>

      <BottomNav />
    </div>
  )
}
