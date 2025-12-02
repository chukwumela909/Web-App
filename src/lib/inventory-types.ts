// Inventory module types for FahamPesa
// Do NOT modify existing Product interfaces - only reference them

export type StockMovementType = 
  | 'SALE'           // Product sold (decreases stock)
  | 'PURCHASE'       // Product purchased/received (increases stock) 
  | 'TRANSFER_OUT'   // Stock transferred to another branch (decreases stock)
  | 'TRANSFER_IN'    // Stock received from another branch (increases stock)
  | 'ADJUSTMENT'     // Manual stock adjustment (can increase or decrease)
  | 'WASTAGE'        // Stock wasted/expired (decreases stock)
  | 'RETURN'         // Customer return (increases stock)
  | 'DAMAGE'         // Damaged goods (decreases stock)
  | 'THEFT'          // Stock theft/loss (decreases stock)
  | 'INITIAL'        // Initial stock setup (increases stock)

export type StockMovementStatus = 'PENDING' | 'APPROVED' | 'CANCELLED'

export type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED'

// Branch interface removed - use the one from @/lib/branches-types instead
// This ensures consistency across the application

export interface InventoryItem {
  id: string
  productId: string // Reference to existing products collection
  branchId: string
  currentStock: number
  reservedStock: number // Stock reserved for pending orders
  availableStock: number // currentStock - reservedStock
  
  // Batch tracking (optional)
  batches?: BatchInfo[]
  
  // Alert thresholds
  minStockLevel: number
  maxStockLevel?: number
  reorderPoint?: number
  reorderQuantity?: number
  
  // Costing
  averageCostPrice: number
  lastCostPrice: number
  
  // Location in branch
  binLocation?: string
  
  // Audit fields
  lastCountDate?: Date
  lastCountStock?: number
  lastCountUserId?: string
  
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface BatchInfo {
  batchNumber: string
  quantity: number
  costPrice: number
  receivedDate: Date
  expiryDate?: Date
  supplierId?: string
  isActive: boolean
}

export interface StockMovement {
  id: string
  productId: string
  branchId: string
  
  // Movement details
  movementType: StockMovementType
  quantity: number // Always positive, direction determined by movementType
  previousStock: number
  newStock: number
  
  // Costing
  unitCostPrice?: number
  totalValue?: number
  
  // Transfer specific fields
  fromBranchId?: string // For transfers
  toBranchId?: string   // For transfers
  transferId?: string   // Link related transfer movements
  
  // Batch tracking
  batchNumber?: string
  
  // Reference information
  referenceType?: 'SALE' | 'PURCHASE' | 'TRANSFER' | 'ADJUSTMENT' | 'AUDIT'
  referenceId?: string // Sale ID, Purchase Order ID, etc.
  
  // Approval workflow
  status: StockMovementStatus
  approvedBy?: string
  approvedAt?: Date
  
  // Metadata
  reason?: string
  notes?: string
  userId: string // Who initiated the movement
  createdAt?: Date
  updatedAt?: Date
}

export interface StockTransfer {
  id: string
  fromBranchId: string
  toBranchId: string
  
  // Transfer items
  items: TransferItem[]
  
  // Status tracking
  status: TransferStatus
  requestedBy: string
  approvedBy?: string
  receivedBy?: string
  
  // Timestamps
  requestedAt: Date
  approvedAt?: Date
  shippedAt?: Date
  receivedAt?: Date
  
  // Metadata
  reason?: string
  notes?: string
  trackingNumber?: string
  
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface TransferItem {
  productId: string
  requestedQuantity: number
  approvedQuantity?: number
  receivedQuantity?: number
  batchNumber?: string
  notes?: string
}

export interface StockAudit {
  id: string
  branchId: string
  
  // Audit details
  auditDate: Date
  auditType: 'FULL' | 'PARTIAL' | 'CYCLE'
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  
  // Items being audited
  items: AuditItem[]
  
  // Summary
  totalItemsAudited: number
  totalDiscrepancies: number
  totalValueAdjustment: number
  
  // Metadata
  auditedBy: string
  reviewedBy?: string
  notes?: string
  
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface AuditItem {
  productId: string
  batchNumber?: string
  
  // Stock counts
  systemStock: number
  physicalStock: number
  discrepancy: number // physicalStock - systemStock
  
  // Valuation
  unitCostPrice: number
  discrepancyValue: number
  
  // Status
  isReconciled: boolean
  reconciliationNotes?: string
}

export interface LowStockAlert {
  id: string
  productId: string
  branchId: string
  
  // Alert details
  currentStock: number
  minStockLevel: number
  shortage: number
  
  // Status
  isActive: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  resolvedAt?: Date
  
  // Metadata
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ExpiryAlert {
  id: string
  productId: string
  branchId: string
  batchNumber: string
  
  // Alert details
  expiryDate: Date
  daysUntilExpiry: number
  quantity: number
  
  // Alert thresholds
  alertType: 'EXPIRING_SOON' | 'EXPIRED'
  alertDays: number // Alert when X days before expiry
  
  // Status
  isActive: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  actionTaken?: 'SOLD' | 'DISCOUNTED' | 'DISPOSED' | 'RETURNED'
  actionDate?: Date
  
  // Metadata
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

// API Response types
export interface StockLevel {
  productId: string
  branchId: string
  currentStock: number
  reservedStock: number
  availableStock: number
  minStockLevel: number
  isLowStock: boolean
  batches?: BatchInfo[]
}

export interface StockMovementHistory {
  movements: StockMovement[]
  totalCount: number
  hasMore: boolean
}

export interface InventoryDashboard {
  branchId: string
  totalProducts: number
  lowStockItems: number
  outOfStockItems: number
  expiringItems: number
  totalInventoryValue: number
  recentMovements: StockMovement[]
  alerts: {
    lowStock: LowStockAlert[]
    expiring: ExpiryAlert[]
  }
}

// API Request types
export interface StockAdjustmentRequest {
  productId: string
  branchId: string
  quantity: number // Can be positive or negative
  reason: string
  notes?: string
  batchNumber?: string
}

export interface StockTransferRequest {
  fromBranchId: string
  toBranchId: string
  items: {
    productId: string
    quantity: number
    batchNumber?: string
  }[]
  reason?: string
  notes?: string
}

export interface StockAuditRequest {
  branchId: string
  auditType: 'FULL' | 'PARTIAL' | 'CYCLE'
  productIds?: string[] // For partial audits
  notes?: string
}

export interface AuditReconciliationRequest {
  auditId: string
  items: {
    productId: string
    batchNumber?: string
    physicalStock: number
    notes?: string
  }[]
}
