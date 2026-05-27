// Inventory service for FahamPesa - Firestore operations
// Handles all inventory-related database operations

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
  InventoryItem,
  StockMovement,
  StockTransfer,
  StockAudit,
  LowStockAlert,
  ExpiryAlert,
  StockLevel,
  StockMovementHistory,
  InventoryDashboard,
  StockAdjustmentRequest,
  StockTransferRequest,
  StockAuditRequest,
  AuditReconciliationRequest,
  StockMovementType,
  TransferStatus,
  BatchInfo
} from '@/lib/inventory-types'

// Import Branch from the proper branches system
import { Branch } from '@/lib/branches-types'
import { getBranches as getBranchesFromService, getBranch as getBranchFromService } from '@/lib/branches-service'
import {
  adjustBackendStock,
  createBackendTransfer,
  getBackendTransfers,
  getBackendProducts,
  getSelectedBackendBranchId,
  isBackendAvailable,
  shouldUseFirebaseFallback,
  transitionBackendTransfer
} from '@/lib/backend-business-api'

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
// BRANCH OPERATIONS (Using proper branches service)
// ============================================================================

export async function getBranches(userId: string): Promise<Branch[]> {
  // Use the proper branches service which handles the correct data structure
  return await getBranchesFromService(userId)
}

export async function getBranch(branchId: string): Promise<Branch | null> {
  // Use the proper branches service which handles the correct data structure
  return await getBranchFromService(branchId)
}

// Note: createBranch should use the branches service, not inventory service
// Use the branches API endpoints for creating branches

// ============================================================================
// INVENTORY ITEM OPERATIONS
// ============================================================================

