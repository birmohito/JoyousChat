'use client'

import { useRef, useState, useEffect } from 'react'
import { useA11y, FontSize, ThemeMode } from './accessibility-provider'
import { useRouter } from 'next/navigation'
import { Settings, X, Sun, Moon, Type } from 'lucide-react'

const FONT_OPTIONS: { value: FontSize; label: string; description: string }[] = [
  { value: 'normal', label: 'Normal', description: 'Default text size' },
  { value: 'large', label: 'Large', description: '120% — easier to read' },
  { value: 'xlarge', label: 'Extra large', description: '140% — maximum readability' },
]

export default function AccessibilityMenu() {
  const router = useRouter()
  const { highContrast, fontSize, theme, toggleHighContrast, setFontSize, toggleTheme } = useA11y()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Focus trap — focus first focusable element when opened
  useEffect(() => {
    if (open && dialogRef.current) {
      const first = dialogRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      first?.focus()
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Accessibility settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
      >
        <Settings className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Accessibility settings"
            className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-card shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-foreground">Accessibility Settings</h2>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); triggerRef.current?.focus() }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
                aria-label="Close accessibility settings"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* High contrast toggle */}
              <section aria-labelledby="contrast-heading">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 id="contrast-heading" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {highContrast
                        ? <Moon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        : <Sun className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      }
                      High contrast mode
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Black &amp; white — maximum contrast for visual clarity
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={highContrast}
                    onClick={toggleHighContrast}
                    className={`relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary ${
                      highContrast ? 'bg-primary' : 'bg-muted'
                    }`}
                    aria-label={`High contrast mode is ${highContrast ? 'on' : 'off'}`}
                  >
                    <span
                      className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </section>

              {/* Theme */}
              <section aria-labelledby="theme-heading">
                <h3 id="theme-heading" className="mb-3 text-sm font-semibold text-foreground flex items-center gap-1.5">
                  {theme === 'dark'
                    ? <Moon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    : <Sun className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  }
                  Theme mode
                </h3>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-between w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                    {theme === 'dark' ? 'On' : 'Off'}
                  </span>
                </button>
              </section>

              {/* Font size */}
              <section aria-labelledby="fontsize-heading">
                <h3 id="fontsize-heading" className="mb-3 text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  Text size
                </h3>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="fontsize-heading">
                  {FONT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={fontSize === opt.value}
                      onClick={() => setFontSize(opt.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-primary ${
                        fontSize === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/40'
                      }`}
                      aria-label={`${opt.label} — ${opt.description}`}
                    >
                      <span
                        className={`font-semibold text-foreground leading-none ${
                          opt.value === 'normal' ? 'text-sm' : opt.value === 'large' ? 'text-base' : 'text-lg'
                        }`}
                        aria-hidden="true"
                      >
                        Aa
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section aria-labelledby="retake-heading">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" aria-hidden="true" />
                  <h3 id="retake-heading" className="text-sm font-semibold text-foreground">Monthly retake</h3>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  If you want, revisit your questionnaire to refresh your prompts after a new season of life.
                </p>
                <button
                  type="button"
                  onClick={() => { setOpen(false); router.push('/questionnaire') }}
                  className="inline-flex items-center justify-center w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent"
                >
                  Retake questionnaire
                </button>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
