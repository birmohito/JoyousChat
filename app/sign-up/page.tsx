import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SignUpForm from '@/components/auth/sign-up-form'

export const metadata = {
  title: 'Sign Up — Joyous Chat',
}

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/archive')
  return <SignUpForm />
}