async function getInventoryRecord(productId: string, branchId: string): Promise<InventoryItem | null> {
  const q = query(
    collection(db, 'inventory'),
    where('productId', '==', productId),
    where('branchId', '==', branchId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as InventoryItem
}

async function getInventoryRecordsForBranch(userId: string, branchId: string): Promise<Map<string, InventoryItem>> {
  const q = query(
    collection(db, 'inventory'),
    where('userId', '==', userId),
    where('branchId', '==', branchId)
  )
  const snap = await getDocs(q)
  return new Map(
    snap.docs.map((inventoryDoc) => {
      const item = { id: inventoryDoc.id, ...inventoryDoc.data() } as InventoryItem
      return [item.productId, item]
    })
  )
}

export async function getInventoryItems(userId: string, branchId?: string): Promise<InventoryItem[]> {
  if (isBackendAvailable()) {
    try {
      const targetBranch = branchId || await getSelectedBackendBranchId()
      const products = await getBackendProducts(targetBranch)
      return products.map((product) => ({
        id: product.id,
        productId: product.id,
        branchId: targetBranch,
        currentStock: product.quantity || 0,
        reservedStock: 0,
        availableStock: product.quantity || 0,
        minStockLevel: product.minStockLevel || 0,
        reorderPoint: product.minStockLevel || 0,
        averageCostPrice: product.costPrice || 0,
        lastCostPrice: product.costPrice || 0,
        binLocation: product.location || undefined,
        userId: product.userId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }))
    } catch (error) {
      if (!shouldUseFirebaseFallback(error)) throw error
      console.warn('Backend inventory unavailable, falling back to Firestore:', error)
    }
  }

  try {
    // Get products from the products collection (where they're actually stored)
    let q = query(
      collection(db, 'products'), 
      where('userId', '==', userId)
      // Note: Removed isActive filter as it might be causing issues if field doesn't exist
    )
    
    // Try to order by updatedAt, but handle case where field doesn't exist
    try {
      q = query(q, orderBy('updatedAt', 'desc'))
    } catch (orderError) {
      // If ordering fails, continue without ordering
      console.warn('Could not order products by updatedAt:', orderError)
    }
    
    const snap = await getDocs(q)
    const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
    const inventoryByProduct = branchId
      ? await getInventoryRecordsForBranch(userId, branchId)
      : new Map<string, InventoryItem>()
    
    // Convert products to InventoryItem format for inventory dashboard
    const inventoryItems: InventoryItem[] = products.map(product => {
      const branchInventory = inventoryByProduct.get(product.id)
      const currentStock = branchInventory?.currentStock ?? product.quantity ?? 0
      const reservedStock = branchInventory?.reservedStock ?? 0

      return {
        id: branchInventory?.id || product.id,
        productId: product.id,
        branchId: branchId || branchInventory?.branchId || 'main',
        currentStock,
        reservedStock,
        availableStock: branchInventory?.availableStock ?? Math.max(0, currentStock - reservedStock),
      
        // Alert thresholds from product
        minStockLevel: branchInventory?.minStockLevel ?? product.minStockLevel ?? 0,
        maxStockLevel: branchInventory?.maxStockLevel,
        reorderPoint: branchInventory?.reorderPoint ?? product.minStockLevel ?? 0,
        reorderQuantity: branchInventory?.reorderQuantity,
      
        // Costing from product
        averageCostPrice: branchInventory?.averageCostPrice ?? product.averagePurchasePrice ?? product.costPrice ?? 0,
        lastCostPrice: branchInventory?.lastCostPrice ?? product.lastPurchasePrice ?? product.costPrice ?? 0,
      
        // Location
        binLocation: branchInventory?.binLocation ?? product.location ?? undefined,
      
        // Audit fields
        lastCountDate: undefined,
        lastCountStock: undefined,
        lastCountUserId: undefined,
      
        // Metadata
        userId: product.userId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    })
    
    return inventoryItems
  } catch (error) {
    console.error('Error fetching inventory items from products:', error)
    return [] // Return empty array instead of throwing error
  }
}

export async function getInventoryItem(productId: string, branchId: string): Promise<InventoryItem | null> {
  try {
    const inventoryRecord = await getInventoryRecord(productId, branchId)
    if (inventoryRecord) {
      return inventoryRecord
    }

    // Get the product from the products collection
    const productDoc = await getDoc(doc(db, 'products', productId))
    
    if (!productDoc.exists()) {
      return null
    }
    
    const product = { id: productDoc.id, ...productDoc.data() } as any
    
    // Check if product is active
    if (product.isActive === false) {
      return null
    }
    
    // Convert product to InventoryItem format
    const inventoryItem: InventoryItem = {
      id: product.id,
      productId: product.id,
      branchId: branchId,
      currentStock: product.quantity || 0,
      reservedStock: 0, // TODO: Implement reserved stock tracking
      availableStock: product.quantity || 0,
      
      // Alert thresholds from product
      minStockLevel: product.minStockLevel || 0,
      maxStockLevel: undefined,
      reorderPoint: product.minStockLevel || 0,
      reorderQuantity: undefined,
      
      // Costing from product
      averageCostPrice: product.averagePurchasePrice || product.costPrice || 0,
      lastCostPrice: product.lastPurchasePrice || product.costPrice || 0,
      
      // Location
      binLocation: product.location || undefined,
      
      // Audit fields
      lastCountDate: undefined,
      lastCountStock: undefined,
      lastCountUserId: undefined,
      
      // Metadata
      userId: product.userId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }
    
    return inventoryItem
  } catch (error) {
    console.error('Error fetching inventory item from product:', error)
    return null // Return null instead of throwing error
  }
}

export async function createOrUpdateInventoryItem(
  userId: string,
  productId: string,
  branchId: string,
  data: Partial<InventoryItem>
): Promise<void> {
  const existingItem = await getInventoryRecord(productId, branchId)
  
  if (existingItem) {
    // Update existing inventory item
    await updateDoc(doc(db, 'inventory', existingItem.id), {
      ...data,
      updatedAt: serverTimestamp()
    })
  } else {
    // Create new inventory item
    const inventoryId = crypto.randomUUID()
    const inventoryItem: InventoryItem = {
      id: inventoryId,
      productId,
      branchId,
      currentStock: data.currentStock || 0,
      reservedStock: data.reservedStock || 0,
      availableStock: (data.currentStock || 0) - (data.reservedStock || 0),
      minStockLevel: data.minStockLevel || 0,
      maxStockLevel: data.maxStockLevel,
      reorderPoint: data.reorderPoint,
      reorderQuantity: data.reorderQuantity,
      averageCostPrice: data.averageCostPrice || 0,
      lastCostPrice: data.lastCostPrice || 0,
      binLocation: data.binLocation,
      batches: data.batches || [],
      userId
    }
    
    await setDoc(doc(db, 'inventory', inventoryId), {
      ...inventoryItem,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  }
}

// ============================================================================
// STOCK LEVEL OPERATIONS
// ============================================================================

export async function getStockLevels(userId: string, branchId: string, productIds?: string[]): Promise<StockLevel[]> {
  try {
    let q = query(
      collection(db, 'inventory'),
      where('userId', '==', userId),
      where('branchId', '==', branchId)
    )
    
    if (productIds && productIds.length > 0) {
      q = query(q, where('productId', 'in', productIds))
    }
    
    const snap = await getDocs(q)
    
    return snap.docs.map(doc => {
      const item = doc.data() as InventoryItem
      return {
        productId: item.productId,
        branchId: item.branchId,
        currentStock: item.currentStock || 0,
        reservedStock: item.reservedStock || 0,
        availableStock: item.availableStock || 0,
        minStockLevel: item.minStockLevel || 0,
        isLowStock: (item.currentStock || 0) <= (item.minStockLevel || 0),
        batches: item.batches || []
      }
    })
  } catch (error) {
    console.error('Error fetching stock levels:', error)
    return [] // Return empty array instead of throwing error
  }
}

export async function getStockLevel(productId: string, branchId: string): Promise<StockLevel | null> {
  try {
    const item = await getInventoryItem(productId, branchId)
    
    if (!item) {
      return null
    }
    
    return {
      productId: item.productId,
      branchId: item.branchId,
      currentStock: item.currentStock || 0,
      reservedStock: item.reservedStock || 0,
      availableStock: item.availableStock || 0,
      minStockLevel: item.minStockLevel || 0,
      isLowStock: (item.currentStock || 0) <= (item.minStockLevel || 0),
      batches: item.batches || []
    }
  } catch (error) {
    console.error('Error fetching stock level:', error)
    return null // Return null instead of throwing error
  }
}

// ============================================================================
// STOCK MOVEMENT OPERATIONS
// ============================================================================

export async function createStockMovement(
  userId: string,
  movement: Omit<StockMovement, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const movementId = crypto.randomUUID()
  const stockMovement: StockMovement = {
    id: movementId,
    ...movement,
    userId
  }
  
  await setDoc(doc(db, 'stock_movements', movementId), removeUndefinedValues({
    ...stockMovement,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }))
  
  return movementId
}

export async function getStockMovements(
  userId: string,
  filters?: {
    productId?: string
    branchId?: string
    movementType?: StockMovementType
    startDate?: Date
    endDate?: Date
  },
  pagination?: { limit: number; startAfterDoc?: any }
): Promise<StockMovementHistory> {
  try {
    let q = query(collection(db, 'stock_movements'), where('userId', '==', userId))
    
    if (filters?.productId) {
      q = query(q, where('productId', '==', filters.productId))
    }
    
    if (filters?.branchId) {
      q = query(q, where('branchId', '==', filters.branchId))
    }
    
    if (filters?.movementType) {
      q = query(q, where('movementType', '==', filters.movementType))
    }
    
    if (filters?.startDate) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)))
    }
    
    if (filters?.endDate) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)))
    }
    
    // Try to order by createdAt, but handle case where field doesn't exist
    try {
      q = query(q, orderBy('createdAt', 'desc'))
    } catch (orderError) {
      console.warn('Could not order stock movements by createdAt:', orderError)
    }
    
    if (pagination?.limit) {
      q = query(q, limit(pagination.limit))
    }
    
    if (pagination?.startAfterDoc) {
      q = query(q, startAfter(pagination.startAfterDoc))
    }
    
    const snap = await getDocs(q)
    const movements = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement))
    
    return {
      movements,
      totalCount: movements.length,
      hasMore: movements.length === (pagination?.limit || Number.MAX_SAFE_INTEGER)
    }
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return {
      movements: [],
      totalCount: 0,
      hasMore: false
    }
  }
}

