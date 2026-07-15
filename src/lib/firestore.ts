import { db } from '@/lib/firebase'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'
import { 
  HeldSale,
  MultiItemSale, 
  SaleItem, 
  SaleCalculations,
  PAYMENT_METHODS 
} from './multi-item-sales-types'
import type { DiscountType, LegacyDiscountType } from './multi-item-sales-types'
import {
  addBackendDebtorPurchase,
  createBackendDebtor,
  createBackendExpense,
  createBackendProduct,
  createBackendSale,
  createBackendSaleAndReturn,
  deleteBackendDebtor,
  deleteBackendExpense,
  deleteBackendProduct,
  deleteBackendSale,
  refundBackendSale,
  getBackendDebtors,
  updateBackendDebtor,
  getBackendExpenses,
  getBackendMultiItemSales,
  getBackendProduct,
  getBackendProducts,
  getBackendSettings,
  getBackendSingleItemSales,
  isBackendAvailable,
  recordBackendDebtorPayment,
  updateBackendExpense,
  updateBackendProduct,
  updateBackendSale,
  updateBackendSettings,
  updateBackendUserProfile
} from '@/lib/backend-business-api'

export interface ProductImage {
  url: string
  fileId: string
  name: string
  id?: string
  isPrimary?: boolean
  storagePath?: string
  contentType?: string
  size?: number
}

function normalizeProductImages(images: unknown, legacyImageUrl?: string | null): ProductImage[] {
  const rows = Array.isArray(images) ? images : []
  const normalized = rows
    .map((image, index): ProductImage | null => {
      if (typeof image === 'string') {
        return {
          url: image,
          fileId: image,
          name: `product-image-${index + 1}`,
          isPrimary: index === 0
        }
      }

      if (image && typeof image === 'object') {
        const value = image as Partial<ProductImage> & { storage_path?: string }
        if (!value.url) return null

        return {
          url: value.url,
          fileId: value.fileId || value.storagePath || value.storage_path || value.url,
          name: value.name || `product-image-${index + 1}`,
          id: value.id,
          isPrimary: value.isPrimary,
          storagePath: value.storagePath || value.storage_path,
          contentType: value.contentType,
          size: value.size
        }
      }

      return null
    })
    .filter((image): image is ProductImage => Boolean(image))

  if (!normalized.some(image => image.isPrimary) && normalized[0]) {
    normalized[0] = { ...normalized[0], isPrimary: true }
  }

  if (normalized.length === 0 && legacyImageUrl) {
    return [{
      url: legacyImageUrl,
      fileId: legacyImageUrl,
      name: 'legacy-image',
      isPrimary: true
    }]
  }

  return normalized
}

// Enhanced supplier relationship for products
export interface ProductSupplierLink {
  supplierId: string // Reference to suppliers collection
  supplierName: string // Cached name for quick display
  isPrimary: boolean // Is this the preferred/primary supplier
  lastPurchaseDate?: Date
  lastPurchasePrice?: number
  averagePurchasePrice?: number // Calculated from price history
  leadTimeInDays?: number // How many days to deliver
  minimumOrderQuantity?: number
  priceValidUntil?: Date // When the quoted price expires
}

// Purchase price history tracking
export interface ProductPriceHistory {
  id: string
  productId: string
  supplierId: string
  purchasePrice: number
  quantity: number
  purchaseOrderId?: string // Reference to purchase order if applicable
  effectiveDate: Date
  expiryDate?: Date // When this price expires
  currency: string
  notes?: string
  userId: string
  createdAt?: Date
}

// Real-time inventory data integration
export interface ProductInventoryData {
  totalStock: number // Sum across all branches
  availableStock: number // Available for sale
  reservedStock: number // Reserved for orders
  inTransitStock: number // Being transferred between branches
  branchStock: { [branchId: string]: { stock: number; available: number; reserved: number } }
  expiryAlerts: Array<{
    branchId: string
    quantity: number
    expiryDate: Date
    daysUntilExpiry: number
  }>
  lowStockAlerts: Array<{
    branchId: string
    currentStock: number
    minStockLevel: number
  }>
  lastMovementDate?: Date
  lastMovementType?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  imageUrl?: string | null // Keep for backward compatibility
  images?: ProductImage[] // New multiple images field
  costPrice: number
  sellingPrice: number
  quantity: number
  minStockLevel: number
  category: string
  barcode?: string | null
  sku?: string | null
  supplier?: string // LEGACY: Keep for backward compatibility
  unitOfMeasure?: string
  expiryDate?: number | null
  batchNumber?: string | null
  location?: string
  tags?: string
  isPerishable?: boolean
  lowStockAlertEnabled?: boolean
  isActive: boolean
  branchId?: string | null
  userId: string
  createdAt?: Date
  updatedAt?: Date
  
  // NEW ENHANCED FIELDS - Supplier Integration
  supplierLinks?: ProductSupplierLink[] // Multiple suppliers with relationships
  preferredSupplierId?: string | null // Quick reference to primary supplier
  lastSupplierId?: string | null // Last supplier used for purchase
  
  // NEW ENHANCED FIELDS - Inventory Integration (computed/cached fields)
  realTimeInventory?: ProductInventoryData // Real-time inventory data from inventory module
  
  // NEW ENHANCED FIELDS - Purchase History
  lastPurchasePrice?: number | null // Cache of last purchase price
  averagePurchasePrice?: number | null // Cache of average purchase price
  lastPurchaseDate?: Date | null // Cache of last purchase date
}

export type PaymentMethod = 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CARD' | 'CREDIT' | 'CHEQUE' | 'OTHER'
export type SaleType = 'PRODUCT' | 'SERVICE' | 'OTHER'

export interface Sale {
  id: string
  saleNumber?: string // Human-readable backend sale number (e.g. "SALE-000042"); populated by the API
  profit?: number | null // Backend-stored profit (totalAmount - totalCost, cost captured at sale time)
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
  paymentMethod: PaymentMethod
  customerName?: string | null
  customerPhone?: string | null
  notes?: string | null
  isDeleted?: boolean
  isRefunded?: boolean
  deletedAt?: number | null
  lastModifiedAt?: number
  branchId?: string | null
  userId: string
  createdByName?: string | null // Name of the cashier who made the sale (for receipts)
}

export type ExpenseCategory =
  | 'TRANSPORT' | 'FOOD' | 'UTILITIES' | 'SUPPLIES' | 'RENT' | 'MARKETING' | 'MAINTENANCE'
  | 'INSURANCE' | 'TAXES' | 'SALARIES' | 'INVENTORY' | 'EQUIPMENT' | 'COMMUNICATIONS'
  | 'PROFESSIONAL_SERVICES' | 'TRAVEL' | 'ENTERTAINMENT' | 'TRAINING' | 'OTHER'

