// API route for inventory alerts (low stock and expiry)
import { NextRequest, NextResponse } from 'next/server'
import { generateLowStockAlerts, getLowStockAlerts, acknowledgeAlert } from '@/lib/inventory-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const branchId = searchParams.get('branchId') || undefined
    const generate = searchParams.get('generate') === 'true'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    let lowStockAlerts
    
    if (generate) {
      // Generate new alerts and return them
      lowStockAlerts = await generateLowStockAlerts(userId, branchId)
    } else {
      // Just get existing active alerts
      lowStockAlerts = await getLowStockAlerts(userId, branchId)
    }

    return NextResponse.json({
      success: true,
      data: {
        lowStock: lowStockAlerts,
        expiring: [] // TODO: Implement expiry alerts
      }
    })
  } catch (error) {
    console.error('Get alerts API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve alerts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, alertId, alertType } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    if (!alertType) {
      return NextResponse.json(
        { success: false, error: 'Alert type is required' },
        { status: 400 }
      )
    }

    if (!['low_stock', 'expiry'].includes(alertType)) {
      return NextResponse.json(
        { success: false, error: 'Alert type must be low_stock or expiry' },
        { status: 400 }
      )
    }

    await acknowledgeAlert(alertId, userId, alertType)

    return NextResponse.json({
      success: true,
      message: 'Alert acknowledged successfully'
    })
  } catch (error) {
    console.error('Acknowledge alert API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to acknowledge alert' },
      { status: 500 }
    )
  }
}
