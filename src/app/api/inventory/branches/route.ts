// API route for branch management (Inventory module integration)
import { NextRequest, NextResponse } from 'next/server'
import { getBranches, getBranch } from '@/lib/inventory-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const branchId = searchParams.get('branchId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (branchId) {
      // Get specific branch
      const branch = await getBranch(branchId)
      
      if (!branch) {
        return NextResponse.json(
          { success: false, error: 'Branch not found' },
          { status: 404 }
        )
      }

      // Verify ownership
      if (branch.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        data: branch
      })
    }

    // Get all branches for user
    const branches = await getBranches(userId)

    return NextResponse.json({
      success: true,
      data: branches
    })
  } catch (error) {
    console.error('Get branches API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve branches' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Branch creation should be done through the main branches API
  // Redirect to /api/branches for consistency
  return NextResponse.json(
    { 
      success: false, 
      error: 'Use /api/branches for branch creation. This endpoint is for inventory integration only.',
      redirectTo: '/api/branches'
    },
    { status: 400 }
  )
}
