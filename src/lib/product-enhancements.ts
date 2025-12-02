// Enhanced Product Services - Supplier Links & Inventory Integration
// Handles supplier relationships, price history, and real-time inventory data for products

import { db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction, 
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'

import {
  Product,
  ProductSupplierLink,
  ProductPriceHistory,
  ProductInventoryData
} from '@/lib/firestore'

import { getSupplier } from '@/lib/suppliers-service'
import { getInventoryItem, getStockLevels } from '@/lib/inventory-service'

// Helper function to remove undefined values from objects before saving to Firestore
function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const cleaned = {} as T
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively clean nested objects
        cleaned[key as keyof T] = cleanFirestoreData(value)
      } else if (Array.isArray(value)) {
        // Clean arrays by filtering undefined values and cleaning each element
        cleaned[key as keyof T] = value.filter(item => item !== undefined).map(item => 
          item && typeof item === 'object' && !(item instanceof Date) ? cleanFirestoreData(item) : item
        ) as T[keyof T]
      } else {
        cleaned[key as keyof T] = value
      }
    }
  }
  return cleaned
}

// ============================================================================
// PRODUCT PRICE HISTORY OPERATIONS
// ============================================================================

export async function createPriceHistoryEntry(
  userId: string,
  data: Omit<ProductPriceHistory, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  const priceHistoryId = crypto.randomUUID()
  
  const priceHistory: ProductPriceHistory = {
    id: priceHistoryId,
    userId,
    ...data,
    createdAt: new Date()
  }

  const cleanedPriceHistory = cleanFirestoreData({
    ...priceHistory,
    createdAt: serverTimestamp()
  })
  
  await setDoc(doc(db, 'product_price_history', priceHistoryId), cleanedPriceHistory)

  // Update the product's cached price information
  await updateProductPriceCache(data.productId, data.supplierId, userId)

  return priceHistoryId
}

export async function getProductPriceHistory(
  productId: string,
  supplierId?: string,
  limitCount: number = 50
): Promise<ProductPriceHistory[]> {
  let q = query(
    collection(db, 'product_price_history'),
    where('productId', '==', productId),
    orderBy('effectiveDate', 'desc')
  )

  if (supplierId) {
    q = query(q, where('supplierId', '==', supplierId))
  }

  if (limitCount) {
    q = query(q, limit(limitCount))
  }

  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductPriceHistory))
}

export async function getSupplierPriceHistory(
  supplierId: string,
  productId?: string,
  limitCount: number = 50
): Promise<ProductPriceHistory[]> {
  let q = query(
    collection(db, 'product_price_history'),
    where('supplierId', '==', supplierId),
    orderBy('effectiveDate', 'desc')
  )

  if (productId) {
    q = query(q, where('productId', '==', productId))
  }

  if (limitCount) {
    q = query(q, limit(limitCount))
  }

  const snap = await getDocs(q)
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductPriceHistory))
}

// ============================================================================
// PRODUCT SUPPLIER LINKS MANAGEMENT
// ============================================================================

export async function addSupplierLinkToProduct(
  productId: string,
  supplierId: string,
  linkData?: Partial<ProductSupplierLink>
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, 'products', productId)
    const productSnap = await transaction.get(productRef)
    
    if (!productSnap.exists()) {
      throw new Error('Product not found')
    }

    const product = productSnap.data() as Product
    
    // Get supplier info for caching
    const supplier = await getSupplier(supplierId)
    if (!supplier) {
      throw new Error('Supplier not found')
    }

    const supplierLinks = product.supplierLinks || []
    
    // Check if supplier link already exists
    const existingLinkIndex = supplierLinks.findIndex(link => link.supplierId === supplierId)
    
    const newLink: ProductSupplierLink = cleanFirestoreData({
      supplierId,
      supplierName: supplier.name,
      isPrimary: linkData?.isPrimary || supplierLinks.length === 0, // First supplier becomes primary
      lastPurchaseDate: linkData?.lastPurchaseDate,
      lastPurchasePrice: linkData?.lastPurchasePrice,
      averagePurchasePrice: linkData?.averagePurchasePrice,
      leadTimeInDays: linkData?.leadTimeInDays,
      minimumOrderQuantity: linkData?.minimumOrderQuantity,
      priceValidUntil: linkData?.priceValidUntil
    }) as ProductSupplierLink

    if (existingLinkIndex >= 0) {
      // Update existing link
      supplierLinks[existingLinkIndex] = newLink
    } else {
      // Add new link
      supplierLinks.push(newLink)
    }

    // If this is set as primary, remove primary flag from others
    if (newLink.isPrimary) {
      supplierLinks.forEach((link, index) => {
        if (index !== existingLinkIndex && link.supplierId !== supplierId) {
          link.isPrimary = false
        }
      })
    }

    // Update product
    const updates: Partial<Product> = {
      supplierLinks,
      preferredSupplierId: newLink.isPrimary ? supplierId : product.preferredSupplierId,
      updatedAt: new Date()
    }

    // Clean the updates to remove any undefined values before saving to Firestore
    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: serverTimestamp()
    })

    transaction.update(productRef, cleanedUpdates)
  })
}

