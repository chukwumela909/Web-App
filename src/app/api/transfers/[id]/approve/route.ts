// API route for approving branch transfers
import { NextRequest, NextResponse } from 'next/server'
import { 
  getBranchTransfer, 
  approveBranchTransfer 
} from '@/lib/branches-service'
import { ApproveTransferRequest } from '@/lib/branches-types'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, approved, rejectionReason, approvals, notes }: { userId: string } & Omit<ApproveTransferRequest, 'transferId'> = body

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
        { success: false, error: 'Rejection reason is required when rejecting a transfer' },
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

    if (existingTransfer.status !== 'REQUESTED') {
      return NextResponse.json(
        { success: false, error: 'Only requested transfers can be approved or rejected' },
        { status: 400 }
      )
    }

    // Check if user is trying to approve their own transfer (optional business rule)
    if (existingTransfer.requestedBy === userId) {
      return NextResponse.json(
        { success: false, error: 'You cannot approve your own transfer request' },
        { status: 400 }
      )
    }

    // Validate approvals if provided
    if (approved && approvals && approvals.length > 0) {
      for (const approval of approvals) {
        if (!approval.productId) {
          return NextResponse.json(
            { success: false, error: 'Product ID is required for all approvals' },
            { status: 400 }
          )
        }
        
        if (typeof approval.approvedQuantity !== 'number' || approval.approvedQuantity < 0) {
          return NextResponse.json(
            { success: false, error: 'Approved quantity must be a non-negative number' },
            { status: 400 }
          )
        }

        // Check if product exists in the original transfer
        const transferItem = existingTransfer.items.find(item => item.productId === approval.productId)
        if (!transferItem) {
          return NextResponse.json(
            { success: false, error: `Product ${approval.productId} is not in this transfer` },
            { status: 400 }
          )
        }

        if (approval.approvedQuantity > transferItem.requestedQuantity) {
          return NextResponse.json(
            { success: false, error: `Cannot approve more than requested quantity for product ${approval.productId}` },
            { status: 400 }
          )
        }
      }
    }

    const approvalData: ApproveTransferRequest = {
      transferId: params.id,
      approved,
      rejectionReason: rejectionReason?.trim(),
      approvals,
      notes: notes?.trim()
    }

    await approveBranchTransfer(params.id, userId, approvalData)

    return NextResponse.json({
      success: true,
      message: approved 
        ? 'Transfer approved successfully'
        : 'Transfer rejected'
    })
  } catch (error) {
    console.error('Approve transfer API error:', error)
    
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
