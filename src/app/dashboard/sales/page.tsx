'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calculator,
  Clock,
  History,
  Home,
  Loader2,
  LogOut,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Wifi,
  X
} from 'lucide-react'
import PosCalculator from '@/components/pos/PosCalculator'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffProtectedRoute from '@/components/auth/StaffProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useBranch } from '@/contexts/BranchContext'
import { useStaff } from '@/contexts/StaffContext'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { useInvalidateBusinessData, usePOSDataQuery } from '@/hooks/useBusinessQueries'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import {
  completeHeldSaleAndReturn,
  createHeldSale,
  createMultiItemSaleAndReturn,
  deleteHeldSale
} from '@/lib/firestore'
import type { Product, Sale } from '@/lib/firestore'
import type { DiscountType, HeldSale, MultiItemSale, SaleItem } from '@/lib/multi-item-sales-types'
import { SaleCalculations } from '@/lib/multi-item-sales-types'

type PaymentMethodName = 'CASH' | 'MPESA' | 'BANK_TRANSFER' | 'CARD'

interface CartItem {
  productId: string
  productName: string
  category: string
  sku?: string | null
  imageUrl?: string | null
  quantity: number
  unitPrice: number
  costPrice: number
  discount: string
  discountType: DiscountType
  stock: number
}

interface ReceiptLine {
  productName: string
  quantity: number
  unitPrice: number
  lineGross: number
  discount?: number | null
  discountType?: DiscountType | null
  discountAmount?: number | null
  lineSubtotal: number
}

interface ReceiptSnapshot {
  id: string
  saleNumber?: string
  customerName?: string | null
  paymentMethod: string
  cashierName: string
  items: ReceiptLine[]
  subtotal: number
  tax?: number | null
  discount?: number | null
  discountType?: DiscountType | null
  discountAmount?: number | null
  totalAmount: number
  timestamp: number
}

type RecentEntry =
  | {
      kind: 'held'
      id: string
      title: string
      itemCount: number
      timestamp: number
      totalAmount: number
      heldSale: HeldSale
    }
  | {
      kind: 'sale'
      id: string
      title: string
      itemCount: number
      timestamp: number
      totalAmount: number
      receipt: ReceiptSnapshot
    }

const POS_PAYMENT_METHODS: Array<{ id: PaymentMethodName; label: string }> = [
  { id: 'CASH', label: 'Cash' },
  { id: 'MPESA', label: 'M-Pesa' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { id: 'CARD', label: 'Card payment' }
]

function getProductImage(product: Product): string | null {
  return product.images?.find(image => image.isPrimary)?.url || product.images?.[0]?.url || product.imageUrl || null
}

function paymentLabel(method: unknown): string {
  const value = typeof method === 'string'
    ? method
    : method && typeof method === 'object' && 'displayName' in method
      ? String((method as { displayName?: string }).displayName || '')
      : method && typeof method === 'object' && 'name' in method
        ? String((method as { name?: string }).name || '')
        : 'CASH'

  switch (value) {
    case 'MPESA':
      return 'M-Pesa'
    case 'BANK_TRANSFER':
      return 'Bank Transfer'
    case 'CARD':
      return 'Card payment'
    case 'CASH':
    default:
      return value
        ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase())
        : 'Cash'
  }
}

function paymentName(method: unknown): PaymentMethodName {
  const value = typeof method === 'string'
    ? method
    : method && typeof method === 'object' && 'name' in method
      ? String((method as { name?: string }).name || '')
      : ''

  if (value === 'MPESA' || value === 'BANK_TRANSFER' || value === 'CARD') return value
  return 'CASH'
}

function saleTitle(saleNumber: string | undefined, id: string, productName?: string, items?: SaleItem[]): string {
  const label = saleNumber ?? `Sale #${id.slice(-5)}`
  const firstItem = items?.[0]?.productName || productName || 'Sale'
  return `${label} - ${firstItem}`
}

// Receipt reference — the backend sale number when present (matches the desktop app),
// otherwise a short id. Kept in sync with saleTitle's labelling.
function saleRef(id: string, saleNumber?: string): string {
  return saleNumber && saleNumber !== id ? saleNumber : id.slice(-8).toUpperCase()
}

function normaliseFixedDiscount(value: number, maximum: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(maximum, Math.max(0, value))
}

