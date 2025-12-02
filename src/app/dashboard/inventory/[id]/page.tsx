'use client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CubeIcon,
  TagIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  BellIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  QrCodeIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { Product as FPProduct, getProduct, softDeleteProduct } from '@/lib/firestore'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
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

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<FPProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  useEffect(() => {
    const fetchProduct = async () => {
      if (!user || !productId) return
      
      setLoading(true)
      try {
        const productData = await getProduct(productId)
        if (productData && productData.userId === user.uid) {
          setProduct(productData)
        } else {
          setNotFound(true)
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [user, productId])

  const handleEdit = () => {
    router.push(`/dashboard/inventory?edit=${productId}`)
  }

  const handleDelete = async () => {
    if (!product) return
    
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await softDeleteProduct(product.id)
        router.push('/dashboard/inventory')
      } catch (error) {
        console.error('Failed to delete product:', error)
        alert('Failed to delete product. Please try again.')
      }
    }
  }

  const getStockStatus = () => {
    if (!product) return { status: 'unknown', color: 'gray', text: 'Unknown' }
    
    if (product.quantity === 0) {
      return { status: 'critical', color: 'red', text: 'Out of Stock' }
    } else if (product.quantity <= product.minStockLevel) {
      return { status: 'low', color: 'yellow', text: 'Low Stock' }
    } else {
      return { status: 'good', color: 'green', text: 'In Stock' }
    }
  }

  const getProfitMargin = () => {
    if (!product) return 0
    const profit = product.sellingPrice - product.costPrice
    return product.costPrice > 0 ? (profit / product.costPrice) * 100 : 0
  }

  const getTotalValue = () => {
    if (!product) return 0
    return product.sellingPrice * product.quantity
  }

  const getCostValue = () => {
    if (!product) return 0
    return product.costPrice * product.quantity
  }

  const formatDate = (timestamp: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!timestamp) return 'Not set'
    
    // Handle Firestore Timestamp objects
    if (timestamp && typeof timestamp === 'object' && timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    // Handle JavaScript Date objects
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    // Handle number timestamps
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    return 'Not set'
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004AAD]"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (notFound || !product) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
                            <p className="text-gray-600 mb-6">The product you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
            <button
              onClick={() => router.push('/dashboard/inventory')}
              className="inline-flex items-center px-4 py-2 bg-[#004AAD] text-white rounded-lg hover:bg-[#003a8c] transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Inventory
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const stockStatus = getStockStatus()

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
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/inventory')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-gray-600 mt-1">Product Details & Information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Product
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Image and Basic Info */}
            <motion.div variants={fadeInUp} className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PhotoIcon className="h-24 w-24 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
                    <p className="text-gray-600">{product.description || 'No description provided'}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">SKU</span>
                    <span className="text-sm text-gray-900 font-mono">{product.sku}</span>
                  </div>

                  {product.barcode && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Barcode</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900 font-mono">{product.barcode}</span>
                        <QrCodeIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Category</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </div>

                  {product.tags && (
                    <div>
                      <span className="text-sm font-medium text-gray-500 block mb-2">Tags</span>
                      <div className="flex flex-wrap gap-1">
                        {product.tags.split(',').map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            <TagIcon className="h-3 w-3 mr-1" />
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stock and Pricing Information */}
            <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-6">
              {/* Stock Status Card */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-card-foreground">Stock Status</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    stockStatus.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {stockStatus.status === 'critical' ? <XCircleIcon className="h-4 w-4 mr-1" /> :
                     stockStatus.status === 'low' ? <ExclamationTriangleIcon className="h-4 w-4 mr-1" /> :
                     <CheckCircleIcon className="h-4 w-4 mr-1" />}
                    {stockStatus.text}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-card-foreground">{product.quantity}</div>
                    <div className="text-sm text-muted-foreground">Current Stock</div>
                    <div className="text-xs text-muted-foreground">{product.unitOfMeasure}</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{product.minStockLevel}</div>
                    <div className="text-sm text-muted-foreground">Min Level</div>
                    <div className="text-xs text-muted-foreground">{product.unitOfMeasure}</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">KSh {getTotalValue().toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Value</div>
                    <div className="text-xs text-muted-foreground">At selling price</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">KSh {getCostValue().toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Cost Value</div>
                    <div className="text-xs text-muted-foreground">Investment</div>
                  </div>
                </div>

                {product.lowStockAlertEnabled && (
                  <div className="mt-4 flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-sm text-blue-800 dark:text-blue-400">Low stock alerts are enabled for this product</span>
                  </div>
                )}
              </div>

              {/* Pricing Information */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-6">Pricing Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-3">
                      <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-card-foreground">KSh {product.costPrice.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Cost Price</div>
                    <div className="text-xs text-muted-foreground">Per {product.unitOfMeasure}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                      <TagIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-card-foreground">KSh {product.sellingPrice.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Selling Price</div>
                    <div className="text-xs text-muted-foreground">Per {product.unitOfMeasure}</div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                      <ChartBarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-card-foreground">{getProfitMargin().toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Profit Margin</div>
                    <div className="text-xs text-muted-foreground">KSh {(product.sellingPrice - product.costPrice).toFixed(2)} profit</div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-6">Additional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.supplier && (
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                        <UserIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-card-foreground">Supplier</div>
                        <div className="text-sm text-muted-foreground">{product.supplier}</div>
                      </div>
                    </div>
                  )}

                  {product.location && (
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
                        <MapPinIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Storage Location</div>
                        <div className="text-sm text-gray-600">{product.location}</div>
                      </div>
                    </div>
                  )}

                  {product.batchNumber && (
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                        <BuildingStorefrontIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Batch Number</div>
                        <div className="text-sm text-gray-600">{product.batchNumber}</div>
                      </div>
                    </div>
                  )}

                  {product.expiryDate && (
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Expiry Date</div>
                        <div className="text-sm text-gray-600">{formatDate(product.expiryDate)}</div>
                      </div>
                    </div>
                  )}
                </div>

                {product.isPerishable && (
                  <div className="mt-6 flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">This is a perishable item - monitor expiry dates carefully</span>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">{formatDate(product.createdAt)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <span className="ml-2 text-gray-600">{formatDate(product.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
