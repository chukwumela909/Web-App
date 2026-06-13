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

type Phase = 'loading' | 'collect' | 'accepting' | 'success' | 'error'

function roleLabel(role: string) {
  if (role === 'manager') return 'Manager'
  if (role === 'cashier') return 'Cashier'
  return role
}

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'You already have an account. Enter your password to sign in.'
    case 'auth/weak-password':
      return 'Please choose a password with at least 6 characters.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password. Try again, or reset it from the sign-in page.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/invalid-email':
      return 'The invitation email looks invalid. Please ask for a new invite.'
    default:
      return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
  }
}

function StaffInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const { user, loading: authLoading, login, register, logout, refreshBackendSession } = useAuth()

  const [phase, setPhase] = useState<Phase>('loading')
  const [invite, setInvite] = useState<BackendInvitationLookup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'create' | 'signin'>('create')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const emailMatches = Boolean(
    user?.email && invite?.email && user.email.toLowerCase() === invite.email.toLowerCase()
  )

  // Resolve the invitation up front. The lookup is public (token-gated), so this works even
  // before the invitee has an account or is signed in — letting us show who invited them and
  // pre-fill their email.
  const loadInvite = useCallback(async () => {
    if (!token) {
      setError('This invitation link is invalid or missing its token.')
      setPhase('error')
      return
    }
    try {
      const data = await lookupBackendStaffInvitation(token)
      setInvite(data)
      if (data.status === 'accepted') {
        setError('This invitation has already been accepted. Please sign in to continue.')
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
      setPhase('collect')
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
    loadInvite()
  }, [authLoading, loadInvite])

  // Shared accept step — assumes the signed-in Firebase user's email matches the invite.
  const acceptInvite = useCallback(async () => {
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
        // Already a member — just send them in.
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
      setPhase('collect')
    }
  }, [token, refreshBackendSession, router])

  // New invitee (or returning one) sets/enters their password, then we accept immediately.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!invite) return
    setError(null)
    setBusy(true)
    try {
      if (mode === 'create') {
        await register(invite.email, password)
      } else {
        await login(invite.email, password)
      }
      // Firebase sets auth.currentUser synchronously once these resolve, so we can accept now.
      await acceptInvite()
    } catch (err) {
      // If they already have an account, flip to sign-in instead of dead-ending on "create".
      if ((err as { code?: string })?.code === 'auth/email-already-in-use') {
        setMode('signin')
        setPassword('')
      }
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSwitchAccount = async () => {
    await logout()
    setPassword('')
    setMode('create')
    setError(null)
    setPhase('collect')
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

        {(phase === 'collect' || phase === 'accepting') && invite && (
          <div className="space-y-5">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-gray-700">You&apos;ve been invited to join</p>
              <p className="text-lg font-bold text-gray-900">{invite.businessName}</p>
              <p className="text-gray-700 mt-1">
                as <span className="font-semibold">{roleLabel(invite.role)}</span>
                {invite.branchNames.length > 0 && <> for {invite.branchNames.join(', ')}</>}
              </p>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            {/* Already signed in with the invited email → one-click accept */}
            {user && emailMatches && (
              <button
                onClick={acceptInvite}
                disabled={phase === 'accepting'}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {phase === 'accepting' ? 'Setting up your access…' : 'Accept invitation'}
              </button>
            )}

            {/* Signed in as a different account */}
            {user && !emailMatches && (
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  This invitation is for <span className="font-semibold">{invite.email}</span>, but you are
                  signed in as <span className="font-semibold">{user.email}</span>.
                </p>
                <button
                  onClick={handleSwitchAccount}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Use a different account
                </button>
              </div>
            )}

            {/* Not signed in → set a password (or sign in) to accept in one step */}
            {!user && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-600 text-sm text-center">
                  {mode === 'create'
                    ? 'Create a password to set up your account and accept the invitation.'
                    : 'Enter your password to sign in and accept the invitation.'}
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={invite.email}
                    readOnly
                    aria-readonly="true"
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-600 rounded-xl cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {mode === 'create' ? 'Create a password' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={mode === 'create' ? 'At least 6 characters' : '••••••••'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || phase === 'accepting'}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {busy || phase === 'accepting'
                    ? 'Please wait…'
                    : mode === 'create'
                      ? 'Create account & accept'
                      : 'Sign in & accept'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'create' ? 'signin' : 'create')
                    setError(null)
                  }}
                  className="w-full text-sm text-blue-600 hover:underline"
                >
                  {mode === 'create'
                    ? 'Already have an account? Sign in'
                    : 'Need to set a password? Create your account'}
                </button>
              </form>
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
