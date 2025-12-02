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
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Product as FPProduct, getProducts, softDeleteProduct } from '@/lib/firestore'

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
  IN_STOCK = "IN_STOCK"
}

function BrowseProductsContent() {
  const [products, setProducts] = useState<FPProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedFilter, setSelectedFilter] = useState<ProductFilter>(ProductFilter.ALL)
  const [currentPage, setCurrentPage] = useState(0)
  const { user } = useAuth()
  const router = useRouter()

  const itemsPerPage = 10

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

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await softDeleteProduct(productId)
        fetchData()
      } catch (error) {
        console.error('Failed to delete product:', error)
        alert('Failed to delete product. Please try again.')
      }
    }
  }

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.barcode || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Apply stock filter
    filtered = filtered.filter(product => {
      switch (selectedFilter) {
        case ProductFilter.LOW_STOCK:
          return product.quantity <= product.minStockLevel && product.quantity > 0
        case ProductFilter.OUT_OF_STOCK:
          return product.quantity === 0
        case ProductFilter.IN_STOCK:
          return product.quantity > product.minStockLevel
        default:
          return true
      }
    })

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [products, searchQuery, selectedCategory, selectedFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const startIndex = currentPage * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length)
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, currentPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0)
  }, [searchQuery, selectedCategory, selectedFilter])

  const lowStockCount = products.filter(p => p.quantity <= p.minStockLevel && p.quantity > 0).length
  const outOfStockCount = products.filter(p => p.quantity === 0).length

  const getStockStatus = (product: FPProduct) => {
    if (product.quantity === 0) return { text: 'OUT', color: 'text-[#DC2626] bg-[#DC2626]/10' }
    if (product.quantity <= product.minStockLevel) return { text: 'LOW', color: 'text-[#F29F05] bg-[#F29F05]/10' }
    return { text: 'IN STOCK', color: 'text-[#66BB6A] bg-[#66BB6A]/10' }
  }

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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/inventory')}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
                  title="Back to Inventory"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-muted-foreground" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Browse Products</h1>
                  <p className="text-muted-foreground">
                    {filteredProducts.length} products • Page {currentPage + 1} of {Math.max(1, totalPages)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/inventory?new=1')}
                className="bg-[#66BB6A] text-white px-4 py-2 rounded-lg hover:bg-[#5cb660] transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div variants={fadeInUp} className="bg-card rounded-xl p-6 shadow-sm border border-border">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-[#004AAD] outline-none bg-background"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedFilter(ProductFilter.ALL)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === ProductFilter.ALL 
                    ? 'bg-[#2175C7] text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-[#2175C7]/10'
                }`}
              >
                All ({products.length})
              </button>
              <button
                onClick={() => setSelectedFilter(ProductFilter.LOW_STOCK)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === ProductFilter.LOW_STOCK 
                    ? 'bg-[#F29F05] text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-[#F29F05]/10'
                }`}
              >
                Low Stock ({lowStockCount})
              </button>
              <button
                onClick={() => setSelectedFilter(ProductFilter.OUT_OF_STOCK)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === ProductFilter.OUT_OF_STOCK 
                    ? 'bg-[#DC2626] text-white' 
                    : 'bg-muted text-muted-foreground hover:bg-[#DC2626]/10'
                }`}
              >
                Out of Stock ({outOfStockCount})
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4">
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
          </motion.div>

          {/* Products List */}
          <motion.div variants={fadeInUp}>
            {filteredProducts.length === 0 ? (
              <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
                <CubeIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery || selectedFilter !== ProductFilter.ALL || selectedCategory !== "All Categories"
                    ? "No products found"
                    : "No products yet"
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedFilter !== ProductFilter.ALL || selectedCategory !== "All Categories"
                    ? "Try adjusting your search terms or filters"
                    : "Add your first product to get started"
                  }
                </p>
                <button
                  onClick={() => router.push('/dashboard/inventory?new=1')}
                  className="bg-[#66BB6A] text-white px-6 py-3 rounded-lg hover:bg-[#5cb660] transition-colors"
                >
                  Add Product
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedProducts.map((product) => {
                  const status = getStockStatus(product)
                  const primaryImageUrl = product.images?.find(img => img.isPrimary)?.url || 
                                        product.images?.[0]?.url || 
                                        product.imageUrl || 
                                        null

                  return (
                    <div key={product.id} className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        {/* Product Image/Icon */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                          {primaryImageUrl ? (
                            <Image
                              src={primaryImageUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <CubeIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-card-foreground text-lg">{product.name}</h3>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>{product.category}</span>
                                <span>•</span>
                                <span>{product.quantity} {product.unitOfMeasure || 'pcs'}</span>
                                {product.sku && (
                                  <>
                                    <span>•</span>
                                    <span>SKU: {product.sku}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Stock Status Badge */}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-semibold text-[#66BB6A] text-lg">KSh {product.sellingPrice.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Cost: KSh {product.costPrice.toLocaleString()}</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/dashboard/inventory/${product.id}`)}
                              className="p-2 text-[#004AAD] hover:bg-[#004AAD]/10 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/inventory?edit=${product.id}`)}
                              className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-[#DC2626] hover:bg-[#DC2626]/10 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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
                  {Array.from({ length: totalPages }, (_, i) => (
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
