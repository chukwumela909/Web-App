'use client'

import { auth } from '@/lib/firebase'
import { isBackendApiError, request, requestText } from '@/lib/backend-api'
import type {
  Debtor,
  DebtorPayment,
  Expense,
  PaymentMethod,
  Product,
  ProductImage,
  Sale
} from '@/lib/firestore'
import type { MultiItemSale, SaleItem } from '@/lib/multi-item-sales-types'
import type { Branch, BranchDashboard, BranchTransfer } from '@/lib/branches-types'
import type {
  PurchaseOrder,
  Supplier,
  SupplierDashboard
} from '@/lib/suppliers-types'

const SELECTED_BRANCH_KEY = 'fahampesa:selectedBranchId'
const MOCK_STRIPE_SESSION_KEY = 'fahampesa:mockStripeSubscription'

type AnyRecord = Record<string, any>

export type BackendPlanType = 'monthly' | 'yearly'
export type BackendSubscriptionStatus = 'pending' | 'active' | 'expired' | 'failed' | 'cancelled'
export type BackendBillingCurrency = 'KSH' | 'USD'

export interface BackendPlanPrice {
  amount: number
  currency: BackendBillingCurrency
}

export interface BackendBillingPlans {
  monthly: {
    kenya: BackendPlanPrice
    other: BackendPlanPrice
  }
  yearly: {
    kenya: BackendPlanPrice
    other: BackendPlanPrice
  }
}

export interface BackendSubscriptionRecord {
  id: string
  businessAccountId?: string | null
  userId?: string | null
  provider?: 'mpesa' | 'stripe' | 'manual' | string
  planType: BackendPlanType
  status: BackendSubscriptionStatus
  amount: number
  currency: BackendBillingCurrency
  checkoutRequestId?: string | null
  merchantRequestId?: string | null
  stripeCheckoutSessionId?: string | null
  transactionId?: string | null
  phoneNumber?: string | null
  startDate?: string | null
  endDate?: string | null
  receiptNumber?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface BackendCurrentSubscription {
  account: {
    planTier?: 'free' | 'paid' | string
    planType?: BackendPlanType | 'manual' | null
    subscriptionStatus?: BackendSubscriptionStatus | 'none' | string
    subscriptionEndsAt?: string | null
    billingRegion?: 'KENYA' | 'OTHER' | string | null
  }
  subscription: BackendSubscriptionRecord | null
}

export interface BackendCheckoutStatus {
  subscriptionId: string
  status: BackendSubscriptionStatus
  transactionId: string | null
  planType: BackendPlanType
  amount: number
  currency: BackendBillingCurrency
}

export interface BackendBillingReceipt {
  receiptNumber?: string | null
  subscriptionId: string
  provider?: string
  planType: BackendPlanType
  amount: number
  currency: BackendBillingCurrency
  transactionId?: string | null
  startDate?: string | null
  endDate?: string | null
  status: BackendSubscriptionStatus
}

export interface BackendMpesaCheckoutResponse {
  provider: 'mpesa'
  subscription: BackendSubscriptionRecord
  checkout: {
    checkoutRequestId: string
    merchantRequestId: string
    responseCode?: string
    responseDescription?: string
    customerMessage?: string
  }
}

export interface BackendStripeCheckoutResponse {
  provider: 'stripe'
  subscription: BackendSubscriptionRecord
  checkout: {
    sessionId: string
    url: string | null
  }
}

export interface BackendAdminPaymentEvent {
  id: string
  provider: 'mpesa' | 'stripe' | 'manual' | string
  eventId?: string | null
  businessAccountId?: string | null
  subscriptionId?: string | null
  eventType: string
  rawPayload?: unknown
  processingStatus: 'received' | 'processed' | 'failed' | 'ignored' | string
  errorMessage?: string | null
  processedAt?: string | null
  createdAt?: string | null
}

export function isBackendAvailable() {
  return Boolean(auth.currentUser)
}

export function shouldUseFirebaseFallback(error: unknown) {
  return !isBackendApiError(error) || error.status >= 500
}

async function currentUser() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No authenticated Firebase user is available for backend API calls.')
  }
  return user
}

async function api<T>(path: string, options: RequestInit = {}) {
  return request<T>(path, { ...options, user: await currentUser() })
}

function listFrom<T = AnyRecord>(value: any, keys: string[] = []): T[] {
  if (Array.isArray(value)) return value as T[]
  for (const key of keys) {
    if (Array.isArray(value?.[key])) return value[key] as T[]
  }
  if (Array.isArray(value?.items)) return value.items as T[]
  if (Array.isArray(value?.results)) return value.results as T[]
  if (Array.isArray(value?.data)) return value.data as T[]
  return []
}

function idOf(value: AnyRecord) {
  return String(value.id || value._id || value.productId || value.branchId || value.saleId || value.debtorId || '')
}

function statusOf(value: unknown): BackendSubscriptionStatus {
  const status = String(value || 'pending').toLowerCase()
  if (['pending', 'active', 'expired', 'failed', 'cancelled'].includes(status)) return status as BackendSubscriptionStatus
  return 'pending'
}

function planTypeOf(value: unknown): BackendPlanType {
  return value === 'yearly' ? 'yearly' : 'monthly'
}

function currencyOf(value: unknown): BackendBillingCurrency {
  return value === 'USD' ? 'USD' : 'KSH'
}

