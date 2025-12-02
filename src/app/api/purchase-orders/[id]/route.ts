// API route for individual purchase order operations
import { NextRequest, NextResponse } from 'next/server'
import { 
  getPurchaseOrder, 
  submitPurchaseOrder,
  cancelPurchaseOrder 
} from '@/lib/suppliers-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: purchaseOrderId } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const purchaseOrder = await getPurchaseOrder(purchaseOrderId)

    if (!purchaseOrder) {
      return NextResponse.json(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (purchaseOrder.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: purchaseOrder
    })
  } catch (error) {
    console.error('Get purchase order API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve purchase order' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: purchaseOrderId } = await params
    const body = await request.json()
    const { userId, action, ...actionData } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    // Verify purchase order exists and user has access
    const existingPO = await getPurchaseOrder(purchaseOrderId)
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

    switch (action) {
      case 'submit':
        if (existingPO.status !== 'DRAFT') {
          return NextResponse.json(
            { success: false, error: 'Only draft purchase orders can be submitted' },
            { status: 400 }
          )
        }
        
        await submitPurchaseOrder(purchaseOrderId)
        
        return NextResponse.json({
          success: true,
          message: 'Purchase order submitted for approval'
        })

      case 'cancel':
        if (!['DRAFT', 'PENDING', 'APPROVED', 'SENT'].includes(existingPO.status)) {
          return NextResponse.json(
            { success: false, error: 'Purchase order cannot be cancelled in its current status' },
            { status: 400 }
          )
        }

        const reason = actionData.reason || 'No reason provided'
        await cancelPurchaseOrder(purchaseOrderId, reason)
        
        return NextResponse.json({
          success: true,
          message: 'Purchase order cancelled successfully'
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Update purchase order API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update purchase order' },
      { status: 500 }
    )
  }
}
