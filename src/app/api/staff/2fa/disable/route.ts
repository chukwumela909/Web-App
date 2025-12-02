import { NextRequest, NextResponse } from 'next/server'
import {
  getStaffMember,
  updateStaff,
  createStaffActivityLog
} from '@/lib/firestore'

// POST /api/staff/2fa/disable - Disable 2FA for a staff member
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

    // Disable 2FA
    await updateStaff(staffId, {
      twoFactorEnabled: false,
      twoFactorSecret: '' // Clear the secret
    })

    // Log the activity
    await createStaffActivityLog(userId, {
      staffId: staff.authId,
      staffName: staff.fullName,
      action: '2fa_disabled',
      description: `2FA disabled for ${staff.fullName}`,
      metadata: {
        staffId,
        disabledBy: userId
      },
      severity: 'warning'
    })

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully'
    })
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to disable 2FA' },
      { status: 500 }
    )
  }
}
