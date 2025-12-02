// Multi-Item Sales Data Structure Design
// Enhanced sales system to support multiple products/services per transaction

export type SaleType = 'PRODUCT' | 'SERVICE' | 'OTHER'

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
  lineTotal: number // quantity * unitPrice
  profit: number // (unitPrice - costPrice) * quantity
  notes?: string | null // Item-specific notes
}

export interface MultiItemSale {
  id: string // Unique sale transaction ID
  saleNumber: string // Human-readable sale number (e.g., "SALE-2024-001")
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
  discount?: number | null // Discount amount
  discountType?: 'PERCENTAGE' | 'FIXED' | null // Type of discount
  totalAmount: number // Final amount after tax and discount
  
  // Transaction Details
  timestamp: number
  date: string // YYYY-MM-DD format for easy filtering
  notes?: string | null // Sale-level notes
  
  // Tracking and Audit
  createdBy?: string | null // Staff member who created the sale
  isDeleted: boolean
  deletedAt?: number | null
  lastModifiedAt: number
  
  // Firebase/Database sync
  userId: string // Business owner ID
  branchId?: string | null // If multi-branch is supported
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
  
  static calculateSubtotal(items: SaleItem[]): number {
    return Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2))
  }
  
  static calculateTotal(subtotal: number, tax = 0, discount = 0): number {
    return Number((subtotal + tax - discount).toFixed(2))
  }
  
  static calculateTax(subtotal: number, taxRate: number): number {
    return Number((subtotal * (taxRate / 100)).toFixed(2))
  }
  
  static calculateDiscount(subtotal: number, discount: number, discountType: 'PERCENTAGE' | 'FIXED'): number {
    if (discountType === 'PERCENTAGE') {
      return Number((subtotal * (discount / 100)).toFixed(2))
    }
    return Number(discount.toFixed(2))
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
