import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'

const BREVO_API_KEY = process.env.BREVO_API_KEY || ''

function roleLabel(role: string) {
  if (role === 'manager') return 'Manager'
  if (role === 'cashier') return 'Cashier'
  return role || 'Staff'
}

// POST /api/staff/invite-email — email a staff invitation link via Brevo
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireUser(request)
    if ('response' in authResult) return authResult.response

    const { email, inviteUrl, role, businessName } = await request.json()

    if (!email || !inviteUrl) {
      return NextResponse.json({ error: 'email and inviteUrl are required' }, { status: 400 })
    }

    if (!BREVO_API_KEY) {
      // Not fatal: the caller still shows the copyable link. Report that email was not sent.
      return NextResponse.json(
        { success: false, emailed: false, error: 'Brevo API key not configured' },
        { status: 200 }
      )
    }

    const business = businessName || 'a FahamPesa business'
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
        <h2 style="color:#0f172a;">You've been invited to join ${business}</h2>
        <p>You've been invited as a <strong>${roleLabel(role)}</strong> on FahamPesa.</p>
        <p>Click the button below to accept your invitation and set up your account. You'll sign in (or create an account) using <strong>${email}</strong>.</p>
        <p style="margin:28px 0;">
          <a href="${inviteUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Accept invitation</a>
        </p>
        <p style="color:#64748b;font-size:13px;">Or paste this link into your browser:<br/>${inviteUrl}</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">This invitation expires in 7 days. If you weren't expecting it, you can ignore this email.</p>
      </div>
    `

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: 'FahamPesa', email: 'info@fahampesa.com' },
        to: [{ email }],
        subject: `You're invited to join ${business} on FahamPesa`,
        htmlContent,
        textContent: `You've been invited as a ${roleLabel(role)} on FahamPesa. Accept your invitation: ${inviteUrl}`,
        tags: ['staff-invitation']
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      return NextResponse.json(
        { success: false, emailed: false, error: errorData.message || 'Failed to send email' },
        { status: 200 }
      )
    }

    return NextResponse.json({ success: true, emailed: true })
  } catch (error) {
    console.error('Error sending staff invite email:', error)
    return NextResponse.json(
      { success: false, emailed: false, error: 'Failed to send invitation email' },
      { status: 200 }
    )
  }
}
