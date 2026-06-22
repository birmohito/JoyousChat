import { auth, authCookieOptions, authCookieName } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const { token } = await auth.signInUser(email, password)

    const response = NextResponse.json({ success: true })
    response.cookies.set({
      name: authCookieName,
      value: token,
      ...authCookieOptions,
    })
    return response
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to sign in' },
      { status: 400 },
    )
  }
}