function normalizeSubscriptionRecord(value: AnyRecord | null | undefined): BackendSubscriptionRecord | null {
  if (!value) return null
  return {
    ...value,
    id: String(value.id || value._id || value.subscriptionId || ''),
    businessAccountId: value.businessAccountId ? String(value.businessAccountId) : null,
    userId: value.userId ? String(value.userId) : null,
    planType: planTypeOf(value.planType),
    status: statusOf(value.status || value.subscriptionStatus),
    amount: Number(value.amount || 0),
    currency: currencyOf(value.currency),
    checkoutRequestId: value.checkoutRequestId ?? null,
    merchantRequestId: value.merchantRequestId ?? null,
    stripeCheckoutSessionId: value.stripeCheckoutSessionId ?? null,
    transactionId: value.transactionId ?? null,
    phoneNumber: value.phoneNumber ?? null,
    startDate: value.startDate ?? value.startedAt ?? null,
    endDate: value.endDate ?? value.endsAt ?? value.subscriptionEndsAt ?? null,
    receiptNumber: value.receiptNumber ?? null,
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null
  }
}

function normalizeAdminPaymentEvent(value: AnyRecord): BackendAdminPaymentEvent {
  return {
    ...value,
    id: String(value.id || value._id || value.eventObjectId || ''),
    provider: value.provider || 'manual',
    eventId: value.eventId ?? null,
    businessAccountId: value.businessAccountId ? String(value.businessAccountId) : null,
    subscriptionId: value.subscriptionId ? String(value.subscriptionId) : null,
    eventType: value.eventType || value.type || 'payment.event',
    processingStatus: value.processingStatus || value.status || 'received',
    errorMessage: value.errorMessage ?? null,
    processedAt: value.processedAt ?? null,
    createdAt: value.createdAt ?? null
  }
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

function productImageUrls(data: Partial<Product>): string[] {
  const rows = Array.isArray(data.images) ? data.images : []
  const urls = rows
    .map(image => typeof image === 'string' ? image : image?.url)
    .filter((url): url is string => Boolean(url))

  if (urls.length === 0 && data.imageUrl) {
    return [data.imageUrl]
  }

  return urls
}

function optionalString(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function optionalDate(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  const date = new Date(value as string | number | Date)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

function toMillis(value: any) {
  if (!value) return Date.now()
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : Date.now()
  }
  if (value.seconds) return Number(value.seconds) * 1000
  return Date.now()
}

function dateString(value: any) {
  return new Date(toMillis(value)).toISOString().slice(0, 10)
}

export function toBackendPaymentMethod(method?: string): string {
  return (method || 'CASH').toLowerCase()
}

export function fromBackendPaymentMethod(method?: string): PaymentMethod {
  const normalized = (method || 'cash').toUpperCase()
  if (normalized === 'BANK_TRANSFER') return 'BANK_TRANSFER'
  if (['CASH', 'MPESA', 'CARD', 'CREDIT', 'CHEQUE', 'OTHER'].includes(normalized)) {
    return normalized as PaymentMethod
  }
  return 'CASH'
}

export function getStoredBranchId() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(SELECTED_BRANCH_KEY) || ''
}

export function setStoredBranchId(branchId: string) {
  if (typeof window !== 'undefined' && branchId) {
    window.localStorage.setItem(SELECTED_BRANCH_KEY, branchId)
  }
}

export function clearStoredBranchId() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SELECTED_BRANCH_KEY)
  }
}

interface BackendBranchOptions {
  includeInventorySummary?: boolean
}

function productInventoryValue(product: Product) {
  return Number(product.costPrice || 0) * Number(product.quantity || 0)
}

export async function getBackendBranches(options: BackendBranchOptions = {}): Promise<Branch[]> {
  const rows = listFrom<AnyRecord>(await api('/branches'), ['branches'])
  const branches = rows.map(mapBranch)

  if (!options.includeInventorySummary || branches.length === 0) {
    return branches
  }

  return Promise.all(branches.map(async (branch) => {
    try {
      const products = await getBackendProducts(branch.id)
      return {
        ...branch,
        totalProducts: products.length,
        totalInventoryValue: products.reduce((sum, product) => sum + productInventoryValue(product), 0),
        lowStockItemsCount: products.filter((product) => {
          const quantity = Number(product.quantity || 0)
          return quantity > 0 && quantity <= Number(product.minStockLevel || 0)
        }).length
      }
    } catch (error) {
      console.warn(`Unable to load inventory summary for branch ${branch.id}:`, error)
      return branch
    }
  }))
}

export async function getSelectedBackendBranchId(): Promise<string> {
  const stored = getStoredBranchId()
  const branches = await getBackendBranches()
  const selected = branches.find((branch) => branch.id === stored)
    || branches.find((branch) => branch.status === 'ACTIVE')
    || branches[0]
  if (!selected) {
    clearStoredBranchId()
    throw new Error('No active branch is available for this account.')
  }
  setStoredBranchId(selected.id)
  return selected.id
}

export function mapBranch(row: AnyRecord): Branch {
  return {
    id: idOf(row),
    name: row.name || row.branchName || 'Branch',
    location: row.location || { address: row.address || '', city: row.city || '', country: row.country || '' },
    contact: row.contact || { phone: row.phone || '', email: row.email || '' },
    openingHours: row.openingHours || [],
    branchCode: row.branchCode || row.code || '',
    branchType: row.branchType || 'BRANCH',
    description: row.description || '',
    status: (row.status || (row.isActive === false ? 'INACTIVE' : 'ACTIVE')).toUpperCase(),
    currency: row.currency || 'KES',
    totalProducts: Number(row.totalProducts ?? row.productsCount ?? 0),
    totalInventoryValue: Number(row.totalInventoryValue ?? row.inventoryValue ?? 0),
    lowStockItemsCount: Number(row.lowStockItemsCount ?? row.lowStockItems ?? 0),
    userId: row.userId || row.ownerId || '',
    createdBy: row.createdBy || row.userId || '',
    createdAt: new Date(toMillis(row.createdAt)),
    updatedAt: new Date(toMillis(row.updatedAt))
  } as Branch
}

export async function getBackendBranch(branchId: string): Promise<Branch | null> {
  return mapBranch(await api(`/branches/${branchId}`))
}