export interface Expense {
  id: string
  amount: number
  category: ExpenseCategory
  description: string
  receiptNumber?: string | null
  notes?: string | null
  timestamp: number
  date: string
  paymentMethod: PaymentMethod
  isRecurring?: boolean
  recurringPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null
  tags?: string
  location?: string | null
  vendor?: string | null
  isTaxDeductible?: boolean
  isBusinessExpense?: boolean
  approvedBy?: string | null
  attachmentUrl?: string | null
  userId: string
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID'
export type PaymentType = 'FULL' | 'INSTALLMENT' | 'CUSTOM'
export type InstallmentFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'

export interface Debtor {
  id: string
  name: string
  phone: string
  email?: string | null
  address?: string | null
  nationalId?: string | null
  totalCreditLimit: number
  currentDebt: number
  totalPurchases: number
  totalPayments: number
  lastPurchaseDate?: number | null
  lastPaymentDate?: number | null
  creditScore: number
  isActive: boolean
  notes?: string | null
  paymentStatus: PaymentStatus
  /** When the debt was taken (backdatable). */
  debtDate?: number | null
  dueDate?: number | null
  originalDebtAmount: number
  preferredPaymentType: PaymentType
  installmentAmount?: number | null
  installmentFrequency?: InstallmentFrequency | null
  nextInstallmentDate?: number | null
  overdueAmount: number
  lastContactDate?: number | null
  paymentReminders: number
  gracePeriodDays: number
  userId: string
  createdAt?: Date
  updatedAt?: Date
}

export interface DebtorPayment {
  id: string
  debtorId: string
  amount: number
  paymentMethod: PaymentMethod
  timestamp: number
  receiptNumber?: string | null
  reference?: string | null
  notes?: string | null
  recordedBy: string
  isPartialPayment?: boolean
  outstandingBalance: number
  userId: string
}

export interface DailySummary {
  date: string
  totalSales: number
  totalItemsSold: number
  totalProfit: number
  totalCost: number
  numberOfTransactions: number
  topSellingProductId?: string | null
  topSellingProductName?: string | null
  topSellingProductQuantity?: number
  cashSales?: number
  mpesaSales?: number
  bankTransferSales?: number
  cardSales?: number
  creditSales?: number
  userId: string
}

export interface UserProfile {
  uid: string
  fullName: string
  email: string
  phoneNumber: string
  profileImageUrl: string
  createdAt?: number
  lastUpdated?: number
}

export interface BusinessProfile {
  uid: string
  businessName: string
  businessType: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  currency: string
  taxRate: number
  lowStockThreshold: number
  // Company Profile settings
  companyLegalName?: string
  companyRegistrationNumber?: string
  companyLogoUrl?: string
  // Receipt Template settings
  receiptHeaderText?: string
  receiptFooterText?: string
  receiptThankYouMessage?: string
  receiptLogoUrl?: string
  createdAt?: number
  lastUpdated?: number
}

export interface NotificationSettings {
  uid: string
  emailNotifications: boolean
  smsNotifications: boolean
  appNotifications: boolean
  lowStockAlerts: boolean
  salesAlerts: boolean
  debtorPaymentReminders: boolean
  createdAt?: number
  lastUpdated?: number
}

// Device connection types
export type DeviceConnectionType = 'BLUETOOTH' | 'USB' | 'NETWORK' | 'WIRELESS'
export type DeviceStatus = 'CONNECTED' | 'DISCONNECTED' | 'PAIRING' | 'ERROR' | 'IDLE'
export type DeviceType = 'POS' | 'TABLET' | 'PRINTER' | 'SCANNER' | 'CASH_DRAWER' | 'SCALE' | 'DISPLAY' | 'TERMINAL'
export type PrinterType = 'THERMAL' | 'INKJET' | 'LASER' | 'LABEL' | 'RECEIPT' | 'PHOTO'

export interface PairedDevice {
  id: string
  name: string
  type: DeviceType
  status: DeviceStatus
  connectionType: DeviceConnectionType
  lastConnected?: number
  lastSeen?: number
  macAddress?: string
  ipAddress?: string
  port?: number
  model?: string
  manufacturer?: string
  serialNumber?: string
  firmwareVersion?: string
  batteryLevel?: number
  isOnline?: boolean
  capabilities?: string[]
  settings?: Record<string, any>
  errorMessage?: string
  lastError?: number
}

export interface PrinterDevice extends PairedDevice {
  type: 'PRINTER'
  printerType: PrinterType
  paperSize?: string
  printQuality?: 'DRAFT' | 'NORMAL' | 'HIGH'
  colorSupport?: boolean
  duplexSupport?: boolean
  maxPaperWidth?: number
  supportedFormats?: string[]
  isDefault?: boolean
  testPrintStatus?: 'SUCCESS' | 'FAILED' | 'PENDING' | null
  lastTestPrint?: number
}

export interface ScannerDevice extends PairedDevice {
  type: 'SCANNER'
  scanTypes?: ('BARCODE' | 'QR_CODE' | 'DOCUMENT' | 'PHOTO')[]
  maxResolution?: number
  colorDepth?: number
  scanFormats?: string[]
  autoFeedSupport?: boolean
}

export interface DeviceSettings {
  uid: string
  pairedDevices: PairedDevice[]
  printerSettings: {
    defaultPrinterId?: string
    receiptPrinterId?: string
    labelPrinterId?: string
    invoicePrinterId?: string
    barcodePrinterId?: string
    autoPrintReceipts?: boolean
    printCopies?: number
    paperSize?: string
    printQuality?: 'DRAFT' | 'NORMAL' | 'HIGH'
    headerLogo?: boolean
    footerText?: boolean
    printBarcodes?: boolean
  }
  scannerSettings: {
    defaultScannerId?: string
    barcodeScannerId?: string
    documentScannerId?: string
    autoScanEnabled?: boolean
    scanQuality?: 'LOW' | 'MEDIUM' | 'HIGH'
    scanFormat?: 'PDF' | 'JPEG' | 'PNG'
    ocrEnabled?: boolean
  }
  barcodeSettings: {
    format: 'EAN' | 'UPC' | 'QR' | 'CODE128'
    autoGenerate: boolean
    printOnLabels?: boolean
    includePriceInBarcode?: boolean
  }
  bluetoothEnabled: boolean
  wifiEnabled?: boolean
  usbEnabled?: boolean
  networkDiscoveryEnabled?: boolean
  autoConnectDevices?: boolean
  deviceTimeout?: number // in seconds
  lastDeviceScan?: number
  createdAt?: number
  lastUpdated?: number
}

export interface DataSyncSettings {
  uid: string
  offlineSyncEnabled: boolean
  autoSyncInterval: number // minutes
  lastSyncTimestamp?: number
  backupSettings: {
    autoBackup: boolean
    backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    cloudStorage: 'GOOGLE_DRIVE' | 'DROPBOX' | 'LOCAL'
  }
  createdAt?: number
  lastUpdated?: number
}

const DEFAULT_BACKUP_SETTINGS: DataSyncSettings['backupSettings'] = {
  autoBackup: false,
  backupFrequency: 'WEEKLY',
  cloudStorage: 'GOOGLE_DRIVE'
}

function normalizeDataSyncSettings(userId: string, settings: Partial<DataSyncSettings>): DataSyncSettings {
  return {
    uid: userId,
    offlineSyncEnabled: settings.offlineSyncEnabled ?? false,
    autoSyncInterval: settings.autoSyncInterval ?? 30,
    lastSyncTimestamp: settings.lastSyncTimestamp,
    backupSettings: {
      ...DEFAULT_BACKUP_SETTINGS,
      ...(settings.backupSettings || {})
    },
    createdAt: settings.createdAt,
    lastUpdated: settings.lastUpdated
  }
}

// Staff Management Types
export type StaffRole = 'cashier' | 'manager' | 'owner'
export type StaffStatus = 'active' | 'inactive' | 'suspended'

export interface Staff {
  id: string
  authId: string // Firebase Auth UID
  fullName: string
  email: string
  phone: string
  role: StaffRole
  branchIds: string[] // Array of branch IDs this staff can access
  status: StaffStatus
  lastLogin?: number
  twoFactorEnabled: boolean
  twoFactorSecret?: string // Store encrypted 2FA secret
  permissions: string[] // Computed based on role
  // Profile information
  profileImageUrl?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  employeeId?: string // Custom employee ID
  hireDate?: number
  salary?: number
  // Audit fields
  userId: string // Owner/company who created this staff
  createdBy: string
  createdAt?: number
  updatedAt?: number
}

export interface StaffActivityLog {
  id: string
  staffId: string
  staffName: string
  action: string
  description: string
  metadata: {
    branchId?: string
    branchName?: string
    productId?: string
    productName?: string
    orderId?: string
    transferId?: string
    amount?: number
    ipAddress?: string
    userAgent?: string
    [key: string]: any
  }
  severity: 'info' | 'warning' | 'error' | 'critical'
  timestamp: number
  userId: string // Owner/company
}

export async function getProducts(userId: string, branchId?: string): Promise<Product[]> {
  if (isBackendAvailable()) {
    try {
      return await getBackendProducts(branchId)
    } catch (error) {
      throw error
    }
  }

  const q = query(
    collection(db, 'products'),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const items = snap.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      images: normalizeProductImages(data.images, data.imageUrl || null)
    } as Product
  })
  // Backward compatibility: include docs with either isActive or active not set to false
  return items.filter(p => {
    const isActive = p.isActive
    const active = (p as Product & { active?: boolean }).active
    if (typeof isActive === 'boolean') return isActive
    if (typeof active === 'boolean') return active
    return true
  }).filter(p => !branchId || p.branchId === branchId) as Product[]
}

