// API route for approving stock transfers
import { NextRequest, NextResponse } from 'next/server'
import { approveStockTransfer } from '@/lib/inventory-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, transferId, approvals } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!transferId) {
      return NextResponse.json(
        { success: false, error: 'Transfer ID is required' },
        { status: 400 }
      )
    }

    if (!approvals || !Array.isArray(approvals) || approvals.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Approvals array is required' },
        { status: 400 }
      )
    }

    // Validate approvals
    for (const approval of approvals) {
      if (!approval.productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required for all approvals' },
          { status: 400 }
        )
      }
      
      if (typeof approval.approvedQuantity !== 'number' || approval.approvedQuantity < 0) {
        return NextResponse.json(
          { success: false, error: 'Approved quantity must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    await approveStockTransfer(transferId, userId, approvals)

    return NextResponse.json({
      success: true,
      message: 'Stock transfer approved successfully'
    })
  } catch (error) {
    console.error('Approve stock transfer API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to approve stock transfer' },
      { status: 500 }
    )
  }
}
