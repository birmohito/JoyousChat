'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveQuestionnaireResponses, generateJournalPrompt, createJournalEntry } from '@/app/actions/journal'
import { Compass, ChevronRight, ChevronLeft, Sparkles, ArrowLeft } from 'lucide-react'
import AccessibilityMenu from '@/components/accessibility/accessibility-menu'

interface Question {
  key: string
  question: string
  options: string[]
  multi?: boolean
  maxSelect?: number
}

const STEPS: { section: string; questions: Question[] }[] = [
  {
    section: 'Your Journaling Experience',
    questions: [
      {
        key: 'experience_level',
        question: 'How would you describe your journaling experience?',
        options: [
          "Brand new — I've never journaled before",
          "I've tried it before, but never stuck with it",
          'I journal fairly regularly already',
          'I’m experienced and want to deepen my practice',
        ],
      },
      {
        key: 'session_frequency',
        question: 'How often would you like to journal?',
        options: ['Every day', 'A few times a week', 'Once a week', 'Whenever I feel like it'],
      },
      {
        key: 'biggest_barrier',
        question: "What's usually gotten in the way of journaling consistently?",
        options: [
          'Not having enough time',
          'Not knowing what to write about',
          'Forgetting to do it',
          'Losing motivation after a few days',
          "Nothing — I'm just getting started",
        ],
      },
      {
        key: 'comfort_with_writing',
        question: 'How comfortable are you putting your thoughts into words?',
        options: [
          "Not very — I often don't know where to start",
          'Somewhat — it takes me a bit to get going',
          'Fairly comfortable',
          'Very comfortable — writing comes naturally to me',
        ],
      },
    ],
  },
  {
    section: 'Your Focus',
    questions: [
      {
        key: 'primary_focus',
        question: 'Which area of your life would you most like your journal to focus on?',
        options: [
          'Daily life & routines',
          'Relationships & friendships',
          'Work & career',
          'Health & wellbeing',
          'Personal growth & mindset',
          'Creativity & self-expression',
        ],
      },
      {
        key: 'focus_variety',
        question: 'Would you like your prompts to stay focused there, or explore more broadly?',
        options: [
          'Mostly stay focused on that one area',
          'Mix in other areas sometimes',
          'Explore broadly across my whole life',
        ],
      },
      {
        key: 'current_life_stage',
        question: "Which of these best describes what's going on for you right now?",
        options: [
          'Settling into a routine or daily rhythm',
          'Navigating a relationship or friendship',
          'Going through change at work or in my career',
          'Focused on my health or wellbeing',
          'In a season of personal growth or reflection',
          'Nothing specific — just want space to think',
        ],
      },
    ],
  },
  {
    section: 'Your Goals',
    questions: [
      {
        key: 'primary_goals',
        question: 'Beyond building a steady journaling habit, what would you like it to help you with?',
        options: [
          'Learn to self-reflect and express myself more clearly',
          'Externalise my thoughts and feelings',
          'Track my personal growth over time',
          'Process difficult emotions',
          'Practice gratitude',
          'Build confidence and self-belief',
          'Gain clarity on my goals and purpose',
        ],
        multi: true,
        maxSelect: 3,
      },
      {
        key: 'what_matters_most',
        question: 'What would make journaling feel most worthwhile to you?',
        options: [
          'Seeing how far I’ve come over time',
          'Feeling lighter after getting things off my chest',
          'Understanding myself better',
          'Having something to look back on',
        ],
      },
      {
        key: 'tone_preference',
        question: 'What tone of prompts resonates with you most?',
        options: ['Gentle and reflective', 'Direct and goal-oriented', 'Warm and encouraging', 'Curious and open-ended'],
      },
      {
        key: 'challenge_level',
        question: 'Should prompts occasionally challenge you, or stay purely comfortable?',
        options: [
          'Keep it comfortable and reflective',
          'Occasional gentle challenges to help me grow',
          'Push me — I want to be challenged',
        ],
      },
    ],
  },
  {
    section: 'Your Rhythm',
    questions: [
      {
        key: 'session_length',
        question: 'How much time do you usually have for a journaling session?',
        options: ['Just a few minutes', '10–15 minutes', '20 minutes or more', 'It varies'],
      },
      {
        key: 'time_of_day',
        question: 'When would you most likely want to journal?',
        options: ['Morning', 'Afternoon', 'Evening', 'It varies day to day'],
      },
      {
        key: 'support_style',
        question: 'How would you like your journal to support you?',
        options: [
          'Like a quiet space just for me',
          'Like a gentle companion checking in',
          'Like a coach helping me stay accountable',
          'Like a creative outlet to play in',
        ],
      },
    ],
  },
]

const ALL_QUESTIONS = STEPS.flatMap(s => s.questions)
const TOTAL = ALL_QUESTIONS.length

interface Props {
  userName: string
}

