import { NextRequest, NextResponse } from 'next/server'
import { getStaff } from '@/lib/firestore'

// GET /api/staff - List all staff for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const branchId = searchParams.get('branchId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    let staff = await getStaff(userId)

    // Filter by branch if specified
    if (branchId) {
      staff = staff.filter(s => s.branchIds.includes(branchId))
    }

    return NextResponse.json({
      success: true,
      data: staff.map(s => ({
        ...s,
        // Don't expose sensitive data
        twoFactorSecret: undefined
      }))
    })
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff' },
      { status: 500 }
    )
  }
}

// NOTE: Staff creation no longer happens here. The legacy Firestore direct-provisioning
// POST handler was removed in favour of the backend invitation flow
// (POST /staff/invitations via createBackendStaffInvitation + the /staff/invite accept page).