export async function createProduct(
  userId: string,
  data: Partial<Product>,
  options?: { idempotencyKey?: string }
): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await createBackendProduct(data, undefined, options)
      return
    } catch (error) {
      throw error
    }
  }

  const id = data.id || crypto.randomUUID()
  const product: Product = {
    id,
    name: data.name || '',
    description: data.description || '',
    imageUrl: data.imageUrl ?? null,
    images: normalizeProductImages(data.images, data.imageUrl ?? null),
    costPrice: Number(data.costPrice || 0),
    sellingPrice: Number(data.sellingPrice || 0),
    quantity: Number(data.quantity || 0),
    minStockLevel: Number(data.minStockLevel || 0),
    category: data.category || 'General',
    barcode: data.barcode ?? null,
    sku: data.sku ?? null,
    supplier: data.supplier || '', // LEGACY: Keep for backward compatibility
    unitOfMeasure: data.unitOfMeasure || 'pcs',
    expiryDate: data.expiryDate ?? null,
    batchNumber: data.batchNumber ?? null,
    location: data.location || '',
    tags: data.tags || '',
    isPerishable: Boolean(data.isPerishable) || false,
    lowStockAlertEnabled: data.lowStockAlertEnabled ?? true,
    isActive: true,
    branchId: data.branchId ?? null,
    userId,
    
    // NEW ENHANCED FIELDS - Initialize with empty/null values
    supplierLinks: data.supplierLinks || [],
    preferredSupplierId: data.preferredSupplierId ?? null,
    lastSupplierId: data.lastSupplierId ?? null,
    lastPurchasePrice: data.lastPurchasePrice ?? null,
    averagePurchasePrice: data.averagePurchasePrice ?? null,
    lastPurchaseDate: data.lastPurchaseDate ?? null
  }
  
  // Clean the product data before saving to Firestore
  const cleanedProduct = cleanFirestoreData({ ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  await setDoc(doc(db, 'products', id), cleanedProduct)
}

// Helper function to remove undefined values from objects before saving to Firestore
function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const cleaned = {} as T
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key as keyof T] = value
    }
  }
  return cleaned
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await updateBackendProduct(productId, data)
      return
    } catch (error) {
      throw error
    }
  }

  // Clean the data to remove undefined values (Firestore doesn't allow undefined)
  const cleanedData = cleanFirestoreData({
    ...data,
    ...(data.images ? { images: normalizeProductImages(data.images, data.imageUrl ?? null) } : {}),
    updatedAt: serverTimestamp()
  })
  
  // Remove id field if present as it shouldn't be updated
  delete (cleanedData as { id?: string }).id
  
  await updateDoc(doc(db, 'products', productId), cleanedData)
}

export async function getProduct(productId: string): Promise<Product | null> {
  if (isBackendAvailable()) {
    try {
      return await getBackendProduct(productId)
    } catch (error) {
      throw error
    }
  }

  const snap = await getDoc(doc(db, 'products', productId))
  if (snap.exists()) {
    const data = snap.data()
    return {
      id: snap.id,
      ...data,
      images: normalizeProductImages(data.images, data.imageUrl || null)
    } as Product
  }
  return null
}

export async function softDeleteProduct(productId: string): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await deleteBackendProduct(productId)
      return
    } catch (error) {
      throw error
    }
  }

  const updateData = cleanFirestoreData({ isActive: false, active: false, updatedAt: serverTimestamp() })
  await updateDoc(doc(db, 'products', productId), updateData)
}

export async function getSales(userId: string, max: number = 2000, branchId?: string): Promise<Sale[]> {
  if (isBackendAvailable()) {
    try {
      return (await getBackendSingleItemSales(branchId)).slice(0, max)
    } catch (error) {
      throw error
    }
  }

  const q = query(
    collection(db, 'sales'),
    where('userId', '==', userId),
    limit(max)
  )
  const snap = await getDocs(q)
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale))
  
  // Filter out explicitly deleted sales (isDeleted === true) but keep sales without the field
  const filteredList = list.filter(sale => sale.isDeleted !== true)
  
  return filteredList
    .filter(sale => !branchId || sale.branchId === branchId)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

export async function createSale(userId: string, data: Partial<Sale>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await createBackendSale(data)
      return
    } catch (error) {
      throw error
    }
  }

  const id = data.id || crypto.randomUUID()
  const sale: Sale = {
    id,
    productId: data.productId ?? null,
    productName: data.productName || '',
    saleType: (data.saleType || 'PRODUCT') as SaleType,
    serviceDescription: data.serviceDescription ?? null,
    quantitySold: Number(data.quantitySold || 1),
    unitPrice: Number(data.unitPrice || 0),
    originalPrice: data.originalPrice ?? null,
    isPriceOverridden: Boolean(data.isPriceOverridden) || false,
    totalAmount: Number(data.totalAmount || 0),
    costPrice: Number(data.costPrice || 0),
    timestamp: data.timestamp || Date.now(),
    paymentMethod: (data.paymentMethod || 'CASH') as PaymentMethod,
    customerName: data.customerName || null,
    customerPhone: data.customerPhone || null,
    notes: data.notes || null,
    isDeleted: false,
    deletedAt: null,
    lastModifiedAt: Date.now(),
    branchId: data.branchId ?? null,
    userId
  }
  await setDoc(doc(db, 'sales', id), { ...sale, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

  // If productId present, decrement inventory quantity
  if (sale.productId) {
    const ref = doc(db, 'products', sale.productId)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const current = snap.data() as Product
      const newQty = Math.max(0, Number(current.quantity || 0) - sale.quantitySold)
      await updateDoc(ref, { quantity: newQty, updatedAt: serverTimestamp() })
    }
  }
}

export async function getSale(saleId: string): Promise<Sale | null> {
  const snap = await getDoc(doc(db, 'sales', saleId))
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Sale
  }
  return null
}

export async function updateSale(saleId: string, data: Partial<Sale>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await updateBackendSale(saleId, data)
      return
    } catch (error) {
      throw error
    }
  }

  const updateData = {
    ...data,
    lastModifiedAt: Date.now(),
    updatedAt: serverTimestamp()
  }
  // Remove id field if present as it shouldn't be updated
  delete (updateData as { id?: string }).id
  await updateDoc(doc(db, 'sales', saleId), updateData)
}

export async function deleteSale(saleId: string): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await deleteBackendSale(saleId)
      return
    } catch (error) {
      throw error
    }
  }

  // For sales, we might want to soft delete to preserve business records
  await updateDoc(doc(db, 'sales', saleId), { 
    isDeleted: true, 
    deletedAt: Date.now(),
    updatedAt: serverTimestamp() 
  })
}

/**
 * Refund a full sale through the backend: restocks inventory, reverses any debtor
 * balance, and records the refund for reporting/audit. Returns the refund record.
 */
export async function refundSale(saleId: string, reason?: string) {
  return refundBackendSale(saleId, reason)
}

export async function getDebtors(userId: string, branchId?: string): Promise<Debtor[]> {
  if (isBackendAvailable()) {
    try {
      return await getBackendDebtors(branchId)
    } catch (error) {
      throw error
    }
  }

  const q = query(
    collection(db, 'debtors'),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as Debtor))
  const list = raw.filter(d => {
    const isActive = d.isActive
    const active = (d as Debtor & { active?: boolean }).active
    if (typeof isActive === 'boolean') return isActive
    if (typeof active === 'boolean') return active
    return true
  }) as Debtor[]
  return list
    .filter(debtor => !branchId || (debtor as Debtor & { branchId?: string | null }).branchId === branchId)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export async function deleteDebtor(debtorId: string): Promise<void> {
  if (isBackendAvailable()) {
    await deleteBackendDebtor(debtorId)
    return
  }
  await deleteDoc(doc(db, 'debtors', debtorId))
}

