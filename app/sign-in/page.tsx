import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import SignInForm from '@/components/auth/sign-in-form'

export const metadata = {
  title: 'Sign In — Joyous Chat',
}

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/archive')
  return <SignInForm />
}
