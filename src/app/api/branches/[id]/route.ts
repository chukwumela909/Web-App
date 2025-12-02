// API route for individual branch operations
import { NextRequest, NextResponse } from 'next/server'
import { 
  getBranch, 
  updateBranch, 
  deactivateBranch, 
  deleteBranch,
  getBranchInventorySummary
} from '@/lib/branches-service'
import { UpdateBranchRequest } from '@/lib/branches-types'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const includeInventory = searchParams.get('includeInventory') === 'true'
    
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const branch = await getBranch(id)

    if (!branch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (branch.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    let response: any = {
      success: true,
      data: branch
    }

    // Include inventory summary if requested
    if (includeInventory) {
      const inventorySummary = await getBranchInventorySummary(userId, id)
      response.data.inventorySummary = inventorySummary
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get branch API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve branch' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const { userId, ...branchData }: { userId: string } & Partial<UpdateBranchRequest> = body
    
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify branch exists and user has access
    const existingBranch = await getBranch(id)
    if (!existingBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      )
    }

    if (existingBranch.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Validate fields if provided
    if (branchData.name !== undefined) {
      if (!branchData.name || typeof branchData.name !== 'string' || branchData.name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Branch name cannot be empty' },
          { status: 400 }
        )
      }
      branchData.name = branchData.name.trim()
    }

    if (branchData.location?.address !== undefined) {
      if (!branchData.location.address || branchData.location.address.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Branch address cannot be empty' },
          { status: 400 }
        )
      }
      branchData.location.address = branchData.location.address.trim()
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

    // Validate email if provided
    if (branchData.contact?.email !== undefined && branchData.contact.email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(branchData.contact.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
      branchData.contact.email = branchData.contact.email.trim()
    }

    // Clean string fields
    if (branchData.description !== undefined) {
      branchData.description = branchData.description?.trim() || ''
    }
    if (branchData.branchCode !== undefined) {
      branchData.branchCode = branchData.branchCode?.trim() || undefined
    }

    const updateData: UpdateBranchRequest = {
      id: id,
      ...branchData
    }

    await updateBranch(id, updateData)

    // Return updated branch
    const updatedBranch = await getBranch(id)

    return NextResponse.json({
      success: true,
      data: updatedBranch,
      message: 'Branch updated successfully'
    })
  } catch (error) {
    console.error('Update branch API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update branch' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const permanent = searchParams.get('permanent') === 'true'
    const reason = searchParams.get('reason') || 'No reason provided'
    
    // Await params before accessing properties (Next.js 15+ requirement)
    const { id } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify branch exists and user has access
    const existingBranch = await getBranch(id)
    if (!existingBranch) {
      return NextResponse.json(
        { success: false, error: 'Branch not found' },
        { status: 404 }
      )
    }

    if (existingBranch.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    try {
      if (permanent) {
        // Permanently delete the branch
        await deleteBranch(id)
        return NextResponse.json({
          success: true,
          message: 'Branch deleted permanently'
        })
      } else {
        // Deactivate the branch
        await deactivateBranch(id, reason)
        return NextResponse.json({
          success: true,
          message: 'Branch deactivated successfully'
        })
      }
    } catch (deleteError) {
      if (deleteError instanceof Error) {
        if (deleteError.message.includes('pending transfers')) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Cannot deactivate branch with pending transfers. Complete or cancel all pending transfers first.',
              canDelete: false 
            },
            { status: 400 }
          )
        } else if (deleteError.message.includes('transfer history')) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Cannot delete branch with transfer history. Use deactivate instead.',
              canDeactivate: true 
            },
            { status: 400 }
          )
        } else if (deleteError.message.includes('existing inventory')) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Cannot delete branch with existing inventory. Transfer all items to other branches first.',
              hasInventory: true 
            },
            { status: 400 }
          )
        }
      }
      throw deleteError
    }
  } catch (error) {
    console.error('Delete branch API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete branch' },
      { status: 500 }
    )
  }
}
