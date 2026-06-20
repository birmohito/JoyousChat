'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Eye, EyeOff, BookOpen, AlertCircle, ArrowLeft } from 'lucide-react'
import AccessibilityMenu from '@/components/accessibility/accessibility-menu'

export default function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? 'Invalid email or password. Please try again.')
      } else {
        router.push('/archive')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar with back + settings */}
      <div className="flex items-center justify-between px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
          aria-label="Go back to welcome page"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <AccessibilityMenu />
      </div>

      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
            <BookOpen className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <p className="block mb-1 text-sm font-semibold tracking-widest text-primary uppercase">
            Joyous Chat
          </p>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your journey</p>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" aria-live="assertive" className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              disabled={loading}
              aria-required="true"
            />
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                disabled={loading}
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary rounded"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Keep signed in */}
          <div className="flex items-center gap-3">
            <input
              id="keep-signed-in"
              type="checkbox"
              checked={keepSignedIn}
              onChange={e => setKeepSignedIn(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
            />
            <label htmlFor="keep-signed-in" className="text-sm text-foreground select-none cursor-pointer">
              Keep me signed in
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed"
            aria-busy={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <Link
            href="/archive"
            className="w-full inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3.5 text-base font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary mt-3"
          >
            Continue as guest
          </Link>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/sign-up" className="font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary">
            Sign up
          </Link>
        </p>
      </div>
      </main>
    </div>
  )
}
