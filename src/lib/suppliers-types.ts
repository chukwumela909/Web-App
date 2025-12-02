// Suppliers and Purchase Orders module types for FahamPesa
// Independent modules that integrate with Products and Inventory

export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION'

export type PurchaseOrderStatus = 
  | 'DRAFT'              // Being created, not yet submitted
  | 'PENDING'            // Submitted, awaiting approval
  | 'APPROVED'           // Approved by manager/owner
  | 'SENT'               // Sent to supplier
  | 'ACKNOWLEDGED'       // Supplier confirmed receipt
  | 'PARTIALLY_RECEIVED' // Some items received
  | 'RECEIVED'           // All items received
  | 'DELAYED'            // Past expected delivery date
  | 'CANCELLED'          // Order cancelled
  | 'REJECTED'           // Approval rejected

export type PaymentTerms = 
  | 'CASH_ON_DELIVERY'
  | 'NET_7'              // Payment within 7 days
  | 'NET_15'             // Payment within 15 days
  | 'NET_30'             // Payment within 30 days
  | 'ADVANCE_PAYMENT'    // Payment before delivery
  | 'CUSTOM'

export interface Supplier {
  id: string
  name: string
  
  // Contact Information
  contactPerson?: string
  email?: string
  phone: string
  alternatePhone?: string
  
  // Address
  address: string
  city?: string
  postalCode?: string
  country?: string
  
  // Business Details
  businessRegistrationNumber?: string
  taxId?: string
  website?: string
  
  // Supplier Performance Metrics
  onTimeDeliveryRate: number // Percentage (0-100)
  totalOrders: number
  completedOrders: number
  averageDeliveryDays: number
  
  // Financial Terms
  paymentTerms: PaymentTerms
  customPaymentTerms?: string // For CUSTOM payment terms
  creditLimit?: number
  currentBalance?: number // Outstanding amount owed
  
  // Product Categories
  categories: string[] // What product categories they supply
  
  // Status and Metadata
  status: SupplierStatus
  notes?: string
  tags?: string[] // For categorization/filtering
  
  // Ratings and Reviews
  qualityRating?: number // 1-5 stars
  serviceRating?: number // 1-5 stars
  pricingRating?: number // 1-5 stars
  
  // Audit Fields
  createdBy: string
  userId: string // Owner of this supplier record
  createdAt?: Date
  updatedAt?: Date
  lastOrderDate?: Date
}

export interface PriceHistory {
  id: string
  supplierId: string
  productId: string
  
  // Price Details
  unitCost: number
  currency: string
  minimumOrderQuantity?: number
  
  // Effective Period
  effectiveFrom: Date
  effectiveTo?: Date
  isActive: boolean
  
  // Context
  purchaseOrderId?: string // Which PO established this price
  notes?: string
  
  userId: string
  createdAt?: Date
}

export interface PurchaseOrderItem {
  productId: string
  
  // Quantities
  quantityOrdered: number
  quantityReceived: number
  quantityPending: number // quantityOrdered - quantityReceived
  
  // Pricing
  unitCost: number
  totalCost: number // quantityOrdered * unitCost
  
  // Product Details (for reference)
  productName?: string
  productSku?: string
  unitOfMeasure?: string
  
  // Delivery
  expectedDate?: Date
  receivedDate?: Date
  
  // Quality Control
  isDefective?: boolean
  defectiveQuantity?: number
  notes?: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string // Generated PO number (e.g., PO-2024-001)
  
  // Supplier Reference
  supplierId: string
  supplierName?: string // Denormalized for quick access
  
  // Items
  items: PurchaseOrderItem[]
  
  // Financial Summary
  subtotal: number
  taxAmount?: number
  shippingCost?: number
  totalAmount: number
  currency: string
  
  // Delivery Details
  expectedDeliveryDate: Date
  actualDeliveryDate?: Date
  deliveryAddress?: string
  branchId: string // Which branch is receiving the order
  
  // Status and Workflow
  status: PurchaseOrderStatus
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  
  // Approval Workflow
  requestedBy: string
  approvedBy?: string
  approvedAt?: Date
  rejectedBy?: string
  rejectedAt?: Date
  rejectionReason?: string
  
  // Communication
  sentToSupplierAt?: Date
  acknowledgedBySupplierAt?: Date
  supplierNotes?: string
  
  // Receiving
  receivingStartedAt?: Date
  receivingCompletedAt?: Date
  receivedBy?: string
  
  // Terms and Conditions
  paymentTerms: PaymentTerms
  customPaymentTerms?: string
  warrantyTerms?: string
  
  // Attachments
  attachments?: {
    fileName: string
    fileUrl: string
    fileType: string
    uploadedAt: Date
  }[]
  
  // Internal Notes
  internalNotes?: string
  publicNotes?: string // Notes visible to supplier
  
