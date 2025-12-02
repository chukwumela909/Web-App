// Branches service for FahamPesa - Firestore operations
// Handles all branch and transfer-related database operations

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore'

import {
  Branch,
  BranchTransfer,
  BranchDashboard,
  BranchInventorySummary,
  TransferHistory,
  CreateBranchRequest,
  UpdateBranchRequest,
  CreateTransferRequest,
  ApproveTransferRequest,
  ShipTransferRequest,
  ReceiveTransferRequest,
  BranchFilters,
  TransferFilters,
  BranchPerformanceReport,
  StockMovementSummary,
  BranchStockLevel,
  MultibranchStockSummary,
  BranchStatus,
  TransferStatus,
  BranchSortField,
  TransferSortField,
  SortDirection,
  DEFAULT_OPENING_HOURS
} from '@/lib/branches-types'

// Integration with existing inventory system
import { 
  getInventoryItems, 
  getStockLevels,
  createStockMovement 
} from '@/lib/inventory-service'
import { 
  checkStockLevels, 
  validateStockAvailability 
} from '@/lib/inventory-hooks'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Helper function to remove undefined values from objects before saving to Firestore
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)).filter(item => item !== undefined)
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value)
      }
    }
    return cleaned
  }
  
  return obj
}

// ============================================================================
// BRANCH OPERATIONS
// ============================================================================

export async function getBranches(
  userId: string,
  filters?: BranchFilters,
  sortField: BranchSortField = 'name',
  sortDirection: SortDirection = 'asc',
  limitCount?: number
): Promise<Branch[]> {
  try {
    console.log('getBranches called with:', { userId, filters, sortField, sortDirection, limitCount })
    
    // Start with basic query
    let q = query(collection(db, 'branches'), where('userId', '==', userId))
    console.log('Basic query created for userId:', userId)
    
    // Apply filters one by one to avoid compound index issues
    if (filters?.status && filters.status.length > 0) {
      // If only one status, use equality instead of 'in'
      if (filters.status.length === 1) {
        q = query(q, where('status', '==', filters.status[0]))
      } else {
        q = query(q, where('status', 'in', filters.status))
      }
    }
    
    if (filters?.branchType && filters.branchType.length > 0) {
      // If only one type, use equality instead of 'in'
      if (filters.branchType.length === 1) {
        q = query(q, where('branchType', '==', filters.branchType[0]))
      } else {
        q = query(q, where('branchType', 'in', filters.branchType))
      }
    }
    
    if (filters?.managerId) {
      q = query(q, where('managerId', '==', filters.managerId))
    }
    
    // Skip server-side sorting to avoid Firestore index requirements
    // Will use client-side sorting instead
    console.log('Skipping server-side sorting to avoid index issues')
    
    if (limitCount) {
      q = query(q, limit(limitCount))
    }
    
    console.log('Executing Firestore query...')
    const snap = await getDocs(q)
    console.log('Query executed, found documents:', snap.docs.length)
    
    if (snap.docs.length > 0) {
      console.log('First document ID:', snap.docs[0].id)
      console.log('First document data:', JSON.stringify(snap.docs[0].data(), null, 2))
    }
    
    let branches = snap.docs.map(doc => {
      const docData = doc.data()
      console.log(`Processing document ${doc.id}:`, {
        hasLocation: !!docData.location,
        hasContact: !!docData.contact,
        status: docData.status,
        userId: docData.userId,
        createdAtType: typeof docData.createdAt,
        createdAtValue: docData.createdAt
      })
      
      // Fix serverTimestamp objects to actual dates
      const now = new Date()
      const createdAt = docData.createdAt && typeof docData.createdAt === 'object' && docData.createdAt.toDate 
        ? docData.createdAt.toDate() 
        : (docData.createdAt && typeof docData.createdAt === 'object' && docData.createdAt._methodName === 'serverTimestamp')
        ? now
        : docData.createdAt || now

      const updatedAt = docData.updatedAt && typeof docData.updatedAt === 'object' && docData.updatedAt.toDate 
        ? docData.updatedAt.toDate() 
        : (docData.updatedAt && typeof docData.updatedAt === 'object' && docData.updatedAt._methodName === 'serverTimestamp')
        ? now
        : docData.updatedAt || now

      // Convert lastStockUpdate if present
      const lastStockUpdate = docData.lastStockUpdate && typeof docData.lastStockUpdate === 'object' && docData.lastStockUpdate.toDate 
        ? docData.lastStockUpdate.toDate() 
        : (docData.lastStockUpdate && typeof docData.lastStockUpdate === 'object' && docData.lastStockUpdate._methodName === 'serverTimestamp')
        ? now
        : docData.lastStockUpdate
      
      try {
        const branch: Branch = {
          id: doc.id,
          userId: docData.userId || '',
          name: docData.name || '',
          branchCode: docData.branchCode,
          branchType: docData.branchType,
          description: docData.description,
          location: docData.location || { address: '', city: '', region: '' },
          contact: docData.contact || { phone: '', email: '' },
          openingHours: docData.openingHours || [],
          status: docData.status || 'ACTIVE',
          currency: docData.currency,
          managerId: docData.managerId,
          managerName: docData.managerName,
          maxCapacity: docData.maxCapacity,
          storageType: docData.storageType,
          taxSettings: docData.taxSettings,
          createdBy: docData.createdBy || '',
          totalProducts: docData.totalProducts,
          totalInventoryValue: docData.totalInventoryValue,
          lowStockItemsCount: docData.lowStockItemsCount,
          lastStockUpdate,
          createdAt,
          updatedAt
        }
        
        console.log(`Successfully processed branch ${doc.id}`)
        return branch
      } catch (mapError) {
        console.error(`Error mapping document ${doc.id}:`, mapError)
        throw mapError
      }
    })
    
    // Apply client-side filters
    if (filters?.city && filters.city.length > 0) {
      branches = branches.filter(b => 
        filters.city!.includes(b.location.city || '')
      )
    }
    
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      branches = branches.filter(b =>
        b.name.toLowerCase().includes(term) ||
        b.location.address.toLowerCase().includes(term) ||
        b.location.city?.toLowerCase().includes(term) ||
        b.branchCode?.toLowerCase().includes(term) ||
        b.description?.toLowerCase().includes(term)
      )
    }
    
    // Client-side sorting if server-side sorting failed
    if (branches.length > 0) {
      branches.sort((a, b) => {
        const aVal = (a as any)[sortField] || ''
        const bVal = (b as any)[sortField] || ''
        
        if (sortDirection === 'asc') {
          return aVal.toString().localeCompare(bVal.toString())
        } else {
          return bVal.toString().localeCompare(aVal.toString())
        }
      })
    }
    
    return branches
  } catch (error) {
    console.error('Error in getBranches:', error)
    // Return empty array instead of throwing to prevent API crashes
    return []
  }
}

