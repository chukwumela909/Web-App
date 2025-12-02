// API route for stock movement history and tracking
import { NextRequest, NextResponse } from 'next/server'
import { getStockMovements, createStockMovement } from '@/lib/inventory-service'
import { StockMovementType } from '@/lib/inventory-types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const productId = searchParams.get('productId') || undefined
    const branchId = searchParams.get('branchId') || undefined
    const movementType = searchParams.get('movementType') as StockMovementType || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build filters object
    const filters = {
      ...(productId && { productId }),
      ...(branchId && { branchId }),
      ...(movementType && { movementType }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    }

    const movements = await getStockMovements(
      userId,
      Object.keys(filters).length > 0 ? filters : undefined,
      { limit }
    )

    return NextResponse.json({
      success: true,
      data: movements
    })
  } catch (error) {
    console.error('Stock movements API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve stock movements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...movementData } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    const requiredFields = ['productId', 'branchId', 'movementType', 'quantity']
    for (const field of requiredFields) {
      if (!movementData[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    if (typeof movementData.quantity !== 'number' || movementData.quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a positive number' },
        { status: 400 }
      )
    }

    const movementId = await createStockMovement(userId, {
      ...movementData,
      status: movementData.status || 'APPROVED'
    })

    return NextResponse.json({
      success: true,
      data: { movementId },
      message: 'Stock movement created successfully'
    })
  } catch (error) {
    console.error('Create stock movement API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create stock movement' },
      { status: 500 }
    )
  }
}