export async function removeSupplierLinkFromProduct(
  productId: string,
  supplierId: string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, 'products', productId)
    const productSnap = await transaction.get(productRef)
    
    if (!productSnap.exists()) {
      throw new Error('Product not found')
    }

    const product = productSnap.data() as Product
    const supplierLinks = (product.supplierLinks || []).filter(link => link.supplierId !== supplierId)
    
    // If we removed the primary supplier, make the first remaining supplier primary
    if (supplierLinks.length > 0 && !supplierLinks.some(link => link.isPrimary)) {
      supplierLinks[0].isPrimary = true
    }

    const updates: Partial<Product> = {
      supplierLinks,
      preferredSupplierId: supplierLinks.find(link => link.isPrimary)?.supplierId,
      updatedAt: new Date()
    }

    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: serverTimestamp()
    })
    
    transaction.update(productRef, cleanedUpdates)
  })
}

export async function setPrimarySupplier(
  productId: string,
  supplierId: string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, 'products', productId)
    const productSnap = await transaction.get(productRef)
    
    if (!productSnap.exists()) {
      throw new Error('Product not found')
    }

    const product = productSnap.data() as Product
    const supplierLinks = product.supplierLinks || []
    
    // Update primary status
    supplierLinks.forEach(link => {
      link.isPrimary = link.supplierId === supplierId
    })

    const updates: Partial<Product> = {
      supplierLinks,
      preferredSupplierId: supplierId,
      updatedAt: new Date()
    }

    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: serverTimestamp()
    })
    
    transaction.update(productRef, cleanedUpdates)
  })
}

// ============================================================================
// REAL-TIME INVENTORY INTEGRATION
// ============================================================================

export async function getProductInventoryData(
  productId: string,
  userId: string
): Promise<ProductInventoryData | null> {
  try {
    // Get stock levels across all branches for this user
    const stockLevels = await getStockLevels(userId, '', [productId])
    
    if (stockLevels.length === 0) {
      return {
        totalStock: 0,
        availableStock: 0,
        reservedStock: 0,
        inTransitStock: 0,
        branchStock: {},
        expiryAlerts: [],
        lowStockAlerts: []
      }
    }

    let totalStock = 0
    let availableStock = 0
    let reservedStock = 0
    let inTransitStock = 0
    const branchStock: { [branchId: string]: BranchStockInfo } = {}
    const expiryAlerts: ExpiryAlert[] = []
    const lowStockAlerts: LowStockAlert[] = []

    for (const level of stockLevels) {
      totalStock += level.currentStock
      availableStock += level.availableStock
      reservedStock += level.reservedStock
      inTransitStock += level.inTransitStock || 0

      branchStock[level.branchId] = {
        stock: level.currentStock,
        available: level.availableStock,
        reserved: level.reservedStock
      }

      // Check for low stock alerts
      if (level.currentStock <= level.minStockLevel) {
        lowStockAlerts.push({
          branchId: level.branchId,
          currentStock: level.currentStock,
          minStockLevel: level.minStockLevel
        })
      }

      // Check for expiry alerts (if the product has batches with expiry dates)
      // This would need to be implemented based on your batch tracking system
      // For now, we'll leave this empty as it requires more complex inventory logic
    }

    return {
      totalStock,
      availableStock,
      reservedStock,
      inTransitStock,
      branchStock,
      expiryAlerts,
      lowStockAlerts,
      lastMovementDate: stockLevels[0]?.lastUpdated,
      lastMovementType: undefined // Would need to fetch from stock movements
    }
  } catch (error) {
    console.error('Error fetching product inventory data:', error)
    return null
  }
}

