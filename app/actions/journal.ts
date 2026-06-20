'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { journalEntries, questionnaireResponses } from '@/lib/db/schema'
import { and, desc, eq, or, ilike, gte, lt } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { generateText } from 'ai'

const DEMO_USER_ID = 'demo-user'
const AI_MODEL = process.env.AI_MODEL ?? 'anthropic/claude-3.5'
const DEMO_JOURNAL_ENTRY = {
  id: 'demo-entry',
  title: 'Sample journal entry',
  prompt:
    'What is one small kindness you can offer yourself today? Describe it and how it would make you feel.',
  response: '',
  createdAt: new Date(),
}
const DEMO_QUESTIONNAIRE_RESPONSES = {
  responses: {
    energy_source: 'A mix of both, depending on my mood',
    decision_style: 'A blend of head and heart',
    daily_rhythm: 'I like a loose structure with room to adapt',
    top_strength: 'Empathy and connecting with others',
    biggest_challenge: 'Finding clarity and purpose',
    journaling_goal: 'Greater self-awareness and clarity',
    time_horizon: 'Medium-term goals (next 3–6 months)',
    motivation_style: 'I am motivated by intrinsic curiosity and joy',
  },
}

async function getUserId() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

export async function getJournalEntries(search?: string) {
  const userId = await getUserId()
  if (!userId) {
    const entries = [DEMO_JOURNAL_ENTRY]
    if (!search || !search.trim()) return entries
    const term = search.trim().toLowerCase()
    return entries.filter(
      entry =>
        entry.title.toLowerCase().includes(term) ||
        entry.prompt.toLowerCase().includes(term) ||
        entry.response.toLowerCase().includes(term),
    )
  }

  if (search && search.trim() !== '') {
    const term = `%${search}%`
    return db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.userId, userId),
          or(
            ilike(journalEntries.title, term),
            ilike(journalEntries.response, term),
            ilike(journalEntries.prompt, term),
          ),
        ),
      )
      .orderBy(desc(journalEntries.createdAt))
  }

  return db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt))
}

export async function getJournalEntry(id: string) {
  const userId = await getUserId()
  if (!userId) {
    return { ...DEMO_JOURNAL_ENTRY, id }
  }

  const results = await db
    .select()
    .from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
    .limit(1)
  return results[0] ?? null
}

function startOfLocalDay(date: Date) {
  const local = new Date(date)
  local.setHours(0, 0, 0, 0)
  return local
}

async function hasEntryForToday(userId: string, localDate: string) {
  const result = await db
    .select({ id: journalEntries.id })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.localDate, localDate),
      ),
    )
    .limit(1)

  return result.length > 0
}

export async function createJournalEntry(data: {
  title: string
  prompt: string
  response: string
  localDate: string
}) {
  const userId = await getUserId()
  const id = crypto.randomUUID()
  if (!userId) return id

  const exists = await hasEntryForToday(userId, data.localDate)
  if (exists) {
    throw new Error('A journal entry for today already exists.')
  }

  await db.insert(journalEntries).values({
    id,
    userId,
    title: data.title,
    prompt: data.prompt,
    response: data.response,
    localDate: data.localDate,
  })
  revalidatePath('/archive')
  return id
}

export async function updateJournalEntry(id: string, data: { title?: string; response?: string }) {
  const userId = await getUserId()
  if (!userId) return
  await db
    .update(journalEntries)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
  revalidatePath('/archive')
}

export async function saveQuestionnaireResponses(responses: Record<string, string>) {
  const userId = await getUserId()
  const id = crypto.randomUUID()
  if (!userId) return id
  await db.insert(questionnaireResponses).values({ id, userId, responses })
  return id
}

export async function getQuestionnaireResponses() {
  const userId = await getUserId()
  if (!userId) return DEMO_QUESTIONNAIRE_RESPONSES
  const results = await db
    .select()
    .from(questionnaireResponses)
    .where(eq(questionnaireResponses.userId, userId))
    .orderBy(desc(questionnaireResponses.completedAt))
    .limit(1)
  return results[0] ?? null
}

export async function generateJournalPrompt(responses: Record<string, string>): Promise<string> {
  try {
    const summary = Object.entries(responses)
      .map(([q, a]) => `${q}: ${a}`)
      .join('\n')

    const { text } = await generateText({
      model: AI_MODEL,
      prompt: `You are a compassionate journaling coach. Based on this person's personality and goals, generate ONE warm, specific, open-ended journaling prompt (2–3 sentences max). Do not explain or introduce it — just write the prompt itself.

Person's profile:
${summary}`,
    })
    return text.trim()
  } catch {
    return "Reflect on a moment this week when you felt most like yourself. What were you doing, who were you with, and what made it feel so authentic?"
  }
}

export async function deleteJournalEntry(id: string) {
  const userId = await getUserId()
  if (!userId) return
  await db
    .delete(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
  revalidatePath('/archive')
}

export async function generateFollowUpPrompt(
  previousResponse: string,
  questionnaireContext: Record<string, string>,
): Promise<string> {
  try {
    const context = Object.entries(questionnaireContext)
      .slice(0, 3)
      .map(([q, a]) => `${q}: ${a}`)
      .join('\n')

    const { text } = await generateText({
      model: AI_MODEL,
      prompt: `You are a warm journaling coach. The person just wrote this journal entry:
"${previousResponse}"

Their goals/context:
${context}

Generate ONE brief, thoughtful follow-up journaling prompt (1–2 sentences) that deepens their reflection. Just write the prompt — no introduction.`,
    })
    return text.trim()
  } catch {
    return "What feelings are coming up as you re-read what you just wrote? Is there anything you'd like to explore further?"
  }
}

export async function generateReflectionPrompt(
  originalEntry: string,
  questionnaireContext: Record<string, string>,
): Promise<string> {
  try {
    const context = Object.entries(questionnaireContext)
      .slice(0, 3)
      .map(([q, a]) => `${q}: ${a}`)
      .join('\n')

    const { text } = await generateText({
      model: AI_MODEL,
      prompt: `You are a compassionate journaling coach. The person is revisiting an entry they wrote some time ago:

"${originalEntry}"

Their goals/context:
${context}

Generate ONE warm, inviting reflection prompt (2–3 sentences) asking how their feelings or perspective may have shifted since writing this. Be gentle and curious. Just write the prompt — no introduction or label.`,
    })
    return text.trim()
  } catch {
    return "Now that some time has passed, how do you feel re-reading what you wrote? Has your perspective on this situation shifted, even slightly?"
  }
}

export async function generateEncouragement(
  userResponse: string,
  questionnaireContext: Record<string, string>,
): Promise<string> {
  try {
    const context = Object.entries(questionnaireContext)
      .slice(0, 2)
      .map(([q, a]) => `${q}: ${a}`)
      .join('\n')

    const { text } = await generateText({
      model: AI_MODEL,
      prompt: `You are a warm, encouraging journaling coach. The person just wrote this journal entry:

"${userResponse}"

Their context:
${context}

Write ONE short, genuine, personalised word of encouragement (1–2 sentences max) acknowledging their effort and what they shared. Be warm but not over-the-top. Do not start with "I" or repeat their words back verbatim. Just the encouragement — no label.`,
    })
    return text.trim()
  } catch {
    return "Thank you for showing up for yourself today — writing your thoughts takes courage and care."
  }
}
