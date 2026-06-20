import Link from 'next/link'
import { BookOpen, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Forgot Password — Joyous Chat',
}

export default function ForgotPasswordPage() {
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
          <BookOpen className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Password reset is coming soon. For now, please contact support or create a new account.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Sign In
        </Link>
      </div>
    </main>
  )
}
