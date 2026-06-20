'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { saveQuestionnaireResponses, generateJournalPrompt, createJournalEntry } from '@/app/actions/journal'
import { Brain, ChevronRight, ChevronLeft, Sparkles, ArrowLeft } from 'lucide-react'
import AccessibilityMenu from '@/components/accessibility/accessibility-menu'

const STEPS = [
  {
    section: 'About You',
    questions: [
      {
        key: 'energy_source',
        question: 'How do you typically recharge your energy?',
        options: [
          'Spending time alone in quiet reflection',
          'Being around people and socialising',
          'A mix of both, depending on my mood',
        ],
      },
      {
        key: 'decision_style',
        question: 'When making important decisions, you tend to rely on:',
        options: [
          'Logic, facts, and structured analysis',
          'Intuition, feelings, and personal values',
          'A blend of head and heart',
        ],
      },
      {
        key: 'daily_rhythm',
        question: 'Which best describes your daily rhythm?',
        options: [
          'I thrive on routine and structure',
          'I prefer flexibility and going with the flow',
          'I like a loose structure with room to adapt',
        ],
      },
    ],
  },
  {
    section: 'Your Strengths & Challenges',
    questions: [
      {
        key: 'top_strength',
        question: 'Which of these feels most like a personal strength?',
        options: [
          'Creativity and imagination',
          'Empathy and connecting with others',
          'Focus, discipline, and follow-through',
          'Curiosity and love of learning',
        ],
      },
      {
        key: 'biggest_challenge',
        question: 'What is your biggest personal challenge right now?',
        options: [
          'Managing stress and anxiety',
          'Building confidence and self-belief',
          'Staying motivated and consistent',
          'Improving relationships and communication',
          'Finding clarity and purpose',
        ],
      },
    ],
  },
  {
    section: 'Your Goals',
    questions: [
      {
        key: 'journaling_goal',
        question: 'What do you most hope to gain from journaling?',
        options: [
          'Greater self-awareness and clarity',
          'Processing emotions and stress',
          'Tracking progress toward my goals',
          'Creative expression and exploration',
          'Building a gratitude practice',
        ],
      },
      {
        key: 'time_horizon',
        question: 'What is your primary focus right now?',
        options: [
          'Day-to-day wellbeing and peace of mind',
          'Medium-term goals (next 3–6 months)',
          'Long-term life vision and purpose',
        ],
      },
      {
        key: 'motivation_style',
        question: 'Which motivational approach resonates most with you?',
        options: [
          'I am motivated by achieving specific milestones',
          'I am motivated by the process of growth itself',
          'I am motivated by accountability to others',
          'I am motivated by intrinsic curiosity and joy',
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
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentStep = STEPS[stepIndex]
  const currentQ = currentStep.questions[qIndex]
  const globalIndex = STEPS.slice(0, stepIndex).reduce((acc, s) => acc + s.questions.length, 0) + qIndex
  const progress = Math.round((globalIndex / TOTAL) * 100)

  function handleAnswer(value: string) {
    setAnswers(prev => ({ ...prev, [currentQ.key]: value }))
  }

  function handleNext() {
    if (!answers[currentQ.key]) return
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
            <Brain className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-bold text-foreground">Personality Assessment</h1>
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
            <legend className="mb-6 text-lg font-semibold text-foreground leading-snug text-balance">
              {currentQ.question}
            </legend>
            <div className="space-y-3" role="radiogroup">
              {currentQ.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-colors focus-within:outline focus-within:outline-3 focus-within:outline-primary ${
                    answers[currentQ.key] === opt
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:border-primary/40'
                  }`}
                >
                  <input
                    type="radio"
                    name={currentQ.key}
                    value={opt}
                    checked={answers[currentQ.key] === opt}
                    onChange={() => handleAnswer(opt)}
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
                  />
                  <span className="text-sm text-foreground leading-relaxed">{opt}</span>
                </label>
              ))}
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
            disabled={!answers[currentQ.key] || loading}
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
