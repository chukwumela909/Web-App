// API route for sending purchase orders to suppliers
import { NextRequest, NextResponse } from 'next/server'
import { 
  getPurchaseOrder, 
  sendPurchaseOrder 
} from '@/lib/suppliers-service'
import { SendPurchaseOrderRequest } from '@/lib/suppliers-types'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, supplierNotes, sentAt }: { userId: string, supplierNotes?: string, sentAt?: string } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
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

    if (existingPO.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Only approved purchase orders can be sent to suppliers' },
        { status: 400 }
      )
    }

    const sendData: SendPurchaseOrderRequest = {
      purchaseOrderId: params.id,
      sentToSupplierAt: sentAt ? new Date(sentAt) : new Date(),
      supplierNotes: supplierNotes?.trim() || ''
    }

    await sendPurchaseOrder(params.id, sendData)

    return NextResponse.json({
      success: true,
      message: 'Purchase order sent to supplier successfully'
    })
  } catch (error) {
    console.error('Send purchase order API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send purchase order' },
      { status: 500 }
    )
  }
}
