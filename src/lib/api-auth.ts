import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin-server'

export interface AuthedRequestContext {
  uid: string
  email?: string
  claims: Record<string, unknown>
  isPlatformAdmin: boolean
}

function readBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token || null
}

function claimGrantsPlatformAdmin(claims: Record<string, unknown>): boolean {
  return (
    claims.platformRole === 'admin' ||
    claims.role === 'super_admin' ||
    claims.role === 'admin' ||
    claims.superAdmin === true ||
    claims.admin === true
  )
}

/**
 * Verify the Firebase ID token on an API-route request. These routes run with Admin SDK
 * credentials, so an unauthenticated caller must never reach the handler body.
 * Returns the decoded context, or a NextResponse to return immediately on failure.
 */
export async function verifyRequestAuth(
  request: NextRequest
): Promise<{ context: AuthedRequestContext } | { response: NextResponse }> {
  if (!adminAuth) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Server auth is not configured' },
        { status: 500 }
      )
    }
  }

  const token = readBearerToken(request)
  if (!token) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token)
    const claims = decoded as unknown as Record<string, unknown>
    return {
      context: {
        uid: decoded.uid,
        email: decoded.email,
        claims,
        isPlatformAdmin: claimGrantsPlatformAdmin(claims)
      }
    }
  } catch {
    return {
      response: NextResponse.json(
        { success: false, error: 'Invalid or expired authentication token' },
        { status: 401 }
      )
    }
  }
}

/** Require a valid, signed-in Firebase user. */
export async function requireUser(
  request: NextRequest
): Promise<{ context: AuthedRequestContext } | { response: NextResponse }> {
  return verifyRequestAuth(request)
}

/** Require a valid Firebase user whose token carries a platform-admin claim. */
export async function requirePlatformAdmin(
  request: NextRequest
): Promise<{ context: AuthedRequestContext } | { response: NextResponse }> {
  const result = await verifyRequestAuth(request)
  if ('response' in result) return result
  if (!result.context.isPlatformAdmin) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Platform admin access is required' },
        { status: 403 }
      )
    }
  }
  return result
}
