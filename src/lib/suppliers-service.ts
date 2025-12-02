// Suppliers and Purchase Orders service for FahamPesa - Firestore operations
// Handles all supplier and PO-related database operations

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
  Supplier,
  PurchaseOrder,
  PriceHistory,
  SupplierStatement,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  CreatePurchaseOrderRequest,
  ApprovePurchaseOrderRequest,
  SendPurchaseOrderRequest,
  ReceivePurchaseOrderRequest,
  UpdateSupplierPerformanceRequest,
  SupplierDashboard,
  PurchaseOrderDashboard,
  SupplierPerformanceReport,
  SupplierFilters,
  PurchaseOrderFilters,
  SupplierProductLink,
  SupplierStatus,
  PurchaseOrderStatus,
  SupplierSortField,
  PurchaseOrderSortField,
  SortDirection
} from '@/lib/suppliers-types'

// Integration with inventory system
import { processPurchaseInventoryUpdate } from '@/lib/inventory-hooks'

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
// SUPPLIER OPERATIONS
// ============================================================================

export async function getSuppliers(
  userId: string,
  filters?: SupplierFilters,
  sortField: SupplierSortField = 'name',
  sortDirection: SortDirection = 'asc',
  limitCount?: number
): Promise<Supplier[]> {
  let q = query(collection(db, 'suppliers'), where('userId', '==', userId))
  
  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    q = query(q, where('status', 'in', filters.status))
  }
  
  if (filters?.categories && filters.categories.length > 0) {
    q = query(q, where('categories', 'array-contains-any', filters.categories))
  }
  
  // Skip server-side sorting to avoid Firestore index requirements
  // Will use client-side sorting instead
  
  if (limitCount) {
    q = query(q, limit(limitCount))
  }
  
  const snap = await getDocs(q)
  let suppliers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier))
  
  // Apply client-side sorting
  if (sortField && suppliers.length > 0) {
    suppliers.sort((a, b) => {
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
  
  // Apply client-side filters that can't be done in Firestore
  let filteredSuppliers = suppliers
  
  if (filters?.onTimeDeliveryRate) {
    filteredSuppliers = filteredSuppliers.filter(s => 
      s.onTimeDeliveryRate >= filters.onTimeDeliveryRate!.min &&
      s.onTimeDeliveryRate <= filters.onTimeDeliveryRate!.max
    )
  }
  
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase()
    filteredSuppliers = filteredSuppliers.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.contactPerson?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.phone.includes(term)
    )
  }
  
  return filteredSuppliers
}

export async function getSupplier(supplierId: string): Promise<Supplier | null> {
  const docSnap = await getDoc(doc(db, 'suppliers', supplierId))
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Supplier
  }
  return null
}