export async function updateDebtor(debtorId: string, data: Partial<Debtor>): Promise<void> {
  if (isBackendAvailable()) {
    await updateBackendDebtor(debtorId, data)
    return
  }
  await updateDoc(doc(db, 'debtors', debtorId), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

// Add debt to an existing debtor (manual purchase). Backend enforces the credit limit.
export async function addDebtorPurchase(
  debtorId: string,
  amount: number,
  dueDate?: number | null
): Promise<void> {
  if (isBackendAvailable()) {
    await addBackendDebtorPurchase(debtorId, amount, dueDate)
    return
  }
  await updateDoc(doc(db, 'debtors', debtorId), {
    currentDebt: amount,
    updatedAt: serverTimestamp()
  })
}

export async function createDebtor(userId: string, data: Partial<Debtor>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await createBackendDebtor(data)
      return
    } catch (error) {
      throw error
    }
  }

  const id = data.id || crypto.randomUUID()
  const debtor: Debtor = {
    id,
    name: data.name || '',
    phone: data.phone || '',
    email: data.email ?? null,
    address: data.address ?? null,
    nationalId: data.nationalId ?? null,
    totalCreditLimit: Number(data.totalCreditLimit || 0),
    currentDebt: Number(data.currentDebt || 0),
    totalPurchases: 0,
    totalPayments: 0,
    lastPurchaseDate: null,
    lastPaymentDate: null,
    creditScore: 100,
    isActive: true,
    notes: data.notes ?? null,
    paymentStatus: 'UNPAID',
    dueDate: null,
    originalDebtAmount: Number(data.originalDebtAmount || 0),
    preferredPaymentType: (data.preferredPaymentType || 'FULL') as PaymentType,
    installmentAmount: null,
    installmentFrequency: null,
    nextInstallmentDate: null,
    overdueAmount: 0,
    lastContactDate: null,
    paymentReminders: 0,
    gracePeriodDays: 7,
    userId
  }
  await setDoc(doc(db, 'debtors', id), { ...debtor, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function recordDebtorPayment(userId: string, data: Partial<DebtorPayment>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await recordBackendDebtorPayment(data)
      return
    } catch (error) {
      throw error
    }
  }

  const id = data.id || crypto.randomUUID()
  const payment: DebtorPayment = {
    id,
    debtorId: data.debtorId || '',
    amount: Number(data.amount || 0),
    paymentMethod: (data.paymentMethod || 'CASH') as PaymentMethod,
    timestamp: data.timestamp || Date.now(),
    receiptNumber: data.receiptNumber || null,
    reference: data.reference || null,
    notes: data.notes || null,
    recordedBy: data.recordedBy || userId,
    isPartialPayment: Boolean(data.isPartialPayment) || false,
    outstandingBalance: Number(data.outstandingBalance || 0),
    userId
  }
  await setDoc(doc(db, 'debtor_payments', id), { ...payment, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })

  // Update debtor totals and currentDebt
  const debtorRef = doc(db, 'debtors', payment.debtorId)
  const debtorSnap = await getDoc(debtorRef)
  if (debtorSnap.exists()) {
    const d = debtorSnap.data() as Debtor
    const newPayments = Number(d.totalPayments || 0) + payment.amount
    const newDebt = Math.max(0, Number(d.currentDebt || 0) - payment.amount)
    await updateDoc(debtorRef, {
      totalPayments: newPayments,
      currentDebt: newDebt,
      lastPaymentDate: payment.timestamp,
      paymentStatus: newDebt <= 0 ? 'PAID' : (newDebt < (d.originalDebtAmount || 0) ? 'PARTIAL' : 'UNPAID'),
      updatedAt: serverTimestamp()
    })
  }
}

export async function getExpenses(userId: string, max: number = 200): Promise<Expense[]> {
  if (isBackendAvailable()) {
    try {
      return (await getBackendExpenses()).slice(0, max)
    } catch (error) {
      throw error
    }
  }

  const q = query(
    collection(db, 'expenses'),
    where('userId', '==', userId),
    limit(max)
  )
  const snap = await getDocs(q)
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))
  return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

export async function createExpense(userId: string, data: Partial<Expense>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await createBackendExpense(data)
      return
    } catch (error) {
      throw error
    }
  }

  const id = data.id || crypto.randomUUID()
  const expense: Expense = {
    id,
    amount: Number(data.amount || 0),
    category: (data.category || 'OTHER') as ExpenseCategory,
    description: data.description || '',
    receiptNumber: data.receiptNumber || null,
    notes: data.notes || null,
    timestamp: data.timestamp || Date.now(),
    date: data.date || new Date().toISOString().slice(0, 10),
    paymentMethod: (data.paymentMethod || 'CASH') as PaymentMethod,
    isRecurring: Boolean(data.isRecurring) || false,
    recurringPeriod: data.recurringPeriod || null,
    tags: data.tags || '',
    location: data.location || null,
    vendor: data.vendor || null,
    isTaxDeductible: Boolean(data.isTaxDeductible) || false,
    isBusinessExpense: data.isBusinessExpense ?? true,
    approvedBy: data.approvedBy || null,
    attachmentUrl: data.attachmentUrl || null,
    userId
  }
  await setDoc(doc(db, 'expenses', id), { ...expense, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function getExpense(expenseId: string): Promise<Expense | null> {
  const snap = await getDoc(doc(db, 'expenses', expenseId))
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Expense
  }
  return null
}

export async function updateExpense(expenseId: string, data: Partial<Expense>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await updateBackendExpense(expenseId, data)
      return
    } catch (error) {
      throw error
    }
  }

  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  }
  // Remove id field if present as it shouldn't be updated
  delete (updateData as { id?: string }).id
  await updateDoc(doc(db, 'expenses', expenseId), updateData)
}

export async function deleteExpense(expenseId: string): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await deleteBackendExpense(expenseId)
      return
    } catch (error) {
      throw error
    }
  }

  await deleteDoc(doc(db, 'expenses', expenseId))
}

export async function getDailySummaries(userId: string, max: number = 30): Promise<DailySummary[]> {
  const q = query(
    collection(db, 'daily_summaries'),
    where('userId', '==', userId),
    limit(max)
  )
  const snap = await getDocs(q)
  const list = snap.docs.map(d => d.data() as DailySummary)
  return list.sort((a, b) => (b.date > a.date ? 1 : -1))
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const ref = doc(db, 'users', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ uid: userId, ...snap.data() } as UserProfile) : null
}

export async function upsertUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
  // Persist the editable identity fields to the source-of-truth backend.
  // Wrapped in try/catch so a backend hiccup does not break the Firestore path below.
  try {
    await updateBackendUserProfile({
      fullName: profile.fullName ?? undefined,
      phone: profile.phoneNumber ?? undefined
    })
  } catch (error) {
    console.error('Failed to persist user profile to backend:', error)
  }

  const ref = doc(db, 'users', userId)
  const existing = await getDoc(ref)
  const payload = {
    uid: userId,
    fullName: profile.fullName || '',
    email: profile.email || '',
    phoneNumber: profile.phoneNumber || '',
    profileImageUrl: profile.profileImageUrl || '',
    lastUpdated: Date.now(),
    createdAt: existing.exists() ? (existing.data() as UserProfile).createdAt || Date.now() : Date.now()
  }
  await setDoc(ref, payload)
}

function backendSettingsProfile(userId: string, settings: Record<string, any>): BusinessProfile {
  const businessProfile = settings.businessProfile || {}
  const receiptSettings = settings.receiptSettings || {}

  return {
    uid: userId,
    businessName: businessProfile.businessName ?? '',
    businessType: businessProfile.businessType ?? '',
    businessAddress: businessProfile.businessAddress ?? businessProfile.address ?? '',
    businessPhone: businessProfile.businessPhone ?? businessProfile.phone ?? '',
    businessEmail: businessProfile.businessEmail ?? businessProfile.email ?? '',
    currency: businessProfile.currency ?? 'KES',
    taxRate: Number(businessProfile.taxRate ?? 0),
    lowStockThreshold: Number(businessProfile.lowStockThreshold ?? 5),
    companyLegalName: businessProfile.companyLegalName ?? businessProfile.legalCompanyName ?? '',
    companyRegistrationNumber: businessProfile.companyRegistrationNumber ?? businessProfile.registrationNumber ?? '',
    companyLogoUrl: businessProfile.companyLogoUrl ?? '',
    receiptHeaderText: receiptSettings.receiptHeaderText ?? receiptSettings.headerText ?? '',
    receiptFooterText: receiptSettings.receiptFooterText ?? receiptSettings.footerText ?? '',
    receiptThankYouMessage: receiptSettings.receiptThankYouMessage ?? receiptSettings.thankYouMessage ?? '',
    receiptLogoUrl: receiptSettings.receiptLogoUrl ?? receiptSettings.logoUrl ?? ''
  }
}

