'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CubeIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowLeftIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Product as FPProduct, getProducts, updateProduct } from '@/lib/firestore'
import EnhancedProductDetail from '@/components/products/EnhancedProductDetail'

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

enum ProductFilter {
  ALL = "ALL",
  LOW_STOCK = "LOW_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  IN_STOCK = "IN_STOCK",
  HAS_SUPPLIERS = "HAS_SUPPLIERS",
  NO_SUPPLIERS = "NO_SUPPLIERS",
  EXPIRING_SOON = "EXPIRING_SOON"
}

function BrowseProductsContent() {
  const [products, setProducts] = useState<FPProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedFilter, setSelectedFilter] = useState<ProductFilter>(ProductFilter.ALL)
  const [currentPage, setCurrentPage] = useState(0)
  const [showEnhancedDetail, setShowEnhancedDetail] = useState(false)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<FPProduct | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const itemsPerPage = 12

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

  const handleEdit = (product: FPProduct) => {
    router.push(`/dashboard/products?edit=${product.id}`)
  }

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await updateProduct(productId, { isActive: false })
        fetchData()
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product. Please try again.')
      }
    }
  }

  const handleShowEnhancedDetail = (product: FPProduct) => {
    setSelectedProductForDetail(product)
    setShowEnhancedDetail(true)
  }

  const handleUpdateProduct = async (updates: Partial<FPProduct>) => {
    if (!selectedProductForDetail) return
    
    try {
      await updateProduct(selectedProductForDetail.id, updates)
      fetchData()
      setSelectedProductForDetail(prev => prev ? { ...prev, ...updates } : null)
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => product.isActive !== false)

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.tags || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Apply advanced filters
    filtered = filtered.filter(product => {
      switch (selectedFilter) {
        case ProductFilter.LOW_STOCK:
          return product.quantity <= product.minStockLevel && product.quantity > 0
        case ProductFilter.OUT_OF_STOCK:
          return product.quantity === 0
        case ProductFilter.IN_STOCK:
          return product.quantity > product.minStockLevel
        case ProductFilter.HAS_SUPPLIERS:
          return product.supplierLinks && product.supplierLinks.length > 0
        case ProductFilter.NO_SUPPLIERS:
          return !product.supplierLinks || product.supplierLinks.length === 0
        case ProductFilter.EXPIRING_SOON:
          if (!product.expiryDate) return false
          const daysUntilExpiry = (product.expiryDate - Date.now()) / (1000 * 60 * 60 * 24)
          return daysUntilExpiry <= 30 && daysUntilExpiry > 0
        default:
          return true
      }
    })

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [products, searchQuery, selectedCategory, selectedFilter])

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIndex = currentPage * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length)
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage])

  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, selectedCategory, selectedFilter])

  const getStockStatus = (product: FPProduct) => {
    if (product.quantity === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' }
    if (product.quantity <= product.minStockLevel) return { status: 'Low Stock', color: 'text-orange-600 bg-orange-100' }
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' }
  }

  const getExpiryStatus = (product: FPProduct) => {
    if (!product.expiryDate) return null
    const daysUntilExpiry = (product.expiryDate - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntilExpiry <= 0) return { status: 'Expired', color: 'text-red-600 bg-red-100' }
    if (daysUntilExpiry <= 7) return { status: `${Math.ceil(daysUntilExpiry)} days left`, color: 'text-red-600 bg-red-100' }
    if (daysUntilExpiry <= 30) return { status: `${Math.ceil(daysUntilExpiry)} days left`, color: 'text-orange-600 bg-orange-100' }
    return null
  }

  const filterOptions = [
    { value: ProductFilter.ALL, label: 'All Products', count: products.filter(p => p.isActive !== false).length },
    { value: ProductFilter.IN_STOCK, label: 'In Stock', count: products.filter(p => p.isActive !== false && p.quantity > p.minStockLevel).length },
    { value: ProductFilter.LOW_STOCK, label: 'Low Stock', count: products.filter(p => p.isActive !== false && p.quantity <= p.minStockLevel && p.quantity > 0).length },
    { value: ProductFilter.OUT_OF_STOCK, label: 'Out of Stock', count: products.filter(p => p.isActive !== false && p.quantity === 0).length },
    { value: ProductFilter.HAS_SUPPLIERS, label: 'With Suppliers', count: products.filter(p => p.isActive !== false && p.supplierLinks && p.supplierLinks.length > 0).length },
    { value: ProductFilter.NO_SUPPLIERS, label: 'No Suppliers', count: products.filter(p => p.isActive !== false && (!p.supplierLinks || p.supplierLinks.length === 0)).length },
    { value: ProductFilter.EXPIRING_SOON, label: 'Expiring Soon', count: products.filter(p => {
      if (p.isActive === false || !p.expiryDate) return false
      const daysUntilExpiry = (p.expiryDate - Date.now()) / (1000 * 60 * 60 * 24)
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length },
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerChildren}
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={fadeInUp}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/products')}
                  className="flex items-center space-x-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>Back to Products</span>
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/products')}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003a8c] transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-foreground">Browse Products</h1>
            <p className="text-muted-foreground">
              Showing {filteredProducts.length} of {products.filter(p => p.isActive !== false).length} products
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={fadeInUp}>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, category, barcode, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none bg-background"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedFilter(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedFilter === option.value
                        ? 'bg-[#004AAD] text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none bg-background"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Products Grid */}
          <motion.div variants={fadeInUp}>
            {paginatedProducts.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <CubeIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory !== "All Categories" || selectedFilter !== ProductFilter.ALL
                    ? "Try adjusting your search criteria"
                    : "Get started by adding your first product"
                  }
                </p>
                {(!searchQuery && selectedCategory === "All Categories" && selectedFilter === ProductFilter.ALL) && (
                  <button
                    onClick={() => router.push('/dashboard/products')}
                    className="px-6 py-3 bg-[#004AAD] text-white rounded-lg hover:bg-[#003a8c] transition-colors"
                  >
                    Add Your First Product
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  const expiryStatus = getExpiryStatus(product)
                  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
                  const hasSuppliers = product.supplierLinks && product.supplierLinks.length > 0
                  const primarySupplier = product.supplierLinks?.find(link => link.isPrimary)

                  return (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-all duration-200"
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden relative">
                        {primaryImage?.url || product.imageUrl ? (
                          <Image
                            src={primaryImage?.url || product.imageUrl || ''}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <CubeIcon className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Status Badges */}
                        <div className="absolute top-2 left-2 space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                          {expiryStatus && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color} block`}>
                              {expiryStatus.status}
                            </span>
                          )}
                        </div>

                        {/* Supplier Badge */}
                        {hasSuppliers && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-100 text-blue-600 p-1 rounded-full">
                              <BuildingOffice2Icon className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{product.category}</span>
                          {product.sku && <span>SKU: {product.sku}</span>}
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-foreground">KSh {product.sellingPrice.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Stock: {product.quantity} {product.unitOfMeasure}</p>
                          </div>
                          <div className="text-right">
                            {product.lastPurchasePrice && (
                              <p className="text-sm text-muted-foreground">
                                Cost: KSh {product.lastPurchasePrice.toFixed(2)}
                              </p>
                            )}
                            {primarySupplier && (
                              <p className="text-xs text-blue-600">{primarySupplier.supplierName}</p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <button
                            onClick={() => router.push(`/dashboard/products/${product.id}`)}
                            className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span className="text-sm">View Details</span>
                          </button>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                              title="Update Product"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleShowEnhancedDetail(product)}
                              className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                              title="Quick View"
                            >
                              <MagnifyingGlassIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete Product"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Pagination */}
          {filteredProducts.length > 0 && totalPages > 1 && (
            <motion.div variants={fadeInUp}>
              <div className="flex items-center justify-between bg-card rounded-xl p-4 shadow-sm border border-border">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  disabled={currentPage === 0}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  {totalPages <= 7 && Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        currentPage === i
                          ? 'bg-[#004AAD] text-white'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Enhanced Product Detail Modal */}
          {showEnhancedDetail && selectedProductForDetail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
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
              </div>
            </div>
          )}

        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default function BrowseProductsPage() {
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
      <BrowseProductsContent />
    </Suspense>
  )
}
