// API route to initialize inventory for existing products
// This creates inventory records for products that don't have them yet
import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateInventoryItem } from '@/lib/inventory-service'
import { getProducts } from '@/lib/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, branchId, defaultStock = 0 } = body

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

    // Get all products for this user
    const products = await getProducts(userId)
    
    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found to initialize inventory',
        initialized: 0
      })
    }

    let initializedCount = 0

    // Create inventory records for each product
    for (const product of products) {
      try {
        await createOrUpdateInventoryItem(userId, product.id, branchId, {
          currentStock: defaultStock,
          reservedStock: 0,
          minStockLevel: product.minStockLevel || 5,
          averageCostPrice: product.costPrice || 0,
          lastCostPrice: product.costPrice || 0,
          reorderPoint: Math.max(product.minStockLevel || 5, 10),
          reorderQuantity: Math.max(product.minStockLevel || 5, 20)
        })
        
        initializedCount++
      } catch (productError) {
        console.error(`Error initializing inventory for product ${product.id}:`, productError)
        // Continue with other products even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully initialized inventory for ${initializedCount} products`,
      initialized: initializedCount,
      total: products.length
    })

  } catch (error) {
    console.error('Initialize inventory API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize inventory' },
      { status: 500 }
    )
  }
}