// ============================================================================
// STOCK ADJUSTMENT OPERATIONS
// ============================================================================

export async function adjustStock(
  userId: string,
  request: StockAdjustmentRequest
): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await adjustBackendStock(request)
      return
    } catch (error) {
      if (!shouldUseFirebaseFallback(error)) throw error
      console.warn('Backend stock adjustment unavailable, falling back to Firestore:', error)
    }
  }

  await runTransaction(db, async (transaction) => {
    // Get current inventory item
    const inventoryRef = await getInventoryItem(request.productId, request.branchId)
    
    if (!inventoryRef) {
      throw new Error('Inventory item not found')
    }
    
    const currentStock = inventoryRef.currentStock
    const newStock = Math.max(0, currentStock + request.quantity) // Prevent negative stock
    
    // Create stock movement record
    const movementId = crypto.randomUUID()
    const movement: StockMovement = {
      id: movementId,
      productId: request.productId,
      branchId: request.branchId,
      movementType: 'ADJUSTMENT',
      quantity: Math.abs(request.quantity),
      previousStock: currentStock,
      newStock,
      batchNumber: request.batchNumber,
      referenceType: 'ADJUSTMENT',
      status: 'APPROVED',
      reason: request.reason,
      notes: request.notes,
      userId
    }
    
    // Update inventory item
    const inventoryDocRef = doc(db, 'inventory', inventoryRef.id)
    transaction.update(inventoryDocRef, {
      currentStock: newStock,
      availableStock: newStock - inventoryRef.reservedStock,
      updatedAt: serverTimestamp()
    })
    
    // Create movement record
    const movementDocRef = doc(db, 'stock_movements', movementId)
    transaction.set(movementDocRef, {
      ...movement,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  })
}

// ============================================================================
// STOCK TRANSFER OPERATIONS
// ============================================================================

export async function createStockTransfer(
  userId: string,
  request: StockTransferRequest
): Promise<string> {
  if (isBackendAvailable()) {
    try {
      return await createBackendTransfer({
        ...request,
        priority: 'normal'
      })
    } catch (error) {
      if (!shouldUseFirebaseFallback(error)) throw error
      console.warn('Backend transfer create unavailable, falling back to Firestore:', error)
    }
  }

  if (request.fromBranchId === request.toBranchId) {
    throw new Error('Source and destination branches cannot be the same')
  }

  const sourceStock = await getInventoryItems(userId, request.fromBranchId)
  const sourceStockByProduct = new Map(sourceStock.map(item => [item.productId, item]))

  for (const item of request.items) {
    const stock = sourceStockByProduct.get(item.productId)
    if (!stock) {
      throw new Error(`No stock record found for product ${item.productId}`)
    }
    if (item.quantity <= 0) {
      throw new Error('Transfer quantity must be greater than zero')
    }
    if (stock.availableStock < item.quantity) {
      throw new Error(`Insufficient stock for product ${item.productId}. Available: ${stock.availableStock}, requested: ${item.quantity}`)
    }
  }

  const transferId = crypto.randomUUID()
  
  const transfer: StockTransfer = {
    id: transferId,
    fromBranchId: request.fromBranchId,
    toBranchId: request.toBranchId,
    items: request.items.map(item => ({
      productId: item.productId,
      requestedQuantity: item.quantity,
      approvedQuantity: item.quantity,
      receivedQuantity: 0,
      batchNumber: item.batchNumber
    })),
    status: 'PENDING',
    requestedBy: userId,
    requestedAt: new Date(),
    reason: request.reason,
    notes: request.notes,
    userId
  }
  
  await setDoc(doc(db, 'stock_transfers', transferId), removeUndefinedValues({
    ...transfer,
    requestedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }))
  
  return transferId
}

export async function approveStockTransfer(
  transferId: string,
  userId: string,
  approvals: { productId: string; approvedQuantity: number }[]
): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await transitionBackendTransfer(transferId, 'approve', {
        items: approvals.map((approval) => ({
          productId: approval.productId,
          quantity: approval.approvedQuantity
        }))
      })
      await transitionBackendTransfer(transferId, 'ship')
      return
    } catch (error) {
      if (!shouldUseFirebaseFallback(error)) throw error
      console.warn('Backend transfer approve/ship unavailable, falling back to Firestore:', error)
    }
  }

  const transferRef = doc(db, 'stock_transfers', transferId)
  const transferSnap = await getDoc(transferRef)

  if (!transferSnap.exists()) {
    throw new Error('Transfer not found')
  }

  const transfer = transferSnap.data() as StockTransfer

  if (transfer.userId !== userId) {
    throw new Error('You do not have access to this transfer')
  }

  if (transfer.status !== 'PENDING') {
    throw new Error('Only pending transfers can be approved')
  }

  const updatedItems = transfer.items.map(item => {
    const approval = approvals.find(a => a.productId === item.productId)
    return {
      ...item,
      approvedQuantity: approval?.approvedQuantity ?? item.requestedQuantity
    }
  })

  await updateDoc(transferRef, {
    items: updatedItems,
    status: 'IN_TRANSIT',
    approvedBy: userId,
    approvedAt: serverTimestamp(),
    shippedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function receiveStockTransfer(
  transferId: string,
  userId: string,
  receipts: { productId: string; receivedQuantity: number }[]
): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await transitionBackendTransfer(transferId, 'receive', {
        items: receipts.map((receipt) => ({
          productId: receipt.productId,
          quantityReceived: receipt.receivedQuantity
        }))
      })
      return
    } catch (error) {
      if (!shouldUseFirebaseFallback(error)) throw error
      console.warn('Backend transfer receive unavailable, falling back to Firestore:', error)
    }
  }

  const transferRef = doc(db, 'stock_transfers', transferId)
  const transferSnap = await getDoc(transferRef)

  if (!transferSnap.exists()) {
    throw new Error('Transfer not found')
  }

  const transfer = transferSnap.data() as StockTransfer

  if (transfer.userId !== userId) {
    throw new Error('You do not have access to this transfer')
  }

  if (transfer.status !== 'IN_TRANSIT') {
    throw new Error('Only in-transit transfers can be received')
  }

  const updatedItems = transfer.items.map(item => {
    const receipt = receipts.find(r => r.productId === item.productId)
    const receivedQuantity = receipt?.receivedQuantity ?? item.approvedQuantity ?? item.requestedQuantity
    const approvedQuantity = item.approvedQuantity ?? item.requestedQuantity
    return {
      ...item,
      receivedQuantity: Math.min(receivedQuantity, approvedQuantity)
    }
  })

  await updateDoc(transferRef, {
    items: updatedItems,
    status: 'RECEIVED',
    receivedBy: userId,
    receivedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  for (const item of updatedItems) {
    const quantity = item.receivedQuantity || 0
    if (quantity <= 0) continue

    const sourceInventory = await getInventoryItem(item.productId, transfer.fromBranchId)
    const previousSourceStock = sourceInventory?.currentStock || 0
    const newSourceStock = Math.max(0, previousSourceStock - quantity)
    const destinationInventory = await getInventoryItem(item.productId, transfer.toBranchId)
    const previousDestinationStock = destinationInventory?.currentStock || 0
    const newDestinationStock = previousDestinationStock + quantity

    await createStockMovement(transfer.userId, {
      productId: item.productId,
      branchId: transfer.fromBranchId,
      movementType: 'TRANSFER_OUT',
      quantity,
      previousStock: previousSourceStock,
      newStock: newSourceStock,
      fromBranchId: transfer.fromBranchId,
      toBranchId: transfer.toBranchId,
      transferId,
      referenceType: 'TRANSFER',
      referenceId: transferId,
      status: 'APPROVED',
      batchNumber: item.batchNumber,
      notes: `Transfer to ${transfer.toBranchId}`
    })

    await createStockMovement(transfer.userId, {
      productId: item.productId,
      branchId: transfer.toBranchId,
      movementType: 'TRANSFER_IN',
      quantity,
      previousStock: previousDestinationStock,
      newStock: newDestinationStock,
      fromBranchId: transfer.fromBranchId,
      toBranchId: transfer.toBranchId,
      transferId,
      referenceType: 'TRANSFER',
      referenceId: transferId,
      status: 'APPROVED',
      batchNumber: item.batchNumber,
      notes: `Transfer from ${transfer.fromBranchId}`
    })

    await createOrUpdateInventoryItem(transfer.userId, item.productId, transfer.fromBranchId, {
      currentStock: newSourceStock,
      reservedStock: sourceInventory?.reservedStock || 0,
      availableStock: Math.max(0, newSourceStock - (sourceInventory?.reservedStock || 0)),
      minStockLevel: sourceInventory?.minStockLevel || 0,
      averageCostPrice: sourceInventory?.averageCostPrice || 0,
      lastCostPrice: sourceInventory?.lastCostPrice || 0
    })

    await createOrUpdateInventoryItem(transfer.userId, item.productId, transfer.toBranchId, {
      currentStock: newDestinationStock,
      reservedStock: destinationInventory?.reservedStock || 0,
      availableStock: Math.max(0, newDestinationStock - (destinationInventory?.reservedStock || 0)),
      minStockLevel: destinationInventory?.minStockLevel || 0,
      averageCostPrice: destinationInventory?.averageCostPrice || 0,
      lastCostPrice: destinationInventory?.lastCostPrice || 0
    })
  }
}

export async function getStockTransfers(userId: string, branchId?: string): Promise<StockTransfer[]> {
  if (isBackendAvailable()) {
    try {
      const transfers = await getBackendTransfers()
      const stockTransfers = transfers.map((transfer) => ({
        id: transfer.id,
        fromBranchId: transfer.fromBranchId,
        toBranchId: transfer.toBranchId,
        items: transfer.items.map((item) => ({
          productId: item.productId,
          requestedQuantity: item.requestedQuantity,
          approvedQuantity: item.approvedQuantity,
          receivedQuantity: item.receivedQuantity,
          notes: item.notes
        })),
        status: transfer.status === 'REQUESTED' ? 'PENDING' : transfer.status,
        requestedBy: transfer.requestedBy,
        requestedAt: transfer.requestedAt,
        reason: transfer.requestReason,
        notes: transfer.internalNotes,
        userId: transfer.userId
      } as StockTransfer))

      return branchId
        ? stockTransfers.filter(transfer => transfer.fromBranchId === branchId || transfer.toBranchId === branchId)
        : stockTransfers
    } catch (error) {
      if (!shouldUseFirebaseFallback(error)) throw error
      console.warn('Backend transfers unavailable, falling back to Firestore:', error)
    }
  }

  const q = query(collection(db, 'stock_transfers'), where('userId', '==', userId))
  const snap = await getDocs(q)
  const transfers = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as StockTransfer))
    .sort((a, b) => {
      const aDate = Number((a.createdAt as any)?.seconds || 0)
      const bDate = Number((b.createdAt as any)?.seconds || 0)
      return bDate - aDate
    })

  return branchId
    ? transfers.filter(transfer => transfer.fromBranchId === branchId || transfer.toBranchId === branchId)
    : transfers
}

