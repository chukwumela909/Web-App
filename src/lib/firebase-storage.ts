import { storage } from './firebase'
import { 
  ref, 
  deleteObject
} from 'firebase/storage'

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  fileId?: string
  error?: string
}

// Upload a single product image via server-side API to avoid CORS issues
export const uploadProductImage = async (
  file: File, 
  productId: string, 
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileId: string; name: string }> => {
  const fileName = `product_${productId}_${Date.now()}_${file.name}`
  
  console.log('Starting server-side upload for:', fileName)
  
  // Simulate initial progress
  onProgress?.(10)
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', fileName)
  formData.append('folder', 'products')
  
  onProgress?.(30)
  
  try {
    const response = await fetch('/api/imagekit-upload', {
      method: 'POST',
      body: formData,
    })
    
    onProgress?.(80)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }
    
    const result = await response.json()
    
    onProgress?.(100)
    console.log('Upload completed. URL:', result.url)
    
    return {
      url: result.url,
      fileId: result.fileId || fileName,
      name: result.name || fileName
    }
  } catch (error) {
    console.error('Upload failed:', error)
    throw error instanceof Error ? error : new Error('Upload failed')
  }
}

// Upload multiple images with progress tracking
export const uploadMultipleProductImages = async (
  files: File[],
  productId: string,
  onProgressUpdate?: (uploads: UploadProgress[]) => void
): Promise<{ url: string; fileId: string; name: string }[]> => {
  const maxImages = 3
  if (files.length > maxImages) {
    throw new Error(`Maximum ${maxImages} images allowed`)
  }
  
  // Initialize progress tracking
  const uploads: UploadProgress[] = files.map(file => ({
    file,
    progress: 0,
    status: 'pending'
  }))
  
  onProgressUpdate?.(uploads)
  
  const uploadPromises = files.map(async (file, index) => {
    uploads[index].status = 'uploading'
    onProgressUpdate?.([...uploads])
    
    try {
      const result = await uploadProductImage(file, productId, (progress) => {
        uploads[index].progress = progress
        onProgressUpdate?.([...uploads])
      })
      
      uploads[index].status = 'completed'
      uploads[index].url = result.url
      uploads[index].fileId = result.fileId
      onProgressUpdate?.([...uploads])
      
      return result
    } catch (error) {
      uploads[index].status = 'error'
      uploads[index].error = error instanceof Error ? error.message : 'Upload failed'
      onProgressUpdate?.([...uploads])
      throw error
    }
  })
  
  return Promise.all(uploadPromises)
}

// Delete an image from Firebase Storage
export const deleteProductImage = async (fileId: string): Promise<void> => {
  try {
    const storageRef = ref(storage, `products/${fileId}`)
    await deleteObject(storageRef)
    console.log('Image deleted successfully:', fileId)
  } catch (error) {
    console.error('Failed to delete image:', error)
    throw error
  }
}

// Upload any file to a specific folder via server-side API
export const uploadFile = async (
  file: File,
  folder: string,
  customFileName?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileId: string; name: string }> => {
  const fileName = customFileName || `${Date.now()}_${file.name}`
  
  onProgress?.(10)
  
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileName', fileName)
  formData.append('folder', folder)
  
  onProgress?.(30)
  
  try {
    const response = await fetch('/api/imagekit-upload', {
      method: 'POST',
      body: formData,
    })
    
    onProgress?.(80)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }
    
    const result = await response.json()
    
    onProgress?.(100)
    
    return {
      url: result.url,
      fileId: result.fileId || fileName,
      name: result.name || fileName
    }
  } catch (error) {
    console.error('Upload failed:', error)
    throw error instanceof Error ? error : new Error('Upload failed')
  }
}