export async function createBackendBranch(data: Partial<Branch>) {
  const created = await api<AnyRecord>('/branches', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      branchCode: data.branchCode,
      branchType: data.branchType || 'BRANCH',
      description: data.description,
      currency: data.currency || 'KES',
      location: data.location,
      contact: data.contact
    })
  })
  return idOf(created) || idOf(created.branch || {})
}

export async function updateBackendBranch(branchId: string, data: Partial<Branch>) {
  await api(`/branches/${branchId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function disableBackendBranch(branchId: string) {
  await api(`/branches/${branchId}/disable`, { method: 'POST' })
}

export async function enableBackendBranch(branchId: string) {
  await api(`/branches/${branchId}/enable`, { method: 'POST' })
}

export async function getBackendBranchDashboard(branchId: string): Promise<BranchDashboard> {
  const data = await api<AnyRecord>(`/branches/${branchId}/dashboard`)
  return {
    totalBranches: Number(data.totalBranches ?? data.branchCount ?? 0),
    activeBranches: Number(data.activeBranches ?? 0),
    totalProducts: Number(data.totalProducts ?? data.productsCount ?? 0),
    totalInventoryValue: Number(data.totalInventoryValue ?? data.inventoryValue ?? 0),
    lowStockAlerts: Number(data.lowStockAlerts ?? data.lowStockItems ?? 0),
    pendingTransfers: Number(data.pendingTransfers ?? 0),
    inTransitTransfers: Number(data.inTransitTransfers ?? 0),
    recentTransfers: listFrom(data.recentTransfers || data.transfers).map(mapTransfer),
    topPerformingBranches: data.topPerformingBranches || []
  }
}

export function mapProduct(row: AnyRecord): Product {
  const product = row.product || row.catalogProduct || row
  const inventory = row.inventory || row.branchInventory || row.inventoryItem || row
  const quantity = Number(inventory.currentStock ?? inventory.quantity ?? row.currentStock ?? row.quantity ?? 0)
  const costPrice = Number(inventory.costPrice ?? inventory.averageCostPrice ?? product.costPrice ?? row.costPrice ?? 0)
  const sellingPrice = Number(inventory.sellingPrice ?? product.sellingPrice ?? row.sellingPrice ?? 0)
  const imageUrl = product.imageUrl || row.imageUrl || null
  const images = normalizeProductImages(product.images ?? row.images, imageUrl)
  const primaryImage = images.find(image => image.isPrimary) || images[0]

  return {
    id: idOf(product) || idOf(row),
    name: product.name || row.name || 'Unnamed product',
    description: product.description || row.description || '',
    imageUrl: primaryImage?.url || imageUrl,
    images,
    costPrice,
    sellingPrice,
    quantity,
    minStockLevel: Number(inventory.reorderLevel ?? inventory.minStockLevel ?? row.minStockLevel ?? 0),
    category: product.category || row.category || 'General',
    barcode: product.barcode || row.barcode || null,
    sku: product.sku || row.sku || null,
    supplier: product.supplier || row.supplier || '',
    unitOfMeasure: product.unitOfMeasure || row.unitOfMeasure || 'pcs',
    expiryDate: row.expiryDate ? toMillis(row.expiryDate) : null,
    batchNumber: inventory.batchNumber || row.batchNumber || null,
    location: inventory.binLocation || row.location || '',
    tags: product.tags || row.tags || '',
    isPerishable: Boolean(product.isPerishable ?? row.isPerishable),
    lowStockAlertEnabled: true,
    isActive: row.isActive !== false,
    branchId: row.branchId || inventory.branchId || product.branchId || null,
    userId: row.userId || '',
    createdAt: new Date(toMillis(row.createdAt)),
    updatedAt: new Date(toMillis(row.updatedAt))
  }
}

export async function getBackendProducts(branchId?: string, search?: string): Promise<Product[]> {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/products${query}`), ['products'])
    .map(mapProduct)
    .filter((product) => product.isActive !== false)
}

export async function getBackendProduct(productId: string, branchId?: string): Promise<Product | null> {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return mapProduct(await api(`/branches/${targetBranch}/products/${productId}`))
}

export async function createBackendProduct(data: Partial<Product>, branchId?: string) {
  const targetBranch = branchId || String((data as AnyRecord).branchId || '') || await getSelectedBackendBranchId()
  const images = productImageUrls(data)
  await api(`/branches/${targetBranch}/products`, {
    method: 'POST',
    body: JSON.stringify({
      name: optionalString(data.name),
      description: optionalString(data.description),
      images: images.length > 0 ? images : undefined,
      barcode: optionalString(data.barcode),
      sku: optionalString(data.sku),
      category: optionalString(data.category),
      unitOfMeasure: optionalString(data.unitOfMeasure) || 'pcs',
      isPerishable: Boolean(data.isPerishable),
      inventory: {
        initialQuantity: Number(data.quantity || 0),
        initialStockReason: 'Opening stock',
        reorderLevel: Number(data.minStockLevel || 0),
        costPrice: Number(data.costPrice || 0),
        sellingPrice: Number(data.sellingPrice || 0),
        expiryDate: optionalDate(data.expiryDate),
        batchNumber: optionalString(data.batchNumber),
        binLocation: optionalString(data.location)
      }
    })
  })
}

export interface LinkProductInventoryInput {
  reorderLevel?: number
  costPrice?: number
  sellingPrice?: number
  batchNumber?: string
  binLocation?: string
  expiryDate?: string | number | Date | null
}

