// API route for receiving purchase orders and updating inventory
import { NextRequest, NextResponse } from 'next/server'
import { 
  getPurchaseOrder, 
  receivePurchaseOrder 
} from '@/lib/suppliers-service'
import { ReceivePurchaseOrderRequest } from '@/lib/suppliers-types'
import { getProducts } from '@/lib/firestore'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, items, receivedBy, notes, partialReceiving }: { userId: string } & Omit<ReceivePurchaseOrderRequest, 'purchaseOrderId'> = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!receivedBy || typeof receivedBy !== 'string' || receivedBy.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Received by (staff member name) is required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item must be received' },
        { status: 400 }
      )
    }

    // Verify purchase order exists and user has access
    const existingPO = await getPurchaseOrder(params.id)
    if (!existingPO) {
      return NextResponse.json(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    if (existingPO.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    if (!['SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED'].includes(existingPO.status)) {
      return NextResponse.json(
        { success: false, error: 'Purchase order cannot be received in its current status' },
        { status: 400 }
      )
    }

    // Get products to validate product IDs
    const products = await getProducts(userId)
    const productMap = new Map(products.map(p => [p.id, p]))

    // Validate received items
    const validatedItems = []
    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required for all received items' },
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

      // Find the corresponding item in the PO
      const poItem = existingPO.items.find(poi => poi.productId === item.productId)
      if (!poItem) {
        return NextResponse.json(
          { success: false, error: `Product ${product.name} is not in this purchase order` },
          { status: 400 }
        )
      }

      if (typeof item.quantityReceived !== 'number' || item.quantityReceived < 0) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity received for product ${product.name}` },
          { status: 400 }
        )
      }

      // Check if receiving more than ordered
      const totalWillBeReceived = poItem.quantityReceived + item.quantityReceived
      if (totalWillBeReceived > poItem.quantityOrdered) {
        return NextResponse.json(
          { success: false, error: `Cannot receive more than ordered for product ${product.name}. Ordered: ${poItem.quantityOrdered}, Already received: ${poItem.quantityReceived}, Trying to receive: ${item.quantityReceived}` },
          { status: 400 }
        )
      }

      // Validate defective quantity
      const defectiveQuantity = item.defectiveQuantity || 0
      if (defectiveQuantity < 0 || defectiveQuantity > item.quantityReceived) {
        return NextResponse.json(
          { success: false, error: `Invalid defective quantity for product ${product.name}` },
          { status: 400 }
        )
      }

      // Only include items that have positive quantities received
      if (item.quantityReceived > 0) {
        validatedItems.push({
          productId: item.productId,
          quantityReceived: item.quantityReceived,
          isDefective: defectiveQuantity > 0,
          defectiveQuantity,
          notes: item.notes?.trim() || ''
        })
      }
    }

    if (validatedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items with positive quantities to receive' },
        { status: 400 }
      )
    }

    const receiveData: ReceivePurchaseOrderRequest = {
      purchaseOrderId: params.id,
      items: validatedItems,
      receivedBy: receivedBy.trim(),
      notes: notes?.trim() || '',
      partialReceiving: partialReceiving || false
    }

    // This will automatically update the inventory through the integration hooks
    await receivePurchaseOrder(userId, receiveData)

    // Get the updated PO to return current status
    const updatedPO = await getPurchaseOrder(params.id)

    return NextResponse.json({
      success: true,
      data: {
        purchaseOrderId: params.id,
        status: updatedPO?.status,
        itemsReceived: validatedItems.length,
        inventoryUpdated: true
      },
      message: updatedPO?.status === 'RECEIVED' 
        ? 'Purchase order fully received and inventory updated'
        : 'Purchase order partially received and inventory updated'
    })
  } catch (error) {
    console.error('Receive purchase order API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to receive purchase order' },
      { status: 500 }
    )
  }
}
