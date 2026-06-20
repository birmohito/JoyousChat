import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import DisclosurePage from '@/components/disclosure/disclosure-page'

export const metadata = {
  title: 'Privacy & Disclosure — Joyous Chat',
}

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  return <DisclosurePage userName={session?.user?.name ?? 'Friend'} />
}
