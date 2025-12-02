// API route for purchase orders CRUD operations
import { NextRequest, NextResponse } from 'next/server'
import { 
  getPurchaseOrders, 
  createPurchaseOrder, 
  submitPurchaseOrder 
} from '@/lib/suppliers-service'
import { getProducts } from '@/lib/firestore'
import { 
  CreatePurchaseOrderRequest, 
  PurchaseOrderFilters, 
  PurchaseOrderSortField, 
  SortDirection 
} from '@/lib/suppliers-types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Parse filters
    const filters: PurchaseOrderFilters = {}
    
    const statusParam = searchParams.get('status')
    if (statusParam) {
      filters.status = statusParam.split(',') as any[]
    }
    
    const supplierId = searchParams.get('supplierId')
    if (supplierId) {
      filters.supplierId = supplierId
    }
    
    const branchId = searchParams.get('branchId')
    if (branchId) {
      filters.branchId = branchId
    }
    
    const priorityParam = searchParams.get('priority')
    if (priorityParam) {
      filters.priority = priorityParam.split(',') as any[]
    }
    
    const searchTerm = searchParams.get('searchTerm')
    if (searchTerm) {
      filters.searchTerm = searchTerm
    }
    
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate || endDate) {
      filters.dateRange = {
        from: startDate ? new Date(startDate) : new Date(0),
        to: endDate ? new Date(endDate) : new Date()
      }
    }
    
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    if (minAmount || maxAmount) {
      filters.amountRange = {
        min: minAmount ? parseFloat(minAmount) : 0,
        max: maxAmount ? parseFloat(maxAmount) : Number.MAX_VALUE
      }
    }

    // Parse sorting
    const sortField = (searchParams.get('sortField') || 'createdAt') as PurchaseOrderSortField
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as SortDirection
    const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const purchaseOrders = await getPurchaseOrders(userId, filters, sortField, sortDirection, limitCount)

    return NextResponse.json({
      success: true,
      data: purchaseOrders
    })
  } catch (error) {
    console.error('Get purchase orders API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve purchase orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, submit = false, ...poData }: { userId: string, submit?: boolean } & CreatePurchaseOrderRequest = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!poData.supplierId) {
      return NextResponse.json(
        { success: false, error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    if (!poData.branchId) {
      return NextResponse.json(
        { success: false, error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    if (!poData.items || !Array.isArray(poData.items) || poData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      )
    }

    if (!poData.expectedDeliveryDate) {
      return NextResponse.json(
        { success: false, error: 'Expected delivery date is required' },
        { status: 400 }
      )
    }

    // Validate delivery date is in the future
    const deliveryDate = new Date(poData.expectedDeliveryDate)
    if (deliveryDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Expected delivery date must be in the future' },
        { status: 400 }
      )
    }

    // Get products to validate product IDs and get product names
    const products = await getProducts(userId)
    const productMap = new Map(products.map(p => [p.id, p]))

    // Validate and enrich items
    const validatedItems = []
    for (const item of poData.items) {
      if (!item.productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required for all items' },
          { status: 400 }
        )
      }

      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 400 }
        )
      }

      if (!item.quantityOrdered || typeof item.quantityOrdered !== 'number' || item.quantityOrdered <= 0) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for product ${product.name}` },
          { status: 400 }
        )
      }

      if (!item.unitCost || typeof item.unitCost !== 'number' || item.unitCost <= 0) {
        return NextResponse.json(
          { success: false, error: `Invalid unit cost for product ${product.name}` },
          { status: 400 }
        )
      }

      validatedItems.push({
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        unitCost: item.unitCost,
        notes: item.notes?.trim() || ''
      })
    }

    const cleanPOData: CreatePurchaseOrderRequest = {
      supplierId: poData.supplierId,
      branchId: poData.branchId,
      items: validatedItems,
      expectedDeliveryDate: deliveryDate,
      paymentTerms: poData.paymentTerms,
      priority: poData.priority || 'NORMAL',
      deliveryAddress: poData.deliveryAddress?.trim() || '',
      internalNotes: poData.internalNotes?.trim() || '',
      publicNotes: poData.publicNotes?.trim() || ''
    }

    const purchaseOrderId = await createPurchaseOrder(userId, cleanPOData)

    // Submit for approval if requested
    if (submit) {
      await submitPurchaseOrder(purchaseOrderId)
    }

    return NextResponse.json({
      success: true,
      data: { purchaseOrderId },
      message: submit 
        ? 'Purchase order created and submitted for approval'
        : 'Purchase order created as draft'
    })
  } catch (error) {
    console.error('Create purchase order API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}
