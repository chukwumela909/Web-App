import { IKImage, IKUpload } from 'imagekitio-react'

// ImageKit configuration using real credentials [[memory:3797573]]
export const imagekitConfig = {
  publicKey: 'public_BkD10I8kVc0GOzh5B+6y89y/l2Q=',
  urlEndpoint: 'https://ik.imagekit.io/eenbmk547',
  authenticationEndpoint: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/imagekit-auth`
}

// Re-export ImageKit components
export { IKImage, IKUpload }

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  fileId?: string
  error?: string
}

// Enhanced upload function with progress tracking
export const uploadProductImage = async (
  file: File, 
  productId: string, 
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileId: string; name: string }> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    const fileName = `product_${productId}_${Date.now()}_${file.name}`
    
    formData.append('file', file)
    formData.append('fileName', fileName)
    formData.append('folder', 'products')
    
    console.log('Starting image upload for:', fileName)
    
    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress?.(progress)
      }
    }
    
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        console.log('Upload response data:', data)
        
        if (xhr.status === 200 && data.success) {
          resolve({
            url: data.url,
            fileId: data.fileId,
            name: data.name
          })
        } else {
          console.error('Upload failed with error:', data.error)
          reject(new Error(data.error || 'Upload failed'))
        }
      } catch (error) {
        console.error('Failed to parse upload response:', error)
        reject(new Error('Upload failed'))
      }
    }
    
    xhr.onerror = () => {
      console.error('Upload request failed')
      reject(new Error('Upload request failed'))
    }
    
    xhr.open('POST', '/api/imagekit-upload')
    xhr.send(formData)
  })
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
    onProgressUpdate?.(uploads)
    
    try {
      const result = await uploadProductImage(file, productId, (progress) => {
        uploads[index].progress = progress
        onProgressUpdate?.(uploads)
      })
      
      uploads[index].status = 'completed'
      uploads[index].url = result.url
      uploads[index].fileId = result.fileId
      onProgressUpdate?.(uploads)
      
      return result
    } catch (error) {
      uploads[index].status = 'error'
      uploads[index].error = error instanceof Error ? error.message : 'Upload failed'
      onProgressUpdate?.(uploads)
      throw error
    }
  })
  
  return Promise.all(uploadPromises)
}


