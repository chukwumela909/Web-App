// API route for suppliers dashboard data
import { NextRequest, NextResponse } from 'next/server'
import { getSupplierDashboard } from '@/lib/suppliers-service'

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

    const dashboard = await getSupplierDashboard(userId)

    return NextResponse.json({
      success: true,
      data: dashboard
    })
  } catch (error) {
    console.error('Suppliers dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    )
  }
}
