import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import QuestionnairePage from '@/components/questionnaire/questionnaire-page'

export const metadata = {
  title: 'Personality Assessment — Joyous Chat',
}

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  return <QuestionnairePage userName={session?.user?.name ?? 'Guest'} />
}
