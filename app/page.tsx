import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import WelcomePage from '@/components/welcome/welcome-page'

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/archive')
  return <WelcomePage />
}
