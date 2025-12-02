// API route for branch transfers CRUD operations
import { NextRequest, NextResponse } from 'next/server'
import { 
  getBranchTransfers, 
  createBranchTransfer 
} from '@/lib/branches-service'
import { getProducts } from '@/lib/firestore'
import { 
  CreateTransferRequest, 
  TransferFilters, 
  TransferSortField, 
  SortDirection 
} from '@/lib/branches-types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Parse filters
    const filters: TransferFilters = {}
    
    const statusParam = searchParams.get('status')
    if (statusParam) {
      filters.status = statusParam.split(',') as any[]
    }
    
    const fromBranchId = searchParams.get('fromBranchId')
    if (fromBranchId) {
      filters.fromBranchId = fromBranchId
    }
    
    const toBranchId = searchParams.get('toBranchId')
    if (toBranchId) {
      filters.toBranchId = toBranchId
    }
    
    const transferTypeParam = searchParams.get('transferType')
    if (transferTypeParam) {
      filters.transferType = transferTypeParam.split(',') as any[]
    }
    
    const priorityParam = searchParams.get('priority')
    if (priorityParam) {
      filters.priority = priorityParam.split(',') as any[]
    }
    
    const searchTerm = searchParams.get('searchTerm')
    if (searchTerm) {
      filters.searchTerm = searchTerm
    }
    
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate || endDate) {
      filters.dateRange = {
        from: startDate ? new Date(startDate) : new Date(0),
        to: endDate ? new Date(endDate) : new Date()
      }
    }
    
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    if (minAmount || maxAmount) {
      filters.amountRange = {
        min: minAmount ? parseFloat(minAmount) : 0,
        max: maxAmount ? parseFloat(maxAmount) : Number.MAX_VALUE
      }
    }

    // Parse sorting
    const sortField = (searchParams.get('sortField') || 'requestedAt') as TransferSortField
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as SortDirection
    const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const transfers = await getBranchTransfers(userId, filters, sortField, sortDirection, limitCount)

    return NextResponse.json({
      success: true,
      data: transfers
    })
  } catch (error) {
    console.error('Get transfers API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve transfers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...transferData }: { userId: string } & CreateTransferRequest = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!transferData.fromBranchId) {
      return NextResponse.json(
        { success: false, error: 'Source branch ID is required' },
        { status: 400 }
      )
    }

    if (!transferData.toBranchId) {
      return NextResponse.json(
        { success: false, error: 'Destination branch ID is required' },
        { status: 400 }
      )
    }

    if (transferData.fromBranchId === transferData.toBranchId) {
      return NextResponse.json(
        { success: false, error: 'Source and destination branches cannot be the same' },
        { status: 400 }
      )
    }

    if (!transferData.items || !Array.isArray(transferData.items) || transferData.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required for transfer' },
        { status: 400 }
      )
    }

    if (!transferData.transferType) {
      return NextResponse.json(
        { success: false, error: 'Transfer type is required' },
        { status: 400 }
      )
    }

    // Validate transfer type
    const validTransferTypes = ['STOCK_REBALANCING', 'NEW_BRANCH_SETUP', 'EMERGENCY_STOCK', 'RETURN', 'OTHER']
    if (!validTransferTypes.includes(transferData.transferType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transfer type' },
        { status: 400 }
      )
    }

    // Get products to validate product IDs
    const products = await getProducts(userId)
    const productMap = new Map(products.map(p => [p.id, p]))

    // Validate and enrich items
    const validatedItems = []
    for (const item of transferData.items) {
      if (!item.productId) {
        return NextResponse.json(
          { success: false, error: 'Product ID is required for all items' },
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

      if (!item.requestedQuantity || typeof item.requestedQuantity !== 'number' || item.requestedQuantity <= 0) {
        return NextResponse.json(
          { success: false, error: `Invalid quantity for product ${product.name}` },
          { status: 400 }
        )
      }

      validatedItems.push({
        productId: item.productId,
        requestedQuantity: item.requestedQuantity,
        notes: item.notes?.trim() || ''
      })
    }

    // Validate estimated arrival date if provided
    let estimatedArrival: Date | undefined
    if (transferData.estimatedArrival) {
      estimatedArrival = new Date(transferData.estimatedArrival)
      if (estimatedArrival <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'Estimated arrival date must be in the future' },
          { status: 400 }
        )
      }
    }

    const cleanTransferData: CreateTransferRequest = {
      fromBranchId: transferData.fromBranchId,
      toBranchId: transferData.toBranchId,
      items: validatedItems,
      transferType: transferData.transferType,
      priority: transferData.priority || 'NORMAL',
      requestReason: transferData.requestReason?.trim() || '',
      transportMethod: transferData.transportMethod?.trim(),
      estimatedArrival,
      internalNotes: transferData.internalNotes?.trim() || ''
    }

    const transferId = await createBranchTransfer(userId, cleanTransferData)

    return NextResponse.json({
      success: true,
      data: { transferId },
      message: 'Transfer request created successfully'
    })
  } catch (error) {
    console.error('Create transfer API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create transfer request' },
      { status: 500 }
    )
  }
}
