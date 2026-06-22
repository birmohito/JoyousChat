import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({ name: 'joyous_chat_session', value: '', maxAge: 0, path: '/' })
  return response
}
