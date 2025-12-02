import { NextRequest, NextResponse } from 'next/server'
import {
  getStaffMember,
  activateStaff,
  createStaffActivityLog
} from '@/lib/firestore'

// POST /api/staff/[id]/activate - Activate/reactivate staff member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params
    const data = await request.json()
    const { userId } = data

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get current staff data
    const staff = await getStaffMember(staffId)
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Activate the staff member
    await activateStaff(staffId)

    // Log the activity
    await createStaffActivityLog(userId, {
      staffId: staff.authId,
      staffName: staff.fullName,
      action: 'staff_activated',
      description: `Staff member ${staff.fullName} was reactivated`,
      metadata: {
        role: staff.role,
        branchIds: staff.branchIds,
        employeeId: staff.employeeId,
        previousStatus: staff.status
      },
      severity: 'info'
    })

    return NextResponse.json({
      success: true,
      message: 'Staff member activated successfully'
    })
  } catch (error) {
    console.error('Error activating staff:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to activate staff member' },
      { status: 500 }
    )
  }
}
