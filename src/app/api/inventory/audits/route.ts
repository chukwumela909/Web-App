// API route for stock audits and reconciliation
import { NextRequest, NextResponse } from 'next/server'
import { createStockAudit, getStockAudits, updateStockAudit } from '@/lib/inventory-service'
import { StockAuditRequest } from '@/lib/inventory-types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const branchId = searchParams.get('branchId') || undefined

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const audits = await getStockAudits(userId, branchId)

    return NextResponse.json({
      success: true,
      data: audits
    })
  } catch (error) {
    console.error('Get stock audits API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve stock audits' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...auditData }: { userId: string } & StockAuditRequest = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!auditData.branchId) {
      return NextResponse.json(
        { success: false, error: 'Branch ID is required' },
        { status: 400 }
      )
    }

    if (!auditData.auditType) {
      return NextResponse.json(
        { success: false, error: 'Audit type is required' },
        { status: 400 }
      )
    }

    if (!['FULL', 'PARTIAL', 'CYCLE'].includes(auditData.auditType)) {
      return NextResponse.json(
        { success: false, error: 'Audit type must be FULL, PARTIAL, or CYCLE' },
        { status: 400 }
      )
    }

    // For partial audits, product IDs are required
    if (auditData.auditType === 'PARTIAL' && (!auditData.productIds || auditData.productIds.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Product IDs are required for partial audits' },
        { status: 400 }
      )
    }

    const auditId = await createStockAudit(userId, auditData)

    return NextResponse.json({
      success: true,
      data: { auditId },
      message: 'Stock audit created successfully'
    })
  } catch (error) {
    console.error('Create stock audit API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create stock audit' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { auditId, status } = body

    if (!auditId) {
      return NextResponse.json(
        { success: false, error: 'Audit ID is required' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    if (!['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    await updateStockAudit(auditId, status)

    return NextResponse.json({
      success: true,
      message: 'Audit status updated successfully'
    })
  } catch (error) {
    console.error('Update stock audit API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update stock audit' },
      { status: 500 }
    )
  }
}
