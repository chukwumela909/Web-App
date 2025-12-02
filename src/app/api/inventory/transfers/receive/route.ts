// API route for receiving stock transfers
import { NextRequest, NextResponse } from 'next/server'
import { receiveStockTransfer } from '@/lib/inventory-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, transferId, receipts } = body

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

    if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Receipts array is required' },
        { status: 400 }
      )
    }

    // Validate receipts
    for (const receipt of receipts) {
      if (!receipt.productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required for all receipts' },
          { status: 400 }
        )
      }
      
      if (typeof receipt.receivedQuantity !== 'number' || receipt.receivedQuantity < 0) {
        return NextResponse.json(
          { success: false, error: 'Received quantity must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    await receiveStockTransfer(transferId, userId, receipts)

    return NextResponse.json({
      success: true,
      message: 'Stock transfer received successfully'
    })
  } catch (error) {
    console.error('Receive stock transfer API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to receive stock transfer' },
      { status: 500 }
    )
  }
}
