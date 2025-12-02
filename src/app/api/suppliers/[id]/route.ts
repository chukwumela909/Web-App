// API route for individual supplier operations
import { NextRequest, NextResponse } from 'next/server'
import { 
  getSupplier, 
  updateSupplier, 
  archiveSupplier, 
  deleteSupplier,
  getSupplierPurchaseOrders 
} from '@/lib/suppliers-service'
import { UpdateSupplierRequest } from '@/lib/suppliers-types'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: supplierId } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const includeOrders = searchParams.get('includeOrders') === 'true'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supplier = await getSupplier(supplierId)

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (supplier.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    let response: any = {
      success: true,
      data: supplier
    }

    // Include recent purchase orders if requested
    if (includeOrders) {
      const recentOrders = await getSupplierPurchaseOrders(supplierId, userId, 10)
      response.data.recentOrders = recentOrders
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get supplier API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve supplier' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: supplierId } = await params
    const body = await request.json()
    const { userId, ...supplierData }: { userId: string } & Partial<UpdateSupplierRequest> = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify supplier exists and user has access
    const existingSupplier = await getSupplier(supplierId)
    if (!existingSupplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    if (existingSupplier.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Validate fields if provided
    if (supplierData.name !== undefined) {
      if (!supplierData.name || typeof supplierData.name !== 'string' || supplierData.name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Supplier name cannot be empty' },
          { status: 400 }
        )
      }
      supplierData.name = supplierData.name.trim()
    }

    if (supplierData.phone !== undefined) {
      if (!supplierData.phone || typeof supplierData.phone !== 'string' || supplierData.phone.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Phone number cannot be empty' },
          { status: 400 }
        )
      }
      supplierData.phone = supplierData.phone.trim()
    }

    if (supplierData.address !== undefined) {
      if (!supplierData.address || typeof supplierData.address !== 'string' || supplierData.address.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Address cannot be empty' },
          { status: 400 }
        )
      }
      supplierData.address = supplierData.address.trim()
    }

    if (supplierData.email !== undefined && supplierData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(supplierData.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
      supplierData.email = supplierData.email.trim()
    }

    if (supplierData.categories !== undefined) {
      if (!Array.isArray(supplierData.categories) || supplierData.categories.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one category is required' },
          { status: 400 }
        )
      }
      supplierData.categories = supplierData.categories.filter(cat => cat.trim().length > 0)
    }

    // Clean string fields
    if (supplierData.contactPerson !== undefined) {
      supplierData.contactPerson = supplierData.contactPerson?.trim() || ''
    }
    if (supplierData.notes !== undefined) {
      supplierData.notes = supplierData.notes?.trim() || ''
    }

    const updateData: UpdateSupplierRequest = {
      id: supplierId,
      ...supplierData
    }

    await updateSupplier(supplierId, updateData)

    // Return updated supplier
    const updatedSupplier = await getSupplier(supplierId)

    return NextResponse.json({
      success: true,
      data: updatedSupplier,
      message: 'Supplier updated successfully'
    })
  } catch (error) {
    console.error('Update supplier API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: supplierId } = await params
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const archive = searchParams.get('archive') === 'true'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify supplier exists and user has access
    const existingSupplier = await getSupplier(supplierId)
    if (!existingSupplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    if (existingSupplier.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    try {
      if (archive) {
        // Archive the supplier (set status to inactive)
        await archiveSupplier(supplierId)
        return NextResponse.json({
          success: true,
          message: 'Supplier archived successfully'
        })
      } else {
        // Permanently delete the supplier
        await deleteSupplier(supplierId)
        return NextResponse.json({
          success: true,
          message: 'Supplier deleted successfully'
        })
      }
    } catch (deleteError) {
      if (deleteError instanceof Error && deleteError.message.includes('existing purchase orders')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cannot delete supplier with existing purchase orders. Use archive instead.',
            canArchive: true 
          },
          { status: 400 }
        )
      }
      throw deleteError
    }
  } catch (error) {
    console.error('Delete supplier API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