export async function createSupplier(
  userId: string,
  data: CreateSupplierRequest
): Promise<string> {
  const supplierId = crypto.randomUUID()
  
  const supplier: Supplier = {
    id: supplierId,
    name: data.name,
    contactPerson: data.contactPerson || '',
    email: data.email || '',
    phone: data.phone,
    address: data.address,
    paymentTerms: data.paymentTerms || 'NET_30',
    categories: data.categories,
    notes: data.notes || '',
    
    // Initialize performance metrics
    onTimeDeliveryRate: 100, // Start optimistically
    totalOrders: 0,
    completedOrders: 0,
    averageDeliveryDays: 0,
    
    // Status
    status: 'ACTIVE',
    
    // Audit fields
    createdBy: userId,
    userId
  }
  
  // Clean the supplier data to remove undefined values before saving to Firestore
  const cleanSupplierData = removeUndefinedValues({
    ...supplier,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  await setDoc(doc(db, 'suppliers', supplierId), cleanSupplierData)
  
  return supplierId
}

export async function updateSupplier(
  supplierId: string,
  data: UpdateSupplierRequest
): Promise<void> {
  const updateData: any = { ...data }
  delete updateData.id // Remove ID from update data
  updateData.updatedAt = serverTimestamp()
  
  await updateDoc(doc(db, 'suppliers', supplierId), updateData)
}

export async function archiveSupplier(supplierId: string): Promise<void> {
  await updateDoc(doc(db, 'suppliers', supplierId), {
    status: 'INACTIVE',
    updatedAt: serverTimestamp()
  })
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  // Check if supplier has any purchase orders
  const poQuery = query(
    collection(db, 'purchase_orders'),
    where('supplierId', '==', supplierId),
    limit(1)
  )
  const poSnap = await getDocs(poQuery)
  
  if (!poSnap.empty) {
    throw new Error('Cannot delete supplier with existing purchase orders. Archive instead.')
  }
  
  await deleteDoc(doc(db, 'suppliers', supplierId))
}

// ============================================================================
// PURCHASE ORDER OPERATIONS
// ============================================================================

export async function getPurchaseOrders(
  userId: string,
  filters?: PurchaseOrderFilters,
  sortField: PurchaseOrderSortField = 'createdAt',
  sortDirection: SortDirection = 'desc',
  limitCount?: number
): Promise<PurchaseOrder[]> {
  let q = query(collection(db, 'purchase_orders'), where('userId', '==', userId))
  
  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    q = query(q, where('status', 'in', filters.status))
  }
  
  if (filters?.supplierId) {
    q = query(q, where('supplierId', '==', filters.supplierId))
  }
  
  if (filters?.branchId) {
    q = query(q, where('branchId', '==', filters.branchId))
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
  let orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
  
  // Apply client-side sorting
  if (sortField && orders.length > 0) {
    orders.sort((a, b) => {
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
  let filteredOrders = orders
  
  if (filters?.searchTerm) {
    const term = filters.searchTerm.toLowerCase()
    filteredOrders = filteredOrders.filter(po =>
      po.poNumber.toLowerCase().includes(term) ||
      po.supplierName?.toLowerCase().includes(term) ||
      po.internalNotes?.toLowerCase().includes(term)
    )
  }
  
  if (filters?.amountRange) {
    filteredOrders = filteredOrders.filter(po =>
      po.totalAmount >= filters.amountRange!.min &&
      po.totalAmount <= filters.amountRange!.max
    )
  }
  
  return filteredOrders
}

export async function getPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrder | null> {
  const docSnap = await getDoc(doc(db, 'purchase_orders', purchaseOrderId))
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as PurchaseOrder
  }
  return null
}

export async function generatePONumber(userId: string): Promise<string> {
  // Generate PO number like PO-2024-001
  const year = new Date().getFullYear()
  
  // Get the last PO number for this year
  const q = query(
    collection(db, 'purchase_orders'),
    where('userId', '==', userId),
    where('poNumber', '>=', `PO-${year}-000`),
    where('poNumber', '<', `PO-${year + 1}-000`),
    orderBy('poNumber', 'desc'),
    limit(1)
  )
  
  const snap = await getDocs(q)
  let nextNumber = 1
  
  if (!snap.empty) {
    const lastPONumber = snap.docs[0].data().poNumber
    const match = lastPONumber.match(/PO-\d{4}-(\d{3})/)
    if (match) {
      nextNumber = parseInt(match[1]) + 1
    }
  }
  
  return `PO-${year}-${nextNumber.toString().padStart(3, '0')}`
}

export async function createPurchaseOrder(
  userId: string,
  data: CreatePurchaseOrderRequest
): Promise<string> {
  const purchaseOrderId = crypto.randomUUID()
  const poNumber = await generatePONumber(userId)
  
  // Get supplier info for denormalization
  const supplier = await getSupplier(data.supplierId)
  if (!supplier) {
    throw new Error('Supplier not found')
  }
  
  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => 
    sum + (item.quantityOrdered * item.unitCost), 0
  )
  
  // Prepare items with calculated fields
  const items = data.items.map(item => ({
    productId: item.productId,
    quantityOrdered: item.quantityOrdered,
    quantityReceived: 0,
    quantityPending: item.quantityOrdered,
    unitCost: item.unitCost,
    totalCost: item.quantityOrdered * item.unitCost,
    notes: item.notes || ''
  }))
  
  const purchaseOrder: PurchaseOrder = {
    id: purchaseOrderId,
    poNumber,
    supplierId: data.supplierId,
    supplierName: supplier.name,
    items,
    subtotal,
    totalAmount: subtotal, // Can add tax and shipping later
    currency: 'KES', // Default currency
    expectedDeliveryDate: data.expectedDeliveryDate,
    branchId: data.branchId,
    status: 'DRAFT',
    priority: data.priority || 'NORMAL',
    requestedBy: userId,
    paymentTerms: data.paymentTerms || supplier.paymentTerms,
    deliveryAddress: data.deliveryAddress || '',
    internalNotes: data.internalNotes || '',
    publicNotes: data.publicNotes || '',
    userId
  }
  
  // Clean the purchase order data to remove undefined values before saving to Firestore
  const cleanPurchaseOrderData = removeUndefinedValues({
    ...purchaseOrder,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  await setDoc(doc(db, 'purchase_orders', purchaseOrderId), cleanPurchaseOrderData)
  
  return purchaseOrderId
}

export async function submitPurchaseOrder(purchaseOrderId: string): Promise<void> {
  await updateDoc(doc(db, 'purchase_orders', purchaseOrderId), {
    status: 'PENDING',
    updatedAt: serverTimestamp()
  })
}

export async function approvePurchaseOrder(
  purchaseOrderId: string,
  userId: string,
  data: ApprovePurchaseOrderRequest
): Promise<void> {
  const updateData: any = {
    updatedAt: serverTimestamp()
  }
  
  if (data.approved) {
    updateData.status = 'APPROVED'
    updateData.approvedBy = userId
    updateData.approvedAt = serverTimestamp()
  } else {
    updateData.status = 'REJECTED'
    updateData.rejectedBy = userId
    updateData.rejectedAt = serverTimestamp()
    updateData.rejectionReason = data.rejectionReason || 'No reason provided'
  }
  
  if (data.notes) {
    updateData.internalNotes = data.notes
  }
  
  await updateDoc(doc(db, 'purchase_orders', purchaseOrderId), updateData)
}

export async function sendPurchaseOrder(
  purchaseOrderId: string,
  data: SendPurchaseOrderRequest
): Promise<void> {
  await updateDoc(doc(db, 'purchase_orders', purchaseOrderId), {
    status: 'SENT',
    sentToSupplierAt: Timestamp.fromDate(data.sentToSupplierAt),
    supplierNotes: data.supplierNotes || '',
    updatedAt: serverTimestamp()
  })
}

export async function acknowledgePurchaseOrder(
  purchaseOrderId: string,
  acknowledgedAt: Date,
  supplierNotes?: string
): Promise<void> {
  await updateDoc(doc(db, 'purchase_orders', purchaseOrderId), {
    status: 'ACKNOWLEDGED',
    acknowledgedBySupplierAt: Timestamp.fromDate(acknowledgedAt),
    supplierNotes: supplierNotes || '',
    updatedAt: serverTimestamp()
  })
}

export async function receivePurchaseOrder(
  userId: string,
  data: ReceivePurchaseOrderRequest
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // Get the current PO
    const poRef = doc(db, 'purchase_orders', data.purchaseOrderId)
    const poSnap = await transaction.get(poRef)
    
    if (!poSnap.exists()) {
      throw new Error('Purchase order not found')
    }
    
    const purchaseOrder = poSnap.data() as PurchaseOrder
    
    // Update items with received quantities
    const updatedItems = purchaseOrder.items.map(item => {
      const receivedItem = data.items.find(r => r.productId === item.productId)
      if (receivedItem) {
        return {
          ...item,
          quantityReceived: item.quantityReceived + receivedItem.quantityReceived,
          quantityPending: item.quantityOrdered - (item.quantityReceived + receivedItem.quantityReceived),
          receivedDate: new Date(),
          isDefective: receivedItem.isDefective,
          defectiveQuantity: receivedItem.defectiveQuantity || 0,
          notes: receivedItem.notes || item.notes
        }
      }
      return item
    })
    
    // Calculate new status
    const totalOrdered = updatedItems.reduce((sum, item) => sum + item.quantityOrdered, 0)
    const totalReceived = updatedItems.reduce((sum, item) => sum + item.quantityReceived, 0)
    
    let newStatus: PurchaseOrderStatus
    if (totalReceived === 0) {
      newStatus = purchaseOrder.status // Keep current status if nothing received
    } else if (totalReceived >= totalOrdered) {
      newStatus = 'RECEIVED'
    } else {
      newStatus = 'PARTIALLY_RECEIVED'
    }
    
    // Update purchase order
    const updateData: any = {
      items: updatedItems,
      status: newStatus,
      receivedBy: data.receivedBy,
      updatedAt: serverTimestamp()
    }
    
    if (newStatus === 'RECEIVED') {
      updateData.receivingCompletedAt = serverTimestamp()
    } else if (purchaseOrder.status !== 'PARTIALLY_RECEIVED') {
      updateData.receivingStartedAt = serverTimestamp()
    }
    
    if (data.notes) {
      updateData.internalNotes = data.notes
    }
    
    transaction.update(poRef, updateData)
    
    // Update inventory using the integration hook
    // This will automatically create stock movements and update inventory levels
    const inventoryUpdateData = {
      id: data.purchaseOrderId,
      branchId: purchaseOrder.branchId,
      items: data.items.map(item => ({
        productId: item.productId,
        quantity: item.quantityReceived - (item.defectiveQuantity || 0), // Only add non-defective items
        unitCostPrice: updatedItems.find(ui => ui.productId === item.productId)?.unitCost || 0
      })).filter(item => item.quantity > 0), // Only items with positive quantity
      supplierId: purchaseOrder.supplierId,
      totalAmount: purchaseOrder.totalAmount,
      purchaseDate: new Date(),
      invoiceNumber: purchaseOrder.poNumber,
      notes: data.notes
    }
    
    // The inventory update will be done after the transaction completes
    // Store the data for post-transaction processing
    ;(updateData as any).__inventoryUpdate = inventoryUpdateData
  })
  
  // After transaction completes, update inventory
  const po = await getPurchaseOrder(data.purchaseOrderId)
  if (po && (po as any).__inventoryUpdate) {
    try {
      await processPurchaseInventoryUpdate(userId, (po as any).__inventoryUpdate)
    } catch (inventoryError) {
      console.error('Failed to update inventory after PO receipt:', inventoryError)
      // Log the error but don't fail the PO receipt
    }
  }
  
  // Update supplier performance metrics
  if (po) {
    await updateSupplierPerformanceFromPO(po)
  }
}

export async function cancelPurchaseOrder(
  purchaseOrderId: string,
  reason: string
): Promise<void> {
  await updateDoc(doc(db, 'purchase_orders', purchaseOrderId), {
    status: 'CANCELLED',
    rejectionReason: reason,
    updatedAt: serverTimestamp()
  })
}

// ============================================================================
// SUPPLIER PERFORMANCE TRACKING
// ============================================================================

export async function updateSupplierPerformance(
  supplierId: string,
  data: UpdateSupplierPerformanceRequest
): Promise<void> {
  const supplier = await getSupplier(supplierId)
  if (!supplier) {
    throw new Error('Supplier not found')
  }
  
  const updateData: any = {
    updatedAt: serverTimestamp()
  }
  
  // Update delivery performance
  if (data.onTimeDelivery !== undefined && data.deliveryDays !== undefined) {
    const totalDeliveries = supplier.completedOrders || 0
    const currentOnTimeRate = supplier.onTimeDeliveryRate || 100
    const currentAvgDays = supplier.averageDeliveryDays || 0
    
    // Calculate new on-time delivery rate
    const newOnTimeDeliveries = Math.round((currentOnTimeRate / 100) * totalDeliveries) + (data.onTimeDelivery ? 1 : 0)
    const newTotalDeliveries = totalDeliveries + 1
    updateData.onTimeDeliveryRate = Math.round((newOnTimeDeliveries / newTotalDeliveries) * 100)
    
    // Calculate new average delivery days
    updateData.averageDeliveryDays = Math.round(
      ((currentAvgDays * totalDeliveries) + data.deliveryDays) / newTotalDeliveries
    )
  }
  
  // Update ratings
  if (data.qualityRating !== undefined) {
    updateData.qualityRating = data.qualityRating
  }
  if (data.serviceRating !== undefined) {
    updateData.serviceRating = data.serviceRating
  }
  if (data.pricingRating !== undefined) {
    updateData.pricingRating = data.pricingRating
  }
  
  await updateDoc(doc(db, 'suppliers', supplierId), updateData)
}

async function updateSupplierPerformanceFromPO(purchaseOrder: PurchaseOrder): Promise<void> {
  if (!purchaseOrder.actualDeliveryDate) return
  
  const deliveryDays = Math.ceil(
    (purchaseOrder.actualDeliveryDate.getTime() - purchaseOrder.expectedDeliveryDate.getTime()) 
    / (1000 * 60 * 60 * 24)
  )
  
  const onTimeDelivery = deliveryDays <= 0 // On time or early
  
  await updateSupplierPerformance(purchaseOrder.supplierId, {
    onTimeDelivery,
    deliveryDays: Math.abs(deliveryDays)
  })
}

// ============================================================================
// PRICE HISTORY OPERATIONS
// ============================================================================

export async function createPriceHistory(
  userId: string,
  supplierId: string,
  productId: string,
  unitCost: number,
  purchaseOrderId?: string
): Promise<string> {
  const priceHistoryId = crypto.randomUUID()
  
  // Deactivate previous price for this supplier-product combination
  const existingPricesQuery = query(
    collection(db, 'price_history'),
    where('supplierId', '==', supplierId),
    where('productId', '==', productId),
    where('isActive', '==', true)
  )
  
  const existingPricesSnap = await getDocs(existingPricesQuery)
  const batch = writeBatch(db)
  
  existingPricesSnap.docs.forEach(doc => {
    batch.update(doc.ref, {
      isActive: false,
      effectiveTo: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  })
  
  // Create new price record
  const priceHistory: PriceHistory = {
    id: priceHistoryId,
    supplierId,
    productId,
    unitCost,
    currency: 'KES',
    effectiveFrom: new Date(),
    isActive: true,
    purchaseOrderId,
    userId
  }
  
  batch.set(doc(db, 'price_history', priceHistoryId), {
    ...priceHistory,
    createdAt: serverTimestamp()
  })
  
  await batch.commit()
  return priceHistoryId
}

export async function getPriceHistory(
  userId: string,
  supplierId?: string,
  productId?: string
): Promise<PriceHistory[]> {
  let q = query(collection(db, 'price_history'), where('userId', '==', userId))
  
  if (supplierId) {
    q = query(q, where('supplierId', '==', supplierId))
  }
  
  if (productId) {
    q = query(q, where('productId', '==', productId))
  }
  
  q = query(q, orderBy('effectiveFrom', 'desc'))
  
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PriceHistory))
}

// ============================================================================
// DASHBOARD AND ANALYTICS
// ============================================================================

export async function getSupplierDashboard(userId: string): Promise<SupplierDashboard> {
  // Get supplier counts
  const suppliersSnap = await getDocs(
    query(collection(db, 'suppliers'), where('userId', '==', userId))
  )
  const suppliers = suppliersSnap.docs.map(doc => doc.data() as Supplier)
  
  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length
  
  // Get recent purchase orders (using client-side sorting to avoid index requirements)
  const recentOrdersSnap = await getDocs(
    query(
      collection(db, 'purchase_orders'),
      where('userId', '==', userId)
    )
  )
  let recentOrders = recentOrdersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
  
  // Sort client-side and limit to 10
  recentOrders = recentOrders
    .sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(0)
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(0)
      return bDate.getTime() - aDate.getTime()
    })
    .slice(0, 10)
  
  // Get top suppliers by order value
  const topSuppliers = suppliers
    .filter(s => s.totalOrders > 0)
    .sort((a, b) => (b.totalOrders * 1000 + b.onTimeDeliveryRate) - (a.totalOrders * 1000 + a.onTimeDeliveryRate))
    .slice(0, 5)
    .map(s => ({
      supplierId: s.id,
      supplierName: s.name,
      totalOrders: s.totalOrders,
      totalAmount: 0, // Would need to calculate from POs
      onTimeDeliveryRate: s.onTimeDeliveryRate
    }))
  
  // Count pending approvals and overdue deliveries
  const pendingApprovals = recentOrders.filter(po => po.status === 'PENDING').length
  const overdueDeliveries = recentOrders.filter(po => 
    po.status === 'SENT' || po.status === 'ACKNOWLEDGED' &&
    new Date() > po.expectedDeliveryDate
  ).length
  
  return {
    totalSuppliers,
    activeSuppliers,
    topSuppliers,
    recentOrders,
    pendingApprovals,
    overdueDeliveries
  }
}

export async function getPurchaseOrderDashboard(userId: string): Promise<PurchaseOrderDashboard> {
  const ordersSnap = await getDocs(
    query(collection(db, 'purchase_orders'), where('userId', '==', userId))
  )
  const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
  
  const totalOrders = orders.length
  const pendingOrders = orders.filter(po => po.status === 'PENDING').length
  const overdueOrders = orders.filter(po => 
    (po.status === 'SENT' || po.status === 'ACKNOWLEDGED') &&
    new Date() > po.expectedDeliveryDate
  ).length
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlySpend = orders
    .filter(po => {
      const orderDate = po.createdAt as any
      return orderDate && 
        orderDate.toDate().getMonth() === currentMonth &&
        orderDate.toDate().getFullYear() === currentYear
    })
    .reduce((sum, po) => sum + po.totalAmount, 0)
  
  // Recent activity
  const recentActivity = orders
    .sort((a, b) => (b.updatedAt as any)?.toDate() - (a.updatedAt as any)?.toDate())
    .slice(0, 10)
    .map(po => ({
      type: po.status === 'DRAFT' ? 'CREATED' as const :
            po.status === 'APPROVED' ? 'APPROVED' as const :
            po.status === 'SENT' ? 'SENT' as const :
            po.status === 'RECEIVED' ? 'RECEIVED' as const :
            'CREATED' as const,
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      supplierName: po.supplierName || 'Unknown Supplier',
      timestamp: (po.updatedAt as any)?.toDate() || new Date()
    }))
  
  return {
    totalOrders,
    pendingOrders,
    overdueOrders,
    monthlySpend,
    topCategories: [], // Would need to calculate from product categories
    recentActivity
  }
}

export async function getSupplierPerformanceReport(
  userId: string,
  supplierId: string
): Promise<SupplierPerformanceReport | null> {
  const supplier = await getSupplier(supplierId)
  if (!supplier || supplier.userId !== userId) {
    return null
  }
  
  // Get supplier's purchase orders
  const ordersSnap = await getDocs(
    query(
      collection(db, 'purchase_orders'),
      where('supplierId', '==', supplierId),
      where('userId', '==', userId)
    )
  )
  const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
  
  const completedOrders = orders.filter(po => po.status === 'RECEIVED').length
  const cancelledOrders = orders.filter(po => po.status === 'CANCELLED').length
  const totalSpend = orders.reduce((sum, po) => sum + po.totalAmount, 0)
  
  // Calculate order fulfillment rate
  const orderFulfillmentRate = supplier.totalOrders > 0 ? 
    Math.round((completedOrders / supplier.totalOrders) * 100) : 100
  
  // Calculate quality score (average of ratings)
  const qualityScore = Math.round(
    ((supplier.qualityRating || 5) + 
     (supplier.serviceRating || 5) + 
     (supplier.pricingRating || 5)) / 3
  )
  
  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    onTimeDeliveryRate: supplier.onTimeDeliveryRate,
    averageDeliveryDays: supplier.averageDeliveryDays,
    orderFulfillmentRate,
    qualityScore,
    totalOrders: supplier.totalOrders,
    completedOrders,
    cancelledOrders,
    totalSpend,
    lastOrderDate: supplier.lastOrderDate,
    recentIssues: [] // Would need a separate collection for tracking issues
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getSuppliersByCategory(
  userId: string,
  category: string
): Promise<Supplier[]> {
  const q = query(
    collection(db, 'suppliers'),
    where('userId', '==', userId),
    where('categories', 'array-contains', category),
    where('status', '==', 'ACTIVE')
  )
  
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier))
}