export async function linkBackendProductToBranch(productId: string, branchId: string, inventory: LinkProductInventoryInput) {
  await api(`/branches/${branchId}/products`, {
    method: 'POST',
    body: JSON.stringify({
      productId,
      inventory: {
        initialQuantity: 0,
        initialStockReason: 'Linked for transfer',
        reorderLevel: Number(inventory.reorderLevel || 0),
        costPrice: Number(inventory.costPrice || 0),
        sellingPrice: Number(inventory.sellingPrice || 0),
        expiryDate: optionalDate(inventory.expiryDate),
        batchNumber: optionalString(inventory.batchNumber),
        binLocation: optionalString(inventory.binLocation)
      }
    })
  })
}

export async function updateBackendProduct(productId: string, data: Partial<Product>, branchId?: string) {
  const targetBranch = branchId || String((data as AnyRecord).branchId || '') || await getSelectedBackendBranchId()
  const images = productImageUrls(data)
  const hasImageUpdate = 'images' in data || 'imageUrl' in data
  await api(`/branches/${targetBranch}/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      ...(hasImageUpdate ? {
        images
      } : {}),
      barcode: data.barcode,
      sku: data.sku,
      category: data.category,
      unitOfMeasure: data.unitOfMeasure,
      isPerishable: data.isPerishable,
      inventory: {
        reorderLevel: data.minStockLevel,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        expiryDate: optionalDate(data.expiryDate),
        batchNumber: optionalString(data.batchNumber),
        binLocation: optionalString(data.location)
      }
    })
  })
}

export async function deleteBackendProduct(productId: string, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/products/${productId}`, { method: 'DELETE' })
}

export async function bulkUploadBackendProducts(branchId: string, payload?: AnyRecord) {
  return api<AnyRecord>(`/branches/${branchId}/products/bulk-upload`, {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined
  })
}

export async function exportBackendProducts(branchId?: string, search?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return requestText(`/branches/${targetBranch}/products/export${query}`, { user: await currentUser() })
}

function saleItems(row: AnyRecord): AnyRecord[] {
  return Array.isArray(row.items) ? row.items : row.productId ? [row] : []
}

export function mapSale(row: AnyRecord): Sale {
  const item = saleItems(row)[0] || {}
  const timestamp = toMillis(row.createdAt || row.date || row.timestamp)
  const unitPrice = Number(item.unitPrice ?? row.unitPrice ?? 0)
  const quantity = Number(item.quantity ?? row.quantitySold ?? 1)
  const total = Number(row.totalAmount ?? row.total ?? unitPrice * quantity)
  return {
    id: idOf(row),
    productId: item.productId || row.productId || null,
    productName: item.productName || item.name || row.productName || row.name || 'Sale',
    saleType: 'PRODUCT',
    quantitySold: quantity,
    unitPrice,
    totalAmount: total,
    costPrice: Number(item.costPrice ?? row.costPrice ?? 0),
    timestamp,
    paymentMethod: fromBackendPaymentMethod(row.paymentMethod),
    customerName: row.customer?.name || row.customerName || null,
    customerPhone: row.customer?.phone || row.customerPhone || null,
    notes: row.notes || null,
    isDeleted: false,
    userId: row.userId || ''
  }
}

export function mapMultiItemSale(row: AnyRecord): MultiItemSale {
  const timestamp = toMillis(row.createdAt || row.date || row.timestamp)
  const items: SaleItem[] = saleItems(row).map((item, index) => {
    const quantity = Number(item.quantity || 1)
    const unitPrice = Number(item.unitPrice || 0)
    const costPrice = Number(item.costPrice || 0)
    return {
      id: `${idOf(row)}_${index}`,
      productId: item.productId || null,
      productName: item.productName || item.name || 'Product',
      saleType: 'PRODUCT',
      quantity,
      unitPrice,
      costPrice,
      lineTotal: Number(item.lineTotal ?? quantity * unitPrice),
      profit: Number(item.profit ?? Math.max(0, (unitPrice - costPrice) * quantity)),
      notes: item.notes || null
    } as SaleItem
  })
  const paymentName = fromBackendPaymentMethod(row.paymentMethod)
  return {
    id: idOf(row),
    saleNumber: row.saleNumber || idOf(row),
    items,
    customerName: row.customer?.name || row.customerName || null,
    customerPhone: row.customer?.phone || row.customerPhone || null,
    customerEmail: row.customer?.email || row.customerEmail || null,
    paymentMethod: { id: paymentName, name: paymentName, displayName: paymentName },
    subtotal: Number(row.subtotal ?? row.totalAmount ?? 0),
    tax: Number(row.tax || 0) || null,
    taxRate: row.taxRate || null,
    discount: Number(row.discount || 0) || null,
    discountType: row.discountType || null,
    totalAmount: Number(row.totalAmount ?? row.total ?? 0),
    timestamp,
    date: dateString(timestamp),
    notes: row.notes || null,
    createdBy: row.createdBy || null,
    isDeleted: false,
    deletedAt: null,
    lastModifiedAt: timestamp,
    userId: row.userId || '',
    branchId: row.branchId || null,
    isSynced: true,
    lastSyncedAt: timestamp
  } as MultiItemSale
}

