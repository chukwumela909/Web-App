// API route for branch inventory summary
import { NextRequest, NextResponse } from 'next/server'
import { 
  getBranchInventorySummary,
  getBranch,
  updateBranchMetrics
} from '@/lib/branches-service'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const refresh = searchParams.get('refresh') === 'true'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify branch exists and user has access
    const branch = await getBranch(params.id)
    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      )
    }

    if (branch.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Refresh branch metrics if requested
    if (refresh) {
      await updateBranchMetrics(params.id, userId)
    }

    const inventorySummary = await getBranchInventorySummary(userId, params.id)

    if (!inventorySummary) {
      return NextResponse.json(
        { success: false, error: 'Could not retrieve inventory summary' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inventorySummary
    })
  } catch (error) {
    console.error('Branch inventory API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve inventory summary' },
      { status: 500 }
    )
  }
}