export async function getOverduePurchaseOrders(userId: string): Promise<PurchaseOrder[]> {
  const q = query(
    collection(db, 'purchase_orders'),
    where('userId', '==', userId),
    where('status', 'in', ['SENT', 'ACKNOWLEDGED']),
    where('expectedDeliveryDate', '<', new Date())
  )
  
  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
}

export async function getPendingApprovals(userId: string): Promise<PurchaseOrder[]> {
  const q = query(
    collection(db, 'purchase_orders'),
    where('userId', '==', userId),
    where('status', '==', 'PENDING')
    // Removed orderBy to avoid compound index requirement
  )
  
  const snap = await getDocs(q)
  let orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
  
  // Sort client-side by createdAt
  return orders.sort((a, b) => {
    const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(0)
    const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(0)
    return aDate.getTime() - bDate.getTime()
  })
}

export async function getSupplierPurchaseOrders(
  supplierId: string,
  userId: string,
  limitCount?: number
): Promise<PurchaseOrder[]> {
  let q = query(
    collection(db, 'purchase_orders'),
    where('supplierId', '==', supplierId),
    where('userId', '==', userId)
    // Removed orderBy to avoid compound index requirement
  )
  
  const snap = await getDocs(q)
  let orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
  
  // Sort client-side by createdAt desc and apply limit
  orders = orders
    .sort((a, b) => {
      const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(0)
      const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(0)
      return bDate.getTime() - aDate.getTime()
    })
  
  if (limitCount) {
    orders = orders.slice(0, limitCount)
  }
  
  return orders
}
