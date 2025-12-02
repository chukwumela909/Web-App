// API route for stock adjustments
import { NextRequest, NextResponse } from 'next/server'
import { adjustStock } from '@/lib/inventory-service'
import { StockAdjustmentRequest } from '@/lib/inventory-types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...adjustmentData }: { userId: string } & StockAdjustmentRequest = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!adjustmentData.productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (!adjustmentData.branchId) {
      return NextResponse.json(
        { success: false, error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    if (typeof adjustmentData.quantity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a number' },
        { status: 400 }
      )
    }

    if (!adjustmentData.reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required for stock adjustments' },
        { status: 400 }
      )
    }

    await adjustStock(userId, adjustmentData)

    return NextResponse.json({
      success: true,
      message: 'Stock adjustment completed successfully'
    })
  } catch (error) {
    console.error('Stock adjustment API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
