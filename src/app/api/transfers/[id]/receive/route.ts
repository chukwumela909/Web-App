// API route for receiving branch transfers and updating inventory
import { NextRequest, NextResponse } from 'next/server'
import { 
  getBranchTransfer, 
  receiveBranchTransfer 
} from '@/lib/branches-service'
import { getProducts } from '@/lib/firestore'
import { ReceiveTransferRequest } from '@/lib/branches-types'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, items, receivedBy, receivingNotes }: { userId: string } & Omit<ReceiveTransferRequest, 'transferId'> = body

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

    // Verify transfer exists and user has access
    const existingTransfer = await getBranchTransfer(params.id)
    if (!existingTransfer) {
      return NextResponse.json(
        { success: false, error: 'Transfer not found' },
        { status: 404 }
      )
    }

    if (existingTransfer.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    if (existingTransfer.status !== 'IN_TRANSIT') {
      return NextResponse.json(
        { success: false, error: 'Only in-transit transfers can be received' },
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

      // Find the corresponding item in the transfer
      const transferItem = existingTransfer.items.find(ti => ti.productId === item.productId)
      if (!transferItem) {
        return NextResponse.json(
          { success: false, error: `Product ${product.name} is not in this transfer` },
          { status: 400 }
        )
      }

      if (typeof item.receivedQuantity !== 'number' || item.receivedQuantity < 0) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity received for product ${product.name}` },
          { status: 400 }
        )
      }

      // Check if receiving more than approved
      const approvedQuantity = transferItem.approvedQuantity || transferItem.requestedQuantity
      const totalWillBeReceived = (transferItem.receivedQuantity || 0) + item.receivedQuantity
      
      if (totalWillBeReceived > approvedQuantity) {
        return NextResponse.json(
          { success: false, error: `Cannot receive more than approved for product ${product.name}. Approved: ${approvedQuantity}, Already received: ${transferItem.receivedQuantity || 0}, Trying to receive: ${item.receivedQuantity}` },
          { status: 400 }
        )
      }

      // Validate item status
      if (!['RECEIVED', 'DAMAGED'].includes(item.itemStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid item status for product ${product.name}. Must be RECEIVED or DAMAGED.` },
          { status: 400 }
        )
      }

      // Only include items that have positive quantities received
      if (item.receivedQuantity > 0) {
        validatedItems.push({
          productId: item.productId,
          receivedQuantity: item.receivedQuantity,
          itemStatus: item.itemStatus,
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

    const receiveData: ReceiveTransferRequest = {
      transferId: params.id,
      items: validatedItems,
      receivedBy: receivedBy.trim(),
      receivingNotes: receivingNotes?.trim() || ''
    }

    // This will automatically update the inventory through the service layer
    await receiveBranchTransfer(userId, receiveData)

    // Get the updated transfer to return current status
    const updatedTransfer = await getBranchTransfer(params.id)

    return NextResponse.json({
      success: true,
      data: {
        transferId: params.id,
        status: updatedTransfer?.status,
        itemsReceived: validatedItems.length,
        inventoryUpdated: true
      },
      message: updatedTransfer?.status === 'RECEIVED' 
        ? 'Transfer fully received and inventory updated'
        : 'Transfer partially received and inventory updated'
    })
  } catch (error) {
    console.error('Receive transfer API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to receive transfer' },
      { status: 500 }
    )
  }
}