export async function getBackendSales(branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/sales`), ['sales'])
}

export async function getBackendSingleItemSales(branchId?: string): Promise<Sale[]> {
  return (await getBackendSales(branchId))
    .filter((row) => saleItems(row).length <= 1)
    .map(mapSale)
    .sort((a, b) => b.timestamp - a.timestamp)
}

export async function getBackendMultiItemSales(branchId?: string): Promise<MultiItemSale[]> {
  return (await getBackendSales(branchId))
    .filter((row) => saleItems(row).length > 1)
    .map(mapMultiItemSale)
    .sort((a, b) => b.timestamp - a.timestamp)
}

export async function createBackendSale(data: Partial<Sale> | AnyRecord, branchId?: string) {
  const saleData = data as AnyRecord
  const targetBranch = branchId || String(saleData.branchId || '') || await getSelectedBackendBranchId()
  const items = Array.isArray(saleData.items)
    ? saleData.items
    : [{
        productId: saleData.productId,
        quantity: saleData.quantitySold || saleData.quantity || 1,
        unitPrice: saleData.unitPrice || 0,
        discount: 0
      }]

  if (items.some((item: AnyRecord) => !item.productId)) {
    throw new Error('Backend sales require product items.')
  }

  const created = await api<AnyRecord>(`/branches/${targetBranch}/sales`, {
    method: 'POST',
    body: JSON.stringify({
      items: items.map((item: AnyRecord) => ({
        productId: item.productId,
        quantity: Number(item.quantity || item.quantitySold || 1),
        unitPrice: Number(item.unitPrice || 0),
        discount: Number(item.discount || 0)
      })),
      customer: {
        name: saleData.customerName || undefined,
        phone: saleData.customerPhone || undefined,
        email: saleData.customerEmail || undefined,
        debtorId: saleData.debtorId || undefined
      },
      paymentMethod: toBackendPaymentMethod(saleData.paymentMethod),
      tax: Number(saleData.tax || 0),
      discount: Number(saleData.discount || 0),
      notes: saleData.notes || undefined
    })
  })
  return idOf(created) || idOf(created.sale || {})
}

export async function updateBackendSale(saleId: string, data: Partial<Sale>, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/sales/${saleId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      customer: {
        name: data.customerName || undefined,
        phone: data.customerPhone || undefined
      },
      notes: data.notes || undefined
    })
  })
}

export async function deleteBackendSale(saleId: string, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/sales/${saleId}`, { method: 'DELETE' })
}

export function mapExpense(row: AnyRecord): Expense {
  const timestamp = toMillis(row.date || row.createdAt || row.timestamp)
  return {
    id: idOf(row) || row.expenseId,
    amount: Number(row.amount || 0),
    category: (row.category || 'OTHER').toUpperCase(),
    description: row.description || '',
    receiptNumber: row.receiptNumber || null,
    notes: row.notes || null,
    timestamp,
    date: dateString(timestamp),
    paymentMethod: fromBackendPaymentMethod(row.paymentMethod),
    vendor: row.vendor || null,
    attachmentUrl: row.attachmentUrl || null,
    isBusinessExpense: true,
    userId: row.userId || ''
  } as Expense
}

export async function getBackendExpenses(branchId?: string): Promise<Expense[]> {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/expenses`), ['expenses'])
    .map(mapExpense)
    .sort((a, b) => b.timestamp - a.timestamp)
}

export async function createBackendExpense(data: Partial<Expense>, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      amount: data.amount,
      category: data.category,
      description: data.description,
      paymentMethod: toBackendPaymentMethod(data.paymentMethod),
      vendor: data.vendor || undefined,
      receiptNumber: data.receiptNumber || undefined,
      attachmentUrl: data.attachmentUrl || undefined,
      date: new Date(data.timestamp || data.date || Date.now()).toISOString()
    })
  })
}

export async function updateBackendExpense(expenseId: string, data: Partial<Expense>, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      amount: data.amount,
      category: data.category,
      description: data.description,
      paymentMethod: toBackendPaymentMethod(data.paymentMethod),
      vendor: data.vendor || undefined,
      receiptNumber: data.receiptNumber || undefined,
      attachmentUrl: data.attachmentUrl || undefined,
      date: data.timestamp || data.date ? new Date(data.timestamp || data.date || Date.now()).toISOString() : undefined
    })
  })
}

export async function deleteBackendExpense(expenseId: string, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/expenses/${expenseId}`, { method: 'DELETE' })
}

export function mapDebtor(row: AnyRecord): Debtor {
  const currentDebt = Number(row.currentDebt ?? row.balance ?? 0)
  const creditLimit = Number(row.creditLimit ?? row.totalCreditLimit ?? 0)
  return {
    id: idOf(row),
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || null,
    address: row.address || null,
    totalCreditLimit: creditLimit,
    currentDebt,
    totalPurchases: Number(row.totalPurchases || 0),
    totalPayments: Number(row.totalPayments || 0),
    creditScore: Number(row.creditScore || 100),
    isActive: row.isActive !== false,
    notes: row.notes || null,
    paymentStatus: currentDebt <= 0 ? 'PAID' : 'UNPAID',
    dueDate: row.dueDate ? toMillis(row.dueDate) : null,
    originalDebtAmount: Number(row.originalDebtAmount || currentDebt),
    preferredPaymentType: 'FULL',
    overdueAmount: 0,
    paymentReminders: 0,
    gracePeriodDays: 7,
    userId: row.userId || ''
  } as Debtor
}

export async function getBackendDebtors(branchId?: string): Promise<Debtor[]> {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/debtors`), ['debtors'])
    .map(mapDebtor)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function createBackendDebtor(data: Partial<Debtor>, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/debtors`, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      creditLimit: data.totalCreditLimit ?? (data as AnyRecord).creditLimit,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined
    })
  })
}

export async function updateBackendDebtor(debtorId: string, data: Partial<Debtor>, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/debtors/${debtorId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      creditLimit: data.totalCreditLimit,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined
    })
  })
}

export async function recordBackendDebtorPayment(data: Partial<DebtorPayment>, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/debtors/${data.debtorId}/payments`, {
    method: 'POST',
    body: JSON.stringify({
      amount: data.amount,
      paymentMethod: toBackendPaymentMethod(data.paymentMethod),
      reference: data.reference || data.receiptNumber || undefined
    })
  })
}

export async function adjustBackendStock(data: AnyRecord, branchId?: string) {
  const targetBranch = branchId || data.branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/inventory/adjustments`, {
    method: 'POST',
    body: JSON.stringify({
      productId: data.productId,
      adjustmentType: data.adjustmentType || (Number(data.quantity || 0) >= 0 ? 'increase' : 'decrease'),
      quantity: Math.abs(Number(data.quantity || 0)),
      reason: data.reason || 'stock_count',
      notes: data.notes,
      unitCostPrice: data.unitCostPrice
    })
  })
}

