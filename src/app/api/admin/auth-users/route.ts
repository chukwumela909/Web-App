import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin-server'

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not initialized'
      }, { status: 500 })
    }
    
    // Fetch users from Firestore using Admin SDK
    const snapshot = await adminDb.collection('users').get()
    
    const users: any[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        id: doc.id,
        email: data.email || 'No email',
        displayName: data.displayName || data.name || 'No name',
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : 'No date',
        lastActiveAt: data.lastActiveAt ? (data.lastActiveAt.toDate ? data.lastActiveAt.toDate().toISOString() : data.lastActiveAt) : 'Never',
        disabled: data.disabled || false,
        region: data.region || 'Unknown',
        emailVerified: data.emailVerified || false
      })
    })
    
    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => !u.disabled).length,
      disabledUsers: users.filter(u => u.disabled).length,
      verifiedEmails: users.filter(u => u.emailVerified).length,
      usersWithRegion: users.filter(u => u.region && u.region !== 'Unknown').length,
      recentUsers: users.filter(u => {
        const createdDate = new Date(u.createdAt)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return createdDate >= weekAgo
      }).length
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      users: users.slice(0, 10), // Return first 10 users
      totalCount: users.length,
      note: "This data comes from Firestore 'users' collection. Firebase Auth users require server-side admin access."
    })
    
  } catch (error) {
    console.error('Error fetching auth users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
