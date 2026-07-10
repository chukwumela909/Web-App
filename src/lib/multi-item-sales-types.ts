// Multi-Item Sales Data Structure Design
// Enhanced sales system to support multiple products/services per transaction

export type SaleType = 'PRODUCT' | 'SERVICE' | 'OTHER'
export type DiscountType = 'fixed' | 'percentage'
export type LegacyDiscountType = DiscountType | 'FIXED' | 'PERCENTAGE'

export interface SaleItem {
  id: string // Unique ID for this item within the sale
  productId?: string | null // Reference to product (if type is PRODUCT)
  productName: string // Product name or service description
  saleType: SaleType
  serviceDescription?: string | null // Detailed description for services
  quantity: number // Amount sold
  unitPrice: number // Price per unit
  originalPrice?: number | null // Original product price (if overridden)
  isPriceOverridden?: boolean // Flag if price was manually changed
  costPrice: number // Cost price for profit calculation
  discount?: number | null // Original discount value entered for this line
  discountType?: DiscountType | null // Discount value type
  discountAmount?: number | null // Calculated discount amount for this line
  lineSubtotal?: number | null // Gross minus line discount
  lineTotal: number // quantity * unitPrice
  profit: number // line subtotal - cost
  notes?: string | null // Item-specific notes
}

export interface MultiItemSale {
  id: string // Unique sale transaction ID
  saleNumber: string // Human-readable sale number (e.g., "SALE-2024-001")
  profit?: number | null // Backend-stored profit (totalAmount - totalCost, cost captured at sale time)
  items: SaleItem[] // Array of items in this sale
  
  // Customer Information
  customerName?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  
  // Payment Information
  paymentMethod: PaymentMethod
  subtotal: number // Sum of all line totals
  tax?: number | null // Tax amount if applicable
  taxRate?: number | null // Tax rate percentage
  discount?: number | null // Original cart-level discount value
  discountType?: DiscountType | null // Type of discount
  discountAmount?: number | null // Calculated cart-level discount amount
  totalAmount: number // Final amount after tax and discount
  
  // Transaction Details
  timestamp: number
  date: string // YYYY-MM-DD format for easy filtering
  notes?: string | null // Sale-level notes
  
  // Tracking and Audit
  createdBy?: string | null // Staff member who created the sale
  createdByName?: string | null // Name of the cashier who made the sale (for receipts)
  isDeleted: boolean
  isRefunded?: boolean
  deletedAt?: number | null
  lastModifiedAt: number
  
  // Firebase/Database sync
  userId: string // Business owner ID
  branchId?: string | null // If multi-branch is supported
  isSynced: boolean
  lastSyncedAt: number
}

export type HeldSaleStatus = 'HELD' | 'COMPLETED' | 'CANCELLED'

export interface HeldSale {
  id: string
  heldNumber: string
  items: SaleItem[]
  customerName?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  paymentMethod: PaymentMethod
  subtotal: number
  tax?: number | null
  discount?: number | null
  discountType?: DiscountType | null
  discountAmount?: number | null
  totalAmount: number
  timestamp: number
  lastModifiedAt: number
  status: HeldSaleStatus
  notes?: string | null
  createdBy?: string | null
  completedSaleId?: string | null
  userId: string
  branchId?: string | null
  isSynced: boolean
  lastSyncedAt: number
}

export interface PaymentMethod {
  id: string
  name: string
  displayName: string
}

// Predefined payment methods
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'CASH', name: 'CASH', displayName: 'Cash' },
  { id: 'MPESA', name: 'MPESA', displayName: 'M-Pesa' },
  { id: 'BANK_TRANSFER', name: 'BANK_TRANSFER', displayName: 'Bank Transfer' },
  { id: 'CARD', name: 'CARD', displayName: 'Card Payment' },
  { id: 'CREDIT', name: 'CREDIT', displayName: 'Credit Sale' },
  { id: 'CHEQUE', name: 'CHEQUE', displayName: 'Cheque' },
  { id: 'OTHER', name: 'OTHER', displayName: 'Other' }
]

// Helper functions for calculations
export class SaleCalculations {
  static calculateLineTotal(quantity: number, unitPrice: number): number {
    return Number((quantity * unitPrice).toFixed(2))
  }
  
  static calculateProfit(quantity: number, unitPrice: number, costPrice: number): number {
    // Ensure costPrice is valid (not negative)
    const validCostPrice = Math.max(0, costPrice || 0)
    return Number(((unitPrice - validCostPrice) * quantity).toFixed(2))
  }
  
