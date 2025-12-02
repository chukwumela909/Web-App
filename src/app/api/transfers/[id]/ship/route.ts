// API route for shipping branch transfers
import { NextRequest, NextResponse } from 'next/server'
import { 
  getBranchTransfer, 
  shipBranchTransfer 
} from '@/lib/branches-service'
import { ShipTransferRequest } from '@/lib/branches-types'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, shippedBy, trackingNumber, estimatedArrival, shippingNotes }: { userId: string } & Omit<ShipTransferRequest, 'transferId'> = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!shippedBy || typeof shippedBy !== 'string' || shippedBy.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Shipped by (staff member name) is required' },
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

    if (existingTransfer.status !== 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Only approved transfers can be shipped' },
        { status: 400 }
      )
    }

    // Validate estimated arrival date if provided
    let parsedEstimatedArrival: Date | undefined
    if (estimatedArrival) {
      parsedEstimatedArrival = new Date(estimatedArrival)
      if (isNaN(parsedEstimatedArrival.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid estimated arrival date format' },
          { status: 400 }
        )
      }
      if (parsedEstimatedArrival <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'Estimated arrival date must be in the future' },
          { status: 400 }
        )
      }
    }

    const shipData: ShipTransferRequest = {
      transferId: params.id,
      shippedBy: shippedBy.trim(),
      trackingNumber: trackingNumber?.trim(),
      estimatedArrival: parsedEstimatedArrival,
      shippingNotes: shippingNotes?.trim()
    }

    await shipBranchTransfer(params.id, shipData)

    return NextResponse.json({
      success: true,
      message: 'Transfer marked as shipped successfully'
    })
  } catch (error) {
    console.error('Ship transfer API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to ship transfer' },
      { status: 500 }
    )
  }
}
