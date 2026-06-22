import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { account, session as sessionTable, user } from '@/lib/db/schema'
import { and, eq, gte } from 'drizzle-orm'

const SESSION_COOKIE_NAME = 'joyous_chat_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

async function hashPassword(password: string) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyPassword(password: string, hashed: string) {
  return (await hashPassword(password)) === hashed
}

async function getSessionToken() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

async function getSession() {
  const token = await getSessionToken()
  if (!token) return null

  const sessionResult = await db
    .select()
    .from(sessionTable)
    .where(
      and(
        eq(sessionTable.token, token),
        gte(sessionTable.expiresAt, new Date()),
      ),
    )
    .limit(1)

  const session = sessionResult[0]
  if (!session) return null

  const userResult = await db
    .select()
    .from(user)
    .where(eq(user.id, session.userId))
    .limit(1)

  const currentUser = userResult[0]
  if (!currentUser) return null

  return {
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
    },
  }
}

async function createSession(userId: string) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
  await db.insert(sessionTable).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return token
}

async function signUpUser(name: string, email: string, password: string) {
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (existingUser.length > 0) {
    throw new Error('An account with this email already exists.')
  }

  const hashedPassword = await hashPassword(password)
  const userId = crypto.randomUUID()

  await db.insert(user).values({
    id: userId,
    name,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: email,
    providerId: 'credentials',
    userId,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return { userId, token: await createSession(userId) }
}

async function signInUser(email: string, password: string) {
  const accounts = await db
    .select()
    .from(account)
    .where(
      and(
        eq(account.accountId, email),
        eq(account.providerId, 'credentials'),
      ),
    )
    .limit(1)

  const accountRecord = accounts[0]
  if (!accountRecord) {
    throw new Error('Invalid email or password.')
  }

  const passwordMatches = await verifyPassword(password, accountRecord.password ?? '')
  if (!passwordMatches) {
    throw new Error('Invalid email or password.')
  }

  return { userId: accountRecord.userId, token: await createSession(accountRecord.userId) }
}

export const auth = {
  api: {
    getSession,
  },
  signUpUser,
  signInUser,
}

export const authCookieName = SESSION_COOKIE_NAME
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
}
