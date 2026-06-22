import { auth } from '@/lib/auth'
import DisclosurePage from '@/components/disclosure/disclosure-page'

export const metadata = {
  title: 'Privacy & Disclosure — Joyous Chat',
}

export default async function Page() {
  const session = await auth.api.getSession()
  return <DisclosurePage userName={session?.user?.name ?? 'Friend'} />
}