function backendBusinessSettingsPayload(profile: Partial<BusinessProfile>) {
  return {
    businessProfile: {
      businessName: profile.businessName ?? '',
      businessType: profile.businessType ?? '',
      businessAddress: profile.businessAddress ?? '',
      businessPhone: profile.businessPhone ?? '',
      businessEmail: profile.businessEmail ?? '',
      currency: profile.currency ?? 'KES',
      taxRate: Number(profile.taxRate ?? 0),
      lowStockThreshold: Number(profile.lowStockThreshold ?? 5),
      companyLegalName: profile.companyLegalName ?? '',
      legalCompanyName: profile.companyLegalName ?? '',
      companyRegistrationNumber: profile.companyRegistrationNumber ?? '',
      registrationNumber: profile.companyRegistrationNumber ?? '',
      companyLogoUrl: profile.companyLogoUrl ?? ''
    },
    receiptSettings: {
      receiptHeaderText: profile.receiptHeaderText ?? '',
      headerText: profile.receiptHeaderText ?? '',
      receiptFooterText: profile.receiptFooterText ?? '',
      footerText: profile.receiptFooterText ?? '',
      receiptThankYouMessage: profile.receiptThankYouMessage ?? '',
      thankYouMessage: profile.receiptThankYouMessage ?? '',
      receiptLogoUrl: profile.receiptLogoUrl ?? '',
      logoUrl: profile.receiptLogoUrl ?? ''
    }
  }
}

export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
  if (isBackendAvailable()) {
    try {
      return backendSettingsProfile(userId, await getBackendSettings())
    } catch (error) {
      throw error
    }
  }

  const ref = doc(db, 'business_profiles', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ uid: userId, ...snap.data() } as BusinessProfile) : null
}

export async function upsertBusinessProfile(userId: string, profile: Partial<BusinessProfile>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await updateBackendSettings(backendBusinessSettingsPayload(profile))
      return
    } catch (error) {
      throw error
    }
  }

  const ref = doc(db, 'business_profiles', userId)
  const existing = await getDoc(ref)
  const existingData: Partial<BusinessProfile> = existing.exists() ? existing.data() as BusinessProfile : {}
  
  const payload: BusinessProfile = {
    uid: userId,
    businessName: profile.businessName ?? '',
    businessType: profile.businessType ?? '',
    businessAddress: profile.businessAddress ?? '',
    businessPhone: profile.businessPhone ?? '',
    businessEmail: profile.businessEmail ?? '',
    currency: profile.currency ?? 'KES',
    taxRate: Number(profile.taxRate ?? 0),
    lowStockThreshold: Number(profile.lowStockThreshold ?? 5),
    companyLegalName: profile.companyLegalName ?? existingData.companyLegalName ?? '',
    companyRegistrationNumber: profile.companyRegistrationNumber ?? existingData.companyRegistrationNumber ?? '',
    companyLogoUrl: profile.companyLogoUrl ?? existingData.companyLogoUrl ?? '',
    receiptHeaderText: profile.receiptHeaderText ?? existingData.receiptHeaderText ?? '',
    receiptFooterText: profile.receiptFooterText ?? existingData.receiptFooterText ?? '',
    receiptThankYouMessage: profile.receiptThankYouMessage ?? existingData.receiptThankYouMessage ?? '',
    receiptLogoUrl: profile.receiptLogoUrl ?? existingData.receiptLogoUrl ?? '',
    lastUpdated: Date.now(),
    createdAt: existing.exists() ? existingData.createdAt || Date.now() : Date.now()
  }
  await setDoc(ref, payload)
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  if (isBackendAvailable()) {
    try {
      const settings = await getBackendSettings()
      return settings.notificationSettings
        ? ({ uid: userId, ...settings.notificationSettings } as NotificationSettings)
        : null
    } catch (error) {
      throw error
    }
  }

  const ref = doc(db, 'notification_settings', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ uid: userId, ...snap.data() } as NotificationSettings) : null
}

export async function upsertNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await updateBackendSettings({ notificationSettings: settings })
      return
    } catch (error) {
      throw error
    }
  }

  const ref = doc(db, 'notification_settings', userId)
  const existing = await getDoc(ref)
  const existingData: Partial<NotificationSettings> = existing.exists() ? existing.data() as NotificationSettings : {}
  
  const payload: NotificationSettings = {
    uid: userId,
    emailNotifications: settings.emailNotifications ?? existingData.emailNotifications ?? true,
    smsNotifications: settings.smsNotifications ?? existingData.smsNotifications ?? false,
    appNotifications: settings.appNotifications ?? existingData.appNotifications ?? true,
    lowStockAlerts: settings.lowStockAlerts ?? existingData.lowStockAlerts ?? true,
    salesAlerts: settings.salesAlerts ?? existingData.salesAlerts ?? false,
    debtorPaymentReminders: settings.debtorPaymentReminders ?? existingData.debtorPaymentReminders ?? true,
    lastUpdated: Date.now(),
    createdAt: existing.exists() ? existingData.createdAt || Date.now() : Date.now()
  }
  await setDoc(ref, payload)
}

export async function getDeviceSettings(userId: string): Promise<DeviceSettings | null> {
  if (isBackendAvailable()) {
    try {
      const settings = await getBackendSettings()
      return settings.deviceSettings
        ? ({ uid: userId, ...settings.deviceSettings } as DeviceSettings)
        : null
    } catch (error) {
      throw error
    }
  }

  const ref = doc(db, 'device_settings', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? ({ uid: userId, ...snap.data() } as DeviceSettings) : null
}

export async function upsertDeviceSettings(userId: string, settings: Partial<DeviceSettings>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await updateBackendSettings({ deviceSettings: settings })
      return
    } catch (error) {
      throw error
    }
  }

  const ref = doc(db, 'device_settings', userId)
  const existing = await getDoc(ref)
  const existingData: Partial<DeviceSettings> = existing.exists() ? existing.data() as DeviceSettings : {}
  
  const payload: DeviceSettings = {
    uid: userId,
    pairedDevices: settings.pairedDevices || existingData.pairedDevices || [],
    printerSettings: settings.printerSettings || existingData.printerSettings || {},
    scannerSettings: settings.scannerSettings || existingData.scannerSettings || {},
    barcodeSettings: settings.barcodeSettings || existingData.barcodeSettings || { format: 'CODE128', autoGenerate: true },
    bluetoothEnabled: settings.bluetoothEnabled ?? existingData.bluetoothEnabled ?? true,
    wifiEnabled: settings.wifiEnabled ?? existingData.wifiEnabled,
    usbEnabled: settings.usbEnabled ?? existingData.usbEnabled,
    networkDiscoveryEnabled: settings.networkDiscoveryEnabled ?? existingData.networkDiscoveryEnabled,
    autoConnectDevices: settings.autoConnectDevices ?? existingData.autoConnectDevices,
    deviceTimeout: settings.deviceTimeout ?? existingData.deviceTimeout,
    lastDeviceScan: settings.lastDeviceScan ?? existingData.lastDeviceScan,
    lastUpdated: Date.now(),
    createdAt: existing.exists() ? existingData.createdAt || Date.now() : Date.now()
  }
  await setDoc(ref, payload)
}

export async function getDataSyncSettings(userId: string): Promise<DataSyncSettings | null> {
  if (isBackendAvailable()) {
    try {
      const settings = await getBackendSettings()
      return settings.syncSettings
        ? normalizeDataSyncSettings(userId, settings.syncSettings)
        : null
    } catch (error) {
      throw error
    }
  }

  const ref = doc(db, 'data_sync_settings', userId)
  const snap = await getDoc(ref)
  return snap.exists() ? normalizeDataSyncSettings(userId, snap.data() as Partial<DataSyncSettings>) : null
}