export async function getBackendInventory(branchId?: string, search?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/inventory${query}`), ['inventory', 'items'])
}

export async function getBackendInventoryMovements(branchId?: string, productId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : ''
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/inventory/movements${query}`), ['movements'])
}

export async function getBackendInventoryAlerts(branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/inventory/alerts`), ['alerts'])
}

export function mapSupplier(row: AnyRecord): Supplier {
  return {
    id: idOf(row),
    name: row.name || '',
    contactPerson: row.contactPerson || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || '',
    paymentTerms: (row.paymentTerms || 'NET_30').toUpperCase(),
    notes: row.notes || '',
    onTimeDeliveryRate: Number(row.onTimeDeliveryRate || 0),
    totalOrders: Number(row.totalOrders || 0),
    completedOrders: Number(row.completedOrders || 0),
    averageDeliveryDays: Number(row.averageDeliveryDays || 0),
    categories: row.categories || [],
    status: (row.status || 'ACTIVE').toUpperCase(),
    createdBy: row.createdBy || '',
    userId: row.userId || ''
  } as Supplier
}

export async function getBackendSuppliers(branchId?: string): Promise<Supplier[]> {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/suppliers`), ['suppliers'])
    .map(mapSupplier)
}

export async function getBackendSupplier(supplierId: string, branchId?: string): Promise<AnyRecord> {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return api<AnyRecord>(`/branches/${targetBranch}/suppliers/${supplierId}`)
}

export async function createBackendSupplier(data: Partial<Supplier>, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return idOf(await api<AnyRecord>(`/branches/${targetBranch}/suppliers`, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      openingBalance: (data as AnyRecord).openingBalance || 0,
      paymentTerms: String(data.paymentTerms || 'net_30').toLowerCase(),
      notes: data.notes
    })
  }))
}

export async function updateBackendSupplier(supplierId: string, data: Partial<Supplier>, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/suppliers/${supplierId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}

export async function deleteBackendSupplier(supplierId: string, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/suppliers/${supplierId}`, { method: 'DELETE' })
}

export async function getBackendSupplierLedger(supplierId: string, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/suppliers/${supplierId}/ledger`), ['ledger', 'entries'])
}

export async function getBackendSupplierPayments(supplierId: string, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/suppliers/${supplierId}/payments`), ['payments'])
}

export async function recordBackendSupplierPayment(supplierId: string, data: AnyRecord, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return api<AnyRecord>(`/branches/${targetBranch}/suppliers/${supplierId}/payments`, {
    method: 'POST',
    body: JSON.stringify({
      purchaseOrderId: data.purchaseOrderId,
      amount: Number(data.amount || 0),
      paymentMethod: toBackendPaymentMethod(data.paymentMethod),
      reference: data.reference || data.receiptNumber || undefined,
      notes: data.notes || undefined
    })
  })
}

export async function getBackendSupplierDashboard(branchId?: string): Promise<SupplierDashboard> {
  const suppliers = await getBackendSuppliers(branchId)
  return {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((supplier) => supplier.status === 'ACTIVE').length,
    topSuppliers: suppliers.slice(0, 5).map((supplier) => ({
      supplierId: supplier.id,
      supplierName: supplier.name,
      totalOrders: supplier.totalOrders,
      totalAmount: 0,
      onTimeDeliveryRate: supplier.onTimeDeliveryRate
    })),
    recentOrders: [],
    pendingApprovals: 0,
    overdueDeliveries: 0
  }
}

export function mapPurchaseOrder(row: AnyRecord): PurchaseOrder {
  return {
    id: idOf(row) || row.purchaseOrderId,
    poNumber: row.poNumber || row.orderNumber || idOf(row),
    supplierId: row.supplierId || '',
    supplierName: row.supplierName || '',
    items: (row.items || []).map((item: AnyRecord) => ({
      productId: item.productId,
      quantityOrdered: Number(item.quantityOrdered || item.quantity || 0),
      quantityReceived: Number(item.quantityReceived || 0),
      quantityPending: Number(item.quantityPending || Math.max(0, Number(item.quantityOrdered || 0) - Number(item.quantityReceived || 0))),
      unitCost: Number(item.unitCostPrice || item.unitCost || 0),
      totalCost: Number(item.totalCost || 0),
      productName: item.productName || ''
    })),
    subtotal: Number(row.subtotal || row.totalAmount || 0),
    taxAmount: Number(row.taxAmount || 0),
    shippingCost: Number(row.shippingCost || 0),
    totalAmount: Number(row.totalAmount || 0),
    currency: row.currency || 'KES',
    expectedDeliveryDate: new Date(toMillis(row.expectedDeliveryDate)),
    branchId: row.branchId || '',
    status: (row.status || 'PENDING').toUpperCase(),
    priority: (row.priority || 'NORMAL').toUpperCase(),
    requestedBy: row.requestedBy || '',
    paymentTerms: (row.paymentTerms || 'NET_30').toUpperCase(),
    userId: row.userId || '',
    createdAt: new Date(toMillis(row.createdAt)),
    updatedAt: new Date(toMillis(row.updatedAt))
  } as PurchaseOrder
}

export async function getBackendPurchaseOrders(branchId?: string): Promise<PurchaseOrder[]> {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return listFrom<AnyRecord>(await api(`/branches/${targetBranch}/purchase-orders`), ['purchaseOrders', 'orders'])
    .map(mapPurchaseOrder)
}

export async function getBackendPurchaseOrder(purchaseOrderId: string, branchId?: string): Promise<PurchaseOrder | null> {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  return mapPurchaseOrder(await api(`/branches/${targetBranch}/purchase-orders/${purchaseOrderId}`))
}

export async function createBackendPurchaseOrder(data: AnyRecord, branchId?: string) {
  const targetBranch = branchId || data.branchId || await getSelectedBackendBranchId()
  return idOf(await api<AnyRecord>(`/branches/${targetBranch}/purchase-orders`, {
    method: 'POST',
    body: JSON.stringify({
      supplierId: data.supplierId,
      items: (data.items || []).map((item: AnyRecord) => ({
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        unitCostPrice: item.unitCost || item.unitCostPrice
      })),
      taxAmount: data.taxAmount || 0,
      shippingCost: data.shippingCost || 0,
      amountPaid: data.amountPaid || 0,
      paymentTerms: String(data.paymentTerms || 'net_30').toLowerCase(),
      expectedDeliveryDate: new Date(data.expectedDeliveryDate || Date.now()).toISOString()
    })
  }))
}

export async function approveBackendPurchaseOrder(purchaseOrderId: string, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/purchase-orders/${purchaseOrderId}/approve`, { method: 'POST' })
}

