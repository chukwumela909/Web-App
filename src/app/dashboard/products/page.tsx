'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { 
  CubeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  QrCodeIcon,
  XMarkIcon,
  CheckIcon,
  TagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsRightLeftIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Product as FPProduct, ProductImage, createProduct, getProducts, updateProduct } from '@/lib/firestore'
import { uploadMultipleProductImages, UploadProgress } from '@/lib/imagekit'
import { addSupplierLinkToProduct } from '@/lib/product-enhancements'
import SupplierSelection from '@/components/products/SupplierSelection'
import EnhancedProductDetail from '@/components/products/EnhancedProductDetail'
import BulkUpload from '@/components/products/BulkUpload'
import { getBranches } from '@/lib/branches-service'
import { Branch } from '@/lib/branches-types'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { UpgradeModal } from '@/components/UpgradeModal'

const categories = [
  "All Categories",
  "General Hardware",
  "Plumbing",
  "Electrical",
  "Tools & Equipment",
  "Building Materials",
  "Paints & Finishes",
  "Safety & Security",
  "Garden & Outdoor",
  "Fasteners & Fixings",
  "Electronics",
  "Food & Beverages", 
  "Clothing",
  "Beauty & Health",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Automotive",
  "Toys & Games"
]

const units = [
  "pcs", "kg", "g", "litre", "ml", "box", "pack", "bottle", "can", "bag", "roll", "meter", "feet", "dozen",
  "inches", "yards", "square meter", "square feet", "cubic meter", "length", "coil", "bundle", "set", "pair"
]

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

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

type FormStep = 'basic' | 'pricing' | 'advanced'

interface ProductFormData {
  name: string
  sku: string
  category: string
  description: string
  costPrice: string
  sellingPrice: string
  quantity: string
  minStockLevel: string
  unitOfMeasure: string
  supplier: string // LEGACY: Keep for backward compatibility
  location: string
  barcode: string
  batchNumber: string
  tags: string
  isPerishable: boolean
  lowStockAlertEnabled: boolean
  expiryDate: string
  images: ProductImage[]
  selectedFiles: File[]
  branchId: string // NEW: Branch assignment for product
  
  // NEW ENHANCED FIELDS - Supplier Integration
  selectedSuppliers: Array<{
    supplierId: string
    supplierName: string
    isPrimary: boolean
    leadTimeInDays?: number
    minimumOrderQuantity?: number
  }>
  preferredSupplierId: string
}