// ============================================================================
// STOCK AUDIT OPERATIONS
// ============================================================================

export async function createStockAudit(
  userId: string,
  request: StockAuditRequest
): Promise<string> {
  const auditId = crypto.randomUUID()
  
  // Get inventory items to audit
  const inventoryItems = await getInventoryItems(userId, request.branchId)
  const itemsToAudit = request.productIds 
    ? inventoryItems.filter(item => request.productIds!.includes(item.productId))
    : inventoryItems
  
  const auditItems = itemsToAudit.map(item => ({
    productId: item.productId,
    systemStock: item.currentStock,
    physicalStock: 0,
    discrepancy: 0,
    unitCostPrice: item.lastCostPrice || item.averageCostPrice,
    discrepancyValue: 0,
    isReconciled: false
  }))
  
  const audit: StockAudit = {
    id: auditId,
    branchId: request.branchId,
    auditDate: new Date(),
    auditType: request.auditType,
    status: 'PLANNED',
    items: auditItems,
    totalItemsAudited: 0,
    totalDiscrepancies: 0,
    totalValueAdjustment: 0,
    auditedBy: userId,
    notes: request.notes,
    userId
  }
  
  await setDoc(doc(db, 'stock_audits', auditId), {
    ...audit,
    auditDate: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  
  return auditId
}

export async function updateStockAudit(
  auditId: string,
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
): Promise<void> {
  await updateDoc(doc(db, 'stock_audits', auditId), {
    status,
    updatedAt: serverTimestamp()
  })
}

export async function reconcileAudit(
  userId: string,
  request: AuditReconciliationRequest
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const auditRef = doc(db, 'stock_audits', request.auditId)
    const auditSnap = await transaction.get(auditRef)
    
    if (!auditSnap.exists()) {
      throw new Error('Audit not found')
    }
    
    const audit = auditSnap.data() as StockAudit
    
    // Update audit items with physical counts
    const updatedItems = audit.items.map(item => {
      const reconciliation = request.items.find(r => r.productId === item.productId)
      if (reconciliation) {
        const discrepancy = reconciliation.physicalStock - item.systemStock
        return {
          ...item,
          physicalStock: reconciliation.physicalStock,
          discrepancy,
          discrepancyValue: discrepancy * item.unitCostPrice,
          isReconciled: true,
          reconciliationNotes: reconciliation.notes
        }
      }
      return item
    })
    
    // Calculate totals
    const totalItemsAudited = updatedItems.filter(item => item.isReconciled).length
    const totalDiscrepancies = updatedItems.filter(item => item.discrepancy !== 0).length
    const totalValueAdjustment = updatedItems.reduce((sum, item) => sum + item.discrepancyValue, 0)
    
    // Update audit
    transaction.update(auditRef, {
      items: updatedItems,
      totalItemsAudited,
      totalDiscrepancies,
      totalValueAdjustment,
      status: 'COMPLETED',
      reviewedBy: userId,
      updatedAt: serverTimestamp()
    })
    
    // Create adjustment movements for discrepancies
    for (const item of updatedItems) {
      if (item.discrepancy !== 0 && item.isReconciled) {
        const movementId = crypto.randomUUID()
        const movement: StockMovement = {
          id: movementId,
          productId: item.productId,
          branchId: audit.branchId,
          movementType: 'ADJUSTMENT',
          quantity: Math.abs(item.discrepancy),
          previousStock: item.systemStock,
          newStock: item.physicalStock,
          referenceType: 'AUDIT',
          referenceId: request.auditId,
          status: 'APPROVED',
          reason: `Stock audit adjustment`,
          notes: `Audit ID: ${request.auditId}. ${item.reconciliationNotes || ''}`,
          userId
        }
        
        transaction.set(doc(db, 'stock_movements', movementId), {
          ...movement,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        // Update inventory item
        const inventoryItem = await getInventoryItem(item.productId, audit.branchId)
        if (inventoryItem) {
          transaction.update(doc(db, 'inventory', inventoryItem.id), {
            currentStock: item.physicalStock,
            availableStock: item.physicalStock - inventoryItem.reservedStock,
            lastCountDate: serverTimestamp(),
            lastCountStock: item.physicalStock,
            lastCountUserId: userId,
            updatedAt: serverTimestamp()
          })
        }
      }
    }
  })
}

export async function getStockAudits(userId: string, branchId?: string): Promise<StockAudit[]> {
  let q = query(collection(db, 'stock_audits'), where('userId', '==', userId))
  
  if (branchId) {
    q = query(q, where('branchId', '==', branchId))
  }
  
  q = query(q, orderBy('createdAt', 'desc'))
  
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockAudit))
}