export async function receiveBackendPurchaseOrder(purchaseOrderId: string, items: AnyRecord[], branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/purchase-orders/${purchaseOrderId}/receive`, {
    method: 'POST',
    body: JSON.stringify({
      items: items.map((item) => ({
        productId: item.productId,
        quantityReceived: item.quantityReceived
      }))
    })
  })
}

export async function cancelBackendPurchaseOrder(purchaseOrderId: string, branchId?: string) {
  const targetBranch = branchId || await getSelectedBackendBranchId()
  await api(`/branches/${targetBranch}/purchase-orders/${purchaseOrderId}/cancel`, { method: 'POST' })
}

export function mapTransfer(row: AnyRecord): BranchTransfer {
  return {
    id: idOf(row) || row.transferId,
    transferNumber: row.transferNumber || idOf(row),
    fromBranchId: row.fromBranchId,
    fromBranchName: row.fromBranchName,
    toBranchId: row.toBranchId,
    toBranchName: row.toBranchName,
    items: (row.items || []).map((item: AnyRecord) => ({
      productId: item.productId,
      requestedQuantity: Number(item.quantity || item.requestedQuantity || 0),
      approvedQuantity: item.approvedQuantity,
      receivedQuantity: item.receivedQuantity,
      productName: item.productName,
      notes: item.notes
    })),
    totalItems: Number(row.totalItems || row.items?.length || 0),
    totalValue: Number(row.totalValue || 0),
    currency: row.currency || 'KES',
    status: (row.status || 'REQUESTED').toUpperCase(),
    priority: (row.priority || 'NORMAL').toUpperCase(),
    requestedBy: row.requestedBy || '',
    requestedAt: new Date(toMillis(row.requestedAt || row.createdAt)),
    transferType: row.transferType || 'STOCK_REBALANCING',
    userId: row.userId || ''
  } as BranchTransfer
}

export async function getBackendTransfers(): Promise<BranchTransfer[]> {
  return listFrom<AnyRecord>(await api('/transfers'), ['transfers']).map(mapTransfer)
}

export async function getBackendTransfer(transferId: string): Promise<BranchTransfer | null> {
  return mapTransfer(await api(`/transfers/${transferId}`))
}

export async function createBackendTransfer(data: AnyRecord) {
  const result = await api<AnyRecord>('/transfers', {
    method: 'POST',
    body: JSON.stringify({
      fromBranchId: data.fromBranchId,
      toBranchId: data.toBranchId,
      items: (data.items || []).map((item: AnyRecord) => ({
        productId: item.productId,
        quantity: item.quantity || item.requestedQuantity
      })),
      priority: String(data.priority || 'normal').toLowerCase(),
      notes: data.notes || data.requestReason
    })
  })
  return idOf(result) || result.transferId || result.transfer?.id || result.transfer?._id || ''
}

export async function transitionBackendTransfer(transferId: string, action: 'approve' | 'ship' | 'receive' | 'cancel' | 'reject', payload?: AnyRecord) {
  await api(`/transfers/${transferId}/${action}`, {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined
  })
}

export type BackendReportPath =
  | '/reports/dashboard'
  | '/reports/sales'
  | '/reports/inventory-valuation'
  | '/reports/low-stock'
  | '/reports/suppliers'
  | '/reports/expenses'
  | '/reports/branch-performance'

export async function getBackendReport(path: BackendReportPath = '/reports/dashboard', params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : ''
  return api<AnyRecord>(`${path}${query}`)
}

export function getBackendDashboardReport(params?: Record<string, string>) {
  return getBackendReport('/reports/dashboard', params)
}

export function getBackendSalesReport(params?: Record<string, string>) {
  return getBackendReport('/reports/sales', params)
}

export function getBackendInventoryValuationReport(params?: Record<string, string>) {
  return getBackendReport('/reports/inventory-valuation', params)
}

export function getBackendLowStockReport(params?: Record<string, string>) {
  return getBackendReport('/reports/low-stock', params)
}

export function getBackendSuppliersReport(params?: Record<string, string>) {
  return getBackendReport('/reports/suppliers', params)
}

export function getBackendExpensesReport(params?: Record<string, string>) {
  return getBackendReport('/reports/expenses', params)
}

export function getBackendBranchPerformanceReport(params?: Record<string, string>) {
  return getBackendReport('/reports/branch-performance', params)
}

export async function getBackendSettings() {
  return api<AnyRecord>('/settings')
}

export async function updateBackendSettings(settings: AnyRecord) {
  await api('/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings)
  })
}

export async function getBackendSubscription(): Promise<BackendCurrentSubscription> {
  const result = await api<AnyRecord>('/billing/subscription')
  return {
    account: result.account ?? {},
    subscription: normalizeSubscriptionRecord(result.subscription)
  }
}

export async function getBackendBillingPlans(): Promise<BackendBillingPlans> {
  return api<BackendBillingPlans>('/billing/plans')
}

export async function getBackendBillingHistory(): Promise<BackendSubscriptionRecord[]> {
  return listFrom<AnyRecord>(await api('/billing/history')).map(normalizeSubscriptionRecord).filter(Boolean) as BackendSubscriptionRecord[]
}

export async function getBackendBillingReceipt(subscriptionId: string): Promise<BackendBillingReceipt> {
  const result = await api<AnyRecord>(`/billing/receipts/${subscriptionId}`)
  return {
    receiptNumber: result.receiptNumber ?? null,
    subscriptionId: String(result.subscriptionId || result.id || subscriptionId),
    provider: result.provider,
    planType: planTypeOf(result.planType),
    amount: Number(result.amount || 0),
    currency: currencyOf(result.currency),
    transactionId: result.transactionId ?? null,
    startDate: result.startDate ?? null,
    endDate: result.endDate ?? null,
    status: statusOf(result.status)
  }
}

export async function getBackendCheckoutStatus(subscriptionId: string): Promise<BackendCheckoutStatus> {
  const result = await api<AnyRecord>(`/billing/checkout-status/${subscriptionId}`)
  return {
    subscriptionId: String(result.subscriptionId || subscriptionId),
    status: statusOf(result.status),
    transactionId: result.transactionId ?? null,
    planType: planTypeOf(result.planType),
    amount: Number(result.amount || 0),
    currency: currencyOf(result.currency)
  }
}

export async function startBackendMpesaCheckout(planType: BackendPlanType, phoneNumber: string): Promise<BackendMpesaCheckoutResponse> {
  const result = await api<AnyRecord>('/billing/mpesa/stk-push', {
    method: 'POST',
    body: JSON.stringify({ planType, phoneNumber })
  })
  const subscription = normalizeSubscriptionRecord(result.subscription)
  if (!subscription) throw new Error('Backend did not return a subscription for M-Pesa checkout.')
  return {
    provider: 'mpesa',
    subscription,
    checkout: result.checkout ?? {}
  }
}

export async function startBackendStripeCheckout(planType: BackendPlanType, successUrl?: string, cancelUrl?: string): Promise<BackendStripeCheckoutResponse> {
  const user = await currentUser()
  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + (planType === 'yearly' ? 12 : 1))

  const subscription: BackendSubscriptionRecord = {
    id: `mock_stripe_${now.getTime()}`,
    businessAccountId: null,
    userId: user.uid,
    provider: 'stripe',
    planType,
    status: 'active',
    amount: planType === 'yearly' ? 100 : 10,
    currency: 'USD',
    checkoutRequestId: null,
    merchantRequestId: null,
    stripeCheckoutSessionId: `cs_mock_${now.getTime()}`,
    transactionId: `txn_mock_${now.getTime()}`,
    phoneNumber: null,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    receiptNumber: `MOCK-${now.getTime()}`,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_STRIPE_SESSION_KEY, JSON.stringify({
      planType: subscription.planType,
      subscriptionEndsAt: subscription.endDate,
      subscriptionId: subscription.id
    }))
  }

  const checkoutUrl = successUrl
    ?? (typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard/subscription/success?plan=${planType}`
      : null)

  return {
    provider: 'stripe',
    subscription,
    checkout: {
      sessionId: subscription.stripeCheckoutSessionId || subscription.id,
      url: checkoutUrl
    }
  }
}

