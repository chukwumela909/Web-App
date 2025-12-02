// API route for purchase orders dashboard data
import { NextRequest, NextResponse } from 'next/server'
import { 
  getPurchaseOrderDashboard,
  getPendingApprovals,
  getOverduePurchaseOrders 
} from '@/lib/suppliers-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const includeDetails = searchParams.get('includeDetails') === 'true'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const dashboard = await getPurchaseOrderDashboard(userId)

    let response: any = {
      success: true,
      data: dashboard
    }

    // Include additional details if requested
    if (includeDetails) {
      const [pendingApprovals, overdueOrders] = await Promise.all([
        getPendingApprovals(userId),
        getOverduePurchaseOrders(userId)
      ])

      response.data.pendingApprovalsList = pendingApprovals
      response.data.overdueOrdersList = overdueOrders
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Purchase orders dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    )
  }
}
