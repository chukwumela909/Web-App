// API route for individual transfer operations
import { NextRequest, NextResponse } from 'next/server'
import { 
  getBranchTransfer, 
  cancelBranchTransfer 
} from '@/lib/branches-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: transferId } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const transfer = await getBranchTransfer(transferId)

    if (!transfer) {
      return NextResponse.json(
        { success: false, error: 'Transfer not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (transfer.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: transfer
    })
  } catch (error) {
    console.error('Get transfer API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve transfer' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: transferId } = await params
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

    // Verify transfer exists and user has access
    const existingTransfer = await getBranchTransfer(transferId)
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

    switch (action) {
      case 'cancel':
        if (!['REQUESTED', 'APPROVED'].includes(existingTransfer.status)) {
          return NextResponse.json(
            { success: false, error: 'Only requested or approved transfers can be cancelled' },
            { status: 400 }
          )
        }

        const reason = actionData.reason || 'No reason provided'
        await cancelBranchTransfer(transferId, reason)
        
        return NextResponse.json({
          success: true,
          message: 'Transfer cancelled successfully'
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use specific endpoints for approve, ship, or receive actions.' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Update transfer API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update transfer' },
      { status: 500 }
    )
  }
}
