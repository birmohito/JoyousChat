'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type FontSize = 'normal' | 'large' | 'xlarge'
export type ThemeMode = 'light' | 'dark'

interface A11ySettings {
  highContrast: boolean
  fontSize: FontSize
  theme: ThemeMode
  toggleHighContrast: () => void
  setFontSize: (size: FontSize) => void
  toggleTheme: () => void
}

const A11yContext = createContext<A11ySettings>({
  highContrast: false,
  fontSize: 'normal',
  theme: 'light',
  toggleHighContrast: () => {},
  setFontSize: () => {},
  toggleTheme: () => {},
})

export function useA11y() {
  return useContext(A11yContext)
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')
  const [theme, setTheme] = useState<ThemeMode>('light')

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('jc-a11y')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.highContrast) setHighContrast(true)
        if (parsed.fontSize) setFontSizeState(parsed.fontSize)
        if (parsed.theme) setTheme(parsed.theme)
      }
    } catch {}
  }, [])

  // Apply classes to <html>
  useEffect(() => {
    const html = document.documentElement
    if (highContrast) {
      html.classList.add('high-contrast')
    } else {
      html.classList.remove('high-contrast')
    }

    html.classList.remove('font-large', 'font-xlarge')
    if (fontSize === 'large') html.classList.add('font-large')
    if (fontSize === 'xlarge') html.classList.add('font-xlarge')

    if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [highContrast, fontSize, theme])

  function persist(hc: boolean, fs: FontSize, t: ThemeMode) {
    try {
      localStorage.setItem('jc-a11y', JSON.stringify({ highContrast: hc, fontSize: fs, theme: t }))
    } catch {}
  }

  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => {
      const next = !prev
      persist(next, fontSize, theme)
      return next
    })
  }, [fontSize, theme])

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size)
    persist(highContrast, size, theme)
  }, [highContrast, theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      persist(highContrast, fontSize, next)
      return next
    })
  }, [highContrast, fontSize])

  return (
    <A11yContext.Provider value={{ highContrast, fontSize, theme, toggleHighContrast, setFontSize, toggleTheme }}>
      {children}
    </A11yContext.Provider>
  )
}
