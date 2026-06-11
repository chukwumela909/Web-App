'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  acceptBackendStaffInvitation,
  lookupBackendStaffInvitation,
  type BackendInvitationLookup
} from '@/lib/backend-business-api'
import { isBackendApiError } from '@/lib/backend-api'

type Phase = 'loading' | 'needAuth' | 'ready' | 'accepting' | 'success' | 'error'

function roleLabel(role: string) {
  if (role === 'manager') return 'Manager'
  if (role === 'cashier') return 'Cashier'
  return role
}

function StaffInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const { user, loading: authLoading, login, register, logout, refreshBackendSession } = useAuth()

  const [phase, setPhase] = useState<Phase>('loading')
  const [invite, setInvite] = useState<BackendInvitationLookup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  const emailMatches = Boolean(
    user?.email && invite?.email && user.email.toLowerCase() === invite.email.toLowerCase()
  )

  // Resolve the invitation once the user is signed in (lookup requires auth)
  const loadInvite = useCallback(async () => {
    if (!token) {
      setError('This invitation link is invalid or missing its token.')
      setPhase('error')
      return
    }
    setPhase('loading')
    try {
      const data = await lookupBackendStaffInvitation(token)
      setInvite(data)
      if (data.status === 'accepted') {
        setError('This invitation has already been accepted.')
        setPhase('error')
        return
      }
      if (data.status === 'cancelled') {
        setError('This invitation has been cancelled. Please ask for a new one.')
        setPhase('error')
        return
      }
      if (data.expired) {
        setError('This invitation has expired. Please ask for a new one.')
        setPhase('error')
        return
      }
      setPhase('ready')
    } catch (err) {
      if (isBackendApiError(err) && err.status === 404) {
        setError('This invitation could not be found. The link may be incorrect.')
      } else {
        setError(err instanceof Error ? err.message : 'Unable to load this invitation.')
      }
      setPhase('error')
    }
  }, [token])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setPhase('needAuth')
      return
    }
    loadInvite()
  }, [authLoading, user, loadInvite])

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setAuthBusy(true)
    try {
      if (mode === 'signin') {
        await login(email.trim(), password)
      } else {
        await register(email.trim(), password)
      }
      // The auth state listener will flip `user`, re-running the effect → loadInvite()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.')
    } finally {
      setAuthBusy(false)
    }
  }

  const handleAccept = async () => {
    if (!token) return
    setPhase('accepting')
    setError(null)
    try {
      await acceptBackendStaffInvitation(token)
      await refreshBackendSession().catch(() => undefined)
      setPhase('success')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      if (isBackendApiError(err) && err.code === 'staff_already_exists') {
        // Already a member — just send them in
        await refreshBackendSession().catch(() => undefined)
        setPhase('success')
        setTimeout(() => router.push('/dashboard'), 1200)
        return
      }
      if (isBackendApiError(err) && err.code === 'invitation_email_mismatch') {
        setError('Your signed-in email does not match the invited email.')
      } else {
        setError(err instanceof Error ? err.message : 'Could not accept the invitation.')
      }
      setPhase('ready')
    }
  }

  const handleSwitchAccount = async () => {
    await logout()
    setEmail('')
    setPassword('')
    setMode('signin')
    setError(null)
    setPhase('needAuth')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Staff Invitation</h1>
          <p className="text-gray-500 mt-1">FahamPesa</p>
        </div>

        {phase === 'loading' && (
          <div className="flex flex-col items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-gray-500 mt-4">Loading your invitation…</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="text-center py-6">
            <p className="text-red-600 font-medium mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Go to sign in
            </button>
          </div>
        )}

        {phase === 'needAuth' && (
          <form onSubmit={handleAuth} className="space-y-4">
            <p className="text-gray-600 text-sm">
              {mode === 'signin' ? 'Sign in' : 'Create your account'} using the email address your
              invitation was sent to, then accept the invitation.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={authBusy}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {authBusy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </form>
        )}

        {(phase === 'ready' || phase === 'accepting') && invite && (
          <div className="space-y-5">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-gray-700">
                You&apos;ve been invited to join
              </p>
              <p className="text-lg font-bold text-gray-900">{invite.businessName}</p>
              <p className="text-gray-700 mt-1">
                as <span className="font-semibold">{roleLabel(invite.role)}</span>
                {invite.branchNames.length > 0 && (
                  <> for {invite.branchNames.join(', ')}</>
                )}
              </p>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            {emailMatches ? (
              <button
                onClick={handleAccept}
                disabled={phase === 'accepting'}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {phase === 'accepting' ? 'Accepting…' : 'Accept invitation'}
              </button>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  This invitation is for <span className="font-semibold">{invite.email}</span>, but you are
                  signed in as <span className="font-semibold">{user?.email}</span>.
                </p>
                <button
                  onClick={handleSwitchAccount}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Sign in with a different account
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'success' && (
          <div className="text-center py-6">
            <p className="text-green-600 font-semibold text-lg mb-2">You&apos;re all set!</p>
            <p className="text-gray-600">Taking you to your dashboard…</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StaffInvitePage() {
  return (
    <Suspense fallback={null}>
      <StaffInviteContent />
    </Suspense>
  )
}
