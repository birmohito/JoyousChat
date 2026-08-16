'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { updateJournalEntry, generateFollowUpPrompt, generateReflectionPrompt, generateEncouragement, type QuestionnaireResponses } from '@/app/actions/journal'
import { Send, Mic, MicOff, Volume2, VolumeX, BookOpen, ArrowLeft, Sparkles, Heart, LockKeyhole } from 'lucide-react'
import AccessibilityMenu from '@/components/accessibility/accessibility-menu'

interface Entry {
  id: string
  title: string
  prompt: string
  response: string
  createdAt: Date
}

interface Message {
  role: 'ai' | 'user' | 'encouragement'
  content: string
}

interface Props {
  entry: Entry
  userName: string
  questionnaireContext: QuestionnaireResponses
}


/** Returns true if the entry was created on today's calendar date (in local time) */
function isSameDay(date: Date): boolean {
  const now = new Date()
  const d = new Date(date)
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

/** Returns true if the entry was created at least one full calendar day ago */
function isOlderThanToday(date: Date): boolean {
  return !isSameDay(date)
}

export default function JournalChat({ entry, userName, questionnaireContext }: Props) {
  const createdAt = new Date(entry.createdAt)
  const isToday = isSameDay(createdAt)
  const isPastEntry = isOlderThanToday(createdAt)

  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: entry.prompt },
    ...(entry.response ? [{ role: 'user' as const, content: entry.response }] : []),
  ])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingFollowUp, setLoadingFollowUp] = useState(false)
  const [loadingReflect, setLoadingReflect] = useState(false)
  const [title, setTitle] = useState(entry.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [hasReflected, setHasReflected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  const saveResponse = useCallback(async (fullResponse: string, currentTitle: string) => {
    setSaving(true)
    try {
      await updateJournalEntry(entry.id, { response: fullResponse, title: currentTitle })
    } finally {
      setSaving(false)
    }
  }, [entry.id])

  async function handleSend() {
    const text = input.trim()
    if (!text || !isToday) return

    const userMsg: Message = { role: 'user', content: text }
    const withUser = [...messages, userMsg]
    setMessages(withUser)
    setInput('')

    const allUserText = withUser
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n')

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => saveResponse(allUserText, title), 1500)

    // Generate encouragement + follow-up in parallel
    setLoadingFollowUp(true)
    try {
      const [encouragement, followUp] = await Promise.all([
        generateEncouragement(text, questionnaireContext),
        generateFollowUpPrompt(text, questionnaireContext),
      ])
      setMessages(prev => [
        ...prev,
        { role: 'encouragement', content: encouragement },
        { role: 'ai', content: followUp },
      ])
    } finally {
      setLoadingFollowUp(false)
    }
  }

  async function handleReflect() {
    if (hasReflected || loadingReflect) return
    setLoadingReflect(true)
    try {
      const originalText = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n\n')
      const reflectionPrompt = await generateReflectionPrompt(originalText || entry.prompt, questionnaireContext)
      setMessages(prev => [...prev, { role: 'ai', content: reflectionPrompt }])
      setHasReflected(true)
    } finally {
      setLoadingReflect(false)
    }
  }

  async function handleReflectSend() {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { role: 'user', content: text }
    const withUser = [...messages, userMsg]
    setMessages(withUser)
    setInput('')

    setLoadingFollowUp(true)
    try {
      const [encouragement, followUp] = await Promise.all([
        generateEncouragement(text, questionnaireContext),
        generateFollowUpPrompt(text, questionnaireContext),
      ])
      setMessages(prev => [
        ...prev,
        { role: 'encouragement', content: encouragement },
        { role: 'ai', content: followUp },
      ])
    } finally {
      setLoadingFollowUp(false)
    }
  }

  async function handleTitleSave() {
    setEditingTitle(false)
    await updateJournalEntry(entry.id, { title })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isPastEntry && hasReflected) {
        handleReflectSend()
      } else if (isToday) {
        handleSend()
      }
    }
  }

  function toggleListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please try Chrome or Edge.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('')
      setInput(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function speakText(text: string) {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser. Please try Chrome, Edge, or Safari.')
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  function handleSpeakPrompt() {
    speakText(entry.prompt)
  }

  const canSend = isToday || (isPastEntry && hasReflected)
  const showReflectButton = isPastEntry && !hasReflected

  const formattedDate = createdAt.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="flex h-screen flex-col bg-[--chat-bg]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 shadow-sm">
        <Link
          href="/archive"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
          aria-label="Back to journal archive"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>

        <div className="flex-1 min-w-0">
          {editingTitle && isToday ? (
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => { if (e.key === 'Enter') handleTitleSave() }}
              autoFocus
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-semibold text-foreground focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
              aria-label="Edit entry title"
            />
          ) : (
            <button
              type="button"
              onClick={() => isToday && setEditingTitle(true)}
              className={`block max-w-full truncate text-left text-sm font-semibold text-foreground rounded ${isToday ? 'hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary cursor-pointer' : 'cursor-default'}`}
              aria-label={isToday ? `Entry title: ${title}. Click to edit.` : `Entry title: ${title}`}
              aria-disabled={!isToday}
            >
              {title}
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            {saving ? 'Saving…' : (
              <time dateTime={createdAt.toISOString()}>{formattedDate}</time>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <AccessibilityMenu />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
        </div>
      </header>

      {/* Locked banner for past entries */}
      {isPastEntry && (
        <div
          className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800"
          role="status"
          aria-label="This entry is from a past day and cannot be edited"
        >
          <LockKeyhole className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            This entry is from <strong>{formattedDate}</strong> and is now read-only.
            {!hasReflected && ' Use the Reflect button to add new thoughts.'}
          </span>
        </div>
      )}

      {/* Messages */}
      <main
        id="main-content"
        className="flex-1 overflow-y-auto px-4 py-6"
        aria-label="Journal conversation"
        aria-live="polite"
      >
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg, i) => {
            if (msg.role === 'encouragement') {
              return (
                <div key={i} className="flex justify-center" aria-live="polite">
                  <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs text-primary/80 italic max-w-[85%] text-center">
                    <Heart className="h-3 w-3 shrink-0 text-primary/60" aria-hidden="true" />
                    <span role="note" aria-label="Words of encouragement">{msg.content}</span>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-[--bubble-user] text-[--bubble-user-text]'
                      : 'rounded-bl-sm bg-[--bubble-ai] text-[--bubble-ai-text]'
                  }`}
                  role={msg.role === 'ai' ? 'article' : undefined}
                  aria-label={msg.role === 'ai' ? 'Journaling prompt' : 'Your response'}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="ml-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary" aria-hidden="true">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            )
          })}

          {/* Loading indicator */}
          {(loadingFollowUp || loadingReflect) && (
            <div className="flex justify-start" aria-live="polite" aria-label="Generating response">
              <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-[--bubble-ai] px-4 py-3">
                <div className="flex gap-1" aria-hidden="true">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} aria-hidden="true" />
        </div>
      </main>

      {/* Reflect CTA for past entries — shown before reflecting */}
      {showReflectButton && (
        <div className="border-t border-border bg-card px-4 py-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              Re-reading this entry? Take a moment to reflect on how you feel now.
            </p>
            <button
              type="button"
              onClick={handleReflect}
              disabled={loadingReflect}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={loadingReflect}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {loadingReflect ? 'Preparing reflection…' : 'Reflect on this entry'}
            </button>
          </div>
        </div>
      )}

      {/* Input area — shown only when editing is allowed */}
      {canSend && (
        <footer className="border-t border-border bg-card px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <div
              className="flex items-end gap-3 rounded-2xl border-2 border-border bg-background px-4 py-3 focus-within:border-primary transition-colors"
              role="group"
              aria-label="Journal entry input"
            >
              <label htmlFor="journal-input" className="sr-only">
                Type your journal response. Press Enter to send, Shift+Enter for a new line.
              </label>
              <textarea
                id="journal-input"
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={hasReflected ? 'Share your reflection…' : 'Write your thoughts here… (Enter to send, Shift+Enter for new line)'}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed max-h-40"
                aria-multiline="true"
                aria-label="Journal response"
              />

              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary ${
                  listening
                    ? 'bg-destructive text-white animate-pulse'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
                aria-label={listening ? 'Stop voice input' : 'Start voice input (voice to text)'}
                aria-pressed={listening}
              >
                {listening
                  ? <MicOff className="h-4 w-4" aria-hidden="true" />
                  : <Mic className="h-4 w-4" aria-hidden="true" />
                }
              </button>

              <button
                type="button"
                onClick={handleSpeakPrompt}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary ${
                  speaking
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                }`}
                aria-label={speaking ? 'Stop speaking prompt' : 'Read prompt aloud'}
              >
                {speaking
                  ? <VolumeX className="h-4 w-4" aria-hidden="true" />
                  : <Volume2 className="h-4 w-4" aria-hidden="true" />
                }
              </button>

              <button
                type="button"
                onClick={isPastEntry ? handleReflectSend : handleSend}
                disabled={!input.trim() || loadingFollowUp}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send journal response"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              {isToday
                ? 'Your entries are saved automatically. Voice-to-text available for accessibility.'
                : 'Reflections on past entries are not saved — they are for your present-moment awareness.'}
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
