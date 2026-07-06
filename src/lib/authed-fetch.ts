'use client'

import { auth } from '@/lib/firebase'

/**
 * fetch() wrapper that attaches the current Firebase user's ID token as a Bearer header.
 * Use this for same-origin Next.js /api/* routes that verify the token server-side
 * (see lib/api-auth.ts). Falls back to an unauthenticated request only if no user is signed in.
 */
export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const user = auth.currentUser
  const token = user ? await user.getIdToken() : null
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}