export async function getBranch(branchId: string): Promise<Branch | null> {
  try {
    const docSnap = await getDoc(doc(db, 'branches', branchId))
    if (docSnap.exists()) {
      const data = docSnap.data()
      return { 
        id: docSnap.id, 
        ...data,
        // Ensure required fields exist with defaults
        location: data.location || { address: '', city: '', region: '' },
        contact: data.contact || { phone: '', email: '' },
        openingHours: data.openingHours || [],
        status: data.status || 'ACTIVE',
        totalProducts: data.totalProducts || 0,
        totalInventoryValue: data.totalInventoryValue || 0,
        lowStockItemsCount: data.lowStockItemsCount || 0
      } as Branch
    }
    return null
  } catch (error) {
    console.error('Error in getBranch:', error)
    return null
  }
}

export async function createBranch(
  userId: string,
  data: CreateBranchRequest
): Promise<string> {
  const branchId = crypto.randomUUID()
  
  // Generate branch code if not provided
  const branchCode = data.branchCode || await generateBranchCode(userId)
  
  const branch: Branch = {
    id: branchId,
    name: data.name,
    location: data.location,
    contact: data.contact,
    openingHours: data.openingHours.length > 0 ? data.openingHours : DEFAULT_OPENING_HOURS,
    branchCode,
    branchType: data.branchType || 'BRANCH',
    description: data.description || '',
    status: 'ACTIVE',
    maxCapacity: data.maxCapacity,
    storageType: data.storageType || [],
    currency: 'KES',
    
    // Initialize analytics
    totalProducts: 0,
    totalInventoryValue: 0,
    lowStockItemsCount: 0,
    
    // Audit fields
    userId,
    createdBy: userId
  }
  
  // Clean the branch data to remove undefined values before saving to Firestore
  const cleanBranchData = removeUndefinedValues({
    ...branch,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp()
  })

  console.log('Creating branch with data:', JSON.stringify(cleanBranchData, null, 2))
  console.log('Branch ID:', branchId)
  console.log('User ID in branch data:', branch.userId)

  await setDoc(doc(db, 'branches', branchId), cleanBranchData)
  console.log('Branch created successfully in Firestore')
  
  return branchId
}