export default function QuestionnairePage({ userName }: Props) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentStep = STEPS[stepIndex]
  const currentQ = currentStep.questions[qIndex]
  const currentAnswer = answers[currentQ.key]
  const globalIndex = STEPS.slice(0, stepIndex).reduce((acc, s) => acc + s.questions.length, 0) + qIndex
  const progress = Math.round((globalIndex / TOTAL) * 100)

  const hasAnswer = currentQ.multi
    ? Array.isArray(currentAnswer) && currentAnswer.length > 0
    : typeof currentAnswer === 'string' && currentAnswer.length > 0

  function handleAnswer(value: string) {
    if (currentQ.multi) {
      setAnswers(prev => {
        const existing = Array.isArray(prev[currentQ.key]) ? (prev[currentQ.key] as string[]) : []
        const isSelected = existing.includes(value)
        if (isSelected) {
          return { ...prev, [currentQ.key]: existing.filter(v => v !== value) }
        }
        if (currentQ.maxSelect && existing.length >= currentQ.maxSelect) {
          return prev
        }
        return { ...prev, [currentQ.key]: [...existing, value] }
      })
    } else {
      setAnswers(prev => ({ ...prev, [currentQ.key]: value }))
    }
  }

  function handleNext() {
    if (!hasAnswer) return
    if (qIndex < currentStep.questions.length - 1) {
      setQIndex(qIndex + 1)
    } else if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1)
      setQIndex(0)
    } else {
      handleFinish()
    }
  }

  function handleBack() {
    if (qIndex > 0) {
      setQIndex(qIndex - 1)
    } else if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
      setQIndex(STEPS[stepIndex - 1].questions.length - 1)
    }
  }

  const isLast = stepIndex === STEPS.length - 1 && qIndex === currentStep.questions.length - 1

  async function handleFinish() {
    setLoading(true)
    setError('')
    try {
      await saveQuestionnaireResponses(answers)
      const prompt = await generateJournalPrompt(answers)
      const title = `First Entry — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
      const localDate = new Date().toLocaleDateString('en-CA')
      const entryId = await createJournalEntry({ title, prompt, response: '', localDate })
      router.push(`/journal/${entryId}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6">
        <Link
          href="/disclosure"
          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
          aria-label="Go back to disclosure page"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <AccessibilityMenu />
      </div>

    <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
            <Compass className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-foreground">Journaling Preferences</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hi {userName.split(' ')[0]}, {TOTAL} quick questions to personalise your prompts
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Question ${globalIndex + 1} of ${TOTAL}`}>
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>{currentStep.section}</span>
            <span>{globalIndex + 1} of {TOTAL}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${((globalIndex + 1) / TOTAL) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-border bg-card px-8 py-8 shadow-sm">
          <fieldset>
            <legend className="mb-1 text-lg font-semibold text-foreground leading-snug text-balance">
              {currentQ.question}
            </legend>
            {currentQ.multi && (
              <p className="mb-5 text-xs text-muted-foreground">
                Choose up to {currentQ.maxSelect} — {Array.isArray(currentAnswer) ? currentAnswer.length : 0} selected
              </p>
            )}
            {!currentQ.multi && <div className="mb-6" />}
            <div className="space-y-3" role={currentQ.multi ? 'group' : 'radiogroup'}>
              {currentQ.options.map((opt, i) => {
                const isChecked = currentQ.multi
                  ? Array.isArray(currentAnswer) && currentAnswer.includes(opt)
                  : currentAnswer === opt
                const isDisabled =
                  !!currentQ.multi &&
                  !isChecked &&
                  Array.isArray(currentAnswer) &&
                  !!currentQ.maxSelect &&
                  currentAnswer.length >= currentQ.maxSelect
                return (
                  <label
                    key={i}
                    className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors focus-within:outline focus-within:outline-3 focus-within:outline-primary ${
                      isChecked
                        ? 'border-primary bg-primary/5'
                        : isDisabled
                          ? 'border-border bg-background opacity-50 cursor-not-allowed'
                          : 'border-border bg-background hover:border-primary/40 cursor-pointer'
                    }`}
                  >
                    <input
                      type={currentQ.multi ? 'checkbox' : 'radio'}
                      name={currentQ.key}
                      value={opt}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => handleAnswer(opt)}
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
                    />
                    <span className="text-sm text-foreground leading-relaxed">{opt}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0 && qIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnswer || loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary disabled:opacity-40 disabled:cursor-not-allowed"
            aria-busy={loading}
          >
            {loading ? (
              <>Generating your first prompt…</>
            ) : isLast ? (
              <><Sparkles className="h-4 w-4" aria-hidden="true" /> Begin Journaling</>
            ) : (
              <>Next <ChevronRight className="h-4 w-4" aria-hidden="true" /></>
            )}
          </button>
        </div>
      </div>
    </main>
    </div>
  )
}
