import { auth } from '@/lib/auth'
import QuestionnairePage from '@/components/questionnaire/questionnaire-page'

export const metadata = {
  title: 'Journaling Preferences — Joyous Chat',
}

export default async function Page() {
  const session = await auth.api.getSession()
  return <QuestionnairePage userName={session?.user?.name ?? 'Guest'} />
}