function ProductsPageContent() {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<FPProduct | null>(null)
  const [currentStep, setCurrentStep] = useState<FormStep>('basic')
  const [products, setProducts] = useState<FPProduct[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showSellingValue, setShowSellingValue] = useState(false)
  const [showEnhancedDetail, setShowEnhancedDetail] = useState(false)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<FPProduct | null>(null)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [branchesLoading, setBranchesLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeModalData, setUpgradeModalData] = useState<{
    feature: 'products'
    currentCount: number
    limit: number
    message: string
  } | null>(null)
  const { user } = useAuth()
  const currency = useCurrency()
  const currencySymbol = getCurrencySymbol(currency)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canAddProduct } = usePlanLimits()

  // Enhanced Product Form State
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '',
    sku: '',
    category: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '',
    minStockLevel: '',
    unitOfMeasure: 'pcs',
    supplier: '', // LEGACY: Keep for backward compatibility
    location: '',
    barcode: '',
    batchNumber: '',
    tags: '',
    isPerishable: false,
    lowStockAlertEnabled: true,
    expiryDate: '',
    images: [],
    selectedFiles: [],
    branchId: '', // Will be set to default branch when branches load
    
    // NEW ENHANCED FIELDS
    selectedSuppliers: [],
    preferredSupplierId: ''
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    const currentCount = productForm.images.length + productForm.selectedFiles.length
    const totalCount = currentCount + files.length
    if (totalCount > 3) {
      alert(`Maximum 3 images allowed. You can add ${3 - currentCount} more images.`)
      return
    }

    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file.`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`${file.name} is too large. Maximum size is 5MB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setProductForm(prev => ({
      ...prev,
      selectedFiles: [...prev.selectedFiles, ...validFiles]
    }))

    // Start upload process
    if (user) {
      setIsUploading(true)
      try {
        const productId = editingProduct?.id || crypto.randomUUID()
        const uploadedImages = await uploadMultipleProductImages(
          validFiles,
          productId,
          setUploadProgress
        )

        setProductForm(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedImages.map((img, index) => ({
            ...img,
            isPrimary: prev.images.length === 0 && index === 0 // First image is primary
          }))],
          selectedFiles: prev.selectedFiles.filter(file => !validFiles.includes(file))
        }))
      } catch (error) {
        console.error('Image upload failed:', error)
        alert('Failed to upload some images. Please try again.')
        // Remove failed files from selectedFiles
        setProductForm(prev => ({
          ...prev,
          selectedFiles: prev.selectedFiles.filter(file => !validFiles.includes(file))
        }))
      } finally {
        setIsUploading(false)
        setUploadProgress([])
      }
    }

    // Clear the input
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const setPrimaryImage = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }))
  }

  const resetForm = () => {
    setProductForm({
      name: '',
      sku: '',
      category: '',
      description: '',
      costPrice: '',
      sellingPrice: '',
      quantity: '',
      minStockLevel: '',
      unitOfMeasure: 'pcs',
      supplier: '', // LEGACY: Keep for backward compatibility
      location: '',
      barcode: '',
      batchNumber: '',
      tags: '',
      isPerishable: false,
      lowStockAlertEnabled: true,
      expiryDate: '',
      images: [],
      selectedFiles: [],
      
      // NEW ENHANCED FIELDS
      selectedSuppliers: [],
      preferredSupplierId: ''
    })
    setCurrentStep('basic')
    setEditingProduct(null)
    setUploadProgress([])
    setIsUploading(false)
  }

  // Enhanced Product Handlers
  const handleSuppliersChange = (suppliers: typeof productForm.selectedSuppliers) => {
    setProductForm(prev => ({
      ...prev,
      selectedSuppliers: suppliers,
      preferredSupplierId: suppliers.find(s => s.isPrimary)?.supplierId || ''
    }))
  }

  const handleShowEnhancedDetail = (product: FPProduct) => {
    setSelectedProductForDetail(product)
    setShowEnhancedDetail(true)
  }

  const handleUpdateProduct = async (updates: Partial<FPProduct>) => {
    if (!selectedProductForDetail) return
    
    try {
      await updateProduct(selectedProductForDetail.id, updates)
      // Refresh products list
      if (user) {
        const updatedProducts = await getProducts(user.uid)
        setProducts(updatedProducts)
      }
      // Update the selected product for detail view
      setSelectedProductForDetail(prev => prev ? { ...prev, ...updates } : null)
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      const list = await getProducts(user.uid)
      setProducts(list)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }, [user])

  useEffect(() => { fetchData() }, [user, fetchData])

  // Load branches for branch selector
  useEffect(() => {
    const loadBranches = async () => {
      if (!user?.uid) return
      
      try {
        setBranchesLoading(true)
        const userBranches = await getBranches(user.uid)
        setBranches(userBranches)
        
        // Set default branch for new products
        if (userBranches.length > 0 && !productForm.branchId) {
          const defaultBranch = userBranches.find(b => b.status === 'ACTIVE') || userBranches[0]
          setProductForm(prev => ({ ...prev, branchId: defaultBranch.id }))
        }
      } catch (error) {
        console.error('Error loading branches:', error)
      } finally {
        setBranchesLoading(false)
      }
    }

    loadBranches()
  }, [user?.uid])

  useEffect(() => {
    const newParam = searchParams?.get('new')
    const editParam = searchParams?.get('edit')
    
    if (newParam) {
      setShowAddProduct(true)
      router.replace('/dashboard/products')
    } else if (editParam && products.length > 0) {
      // Find the product to edit
      const productToEdit = products.find(p => p.id === editParam)
      if (productToEdit) {
        handleEdit(productToEdit)
        setShowEditProduct(true)
        // Clean up URL after setting up edit
        setTimeout(() => {
          router.replace('/dashboard/products')
        }, 100)
      } else {
        // Product not found, just clean up URL
        router.replace('/dashboard/products')
      }
    }
  }, [searchParams, router, products])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Check product limit for new products only (not when editing)
    if (!editingProduct) {
      const limitCheck = await canAddProduct()
      if (!limitCheck.allowed) {
        setUpgradeModalData({
          feature: 'products',
          currentCount: limitCheck.currentCount,
          limit: typeof limitCheck.limit === 'number' ? limitCheck.limit : 0,
          message: limitCheck.message || 'Product limit reached'
        })
        setShowUpgradeModal(true)
        return
      }
    }

    const primaryImage = productForm.images.find(img => img.isPrimary)
    
    // Convert selected suppliers to supplier links format
    const supplierLinks = productForm.selectedSuppliers.map(supplier => ({
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      isPrimary: supplier.isPrimary,
      leadTimeInDays: supplier.leadTimeInDays,
      minimumOrderQuantity: supplier.minimumOrderQuantity
      // Note: Omit optional fields that are undefined instead of setting them to undefined
    }))

    const productData = {
      name: productForm.name,
      sku: productForm.sku || crypto.randomUUID().slice(0, 8).toUpperCase(),
      category: productForm.category,
      description: productForm.description,
      costPrice: Number(productForm.costPrice || 0),
      sellingPrice: Number(productForm.sellingPrice || 0),
      quantity: Number(productForm.quantity || 0),
      minStockLevel: Number(productForm.minStockLevel || 0),
      unitOfMeasure: productForm.unitOfMeasure,
      supplier: productForm.supplier || '', // LEGACY: Keep for backward compatibility
      location: productForm.location || '',
      barcode: productForm.barcode || null,
      batchNumber: productForm.batchNumber || null,
      tags: productForm.tags || '',
      isPerishable: productForm.isPerishable,
      lowStockAlertEnabled: productForm.lowStockAlertEnabled,
      expiryDate: productForm.expiryDate ? new Date(productForm.expiryDate).getTime() : null,
      images: productForm.images,
      imageUrl: primaryImage?.url || null, // Backward compatibility
      branchId: productForm.branchId || null, // NEW: Branch assignment
      
      // NEW ENHANCED FIELDS
      supplierLinks: supplierLinks,
      preferredSupplierId: productForm.preferredSupplierId || null,
      lastSupplierId: null,
      lastPurchasePrice: null,
      averagePurchasePrice: null,
      lastPurchaseDate: null
    }

    try {
      if (editingProduct) {
        // Clean the product data to remove any undefined values before saving to Firestore
        const cleanedProductData = cleanFirestoreData(productData)
        await updateProduct(editingProduct.id, cleanedProductData)
      } else {
        const productId = productData.sku || crypto.randomUUID()
        
        // Clean the product data to remove any undefined values before saving to Firestore
        const cleanedProductData = cleanFirestoreData({ ...productData, id: productId })
        await createProduct(user.uid, cleanedProductData)
        
        // Add supplier links if any
        for (const link of supplierLinks) {
          try {
            await addSupplierLinkToProduct(productId, link.supplierId, link)
          } catch (error) {
            console.warn('Failed to add supplier link:', error)
          }
        }
      }
      setShowAddProduct(false)
      setShowEditProduct(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Failed to save product. Please try again.')
    }
  }

  const handleEdit = (product: FPProduct) => {
    setEditingProduct(product)
    
    // Handle both new images array and legacy imageUrl
    let images: ProductImage[] = []
    if (product.images && product.images.length > 0) {
      images = product.images
    } else if (product.imageUrl) {
      // Convert legacy imageUrl to new format
      images = [{
        url: product.imageUrl,
        fileId: 'legacy',
        name: 'legacy-image',
        isPrimary: true
      }]
    }
    
    // Convert supplier links to form format
    const selectedSuppliers = (product.supplierLinks || []).map(link => ({
      supplierId: link.supplierId,
      supplierName: link.supplierName,
      isPrimary: link.isPrimary,
      leadTimeInDays: link.leadTimeInDays,
      minimumOrderQuantity: link.minimumOrderQuantity
    }))
    
    setProductForm({
      name: product.name,
      sku: product.sku || '',
      category: product.category,
      description: product.description || '',
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      quantity: product.quantity.toString(),
      minStockLevel: product.minStockLevel.toString(),
      unitOfMeasure: product.unitOfMeasure || 'pcs',
      supplier: product.supplier || '', // LEGACY: Keep for backward compatibility
      location: product.location || '',
      barcode: product.barcode || '',
      batchNumber: product.batchNumber || '',
      tags: product.tags || '',
      isPerishable: product.isPerishable || false,
      lowStockAlertEnabled: product.lowStockAlertEnabled ?? true,
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
      images: images,
      selectedFiles: [],
      branchId: (product as any).branchId || '', // Include branchId for editing
      
      // NEW ENHANCED FIELDS
      selectedSuppliers: selectedSuppliers,
      preferredSupplierId: product.preferredSupplierId || ''
    })
    setShowEditProduct(true)
  }



  const lowStockCount = useMemo(() => products.filter(p => p.quantity <= p.minStockLevel && p.quantity > 0).length, [products])
  const totalProducts = products.length
  const totalCostValue = useMemo(() => products.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0), [products])
  const totalSellingValue = useMemo(() => products.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0), [products])

  const nextStep = () => {
    if (currentStep === 'basic') setCurrentStep('pricing')
    else if (currentStep === 'pricing') setCurrentStep('advanced')
  }

  const previousStep = () => {
    if (currentStep === 'advanced') setCurrentStep('pricing')
    else if (currentStep === 'pricing') setCurrentStep('basic')
  }

  const canProceedToNext = () => {
    if (currentStep === 'basic') {
      return productForm.name.trim() !== '' && productForm.category !== ''
    }
    if (currentStep === 'pricing') {
      return productForm.sellingPrice !== '' && Number(productForm.sellingPrice) > 0
    }
    return true
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          feature={upgradeModalData?.feature}
          currentCount={upgradeModalData?.currentCount}
          limit={upgradeModalData?.limit}
          message={upgradeModalData?.message}
        />
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerChildren}
          className="space-y-6"
        >
          {/* Overview Section - Mobile App Style */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-xl font-bold text-foreground mb-6">Overview</h2>
            
            {/* First Row - Total Products and Cost Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                  <CubeIcon className="h-6 w-6 text-[#2175C7]" />
                  <span className="text-sm font-medium text-muted-foreground">Total Products</span>
                </div>
                <p className="text-3xl font-bold text-card-foreground">{totalProducts}</p>
              </div>
              
              <div 
                onClick={() => setShowSellingValue(!showSellingValue)}
                className="bg-card rounded-xl p-6 shadow-sm border border-border cursor-pointer hover:shadow-md transition-all duration-200"
              >
                {/* Header with icon and toggle indicator */}
                <div className="flex items-center justify-between mb-4">
                  <TagIcon className="h-6 w-6 text-[#66BB6A]" />
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-[#2175C7]">
                      {showSellingValue ? "Selling" : "Cost"}
                    </span>
                    <ArrowsRightLeftIcon className="h-4 w-4 text-[#2175C7]" />
                  </div>
                </div>
                
                <div className="mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {showSellingValue ? "Selling Value" : "Cost Value"}
                  </span>
                </div>
                
                <p className="text-3xl font-bold text-card-foreground mb-2">
                  {currencySymbol} {Math.round(showSellingValue ? totalSellingValue : totalCostValue).toLocaleString()}
                </p>
                
                {/* Profit/Potential indicator */}
                {totalSellingValue > totalCostValue && (
                  <p className="text-sm font-medium text-[#66BB6A]">
                    {showSellingValue 
                      ? `Profit: KSh ${Math.round(totalSellingValue - totalCostValue).toLocaleString()}`
                      : `Potential: KSh ${Math.round(totalSellingValue).toLocaleString()}`
                    }
                  </p>
                )}
              </div>
            </div>
            
            {/* Second Row - Low Stock and Out of Stock */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-[#F29F05]" />
                  <span className="text-sm font-medium text-muted-foreground">Low Stock</span>
                </div>
                <p className="text-3xl font-bold text-card-foreground">{lowStockCount}</p>
              </div>
              
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-[#DC2626]" />
                  <span className="text-sm font-medium text-muted-foreground">Out of Stock</span>
                </div>
                <p className="text-3xl font-bold text-card-foreground">{products.filter(p => p.quantity === 0).length}</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Section - Mobile App Style */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-xl font-bold text-foreground mb-6">Quick Actions</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={async () => {
                  const limitCheck = await canAddProduct()
                  if (!limitCheck.allowed) {
                    setUpgradeModalData({
                      feature: 'products',
                      currentCount: limitCheck.currentCount,
                      limit: typeof limitCheck.limit === 'number' ? limitCheck.limit : 0,
                      message: limitCheck.message || 'Product limit reached'
                    })
                    setShowUpgradeModal(true)
                  } else {
                    setShowAddProduct(true)
                  }
                }}
                className="bg-[#E3F2FD] hover:bg-[#d9edfc] text-card-foreground rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md border border-border"
              >
                <div className="flex items-center justify-center space-x-3">
                  <PlusIcon className="h-5 w-5 text-[#2175C7]" />
                  <span className="font-medium text-sm">Add Product</span>
                </div>
              </button>
              
              <button 
                onClick={() => setShowBulkUpload(true)}
                className="bg-[#FFF3E0] hover:bg-[#FFECB3] text-card-foreground rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md border border-border"
              >
                <div className="flex items-center justify-center space-x-3">
                  <CloudArrowUpIcon className="h-5 w-5 text-[#F57C00]" />
                  <span className="font-medium text-sm">Bulk Upload</span>
                </div>
              </button>
              
              <button 
                onClick={() => router.push('/dashboard/products/browse')}
                className="bg-[#E8F5E8] hover:bg-[#dff3df] text-card-foreground rounded-xl p-6 transition-all duration-200 shadow-sm hover:shadow-md border border-border"
              >
                <div className="flex items-center justify-center space-x-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-[#2175C7]" />
                  <span className="font-medium text-sm">Browse Products</span>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Recently Added Section - Mobile App Style */}
          {products.length > 0 && (
            <motion.div variants={fadeInUp}>
              <h2 className="text-xl font-bold text-foreground mb-6">Recently Added</h2>
              <div className="space-y-4">
                {products
                  .sort((a, b) => {
                    const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0
                    const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0
                    return bTime - aTime
                  })
                  .slice(0, 3)
                  .map((product) => (
                    <div key={product.id} className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#004AAD] to-[#0056CC] flex items-center justify-center">
                          <CubeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-card-foreground">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.quantity} {product.unitOfMeasure || 'pcs'} - {product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#66BB6A]">{currencySymbol} {product.sellingPrice.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {product.quantity <= product.minStockLevel ? (
                              <span className="text-[#F29F05]">Low Stock</span>
                            ) : product.quantity === 0 ? (
                              <span className="text-[#DC2626]">Out of Stock</span>
                            ) : (
                              <span className="text-[#66BB6A]">In Stock</span>
                            )}
                          </p>
                          <button
                            onClick={() => router.push(`/dashboard/products/${product.id}`)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Enhanced Add/Edit Product Modal */}
          <AnimatePresence>
            {(showAddProduct || showEditProduct) && (
              <div className="fixed inset-0 bg-gradient-to-r from-black/40 via-black/50 to-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200"
                >
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">
                          {editingProduct ? 'Update Product' : 'Add New Product'}
                        </h2>
                        <p className="text-blue-100 mt-1">
                          {editingProduct ? 'Update product information' : 'Create new inventory item with all details'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddProduct(false)
                          setShowEditProduct(false)
                          resetForm()
                        }}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Step Indicator */}
                    <div className="mt-6 flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 ${currentStep === 'basic' ? 'text-white' : 'text-blue-200'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === 'basic' ? 'bg-white text-[#004AAD]' : 'bg-blue-700 text-white'
                        }`}>
                          1
                        </div>
                        <span className="text-sm font-medium">Basic Info</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-blue-600"></div>
                      <div className={`flex items-center space-x-2 ${currentStep === 'pricing' ? 'text-white' : 'text-blue-200'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === 'pricing' ? 'bg-white text-[#004AAD]' : 'bg-blue-700 text-white'
                        }`}>
                          2
                        </div>
                        <span className="text-sm font-medium">Pricing & Stock</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-blue-600"></div>
                      <div className={`flex items-center space-x-2 ${currentStep === 'advanced' ? 'text-white' : 'text-blue-200'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep === 'advanced' ? 'bg-white text-[#004AAD]' : 'bg-blue-700 text-white'
                        }`}>
                          3
                        </div>
                        <span className="text-sm font-medium">Advanced</span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="max-h-[calc(90vh-180px)] overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6">
                      {/* Step 1: Basic Information */}
                      {currentStep === 'basic' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                            
                            {/* Enhanced Product Images Upload */}
                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Images <span className="text-gray-500">(Max 3 images)</span>
                              </label>
                              
                              {/* Image Gallery */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                {productForm.images.map((image, index) => (
                                  <div key={index} className="relative group">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                                      <Image
                                        src={image.url}
                                        alt={`Product image ${index + 1}`}
                                        width={150}
                                        height={150}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    {image.isPrimary && (
                                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                        Primary
                                      </div>
                                    )}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                      {!image.isPrimary && (
                                        <button
                                          type="button"
                                          onClick={() => setPrimaryImage(index)}
                                          className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                                          title="Set as primary"
                                        >
                                          <CheckIcon className="h-3 w-3" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                                        title="Remove image"
                                      >
                                        <XMarkIcon className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Upload Progress Display */}
                                {uploadProgress.map((upload, index) => (
                                  <div key={`progress-${index}`} className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-4">
                                    <div className="w-full mb-2">
                                      <div className="text-xs text-gray-600 mb-1 truncate">{upload.file.name}</div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            upload.status === 'completed' ? 'bg-green-600' :
                                            upload.status === 'error' ? 'bg-red-600' : 'bg-blue-600'
                                          }`}
                                          style={{ width: `${upload.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div className="text-xs text-center">
                                      {upload.status === 'completed' ? (
                                        <span className="text-green-600 flex items-center">
                                          <CheckIcon className="h-3 w-3 mr-1" />
                                          Uploaded
                                        </span>
                                      ) : upload.status === 'error' ? (
                                        <span className="text-red-600">Failed</span>
                                      ) : (
                                        <span className="text-blue-600">{upload.progress}%</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Add New Images Button */}
                                {(productForm.images.length + productForm.selectedFiles.length) < 3 && (
                                  <div className="aspect-square">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={handleImageUpload}
                                      className="hidden"
                                      id="product-images"
                                      disabled={isUploading}
                                    />
                                    <label
                                      htmlFor="product-images"
                                      className={`cursor-pointer w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-[#004AAD] hover:bg-blue-50 transition-colors ${
                                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                    >
                                      <PlusIcon className="h-8 w-8 text-gray-400 mb-2" />
                                      <span className="text-sm text-gray-600 text-center px-2">
                                        {isUploading ? 'Uploading...' : 'Add Images'}
                                      </span>
                                      <span className="text-xs text-gray-500 text-center px-2 mt-1">
                                        Max 5MB per image
                                      </span>
                                    </label>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-xs text-gray-500">
                                📸 Powered by ImageKit • First image will be used as primary display image
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={productForm.name}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="e.g., Coca-Cola 500ml"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                  required
                                  value={productForm.category}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                >
                                  <option value="">Select Category</option>
                                  {categories.slice(1).map(category => (
                                    <option key={category} value={category}>{category}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Branch Selector - Only show if user has multiple branches */}
                              {branches.length > 1 && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Branch <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    required
                                    value={productForm.branchId}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, branchId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                    disabled={branchesLoading}
                                  >
                                    <option value="">Select Branch</option>
                                    {branches.map(branch => (
                                      <option key={branch.id} value={branch.id}>
                                        {branch.name} {branch.branchCode && `(${branch.branchCode})`}
                                      </option>
                                    ))}
                                  </select>
                                  {branchesLoading && (
                                    <p className="text-xs text-gray-500 mt-1">Loading branches...</p>
                                  )}
                                </div>
                              )}

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                                <input
                                  type="text"
                                  value={productForm.sku}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                                  placeholder="Auto-generated if left empty"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value={productForm.barcode}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                                    placeholder="Scan or enter manually"
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                  >
                                    <QrCodeIcon className="h-5 w-5 text-[#004AAD]" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                              <textarea
                                rows={3}
                                value={productForm.description}
                                onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Optional product description or notes"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Pricing & Stock */}
                      {currentStep === 'pricing' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Cost Price (KSh) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={productForm.costPrice}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: e.target.value }))}
                                  placeholder="0.00"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">How much you paid for this product</p>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Selling Price (KSh) <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.01"
                                  value={productForm.sellingPrice}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                                  placeholder="0.00"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Price you sell to customers</p>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Current Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={productForm.quantity}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, quantity: e.target.value }))}
                                  placeholder="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Unit of Measure <span className="text-red-500">*</span>
                                </label>
                                <select
                                  required
                                  value={productForm.unitOfMeasure}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, unitOfMeasure: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                >
                                  {units.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock Level</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={productForm.minStockLevel}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, minStockLevel: e.target.value }))}
                                  placeholder="5"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
                              </div>

                              <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={productForm.lowStockAlertEnabled}
                                    onChange={(e) => setProductForm(prev => ({ ...prev, lowStockAlertEnabled: e.target.checked }))}
                                    className="h-4 w-4 text-[#004AAD] focus:ring-[#004AAD] border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Enable Low Stock Alerts</span>
                                </label>
                              </div>
                            </div>

                            {/* Profit Margin Display */}
                            {productForm.costPrice && productForm.sellingPrice && (
                              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-green-800">Profit Margin:</span>
                                  <span className="text-lg font-bold text-green-900">
                                    {currencySymbol} {(Number(productForm.sellingPrice) - Number(productForm.costPrice)).toFixed(2)} 
                                    ({Math.round(((Number(productForm.sellingPrice) - Number(productForm.costPrice)) / Number(productForm.costPrice)) * 100)}%)
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Step 3: Advanced */}
                      {currentStep === 'advanced' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Information</h3>
                            
                            {/* Enhanced Supplier Selection */}
                            <div className="mb-6">
                              <SupplierSelection
                                selectedSuppliers={productForm.selectedSuppliers}
                                onSuppliersChange={handleSuppliersChange}
                                userId={user?.uid || ''}
                                productCategory={productForm.category}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Legacy Supplier <span className="text-gray-500 text-xs">(backward compatibility)</span>
                                </label>
                                <input
                                  type="text"
                                  value={productForm.supplier}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, supplier: e.target.value }))}
                                  placeholder="e.g., ABC Distributors"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Use the enhanced supplier selection above instead</p>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location</label>
                                <input
                                  type="text"
                                  value={productForm.location}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, location: e.target.value }))}
                                  placeholder="e.g., Shelf A-1, Warehouse 2"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                                <input
                                  type="text"
                                  value={productForm.batchNumber}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                                  placeholder="For tracking bulk purchases"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                <input
                                  type="date"
                                  value={productForm.expiryDate}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <input
                                  type="text"
                                  value={productForm.tags}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, tags: e.target.value }))}
                                  placeholder="e.g., organic, imported, bestseller (comma separated)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                              </div>
                            </div>

                            <div className="mt-6">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={productForm.isPerishable}
                                  onChange={(e) => setProductForm(prev => ({ ...prev, isPerishable: e.target.checked }))}
                                  className="h-4 w-4 text-[#004AAD] focus:ring-[#004AAD] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">This is a perishable item</span>
                              </label>
                              <p className="text-xs text-gray-500 mt-1 ml-6">Check this for items that expire or go bad over time</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Buttons */}
                      <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
                        <button
                          type="button"
                          onClick={previousStep}
                          disabled={currentStep === 'basic'}
                          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                            currentStep === 'basic' 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          <ChevronLeftIcon className="h-4 w-4 mr-2" />
                          Previous
                        </button>

                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddProduct(false)
                              setShowEditProduct(false)
                              resetForm()
                            }}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>

                          {currentStep !== 'advanced' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                nextStep()
                              }}
                              disabled={!canProceedToNext()}
                              className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
                                canProceedToNext()
                                  ? 'bg-[#004AAD] text-white hover:bg-[#003a8c]'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              Next
                              <ChevronRightIcon className="h-4 w-4 ml-2" />
                            </button>
                          ) : (
                            <button
                              type="submit"
                              disabled={isUploading}
                              className={`flex items-center px-6 py-2 rounded-lg transition-colors font-medium shadow-md ${
                                isUploading 
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : 'bg-[#004AAD] text-white hover:bg-[#003a8c]'
                              }`}
                            >
                              <CheckIcon className="h-4 w-4 mr-2" />
                              {isUploading ? 'Uploading...' : editingProduct ? 'Update Product' : 'Add Product'}
                            </button>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Bulk Upload Modal */}
          <AnimatePresence>
            {showBulkUpload && (
              <BulkUpload
                userId={user?.uid || ''}
                onClose={() => setShowBulkUpload(false)}
                onSuccess={() => {
                  setShowBulkUpload(false)
                  fetchData() // Refresh products list
                }}
                branchId={branches.length > 0 ? branches.find(b => b.status === 'ACTIVE')?.id || branches[0]?.id : undefined}
              />
            )}
          </AnimatePresence>

          {/* Enhanced Product Detail Modal */}
          <AnimatePresence>
            {showEnhancedDetail && selectedProductForDetail && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowEnhancedDetail(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedProductForDetail.name}</h2>
                      <p className="text-sm text-gray-500">Enhanced product details and analytics</p>
                    </div>
                    <button
                      onClick={() => setShowEnhancedDetail(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {/* Enhanced Product Detail Component */}
                  <div className="p-6">
                    <EnhancedProductDetail
                      product={selectedProductForDetail}
                      userId={user?.uid || ''}
                      onUpdateProduct={handleUpdateProduct}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    }>
      <ProductsPageContent />
    </Suspense>
  )
}