export async function upsertDataSyncSettings(userId: string, settings: Partial<DataSyncSettings>): Promise<void> {
  if (isBackendAvailable()) {
    try {
      await updateBackendSettings({ syncSettings: settings })
      return
    } catch (error) {
      throw error
    }
  }

  const ref = doc(db, 'data_sync_settings', userId)
  const existing = await getDoc(ref)
  const existingData: Partial<DataSyncSettings> = existing.exists() ? existing.data() as DataSyncSettings : {}
  
  const payload: any = {
    uid: userId,
    offlineSyncEnabled: settings.offlineSyncEnabled ?? existingData.offlineSyncEnabled ?? false,
    autoSyncInterval: settings.autoSyncInterval ?? existingData.autoSyncInterval ?? 30,
    backupSettings: {
      ...DEFAULT_BACKUP_SETTINGS,
      ...(existingData.backupSettings || {}),
      ...(settings.backupSettings || {})
    },
    lastUpdated: Date.now(),
    createdAt: existing.exists() ? existingData.createdAt || Date.now() : Date.now()
  }

  // Only add lastSyncTimestamp if it has a valid value
  const lastSync = settings.lastSyncTimestamp || existingData.lastSyncTimestamp
  if (lastSync !== undefined && lastSync !== null) {
    payload.lastSyncTimestamp = lastSync
  }
  await setDoc(ref, payload)
}

// Staff Role-based Permissions
export const STAFF_PERMISSIONS = {
  cashier: [
    'sales:create',
    'sales:read',
    'settings:basic_access',    // Essential: Can access settings page (needed for logout)
    'settings:account_read',    // Can view/edit account settings 
    'settings:support_read'     // Can access support resources
    // STRICT: Cashiers only have Sales + basic settings (Account & Support)
    // BLOCKED: Business, Devices, Data & Sync, Pricing tabs
  ],
  manager: [
    'dashboard:read',
    'sales:create',
    'sales:read',
    'sales:void',
    'inventory:read',
    'inventory:adjust',
    'products:read',
    'products:create',
    'products:update',
    'customers:read',
    'customers:create',
    'customers:update',
    'transfers:create',
    'transfers:approve',
    'transfers:receive',
    'staff:read',
    'staff:manage_branch',
    'reports:full_read',
    'expenses:read',
    'expenses:create',
    'settings:basic_access',    // Essential: Can access settings page
    'settings:account_read',
    'settings:business_read',
    'settings:devices_read',
    'settings:data_sync_read',
    'settings:pricing_read',
    'settings:support_read'
  ],
  owner: [
    'all:*' // Owner has all permissions
  ]
}

// Staff Management Functions
export async function getStaff(userId: string): Promise<Staff[]> {
  const q = query(
    collection(db, 'staff'),
    where('userId', '==', userId)
  )
  const snap = await getDocs(q)
  const staff = snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff))
  return staff.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))
}

export async function getStaffMember(staffId: string): Promise<Staff | null> {
  const snap = await getDoc(doc(db, 'staff', staffId))
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Staff
  }
  return null
}

export async function getStaffByAuthId(authId: string): Promise<Staff | null> {
  const q = query(
    collection(db, 'staff'),
    where('authId', '==', authId),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.docs.length > 0) {
    const doc = snap.docs[0]
    return { id: doc.id, ...doc.data() } as Staff
  }
  return null
}

export async function getStaffByBranch(userId: string, branchId: string): Promise<Staff[]> {
  const q = query(
    collection(db, 'staff'),
    where('userId', '==', userId),
    where('branchIds', 'array-contains', branchId)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff))
}

export async function createStaff(userId: string, data: Partial<Staff>, authId: string): Promise<void> {
  const id = data.id || crypto.randomUUID()
  const staff: Staff = {
    id,
    authId,
    fullName: data.fullName || '',
    email: data.email || '',
    phone: data.phone || '',
    role: data.role || 'cashier',
    branchIds: data.branchIds || [],
    status: data.status || 'active',
    twoFactorEnabled: data.twoFactorEnabled || false,
    permissions: STAFF_PERMISSIONS[data.role || 'cashier'],
    profileImageUrl: data.profileImageUrl || '',
    emergencyContact: data.emergencyContact,
    employeeId: data.employeeId || '',
    hireDate: data.hireDate || Date.now(),
    salary: data.salary || 0, // Fix: Default to 0 instead of undefined
    userId,
    createdBy: userId
  }
  
  // Clean the staff data to remove any undefined values before saving
  const cleanedStaff = cleanFirestoreData({
    ...staff, 
    createdAt: serverTimestamp(), 
    updatedAt: serverTimestamp() 
  })
  
  await setDoc(doc(db, 'staff', id), cleanedStaff)
}

export async function updateStaff(staffId: string, data: Partial<Staff>): Promise<void> {
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  }
  
  // Update permissions if role changed, but only if permissions weren't explicitly provided
  if (data.role && !data.permissions) {
    updateData.permissions = STAFF_PERMISSIONS[data.role]
  }
  
  // Force update permissions for existing cashiers to new restricted permissions
  if (data.role === 'cashier' || (!data.role && updateData.permissions && updateData.permissions.includes('inventory:read'))) {
    updateData.permissions = STAFF_PERMISSIONS['cashier']
  }
  
  // Remove id field if present as it shouldn't be updated
  delete (updateData as { id?: string }).id
  await updateDoc(doc(db, 'staff', staffId), updateData)
}

export async function updateStaffLastLogin(staffId: string): Promise<void> {
  await updateDoc(doc(db, 'staff', staffId), {
    lastLogin: Date.now(),
    updatedAt: serverTimestamp()
  })
}

export async function deactivateStaff(staffId: string): Promise<void> {
  await updateDoc(doc(db, 'staff', staffId), {
    status: 'inactive',
    updatedAt: serverTimestamp()
  })
}

export async function activateStaff(staffId: string): Promise<void> {
  await updateDoc(doc(db, 'staff', staffId), {
    status: 'active',
    updatedAt: serverTimestamp()
  })
}

// Update all existing staff permissions to new structure
export async function updateAllStaffPermissions(userId: string): Promise<void> {
  try {
    const staff = await getStaff(userId)
    const updates = staff.map(async (staffMember) => {
      if (staffMember.role && STAFF_PERMISSIONS[staffMember.role]) {
        await updateStaff(staffMember.id, {
          permissions: STAFF_PERMISSIONS[staffMember.role]
        })
      }
    })
    await Promise.all(updates)
    console.log(`Updated permissions for ${staff.length} staff members`)
  } catch (error) {
    console.error('Error updating staff permissions:', error)
  }
}

// Staff Activity Logs
export async function createStaffActivityLog(userId: string, data: Partial<StaffActivityLog>): Promise<void> {
  const id = data.id || crypto.randomUUID()
  const log: StaffActivityLog = {
    id,
    staffId: data.staffId || '',
    staffName: data.staffName || '',
    action: data.action || '',
    description: data.description || '',
    metadata: data.metadata || {},
    severity: data.severity || 'info',
    timestamp: data.timestamp || Date.now(),
    userId
  }
  await setDoc(doc(db, 'staff_activity_logs', id), log)
}

export async function getStaffActivityLogs(
  userId: string, 
  filters?: {
    staffId?: string
    branchId?: string
    startDate?: number
    endDate?: number
    severity?: 'info' | 'warning' | 'error' | 'critical'
    action?: string
  },
  limitCount: number = 100
): Promise<StaffActivityLog[]> {
  let q = query(
    collection(db, 'staff_activity_logs'),
    where('userId', '==', userId)
  )
  
  if (filters?.staffId) {
    q = query(q, where('staffId', '==', filters.staffId))
  }
  
  if (filters?.severity) {
    q = query(q, where('severity', '==', filters.severity))
  }
  
  if (filters?.startDate) {
    q = query(q, where('timestamp', '>=', filters.startDate))
  }
  
  if (filters?.endDate) {
    q = query(q, where('timestamp', '<=', filters.endDate))
  }
  
  q = query(q, limit(limitCount))
  
  const snap = await getDocs(q)
  const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as StaffActivityLog))
  return logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

