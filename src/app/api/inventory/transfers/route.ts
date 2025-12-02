// API route for stock transfers between branches
import { NextRequest, NextResponse } from 'next/server'
import { createStockTransfer, getStockTransfers } from '@/lib/inventory-service'
import { StockTransferRequest } from '@/lib/inventory-types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const branchId = searchParams.get('branchId') || undefined

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const transfers = await getStockTransfers(userId, branchId)

    return NextResponse.json({
      success: true,
      data: transfers
    })
  } catch (error) {
    console.error('Get stock transfers API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve stock transfers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...transferData }: { userId: string } & StockTransferRequest = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!transferData.fromBranchId) {
      return NextResponse.json(
        { success: false, error: 'From branch ID is required' },
        { status: 400 }
      )
    }

    if (!transferData.toBranchId) {
      return NextResponse.json(
        { success: false, error: 'To branch ID is required' },
        { status: 400 }
      )
    }

    if (transferData.fromBranchId === transferData.toBranchId) {
      return NextResponse.json(
        { success: false, error: 'Source and destination branches cannot be the same' },
        { status: 400 }
      )
    }

    if (!transferData.items || transferData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required for transfer' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of transferData.items) {
      if (!item.productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required for all transfer items' },
          { status: 400 }
        )
      }
      
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'Item quantity must be a positive number' },
          { status: 400 }
        )
      }
    }

    const transferId = await createStockTransfer(userId, transferData)

    return NextResponse.json({
      success: true,
      data: { transferId },
      message: 'Stock transfer created successfully'
    })
  } catch (error) {
    console.error('Create stock transfer API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create stock transfer' },
      { status: 500 }
    )
  }
}