export function subscribeToProductInventory(
  productId: string,
  userId: string,
  callback: (inventoryData: ProductInventoryData | null) => void
): Unsubscribe {
  // Subscribe to inventory changes for this product
  const inventoryQuery = query(
    collection(db, 'inventory'),
    where('productId', '==', productId),
    where('userId', '==', userId)
  )

  return onSnapshot(inventoryQuery, async (snapshot) => {
    if (snapshot.empty) {
      callback(null)
      return
    }

    // Recalculate inventory data when there are changes
    const inventoryData = await getProductInventoryData(productId, userId)
    callback(inventoryData)
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function updateProductPriceCache(
  productId: string,
  supplierId: string,
  userId: string
): Promise<void> {
  // Get recent price history for this product-supplier combination
  const priceHistory = await getProductPriceHistory(productId, supplierId, 10)
  
  if (priceHistory.length === 0) return

  const latestPrice = priceHistory[0]
  const averagePrice = priceHistory.reduce((sum, entry) => sum + entry.purchasePrice, 0) / priceHistory.length

  // Update the product's cached price information
  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, 'products', productId)
    const productSnap = await transaction.get(productRef)
    
    if (!productSnap.exists()) return

    const product = productSnap.data() as Product
    const supplierLinks = product.supplierLinks || []
    
    // Update the specific supplier link
    const linkIndex = supplierLinks.findIndex(link => link.supplierId === supplierId)
    if (linkIndex >= 0) {
      supplierLinks[linkIndex] = {
        ...supplierLinks[linkIndex],
        lastPurchasePrice: latestPrice.purchasePrice,
        lastPurchaseDate: latestPrice.effectiveDate,
        averagePurchasePrice: averagePrice
      }
    }

    // Update global cached values if this is the preferred supplier
    const updates: Partial<Product> = {
      supplierLinks,
      updatedAt: new Date()
    }

    if (product.preferredSupplierId === supplierId) {
      updates.lastPurchasePrice = latestPrice.purchasePrice
      updates.lastPurchaseDate = latestPrice.effectiveDate
      updates.averagePurchasePrice = averagePrice
      updates.lastSupplierId = supplierId
    }

    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: serverTimestamp()
    })
    
    transaction.update(productRef, cleanedUpdates)
  })
}

export async function updateProductLastSupplierUsed(
  productId: string,
  supplierId: string,
  purchaseData?: {
    purchasePrice: number
    quantity: number
    purchaseOrderId?: string
  }
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const productRef = doc(db, 'products', productId)
    const productSnap = await transaction.get(productRef)
    
    if (!productSnap.exists()) {
      throw new Error('Product not found')
    }

    const updates: Partial<Product> = {
      lastSupplierId: supplierId,
      updatedAt: new Date()
    }

    if (purchaseData) {
      updates.lastPurchasePrice = purchaseData.purchasePrice
      updates.lastPurchaseDate = new Date()
    }

    const cleanedUpdates = cleanFirestoreData({
      ...updates,
      updatedAt: serverTimestamp()
    })
    
    transaction.update(productRef, cleanedUpdates)
  })

  // Create price history entry if purchase data is provided
  if (purchaseData) {
    await createPriceHistoryEntry((await getDoc(doc(db, 'products', productId))).data()?.userId, {
      productId,
      supplierId,
      purchasePrice: purchaseData.purchasePrice,
      quantity: purchaseData.quantity,
      purchaseOrderId: purchaseData.purchaseOrderId,
      effectiveDate: new Date(),
      currency: 'USD' // Default - could be made configurable
    })
  }
}