// Permission checking functions
export function hasStaffPermission(staff: Staff | null, permission: string): boolean {
  if (!staff || staff.status !== 'active') return false
  
  // Owners have all permissions
  if (staff.role === 'owner') return true
  
  // Check specific permissions
  return staff.permissions.includes(permission) || staff.permissions.includes('all:*')
}

export function canAccessBranch(staff: Staff | null, branchId: string): boolean {
  if (!staff || staff.status !== 'active') return false
  
  // Owners can access all branches
  if (staff.role === 'owner') return true
  
  // Check if staff is assigned to this branch
  return staff.branchIds.includes(branchId)
}

export function getStaffAccessibleBranches(staff: Staff | null): string[] {
  if (!staff || staff.status !== 'active') return []
  
  // Owners can access all branches (return empty array to indicate all)
  if (staff.role === 'owner') return []
  
  return staff.branchIds
}

// ============================================
// MULTI-ITEM SALES SYSTEM (NEW ENHANCED VERSION)
// ============================================

// Generate unique sale number
function generateSaleNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const timestamp = Date.now().toString().slice(-6)
  return `SALE-${year}${month}${day}-${timestamp}`
}

function generateHeldSaleNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  return `HELD-${timestamp}`
}

function buildSaleItems(transactionId: string, dataItems: Partial<SaleItem>[]): SaleItem[] {
  return dataItems.map((item, index) => {
    const quantity = Number(item.quantity || 1)
    const unitPrice = Number(item.unitPrice || 0)
    const costPrice = Number(item.costPrice || 0)
    const lineTotal = SaleCalculations.calculateLineTotal(quantity, unitPrice)
    const discountType = SaleCalculations.normalizeDiscountType(item.discountType)
    const discount = Number(item.discount || 0)
    const discountAmount = SaleCalculations.calculateLineDiscount(quantity, unitPrice, discount, discountType)
    const lineSubtotal = SaleCalculations.calculateLineSubtotal(quantity, unitPrice, discount, discountType)
    const profit = Number((lineSubtotal - costPrice * quantity).toFixed(2))
    
    return {
      id: item.id || `item_${transactionId}_${index + 1}`,
      productId: item.productId || null,
      productName: item.productName || '',
      saleType: item.saleType || 'PRODUCT',
      serviceDescription: item.serviceDescription || null,
      quantity,
      unitPrice,
      originalPrice: item.originalPrice || null,
      isPriceOverridden: Boolean(item.isPriceOverridden),
      costPrice,
      discount,
      discountType,
      discountAmount,
      lineSubtotal,
      lineTotal,
      profit,
      notes: item.notes || null
    }
  })
}

