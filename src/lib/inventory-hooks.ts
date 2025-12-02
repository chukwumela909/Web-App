// Integration hooks for automatic inventory updates
// These functions should be called by other modules (Sales, Purchases, etc.) to keep inventory in sync

import {
  createStockMovement,
  getInventoryItem,
  createOrUpdateInventoryItem,
  generateLowStockAlerts
} from '@/lib/inventory-service'
import { StockMovement } from '@/lib/inventory-types'

// ============================================================================
// SALES INTEGRATION HOOKS
// ============================================================================

export interface SaleItem {
  productId: string
  quantity: number
  unitPrice: number
  batchNumber?: string
}

export interface SaleTransaction {
  id: string
  branchId: string
  items: SaleItem[]
  customerId?: string
  totalAmount: number
  paymentMethod: string
  saleDate: Date
  notes?: string
}

/**
 * Updates inventory when a sale is completed
 * Automatically reduces stock levels and creates movement records
 */
export async function processSaleInventoryUpdate(
  userId: string,
  sale: SaleTransaction
): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = []
  
  try {
    for (const item of sale.items) {
      try {
        // Get current inventory item
        const inventoryItem = await getInventoryItem(item.productId, sale.branchId)
        
        if (!inventoryItem) {
          // Create inventory item with zero stock if it doesn't exist
          await createOrUpdateInventoryItem(userId, item.productId, sale.branchId, {
            currentStock: 0,
            reservedStock: 0,
            averageCostPrice: 0,
            lastCostPrice: 0,
            minStockLevel: 5 // Default minimum stock
          })
          
          errors.push(`Product ${item.productId} had no inventory record. Created with zero stock.`)
          continue
        }
        
        // Check if enough stock is available
        if (inventoryItem.availableStock < item.quantity) {
          errors.push(`Insufficient stock for product ${item.productId}. Available: ${inventoryItem.availableStock}, Required: ${item.quantity}`)
          continue
        }
        
        // Calculate new stock levels
        const newStock = Math.max(0, inventoryItem.currentStock - item.quantity)
        const newAvailableStock = Math.max(0, inventoryItem.availableStock - item.quantity)
        
        // Create stock movement record
        const movement: Omit<StockMovement, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          productId: item.productId,
          branchId: sale.branchId,
          movementType: 'SALE',
          quantity: item.quantity,
          previousStock: inventoryItem.currentStock,
          newStock,
          unitCostPrice: inventoryItem.averageCostPrice,
          totalValue: item.quantity * inventoryItem.averageCostPrice,
          referenceType: 'SALE',
          referenceId: sale.id,
          status: 'APPROVED',
          batchNumber: item.batchNumber,
          notes: `Sale transaction: ${sale.id}`
        }
        
        await createStockMovement(userId, movement)
        
        // Update inventory item
        await createOrUpdateInventoryItem(userId, item.productId, sale.branchId, {
          currentStock: newStock,
          availableStock: newAvailableStock,
          lastCostPrice: inventoryItem.lastCostPrice, // Keep same cost price
          averageCostPrice: inventoryItem.averageCostPrice
        })
        
      } catch (itemError) {
        console.error(`Error processing sale item ${item.productId}:`, itemError)
        errors.push(`Failed to update inventory for product ${item.productId}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
      }
    }
    
    // Generate low stock alerts after sale
    try {
      await generateLowStockAlerts(userId, sale.branchId)
    } catch (alertError) {
      console.error('Error generating low stock alerts:', alertError)
      // Don't add to errors as this is not critical to sale completion
    }
    
    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
    
  } catch (error) {
    console.error('Error processing sale inventory update:', error)
    return {
      success: false,
      errors: [`Failed to process sale inventory update: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Reverses inventory changes when a sale is cancelled or returned
 */
export async function reverseSaleInventoryUpdate(
  userId: string,
  sale: SaleTransaction
): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = []
  
  try {
    for (const item of sale.items) {
      try {
        // Get current inventory item
        const inventoryItem = await getInventoryItem(item.productId, sale.branchId)
        
        if (!inventoryItem) {
          errors.push(`No inventory record found for product ${item.productId}`)
          continue
        }
        
        // Calculate new stock levels (add back the returned quantity)
        const newStock = inventoryItem.currentStock + item.quantity
        const newAvailableStock = inventoryItem.availableStock + item.quantity
        
        // Create stock movement record for return
        const movement: Omit<StockMovement, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          productId: item.productId,
          branchId: sale.branchId,
          movementType: 'RETURN',
          quantity: item.quantity,
          previousStock: inventoryItem.currentStock,
          newStock,
          unitCostPrice: inventoryItem.averageCostPrice,
          totalValue: item.quantity * inventoryItem.averageCostPrice,
          referenceType: 'SALE',
          referenceId: sale.id,
          status: 'APPROVED',
          batchNumber: item.batchNumber,
          notes: `Sale return/cancellation: ${sale.id}`
        }
        
        await createStockMovement(userId, movement)
        
        // Update inventory item
        await createOrUpdateInventoryItem(userId, item.productId, sale.branchId, {
          currentStock: newStock,
          availableStock: newAvailableStock
        })
        
      } catch (itemError) {
        console.error(`Error reversing sale item ${item.productId}:`, itemError)
        errors.push(`Failed to reverse inventory for product ${item.productId}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
    
  } catch (error) {
    console.error('Error reversing sale inventory update:', error)
    return {
      success: false,
      errors: [`Failed to reverse sale inventory update: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// ============================================================================
// PURCHASE INTEGRATION HOOKS
// ============================================================================

export interface PurchaseItem {
  productId: string
  quantity: number
  unitCostPrice: number
  batchNumber?: string
  expiryDate?: Date
}

export interface PurchaseOrder {
  id: string
  branchId: string
  items: PurchaseItem[]
  supplierId?: string
  totalAmount: number
  purchaseDate: Date
  invoiceNumber?: string
  notes?: string
}

/**
 * Updates inventory when a purchase order is received
 * Automatically increases stock levels and updates cost prices
 */
export async function processPurchaseInventoryUpdate(
  userId: string,
  purchase: PurchaseOrder
): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = []
  
  try {
    for (const item of purchase.items) {
      try {
        // Get current inventory item or create if doesn't exist
        let inventoryItem = await getInventoryItem(item.productId, purchase.branchId)
        
        if (!inventoryItem) {
          // Create new inventory item
          await createOrUpdateInventoryItem(userId, item.productId, purchase.branchId, {
            currentStock: 0,
            reservedStock: 0,
            averageCostPrice: item.unitCostPrice,
            lastCostPrice: item.unitCostPrice,
            minStockLevel: 5 // Default minimum stock
          })
          
          // Refetch the created item
          inventoryItem = await getInventoryItem(item.productId, purchase.branchId)
          if (!inventoryItem) {
            errors.push(`Failed to create inventory item for product ${item.productId}`)
            continue
          }
        }
        
        // Calculate new stock levels
        const newStock = inventoryItem.currentStock + item.quantity
        const newAvailableStock = inventoryItem.availableStock + item.quantity
        
        // Calculate new average cost price using weighted average
        const totalCurrentValue = inventoryItem.currentStock * inventoryItem.averageCostPrice
        const totalPurchaseValue = item.quantity * item.unitCostPrice
        const totalQuantity = inventoryItem.currentStock + item.quantity
        const newAverageCostPrice = totalQuantity > 0 ? (totalCurrentValue + totalPurchaseValue) / totalQuantity : item.unitCostPrice
        
        // Create stock movement record
        const movement: Omit<StockMovement, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          productId: item.productId,
          branchId: purchase.branchId,
          movementType: 'PURCHASE',
          quantity: item.quantity,
          previousStock: inventoryItem.currentStock,
          newStock,
          unitCostPrice: item.unitCostPrice,
          totalValue: item.quantity * item.unitCostPrice,
          referenceType: 'PURCHASE',
          referenceId: purchase.id,
          status: 'APPROVED',
          batchNumber: item.batchNumber,
          notes: `Purchase order: ${purchase.id}${purchase.invoiceNumber ? `, Invoice: ${purchase.invoiceNumber}` : ''}`
        }
        
        await createStockMovement(userId, movement)
        
        // Update inventory item
        await createOrUpdateInventoryItem(userId, item.productId, purchase.branchId, {
          currentStock: newStock,
          availableStock: newAvailableStock,
          lastCostPrice: item.unitCostPrice,
          averageCostPrice: newAverageCostPrice,
          // Add batch info if provided
          ...(item.batchNumber && {
            batches: [
              ...(inventoryItem.batches || []),
              {
                batchNumber: item.batchNumber,
                quantity: item.quantity,
                costPrice: item.unitCostPrice,
                receivedDate: purchase.purchaseDate,
                expiryDate: item.expiryDate,
                isActive: true
              }
            ]
          })
        })
        
      } catch (itemError) {
        console.error(`Error processing purchase item ${item.productId}:`, itemError)
        errors.push(`Failed to update inventory for product ${item.productId}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
    
  } catch (error) {
    console.error('Error processing purchase inventory update:', error)
    return {
      success: false,
      errors: [`Failed to process purchase inventory update: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// ============================================================================
// STOCK RESERVATION HOOKS
// ============================================================================

/**
 * Reserves stock for pending orders/sales
 */
export async function reserveStock(
  userId: string,
  branchId: string,
  items: { productId: string; quantity: number }[],
  referenceId: string,
  referenceType: string = 'ORDER'
): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = []
  
  try {
    for (const item of items) {
      try {
        const inventoryItem = await getInventoryItem(item.productId, branchId)
        
        if (!inventoryItem) {
          errors.push(`No inventory found for product ${item.productId}`)
          continue
        }
        
        if (inventoryItem.availableStock < item.quantity) {
          errors.push(`Insufficient available stock for product ${item.productId}. Available: ${inventoryItem.availableStock}, Required: ${item.quantity}`)
          continue
        }
        
        const newReservedStock = inventoryItem.reservedStock + item.quantity
        const newAvailableStock = inventoryItem.availableStock - item.quantity
        
        await createOrUpdateInventoryItem(userId, item.productId, branchId, {
          reservedStock: newReservedStock,
          availableStock: newAvailableStock
        })
        
        // Create movement record for reservation
        const movement: Omit<StockMovement, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          productId: item.productId,
          branchId,
          movementType: 'ADJUSTMENT',
          quantity: item.quantity,
          previousStock: inventoryItem.currentStock,
          newStock: inventoryItem.currentStock, // Stock doesn't change, only reservation
          referenceType: referenceType as any,
          referenceId,
          status: 'APPROVED',
          notes: `Stock reserved for ${referenceType}: ${referenceId}`,
          reason: 'Stock Reservation'
        }
        
        await createStockMovement(userId, movement)
        
      } catch (itemError) {
        console.error(`Error reserving stock for ${item.productId}:`, itemError)
        errors.push(`Failed to reserve stock for product ${item.productId}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
    
  } catch (error) {
    console.error('Error reserving stock:', error)
    return {
      success: false,
      errors: [`Failed to reserve stock: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Releases reserved stock (e.g., when an order is cancelled)
 */
export async function releaseReservedStock(
  userId: string,
  branchId: string,
  items: { productId: string; quantity: number }[],
  referenceId: string,
  referenceType: string = 'ORDER'
): Promise<{ success: boolean; errors?: string[] }> {
  const errors: string[] = []
  
  try {
    for (const item of items) {
      try {
        const inventoryItem = await getInventoryItem(item.productId, branchId)
        
        if (!inventoryItem) {
          errors.push(`No inventory found for product ${item.productId}`)
          continue
        }
        
        const newReservedStock = Math.max(0, inventoryItem.reservedStock - item.quantity)
        const newAvailableStock = inventoryItem.currentStock - newReservedStock
        
        await createOrUpdateInventoryItem(userId, item.productId, branchId, {
          reservedStock: newReservedStock,
          availableStock: newAvailableStock
        })
        
        // Create movement record for reservation release
        const movement: Omit<StockMovement, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
          productId: item.productId,
          branchId,
          movementType: 'ADJUSTMENT',
          quantity: item.quantity,
          previousStock: inventoryItem.currentStock,
          newStock: inventoryItem.currentStock, // Stock doesn't change, only reservation
          referenceType: referenceType as any,
          referenceId,
          status: 'APPROVED',
          notes: `Stock reservation released for ${referenceType}: ${referenceId}`,
          reason: 'Stock Reservation Release'
        }
        
        await createStockMovement(userId, movement)
        
      } catch (itemError) {
        console.error(`Error releasing reserved stock for ${item.productId}:`, itemError)
        errors.push(`Failed to release reserved stock for product ${item.productId}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
      }
    }
    
    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
    
  } catch (error) {
    console.error('Error releasing reserved stock:', error)
    return {
      success: false,
      errors: [`Failed to release reserved stock: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Validates if enough stock is available for a transaction
 */
export async function validateStockAvailability(
  branchId: string,
  items: { productId: string; quantity: number }[]
): Promise<{ isValid: boolean; errors?: string[] }> {
  const errors: string[] = []
  
  try {
    for (const item of items) {
      const inventoryItem = await getInventoryItem(item.productId, branchId)
      
      if (!inventoryItem) {
        errors.push(`No inventory found for product ${item.productId}`)
        continue
      }
      
      if (inventoryItem.availableStock < item.quantity) {
        errors.push(`Insufficient stock for product ${item.productId}. Available: ${inventoryItem.availableStock}, Required: ${item.quantity}`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
    
  } catch (error) {
    console.error('Error validating stock availability:', error)
    return {
      isValid: false,
      errors: [`Failed to validate stock availability: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Gets current stock levels for multiple products
 */
export async function checkStockLevels(
  branchId: string,
  productIds: string[]
): Promise<{ [productId: string]: { currentStock: number; availableStock: number; reservedStock: number } }> {
  const stockLevels: { [productId: string]: { currentStock: number; availableStock: number; reservedStock: number } } = {}
  
  try {
    for (const productId of productIds) {
      const inventoryItem = await getInventoryItem(productId, branchId)
      
      stockLevels[productId] = {
        currentStock: inventoryItem?.currentStock || 0,
        availableStock: inventoryItem?.availableStock || 0,
        reservedStock: inventoryItem?.reservedStock || 0
      }
    }
    
    return stockLevels
  } catch (error) {
    console.error('Error checking stock levels:', error)
    throw error
  }
}
