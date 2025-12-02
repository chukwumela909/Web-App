// Branches module types for FahamPesa
// Independent module that integrates with Inventory and future Staff modules

export type BranchStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'TEMPORARILY_CLOSED'

export type TransferStatus = 
  | 'REQUESTED'     // Transfer request created
  | 'APPROVED'      // Approved by manager/owner  
  | 'IN_TRANSIT'    // Items shipped/being moved
  | 'RECEIVED'      // Items received and inventory updated
  | 'CANCELLED'     // Transfer cancelled
  | 'REJECTED'      // Transfer request rejected

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface OpeningHours {
  dayOfWeek: DayOfWeek
  isOpen: boolean
  openTime?: string  // Format: "HH:MM" (24-hour)
  closeTime?: string // Format: "HH:MM" (24-hour)
  breakStart?: string // Optional lunch break
  breakEnd?: string
}

export interface BranchLocation {
  address: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
  
  // GPS coordinates (optional)
  latitude?: number
  longitude?: number
  
  // Additional location info
  landmark?: string
  directions?: string
}

export interface BranchContact {
  phone?: string
  alternatePhone?: string
  email?: string
  whatsapp?: string
}

export interface Branch {
  id: string
  name: string
  
  // Location details
  location: BranchLocation
  
  // Contact information
  contact: BranchContact
  
  // Operating hours
  openingHours: OpeningHours[]
  
  // Management
  managerId?: string // Reference to staff member (future integration)
  managerName?: string // Denormalized for quick display
  
  // Branch details
  branchCode?: string // Short code like "BR001"
  branchType?: 'MAIN' | 'BRANCH' | 'OUTLET' | 'WAREHOUSE' | 'KIOSK'
  description?: string
  
  // Operational settings
  status: BranchStatus
  maxCapacity?: number // Max inventory capacity
  storageType?: string[] // Types of products this branch can handle
  
  // Financial settings
  currency?: string
  taxSettings?: {
    chargeTax: boolean
    taxRate: number
    taxNumber?: string
  }
  
  // Analytics (computed fields)
  totalProducts?: number // Count of products with stock
  totalInventoryValue?: number
  lowStockItemsCount?: number
  lastStockUpdate?: Date
  
  // Audit fields
  userId: string // Owner of this branch
  createdBy: string
  createdAt?: Date
  updatedAt?: Date
  lastActivityAt?: Date
}

export interface TransferItem {
  productId: string
  
  // Quantities
  requestedQuantity: number
  approvedQuantity?: number
  receivedQuantity?: number
  
  // Product details (denormalized for performance)
  productName?: string
  productSku?: string
  unitOfMeasure?: string
  
  // Costing
  unitCostPrice?: number
  totalValue?: number
  
  // Status per item
  itemStatus?: 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'DAMAGED'
  notes?: string
}

export interface BranchTransfer {
  id: string
  transferNumber: string // Generated transfer number (TR-2024-001)
  
  // Branch references
  fromBranchId: string
  fromBranchName?: string // Denormalized
  toBranchId: string
  toBranchName?: string // Denormalized
  
  // Transfer items
  items: TransferItem[]
  
  // Transfer summary
  totalItems: number
  totalValue: number
  currency: string
  
  // Status and workflow
  status: TransferStatus
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  
  // Workflow tracking
  requestedBy: string
  requestedAt: Date
  requestReason?: string
  
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
  
  shippedBy?: string
  shippedAt?: Date
  trackingNumber?: string
  estimatedArrival?: Date
  
  receivedBy?: string
  receivedAt?: Date
  
  // Transfer details
  transferType: 'STOCK_REBALANCING' | 'NEW_BRANCH_SETUP' | 'EMERGENCY_STOCK' | 'RETURN' | 'OTHER'
  transportMethod?: 'INTERNAL_DELIVERY' | 'COURIER' | 'PICKUP' | 'OTHER'
  
  // Documentation
  documents?: {
    fileName: string
    fileUrl: string
    fileType: string
    uploadedAt: Date
    uploadedBy: string
  }[]
  
  // Notes and communication
  internalNotes?: string
  shippingNotes?: string
  receivingNotes?: string
  
  // Audit fields
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

// Dashboard and Analytics Types
export interface BranchDashboard {
  totalBranches: number
  activeBranches: number
  
  // Inventory summary across branches
  totalProducts: number
  totalInventoryValue: number
  lowStockAlerts: number
  
  // Transfer activity
  pendingTransfers: number
  inTransitTransfers: number
  recentTransfers: BranchTransfer[]
  
  // Branch performance
  topPerformingBranches: {
    branchId: string
    branchName: string
    inventoryValue: number
    productsCount: number
    transfersIn: number
    transfersOut: number
  }[]
}

export interface BranchInventorySummary {
  branchId: string
  branchName: string
  
  // Stock summary
  totalProducts: number
  totalInventoryValue: number
  lowStockItems: number
  outOfStockItems: number
  expiringItems: number
  
  // Product categories breakdown
  categoryBreakdown: {
    category: string
    productCount: number
    inventoryValue: number
  }[]
  
  // Recent activity
  recentMovements: {
    productId: string
    productName: string
    movementType: string
    quantity: number
    date: Date
  }[]
  
  // Alerts
  alerts: {
    lowStock: {
      productId: string
      productName: string
      currentStock: number
      minStockLevel: number
    }[]
    expiring: {
      productId: string
      productName: string
      expiryDate: Date
      quantity: number
    }[]
  }
}

export interface TransferHistory {
  transfers: BranchTransfer[]
  totalCount: number
  hasMore: boolean
  
