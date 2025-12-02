import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { adminApp } from '@/lib/firebase-admin-server'
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Mock staff data for development - starting with empty list
const mockStaffMembers: any[] = []

export async function GET(request: NextRequest) {
  try {
    // Fetch staff members from Firestore
    const staffCollection = collection(db, 'staff')
    const staffSnapshot = await getDocs(staffCollection)
    
    const allStaff = staffSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        email: data.email,
        role: data.role,
        permissions: data.permissions || [],
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate?.()?.toISOString()?.split('T')[0] || 'Unknown',
        lastLogin: data.lastLogin?.toDate?.()?.toISOString()?.split('T')[0] || null
      }
    })
    
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    
    let filteredStaff = [...allStaff]
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filteredStaff = filteredStaff.filter(staff => 
        staff.name.toLowerCase().includes(searchLower) ||
        staff.email.toLowerCase().includes(searchLower) ||
        staff.role.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply role filter
    if (role) {
      filteredStaff = filteredStaff.filter(staff => staff.role === role)
    }
    
    // Apply status filter
    if (status) {
      filteredStaff = filteredStaff.filter(staff => staff.status === status)
    }
    
    return NextResponse.json({
      success: true,
      staff: filteredStaff,
      total: filteredStaff.length,
      message: 'Staff members retrieved successfully'
    })
    
  } catch (error) {
    console.error('Error fetching staff members:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch staff members',
      staff: [],
      total: 0
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { name, email, role, permissions, password } = body
    
    if (!name || !email || !role || !password) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, email, role, and password are required'
      }, { status: 400 })
    }
    
    // Create Firebase Auth user
    if (!adminApp) {
      console.error('Firebase Admin SDK not initialized - missing environment variables')
      console.log('Falling back to mock user creation for development')
      
      // For development without Firebase Admin SDK, create a mock user
      const mockUserId = `mock_${Date.now()}`
      
      const staffData = {
        name,
        email,
        role,
        permissions: permissions || [],
        status: 'active',
        createdAt: serverTimestamp(),
        lastLogin: null,
        authId: mockUserId,
        isMockUser: true // Flag to indicate this is a development user
      }
      
      // Save to Firestore
      await setDoc(doc(db, 'staff', mockUserId), staffData)
      
      const newStaffMember = {
        id: mockUserId,
        name,
        email,
        role,
        permissions: permissions || [],
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: null
      }
      
      return NextResponse.json({
        success: true,
        staff: newStaffMember,
        message: 'Staff member created successfully (Development Mode - No Firebase Auth)',
        credentials: {
          email,
          password,
          note: 'This is a development user. Firebase Auth not configured.'
        }
      }, { status: 201 })
    }
    
    const auth = getAuth(adminApp)
    
    try {
      // Check if user already exists
      try {
        await auth.getUserByEmail(email)
        return NextResponse.json({
          success: false,
          error: 'A user with this email already exists'
        }, { status: 400 })
      } catch (userNotFoundError: any) {
        // User doesn't exist, which is what we want
        if (userNotFoundError.code !== 'auth/user-not-found') {
          throw userNotFoundError
        }
      }
      
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true // Set as verified since admin is creating
      })
      
      console.log(`Created Firebase Auth user: ${userRecord.uid} for ${email}`)
      
      // Create staff member record in Firestore
      const staffData = {
        name,
        email,
        role,
        permissions: permissions || [],
        status: 'active',
        createdAt: serverTimestamp(),
        lastLogin: null,
        authId: userRecord.uid
      }
      
      // Save to Firestore
      await setDoc(doc(db, 'staff', userRecord.uid), staffData)
      
      const newStaffMember = {
        id: userRecord.uid,
        name,
        email,
        role,
        permissions: permissions || [],
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: null
      }
      
      // Add to mock data for immediate response (in real app, this would be fetched from database)
      mockStaffMembers.push(newStaffMember)
    
      return NextResponse.json({
        success: true,
        staff: newStaffMember,
        message: 'Staff member created successfully with login credentials',
        credentials: {
          email,
          password // In production, don't return password in response
        }
      }, { status: 201 })
      
    } catch (authError: any) {
      console.error('Error creating Firebase Auth user:', authError)
      
      // Handle specific Firebase Auth errors
      if (authError.code === 'auth/email-already-exists') {
        return NextResponse.json({
          success: false,
          error: 'A user with this email already exists'
        }, { status: 400 })
      } else if (authError.code === 'auth/invalid-email') {
        return NextResponse.json({
          success: false,
          error: 'Invalid email address'
        }, { status: 400 })
      } else if (authError.code === 'auth/weak-password') {
        return NextResponse.json({
          success: false,
          error: 'Password is too weak'
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create staff member: ' + (authError.message || 'Unknown error')
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error creating staff member:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create staff member'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, role, permissions, status } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Staff member ID is required'
      }, { status: 400 })
    }
    
    // In a real application, you would:
    // 1. Verify the user is authenticated and has admin privileges
    // 2. Update the staff member in your database
    // 3. Handle any role/permission changes
    
    const staffIndex = mockStaffMembers.findIndex(staff => staff.id === id)
    
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

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Staff member ID is required'
      }, { status: 400 })
    }
    
    // In a real application, you would:
    // 1. Verify the user is authenticated and has admin privileges
    // 2. Delete the staff member from your database
    // 3. Handle any cleanup (disable access, etc.)
    
    const staffIndex = mockStaffMembers.findIndex(staff => staff.id === id)
    
    if (staffIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Staff member not found'
      }, { status: 404 })
    }
    
    // Remove from mock data (in real app, delete from database)
    const deletedStaff = mockStaffMembers.splice(staffIndex, 1)[0]
    
    return NextResponse.json({
      success: true,
      staff: deletedStaff,
      message: 'Staff member deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting staff member:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete staff member'
    }, { status: 500 })
  }
}