// ============================================================================
// ALERT OPERATIONS
// ============================================================================

export async function generateLowStockAlerts(userId: string, branchId?: string): Promise<LowStockAlert[]> {
  // Get all inventory items that are low on stock
  const inventoryItems = await getInventoryItems(userId, branchId)
  const lowStockItems = inventoryItems.filter(item => 
    item.currentStock <= item.minStockLevel && item.currentStock >= 0
  )
  
  const alerts: LowStockAlert[] = []
  
  // Create or update alerts for low stock items
  for (const item of lowStockItems) {
    // Check if alert already exists
    const existingAlertQuery = query(
      collection(db, 'low_stock_alerts'),
      where('productId', '==', item.productId),
      where('branchId', '==', item.branchId),
      where('isActive', '==', true)
    )
    const existingAlertSnap = await getDocs(existingAlertQuery)
    
    if (existingAlertSnap.empty) {
      // Create new alert
      const alertId = crypto.randomUUID()
      const alert: LowStockAlert = {
        id: alertId,
        productId: item.productId,
        branchId: item.branchId,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        shortage: item.minStockLevel - item.currentStock,
        isActive: true,
        userId
      }
      
      await setDoc(doc(db, 'low_stock_alerts', alertId), {
        ...alert,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      alerts.push(alert)
    } else {
      // Update existing alert
      const existingAlert = existingAlertSnap.docs[0]
      await updateDoc(doc(db, 'low_stock_alerts', existingAlert.id), {
        currentStock: item.currentStock,
        shortage: item.minStockLevel - item.currentStock,
        updatedAt: serverTimestamp()
      })
      
      alerts.push({ id: existingAlert.id, ...existingAlert.data() } as LowStockAlert)
    }
  }
  
  // Deactivate alerts for items that are no longer low on stock
  const activeAlerts = query(
    collection(db, 'low_stock_alerts'),
    where('userId', '==', userId),
    where('isActive', '==', true)
  )
  const activeAlertsSnap = await getDocs(activeAlerts)
  
  const batch = writeBatch(db)
  
  for (const alertDoc of activeAlertsSnap.docs) {
    const alert = alertDoc.data() as LowStockAlert
    const currentInventory = inventoryItems.find(item => 
      item.productId === alert.productId && item.branchId === alert.branchId
    )
    
    if (!currentInventory || currentInventory.currentStock > currentInventory.minStockLevel) {
      batch.update(doc(db, 'low_stock_alerts', alertDoc.id), {
        isActive: false,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
  }
  
  await batch.commit()
  
  return alerts
}

export async function getLowStockAlerts(userId: string, branchId?: string): Promise<LowStockAlert[]> {
  try {
    let q = query(
      collection(db, 'low_stock_alerts'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    )
    
    if (branchId) {
      q = query(q, where('branchId', '==', branchId))
    }
    
    // Try to order by createdAt, but handle case where field doesn't exist
    try {
      q = query(q, orderBy('createdAt', 'desc'))
    } catch (orderError) {
      console.warn('Could not order low stock alerts by createdAt:', orderError)
    }
    
    const snap = await getDocs(q)
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LowStockAlert))
  } catch (error) {
    console.error('Error fetching low stock alerts:', error)
    return [] // Return empty array instead of throwing error
  }
}

export async function acknowledgeAlert(alertId: string, userId: string, type: 'low_stock' | 'expiry'): Promise<void> {
  const collection_name = type === 'low_stock' ? 'low_stock_alerts' : 'expiry_alerts'
  
  await updateDoc(doc(db, collection_name, alertId), {
    acknowledgedBy: userId,
    acknowledgedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

// ============================================================================
// DASHBOARD OPERATIONS
// ============================================================================

export async function getInventoryDashboard(userId: string, branchId: string): Promise<InventoryDashboard> {
  try {
    // Get inventory items for this branch
    const inventoryItems = await getInventoryItems(userId, branchId)
    
    // Calculate metrics
    const totalProducts = inventoryItems.length
    const lowStockItems = inventoryItems.filter(item => item.currentStock <= item.minStockLevel).length
    const outOfStockItems = inventoryItems.filter(item => item.currentStock === 0).length
    
    // Calculate total inventory value
    const totalInventoryValue = inventoryItems.reduce((sum, item) => {
      return sum + (item.currentStock * (item.averageCostPrice || 0))
    }, 0)
    
    // Get recent stock movements (last 10)
    const recentMovements = await getStockMovements(
      userId, 
      { branchId }, 
      { limit: 10 }
    )
    
    // Get alerts
    const lowStockAlerts = await getLowStockAlerts(userId, branchId)
    
    // TODO: Implement expiry alerts
    const expiryAlerts: ExpiryAlert[] = []
    const expiringItems = 0
    
    return {
      branchId,
      totalProducts,
      lowStockItems,
      outOfStockItems,
      expiringItems,
      totalInventoryValue,
      recentMovements: recentMovements.movements || [],
      alerts: {
        lowStock: lowStockAlerts,
        expiring: expiryAlerts
      }
    }
  } catch (error) {
    console.error('Error generating inventory dashboard:', error)
    // Return empty dashboard instead of throwing error
    return {
      branchId,
      totalProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringItems: 0,
      totalInventoryValue: 0,
      recentMovements: [],
      alerts: {
        lowStock: [],
        expiring: []
      }
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getInventoryValueByBranch(userId: string, branchId?: string): Promise<number> {
  const inventoryItems = await getInventoryItems(userId, branchId)
  
  return inventoryItems.reduce((sum, item) => {
    return sum + (item.currentStock * (item.averageCostPrice || 0))
  }, 0)
}

export async function getLowStockCount(userId: string, branchId?: string): Promise<number> {
  const inventoryItems = await getInventoryItems(userId, branchId)
  return inventoryItems.filter(item => item.currentStock <= item.minStockLevel).length
}

export async function getOutOfStockCount(userId: string, branchId?: string): Promise<number> {
  const inventoryItems = await getInventoryItems(userId, branchId)
  return inventoryItems.filter(item => item.currentStock === 0).length
}
