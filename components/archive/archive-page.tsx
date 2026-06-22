'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getJournalEntries, createJournalEntry, deleteJournalEntry, getQuestionnaireResponses } from '@/app/actions/journal'
import { BookOpen, Plus, Search, Calendar, FileText, ChevronRight, LogOut, X, Trash2, AlertTriangle } from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import AccessibilityMenu from '@/components/accessibility/accessibility-menu'

interface Entry {
  id: string
  title: string
  prompt: string
  response: string
  createdAt: Date
}

interface Props {
  initialEntries: Entry[]
  userName: string
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function truncate(text: string, max = 100) {
  if (!text || text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

function getLocalDateString(date: Date) {
  return date.toLocaleDateString('en-CA')
}

function isSameLocalDate(a: Date, b: Date) {
  return getLocalDateString(a) === getLocalDateString(b)
}

export default function ArchivePage({ initialEntries, userName }: Props) {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [showRetakePopup, setShowRetakePopup] = useState(false)

  function dismissRetakePopup() {
    setShowRetakePopup(false)
  }

  function handleSearch(value: string) {
    setSearch(value)
    startTransition(async () => {
      const results = await getJournalEntries(value)
      setEntries(results as Entry[])
    })
  }

  function clearSearch() {
    handleSearch('')
  }

  async function handleNewEntry() {
    if (todayEntry) {
      router.push(`/journal/${todayEntry.id}`)
      return
    }

    setCreating(true)
    setError('')
    try {
      const title = `Entry — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
      const prompt = "What is on your mind today? Take a moment to pause, breathe, and write whatever feels present for you right now."
      const localDate = new Date().toLocaleDateString('en-CA')
      const entryId = await createJournalEntry({ title, prompt, response: '', localDate })
      router.push(`/journal/${entryId}`)
    } catch (error: unknown) {
      setCreating(false)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Unable to create a new entry. Please try again.')
      }
    }
  }

  async function handleDeleteConfirm(id: string) {
    setDeleting(true)
    try {
      await deleteJournalEntry(id)
      setEntries(prev => prev.filter(e => e.id !== id))
    } finally {
      setDeleting(false)
      setConfirmDeleteId(null)
    }
  }

  async function handleFreeWrite() {
    if (todayEntry) {
      router.push(`/journal/${todayEntry.id}`)
      return
    }

    setCreating(true)
    setError('')
    try {
      const title = `Free Write — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
      const prompt = 'Free write: choose your own topic today and follow your thoughts wherever they go. There is no right answer.'
      const localDate = new Date().toLocaleDateString('en-CA')
      const entryId = await createJournalEntry({ title, prompt, response: '', localDate })
      router.push(`/journal/${entryId}`)
    } catch (error: unknown) {
      setCreating(false)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Unable to start a free-write entry. Please try again.')
      }
    }
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    let isMounted = true

    async function checkQuestionnaire() {
      try {
        const response = await getQuestionnaireResponses()
        if (!response || !('completedAt' in response) || !isMounted) return

        const last = new Date(response.completedAt)
        const now = new Date()
        const currentKey = `joyous-retake-${now.getFullYear()}-${now.getMonth() + 1}`

        if (
          (last.getFullYear() < now.getFullYear() || last.getMonth() < now.getMonth()) &&
          !localStorage.getItem(currentKey)
        ) {
          setShowRetakePopup(true)
        }
      } catch {
        // ignore questionnaire check failure
      }
    }

    checkQuestionnaire()
    return () => {
      isMounted = false
    }
  }, [])

  const todayEntry = entries.find(entry => isSameLocalDate(new Date(entry.createdAt), new Date()))
  const todayMessage = todayEntry
    ? 'You already have an entry for today — click here to continue writing or reflect on it.'
    : 'You can write one entry today. Free-write is also available.'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground">Joyous Chat</h1>
            <p className="text-xs text-muted-foreground truncate">Hello, {userName.split(' ')[0]}</p>
          </div>
          <div className="flex items-center gap-1">
            <AccessibilityMenu />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Page title + new entry */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Your Journal</h2>
                <p className="text-sm text-muted-foreground">
                  {entries.length === 0 && !search
                    ? 'No entries yet'
                    : `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleNewEntry}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed"
                aria-busy={creating}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {creating ? 'Creating…' : 'New Entry'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => todayEntry && router.push(`/journal/${todayEntry.id}`)}
              className={`w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors ${
                todayEntry ? 'cursor-pointer hover:border-primary hover:text-primary' : ''
              }`}
              aria-label={todayEntry ? 'Continue today entry' : undefined}
              disabled={!todayEntry}
            >
              {todayMessage}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleFreeWrite}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Free Write
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label htmlFor="search" className="sr-only">Search journal entries by title, date, or content</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <input
                id="search"
                type="search"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search entries by title or content…"
                className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Search journal entries"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
            {isPending && (
              <p role="status" className="mt-2 text-xs text-muted-foreground">Searching…</p>
            )}
          </div>

          {/* Entries list */}
          {showRetakePopup && (
            <div className="mb-6 rounded-2xl border border-border bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">Monthly check-in available</p>
                  <p className="mt-1 text-muted-foreground">
                    It’s been a month since you last updated your preferences. Retaking the questionnaire helps the app keep your prompts aligned with your current goals.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { dismissRetakePopup(); router.push('/questionnaire') }}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
                  >
                    Retake now
                  </button>
                  <button
                    type="button"
                    onClick={dismissRetakePopup}
                    className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          {entries.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center" role="status">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted" aria-hidden="true">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {search ? 'No entries found' : 'Your journal is empty'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search ? 'Try a different search term.' : 'Start your first entry to begin your journaling journey.'}
                </p>
              </div>
              {!search && (
                <button
                  type="button"
                  onClick={handleNewEntry}
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Start Journaling
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Delete confirmation modal */}
              {confirmDeleteId && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delete-dialog-title"
                  aria-describedby="delete-dialog-desc"
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                >
                  <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                      <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
                    </div>
                    <h2 id="delete-dialog-title" className="mb-1 text-base font-bold text-foreground">
                      Delete this entry?
                    </h2>
                    <p id="delete-dialog-desc" className="mb-6 text-sm text-muted-foreground leading-relaxed">
                      This journal entry will be permanently deleted. This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={deleting}
                        className="flex-1 rounded-xl border-2 border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConfirm(confirmDeleteId)}
                        disabled={deleting}
                        className="flex-1 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-busy={deleting}
                      >
                        {deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <ul role="list" className="space-y-3" aria-label="Journal entries">
              {entries.map(entry => (
                <li key={entry.id} className="group relative">
                  <Link
                    href={`/journal/${entry.id}`}
                    className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 pr-14 transition-colors hover:border-primary/40 hover:bg-card/80 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={`Open journal entry: ${entry.title}, written on ${formatDate(entry.createdAt)}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-snug text-balance group-hover:text-primary transition-colors">
                        {entry.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <time dateTime={new Date(entry.createdAt).toISOString()}>
                          {formatDate(entry.createdAt)}
                        </time>
                      </div>
                      {entry.response && (
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {truncate(entry.response, 120)}
                        </p>
                      )}
                      {!entry.response && (
                        <p className="mt-2 text-xs text-primary/70 italic">No response yet — tap to continue</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors mt-1" aria-hidden="true" />
                  </Link>

                  {/* Delete button — sits in the top-right corner of the card */}
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); setConfirmDeleteId(entry.id) }}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
                    aria-label={`Delete entry: ${entry.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
