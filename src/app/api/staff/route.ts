import { NextRequest, NextResponse } from 'next/server'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  Staff,
  getStaff,
  createStaff,
  updateStaff,
  deactivateStaff,
  activateStaff,
  createStaffActivityLog,
  STAFF_PERMISSIONS
} from '@/lib/firestore'

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

// POST /api/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      userId,
      fullName,
      email,
      password,
      phone,
      role = 'cashier',
      branchIds = [],
      employeeId,
      hireDate,
      salary,
      emergencyContact,
      twoFactorEnabled = false
    } = data

    if (!userId || !fullName || !email || !password) {
      return NextResponse.json(
        { error: 'userId, fullName, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['cashier', 'manager', 'owner'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be cashier, manager, or owner' },
        { status: 400 }
      )
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const authUser = userCredential.user

    try {
      // Update profile with display name
      await updateProfile(authUser, {
        displayName: fullName
      })

      // Create staff document in Firestore
      const staffData: Partial<Staff> = {
        fullName,
        email,
        phone,
        role,
        branchIds,
        employeeId,
        hireDate: hireDate || Date.now(),
        salary,
        emergencyContact,
        twoFactorEnabled,
        status: 'active'
      }

      await createStaff(userId, staffData, authUser.uid)

      // Log the activity
      await createStaffActivityLog(userId, {
        staffId: authUser.uid,
        staffName: fullName,
        action: 'staff_created',
        description: `New staff member ${fullName} (${role}) was created`,
        metadata: {
          role,
          branchIds,
          employeeId
        },
        severity: 'info'
      })

      return NextResponse.json({
        success: true,
        data: {
          id: authUser.uid,
          authId: authUser.uid,
          fullName,
          email,
          role,
          status: 'active'
        }
      })
    } catch (firestoreError) {
      // If Firestore creation fails, clean up the Auth user
      console.error('Failed to create staff in Firestore, deleting auth user:', firestoreError)
      await authUser.delete()
      throw firestoreError
    }
  } catch (error) {
    console.error('Error creating staff:', error)
    
    // Check if it's a Firebase Auth error
    if ((error as any).code) {
      const firebaseError = error as any
      let message = 'Failed to create staff account'
      
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          message = 'Email address is already in use'
          break
        case 'auth/invalid-email':
          message = 'Invalid email address'
          break
        case 'auth/weak-password':
          message = 'Password is too weak'
          break
        default:
          message = firebaseError.message || message
      }
      
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create staff member' },
      { status: 500 }
    )
  }
}
