import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getJournalEntry, getQuestionnaireResponses, type QuestionnaireResponses } from '@/app/actions/journal'
import JournalChat from '@/components/journal/journal-chat'

export const metadata = {
  title: 'Journal — Joyous Chat',
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession()
  const { id } = await params
  const [entry, questionnaire] = await Promise.all([
    getJournalEntry(id),
    getQuestionnaireResponses(),
  ])

  const safeEntry =
    entry ?? {
      id,
      title: 'Sample journal entry',
      prompt:
        'What is one small kindness you can offer yourself today? Describe it and how it would make you feel.',
      response: '',
      createdAt: new Date(),
    }

  return (
    <JournalChat
      entry={{ ...safeEntry, createdAt: safeEntry.createdAt }}
      userName={session?.user?.name ?? 'Guest'}
      questionnaireContext={(questionnaire?.responses as QuestionnaireResponses) ?? {}}
    />
  )
}