function numberFromInput(value: string): number {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function lineGross(item: Pick<CartItem, 'quantity' | 'unitPrice'>): number {
  return SaleCalculations.calculateLineTotal(item.quantity, item.unitPrice)
}

function lineDiscountAmount(item: Pick<CartItem, 'quantity' | 'unitPrice' | 'discount' | 'discountType'>): number {
  const gross = lineGross(item)
  const discountValue = numberFromInput(item.discount)
  const rawDiscount = item.discountType === 'percentage'
    ? gross * discountValue / 100
    : discountValue
  return Number(normaliseFixedDiscount(rawDiscount, gross).toFixed(2))
}

function lineSubtotal(item: Pick<CartItem, 'quantity' | 'unitPrice' | 'discount' | 'discountType'>): number {
  return Number(Math.max(0, lineGross(item) - lineDiscountAmount(item)).toFixed(2))
}

function discountValidationMessage(value: number, discountType: DiscountType, fixedMaximum: number, label: string): string | null {
  if (value < 0) return `${label} discount cannot be negative.`
  if (discountType === 'percentage' && value > 100) return `${label} percentage discount cannot exceed 100%.`
  if (discountType === 'fixed' && value > fixedMaximum) return `${label} fixed discount cannot exceed ${fixedMaximum.toLocaleString()}.`
  return null
}

function SalesPOSContent() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { staff } = useStaff()
  const { selectedBranchId } = useBranch()
  const { currency } = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const { canRecordSale } = usePlanLimits()

  const handleLogout = async () => {
    try {
      await logout()
      router.replace('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }
  const receiptRef = useRef<HTMLDivElement>(null)

  const effectiveUserId = staff ? staff.userId : user?.uid
  const cashierName = staff?.fullName || user?.displayName || user?.email?.split('@')[0] || 'Cashier'
  // Same symbol everywhere ('KSh', not a POS-only 'Ksh' variant).
  const displayCurrency = currencySymbol

  const [isSaleActive, setIsSaleActive] = useState(false)
  const [calcOpen, setCalcOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [taxRateInput, setTaxRateInput] = useState('0')
  const [taxRateTouched, setTaxRateTouched] = useState(false)
  const [discount, setDiscount] = useState('0')
  const [discountType, setDiscountType] = useState<DiscountType>('fixed')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodName>('CASH')
  const [resumedHeldSaleId, setResumedHeldSaleId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedRecentSale, setSelectedRecentSale] = useState<RecentEntry | null>(null)
  const [receiptSale, setReceiptSale] = useState<ReceiptSnapshot | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [savingHold, setSavingHold] = useState(false)
  const [online, setOnline] = useState(true)
  const [now, setNow] = useState(() => new Date())
  const {
    data: posData,
    error: posError,
    isLoading,
    refetch: refetchPOSData
  } = usePOSDataQuery({ userId: effectiveUserId, branchId: selectedBranchId })
  const { invalidateAllBusinessData } = useInvalidateBusinessData()
  const products = posData?.products || []
  const singleSales = posData?.singleSales || []
  const multiItemSales = posData?.multiItemSales || []
  const heldSales = posData?.heldSales || []
  const businessProfile = posData?.businessProfile || null
  // Tax rate (%) configured in Settings → Pricing pre-fills the POS tax field,
  // but the cashier can override it per sale via the editable input below.
  const configuredTaxRate = Math.max(0, Number(businessProfile?.taxRate || 0))
  const taxRatePercent = Math.max(0, numberFromInput(taxRateInput))
  const receiptBusinessName = businessProfile?.businessName?.trim() || user?.displayName?.trim() || 'Business'
  const receiptBusinessPhone = businessProfile?.businessPhone?.trim()
  const receiptBusinessAddress = businessProfile?.businessAddress?.trim()
  const receiptHeaderText = businessProfile?.receiptHeaderText?.trim()
  const receiptThankYouMessage =
    businessProfile?.receiptThankYouMessage?.trim() ||
    businessProfile?.receiptFooterText?.trim() ||
    'Thank you for your business!'
  const loading = isLoading && !posData
  const errorMessage = posError instanceof Error ? posError.message : posError ? 'Unable to load POS data.' : ''

  const formatMoney = useCallback((amount: number) => {
    return `${displayCurrency} ${Number(amount || 0).toLocaleString()}`
  }, [displayCurrency])

  const refreshPOSData = async () => {
    await invalidateAllBusinessData()
    await refetchPOSData()
  }

  // Keep the POS tax field in sync with the Settings-configured rate until the
  // cashier manually edits it for the current sale.
  useEffect(() => {
    if (!taxRateTouched) {
      setTaxRateInput(configuredTaxRate ? String(configuredTaxRate) : '0')
    }
  }, [configuredTaxRate, taxRateTouched])

  useEffect(() => {
    setOnline(typeof navigator === 'undefined' ? true : navigator.onLine)
    const tick = window.setInterval(() => setNow(new Date()), 30000)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.clearInterval(tick)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const activeProducts = useMemo(
    () => products.filter(product => product.isActive !== false),
    [products]
  )

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>()
    activeProducts.forEach(product => {
      counts.set(product.category || 'Uncategorized', (counts.get(product.category || 'Uncategorized') || 0) + 1)
    })

    const categories = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([category, count]) => ({ value: category, label: category, count }))

    return [{ value: 'ALL', label: 'All Products', count: activeProducts.length }, ...categories]
  }, [activeProducts])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return activeProducts
      .filter(product => selectedCategory === 'ALL' || product.category === selectedCategory)
      .filter(product => {
        if (!query) return true
        const haystack = [
          product.name,
          product.sku,
          product.category,
          product.barcode,
          product.tags,
          product.description
        ].filter(Boolean).join(' ').toLowerCase()
        return haystack.includes(query)
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [activeProducts, searchQuery, selectedCategory])

  const subtotal = useMemo(
    () => Number(cartItems.reduce((sum, item) => sum + lineSubtotal(item), 0).toFixed(2)),
    [cartItems]
  )
  const taxAmount = useMemo(
    () => Number(Math.max(0, subtotal * (taxRatePercent / 100)).toFixed(2)),
    [subtotal, taxRatePercent]
  )
  const discountAmount = useMemo(
    () => {
      const discountValue = numberFromInput(discount)
      const discountBase = subtotal + taxAmount
      const rawDiscount = discountType === 'percentage'
        ? discountBase * discountValue / 100
        : discountValue
      return Number(normaliseFixedDiscount(rawDiscount, discountBase).toFixed(2))
    },
    [discount, discountType, subtotal, taxAmount]
  )
  const totalAmount = useMemo(
    () => Number(Math.max(0, subtotal + taxAmount - discountAmount).toFixed(2)),
    [subtotal, taxAmount, discountAmount]
  )
  const cartDiscountValidation = useMemo(
    () => discountValidationMessage(numberFromInput(discount), discountType, subtotal + taxAmount, 'Cart'),
    [discount, discountType, subtotal, taxAmount]
  )
  const itemDiscountValidation = useMemo(
    () => cartItems
      .map(item => discountValidationMessage(numberFromInput(item.discount), item.discountType, lineGross(item), item.productName))
      .find(Boolean) || null,
    [cartItems]
  )
  const saleValidationMessage = itemDiscountValidation || cartDiscountValidation
  const cartQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  )

  const receiptFromMultiSale = useCallback((sale: MultiItemSale): ReceiptSnapshot => ({
    id: sale.id,
    saleNumber: sale.saleNumber,
    customerName: sale.customerName,
    paymentMethod: paymentLabel(sale.paymentMethod),
    cashierName: sale.createdByName || cashierName,
    items: sale.items.map(item => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineGross: item.lineTotal || item.quantity * item.unitPrice,
      discount: item.discount || null,
      discountType: item.discountType || null,
      discountAmount: item.discountAmount || null,
      lineSubtotal: item.lineSubtotal ?? item.lineTotal ?? item.quantity * item.unitPrice
    })),
    subtotal: sale.subtotal,
    tax: sale.tax,
    discount: sale.discount,
    discountType: sale.discountType,
    discountAmount: sale.discountAmount,
    totalAmount: sale.totalAmount,
    timestamp: sale.timestamp
  }), [cashierName])

  const receiptFromSingleSale = useCallback((sale: Sale): ReceiptSnapshot => ({
    id: sale.id,
    saleNumber: sale.saleNumber,
    customerName: sale.customerName,
    paymentMethod: paymentLabel(sale.paymentMethod),
    cashierName: sale.createdByName || cashierName,
    items: [{
      productName: sale.productName,
      quantity: sale.quantitySold,
      unitPrice: sale.unitPrice,
      lineGross: sale.totalAmount,
      lineSubtotal: sale.totalAmount
    }],
    subtotal: sale.totalAmount,
    discount: null,
    totalAmount: sale.totalAmount,
    timestamp: sale.timestamp
  }), [cashierName])

  const recentEntries = useMemo<RecentEntry[]>(() => {
    const heldEntries: RecentEntry[] = heldSales.map(heldSale => ({
      kind: 'held',
      id: heldSale.id,
      title: 'Pending sale',
      itemCount: heldSale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      timestamp: heldSale.lastModifiedAt || heldSale.timestamp,
      totalAmount: heldSale.totalAmount,
      heldSale
    }))

    const multiEntries: RecentEntry[] = multiItemSales.map(sale => ({
      kind: 'sale',
      id: sale.id,
      title: saleTitle(sale.saleNumber, sale.id, undefined, sale.items),
      itemCount: sale.items.length,
      timestamp: sale.timestamp,
      totalAmount: sale.totalAmount,
      receipt: receiptFromMultiSale(sale)
    }))

    const singleEntries: RecentEntry[] = singleSales.map(sale => ({
      kind: 'sale',
      id: sale.id,
      title: saleTitle(sale.saleNumber, sale.id, sale.productName),
      itemCount: 1,
      timestamp: sale.timestamp,
      totalAmount: sale.totalAmount,
      receipt: receiptFromSingleSale(sale)
    }))

    return [...heldEntries, ...multiEntries, ...singleEntries]
      .sort((a, b) => {
        if (a.kind !== b.kind) {
          return a.kind === 'held' ? -1 : 1
        }
        return b.timestamp - a.timestamp
      })
      .slice(0, 6)
  }, [heldSales, multiItemSales, receiptFromMultiSale, receiptFromSingleSale, singleSales])

  const resetSaleState = () => {
    setCartItems([])
    setCustomerName('')
    setTaxRateInput(configuredTaxRate ? String(configuredTaxRate) : '0')
    setTaxRateTouched(false)
    setDiscount('0')
    setDiscountType('fixed')
    setNotes('')
    setPaymentMethod('CASH')
    setResumedHeldSaleId(null)
    setIsSaleActive(false)
  }

  const startSale = () => {
    setSelectedRecentSale(null)
    setIsSaleActive(true)
  }

  const addProduct = (product: Product) => {
    if (!isSaleActive) return

    const stock = Number(product.quantity || 0)
    const existingQuantity = cartItems.find(item => item.productId === product.id)?.quantity || 0
    if (stock <= existingQuantity) {
      window.alert('No more stock available for this product.')
      return
    }

    setCartItems(prevItems => {
      const existing = prevItems.find(item => item.productId === product.id)
      if (existing) {
        return prevItems.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }

      return [...prevItems, {
        productId: product.id,
        productName: product.name,
        category: product.category,
        sku: product.sku,
        imageUrl: getProductImage(product),
        quantity: 1,
        unitPrice: Number(product.sellingPrice || 0),
        costPrice: Number(product.costPrice || 0),
        discount: '0',
        discountType: 'fixed',
        stock
      }]
    })
  }

  const reduceProduct = (productId: string) => {
    if (!isSaleActive) return

    setCartItems(prevItems =>
      prevItems.flatMap(item => {
        if (item.productId !== productId) return [item]
        if (item.quantity <= 1) return []
        return [{ ...item, quantity: item.quantity - 1 }]
      })
    )
  }

  const removeCartItem = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId))
  }

  const updateCartItemDiscount = (productId: string, updates: Partial<Pick<CartItem, 'discount' | 'discountType'>>) => {
    setCartItems(prevItems => prevItems.map(item =>
      item.productId === productId ? { ...item, ...updates } : item
    ))
  }

  const cartQuantityForProduct = (productId: string) => {
    return cartItems.find(item => item.productId === productId)?.quantity || 0
  }

  const cartItemsForPersistence = (): Partial<SaleItem>[] => cartItems.map(item => ({
    productId: item.productId,
    productName: item.productName,
    saleType: 'PRODUCT',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    costPrice: item.costPrice,
    discount: numberFromInput(item.discount),
    discountType: item.discountType,
    discountAmount: lineDiscountAmount(item),
    lineSubtotal: lineSubtotal(item),
    lineTotal: lineGross(item),
    profit: lineSubtotal(item) - item.quantity * item.costPrice
  }))

  const handleHoldSale = async () => {
    if (!effectiveUserId || cartItems.length === 0) return

    setSavingHold(true)
    try {
      await createHeldSale(effectiveUserId, {
        id: resumedHeldSaleId || undefined,
        items: cartItemsForPersistence(),
        customerName: customerName.trim() || undefined,
        paymentMethod,
        tax: taxAmount,
        discount: numberFromInput(discount),
        discountType,
        notes: notes.trim() || undefined,
        branchId: selectedBranchId || undefined,
        createdBy: user?.uid || staff?.authId || null
      })
      resetSaleState()
      await refreshPOSData()
    } catch (error) {
      console.error('Error holding sale:', error)
      window.alert(error instanceof Error ? error.message : 'Failed to hold sale.')
    } finally {
      setSavingHold(false)
    }
  }

  const handleClearSale = async () => {
    const heldSaleId = resumedHeldSaleId
    resetSaleState()
    if (!heldSaleId) return

    try {
      await deleteHeldSale(heldSaleId)
      await refreshPOSData()
    } catch (error) {
      console.error('Error clearing held sale:', error)
    }
  }

  const handleResumeHeldSale = (heldSale: HeldSale) => {
    const nextCart = heldSale.items.map(item => {
      const product = activeProducts.find(row => row.id === item.productId)
      return {
        productId: item.productId || item.id,
        productName: item.productName,
        category: product?.category || 'Product',
        sku: product?.sku || null,
        imageUrl: product ? getProductImage(product) : null,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice || 0),
        costPrice: Number(item.costPrice || 0),
        discount: String(item.discount || 0),
        discountType: item.discountType || 'fixed',
        stock: Number(product?.quantity || item.quantity || 0)
      }
    })

    setCartItems(nextCart)
    setCustomerName(heldSale.customerName || '')
    setDiscount(heldSale.discount ? String(heldSale.discount) : '0')
    setDiscountType(heldSale.discountType || 'fixed')
    setNotes(heldSale.notes || '')
    setPaymentMethod(paymentName(heldSale.paymentMethod))
    setResumedHeldSaleId(heldSale.id)
    setSelectedRecentSale(null)
    setIsSaleActive(true)
  }

  const handleCompleteSale = async () => {
    if (!effectiveUserId || cartItems.length === 0) return

    setSubmitting(true)
    try {
      const limitCheck = await canRecordSale()
      if (!limitCheck.allowed) {
        window.alert(limitCheck.message || 'Daily sales limit reached.')
        return
      }

      if (saleValidationMessage) {
        window.alert(saleValidationMessage)
        return
      }

      const salePayload = {
        items: cartItemsForPersistence(),
        customerName: customerName.trim() || undefined,
        paymentMethod,
        tax: taxAmount,
        discount: numberFromInput(discount),
        discountType,
        notes: notes.trim() || undefined,
        branchId: selectedBranchId || undefined
      }

      const sale = resumedHeldSaleId
        ? await completeHeldSaleAndReturn(effectiveUserId, resumedHeldSaleId, salePayload)
        : await createMultiItemSaleAndReturn(effectiveUserId, salePayload)

      setReceiptSale(receiptFromMultiSale(sale))
      resetSaleState()
      await refreshPOSData()
    } catch (error) {
      console.error('Error completing sale:', error)
      window.alert(error instanceof Error ? error.message : 'Failed to complete sale.')
    } finally {
      setSubmitting(false)
    }
  }

  const printReceipt = () => {
    if (!receiptRef.current || !receiptSale) return

    const printContents = receiptRef.current.innerHTML
    const printWindow = window.open('', '', 'width=620,height=820')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${saleRef(receiptSale.id, receiptSale.saleNumber)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 24px; color: #06112b; }
            .receipt-print { max-width: 440px; margin: 0 auto; }
            @media print { body { padding: 12px; } }
          </style>
        </head>
        <body>
          <div class="receipt-print">${printContents}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const openReceiptFromRecent = (entry: RecentEntry | null) => {
    if (!entry || entry.kind !== 'sale') return
    setReceiptSale(entry.receipt)
  }

  const displayDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const displayTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <ProtectedRoute>
      <StaffProtectedRoute requiredPermission="sales:read">
        <div className="min-h-screen overflow-hidden bg-[#f6f8fb] font-dm-sans text-[#0f172a]">
          <header className="flex h-[78px] items-center border-b border-[#1a2547] bg-[#0b1733] text-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
            <div className="flex h-full w-[190px] shrink-0 items-center border-r border-[#1a2547] px-7">
              <h1 className="text-[18px] font-semibold tracking-[-0.01em]">Fahampesa POS</h1>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-6 px-7">
              <button
                type="button"
                onClick={() => router.push('/dashboard/sales/history')}
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#cbd5e1] transition hover:bg-[#1a2547] hover:text-white sm:flex"
                title="Sales history"
              >
                <History className="h-5 w-5" /> History
              </button>
              <div className="hidden h-8 w-px bg-[#1f2a4a] sm:block" />
              <div className="hidden items-center gap-3 text-sm font-medium md:flex">
                <User className="h-5 w-5" />
                <span>User: {cashierName}</span>
              </div>
              <div className="hidden h-8 w-px bg-[#1f2a4a] md:block" />
              <div className="hidden items-center gap-3 text-sm font-medium sm:flex">
                <Wifi className={`h-5 w-5 ${online ? 'text-[#20c75a]' : 'text-[#f97316]'}`} />
                <span>{online ? 'Online' : 'Offline'}</span>
              </div>
              <div className="h-8 w-px bg-[#1f2a4a]" />
              <div className="text-center leading-tight">
                <div className="text-[18px] font-bold">{displayTime}</div>
                <div className="text-[14px] text-[#94a3b8]">{displayDate}</div>
              </div>
              <div className="h-8 w-px bg-[#1f2a4a]" />
              <button
                type="button"
                onClick={() => setCalcOpen((v) => !v)}
                aria-pressed={calcOpen}
                className={`grid h-11 w-11 place-items-center rounded-full transition hover:bg-[#1a2547] hover:text-white ${calcOpen ? 'bg-[#1a2547] text-white' : 'text-[#cbd5e1]'}`}
                title="Calculator"
              >
                <Calculator className="h-6 w-6" />
              </button>
              <div className="h-8 w-px bg-[#1f2a4a]" />
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="grid h-11 w-11 place-items-center rounded-full text-[#cbd5e1] transition hover:bg-[#1a2547] hover:text-white"
                title="Back to dashboard"
              >
                <Home className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl bg-[#1a2547] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e11d48]"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </header>

          {calcOpen && <PosCalculator onClose={() => setCalcOpen(false)} />}

          <main className="grid h-[calc(100vh-78px)] grid-cols-1 gap-4 overflow-hidden p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="dashboard-panel min-h-0 overflow-hidden px-5 py-6">
              <div className="mb-6 grid gap-4 lg:grid-cols-[130px_minmax(240px,1fr)] lg:items-center">
                <h2 className="text-[24px] font-bold tracking-[-0.02em]">Products</h2>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#767b88]" />
                  <input
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                    placeholder="Search products by name, SKU, category, barcode, or tags..."
                    className="dashboard-field h-10 w-full pl-12 pr-4 text-[13px]"
                  />
                </div>
              </div>

              <div className="mb-4 flex gap-3 overflow-x-auto pb-1">
                {categoryOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedCategory(option.value)}
                    className={`h-8 shrink-0 rounded-[8px] px-3 text-[12px] font-medium transition ${
                      selectedCategory === option.value
                        ? 'bg-[#e8f3ff] text-[#0058c7]'
                        : 'bg-[#f2f3f6] text-[#676d78] hover:bg-[#e9edf3]'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>

              <div className="h-[calc(100%-118px)] overflow-y-auto pr-2">
                {loading ? (
                  <div className="grid h-full place-items-center text-[#6b7280]">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-[#1f57c8]" />
                      <span>Loading POS products...</span>
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <Package className="mx-auto mb-3 h-12 w-12 text-[#a1a7b3]" />
                      <h3 className="text-lg font-semibold">Unable to load sales point</h3>
                      <p className="mt-1 text-sm text-[#6b7280]">{errorMessage}</p>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <Package className="mx-auto mb-3 h-12 w-12 text-[#a1a7b3]" />
                      <h3 className="text-lg font-semibold">No products found</h3>
                      <p className="mt-1 text-sm text-[#6b7280]">Try another search term or category.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                    {filteredProducts.map(product => {
                      const quantity = cartQuantityForProduct(product.id)
                      const primaryImage = getProductImage(product)
                      const outOfStock = Number(product.quantity || 0) <= quantity

                      return (
                        <article
                          key={product.id}
                          className={`rounded-[8px] border bg-white p-2 transition ${
                            quantity > 0
                              ? 'border-[#1f57c8] shadow-[0_0_0_1px_rgba(31,87,200,0.1)]'
                              : 'border-[#edf0f4] hover:border-[#d7dce5] hover:shadow-[0_12px_24px_rgba(15,23,42,0.06)]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => addProduct(product)}
                            disabled={!isSaleActive || outOfStock}
                            className="relative mb-2 h-[104px] w-full overflow-hidden rounded-[7px] bg-[#f4f5f7] disabled:cursor-default"
                            title={isSaleActive ? 'Add product' : 'Start a sale to add products'}
                          >
                            {primaryImage ? (
                              <Image
                                src={primaryImage}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 180px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="grid h-full place-items-center">
                                <Package className="h-12 w-12 text-[#aeb4bf]" />
                              </div>
                            )}
                          </button>

                          <div className="space-y-1">
                            <div className="min-h-[34px]">
                              <h3 className="line-clamp-2 text-[11px] font-bold leading-snug text-[#171b25]">
                                {product.name}
                              </h3>
                              <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-[#808794]">
                                <span className="truncate">{product.category || 'Product'}</span>
                                <span className="shrink-0">SKU: {product.sku || product.id.slice(0, 7).toUpperCase()}</span>
                              </div>
                            </div>

                            <div className="flex items-end justify-between gap-2">
                              <div>
                                <p className="text-[14px] font-extrabold leading-tight">{formatMoney(product.sellingPrice)}</p>
                                <p className="text-[8px] text-[#7d8491]">Stock: {product.quantity || 0} {product.unitOfMeasure || 'pcs'}</p>
                              </div>

                              {isSaleActive && (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => reduceProduct(product.id)}
                                    disabled={quantity === 0}
                                    className="grid h-6 w-6 place-items-center rounded-[6px] bg-[#004aad] text-white shadow-sm transition hover:bg-[#003d8f] disabled:bg-[#d6dbe6]"
                                    title="Decrease quantity"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="min-w-3 text-center text-[14px] font-semibold">{quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => addProduct(product)}
                                    disabled={outOfStock}
                                    className="grid h-6 w-6 place-items-center rounded-[6px] bg-[#004aad] text-white shadow-sm transition hover:bg-[#003d8f] disabled:bg-[#d6dbe6]"
                                    title="Increase quantity"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            <aside className="min-h-0 overflow-hidden rounded-[8px]">
              {isSaleActive ? (
                <section className="dashboard-panel flex h-full flex-col p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-[24px] font-bold tracking-[-0.02em]">Record Sale</h2>
                    <button
                      type="button"
                      onClick={() => setIsSaleActive(false)}
                      className="grid h-8 w-8 place-items-center rounded-full text-[#06112b] transition hover:bg-[#f2f4f7]"
                      title="Close sale panel"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="-mr-1 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
                    <label className="block">
                      <span className="mb-2 block text-[14px] font-bold">Customer name</span>
                      <input
                        value={customerName}
                        onChange={event => setCustomerName(event.target.value)}
                        placeholder="Customer name"
                        className="dashboard-field h-10 w-full px-4 text-[13px]"
                      />
                    </label>

                    <div>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-[20px] font-bold">Ordered Items</h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleHoldSale}
                            disabled={savingHold || cartItems.length === 0}
                            className="rounded-[5px] bg-[#eef5ff] px-2 py-1 text-[11px] font-medium text-[#2360c8] disabled:opacity-50"
                          >
                            {savingHold ? 'Holding...' : 'Hold Sale'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (cartItems.length === 0 || window.confirm('Clear this sale? All items in the cart will be removed.')) {
                                void handleClearSale()
                              }
                            }}
                            disabled={cartItems.length === 0}
                            className="rounded-[5px] bg-[#fff1ee] px-2 py-1 text-[11px] font-medium text-[#f04438] disabled:opacity-50"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>

                      <div className="border-b border-dashed border-[#aeb4bf] pb-4">
                        {cartItems.length === 0 ? (
                          <div className="grid min-h-[140px] place-items-center text-center text-[#777e8b]">
                            <div>
                              <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-[#c1c7d0]" />
                              <p className="text-sm font-semibold">No items selected</p>
                              <p className="mt-1 text-xs">Add products from the grid.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {cartItems.map(item => {
                              const gross = lineGross(item)
                              const itemDiscountAmount = lineDiscountAmount(item)
                              const itemSubtotal = lineSubtotal(item)
                              const itemDiscountError = discountValidationMessage(numberFromInput(item.discount), item.discountType, gross, 'Line')

                              return (
                                <div key={item.productId} className="rounded-[8px] border border-[#edf0f4] bg-white p-3">
                                  <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-3">
                                    <button
                                      type="button"
                                      onClick={() => removeCartItem(item.productId)}
                                      className="mt-0.5 grid h-6 w-6 place-items-center rounded-[5px] bg-[#fff1ee] text-[#ef4444]"
                                      title="Remove item"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                    <div className="min-w-0">
                                      <p className="text-[14px] font-semibold text-[#141925]">
                                        <span className="mr-2 text-[#7a818f]">{item.quantity}x</span>
                                        {item.productName}
                                      </p>
                                      <p className="mt-1 text-[11px] font-medium text-[#7a818f]">
                                        Gross {formatMoney(gross)} - Unit {formatMoney(item.unitPrice)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[14px] font-bold">{formatMoney(itemSubtotal)}</p>
                                      {itemDiscountAmount > 0 && (
                                        <p className="text-[11px] font-semibold text-[#d92d20]">-{formatMoney(itemDiscountAmount)}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_112px] gap-2">
                                    <label>
                                      <span className="mb-1 block text-[11px] font-bold text-[#777e8b]">Line discount</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.discount}
                                        onChange={event => updateCartItemDiscount(item.productId, { discount: event.target.value })}
                                        className={`dashboard-field h-9 w-full px-3 text-[12px] ${itemDiscountError ? 'border-[#f04438]' : ''}`}
                                        placeholder="0"
                                      />
                                    </label>
                                    <label>
                                      <span className="mb-1 block text-[11px] font-bold text-[#777e8b]">Type</span>
                                      <select
                                        value={item.discountType}
                                        onChange={event => updateCartItemDiscount(item.productId, { discountType: event.target.value as DiscountType })}
                                        className="dashboard-field h-9 w-full px-2 text-[12px]"
                                      >
                                        <option value="fixed">Fixed</option>
                                        <option value="percentage">Percentage</option>
                                      </select>
                                    </label>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
                                    <span className={itemDiscountError ? 'text-[#d92d20]' : 'text-[#7a818f]'}>
                                      {itemDiscountError || `Discount amount: ${formatMoney(itemDiscountAmount)}`}
                                    </span>
                                    <span className="text-[#141925]">Subtotal: {formatMoney(itemSubtotal)}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 rounded-[8px] bg-[#f8fafc] p-3">
                      <div className="flex items-center justify-between text-[13px] font-semibold text-[#777e8b]">
                        <span>Subtotal ({cartQuantity} items)</span>
                        <span>{formatMoney(subtotal)}</span>
                      </div>
                      {taxRatePercent > 0 && (
                        <div className="flex items-center justify-between text-[13px] font-semibold text-[#777e8b]">
                          <span>Tax ({taxRatePercent}%)</span>
                          <span>{formatMoney(taxAmount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[13px] font-semibold text-[#d92d20]">
                        <span>Cart discount amount</span>
                        <span>-{formatMoney(discountAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-[#d9dee7] pt-2">
                        <span className="text-[16px] font-bold text-[#141925]">Total</span>
                        <span className="text-[24px] font-extrabold">{formatMoney(totalAmount)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[15px] font-semibold text-[#777e8b]">Tax rate (%)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={taxRateInput}
                        onChange={event => {
                          setTaxRateTouched(true)
                          setTaxRateInput(event.target.value)
                        }}
                        placeholder="0"
                        className="dashboard-field h-10 w-full px-3 text-[13px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[15px] font-semibold text-[#777e8b]">Cart discount</span>
                      <div className="grid grid-cols-[minmax(0,1fr)_112px] items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discount}
                          onChange={event => setDiscount(event.target.value)}
                          placeholder="0"
                          className={`dashboard-field h-10 w-full px-3 text-[13px] ${cartDiscountValidation ? 'border-[#f04438]' : ''}`}
                        />
                        <select
                          value={discountType}
                          onChange={event => setDiscountType(event.target.value as DiscountType)}
                          className="dashboard-field h-10 px-2 text-[13px]"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>
                    </div>
                    {saleValidationMessage && (
                      <p className="rounded-[8px] bg-[#fff1ee] px-3 py-2 text-[12px] font-semibold text-[#d92d20]">
                        {saleValidationMessage}
                      </p>
                    )}

                    <label className="block">
                      <span className="mb-1 block text-[13px] font-bold text-[#777e8b]">Notes</span>
                      <textarea
                        value={notes}
                        onChange={event => setNotes(event.target.value)}
                        placeholder="Optional sale notes"
                        rows={2}
                        className="dashboard-field w-full resize-none px-4 py-2 text-[13px]"
                      />
                    </label>

                    <div>
                      <p className="mb-3 text-[14px] font-bold">Payment method</p>
                      <div className="flex flex-wrap gap-3">
                        {POS_PAYMENT_METHODS.map(method => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id)}
                            className={`h-10 rounded-[8px] px-4 text-[13px] font-semibold transition ${
                              paymentMethod === method.id
                                ? 'bg-[#e8f3ff] text-[#0058c7]'
                                : 'bg-[#f3f3f4] text-[#747b88] hover:bg-[#e9edf3]'
                            }`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCompleteSale}
                    disabled={submitting || cartItems.length === 0 || Boolean(saleValidationMessage)}
                    className="dashboard-action-primary mt-4 flex h-12 w-full shrink-0 text-[18px] disabled:bg-[#aeb9d2]"
                  >
                    {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                    Complete Sale
                  </button>
                </section>
              ) : selectedRecentSale?.kind === 'sale' ? (
                <section className="dashboard-panel flex h-full flex-col p-5">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-[24px] font-bold tracking-[-0.02em]">Recent Sale</h2>
                    <button
                      type="button"
                      onClick={() => setSelectedRecentSale(null)}
                      className="grid h-8 w-8 place-items-center rounded-full text-[#06112b] transition hover:bg-[#f2f4f7]"
                      title="Close recent sale"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mb-8">
                    <p className="mb-2 text-[14px] font-bold">Customer name</p>
                    <div className="flex h-10 items-center rounded-[8px] bg-[#f3f3f4] px-4 text-[13px] text-[#777e8b]">
                      {selectedRecentSale.receipt.customerName || 'No ID'}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto border-b border-dashed border-[#aeb4bf] pb-4">
                    <h3 className="mb-4 text-[20px] font-bold">Ordered Items</h3>
                    <div className="space-y-7">
                      {selectedRecentSale.receipt.items.map((item, index) => (
                        <div key={`${item.productName}-${index}`} className="flex items-start justify-between gap-4">
                          <p className="text-[14px] font-semibold">
                            <span className="mr-2 text-[#7a818f]">{item.quantity}x</span>
                            {item.productName}
                          </p>
                          <p className="text-[14px] font-bold">{formatMoney(item.lineSubtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-7 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[16px] font-semibold text-[#777e8b]">
                        Total ({selectedRecentSale.receipt.items.reduce((sum, item) => sum + item.quantity, 0)} items)
                      </span>
                      <span className="text-[24px] font-extrabold">{formatMoney(selectedRecentSale.receipt.totalAmount).replace(' ', '')}</span>
                    </div>

                    <div>
                      <p className="mb-5 text-[14px] font-bold">Payment method</p>
                      <p className="text-[14px] font-semibold text-[#777e8b]">{selectedRecentSale.receipt.paymentMethod}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openReceiptFromRecent(selectedRecentSale)}
                      className="dashboard-action-primary mt-auto h-12 w-full text-[18px]"
                    >
                      View Receipt
                    </button>
                  </div>
                </section>
              ) : (
                <div className="flex h-full flex-col gap-4">
                  <section className="dashboard-panel flex min-h-[340px] basis-[46%] flex-col p-5">
                    <h2 className="text-[24px] font-bold tracking-[-0.02em]">Record Sale</h2>
                    <div className="grid flex-1 place-items-center text-center">
                      <div className="text-[#777e8b]">
                        <p className="text-[15px] font-bold">Sales Point</p>
                        <p className="mt-2 text-[13px]">Click the button to Record a sale</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={startSale}
                      className="dashboard-action-primary h-12 text-[18px]"
                    >
                      Record Sale
                    </button>
                  </section>

                  <section className="dashboard-panel flex min-h-0 flex-1 flex-col p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="text-[18px] font-bold">Recent Sales</h2>
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard/sales/history')}
                        className="h-9 rounded-[8px] border border-[#e5e8ef] px-4 text-[13px] font-semibold text-[#6b7280] transition hover:bg-[#f6f8fb]"
                      >
                        View all
                      </button>
                    </div>

                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                      {recentEntries.length === 0 ? (
                        <div className="grid h-full min-h-[180px] place-items-center text-center text-[#777e8b]">
                          <div>
                            <Clock className="mx-auto mb-3 h-8 w-8 text-[#c1c7d0]" />
                            <p className="text-sm font-semibold">No recent sales</p>
                          </div>
                        </div>
                      ) : (
                        recentEntries.slice(0, 5).map(entry => (
                          <button
                            key={`${entry.kind}-${entry.id}`}
                            type="button"
                            onClick={() => entry.kind === 'held' ? handleResumeHeldSale(entry.heldSale) : setSelectedRecentSale(entry)}
                            className="w-full rounded-[8px] border border-[#edf0f4] p-3 text-left transition hover:border-[#d7dce5] hover:bg-[#fbfcfd]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className={`truncate text-[16px] font-semibold ${entry.kind === 'held' ? 'text-[#c47a00]' : 'text-[#141925]'}`}>
                                  {entry.title}
                                </p>
                                <p className="mt-2 text-[14px] text-[#777e8b]">
                                  {entry.kind === 'held'
                                    ? `${entry.itemCount} item${entry.itemCount === 1 ? '' : 's'}`
                                    : `${new Date(entry.timestamp).toLocaleDateString()} - ${new Date(entry.timestamp).toLocaleTimeString()}`}
                                </p>
                              </div>
                              {entry.kind === 'held' ? (
                                <span className="rounded-[8px] bg-[#eef5ff] px-3 py-2 text-[12px] font-bold text-[#2360c8]">Resume</span>
                              ) : (
                                <span className="shrink-0 text-[13px] text-[#777e8b]">{entry.itemCount} item{entry.itemCount === 1 ? '' : 's'}</span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}
            </aside>
          </main>

          {receiptSale && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-[#061124]/55 p-4 backdrop-blur-[6px]">
              <section className="flex max-h-[92vh] w-full max-w-[606px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_24px_70px_rgba(6,17,36,0.28)]">
                <div className="flex items-center justify-between border-b border-[#cfd4dd] px-9 py-6">
                  <h2 className="text-[24px] font-bold">Receipt Preview</h2>
                  <button
                    type="button"
                    onClick={() => setReceiptSale(null)}
                    className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-[#f2f4f7]"
                    title="Close receipt"
                  >
                    <X className="h-7 w-7" />
                  </button>
                </div>

                <div ref={receiptRef} className="min-h-0 flex-1 overflow-y-auto px-9 py-7">
                  <div className="border-b border-[#cfd4dd] pb-6 text-center">
                    <h3 className="text-[24px] font-extrabold">{receiptBusinessName}</h3>
                    {receiptHeaderText ? (
                      <p className="text-[16px] text-[#7a818f]">{receiptHeaderText}</p>
                    ) : null}
                    {receiptBusinessPhone ? (
                      <p className="text-[16px] text-[#7a818f]">{receiptBusinessPhone}</p>
                    ) : null}
                    {receiptBusinessAddress ? (
                      <p className="text-[16px] text-[#7a818f]">{receiptBusinessAddress}</p>
                    ) : null}
                    <p className="text-[16px] text-[#7a818f]">Sales Receipt</p>
                    <p className="text-[16px] text-[#7a818f]">{new Date(receiptSale.timestamp).toLocaleString()}</p>
                  </div>

                  <div className="space-y-5 border-b border-[#cfd4dd] py-6">
                    <div className="flex justify-between gap-5 text-[16px]">
                      <span className="text-[#7a818f]">Receipt #:</span>
                      <span className="font-semibold">{saleRef(receiptSale.id, receiptSale.saleNumber)}</span>
                    </div>
                    <div className="flex justify-between gap-5 text-[16px]">
                      <span className="text-[#7a818f]">Payment Method:</span>
                      <span className="font-semibold">{receiptSale.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between gap-5 text-[16px]">
                      <span className="text-[#7a818f]">Cashier:</span>
                      <span className="font-semibold">{receiptSale.cashierName}</span>
                    </div>
                  </div>

                  <div className="border-b border-[#cfd4dd] py-6">
                    <h4 className="mb-4 text-[16px] font-bold">Items:</h4>
                    <div className="space-y-5">
                      {receiptSale.items.map((item, index) => (
                        <div key={`${item.productName}-${index}`} className="flex justify-between gap-5">
                          <div>
                            <p className="text-[16px] font-bold">{item.productName}</p>
                            <p className="text-[16px] text-[#7a818f]">{item.quantity} x {formatMoney(item.unitPrice)}</p>
                            {item.discountAmount ? (
                              <p className="text-[14px] text-[#d92d20]">
                                Discount: -{formatMoney(item.discountAmount)}
                              </p>
                            ) : null}
                          </div>
                          <p className="self-end text-[16px] font-bold">{formatMoney(item.lineSubtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5 border-b border-[#cfd4dd] py-6">
                    <div className="flex justify-between text-[16px]">
                      <span>Subtotal:</span>
                      <span className="font-bold">{formatMoney(receiptSale.subtotal)}</span>
                    </div>
                    {receiptSale.discount ? (
                      <div className="flex justify-between text-[16px]">
                        <span>Discount:</span>
                        <span className="font-bold">-{formatMoney(receiptSale.discountAmount || receiptSale.discount)}</span>
                      </div>
                    ) : null}
                    {receiptSale.tax ? (
                      <div className="flex justify-between text-[16px]">
                        <span>Tax:</span>
                        <span className="font-bold">{formatMoney(receiptSale.tax)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-[20px] font-extrabold">
                      <span>Total:</span>
                      <span>{formatMoney(receiptSale.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="py-5 text-center text-[16px] text-[#7a818f]">
                    <p>{receiptThankYouMessage}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#f5f5f6] px-9 py-9">
                  <button
                    type="button"
                    onClick={printReceipt}
                    className="flex h-[52px] items-center justify-center gap-3 rounded-[9px] bg-[#347bd4] py-4 text-[16px] font-bold text-white transition hover:bg-[#2365b5]"
                  >
                    <Printer className="h-5 w-5" />
                    Print Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptSale(null)}
                    className="h-[52px] rounded-[9px] border border-[#cfd4dd] py-4 text-[16px] font-bold text-[#777e8b] transition hover:bg-white"
                  >
                    Skip
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </StaffProtectedRoute>
    </ProtectedRoute>
  )
}

export default function SalesPage() {
  return <SalesPOSContent />
}
