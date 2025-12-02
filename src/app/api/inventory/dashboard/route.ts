// API route for inventory dashboard data
import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/firestore'

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

    const dashboard = {
      branchId,
      totalProducts,
      lowStockItems,
      outOfStockItems,
      expiringItems: 0, // TODO: Implement expiry tracking
      totalInventoryValue,
      recentMovements: [], // TODO: Implement movement tracking
      alerts: {
        lowStock: [], // TODO: Implement low stock alerts
        expiring: [] // TODO: Implement expiry alerts
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
