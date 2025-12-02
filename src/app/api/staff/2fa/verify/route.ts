import { NextRequest, NextResponse } from 'next/server'
import * as speakeasy from 'speakeasy'
import {
  getStaffMember,
  updateStaff,
  createStaffActivityLog
} from '@/lib/firestore'

// POST /api/staff/2fa/verify - Verify 2FA token and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { staffId, userId, token } = data

    if (!staffId || !userId || !token) {
      return NextResponse.json(
        { error: 'staffId, userId, and token are required' },
        { status: 400 }
      )
    }

    // Get staff member
    const staff = await getStaffMember(staffId)
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      )
    }

    if (!staff.twoFactorSecret) {
      return NextResponse.json(
        { success: false, error: '2FA setup not initiated' },
        { status: 400 }
      )
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: staff.twoFactorSecret,
      encoding: 'base32',
      token: token.replace(/\s/g, ''), // Remove spaces
      window: 2 // Allow for time skew
    })

    if (!verified) {
      // Log failed verification
      await createStaffActivityLog(userId, {
        staffId: staff.authId,
        staffName: staff.fullName,
        action: '2fa_verification_failed',
        description: `Failed 2FA verification attempt for ${staff.fullName}`,
        metadata: {
          staffId
        },
        severity: 'warning'
      })

      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Enable 2FA for the staff member
    await updateStaff(staffId, {
      twoFactorEnabled: true
    })

    // Log successful verification
    await createStaffActivityLog(userId, {
      staffId: staff.authId,
      staffName: staff.fullName,
      action: '2fa_enabled',
      description: `2FA successfully enabled for ${staff.fullName}`,
      metadata: {
        staffId
      },
      severity: 'info'
    })

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully'
    })
  } catch (error) {
    console.error('Error verifying 2FA:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}

// POST /api/staff/2fa/verify/login - Verify 2FA token during login
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { staffId, token } = data

    if (!staffId || !token) {
      return NextResponse.json(
        { error: 'staffId and token are required' },
        { status: 400 }
      )
    }

    // Get staff member
    const staff = await getStaffMember(staffId)
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      )
    }

    if (!staff.twoFactorEnabled || !staff.twoFactorSecret) {
      return NextResponse.json(
        { success: false, error: '2FA not enabled for this user' },
        { status: 400 }
      )
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: staff.twoFactorSecret,
      encoding: 'base32',
      token: token.replace(/\s/g, ''), // Remove spaces
      window: 2 // Allow for time skew
    })

    if (!verified) {
      // Log failed login attempt
      await createStaffActivityLog(staff.userId, {
        staffId: staff.authId,
        staffName: staff.fullName,
        action: '2fa_login_failed',
        description: `Failed 2FA login attempt for ${staff.fullName}`,
        metadata: {
          staffId
        },
        severity: 'warning'
      })

      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Log successful 2FA login
    await createStaffActivityLog(staff.userId, {
      staffId: staff.authId,
      staffName: staff.fullName,
      action: '2fa_login_success',
      description: `Successful 2FA login for ${staff.fullName}`,
      metadata: {
        staffId
      },
      severity: 'info'
    })

    return NextResponse.json({
      success: true,
      message: '2FA verification successful'
    })
  } catch (error) {
    console.error('Error verifying 2FA login:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify 2FA' },
      { status: 500 }
    )
  }
}
