// API route for branches CRUD operations
import { NextRequest, NextResponse } from 'next/server'
import { 
  getBranches, 
  createBranch 
} from '@/lib/branches-service'
import { 
  CreateBranchRequest, 
  BranchFilters, 
  BranchSortField, 
  SortDirection,
  DEFAULT_OPENING_HOURS 
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
    const filters: BranchFilters = {}
    
    const statusParam = searchParams.get('status')
    if (statusParam) {
      filters.status = statusParam.split(',') as any[]
    }
    
    const branchTypeParam = searchParams.get('branchType')
    if (branchTypeParam) {
      filters.branchType = branchTypeParam.split(',') as any[]
    }
    
    const cityParam = searchParams.get('city')
    if (cityParam) {
      filters.city = cityParam.split(',')
    }
    
    const managerId = searchParams.get('managerId')
    if (managerId) {
      filters.managerId = managerId
    }
    
    const searchTerm = searchParams.get('searchTerm')
    if (searchTerm) {
      filters.searchTerm = searchTerm
    }

    // Parse sorting
    const sortField = (searchParams.get('sortField') || 'name') as BranchSortField
    const sortDirection = (searchParams.get('sortDirection') || 'asc') as SortDirection
    const limitCount = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    console.log('Fetching branches for userId:', userId)
    console.log('Filters:', filters)
    console.log('Sort:', sortField, sortDirection)
    
    const branches = await getBranches(userId, filters, sortField, sortDirection, limitCount)
    
    console.log('Found branches:', branches.length)
    if (branches.length > 0) {
      console.log('First branch:', JSON.stringify(branches[0], null, 2))
    }

    return NextResponse.json({
      success: true,
      data: branches,
      debug: {
        userId,
        branchCount: branches.length,
        filters
      }
    })
  } catch (error) {
    console.error('Get branches API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve branches' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...branchData }: { userId: string } & CreateBranchRequest = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!branchData.name || typeof branchData.name !== 'string' || branchData.name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Branch name is required' },
        { status: 400 }
      )
    }

    if (!branchData.location || !branchData.location.address || branchData.location.address.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Branch address is required' },
        { status: 400 }
      )
    }

    // Validate opening hours if provided
    if (branchData.openingHours && branchData.openingHours.length > 0) {
      for (const hours of branchData.openingHours) {
        if (!hours.dayOfWeek) {
          return NextResponse.json(
            { success: false, error: 'Day of week is required for opening hours' },
            { status: 400 }
          )
        }
        
        if (hours.isOpen && (!hours.openTime || !hours.closeTime)) {
          return NextResponse.json(
            { success: false, error: `Open and close times are required for ${hours.dayOfWeek}` },
            { status: 400 }
          )
        }
        
        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (hours.isOpen) {
          if (!timeRegex.test(hours.openTime!)) {
            return NextResponse.json(
              { success: false, error: `Invalid open time format for ${hours.dayOfWeek}. Use HH:MM format.` },
              { status: 400 }
            )
          }
          if (!timeRegex.test(hours.closeTime!)) {
            return NextResponse.json(
              { success: false, error: `Invalid close time format for ${hours.dayOfWeek}. Use HH:MM format.` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Validate contact info
    if (branchData.contact.email && branchData.contact.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(branchData.contact.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Clean the data
    const cleanBranchData: CreateBranchRequest = {
      name: branchData.name.trim(),
      location: {
        address: branchData.location.address.trim(),
        city: branchData.location.city?.trim() || '',
        region: branchData.location.region?.trim() || '',
        postalCode: branchData.location.postalCode?.trim() || '',
        country: branchData.location.country?.trim() || '',
        latitude: branchData.location.latitude,
        longitude: branchData.location.longitude,
        landmark: branchData.location.landmark?.trim() || '',
        directions: branchData.location.directions?.trim() || ''
      },
      contact: {
        phone: branchData.contact.phone?.trim() || '',
        alternatePhone: branchData.contact.alternatePhone?.trim() || '',
        email: branchData.contact.email?.trim() || '',
        whatsapp: branchData.contact.whatsapp?.trim() || ''
      },
      openingHours: branchData.openingHours && branchData.openingHours.length > 0 
        ? branchData.openingHours 
        : DEFAULT_OPENING_HOURS,
      branchCode: branchData.branchCode?.trim() || undefined,
      branchType: branchData.branchType || 'BRANCH',
      description: branchData.description?.trim() || '',
      maxCapacity: branchData.maxCapacity,
      storageType: branchData.storageType || []
    }

    const branchId = await createBranch(userId, cleanBranchData)

    return NextResponse.json({
      success: true,
      data: { branchId },
      message: 'Branch created successfully'
    })
  } catch (error) {
    console.error('Create branch API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    )
  }
}
