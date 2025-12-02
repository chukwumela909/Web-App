// API route for stock level operations
import { NextRequest, NextResponse } from 'next/server'
import { getStockLevels, getStockLevel } from '@/lib/inventory-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const branchId = searchParams.get('branchId')
    const productId = searchParams.get('productId')
    const productIds = searchParams.get('productIds')?.split(',') || undefined

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!branchId) {
      return NextResponse.json(
        { success: false, error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    // Get stock level for specific product
    if (productId) {
      const stockLevel = await getStockLevel(productId, branchId)
      
      if (!stockLevel) {
        return NextResponse.json(
          { success: false, error: 'Stock level not found for this product' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: stockLevel
      })
    }

    // Get stock levels for multiple products or all products in branch
    const stockLevels = await getStockLevels(userId, branchId, productIds)

    return NextResponse.json({
      success: true,
      data: stockLevels
    })
  } catch (error) {
    console.error('Stock levels API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve stock levels' },
      { status: 500 }
    )
  }
}
