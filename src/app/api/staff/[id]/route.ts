import { NextRequest, NextResponse } from 'next/server'
import {
  Staff,
  getStaffMember,
  updateStaff,
  deactivateStaff,
  activateStaff,
  createStaffActivityLog
} from '@/lib/firestore'

// GET /api/staff/[id] - Get specific staff member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params

    const staff = await getStaffMember(staffId)
    if (!staff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Don't expose sensitive data
    const safeStaff = {
      ...staff,
      twoFactorSecret: undefined
    }

    return NextResponse.json({
      success: true,
      data: safeStaff
    })
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff member' },
      { status: 500 }
    )
  }
}

// PUT /api/staff/[id] - Update staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params
    const data = await request.json()
    const {
      userId,
      fullName,
      phone,
      role,
      branchIds,
      status,
      employeeId,
      salary,
      emergencyContact,
      twoFactorEnabled,
      permissions
    } = data

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Get current staff data
    const currentStaff = await getStaffMember(staffId)
    if (!currentStaff) {
      return NextResponse.json(
        { success: false, error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Validate role if provided
    if (role && !['cashier', 'manager', 'owner'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be cashier, manager, or owner' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: Partial<Staff> = {}
    if (fullName !== undefined) updateData.fullName = fullName
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (branchIds !== undefined) updateData.branchIds = branchIds
    if (status !== undefined) updateData.status = status
    if (employeeId !== undefined) updateData.employeeId = employeeId
    if (salary !== undefined) updateData.salary = salary
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled
    if (permissions !== undefined) updateData.permissions = permissions

    // Update staff
    await updateStaff(staffId, updateData)

    // Log the activity
    const changedFields = Object.keys(updateData).join(', ')
    await createStaffActivityLog(userId, {
      staffId: currentStaff.authId,
      staffName: fullName || currentStaff.fullName,
      action: 'staff_updated',
      description: `Staff member ${currentStaff.fullName} was updated. Changed fields: ${changedFields}`,
      metadata: {
        changedFields: Object.keys(updateData),
        previousRole: currentStaff.role,
        newRole: role || currentStaff.role,
        staffId
      },
      severity: 'info'
    })

    // Get updated staff data
    const updatedStaff = await getStaffMember(staffId)

    return NextResponse.json({
      success: true,
      data: {
        ...updatedStaff,
        twoFactorSecret: undefined
      }
    })
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

// PATCH /api/staff/[id] - Partially update staff member (same as PUT but semantically correct for partial updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Use the same logic as PUT for partial updates
  return PUT(request, { params })
}

// DELETE /api/staff/[id] - Deactivate staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const permanent = searchParams.get('permanent') === 'true'

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

    if (permanent) {
      // For now, we'll just deactivate instead of permanent deletion
      // Permanent deletion would require also deleting the Firebase Auth user
      await deactivateStaff(staffId)
      
      await createStaffActivityLog(userId, {
        staffId: staff.authId,
        staffName: staff.fullName,
        action: 'staff_deleted',
        description: `Staff member ${staff.fullName} was permanently deleted`,
        metadata: {
          role: staff.role,
          branchIds: staff.branchIds,
          employeeId: staff.employeeId
        },
        severity: 'warning'
      })
    } else {
      // Soft delete - deactivate
      await deactivateStaff(staffId)
      
      await createStaffActivityLog(userId, {
        staffId: staff.authId,
        staffName: staff.fullName,
        action: 'staff_deactivated',
        description: `Staff member ${staff.fullName} was deactivated`,
        metadata: {
          role: staff.role,
          branchIds: staff.branchIds,
          employeeId: staff.employeeId
        },
        severity: 'info'
      })
    }

    return NextResponse.json({
      success: true,
      message: permanent ? 'Staff member deleted permanently' : 'Staff member deactivated'
    })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}
