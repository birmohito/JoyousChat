import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getJournalEntries } from '@/app/actions/journal'
import ArchivePage from '@/components/archive/archive-page'

export const metadata = {
  title: 'Journal Archive — Joyous Chat',
}

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userName = session?.user?.name ?? 'Guest'

  const entries = await getJournalEntries()
  return <ArchivePage initialEntries={entries} userName={userName} />
}
