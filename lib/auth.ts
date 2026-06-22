import { pool } from '@/lib/db'

// If the developer has explicitly configured Better Auth (BETTER_AUTH_URL)
// or we're in production, use the real `better-auth` setup. For quick local
// development without over-engineering, provide a tiny fallback auth object
// that implements the minimal `api.getSession` and `handler` shape used across
// the app. This keeps the app runnable locally without Better Auth or extra
// env vars.
let auth: any

if (process.env.BETTER_AUTH_URL || process.env.NODE_ENV === 'production') {
  // Lazily import better-auth only when needed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { betterAuth } = require('better-auth')
  auth = betterAuth({
    database: pool,
    baseURL:
      process.env.BETTER_AUTH_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : process.env.V0_RUNTIME_URL),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    trustedOrigins: (request: Request | undefined) => {
      const origin = request && 'headers' in request && (request as any).headers?.get?.('origin')
        ? (request as any).headers.get('origin')
        : ''
      if (!origin) return []
      if (origin.endsWith('.vusercontent.net')) return [origin]
      const allowed = [
        process.env.V0_RUNTIME_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : undefined,
      ].filter(Boolean) as string[]
      return allowed.includes(origin) ? [origin] : []
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  })
} else {
  // Development fallback: no external auth, return null sessions and a
  // 404 handler for the auth route. This keeps pages working in demo mode.
  auth = {
    api: {
      getSession: async (_opts?: { headers?: any }) => null,
    },
    handler: async (_req: Request) => new Response('Auth not configured', { status: 404 }),
  }
}

export { auth }
