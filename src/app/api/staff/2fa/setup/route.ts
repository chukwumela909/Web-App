import { NextRequest, NextResponse } from 'next/server'
import * as speakeasy from 'speakeasy'
import * as qrcode from 'qrcode'
import {
  getStaffMember,
  updateStaff,
  createStaffActivityLog
} from '@/lib/firestore'

// POST /api/staff/2fa/setup - Setup 2FA for a staff member
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { staffId, userId } = data

    if (!staffId || !userId) {
      return NextResponse.json(
        { error: 'staffId and userId are required' },
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

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `FahamPesa - ${staff.fullName}`,
      issuer: 'FahamPesa'
    })

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!)

    // Store the secret temporarily (not activated until verified)
    await updateStaff(staffId, {
      twoFactorSecret: secret.base32 // In production, this should be encrypted
    })

    // Log the activity
    await createStaffActivityLog(userId, {
      staffId: staff.authId,
      staffName: staff.fullName,
      action: '2fa_setup_initiated',
      description: `2FA setup initiated for ${staff.fullName}`,
      metadata: {
        staffId
      },
      severity: 'info'
    })

    return NextResponse.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntry: secret.base32
      }
    })
  } catch (error) {
    console.error('Error setting up 2FA:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to setup 2FA' },
      { status: 500 }
    )
  }
}
