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
    
    const branchesSnapshot = await adminDb.collection('branches').get()
    
    const branches: any[] = []
    branchesSnapshot.forEach((doc) => {
      const data = doc.data()
      branches.push({
        id: doc.id,
        name: data.name || 'Unknown Branch',
        location: data.location || data.address || 'Unknown Location',
        status: data.status || 'Unknown',
        rawData: data
      })
    })
    
    return NextResponse.json({
      success: true,
      totalBranches: branches.length,
      branches,
      hasBranches: branches.length > 0
    })
    
  } catch (error) {
    console.error('Error checking branches:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check branches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