export async function updateBranch(
  branchId: string,
  data: UpdateBranchRequest
): Promise<void> {
  const updateData: any = { ...data }
  delete updateData.id
  updateData.updatedAt = serverTimestamp()
  
  // Clean the update data to remove undefined values before saving to Firestore
  const cleanUpdateData = removeUndefinedValues(updateData)
  
  await updateDoc(doc(db, 'branches', branchId), cleanUpdateData)
}

export async function deactivateBranch(
  branchId: string,
  reason?: string
): Promise<void> {
  // Check for pending transfers
  const pendingTransfersQuery = query(
    collection(db, 'branch_transfers'),
    where('fromBranchId', '==', branchId),
    where('status', 'in', ['REQUESTED', 'APPROVED', 'IN_TRANSIT'])
  )
  
  const pendingTransfersSnap = await getDocs(pendingTransfersQuery)
  if (!pendingTransfersSnap.empty) {
    throw new Error('Cannot deactivate branch with pending outbound transfers')
  }
  
  await updateDoc(doc(db, 'branches', branchId), {
    status: 'INACTIVE',
    deactivatedAt: serverTimestamp(),
    deactivationReason: reason || 'No reason provided',
    updatedAt: serverTimestamp()
  })
}

export async function deleteBranch(branchId: string): Promise<void> {
  // Check for any transfers
  const transfersQuery = query(
    collection(db, 'branch_transfers'),
    where('fromBranchId', '==', branchId)
  )
  const transfersSnap = await getDocs(transfersQuery)
  
  if (!transfersSnap.empty) {
    throw new Error('Cannot delete branch with transfer history. Use deactivate instead.')
  }
  
  // Check for inventory
  const inventoryItems = await getInventoryItems('', branchId)
  if (inventoryItems.length > 0) {
    throw new Error('Cannot delete branch with existing inventory. Transfer all items first.')
  }
  
  await deleteDoc(doc(db, 'branches', branchId))
}

