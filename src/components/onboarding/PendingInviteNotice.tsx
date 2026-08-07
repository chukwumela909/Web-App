'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { resendMyBackendInvitation, type BackendPendingInvitation } from '@/lib/backend-business-api'

function roleLabel(role: string) {
  if (role === 'manager') return 'Manager'
  if (role === 'cashier') return 'Cashier'
  return role
}

interface PendingInviteNoticeProps {
  invitations: BackendPendingInvitation[]
  // Escape hatch: the invitee may still want to create their own business instead.
  onStartOwnBusiness: () => void
}

/**
 * Shown on /onboarding instead of the 7-step business wizard when the signed-in user has a
 * pending staff invitation for their email. Invited staff join an existing business, so
 * business onboarding does not apply to them — they just need to open the invite link from
 * their email (the emailed token is the proof of email ownership, so we can't accept here).
 */
export default function PendingInviteNotice({ invitations, onStartOwnBusiness }: PendingInviteNoticeProps) {
  const { user } = useAuth()
  const [resending, setResending] = useState<string | null>(null)
  const [resent, setResent] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const handleResend = async (invitationId: string) => {
    setResending(invitationId)
    setError(null)
    try {
      await resendMyBackendInvitation(invitationId)
      setResent((prev) => ({ ...prev, [invitationId]: true }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the invitation email.')
    } finally {
      setResending(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">You&apos;ve been invited!</h1>
          <p className="text-gray-500 mt-2">
            No business setup needed — you&apos;re joining an existing business.
          </p>
        </div>

        <div className="space-y-4">
          {invitations.map((invite) => (
            <div key={invite.id} className="bg-blue-50 rounded-xl p-4">
              <p className="text-gray-700 text-center">
                Join <span className="font-bold text-gray-900">{invite.businessName}</span> as{' '}
                <span className="font-semibold">{roleLabel(invite.role)}</span>
                {invite.branchNames.length > 0 && <> for {invite.branchNames.join(', ')}</>}
              </p>
              <p className="text-sm text-gray-600 text-center mt-3">
                Open the invitation link we emailed to{' '}
                <span className="font-semibold">{user?.email}</span> to accept and go straight to
                your dashboard.
              </p>
              <button
                onClick={() => handleResend(invite.id)}
                disabled={resending === invite.id || resent[invite.id]}
                className="w-full mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {resent[invite.id]
                  ? 'Email sent — check your inbox'
                  : resending === invite.id
                    ? 'Sending…'
                    : 'Resend invitation email'}
              </button>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 text-center mt-4">{error}</p>}

        <button
          onClick={onStartOwnBusiness}
          className="w-full mt-6 text-sm text-gray-500 hover:text-gray-700 hover:underline"
        >
          I want to set up my own business instead
        </button>
      </div>
    </div>
  )
}