  static normalizeDiscountType(discountType?: LegacyDiscountType | null): DiscountType {
    return String(discountType || 'fixed').toLowerCase() === 'percentage' ? 'percentage' : 'fixed'
  }

  static calculateDiscount(baseAmount: number, discount: number, discountType: LegacyDiscountType): number {
    const amount = Math.max(0, Number(discount || 0))
    if (this.normalizeDiscountType(discountType) === 'percentage') {
      return Number((baseAmount * (amount / 100)).toFixed(2))
    }
    return Number(amount.toFixed(2))
  }

  static calculateLineDiscount(quantity: number, unitPrice: number, discount = 0, discountType: LegacyDiscountType = 'fixed'): number {
    const lineGross = this.calculateLineTotal(quantity, unitPrice)
    const discountAmount = this.calculateDiscount(lineGross, discount, discountType)
    return Number(Math.min(lineGross, Math.max(0, discountAmount)).toFixed(2))
  }

  static calculateLineSubtotal(quantity: number, unitPrice: number, discount = 0, discountType: LegacyDiscountType = 'fixed'): number {
    const lineGross = this.calculateLineTotal(quantity, unitPrice)
    const discountAmount = this.calculateLineDiscount(quantity, unitPrice, discount, discountType)
    return Number(Math.max(0, lineGross - discountAmount).toFixed(2))
  }

  static calculateSubtotal(items: SaleItem[]): number {
    return Number(items.reduce((sum, item) => sum + Number(item.lineSubtotal ?? item.lineTotal ?? 0), 0).toFixed(2))
  }
  
  static calculateTotal(subtotal: number, tax = 0, discount = 0): number {
    return Number((subtotal + tax - discount).toFixed(2))
  }
  
  static calculateTax(subtotal: number, taxRate: number): number {
    return Number((subtotal * (taxRate / 100)).toFixed(2))
  }
  
}

// Sales summary for reporting
export interface SalesSummary {
  totalSales: number
  totalProfit: number
  itemCount: number
  averageOrderValue: number
  topSellingProduct?: string
  profitMargin: number
}

// Migration utility to convert old single-item sales to new multi-item format
export interface LegacySale {
  id: string
  productId?: string | null
  productName: string
  saleType: SaleType
  serviceDescription?: string | null
  quantitySold: number
  unitPrice: number
  originalPrice?: number | null
  isPriceOverridden?: boolean
  totalAmount: number
  costPrice: number
  timestamp: number
  paymentMethod: string
  customerName?: string | null
  customerPhone?: string | null
  notes?: string | null
  isDeleted?: boolean
  userId: string
}

export class SaleMigration {
  static convertLegacyToMultiItem(legacySale: LegacySale): MultiItemSale {
    const saleItem: SaleItem = {
      id: `item_${legacySale.id}_1`,
      productId: legacySale.productId,
      productName: legacySale.productName,
      saleType: legacySale.saleType,
      serviceDescription: legacySale.serviceDescription,
      quantity: legacySale.quantitySold,
      unitPrice: legacySale.unitPrice,
      originalPrice: legacySale.originalPrice,
      isPriceOverridden: legacySale.isPriceOverridden || false,
      costPrice: legacySale.costPrice,
      lineTotal: legacySale.totalAmount,
      profit: SaleCalculations.calculateProfit(legacySale.quantitySold, legacySale.unitPrice, legacySale.costPrice),
      notes: null
    }
    
    return {
      id: legacySale.id,
      saleNumber: `LEGACY-${legacySale.id.slice(-8)}`,
      items: [saleItem],
      customerName: legacySale.customerName,
      customerPhone: legacySale.customerPhone,
      customerEmail: null,
      paymentMethod: PAYMENT_METHODS.find(pm => pm.name === legacySale.paymentMethod) || PAYMENT_METHODS[0],
      subtotal: legacySale.totalAmount,
      tax: null,
      taxRate: null,
      discount: null,
      discountType: null,
      totalAmount: legacySale.totalAmount,
      timestamp: legacySale.timestamp,
      date: new Date(legacySale.timestamp).toISOString().split('T')[0],
      notes: legacySale.notes,
      createdBy: null,
      isDeleted: legacySale.isDeleted || false,
      deletedAt: null,
      lastModifiedAt: legacySale.timestamp,
      userId: legacySale.userId,
      branchId: null,
      isSynced: true,
      lastSyncedAt: Date.now()
    }
  }
}
