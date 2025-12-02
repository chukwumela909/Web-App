import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const branchesRef = collection(db, 'branches')
    const branchesSnapshot = await getDocs(branchesRef)
    
    const branches = []
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
