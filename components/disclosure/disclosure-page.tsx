'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, FileText, ChevronDown, ChevronUp, BookOpen, Brain, CheckCircle2, ArrowLeft } from 'lucide-react'
import AccessibilityMenu from '@/components/accessibility/accessibility-menu'

interface Props {
  userName: string
}

function ExpandableSection({
  title,
  icon: Icon,
  children,
  id,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  id: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-muted/50 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span className="flex-1 text-base font-semibold text-foreground">{title}</span>
        {open
          ? <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          : <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        }
      </button>
      {open && (
        <div
          id={id}
          className="px-6 pb-6 pt-2 text-sm text-foreground leading-relaxed space-y-3 border-t border-border"
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default function DisclosurePage({ userName }: Props) {
  const router = useRouter()
  const [privacyRead, setPrivacyRead] = useState(false)
  const [dataRead, setDataRead] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const canProceed = privacyRead && dataRead && agreed

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6">
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
          aria-label="Go back to sign up"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <AccessibilityMenu />
      </div>

    <main id="main-content" className="flex-1 flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
            <Shield className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Before we begin, {userName.split(' ')[0]}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Please read and acknowledge the following information. Click each section to read the full details before proceeding.
          </p>
        </div>

        {/* Expandable sections */}
        <div className="space-y-4 mb-8">
          <ExpandableSection
            title="Privacy Policy"
            icon={Shield}
            id="privacy-policy-content"
          >
            <p className="font-semibold text-foreground">Last updated: June 2025</p>

            <p>Joyous Chat (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.</p>

            <p><strong>1. Information We Collect</strong><br />
            We collect your name, email address, and the journal entries and questionnaire responses you create within the app.</p>

            <p><strong>2. How We Use Your Information</strong><br />
            Your data is used solely to provide and improve the journaling service — including generating personalised prompts and maintaining your journal archive. We do not sell, share, or lease your personal information to third parties.</p>

            <p><strong>3. Data Storage</strong><br />
            Your data is stored securely on Neon PostgreSQL servers with encryption at rest and in transit. Sessions are managed via Better Auth with secure, HTTP-only cookies.</p>

            <p><strong>4. AI Processing</strong><br />
            To generate personalised prompts, anonymised portions of your questionnaire responses may be processed via the OpenAI API. Journal entry content is not sent to AI services unless you explicitly request AI follow-up prompts.</p>

            <p><strong>5. Your Rights</strong><br />
            You have the right to access, correct, or delete your personal data at any time. Contact us through the app settings to exercise these rights.</p>

            <p><strong>6. Cookies</strong><br />
            We use session cookies solely for authentication. We do not use tracking or advertising cookies.</p>

            <p><strong>7. Retention</strong><br />
            Your data is retained for as long as your account is active. Deleting your account permanently removes all associated data.</p>

            <button
              type="button"
              onClick={() => setPrivacyRead(true)}
              className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary ${privacyRead ? 'bg-accent text-accent-foreground cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
              aria-pressed={privacyRead}
            >
              {privacyRead && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              {privacyRead ? 'Acknowledged' : 'I have read the Privacy Policy'}
            </button>
          </ExpandableSection>

          <ExpandableSection
            title="Personal Information Collection"
            icon={FileText}
            id="data-collection-content"
          >
            <p><strong>What we collect and why:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Name & Email</strong> — to identify your account and personalise your experience.</li>
              <li><strong>Personality questionnaire responses</strong> — to tailor journaling prompts to your unique personality type, motivational style, and goals.</li>
              <li><strong>Journal entries</strong> — stored securely so you can revisit, search, and reflect on your growth over time.</li>
              <li><strong>Device/session metadata</strong> — IP address and user agent, collected by Better Auth for security purposes only.</li>
            </ul>

            <p><strong>Legal basis for processing:</strong><br />
            We process your data under the legal basis of contract (to provide the service you signed up for) and legitimate interest (to improve service quality). You may withdraw consent at any time by deleting your account.</p>

            <p><strong>Third-party processors:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Neon Inc. (database hosting)</li>
              <li>Vercel Inc. (application hosting)</li>
              <li>OpenAI (AI prompt generation — anonymised data only)</li>
            </ul>

            <p><strong>Data minimisation:</strong><br />
            We collect only what is necessary. You are never required to share sensitive personal information such as health data, financial information, or government identifiers.</p>

            <button
              type="button"
              onClick={() => setDataRead(true)}
              className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary ${dataRead ? 'bg-accent text-accent-foreground cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
              aria-pressed={dataRead}
            >
              {dataRead && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              {dataRead ? 'Acknowledged' : 'I have read the Data Collection Policy'}
            </button>
          </ExpandableSection>

          {/* What comes next */}
          <div className="rounded-xl border border-border bg-card px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/50" aria-hidden="true">
                <Brain className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground mb-1">What happens next</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After agreeing, you will complete a brief <strong className="text-foreground">personality assessment and questionnaire</strong> (10 - 15 minutes). Your answers help our AI understand your personality type, motivational drivers, and journaling goals — so every prompt feels written just for you. Your responses are stored privately and you can retake the assessment at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement checkbox */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4">
          <input
            id="agree"
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
            aria-required="true"
          />
          <label htmlFor="agree" className="text-sm text-foreground leading-relaxed cursor-pointer">
            I have read and understood the Privacy Policy and Personal Information Collection disclosure. I consent to Joyous Chat collecting and processing my data as described.
          </label>
        </div>

        {/* Status message for incomplete state */}
        {!canProceed && (
          <p role="status" aria-live="polite" className="mb-4 text-center text-sm text-muted-foreground">
            {!privacyRead || !dataRead
              ? 'Please open and acknowledge both policy sections above before continuing.'
              : !agreed
                ? 'Please check the agreement box to continue.'
                : ''}
          </p>
        )}

        <button
          type="button"
          onClick={() => router.push('/questionnaire')}
          disabled={!canProceed}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary disabled:opacity-40 disabled:cursor-not-allowed"
          aria-disabled={!canProceed}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          Continue to Personality Assessment
        </button>
      </div>
    </main>
    </div>
  )
}
