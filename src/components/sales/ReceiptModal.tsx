'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'
import { 
  XMarkIcon,
  PrinterIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import type { Sale } from '@/lib/firestore'
import type { MultiItemSale } from '@/lib/multi-item-sales-types'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale | MultiItemSale | null
  businessName?: string
  businessPhone?: string
  businessAddress?: string
}

export default function ReceiptModal({ 
  isOpen, 
  onClose, 
  sale,
  businessName = "FahamPesa Business",
  businessPhone = "+254 XXX XXX XXX",
  businessAddress = "Nairobi, Kenya"
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  if (!isOpen || !sale) return null

  const isMultiItemSale = 'items' in sale && sale.items
  const saleDate = new Date(sale.createdAt).toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'MPESA': return 'M-Pesa'
      case 'BANK_TRANSFER': return 'Bank Transfer'
      case 'CREDIT': return 'Credit'
      case 'CASH':
      default: return 'Cash'
    }
  }

  const printReceipt = () => {
    if (receiptRef.current) {
      const printContents = receiptRef.current.innerHTML
      const printWindow = window.open('', '', 'width=600,height=800')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${sale.id.slice(-8)}</title>
              <style>
                body { 
                  font-family: 'Courier New', monospace; 
                  margin: 0; 
                  padding: 20px;
                  font-size: 12px;
                  line-height: 1.4;
                }
                .receipt { 
                  max-width: 300px; 
                  margin: 0 auto;
                  border: 1px solid #ddd;
                  padding: 15px;
                }
                .header { 
                  text-align: center; 
                  border-bottom: 1px dashed #333;
                  padding-bottom: 10px;
                  margin-bottom: 10px;
                }
                .business-name { 
                  font-size: 16px; 
                  font-weight: bold; 
                  margin-bottom: 5px;
                }
                .item-row { 
                  display: flex; 
                  justify-content: space-between;
                  margin-bottom: 3px;
                }
                .item-name { 
                  flex: 1; 
                  margin-right: 10px;
                }
                .item-price { 
                  white-space: nowrap;
                }
                .total-row { 
                  border-top: 1px dashed #333;
                  padding-top: 5px;
                  margin-top: 10px;
                  font-weight: bold;
                }
                .footer { 
                  text-align: center; 
                  border-top: 1px dashed #333;
                  padding-top: 10px;
                  margin-top: 10px;
                  font-size: 10px;
                }
                @media print {
                  body { margin: 0; padding: 10px; }
                  .receipt { border: none; }
                }
              </style>
            </head>
            <body>
              <div class="receipt">${printContents}</div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
        printWindow.close()
      }
    }
  }

  const downloadReceipt = () => {
    printReceipt() // For now, use print functionality for download
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Receipt</h2>
              <p className="text-green-100 text-sm">Sale #{sale.id.slice(-8)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div ref={receiptRef} className="space-y-4">
            {/* Business Header */}
            <div className="header text-center border-b border-dashed border-gray-400 pb-4 mb-4">
              <div className="business-name text-lg font-bold">{businessName}</div>
              <div className="text-sm text-gray-600">{businessPhone}</div>
              <div className="text-sm text-gray-600">{businessAddress}</div>
            </div>

            {/* Sale Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{saleDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span>{sale.id.slice(-8)}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{sale.customerName}</span>
                </div>
              )}
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>{formatPaymentMethod(sale.paymentMethod)}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-dashed border-gray-400 pt-4">
              <div className="space-y-2">
                {isMultiItemSale ? (
                  // Multi-item sale
                  sale.items.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="item-row flex justify-between">
                        <span className="item-name font-medium">{item.productName}</span>
                      </div>
                      <div className="item-row flex justify-between text-sm text-gray-600">
                        <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                        <span className="item-price">{formatCurrency(item.quantity * item.unitPrice)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  // Single-item sale
                  <div className="space-y-1">
                    <div className="item-row flex justify-between">
                      <span className="item-name font-medium">{sale.productName}</span>
                    </div>
                    <div className="item-row flex justify-between text-sm text-gray-600">
                      <span>{sale.quantitySold} x {formatCurrency(sale.unitPrice)}</span>
                      <span className="item-price">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="total-row border-t border-dashed border-gray-400 pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL:</span>
                <span>{formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="border-t border-dashed border-gray-400 pt-4">
                <div className="text-sm">
                  <span className="font-medium">Notes:</span>
                  <p className="mt-1 text-gray-600">{sale.notes}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="footer border-t border-dashed border-gray-400 pt-4 text-center text-xs text-gray-500">
              <p>Thank you for your business!</p>
              <p>Powered by FahamPesa</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={printReceipt}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

