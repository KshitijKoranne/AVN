'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import { clsx } from 'clsx'
import type { PainLocation, PainTrigger, PainRelief } from '@/types/database'

// ─── Data ──────────────────────────────────────────────────

const PAIN_LOCATIONS: { id: PainLocation; label: string }[] = [
  { id: 'left_groin',   label: 'Left Groin' },
  { id: 'right_groin',  label: 'Right Groin' },
  { id: 'left_buttock', label: 'Left Buttock' },
  { id: 'right_buttock',label: 'Right Buttock' },
  { id: 'left_thigh',   label: 'Left Thigh' },
  { id: 'right_thigh',  label: 'Right Thigh' },
  { id: 'left_knee',    label: 'Left Knee' },
  { id: 'right_knee',   label: 'Right Knee' },
  { id: 'left_shoulder',label: 'Left Shoulder' },
  { id: 'right_shoulder',label:'Right Shoulder' },
  { id: 'left_wrist',   label: 'Left Wrist' },
  { id: 'right_wrist',  label: 'Right Wrist' },
  { id: 'other',        label: 'Other' },
]

const TRIGGERS: { id: PainTrigger; label: string }[] = [
  { id: 'walking',    label: 'Walking' },
  { id: 'stairs',     label: 'Stairs' },
  { id: 'sitting',    label: 'Sitting' },
  { id: 'standing',   label: 'Standing' },
  { id: 'lying_down', label: 'Lying down' },
  { id: 'weather',    label: 'Weather' },
  { id: 'nothing',    label: 'Nothing' },
  { id: 'other',      label: 'Other' },
]

const RELIEF: { id: PainRelief; label: string }[] = [
  { id: 'rest',          label: 'Rest' },
  { id: 'ice',           label: 'Ice' },
  { id: 'heat',          label: 'Heat' },
  { id: 'medication',    label: 'Medication' },
  { id: 'elevation',     label: 'Elevation' },
  { id: 'physiotherapy', label: 'Physiotherapy' },
  { id: 'nothing',       label: 'Nothing' },
]

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Barely noticeable', 2: 'Very mild', 3: 'Mild',
  4: 'Uncomfortable', 5: 'Moderate', 6: 'Distressing',
  7: 'Severe', 8: 'Very severe', 9: 'Excruciating', 10: 'Worst possible'
}

// ─── Component ─────────────────────────────────────────────

export default function LogPage() {
  const router = useRouter()
  const supabase = createClient()

  const [locations, setLocations] = useState<PainLocation[]>([])
  const [intensity, setIntensity] = useState(5)
  const [triggers, setTriggers] = useState<PainTrigger[]>([])
  const [relief, setRelief] = useState<PainRelief[]>([])
  const [postSurgical, setPostSurgical] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }

  async function handleSave() {
    if (locations.length === 0) {
      setError('Please select at least one pain location.')
      return
    }

    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: insertError } = await (supabase.from('pain_logs') as any).insert({
      user_id: user.id,
      locations,
      intensity,
      triggers,
      relief,
      post_surgical_pain: postSurgical,
      notes: notes.trim() || null,
      log_date: new Date().toISOString().split('T')[0],
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="min-h-screen bg-surface pb-36">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav px-6 h-16 flex items-center justify-between">
        <div>
          <p className="font-headline text-base font-semibold text-primary">Log Pain</p>
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
            {today}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-xl">close</span>
        </button>
      </header>

      <main className="px-6 pt-6 space-y-8 max-w-lg mx-auto">

        {/* Location */}
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-bold font-headline">Location</h2>
            <span className="text-xs font-label text-on-surface-variant">Select all that apply</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PAIN_LOCATIONS.map(loc => (
              <button
                key={loc.id}
                onClick={() => setLocations(prev => toggle(prev, loc.id))}
                className={clsx(
                  'px-4 py-2 rounded-full font-label text-sm transition-all duration-200',
                  locations.includes(loc.id) ? 'chip-selected' : 'chip-unselected'
                )}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </section>

        {/* Intensity */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold font-headline">Intensity</h2>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-extrabold text-primary font-headline">{intensity}</span>
              <span className="text-sm font-label text-on-surface-variant mb-1">/ 10</span>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-6 space-y-4">
            <input
              type="range"
              min={1}
              max={10}
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              className="pain-slider w-full h-3 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] font-label text-on-surface-variant tracking-widest">
              <span>MILD</span>
              <span>MODERATE</span>
              <span>SEVERE</span>
            </div>
            <p className="text-center text-sm text-on-surface-variant font-label">
              {INTENSITY_LABELS[intensity]}
            </p>
          </div>
        </section>

        {/* Triggers */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-headline">What triggered it?</h2>
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map(t => (
              <button
                key={t.id}
                onClick={() => setTriggers(prev => toggle(prev, t.id))}
                className={clsx(
                  'px-4 py-2 rounded-full font-label text-sm transition-all duration-200',
                  triggers.includes(t.id) ? 'chip-selected' : 'chip-unselected'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Relief */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-headline">What helped?</h2>
          <div className="flex flex-wrap gap-2">
            {RELIEF.map(r => (
              <button
                key={r.id}
                onClick={() => setRelief(prev => toggle(prev, r.id))}
                className={clsx(
                  'px-4 py-2 rounded-full font-label text-sm transition-all duration-200',
                  relief.includes(r.id) ? 'chip-selected' : 'chip-unselected'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </section>

        {/* Post-surgical toggle */}
        <section>
          <button
            onClick={() => setPostSurgical(!postSurgical)}
            className="w-full flex items-center justify-between bg-surface-container rounded-2xl px-6 py-4"
          >
            <div className="text-left">
              <p className="font-headline font-semibold text-sm text-on-surface">
                Post-surgical joint pain?
              </p>
              <p className="font-label text-xs text-on-surface-variant mt-0.5">
                Flag if the pain is from a surgically treated joint
              </p>
            </div>
            <div className={clsx(
              'w-12 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0',
              postSurgical ? 'bg-primary-container' : 'bg-surface-container-high'
            )}>
              <div className={clsx(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
                postSurgical ? 'translate-x-7' : 'translate-x-1'
              )} />
            </div>
          </button>
        </section>

        {/* Notes */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold font-headline">Anything else today?</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Sleep quality, mobility changes, mood, weather..."
            className="w-full bg-surface-container-lowest rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] font-body text-sm resize-none"
          />
        </section>

        {/* Error */}
        {error && (
          <p className="text-error text-sm font-label">{error}</p>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-primary to-primary-container py-5 rounded-2xl text-on-primary font-label font-bold tracking-widest text-sm uppercase shadow-lg shadow-primary/20 disabled:opacity-50 transition-opacity active:scale-[0.98]"
        >
          {saving ? 'Saving...' : "Save Today's Log"}
        </button>

      </main>

      <BottomNav />
    </div>
  )
}
