'use client'

export async function signUp(email: string, password: string, name: string) {
  const response = await fetch('/api/auth/sign-up', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  return response.json()
}

export async function signIn(email: string, password: string) {
  const response = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}

export async function signOut() {
  const response = await fetch('/api/auth/sign-out', {
    method: 'POST',
  })
  return response.json()
}