async function generateBranchCode(userId: string): Promise<string> {
  // Generate branch code like BR001, BR002, etc.
  // Use a simpler approach to avoid composite index requirement
  try {
    // Get all branches for this user (simpler query - no composite index needed)
    const q = query(
      collection(db, 'branches'),
      where('userId', '==', userId)
    )
    
    const snap = await getDocs(q)
    
    // Find the highest branch code number
    let maxNumber = 0
    snap.docs.forEach(doc => {
      const branchCode = doc.data().branchCode
      if (branchCode && typeof branchCode === 'string') {
        const match = branchCode.match(/BR(\d{3})/)
        if (match) {
          const number = parseInt(match[1])
          if (number > maxNumber) {
            maxNumber = number
          }
        }
      }
    })
    
    const nextNumber = maxNumber + 1
    return `BR${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating branch code:', error)
    // Fallback: use timestamp-based code if query fails
    const timestamp = Date.now().toString().slice(-6)
    return `BR${timestamp}`
  }
}

// ============================================================================
// BRANCH TRANSFER OPERATIONS
// ============================================================================

export async function getBranchTransfers(
  userId: string,
  filters?: TransferFilters,
  sortField: TransferSortField = 'requestedAt',
  sortDirection: SortDirection = 'desc',
  limitCount?: number
): Promise<BranchTransfer[]> {
  try {
    let q = query(collection(db, 'branch_transfers'), where('userId', '==', userId))
  
  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    q = query(q, where('status', 'in', filters.status))
  }
  
  if (filters?.fromBranchId) {
    q = query(q, where('fromBranchId', '==', filters.fromBranchId))
  }
  
  if (filters?.toBranchId) {
    q = query(q, where('toBranchId', '==', filters.toBranchId))
  }
  
  if (filters?.transferType && filters.transferType.length > 0) {
    q = query(q, where('transferType', 'in', filters.transferType))
  }
  
  if (filters?.priority && filters.priority.length > 0) {
    q = query(q, where('priority', 'in', filters.priority))
  }
  
  // Skip server-side sorting to avoid Firestore index requirements
  // Will use client-side sorting instead
  
  if (limitCount) {
    q = query(q, limit(limitCount))
  }
  
  const snap = await getDocs(q)
  let transfers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BranchTransfer))
  
  // Apply client-side sorting
  if (sortField && transfers.length > 0) {
    transfers.sort((a, b) => {
      const aVal = (a as any)[sortField]
      const bVal = (b as any)[sortField]
      
      if (aVal === undefined && bVal === undefined) return 0
      if (aVal === undefined) return sortDirection === 'asc' ? 1 : -1
      if (bVal === undefined) return sortDirection === 'asc' ? -1 : 1
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }
  
  // Apply client-side filters
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase()
    transfers = transfers.filter(t =>
      t.transferNumber.toLowerCase().includes(term) ||
      t.fromBranchName?.toLowerCase().includes(term) ||
      t.toBranchName?.toLowerCase().includes(term) ||
      t.requestReason?.toLowerCase().includes(term)
    )
  }
  
  if (filters?.amountRange) {
    transfers = transfers.filter(t =>
      t.totalValue >= filters.amountRange!.min &&
      t.totalValue <= filters.amountRange!.max
    )
  }
  
    return transfers
  } catch (error) {
    console.error('Error in getBranchTransfers:', error)
    // Return empty array instead of throwing to prevent API crashes
    return []
  }
}

export async function getBranchTransfer(transferId: string): Promise<BranchTransfer | null> {
  try {
    const docSnap = await getDoc(doc(db, 'branch_transfers', transferId))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BranchTransfer
    }
    return null
  } catch (error) {
    console.error('Error in getBranchTransfer:', error)
    return null
  }
}

export async function generateTransferNumber(userId: string): Promise<string> {
  // Generate transfer number like TR-2024-001
  const year = new Date().getFullYear()
  
  const q = query(
    collection(db, 'branch_transfers'),
    where('userId', '==', userId),
    where('transferNumber', '>=', `TR-${year}-000`),
    where('transferNumber', '<', `TR-${year + 1}-000`),
    orderBy('transferNumber', 'desc'),
    limit(1)
  )
  
  const snap = await getDocs(q)
  let nextNumber = 1
  
  if (!snap.empty) {
    const lastTransferNumber = snap.docs[0].data().transferNumber
    const match = lastTransferNumber.match(/TR-\d{4}-(\d{3})/)
    if (match) {
      nextNumber = parseInt(match[1]) + 1
    }
  }
  
  return `TR-${year}-${nextNumber.toString().padStart(3, '0')}`
}

export async function createBranchTransfer(
  userId: string,
  data: CreateTransferRequest
): Promise<string> {
  const transferId = crypto.randomUUID()
  const transferNumber = await generateTransferNumber(userId)
  
  // Validate branches
  const [fromBranch, toBranch] = await Promise.all([
    getBranch(data.fromBranchId),
    getBranch(data.toBranchId)
  ])
  
  if (!fromBranch || !toBranch) {
    throw new Error('Invalid branch specified')
  }
  
  if (fromBranch.status !== 'ACTIVE' || toBranch.status !== 'ACTIVE') {
    throw new Error('Both branches must be active for transfers')
  }
  
  // Validate stock availability
  const stockCheck = await validateStockAvailability(
    data.fromBranchId,
    data.items.map(item => ({
      productId: item.productId,
      quantity: item.requestedQuantity
    }))
  )
  
  if (!stockCheck.isValid) {
    throw new Error(`Stock validation failed: ${stockCheck.errors?.join(', ')}`)
  }
  
  // Calculate transfer value
  const currentStocks = await checkStockLevels(
    data.fromBranchId,
    data.items.map(item => item.productId)
  )
  
  let totalValue = 0
  const enrichedItems = data.items.map(item => {
    // We'd need product cost prices here - for now use 0
    const unitCostPrice = 0 // TODO: Get from product or inventory
    totalValue += item.requestedQuantity * unitCostPrice
    
    return {
      productId: item.productId,
      requestedQuantity: item.requestedQuantity,
      approvedQuantity: item.requestedQuantity, // Default to requested
      receivedQuantity: 0,
      unitCostPrice,
      totalValue: item.requestedQuantity * unitCostPrice,
      itemStatus: 'PENDING' as const,
      notes: item.notes || ''
    }
  })
  
  const transfer: BranchTransfer = {
    id: transferId,
    transferNumber,
    fromBranchId: data.fromBranchId,
    fromBranchName: fromBranch.name,
    toBranchId: data.toBranchId,
    toBranchName: toBranch.name,
    items: enrichedItems,
    totalItems: enrichedItems.length,
    totalValue,
    currency: 'KES',
    status: 'REQUESTED',
    priority: data.priority || 'NORMAL',
    requestedBy: userId,
    requestedAt: new Date(),
    requestReason: data.requestReason || '',
    transferType: data.transferType,
    transportMethod: data.transportMethod,
    estimatedArrival: data.estimatedArrival,
    internalNotes: data.internalNotes || '',
    userId
  }
  
  // Clean the transfer data to remove undefined values before saving to Firestore
  const cleanTransferData = removeUndefinedValues({
    ...transfer,
    requestedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  await setDoc(doc(db, 'branch_transfers', transferId), cleanTransferData)
  
  return transferId
}

export async function approveBranchTransfer(
  transferId: string,
  userId: string,
  data: ApproveTransferRequest
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const transferRef = doc(db, 'branch_transfers', transferId)
    const transferSnap = await transaction.get(transferRef)
    
    if (!transferSnap.exists()) {
      throw new Error('Transfer not found')
    }
    
    const transfer = transferSnap.data() as BranchTransfer
    
    if (transfer.status !== 'REQUESTED') {
      throw new Error('Only requested transfers can be approved')
    }
    
    if (data.approved) {
      // Update with approvals
      const updatedItems = transfer.items.map(item => {
        const approval = data.approvals?.find(a => a.productId === item.productId)
        return {
          ...item,
          approvedQuantity: approval?.approvedQuantity ?? item.requestedQuantity,
          itemStatus: 'APPROVED' as const,
          notes: approval?.notes || item.notes
        }
      })
      
      // Recalculate total value
      const newTotalValue = updatedItems.reduce((sum, item) => 
        sum + (item.approvedQuantity || 0) * (item.unitCostPrice || 0), 0)
      
      transaction.update(transferRef, {
        status: 'APPROVED',
        items: updatedItems,
        totalValue: newTotalValue,
        approvedBy: userId,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } else {
      // Reject transfer
      transaction.update(transferRef, {
        status: 'REJECTED',
        rejectedBy: userId,
        rejectedAt: serverTimestamp(),
        rejectionReason: data.rejectionReason || 'No reason provided',
        updatedAt: serverTimestamp()
      })
    }
  })
}

export async function shipBranchTransfer(
  transferId: string,
  data: ShipTransferRequest
): Promise<void> {
  await updateDoc(doc(db, 'branch_transfers', transferId), {
    status: 'IN_TRANSIT',
    shippedBy: data.shippedBy,
    shippedAt: serverTimestamp(),
    trackingNumber: data.trackingNumber || '',
    estimatedArrival: data.estimatedArrival ? Timestamp.fromDate(data.estimatedArrival) : null,
    shippingNotes: data.shippingNotes || '',
    updatedAt: serverTimestamp()
  })
}

export async function receiveBranchTransfer(
  userId: string,
  data: ReceiveTransferRequest
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const transferRef = doc(db, 'branch_transfers', data.transferId)
    const transferSnap = await transaction.get(transferRef)
    
    if (!transferSnap.exists()) {
      throw new Error('Transfer not found')
    }
    
    const transfer = transferSnap.data() as BranchTransfer
    
    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error('Only in-transit transfers can be received')
    }
    
    // Update transfer items with received quantities
    const updatedItems = transfer.items.map(item => {
      const received = data.items.find(r => r.productId === item.productId)
      if (received) {
        return {
          ...item,
          receivedQuantity: received.receivedQuantity,
          itemStatus: received.itemStatus,
          notes: received.notes || item.notes
        }
      }
      return item
    })
    
    // Update transfer status
    transaction.update(transferRef, {
      status: 'RECEIVED',
      items: updatedItems,
      receivedBy: data.receivedBy,
      receivedAt: serverTimestamp(),
      receivingNotes: data.receivingNotes || '',
      updatedAt: serverTimestamp()
    })
    
    // Create stock movements for the transfer
    for (const item of data.items) {
      if (item.receivedQuantity > 0 && item.itemStatus === 'RECEIVED') {
        // Create outbound movement for source branch
        const outMovementId = crypto.randomUUID()
        const outMovementData = removeUndefinedValues({
          id: outMovementId,
          productId: item.productId,
          branchId: transfer.fromBranchId,
          movementType: 'TRANSFER_OUT',
          quantity: item.receivedQuantity,
          previousStock: 0, // Will be calculated by inventory system
          newStock: 0,
          fromBranchId: transfer.fromBranchId,
          toBranchId: transfer.toBranchId,
          transferId: data.transferId,
          referenceType: 'TRANSFER',
          referenceId: data.transferId,
          status: 'APPROVED',
          reason: `Branch transfer: ${transfer.transferNumber}`,
          notes: `Transfer to ${transfer.toBranchName}`,
          userId: transfer.userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        transaction.set(doc(db, 'stock_movements', outMovementId), outMovementData)
        
        // Create inbound movement for destination branch
        const inMovementId = crypto.randomUUID()
        const inMovementData = removeUndefinedValues({
          id: inMovementId,
          productId: item.productId,
          branchId: transfer.toBranchId,
          movementType: 'TRANSFER_IN',
          quantity: item.receivedQuantity,
          previousStock: 0, // Will be calculated by inventory system
          newStock: 0,
          fromBranchId: transfer.fromBranchId,
          toBranchId: transfer.toBranchId,
          transferId: data.transferId,
          referenceType: 'TRANSFER',
          referenceId: data.transferId,
          status: 'APPROVED',
          reason: `Branch transfer: ${transfer.transferNumber}`,
          notes: `Transfer from ${transfer.fromBranchName}`,
          userId: transfer.userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        transaction.set(doc(db, 'stock_movements', inMovementId), inMovementData)
      }
    }
  })
  
  // Update inventory levels using existing inventory system
  // Note: This would need to be implemented to work with the existing inventory hooks
  // For now, the stock movements are created above
}

export async function cancelBranchTransfer(
  transferId: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, 'branch_transfers', transferId), {
    status: 'CANCELLED',
    rejectionReason: reason,
    cancelledAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

// ============================================================================
// BRANCH INVENTORY INTEGRATION
// ============================================================================

export async function getBranchInventorySummary(
  userId: string,
  branchId: string
): Promise<BranchInventorySummary | null> {
  const branch = await getBranch(branchId)
  if (!branch || branch.userId !== userId) {
    return null
  }
  
  // Get inventory items for this branch
  const inventoryItems = await getInventoryItems(userId, branchId)
  
  if (inventoryItems.length === 0) {
    return {
      branchId,
      branchName: branch.name,
      totalProducts: 0,
      totalInventoryValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringItems: 0,
      categoryBreakdown: [],
      recentMovements: [],
      alerts: { lowStock: [], expiring: [] }
    }
  }
  
  // Calculate metrics
  const totalProducts = inventoryItems.length
  const totalInventoryValue = inventoryItems.reduce((sum, item) => 
    sum + (item.currentStock * (item.averageCostPrice || 0)), 0)
  const lowStockItems = inventoryItems.filter(item => 
    item.currentStock <= item.minStockLevel).length
  const outOfStockItems = inventoryItems.filter(item => 
    item.currentStock === 0).length
  
  // Get recent stock movements for this branch
  const recentMovements: any[] = [] // TODO: Implement with stock movements query
  
  return {
    branchId,
    branchName: branch.name,
    totalProducts,
    totalInventoryValue,
    lowStockItems,
    outOfStockItems,
    expiringItems: 0, // TODO: Implement expiry tracking
    categoryBreakdown: [], // TODO: Calculate from products
    recentMovements,
    alerts: {
      lowStock: inventoryItems
        .filter(item => item.currentStock <= item.minStockLevel)
        .map(item => ({
          productId: item.productId,
          productName: item.productId, // TODO: Get product name
          currentStock: item.currentStock,
          minStockLevel: item.minStockLevel
        })),
      expiring: [] // TODO: Implement expiry alerts
    }
  }
}

export async function getMultibranchStockSummary(
  userId: string,
  productIds?: string[]
): Promise<MultibranchStockSummary[]> {
  // Get all branches for this user
  const branches = await getBranches(userId)
  const activeBranches = branches.filter(b => b.status === 'ACTIVE')
  
  if (activeBranches.length === 0) {
    return []
  }
  
  // Get inventory for all branches
  const allInventoryItems = await Promise.all(
    activeBranches.map(branch => getInventoryItems(userId, branch.id))
  )
  
  // Group by product
  const productStockMap = new Map<string, {
    productId: string
    productName: string
    totalStock: number
    totalAvailable: number
    totalReserved: number
    branchStocks: any[]
  }>()
  
  activeBranches.forEach((branch, branchIndex) => {
    const inventoryItems = allInventoryItems[branchIndex]
    
    inventoryItems.forEach(item => {
      if (productIds && !productIds.includes(item.productId)) {
        return
      }
      
      if (!productStockMap.has(item.productId)) {
        productStockMap.set(item.productId, {
          productId: item.productId,
          productName: item.productId, // TODO: Get actual product name
          totalStock: 0,
          totalAvailable: 0,
          totalReserved: 0,
          branchStocks: []
        })
      }
      
      const productStock = productStockMap.get(item.productId)!
      productStock.totalStock += item.currentStock
      productStock.totalAvailable += item.availableStock
      productStock.totalReserved += item.reservedStock
      productStock.branchStocks.push({
        branchId: branch.id,
        branchName: branch.name,
        currentStock: item.currentStock,
        availableStock: item.availableStock,
        isLowStock: item.currentStock <= item.minStockLevel,
        lastMovement: item.updatedAt
      })
    })
  })
  
  return Array.from(productStockMap.values())
}

// ============================================================================
// DASHBOARD AND ANALYTICS
// ============================================================================

export async function getBranchDashboard(userId: string): Promise<BranchDashboard> {
  try {
    console.log('getBranchDashboard called for userId:', userId)
    
    // Get branches and transfers with error handling
    const [branches, transfers] = await Promise.all([
      getBranches(userId).catch(error => {
        console.error('Error getting branches for dashboard:', error)
        return [] // Return empty array on error
      }),
      getBranchTransfers(userId, undefined, 'requestedAt', 'desc', 10).catch(error => {
        console.error('Error getting transfers for dashboard:', error)
        return [] // Return empty array on error
      })
    ])
    
    console.log('Dashboard data - branches found:', branches.length)
    console.log('Dashboard data - transfers found:', transfers.length)
  
  const activeBranches = branches.filter(b => b.status === 'ACTIVE')
  const totalBranches = branches.length
  
  // Calculate inventory metrics
  let totalProducts = 0
  let totalInventoryValue = 0
  let lowStockAlerts = 0
  
  for (const branch of activeBranches) {
    totalProducts += branch.totalProducts || 0
    totalInventoryValue += branch.totalInventoryValue || 0
    lowStockAlerts += branch.lowStockItemsCount || 0
  }
  
  // Transfer metrics
  const pendingTransfers = transfers.filter(t => t.status === 'REQUESTED').length
  const inTransitTransfers = transfers.filter(t => t.status === 'IN_TRANSIT').length
  
  // Top performing branches
  const topPerformingBranches = activeBranches
    .sort((a, b) => (b.totalInventoryValue || 0) - (a.totalInventoryValue || 0))
    .slice(0, 5)
    .map(branch => ({
      branchId: branch.id,
      branchName: branch.name,
      inventoryValue: branch.totalInventoryValue || 0,
      productsCount: branch.totalProducts || 0,
      transfersIn: 0, // TODO: Calculate from transfers
      transfersOut: 0 // TODO: Calculate from transfers
    }))
  
    return {
      totalBranches,
      activeBranches: activeBranches.length,
      totalProducts,
      totalInventoryValue,
      lowStockAlerts,
      pendingTransfers,
      inTransitTransfers,
      recentTransfers: transfers,
      topPerformingBranches
    }
  } catch (error) {
    console.error('Error in getBranchDashboard:', error)
    // Return default dashboard data on error
    return {
      totalBranches: 0,
      activeBranches: 0,
      totalProducts: 0,
      totalInventoryValue: 0,
      lowStockAlerts: 0,
      pendingTransfers: 0,
      inTransitTransfers: 0,
      recentTransfers: [],
      topPerformingBranches: []
    }
  }
}

export async function getBranchPerformanceReport(
  userId: string,
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<BranchPerformanceReport | null> {
  const branch = await getBranch(branchId)
  if (!branch || branch.userId !== userId) {
    return null
  }
  
  // Get transfers for the period
  const transfers = await getBranchTransfers(userId, {
    fromBranchId: branchId,
    dateRange: { from: startDate, to: endDate }
  })
  
  const transfersIn = await getBranchTransfers(userId, {
    toBranchId: branchId,
    dateRange: { from: startDate, to: endDate }
  })
  
  // Calculate metrics
  const transfersInCount = transfersIn.length
  const transfersOutCount = transfers.length
  const transferValue = transfers.reduce((sum, t) => sum + t.totalValue, 0)
  
  // TODO: Calculate other metrics from inventory and stock movements
  
  return {
    branchId,
    branchName: branch.name,
    reportPeriod: { start: startDate, end: endDate },
    openingStock: 0, // TODO: Calculate
    closingStock: 0, // TODO: Calculate
    stockReceived: 0, // TODO: Calculate
    stockTransferred: 0, // TODO: Calculate
    stockSold: 0, // TODO: Calculate from sales integration
    transfersIn: transfersInCount,
    transfersOut: transfersOutCount,
    transferValue,
    averageTransferTime: 0, // TODO: Calculate
    stockTurnover: 0, // TODO: Calculate
    inventoryAccuracy: 0, // TODO: Calculate
    fulfillmentRate: 0, // TODO: Calculate
    lowStockIncidents: 0, // TODO: Calculate
    stockOutIncidents: 0, // TODO: Calculate
    expiryIncidents: 0 // TODO: Calculate
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function updateBranchMetrics(branchId: string, userId: string): Promise<void> {
  const inventoryItems = await getInventoryItems(userId, branchId)
  
  const totalProducts = inventoryItems.length
  const totalInventoryValue = inventoryItems.reduce((sum, item) => 
    sum + (item.currentStock * (item.averageCostPrice || 0)), 0)
  const lowStockItemsCount = inventoryItems.filter(item => 
    item.currentStock <= item.minStockLevel).length
  
  await updateDoc(doc(db, 'branches', branchId), {
    totalProducts,
    totalInventoryValue,
    lowStockItemsCount,
    lastStockUpdate: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function getActiveBranches(userId: string): Promise<Branch[]> {
  return getBranches(userId, { status: ['ACTIVE'] })
}

export async function getBranchByCode(userId: string, branchCode: string): Promise<Branch | null> {
  const q = query(
    collection(db, 'branches'),
    where('userId', '==', userId),
    where('branchCode', '==', branchCode),
    limit(1)
  )
  
  const snap = await getDocs(q)
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Branch
  }
  
  return null
}

export async function getTransferHistory(
  userId: string,
  branchId?: string,
  limitCount: number = 50
): Promise<TransferHistory> {
  const filters: TransferFilters = {}
  
  if (branchId) {
    // Get transfers where this branch is either source or destination
    const [outboundTransfers, inboundTransfers] = await Promise.all([
      getBranchTransfers(userId, { fromBranchId: branchId }, 'requestedAt', 'desc', limitCount),
      getBranchTransfers(userId, { toBranchId: branchId }, 'requestedAt', 'desc', limitCount)
    ])
    
    // Combine and sort by date
    const allTransfers = [...outboundTransfers, ...inboundTransfers]
      .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime())
      .slice(0, limitCount)
    
    const totalTransfers = allTransfers.length
    const approvedTransfers = allTransfers.filter(t => t.status === 'RECEIVED').length
    const rejectedTransfers = allTransfers.filter(t => t.status === 'REJECTED' || t.status === 'CANCELLED').length
    const totalValue = allTransfers.reduce((sum, t) => sum + t.totalValue, 0)
    
    return {
      transfers: allTransfers,
      totalCount: totalTransfers,
      hasMore: totalTransfers >= limitCount,
      summary: {
        totalTransfers,
        approvedTransfers,
        rejectedTransfers,
        totalValue,
        averageProcessingDays: 0 // TODO: Calculate
      }
    }
  } else {
    const transfers = await getBranchTransfers(userId, filters, 'requestedAt', 'desc', limitCount)
    
    return {
      transfers,
      totalCount: transfers.length,
      hasMore: transfers.length >= limitCount,
      summary: {
        totalTransfers: transfers.length,
        approvedTransfers: transfers.filter(t => t.status === 'RECEIVED').length,
        rejectedTransfers: transfers.filter(t => t.status === 'REJECTED' || t.status === 'CANCELLED').length,
        totalValue: transfers.reduce((sum, t) => sum + t.totalValue, 0),
        averageProcessingDays: 0 // TODO: Calculate
      }
    }
  }
}