  // Audit Fields
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface SupplierStatement {
  id: string
  supplierId: string
  
  // Statement Period
  periodStart: Date
  periodEnd: Date
  
  // Financial Summary
  totalOrders: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  
  // Order Summary
  orders: {
    purchaseOrderId: string
    poNumber: string
    orderDate: Date
    dueDate?: Date
    totalAmount: number
    paidAmount: number
    status: string
  }[]
  
  // Statement Metadata
  generatedAt: Date
  generatedBy: string
  userId: string
}

// API Request/Response Types
export interface CreateSupplierRequest {
  name: string
  contactPerson?: string
  email?: string
  phone: string
  address: string
  paymentTerms?: PaymentTerms
  categories: string[]
  notes?: string
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: string
  status?: SupplierStatus
}

export interface CreatePurchaseOrderRequest {
  supplierId: string
  branchId: string
  items: {
    productId: string
    quantityOrdered: number
    unitCost: number
    notes?: string
  }[]
  expectedDeliveryDate: Date
  paymentTerms?: PaymentTerms
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  deliveryAddress?: string
  internalNotes?: string
  publicNotes?: string
}

export interface ApprovePurchaseOrderRequest {
  purchaseOrderId: string
  approved: boolean
  rejectionReason?: string
  notes?: string
}

export interface SendPurchaseOrderRequest {
  purchaseOrderId: string
  sentToSupplierAt: Date
  supplierNotes?: string
}

export interface ReceivePurchaseOrderRequest {
  purchaseOrderId: string
  items: {
    productId: string
    quantityReceived: number
    isDefective?: boolean
    defectiveQuantity?: number
    notes?: string
  }[]
  receivedBy: string
  notes?: string
  partialReceiving?: boolean // If true, marks as PARTIALLY_RECEIVED
}

export interface UpdateSupplierPerformanceRequest {
  supplierId: string
  onTimeDelivery?: boolean
  deliveryDays?: number
  qualityRating?: number
  serviceRating?: number
  pricingRating?: number
}

// Dashboard and Analytics Types
export interface SupplierDashboard {
  totalSuppliers: number
  activeSuppliers: number
  topSuppliers: {
    supplierId: string
    supplierName: string
    totalOrders: number
    totalAmount: number
    onTimeDeliveryRate: number
  }[]
  recentOrders: PurchaseOrder[]
  pendingApprovals: number
  overdueDeliveries: number
}

export interface PurchaseOrderDashboard {
  totalOrders: number
  pendingOrders: number
  overdueOrders: number
  monthlySpend: number
  topCategories: {
    category: string
    totalAmount: number
    orderCount: number
  }[]
  recentActivity: {
    type: 'CREATED' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'CANCELLED'
    purchaseOrderId: string
    poNumber: string
    supplierName: string
    timestamp: Date
  }[]
}

export interface SupplierPerformanceReport {
  supplierId: string
  supplierName: string
  
  // Performance Metrics
  onTimeDeliveryRate: number
  averageDeliveryDays: number
  orderFulfillmentRate: number
  qualityScore: number
  
  // Order Statistics
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  totalSpend: number
  
  // Recent Performance
  lastOrderDate?: Date
  recentIssues: {
    orderId: string
    issueType: 'DELAY' | 'QUALITY' | 'QUANTITY' | 'OTHER'
    description: string
    reportedAt: Date
  }[]
}

// Filter and Search Types
export interface SupplierFilters {
  status?: SupplierStatus[]
  categories?: string[]
  onTimeDeliveryRate?: {
    min: number
    max: number
  }
  lastOrderDate?: {
    from: Date
    to: Date
  }
  searchTerm?: string
}

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus[]
  supplierId?: string
  branchId?: string
  priority?: ('LOW' | 'NORMAL' | 'HIGH' | 'URGENT')[]
  dateRange?: {
    from: Date
    to: Date
  }
  amountRange?: {
    min: number
    max: number
  }
  searchTerm?: string // Search in PO number, supplier name, etc.
}

// Integration Types (for connecting with existing modules)
export interface SupplierProductLink {
  id: string
  supplierId: string
  productId: string
  
  // Pricing
  currentUnitCost: number
  lastUnitCost?: number
  minimumOrderQuantity?: number
  
  // Lead Times
  averageLeadTimeDays: number
  lastOrderDate?: Date
  
  // Performance
  orderCount: number
  qualityRating?: number
  
  // Status
  isPreferredSupplier: boolean
  isActive: boolean
  
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

// Export utility types
export type SupplierSortField = 'name' | 'onTimeDeliveryRate' | 'totalOrders' | 'lastOrderDate' | 'createdAt'
export type PurchaseOrderSortField = 'poNumber' | 'supplierName' | 'totalAmount' | 'expectedDeliveryDate' | 'status' | 'createdAt'
export type SortDirection = 'asc' | 'desc'
