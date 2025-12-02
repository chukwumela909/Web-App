// API route for audit reconciliation
import { NextRequest, NextResponse } from 'next/server'
import { reconcileAudit } from '@/lib/inventory-service'
import { AuditReconciliationRequest } from '@/lib/inventory-types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...reconciliationData }: { userId: string } & AuditReconciliationRequest = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!reconciliationData.auditId) {
      return NextResponse.json(
        { success: false, error: 'Audit ID is required' },
        { status: 400 }
      )
    }

    if (!reconciliationData.items || !Array.isArray(reconciliationData.items) || reconciliationData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Reconciliation items are required' },
        { status: 400 }
      )
    }

    // Validate reconciliation items
    for (const item of reconciliationData.items) {
      if (!item.productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required for all reconciliation items' },
          { status: 400 }
        )
      }
      
      if (typeof item.physicalStock !== 'number' || item.physicalStock < 0) {
        return NextResponse.json(
          { success: false, error: 'Physical stock must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    await reconcileAudit(userId, reconciliationData)

    return NextResponse.json({
      success: true,
      message: 'Audit reconciliation completed successfully'
    })
  } catch (error) {
    console.error('Audit reconciliation API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to reconcile audit' },
      { status: 500 }
    )
  }
}
