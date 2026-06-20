'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Sparkles } from 'lucide-react'
import AccessibilityMenu from '@/components/accessibility/accessibility-menu'

const FULL_TEXT = "Welcome to Joyous Chat — your personal journaling companion."

export default function WelcomePage() {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(FULL_TEXT.slice(0, i))
      if (i >= FULL_TEXT.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, 38)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Settings button top right */}
      <div className="flex justify-end px-6 pt-6">
        <AccessibilityMenu />
      </div>

    <main
      id="main-content"
      className="flex-1 flex flex-col items-center justify-center px-6 pb-16"
      aria-label="Welcome to Joyous Chat"
    >
      {/* Logo mark */}
      <div
        className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
        aria-hidden="true"
      >
        <BookOpen className="h-9 w-9 text-primary" strokeWidth={1.5} />
      </div>

      {/* App name */}
      <p className="mb-4 text-sm font-semibold tracking-widest text-primary uppercase">
        Joyous Chat
      </p>

      {/* Typing headline */}
      <h1
        className={`mb-6 max-w-xl text-center text-3xl font-bold leading-snug text-foreground text-balance ${!done ? 'typing-cursor' : ''}`}
        aria-live="polite"
        aria-label={FULL_TEXT}
      >
        {displayed}
      </h1>

      {/* Subtitle */}
      <p className="mb-12 max-w-md text-center text-base text-muted-foreground leading-relaxed text-pretty">
        AI-crafted prompts, personalised to your personality, goals, and growth journey — one entry at a time.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6" role="group" aria-label="Account options">
        <Link
          href="/sign-up"
          className="inline-flex min-w-[160px] items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-base font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Sign Up
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex min-w-[160px] items-center justify-center rounded-xl border-2 border-primary px-8 py-4 text-base font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary"
        >
          Sign In
        </Link>
      </div>

      {/* Decorative tagline */}
      <p className="mt-16 text-xs text-muted-foreground">
        Private. Secure. Just for you.
      </p>
    </main>
    </div>
  )
}
