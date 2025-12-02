// API route for approving purchase orders
import { NextRequest, NextResponse } from 'next/server'
import { 
  getPurchaseOrder, 
  approvePurchaseOrder 
} from '@/lib/suppliers-service'
import { ApprovePurchaseOrderRequest } from '@/lib/suppliers-types'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, approved, rejectionReason, notes }: { userId: string } & Omit<ApprovePurchaseOrderRequest, 'purchaseOrderId'> = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Approval decision (approved: true/false) is required' },
        { status: 400 }
      )
    }

    if (!approved && (!rejectionReason || rejectionReason.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required when rejecting a purchase order' },
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

    if (existingPO.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Only pending purchase orders can be approved or rejected' },
        { status: 400 }
      )
    }

    // Check if user is trying to approve their own order (optional business rule)
    if (existingPO.requestedBy === userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot approve your own purchase order' },
        { status: 400 }
      )
    }

    const approvalData: ApprovePurchaseOrderRequest = {
      purchaseOrderId: params.id,
      approved,
      rejectionReason: rejectionReason?.trim(),
      notes: notes?.trim()
    }

    await approvePurchaseOrder(params.id, userId, approvalData)

    return NextResponse.json({
      success: true,
      message: approved 
        ? 'Purchase order approved successfully'
        : 'Purchase order rejected'
    })
  } catch (error) {
    console.error('Approve purchase order API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}
