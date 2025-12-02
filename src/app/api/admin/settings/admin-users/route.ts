import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'admin' | 'viewer'
  lastLogin: string | null
  status: 'active' | 'inactive'
  createdAt?: any
  updatedAt?: any
  createdBy?: string
}

export async function GET(request: NextRequest) {
  try {
    const adminUsersRef = collection(db, 'admin_users')
    const snapshot = await getDocs(adminUsersRef)
    
    const adminUsers: AdminUser[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      adminUsers.push({
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        role: data.role || 'viewer',
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() || null,
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        createdBy: data.createdBy
      })
    })
    
    // Sort by creation date (newest first)
    adminUsers.sort((a, b) => {
      if (!a.createdAt) return 1
      if (!b.createdAt) return -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    return NextResponse.json({
      success: true,
      adminUsers,
      total: adminUsers.length,
      active: adminUsers.filter(u => u.status === 'active').length,
      byRole: {
        super_admin: adminUsers.filter(u => u.role === 'super_admin').length,
        admin: adminUsers.filter(u => u.role === 'admin').length,
        viewer: adminUsers.filter(u => u.role === 'viewer').length
      }
    })
    
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...userData } = body
    
    if (action === 'create') {
      const { name, email, role, createdBy } = userData
      
      // Validate required fields
      if (!name || !email || !role) {
        return NextResponse.json({
          success: false,
          error: 'Missing required fields: name, email, role'
        }, { status: 400 })
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid email format'
        }, { status: 400 })
      }
      
      // Validate role
      const validRoles = ['super_admin', 'admin', 'viewer']
      if (!validRoles.includes(role)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid role',
          validRoles
        }, { status: 400 })
      }
      
      // Check if email already exists
      const existingUsersRef = collection(db, 'admin_users')
      const existingQuery = query(existingUsersRef, where('email', '==', email))
      const existingSnapshot = await getDocs(existingQuery)
      
      if (!existingSnapshot.empty) {
        return NextResponse.json({
          success: false,
          error: 'Admin user with this email already exists'
        }, { status: 400 })
      }
      
      // Create new admin user
      const adminUserId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newAdminUser: AdminUser = {
        id: adminUserId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        lastLogin: null,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: createdBy || 'Unknown'
      }
      
      const adminUserRef = doc(db, 'admin_users', adminUserId)
      await setDoc(adminUserRef, newAdminUser)
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        adminUser: {
          ...newAdminUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
      
    } else if (action === 'update') {
      const { id, ...updateData } = userData
      
      if (!id) {
        return NextResponse.json({
          success: false,
          error: 'Admin user ID is required for update'
        }, { status: 400 })
      }
      
      const adminUserRef = doc(db, 'admin_users', id)
      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp()
      }
      
      await setDoc(adminUserRef, updatePayload, { merge: true })
      
      return NextResponse.json({
        success: true,
        message: 'Admin user updated successfully'
      })
      
    } else if (action === 'delete') {
      const { id } = userData
      
      if (!id) {
        return NextResponse.json({
          success: false,
          error: 'Admin user ID is required for deletion'
        }, { status: 400 })
      }
      
      const adminUserRef = doc(db, 'admin_users', id)
      await deleteDoc(adminUserRef)
      
      return NextResponse.json({
        success: true,
        message: 'Admin user deleted successfully'
      })
      
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action',
        validActions: ['create', 'update', 'delete']
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Error managing admin user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to manage admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
