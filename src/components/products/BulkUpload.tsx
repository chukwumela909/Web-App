'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { createProduct } from '@/lib/firestore'
import { Product as FPProduct } from '@/lib/firestore'

interface BulkUploadProps {
  userId: string
  onClose: () => void
  onSuccess: () => void
  branchId?: string
}

interface ParsedProduct {
  name: string
  sku?: string
  category: string
  description?: string
  costPrice: number
  sellingPrice: number
  quantity: number
  minStockLevel?: number
  unitOfMeasure?: string
  supplier?: string
  location?: string
  barcode?: string
  batchNumber?: string
  tags?: string
  isPerishable?: boolean
  expiryDate?: string
  branchId?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

export default function BulkUpload({ userId, onClose, onSuccess, branchId }: BulkUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = async (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV or Excel file')
      return
    }

    setSelectedFile(file)
    setIsProcessing(true)
    
    try {
      const products = await parseFile(file)
      const errors = validateProducts(products)
      
      setParsedProducts(products)
      setValidationErrors(errors)
      setCurrentStep('preview')
    } catch (error) {
      console.error('Error parsing file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Show a more detailed error message
      alert(`Error parsing CSV file:\n\n${errorMessage}\n\nTip: Download the template to see the correct format.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const parseFile = async (file: File): Promise<ParsedProduct[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          
          // Handle different line endings and clean the text
          const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
          const lines = normalizedText.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            reject(new Error('File must contain header row and at least one data row'))
            return
          }

          // Simple CSV parsing function to handle quotes
          const parseCSVLine = (line: string): string[] => {
            const result: string[] = []
            let current = ''
            let inQuotes = false
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i]
              
              if (char === '"') {
                inQuotes = !inQuotes
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
              } else {
                current += char
              }
            }
            result.push(current.trim())
            
            return result.map(value => value.replace(/^"(.*)"$/, '$1')) // Remove surrounding quotes
          }

          const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
          const requiredHeaders = ['name', 'category', 'costprice', 'sellingprice', 'quantity']
          
          console.log('Raw first line:', lines[0])
          console.log('Detected headers:', headers)
          console.log('Required headers:', requiredHeaders)
          
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
          if (missingHeaders.length > 0) {
            console.error('Missing headers:', missingHeaders)
            console.error('Found headers:', headers)
            reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}.\n\nFound headers: ${headers.join(', ')}\n\nExpected: ${requiredHeaders.join(', ')}\n\nPlease ensure your CSV has the exact headers shown in the template.`))
            return
          }

          const products: ParsedProduct[] = []
          
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i])
            if (values.length < headers.length) continue

            const product: ParsedProduct = {
              name: values[headers.indexOf('name')] || '',
              category: values[headers.indexOf('category')] || 'General',
              costPrice: parseFloat(values[headers.indexOf('costprice')] || '0'),
              sellingPrice: parseFloat(values[headers.indexOf('sellingprice')] || '0'),
              quantity: parseInt(values[headers.indexOf('quantity')] || '0'),
              sku: values[headers.indexOf('sku')] || undefined,
              description: values[headers.indexOf('description')] || undefined,
              minStockLevel: headers.includes('minstocklevel') ? 
                parseInt(values[headers.indexOf('minstocklevel')] || '5') : 5,
              unitOfMeasure: values[headers.indexOf('unitofmeasure')] || 'pcs',
              supplier: values[headers.indexOf('supplier')] || undefined,
              location: values[headers.indexOf('location')] || undefined,
              barcode: values[headers.indexOf('barcode')] || undefined,
              batchNumber: values[headers.indexOf('batchnumber')] || undefined,
              tags: values[headers.indexOf('tags')] || undefined,
              isPerishable: headers.includes('isperishable') ? 
                values[headers.indexOf('isperishable')].toLowerCase() === 'true' : false,
              expiryDate: values[headers.indexOf('expirydate')] || undefined,
              branchId: branchId || undefined
            }

            products.push(product)
          }

          resolve(products)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsText(file)
    })
  }

  const validateProducts = (products: ParsedProduct[]): ValidationError[] => {
    const errors: ValidationError[] = []

    products.forEach((product, index) => {
      const row = index + 2 // +2 because we start from row 2 (after header)

      if (!product.name.trim()) {
        errors.push({ row, field: 'name', message: 'Product name is required' })
      }

      if (!product.category.trim()) {
        errors.push({ row, field: 'category', message: 'Category is required' })
      }

      if (product.costPrice < 0) {
        errors.push({ row, field: 'costPrice', message: 'Cost price must be >= 0' })
      }

      if (product.sellingPrice <= 0) {
        errors.push({ row, field: 'sellingPrice', message: 'Selling price must be > 0' })
      }

      if (product.quantity < 0) {
        errors.push({ row, field: 'quantity', message: 'Quantity must be >= 0' })
      }

      if (product.minStockLevel && product.minStockLevel < 0) {
        errors.push({ row, field: 'minStockLevel', message: 'Min stock level must be >= 0' })
      }

      if (product.expiryDate) {
        const date = new Date(product.expiryDate)
        if (isNaN(date.getTime())) {
          errors.push({ row, field: 'expiryDate', message: 'Invalid date format (use YYYY-MM-DD)' })
        }
      }
    })

    return errors
  }

  const handleBulkUpload = async () => {
    if (validationErrors.length > 0) {
      alert('Please fix validation errors before uploading')
      return
    }

    setCurrentStep('processing')
    setUploadStatus('uploading')
    setUploadProgress(0)

    try {
      const totalProducts = parsedProducts.length
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < parsedProducts.length; i++) {
        const product = parsedProducts[i]
        
        try {
          const productData = {
            ...product,
            expiryDate: product.expiryDate ? new Date(product.expiryDate).getTime() : null,
            sku: product.sku || crypto.randomUUID().slice(0, 8).toUpperCase(),
          }

          await createProduct(userId, productData)
          successCount++
        } catch (error) {
          console.error(`Error creating product ${product.name}:`, error)
          errorCount++
        }

        setUploadProgress(Math.round(((i + 1) / totalProducts) * 100))
      }

      if (successCount > 0) {
        setUploadStatus('success')
        setCurrentStep('complete')
        
        // Call onSuccess after a short delay to show completion
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        setUploadStatus('error')
        alert('Failed to upload any products. Please check your data and try again.')
      }
    } catch (error) {
      console.error('Bulk upload error:', error)
      setUploadStatus('error')
      alert('An error occurred during upload. Please try again.')
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'name', 'category', 'costprice', 'sellingprice', 'quantity', 
      'sku', 'description', 'minstocklevel', 'unitofmeasure', 'supplier',
      'location', 'barcode', 'batchnumber', 'tags', 'isperishable', 'expirydate'
    ]
    
    const sampleData = [
      'PVC Pipe 4 inch,Plumbing,250,350,50,PVC4001,4 inch PVC drainage pipe,10,pcs,Plumbing Supplies Ltd,Warehouse A,1234567890123,BATCH001,pipe pvc plumbing,false,',
      'Copper Wire 2.5mm,Electrical,180,250,100,CW2501,2.5mm electrical copper wire,20,meter,Electric Supply Co,Storage B,2345678901234,BATCH002,wire copper electrical,false,'
    ]

    const csvContent = [headers.join(','), ...sampleData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'bulk_upload_template.csv'
    link.click()
    
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004AAD] to-[#0056CC] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Bulk Upload Products</h2>
              <p className="text-blue-100 mt-1">Upload multiple products from CSV or Excel file</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="mt-6 flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-white' : 'text-blue-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'upload' ? 'bg-white text-[#004AAD]' : 'bg-blue-700 text-white'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Upload File</span>
            </div>
            <div className="flex-1 h-0.5 bg-blue-600"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'preview' ? 'text-white' : 'text-blue-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'preview' ? 'bg-white text-[#004AAD]' : 'bg-blue-700 text-white'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Preview & Validate</span>
            </div>
            <div className="flex-1 h-0.5 bg-blue-600"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'processing' || currentStep === 'complete' ? 'text-white' : 'text-blue-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 'processing' || currentStep === 'complete' ? 'bg-white text-[#004AAD]' : 'bg-blue-700 text-white'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Step 1: Upload File */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900">Download Template First</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Download our CSV template with sample data and required column headers.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="mt-2 inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* CSV Format Guide */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">CSV Format Requirements</h4>
                <div className="text-sm text-yellow-800">
                  <p className="mb-2">Your CSV file must have these exact headers (first row):</p>
                  <code className="bg-yellow-100 px-2 py-1 rounded text-xs block mb-2">
                    name,category,costprice,sellingprice,quantity
                  </code>
                  <ul className="text-xs space-y-1">
                    <li>• Headers must be lowercase</li>
                    <li>• No spaces in header names</li>
                    <li>• Use comma (,) as separator</li>
                    <li>• Save as .csv format</li>
                  </ul>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                {isProcessing ? (
                  <div className="space-y-4">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-600">Processing file...</p>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-4">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setParsedProducts([])
                        setValidationErrors([])
                        setCurrentStep('upload')
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">
                        Drop your CSV or Excel file here
                      </p>
                      <p className="text-sm text-gray-500">
                        or{' '}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          browse to choose a file
                        </button>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Supports CSV and Excel files (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Required Columns */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Required Columns</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                  <span>• name</span>
                  <span>• category</span>
                  <span>• costprice</span>
                  <span>• sellingprice</span>
                  <span>• quantity</span>
                  <span className="text-gray-500">+ optional columns</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ Column headers must be lowercase (e.g., costprice, not costPrice)
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Validate */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              {/* Validation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Valid Products</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {parsedProducts.length - validationErrors.length}
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Errors</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900 mt-2">
                    {validationErrors.length}
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <DocumentArrowUpIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total Products</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {parsedProducts.length}
                  </p>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-3">Validation Errors</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <span className="font-medium">Row {error.row}:</span> {error.message} ({error.field})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">Product Preview (First 5)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedProducts.slice(0, 5).map((product, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{product.category}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">KSh {product.costPrice}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">KSh {product.sellingPrice}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{product.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setCurrentStep('upload')
                    setSelectedFile(null)
                    setParsedProducts([])
                    setValidationErrors([])
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Upload
                </button>
                
                <button
                  onClick={handleBulkUpload}
                  disabled={validationErrors.length > 0 || parsedProducts.length === 0}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    validationErrors.length > 0 || parsedProducts.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#004AAD] text-white hover:bg-[#003a8c]'
                  }`}
                >
                  Upload Products ({parsedProducts.length - validationErrors.length})
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {currentStep === 'processing' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto">
                {uploadStatus === 'uploading' && (
                  <div className="animate-spin h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                )}
                {uploadStatus === 'success' && (
                  <CheckCircleIcon className="h-16 w-16 text-green-500" />
                )}
                {uploadStatus === 'error' && (
                  <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {uploadStatus === 'uploading' && 'Uploading Products...'}
                  {uploadStatus === 'success' && 'Upload Complete!'}
                  {uploadStatus === 'error' && 'Upload Failed'}
                </h3>
                
                {uploadStatus === 'uploading' && (
                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">{uploadProgress}% complete</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Products Uploaded Successfully!</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your products have been added to the inventory. Redirecting to products list...
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
