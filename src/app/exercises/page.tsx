'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import { clsx } from 'clsx'
import type { Database } from '@/types/database'

type Exercise = Database['public']['Tables']['exercises_library']['Row']
type ExerciseLog = { exercise_id: string; skipped: boolean }

export default function ExercisesPage() {
  const supabase = createClient()

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [todayLogs, setTodayLogs] = useState<ExerciseLog[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: lib }, { data: logs }] = await Promise.all([
        supabase
          .from('exercises_library')
          .select('*')
          .eq('is_active', true)
          .order('order_index'),
        supabase
          .from('exercise_logs')
          .select('exercise_id, skipped')
          .eq('user_id', user.id)
          .eq('log_date', today),
      ])

      setExercises(lib ?? [])
      setTodayLogs(logs ?? [])
      setLoading(false)
    }
    load()
  }, [today])

  async function markDone(exercise: Exercise, skipped = false) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Upsert — remove existing log for this exercise today then insert
    await supabase
      .from('exercise_logs')
      .delete()
      .eq('user_id', user.id)
      .eq('exercise_id', exercise.id)
      .eq('log_date', today)

    await supabase.from('exercise_logs').insert({
      user_id: user.id,
      exercise_id: exercise.id,
      log_date: today,
      sets_completed: skipped ? null : exercise.default_sets,
      reps_completed: skipped ? null : exercise.default_reps,
      duration_s: skipped ? null : exercise.default_duration_s,
      skipped,
      skip_reason: skipped ? 'user_skipped' : null,
    })

    // Update local state
    setTodayLogs(prev => {
      const filtered = prev.filter(l => l.exercise_id !== exercise.id)
      return [...filtered, { exercise_id: exercise.id, skipped }]
    })
  }

  const doneCount = todayLogs.filter(l => !l.skipped).length
  const progress = exercises.length > 0 ? (doneCount / exercises.length) * 100 : 0

  const categoryLabel: Record<string, string> = {
    post_thr: 'Post Total Hip Replacement',
    general_avn: 'General AVN Management',
    pre_surgical: 'Pre-Surgical',
    all: 'All Patients',
  }

  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const key = ex.category ?? 'all'
    if (!acc[key]) acc[key] = []
    acc[key].push(ex)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant font-label text-sm">Loading exercises...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-36">
      {/* Header */}
      <header className="px-6 pt-14 pb-2">
        <h1 className="text-2xl font-bold font-headline">Exercises</h1>
        <p className="text-on-surface-variant font-label text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </header>

      {/* Progress */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Today's progress
          </span>
          <span className="font-label text-xs text-primary">
            {doneCount} / {exercises.length} done
          </span>
        </div>
        <div className="w-full bg-surface-container-high rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="px-6 space-y-8 mt-2">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-3">
              {categoryLabel[category] ?? category}
            </p>

            <div className="space-y-3">
              {items.map(exercise => {
                const log = todayLogs.find(l => l.exercise_id === exercise.id)
                const isDone = log && !log.skipped
                const isSkipped = log?.skipped
                const isExpanded = expanded === exercise.id

                return (
                  <div
                    key={exercise.id}
                    className={clsx(
                      'rounded-2xl overflow-hidden transition-colors duration-200',
                      isDone ? 'bg-primary/10 border border-primary/20' :
                      isSkipped ? 'bg-surface-container opacity-60' :
                      'bg-surface-container'
                    )}
                  >
                    {/* Exercise header row */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : exercise.id)}
                      className="w-full flex items-center gap-4 p-5 text-left"
                    >
                      {/* Done indicator */}
                      <div className={clsx(
                        'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-colors',
                        isDone ? 'bg-primary border-primary' :
                        'border-outline/30 bg-transparent'
                      )}>
                        {isDone && (
                          <span className="material-symbols-outlined text-on-primary text-base"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            check
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'font-headline font-semibold text-sm',
                          isDone ? 'text-primary' : 'text-on-surface'
                        )}>
                          {exercise.name}
                        </p>
                        <p className="font-label text-xs text-on-surface-variant mt-0.5 truncate">
                          {exercise.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {exercise.default_sets && exercise.default_reps && (
                          <span className="font-label text-xs text-on-surface-variant">
                            {exercise.default_sets}×{exercise.default_reps}
                          </span>
                        )}
                        {exercise.default_duration_s && (
                          <span className="font-label text-xs text-on-surface-variant">
                            {exercise.default_duration_s}s
                          </span>
                        )}
                        <span className="material-symbols-outlined text-on-surface-variant text-base">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded instructions */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-outline/10 pt-4">
                        {/* Warning */}
                        <div className="flex items-start gap-2 bg-primary/5 rounded-xl p-3">
                          <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">
                            warning
                          </span>
                          <p className="font-label text-xs text-primary">
                            {exercise.warning}
                          </p>
                        </div>

                        {/* Instructions */}
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                          {exercise.instructions}
                        </p>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => markDone(exercise, false)}
                            className={clsx(
                              'flex-1 py-3 rounded-xl font-label font-bold text-xs uppercase tracking-widest transition-colors',
                              isDone
                                ? 'bg-primary/20 text-primary'
                                : 'bg-gradient-to-r from-primary to-primary-container text-on-primary'
                            )}
                          >
                            {isDone ? 'Completed' : 'Mark Done'}
                          </button>

                          {!isDone && (
                            <button
                              onClick={() => markDone(exercise, true)}
                              className="px-4 py-3 rounded-xl bg-surface-container-high font-label text-xs text-on-surface-variant uppercase tracking-widest"
                            >
                              Skip
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {/* Motivational footer */}
        <p className="text-center text-xs font-label text-on-surface-variant pb-4">
          Consistency beats intensity. Every rep counts.
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
