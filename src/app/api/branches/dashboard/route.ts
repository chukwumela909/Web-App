// API route for branches dashboard data
import { NextRequest, NextResponse } from 'next/server'
import { getBranchDashboard } from '@/lib/branches-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const dashboard = await getBranchDashboard(userId)

    return NextResponse.json({
      success: true,
      data: dashboard
    })
  } catch (error) {
    console.error('Branches dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    )
  }
}