  // Summary statistics
  summary: {
    totalTransfers: number
    approvedTransfers: number
    rejectedTransfers: number
    totalValue: number
    averageProcessingDays: number
  }
}

// API Request/Response Types
export interface CreateBranchRequest {
  name: string
  location: BranchLocation
  contact: BranchContact
  openingHours: OpeningHours[]
  branchCode?: string
  branchType?: 'MAIN' | 'BRANCH' | 'OUTLET' | 'WAREHOUSE' | 'KIOSK'
  description?: string
  maxCapacity?: number
  storageType?: string[]
}

export interface UpdateBranchRequest extends Partial<CreateBranchRequest> {
  id: string
  status?: BranchStatus
  managerId?: string
}

export interface CreateTransferRequest {
  fromBranchId: string
  toBranchId: string
  items: {
    productId: string
    requestedQuantity: number
    notes?: string
  }[]
  transferType: 'STOCK_REBALANCING' | 'NEW_BRANCH_SETUP' | 'EMERGENCY_STOCK' | 'RETURN' | 'OTHER'
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  requestReason?: string
  transportMethod?: string
  estimatedArrival?: Date
  internalNotes?: string
}

export interface ApproveTransferRequest {
  transferId: string
  approved: boolean
  rejectionReason?: string
  approvals?: {
    productId: string
    approvedQuantity: number
    notes?: string
  }[]
  notes?: string
}

export interface ShipTransferRequest {
  transferId: string
  shippedBy: string
  trackingNumber?: string
  estimatedArrival?: Date
  shippingNotes?: string
}

export interface ReceiveTransferRequest {
  transferId: string
  items: {
    productId: string
    receivedQuantity: number
    itemStatus: 'RECEIVED' | 'DAMAGED'
    notes?: string
  }[]
  receivedBy: string
  receivingNotes?: string
}

// Filter and Search Types
export interface BranchFilters {
  status?: BranchStatus[]
  branchType?: ('MAIN' | 'BRANCH' | 'OUTLET' | 'WAREHOUSE' | 'KIOSK')[]
  city?: string[]
  managerId?: string
  searchTerm?: string
}

export interface TransferFilters {
  status?: TransferStatus[]
  fromBranchId?: string
  toBranchId?: string
  transferType?: ('STOCK_REBALANCING' | 'NEW_BRANCH_SETUP' | 'EMERGENCY_STOCK' | 'RETURN' | 'OTHER')[]
  priority?: ('LOW' | 'NORMAL' | 'HIGH' | 'URGENT')[]
  dateRange?: {
    from: Date
    to: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  searchTerm?: string
}

// Reporting Types
export interface BranchPerformanceReport {
  branchId: string
  branchName: string
  reportPeriod: {
    start: Date
    end: Date
  }
  
  // Inventory metrics
  openingStock: number
  closingStock: number
  stockReceived: number
  stockTransferred: number
  stockSold: number // Integration with sales
  
  // Transfer metrics
  transfersIn: number
  transfersOut: number
  transferValue: number
  averageTransferTime: number
  
  // Performance indicators
  stockTurnover: number
  inventoryAccuracy: number
  fulfillmentRate: number
  
  // Alerts summary
  lowStockIncidents: number
  stockOutIncidents: number
  expiryIncidents: number
}

export interface StockMovementSummary {
  branchId: string
  branchName: string
  period: {
    start: Date
    end: Date
  }
  
  // Movement summary
  totalMovements: number
  inboundMovements: number
  outboundMovements: number
  adjustments: number
  
  // Movement breakdown
  movements: {
    movementType: string
    quantity: number
    value: number
    count: number
  }[]
  
  // Top products by movement
  topProducts: {
    productId: string
    productName: string
    totalMovement: number
    movementValue: number
  }[]
}

// Integration Types
export interface BranchStockLevel {
  branchId: string
  productId: string
  currentStock: number
  reservedStock: number
  availableStock: number
  minStockLevel: number
  maxStockLevel?: number
  lastUpdated: Date
}

export interface MultibranchStockSummary {
  productId: string
  productName: string
  totalStock: number
  totalAvailable: number
  totalReserved: number
  
  branchStocks: {
    branchId: string
    branchName: string
    currentStock: number
    availableStock: number
    isLowStock: boolean
    lastMovement?: Date
  }[]
}

// Utility Types
export type BranchSortField = 'name' | 'city' | 'status' | 'inventoryValue' | 'createdAt' | 'lastActivityAt'
export type TransferSortField = 'transferNumber' | 'status' | 'totalValue' | 'requestedAt' | 'receivedAt'
export type SortDirection = 'asc' | 'desc'

// Constants
export const DEFAULT_OPENING_HOURS: OpeningHours[] = [
  { dayOfWeek: 'MONDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { dayOfWeek: 'TUESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { dayOfWeek: 'WEDNESDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { dayOfWeek: 'THURSDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { dayOfWeek: 'FRIDAY', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { dayOfWeek: 'SATURDAY', isOpen: true, openTime: '09:00', closeTime: '17:00' },
  { dayOfWeek: 'SUNDAY', isOpen: false }
]

export const BRANCH_TRANSFER_STATUSES: { [key in TransferStatus]: string } = {
  'REQUESTED': 'Requested',
  'APPROVED': 'Approved',
  'IN_TRANSIT': 'In Transit',
  'RECEIVED': 'Received',
  'CANCELLED': 'Cancelled',
  'REJECTED': 'Rejected'
}

export const BRANCH_STATUSES: { [key in BranchStatus]: string } = {
  'ACTIVE': 'Active',
  'INACTIVE': 'Inactive',
  'UNDER_MAINTENANCE': 'Under Maintenance',
  'TEMPORARILY_CLOSED': 'Temporarily Closed'
}