export async function searchBackendAdminBusinesses(params?: { q?: string; status?: string }) {
  const query = params ? `?${new URLSearchParams(Object.entries(params).filter(([, value]) => Boolean(value)) as [string, string][]).toString()}` : ''
  return listFrom<AnyRecord>(await api(`/admin/businesses${query}`), ['businesses', 'accounts'])
}

export async function getBackendAdminBusiness(businessAccountId: string) {
  return api<AnyRecord>(`/admin/businesses/${businessAccountId}`)
}

export async function setBackendAdminBusinessStatus(
  businessAccountId: string,
  action: 'pause' | 'resume' | 'revoke'
) {
  return api<AnyRecord>(`/admin/businesses/${businessAccountId}/${action}`, { method: 'POST' })
}

export async function setBackendAdminBranchLimit(businessAccountId: string, branchLimitOverride: number | null) {
  return api<AnyRecord>(`/admin/businesses/${businessAccountId}/branch-limit`, {
    method: 'POST',
    body: JSON.stringify({ branchLimitOverride })
  })
}

export async function extendBackendAdminSubscription(businessAccountId: string, days: number, reason?: string) {
  return api<AnyRecord>(`/admin/businesses/${businessAccountId}/subscriptions/extend`, {
    method: 'POST',
    body: JSON.stringify({ days, reason })
  })
}

export async function manuallyActivateBackendAdminSubscription(
  businessAccountId: string,
  planType: BackendPlanType,
  days?: number,
  reason?: string
) {
  const result = await api<AnyRecord>(`/admin/businesses/${businessAccountId}/subscriptions/manual-activate`, {
    method: 'POST',
    body: JSON.stringify({ planType, days, reason })
  })
  return {
    account: result.account ?? null,
    subscription: normalizeSubscriptionRecord(result.subscription)
  }
}

export async function retryBackendAdminPaymentEvent(eventId: string) {
  return normalizeAdminPaymentEvent(await api<AnyRecord>(`/admin/payment-events/${eventId}/retry`, { method: 'POST' }))
}

export async function getBackendAdminAuditLogs() {
  return listFrom<AnyRecord>(await api('/admin/audit-logs'), ['logs', 'auditLogs'])
}

export async function getBackendAdminPayments() {
  return listFrom<AnyRecord>(await api('/admin/payments'), ['payments', 'events']).map(normalizeAdminPaymentEvent)
}