// Create a new multi-item sale
export async function createMultiItemSale(userId: string, data: {
  items: Partial<SaleItem>[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  paymentMethod: string
  tax?: number
  taxRate?: number
  discount?: number
  discountType?: LegacyDiscountType
  notes?: string
  branchId?: string
}): Promise<string> {
  if (isBackendAvailable()) {
    try {
      return await createBackendSale(data)
    } catch (error) {
      throw error
    }
  }

  const saleId = crypto.randomUUID()
  const timestamp = Date.now()
  
  // Process items and calculate totals
  const items: SaleItem[] = buildSaleItems(saleId, data.items)
  
  // Calculate totals
  const subtotal = SaleCalculations.calculateSubtotal(items)
  const taxAmount = data.taxRate ? SaleCalculations.calculateTax(subtotal, data.taxRate) : (data.tax || 0)
  const discountType = SaleCalculations.normalizeDiscountType(data.discountType)
  const discount = Number(data.discount || 0)
  const discountBase = subtotal + taxAmount
  const discountAmount = Math.min(
    discountBase,
    SaleCalculations.calculateDiscount(discountBase, discount, discountType)
  )
  const totalAmount = SaleCalculations.calculateTotal(subtotal, taxAmount, discountAmount)
  
  const multiItemSale: MultiItemSale = {
    id: saleId,
    saleNumber: generateSaleNumber(),
    items,
    customerName: data.customerName || null,
    customerPhone: data.customerPhone || null,
    customerEmail: data.customerEmail || null,
    paymentMethod: PAYMENT_METHODS.find(pm => pm.name === data.paymentMethod) || PAYMENT_METHODS[0],
    subtotal,
    tax: taxAmount > 0 ? taxAmount : null,
    taxRate: data.taxRate || null,
    discount: discount > 0 ? discount : null,
    discountType,
    discountAmount: discountAmount > 0 ? discountAmount : null,
    totalAmount,
    timestamp,
    date: new Date(timestamp).toISOString().split('T')[0],
    notes: data.notes || null,
    createdBy: null, // TODO: Add staff support
    isDeleted: false,
    deletedAt: null,
    lastModifiedAt: timestamp,
    userId,
    branchId: data.branchId || null,
    isSynced: false,
    lastSyncedAt: 0
  }
  
  await setDoc(doc(db, 'multi_item_sales', saleId), { 
    ...multiItemSale, 
    createdAt: serverTimestamp(), 
    updatedAt: serverTimestamp() 
  })

  // Decrement inventory quantity for each product sold
  for (const item of items) {
    if (item.productId) {
      const productRef = doc(db, 'products', item.productId)
      const productSnap = await getDoc(productRef)
      if (productSnap.exists()) {
        const currentProduct = productSnap.data() as Product
        const newQty = Math.max(0, Number(currentProduct.quantity || 0) - item.quantity)
        await updateDoc(productRef, { quantity: newQty, updatedAt: serverTimestamp() })
      }
    }
  }
  
  return saleId
}

export async function createMultiItemSaleAndReturn(userId: string, data: {
  items: Partial<SaleItem>[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  paymentMethod: string
  tax?: number
  taxRate?: number
  discount?: number
  discountType?: LegacyDiscountType
  notes?: string
  branchId?: string
}): Promise<MultiItemSale> {
  if (isBackendAvailable()) {
    try {
      return await createBackendSaleAndReturn(data)
    } catch (error) {
      throw error
    }
  }

  const saleId = await createMultiItemSale(userId, data)
  const timestamp = Date.now()
  const items = buildSaleItems(saleId, data.items)
  const subtotal = SaleCalculations.calculateSubtotal(items)
  const taxAmount = data.taxRate ? SaleCalculations.calculateTax(subtotal, data.taxRate) : Number(data.tax || 0)
  const discountType = SaleCalculations.normalizeDiscountType(data.discountType)
  const discount = Number(data.discount || 0)
  const discountBase = subtotal + taxAmount
  const discountAmount = Math.min(
    discountBase,
    SaleCalculations.calculateDiscount(discountBase, discount, discountType)
  )

  return {
    id: saleId,
    saleNumber: generateSaleNumber(),
    items,
    customerName: data.customerName || null,
    customerPhone: data.customerPhone || null,
    customerEmail: data.customerEmail || null,
    paymentMethod: PAYMENT_METHODS.find(pm => pm.name === data.paymentMethod) || PAYMENT_METHODS[0],
    subtotal,
    tax: taxAmount > 0 ? taxAmount : null,
    taxRate: data.taxRate || null,
    discount: discount > 0 ? discount : null,
    discountType,
    discountAmount: discountAmount > 0 ? discountAmount : null,
    totalAmount: SaleCalculations.calculateTotal(subtotal, taxAmount, discountAmount),
    timestamp,
    date: new Date(timestamp).toISOString().split('T')[0],
    notes: data.notes || null,
    createdBy: null,
    isDeleted: false,
    deletedAt: null,
    lastModifiedAt: timestamp,
    userId,
    branchId: data.branchId || null,
    isSynced: false,
    lastSyncedAt: 0
  }
}

// Get multi-item sales
export async function getMultiItemSales(userId: string, max: number = 2000, branchId?: string): Promise<MultiItemSale[]> {
  if (isBackendAvailable()) {
    try {
      return (await getBackendMultiItemSales(branchId)).slice(0, max)
    } catch (error) {
      throw error
    }
  }

  const q = query(
    collection(db, 'multi_item_sales'),
    where('userId', '==', userId),
    limit(max)
  )
  const snap = await getDocs(q)
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MultiItemSale))
  
  // Filter out explicitly deleted sales
  const filteredList = list.filter(sale => sale.isDeleted !== true)
  
  return filteredList
    .filter(sale => !branchId || sale.branchId === branchId)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

// Update multi-item sale
export async function updateMultiItemSale(saleId: string, data: Partial<MultiItemSale>): Promise<void> {
  if (isBackendAvailable()) {
    // Sales live in the backend (Mongo). Only customer details / notes are editable server-side.
    await updateBackendSale(saleId, {
      customerName: (data as { customerName?: string }).customerName,
      customerPhone: (data as { customerPhone?: string }).customerPhone,
      notes: (data as { notes?: string }).notes
    } as Partial<Sale>)
    return
  }

  const saleRef = doc(db, 'multi_item_sales', saleId)
  await updateDoc(saleRef, {
    ...data,
    lastModifiedAt: Date.now(),
    updatedAt: serverTimestamp()
  })
}

// Delete multi-item sale
export async function deleteMultiItemSale(saleId: string): Promise<void> {
  if (isBackendAvailable()) {
    // Backend delete restores branch stock and reverses any debtor balance in one transaction.
    await deleteBackendSale(saleId)
    return
  }

  const saleRef = doc(db, 'multi_item_sales', saleId)
  await updateDoc(saleRef, {
    isDeleted: true,
    deletedAt: Date.now(),
    updatedAt: serverTimestamp()
  })
}

// Create or update a database-backed sale draft that can be resumed later.
export async function createHeldSale(userId: string, data: {
  id?: string
  items: Partial<SaleItem>[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  paymentMethod: string
  discount?: number
  discountType?: LegacyDiscountType
  tax?: number
  notes?: string
  branchId?: string
  createdBy?: string | null
}): Promise<string> {
  const heldSaleId = data.id || crypto.randomUUID()
  const timestamp = Date.now()
  const items = buildSaleItems(heldSaleId, data.items)
  const subtotal = SaleCalculations.calculateSubtotal(items)
  const taxAmount = Number(data.tax || 0)
  const discountType = SaleCalculations.normalizeDiscountType(data.discountType)
  const discount = Number(data.discount || 0)
  const discountBase = subtotal + taxAmount
  const discountAmount = Math.min(
    discountBase,
    SaleCalculations.calculateDiscount(discountBase, discount, discountType)
  )
  const totalAmount = Math.max(0, SaleCalculations.calculateTotal(subtotal, taxAmount, discountAmount))

  const heldSale: HeldSale = {
    id: heldSaleId,
    heldNumber: generateHeldSaleNumber(),
    items,
    customerName: data.customerName || null,
    customerPhone: data.customerPhone || null,
    customerEmail: data.customerEmail || null,
    paymentMethod: PAYMENT_METHODS.find(pm => pm.name === data.paymentMethod) || PAYMENT_METHODS[0],
    subtotal,
    tax: taxAmount > 0 ? taxAmount : null,
    discount: discount > 0 ? discount : null,
    discountType,
    discountAmount: discountAmount > 0 ? discountAmount : null,
    totalAmount,
    timestamp,
    lastModifiedAt: timestamp,
    status: 'HELD',
    notes: data.notes || null,
    createdBy: data.createdBy || null,
    completedSaleId: null,
    userId,
    branchId: data.branchId || null,
    isSynced: false,
    lastSyncedAt: 0
  }

  await setDoc(doc(db, 'held_sales', heldSaleId), {
    ...heldSale,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  return heldSaleId
}

export async function getHeldSales(userId: string, max: number = 50): Promise<HeldSale[]> {
  const q = query(
    collection(db, 'held_sales'),
    where('userId', '==', userId),
    limit(max)
  )
  const snap = await getDocs(q)
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HeldSale))

  return list
    .filter(sale => sale.status === 'HELD')
    .sort((a, b) => (b.lastModifiedAt || b.timestamp || 0) - (a.lastModifiedAt || a.timestamp || 0))
}

export async function updateHeldSale(heldSaleId: string, data: Partial<HeldSale>): Promise<void> {
  const updateData = cleanFirestoreData({
    ...data,
    lastModifiedAt: Date.now(),
    updatedAt: serverTimestamp()
  })
  delete (updateData as { id?: string }).id
  await updateDoc(doc(db, 'held_sales', heldSaleId), updateData)
}

export async function deleteHeldSale(heldSaleId: string): Promise<void> {
  await updateHeldSale(heldSaleId, {
    status: 'CANCELLED'
  })
}

export async function completeHeldSale(
  userId: string,
  heldSaleId: string,
  overrides: {
    items?: Partial<SaleItem>[]
    customerName?: string
    customerPhone?: string
    customerEmail?: string
    paymentMethod?: string
    discount?: number
    discountType?: LegacyDiscountType
    tax?: number
    notes?: string
    branchId?: string
  } = {}
): Promise<string> {
  const heldSaleSnap = await getDoc(doc(db, 'held_sales', heldSaleId))
  if (!heldSaleSnap.exists()) {
    throw new Error('Held sale not found')
  }

  const heldSale = { id: heldSaleSnap.id, ...heldSaleSnap.data() } as HeldSale
  const paymentMethod = typeof heldSale.paymentMethod === 'string'
    ? heldSale.paymentMethod
    : heldSale.paymentMethod.name
  const saleId = await createMultiItemSale(userId, {
    items: overrides.items || heldSale.items,
    customerName: overrides.customerName ?? heldSale.customerName ?? undefined,
    customerPhone: overrides.customerPhone ?? heldSale.customerPhone ?? undefined,
    customerEmail: overrides.customerEmail ?? heldSale.customerEmail ?? undefined,
    paymentMethod: overrides.paymentMethod || paymentMethod || 'CASH',
    discount: overrides.discount ?? heldSale.discount ?? undefined,
    discountType: overrides.discountType ?? heldSale.discountType ?? 'fixed',
    tax: overrides.tax ?? heldSale.tax ?? undefined,
    notes: overrides.notes ?? heldSale.notes ?? undefined,
    branchId: overrides.branchId || heldSale.branchId || undefined
  })

  await updateHeldSale(heldSaleId, {
    status: 'COMPLETED',
    completedSaleId: saleId
  })

  return saleId
}

export async function completeHeldSaleAndReturn(
  userId: string,
  heldSaleId: string,
  overrides: {
    items?: Partial<SaleItem>[]
    customerName?: string
    customerPhone?: string
    customerEmail?: string
    paymentMethod?: string
    discount?: number
    discountType?: LegacyDiscountType
    tax?: number
    notes?: string
    branchId?: string
  } = {}
): Promise<MultiItemSale> {
  const heldSaleSnap = await getDoc(doc(db, 'held_sales', heldSaleId))
  if (!heldSaleSnap.exists()) {
    throw new Error('Held sale not found')
  }

  const heldSale = { id: heldSaleSnap.id, ...heldSaleSnap.data() } as HeldSale
  const paymentMethod = typeof heldSale.paymentMethod === 'string'
    ? heldSale.paymentMethod
    : heldSale.paymentMethod.name
  const sale = await createMultiItemSaleAndReturn(userId, {
    items: overrides.items || heldSale.items,
    customerName: overrides.customerName ?? heldSale.customerName ?? undefined,
    customerPhone: overrides.customerPhone ?? heldSale.customerPhone ?? undefined,
    customerEmail: overrides.customerEmail ?? heldSale.customerEmail ?? undefined,
    paymentMethod: overrides.paymentMethod || paymentMethod || 'CASH',
    discount: overrides.discount ?? heldSale.discount ?? undefined,
    discountType: overrides.discountType ?? heldSale.discountType ?? 'fixed',
    tax: overrides.tax ?? heldSale.tax ?? undefined,
    notes: overrides.notes ?? heldSale.notes ?? undefined,
    branchId: overrides.branchId || heldSale.branchId || undefined
  })

  await updateHeldSale(heldSaleId, {
    status: 'COMPLETED',
    completedSaleId: sale.id
  })

  return sale
}


