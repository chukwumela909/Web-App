// API route for suppliers CRUD operations
import { NextRequest, NextResponse } from 'next/server'
import { 
  getSuppliers, 
  createSupplier, 
  getSupplier 
} from '@/lib/suppliers-service'
import { 
  CreateSupplierRequest, 
  SupplierFilters, 
  SupplierSortField, 
  SortDirection 
} from '@/lib/suppliers-types'

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
    const filters: SupplierFilters = {}
    
    const statusParam = searchParams.get('status')
    if (statusParam) {
      filters.status = statusParam.split(',') as any[]
    }
    
    const categoriesParam = searchParams.get('categories')
    if (categoriesParam) {
      filters.categories = categoriesParam.split(',')
    }
    
    const searchTerm = searchParams.get('searchTerm')
    if (searchTerm) {
      filters.searchTerm = searchTerm
    }
    
    const onTimeDeliveryMin = searchParams.get('onTimeDeliveryMin')
    const onTimeDeliveryMax = searchParams.get('onTimeDeliveryMax')
    if (onTimeDeliveryMin || onTimeDeliveryMax) {
      filters.onTimeDeliveryRate = {
        min: onTimeDeliveryMin ? parseInt(onTimeDeliveryMin) : 0,
        max: onTimeDeliveryMax ? parseInt(onTimeDeliveryMax) : 100
      }
    }

    // Parse sorting
    const sortField = (searchParams.get('sortField') || 'name') as SupplierSortField
    const sortDirection = (searchParams.get('sortDirection') || 'asc') as SortDirection
    const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const suppliers = await getSuppliers(userId, filters, sortField, sortDirection, limitCount)

    return NextResponse.json({
      success: true,
      data: suppliers
    })
  } catch (error) {
    console.error('Get suppliers API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...supplierData }: { userId: string } & CreateSupplierRequest = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!supplierData.name || typeof supplierData.name !== 'string' || supplierData.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    if (!supplierData.phone || typeof supplierData.phone !== 'string' || supplierData.phone.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!supplierData.address || typeof supplierData.address !== 'string' || supplierData.address.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      )
    }

    if (!supplierData.categories || !Array.isArray(supplierData.categories) || supplierData.categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one category is required' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (supplierData.email && supplierData.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(supplierData.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Clean the data
    const cleanSupplierData: CreateSupplierRequest = {
      name: supplierData.name.trim(),
      contactPerson: supplierData.contactPerson?.trim() || '',
      email: supplierData.email?.trim() || '',
      phone: supplierData.phone.trim(),
      address: supplierData.address.trim(),
      paymentTerms: supplierData.paymentTerms || 'NET_30',
      categories: supplierData.categories.filter(cat => cat.trim().length > 0),
      notes: supplierData.notes?.trim() || ''
    }

    const supplierId = await createSupplier(userId, cleanSupplierData)

    return NextResponse.json({
      success: true,
      data: { supplierId },
      message: 'Supplier created successfully'
    })
  } catch (error) {
    console.error('Create supplier API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
