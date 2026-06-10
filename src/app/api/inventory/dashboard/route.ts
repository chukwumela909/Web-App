// API route for inventory dashboard data
import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/firestore'
import { getStockMovements } from '@/lib/inventory-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const branchId = searchParams.get('branchId')

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

    // Get products directly using the getProducts function
    const products = await getProducts(userId)

    // Calculate dashboard metrics from products
    const totalProducts = products.length
    const lowStockItems = products.filter(product => (product.quantity || 0) <= (product.minStockLevel || 0)).length
    const outOfStockItems = products.filter(product => (product.quantity || 0) === 0).length
    
    // Calculate total inventory value
    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + ((product.quantity || 0) * (product.costPrice || 0))
    }, 0)

    // Expiry tracking: products expiring within the next 30 days
    const now = Date.now()
    const EXPIRY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
    const expiringProducts = products.filter(product =>
      typeof product.expiryDate === 'number' &&
      (product.quantity || 0) > 0 &&
      product.expiryDate <= now + EXPIRY_WINDOW_MS
    )

    // Low-stock and expiring alerts
    const lowStockAlerts = products
      .filter(product => (product.quantity || 0) <= (product.minStockLevel || 0))
      .map(product => ({
        productId: product.id,
        productName: product.name,
        currentStock: product.quantity || 0,
        minStockLevel: product.minStockLevel || 0
      }))
    const expiringAlerts = expiringProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      expiryDate: typeof product.expiryDate === 'number' ? new Date(product.expiryDate) : null,
      quantity: product.quantity || 0
    }))

    // Recent stock movements for this branch (best-effort, enriched with product names)
    const productNameMap = new Map(products.map(product => [product.id, product.name]))
    let recentMovements: any[] = []
    try {
      const movementHistory = await getStockMovements(userId, { branchId }, { limit: 10 })
      recentMovements = movementHistory.movements.map(movement => ({
        ...movement,
        productName: productNameMap.get(movement.productId) || 'Unknown product'
      }))
    } catch (movementError) {
      console.error('Error loading recent stock movements:', movementError)
    }

    const dashboard = {
      branchId,
      totalProducts,
      lowStockItems,
      outOfStockItems,
      expiringItems: expiringProducts.length,
      totalInventoryValue,
      recentMovements,
      alerts: {
        lowStock: lowStockAlerts,
        expiring: expiringAlerts
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboard
    })
  } catch (error) {
    console.error('Inventory dashboard API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve dashboard data' },
      { status: 500 }
    )
  }
}
