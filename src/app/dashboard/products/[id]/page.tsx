'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CubeIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
  ArchiveBoxIcon,
  QrCodeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassPlusIcon,
  ClockIcon,
  TruckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Product, getProducts, updateProduct } from '@/lib/firestore'
import { getProductInventoryData, getProductPriceHistory } from '@/lib/product-enhancements'
import { getSuppliers } from '@/lib/suppliers-service'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'

interface ProductInventoryData {
  totalStock: number
  availableStock: number
  reservedStock: number
  inTransitStock: number
  branchStock: Record<string, any>
  lowStockAlerts: any[]
  expiryAlerts: any[]
}

interface Supplier {
  id: string
  name: string
  status: string
  onTimeDeliveryRate: number
  totalOrders: number
  qualityRating?: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [inventoryData, setInventoryData] = useState<ProductInventoryData | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user || !productId) return

    setLoading(true)
    try {
      // Fetch product details
      const products = await getProducts(user.uid)
      const foundProduct = products.find(p => p.id === productId)
      
      if (!foundProduct) {
        router.push('/dashboard/products')
        return
      }
      
      setProduct(foundProduct)

      // Fetch related data in parallel
      const [inventoryResult, suppliersResult, priceHistoryResult] = await Promise.all([
        getProductInventoryData(productId, user.uid).catch(() => null),
        getSuppliers(user.uid).catch(() => []),
        getProductPriceHistory(productId, undefined, 10).catch(() => [])
      ])

      setInventoryData(inventoryResult)
      setSuppliers(suppliersResult)
      setPriceHistory(priceHistoryResult)
    } catch (error) {
      console.error('Error fetching product details:', error)
    } finally {
      setLoading(false)
    }
  }, [user, productId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEdit = () => {
    router.push(`/dashboard/products?edit=${productId}`)
  }

  const handleDelete = async () => {
    if (!product) return
    
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await updateProduct(productId, { isActive: false })
        router.push('/dashboard/products')
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product. Please try again.')
      }
    }
  }

  const getStockStatus = () => {
    if (!product) return { status: 'Unknown', color: 'gray', bgColor: 'bg-gray-100' }
    
    if (product.quantity === 0) {
      return { status: 'Out of Stock', color: 'red', bgColor: 'bg-red-100' }
    }
    if (product.quantity <= product.minStockLevel) {
      return { status: 'Low Stock', color: 'orange', bgColor: 'bg-orange-100' }
    }
    return { status: 'In Stock', color: 'green', bgColor: 'bg-green-100' }
  }

  const getExpiryStatus = () => {
    if (!product?.expiryDate) return null
    
    const daysUntilExpiry = (product.expiryDate - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntilExpiry <= 0) {
      return { status: 'Expired', color: 'red', bgColor: 'bg-red-100' }
    }
    if (daysUntilExpiry <= 7) {
      return { status: `Expires in ${Math.ceil(daysUntilExpiry)} days`, color: 'red', bgColor: 'bg-red-100' }
    }
    if (daysUntilExpiry <= 30) {
      return { status: `Expires in ${Math.ceil(daysUntilExpiry)} days`, color: 'orange', bgColor: 'bg-orange-100' }
    }
    return null
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!product?.images) return
    
    const totalImages = product.images.length
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1))
    } else {
      setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1))
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!product) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/dashboard/products')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Products
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const stockStatus = getStockStatus()
  const expiryStatus = getExpiryStatus()
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0]
  const currentImage = product.images?.[currentImageIndex] || primaryImage
  const hasMultipleImages = product.images && product.images.length > 1
  const primarySupplier = product.supplierLinks?.find(link => link.isPrimary)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/products')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Products</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <PrinterIcon className="h-5 w-5" />
                <span>Print</span>
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="h-5 w-5" />
                <span>Update Product</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden relative group">
                {currentImage?.url || product.imageUrl ? (
                  <>
                    <Image
                      src={currentImage?.url || product.imageUrl || ''}
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="bg-black bg-opacity-60 hover:bg-opacity-75 rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-auto"
                      >
                        <MagnifyingGlassPlusIcon className="h-8 w-8 text-white" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CubeIcon className="h-24 w-24 text-gray-400" />
                  </div>
                )}

                {/* Image Navigation */}
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {hasMultipleImages && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {product.images?.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {hasMultipleImages && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images?.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={`${product.name} ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="bg-gray-100 px-3 py-1 rounded-full">{product.category}</span>
                      {product.sku && (
                        <span className="flex items-center space-x-1">
                          <TagIcon className="h-4 w-4" />
                          <span>SKU: {product.sku}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="text-right space-y-2">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-${stockStatus.color}-800 ${stockStatus.bgColor}`}>
                      {stockStatus.status}
                    </div>
                    {expiryStatus && (
                      <div className={`block text-sm px-3 py-1 rounded-full font-medium text-${expiryStatus.color}-800 ${expiryStatus.bgColor}`}>
                        {expiryStatus.status}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                )}
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Selling Price</div>
                    <div className="text-3xl font-bold text-gray-900">KSh {product.sellingPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Cost Price</div>
                    <div className="text-2xl font-semibold text-gray-700">KSh {product.costPrice.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Profit Margin:</span>
                    <span className="font-medium text-green-600">
                      KSh {(product.sellingPrice - product.costPrice).toLocaleString()} 
                      ({(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Current Stock</div>
                    <div className="text-2xl font-bold text-gray-900">{product.quantity} {product.unitOfMeasure}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Minimum Stock Level</div>
                    <div className="text-xl font-semibold text-gray-700">{product.minStockLevel} {product.unitOfMeasure}</div>
                  </div>
                </div>
                {product.location && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ArchiveBoxIcon className="h-4 w-4" />
                      <span>Location: {product.location}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Supplier Information */}
              {product.supplierLinks && product.supplierLinks.length > 0 && (
                <div className="bg-blue-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
                  <div className="space-y-3">
                    {product.supplierLinks.map((link) => (
                      <div key={link.supplierId} className={`p-4 rounded-lg border-2 ${
                        link.isPrimary ? 'border-blue-200 bg-blue-100' : 'border-gray-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <BuildingOffice2Icon className={`h-5 w-5 ${
                              link.isPrimary ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                            <div>
                              <div className="font-medium text-gray-900">{link.supplierName}</div>
                              {link.isPrimary && (
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                  Primary Supplier
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            {link.lastPurchasePrice && (
                              <div>Last Price: KSh {link.lastPurchasePrice.toFixed(2)}</div>
                            )}
                            {link.leadTimeInDays && (
                              <div>Lead Time: {link.leadTimeInDays} days</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  {product.barcode && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <QrCodeIcon className="h-4 w-4" />
                      <span>Barcode: {product.barcode}</span>
                    </div>
                  )}
                  {product.batchNumber && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <TagIcon className="h-4 w-4" />
                      <span>Batch: {product.batchNumber}</span>
                    </div>
                  )}
                  {product.isPerishable && (
                    <div className="flex items-center space-x-2 text-sm text-orange-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Perishable Item</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {product.expiryDate && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Expires: {new Date(product.expiryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {product.lastPurchaseDate && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4" />
                      <span>Last Purchase: {new Date(product.lastPurchaseDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {product.tags && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.split(',').map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full-Screen Image Modal */}
          {showImageModal && currentImage && (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
              <div className="relative max-w-5xl max-h-full">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
                <Image
                  src={currentImage.url}
                  alt={product.name}
                  width={800}
                  height={800}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
