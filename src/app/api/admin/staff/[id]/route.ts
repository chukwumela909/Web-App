import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { adminApp } from '@/lib/firebase-admin-server'
import { doc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Mock staff data for development - starting with empty list
const mockStaffMembers: any[] = []

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params
    
    // Fetch staff member from Firestore
    const staffDoc = await getDoc(doc(db, 'staff', staffId))
    
    if (!staffDoc.exists()) {
      return NextResponse.json({
        success: false,
        error: 'Staff member not found'
      }, { status: 404 })
    }
    
    const data = staffDoc.data()
    const staff = {
      id: staffDoc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      status: data.status || 'active',
      createdAt: data.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || 'Unknown',
      lastLogin: data.lastLogin?.toDate?.()?.toISOString()?.split('T')[0] || null
    }
    
    return NextResponse.json({
      success: true,
      staff,
      message: 'Staff member retrieved successfully'
    })
    
  } catch (error) {
    console.error('Error fetching staff member:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch staff member'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params
    const body = await request.json()
    const { name, email, role, permissions, status } = body
    
    // In a real application, you would:
    // 1. Verify the user is authenticated and has admin privileges
    // 2. Update the staff member in your database
    // 3. Handle any role/permission changes
    // 4. Send notification emails if needed
    
    const staffIndex = mockStaffMembers.findIndex(s => s.id === staffId)
    
    if (staffIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Staff member not found'
      }, { status: 404 })
    }
    
    // Update the staff member
    mockStaffMembers[staffIndex] = {
      ...mockStaffMembers[staffIndex],
      name: name || mockStaffMembers[staffIndex].name,
      email: email || mockStaffMembers[staffIndex].email,
      role: role || mockStaffMembers[staffIndex].role,
      permissions: permissions || mockStaffMembers[staffIndex].permissions,
      status: status || mockStaffMembers[staffIndex].status
    }
    
    return NextResponse.json({
      success: true,
      staff: mockStaffMembers[staffIndex],
      message: 'Staff member updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating staff member:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update staff member'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: staffId } = await params
    
    // Delete Firebase Auth user and Firestore record
    const auth = getAuth(adminApp)
    
    try {
      // Delete Firebase Auth user
      await auth.deleteUser(staffId)
      console.log(`Deleted Firebase Auth user: ${staffId}`)
      
      // Delete Firestore record
      await deleteDoc(doc(db, 'staff', staffId))
      console.log(`Deleted Firestore staff record: ${staffId}`)
      
      // Remove from mock data for immediate response
      const staffIndex = mockStaffMembers.findIndex(s => s.id === staffId)
      const deletedStaff = staffIndex !== -1 
        ? mockStaffMembers.splice(staffIndex, 1)[0]
        : { id: staffId, name: 'Unknown', email: 'unknown@example.com' }
    
      return NextResponse.json({
        success: true,
        staff: deletedStaff,
        message: 'Staff member deleted successfully'
      })
      
    } catch (authError: any) {
      console.error('Error deleting Firebase Auth user:', authError)
      
      if (authError.code === 'auth/user-not-found') {
        // User already deleted or doesn't exist, still try to clean up Firestore
        try {
          await deleteDoc(doc(db, 'staff', staffId))
          console.log(`Cleaned up Firestore staff record: ${staffId}`)
        } catch (firestoreError) {
          console.error('Error cleaning up Firestore record:', firestoreError)
        }
        
        return NextResponse.json({
          success: true,
          staff: { id: staffId, name: 'Unknown', email: 'unknown@example.com' },
          message: 'Staff member deleted successfully (user was already removed from authentication)'
        })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to delete staff member: ' + (authError.message || 'Unknown error')
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error deleting staff member:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete staff member'
    }, { status: 500 })
  }
}
