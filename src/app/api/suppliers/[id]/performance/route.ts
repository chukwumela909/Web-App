// API route for supplier performance reports and updates
import { NextRequest, NextResponse } from 'next/server'
import { 
  getSupplierPerformanceReport, 
  updateSupplierPerformance 
} from '@/lib/suppliers-service'
import { UpdateSupplierPerformanceRequest } from '@/lib/suppliers-types'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const performanceReport = await getSupplierPerformanceReport(userId, params.id)

    if (!performanceReport) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: performanceReport
    })
  } catch (error) {
    console.error('Get supplier performance API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve performance report' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const performanceData: UpdateSupplierPerformanceRequest = body

    // Validate the performance data
    if (performanceData.onTimeDelivery !== undefined && typeof performanceData.onTimeDelivery !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'onTimeDelivery must be a boolean' },
        { status: 400 }
      )
    }

    if (performanceData.deliveryDays !== undefined && (typeof performanceData.deliveryDays !== 'number' || performanceData.deliveryDays < 0)) {
      return NextResponse.json(
        { success: false, error: 'deliveryDays must be a non-negative number' },
        { status: 400 }
      )
    }

    if (performanceData.qualityRating !== undefined && (typeof performanceData.qualityRating !== 'number' || performanceData.qualityRating < 1 || performanceData.qualityRating > 5)) {
      return NextResponse.json(
        { success: false, error: 'qualityRating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (performanceData.serviceRating !== undefined && (typeof performanceData.serviceRating !== 'number' || performanceData.serviceRating < 1 || performanceData.serviceRating > 5)) {
      return NextResponse.json(
        { success: false, error: 'serviceRating must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (performanceData.pricingRating !== undefined && (typeof performanceData.pricingRating !== 'number' || performanceData.pricingRating < 1 || performanceData.pricingRating > 5)) {
      return NextResponse.json(
        { success: false, error: 'pricingRating must be between 1 and 5' },
        { status: 400 }
      )
    }

    performanceData.supplierId = params.id

    await updateSupplierPerformance(params.id, performanceData)

    return NextResponse.json({
      success: true,
      message: 'Supplier performance updated successfully'
    })
  } catch (error) {
    console.error('Update supplier performance API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update supplier performance' },
      { status: 500 }
    )
  }
}
