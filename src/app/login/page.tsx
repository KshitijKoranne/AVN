'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email to confirm your account.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      {/* Logo / Brand */}
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-on-primary text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            monitor_heart
          </span>
        </div>
        <h1 className="text-2xl font-bold font-headline text-on-surface tracking-tight">
          AVN Track
        </h1>
        <p className="text-sm text-on-surface-variant mt-1 font-label">
          Your daily pain and recovery companion
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm bg-surface-container rounded-2xl p-8 space-y-6">
        <h2 className="text-lg font-semibold font-headline text-on-surface">
          {isSignUp ? 'Create account' : 'Sign in'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-label uppercase tracking-widest text-on-surface-variant">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface-container-lowest rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="Minimum 6 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-error font-label">{error}</p>
          )}

          {message && (
            <p className="text-sm text-primary font-label">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-container py-4 rounded-xl text-on-primary font-label font-bold tracking-widest text-sm uppercase disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
          className="w-full text-center text-sm text-on-surface-variant font-label hover:text-primary transition-colors"
        >
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}
