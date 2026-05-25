import { BACKEND_API_BASE_URL } from './backend-api'
import { auth, storage } from './firebase'
import { 
  ref, 
  deleteObject
} from 'firebase/storage'

export interface UploadedProductImage {
  url: string
  fileId: string
  name: string
  storagePath?: string
  contentType?: string
  size?: number
}

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  fileId?: string
  error?: string
}

const PRODUCT_IMAGE_UPLOAD_PATH = '/assets/product-images'

async function parseUploadError(response: Response): Promise<string> {
  const result = await response.json().catch(() => null) as {
    error?: { code?: string; message?: string }
    message?: string
  } | null

  if (response.status === 403 && result?.error?.code === 'manager_required') {
    return 'Only owners and managers can upload product images.'
  }

  return result?.error?.message || result?.message || 'Failed to upload product image'
}

// Upload a single product image via the backend Firebase Storage asset endpoint.
export const uploadProductImage = async (
  file: File, 
  _productId: string, 
  onProgress?: (progress: number) => void
): Promise<UploadedProductImage> => {
  const user = auth.currentUser

  if (!user) {
    throw new Error('You must be signed in to upload product images.')
  }

  const token = await user.getIdToken()

  // Simulate initial progress
  onProgress?.(10)
  
  const formData = new FormData()
  formData.append('image', file)
  
  onProgress?.(30)
  
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}${PRODUCT_IMAGE_UPLOAD_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    })
    
    onProgress?.(80)
    
    if (!response.ok) {
      throw new Error(await parseUploadError(response))
    }
    
    const result = await response.json() as {
      data?: {
        url?: string
        storagePath?: string
        contentType?: string
        size?: number
      }
    }

    const upload = result.data

    if (!upload?.url) {
      throw new Error('Product image upload did not return a URL.')
    }
    
    onProgress?.(100)
    
    return {
      url: upload.url,
      fileId: upload.storagePath || upload.url,
      name: file.name,
      storagePath: upload.storagePath,
      contentType: upload.contentType,
      size: upload.size
    }
  } catch (error) {
    console.error('Upload failed:', error)
    throw error instanceof Error ? error : new Error('Failed to upload product image')
  }
}

// Upload multiple images with progress tracking
export const uploadMultipleProductImages = async (
  files: File[],
  productId: string,
  onProgressUpdate?: (uploads: UploadProgress[]) => void
): Promise<UploadedProductImage[]> => {
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
  
  const results = await Promise.allSettled(files.map(async (file, index) => {
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
  }))
  
  const uploadedImages = results
    .filter((result): result is PromiseFulfilledResult<UploadedProductImage> => result.status === 'fulfilled')
    .map(result => result.value)

  if (uploadedImages.length === 0) {
    const firstError = results.find((result): result is PromiseRejectedResult => result.status === 'rejected')
    throw firstError?.reason instanceof Error ? firstError.reason : new Error('Failed to upload product images.')
  }

  return uploadedImages
}

// Delete an image from Firebase Storage
export const deleteProductImage = async (fileId: string): Promise<void> => {
  try {
    const storageRef = ref(storage, fileId.includes('/') ? fileId : `products/${fileId}`)
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
): Promise<UploadedProductImage> => {
  if (folder !== 'products') {
    throw new Error('Only product image uploads are supported by this endpoint.')
  }
  
  return uploadProductImage(file, customFileName || `${Date.now()}`, onProgress)
}
