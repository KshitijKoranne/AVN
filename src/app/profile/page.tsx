'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import BottomNav from '@/components/BottomNav'
import { clsx } from 'clsx'
import type { AffectedJoint, AVNStage, Gender } from '@/types/database'

const JOINTS: { id: AffectedJoint; label: string }[] = [
  { id: 'left_hip',       label: 'Left Hip' },
  { id: 'right_hip',      label: 'Right Hip' },
  { id: 'left_knee',      label: 'Left Knee' },
  { id: 'right_knee',     label: 'Right Knee' },
  { id: 'left_shoulder',  label: 'Left Shoulder' },
  { id: 'right_shoulder', label: 'Right Shoulder' },
  { id: 'left_wrist',     label: 'Left Wrist' },
  { id: 'right_wrist',    label: 'Right Wrist' },
  { id: 'left_ankle',     label: 'Left Ankle' },
  { id: 'right_ankle',    label: 'Right Ankle' },
]

const STAGES: { id: AVNStage; label: string; desc: string }[] = [
  { id: 'unknown',  label: 'Unknown',  desc: "I don't know my stage" },
  { id: 'stage_1',  label: 'Stage 1',  desc: 'Normal X-ray, visible on MRI' },
  { id: 'stage_2',  label: 'Stage 2',  desc: 'Sclerosis visible on X-ray' },
  { id: 'stage_3',  label: 'Stage 3',  desc: 'Crescent sign / bone collapse' },
  { id: 'stage_4',  label: 'Stage 4',  desc: 'Joint space narrowing, arthritis' },
]

const CAUSES = [
  { id: 'steroid_use',  label: 'Steroid use' },
  { id: 'alcohol',      label: 'Alcohol use' },
  { id: 'trauma',       label: 'Trauma / injury' },
  { id: 'sickle_cell',  label: 'Sickle cell disease' },
  { id: 'covid',        label: 'Post-COVID' },
  { id: 'idiopathic',   label: 'Unknown / Idiopathic' },
  { id: 'other',        label: 'Other' },
]

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [country, setCountry] = useState('')
  const [diagnosisDate, setDiagnosisDate] = useState('')
  const [stage, setStage] = useState<AVNStage>('unknown')
  const [cause, setCause] = useState('')
  const [affectedJoints, setAffectedJoints] = useState<AffectedJoint[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name ?? '')
        setDob(profile.date_of_birth ?? '')
        setGender((profile.gender as Gender) ?? '')
        setCountry(profile.country ?? '')
        setDiagnosisDate(profile.diagnosis_date ?? '')
        setStage((profile.avascular_stage as AVNStage) ?? 'unknown')
        setCause(profile.primary_cause ?? '')
        setAffectedJoints((profile.affected_joints as AffectedJoint[]) ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  function toggleJoint(joint: AffectedJoint) {
    setAffectedJoints(prev =>
      prev.includes(joint) ? prev.filter(j => j !== joint) : [...prev, joint]
    )
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update({
      full_name: fullName,
      date_of_birth: dob || null,
      gender: gender || null,
      country: country || null,
      diagnosis_date: diagnosisDate || null,
      avascular_stage: stage,
      primary_cause: cause || null,
      affected_joints: affectedJoints,
      onboarding_done: true,
    }).eq('id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant font-label text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-36">
      <header className="px-6 pt-14 pb-4">
        <h1 className="text-2xl font-bold font-headline">Profile</h1>
        <p className="text-on-surface-variant font-label text-sm mt-1">
          Your medical details
        </p>
      </header>

      <main className="px-6 space-y-8 max-w-lg mx-auto">

        {/* Personal */}
        <section className="space-y-4">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Personal
          </p>

          <div className="space-y-3">
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full bg-surface-container rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-body"
            />
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full bg-surface-container rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-body"
            />
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="Country"
              className="w-full bg-surface-container rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-body"
            />
            <select
              value={gender}
              onChange={e => setGender(e.target.value as Gender)}
              className="w-full bg-surface-container rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-body"
            >
              <option value="">Gender (optional)</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </section>

        {/* Diagnosis */}
        <section className="space-y-4">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Diagnosis
          </p>

          <div className="space-y-3">
            <div>
              <label className="font-label text-xs text-on-surface-variant mb-2 block">
                Date of diagnosis
              </label>
              <input
                type="date"
                value={diagnosisDate}
                onChange={e => setDiagnosisDate(e.target.value)}
                className="w-full bg-surface-container rounded-xl px-5 py-4 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-body"
              />
            </div>

            <div>
              <label className="font-label text-xs text-on-surface-variant mb-2 block">
                Primary cause
              </label>
              <div className="flex flex-wrap gap-2">
                {CAUSES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCause(c.id)}
                    className={clsx(
                      'px-4 py-2 rounded-full font-label text-sm transition-all',
                      cause === c.id ? 'chip-selected' : 'chip-unselected'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Affected joints */}
        <section className="space-y-4">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Affected joints
          </p>
          <div className="flex flex-wrap gap-2">
            {JOINTS.map(j => (
              <button
                key={j.id}
                onClick={() => toggleJoint(j.id)}
                className={clsx(
                  'px-4 py-2 rounded-full font-label text-sm transition-all',
                  affectedJoints.includes(j.id) ? 'chip-selected' : 'chip-unselected'
                )}
              >
                {j.label}
              </button>
            ))}
          </div>
        </section>

        {/* AVN Stage */}
        <section className="space-y-4">
          <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            AVN Stage (Ficat Classification)
          </p>
          <div className="space-y-2">
            {STAGES.map(s => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={clsx(
                  'w-full flex items-center justify-between rounded-2xl px-5 py-4 transition-all text-left',
                  stage === s.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'bg-surface-container'
                )}
              >
                <div>
                  <p className={clsx(
                    'font-headline font-semibold text-sm',
                    stage === s.id ? 'text-primary' : 'text-on-surface'
                  )}>
                    {s.label}
                  </p>
                  <p className="font-label text-xs text-on-surface-variant mt-0.5">
                    {s.desc}
                  </p>
                </div>
                {stage === s.id && (
                  <span className="material-symbols-outlined text-primary text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-primary to-primary-container py-5 rounded-2xl text-on-primary font-label font-bold tracking-widest text-sm uppercase disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 rounded-2xl bg-surface-container text-on-surface-variant font-label text-sm uppercase tracking-widest hover:bg-surface-container-high transition-colors"
        >
          Sign Out
        </button>

      </main>

      <BottomNav />
    </div>
  )
}
