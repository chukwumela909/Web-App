import { X } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

interface DownloadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DownloadModal({ open, onOpenChange }: DownloadModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const handleWindowsDownload = () => {
    const link = document.createElement('a')
    link.href = '/FahamPesa.zip'
    link.download = 'FahamPesa.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMacDownload = () => {
    const link = document.createElement('a')
    link.href = '/FahaMpesa-mac.zip'
    link.download = 'FahaMpesa-mac.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!mounted) return null
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center  sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-[800px] bg-[#f9fafb] rounded-[45px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-6 top-6 z-20 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-500" />
          <span className="sr-only">Close</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 relative min-h-[500px]">
          {/* Dividers */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            {/* Horizontal Divider */}
            <div className="absolute w-full h-[1px] bg-gray-200 md:hidden"></div> {/* Fallback for mobile */}

          </div>

          {/* Windows */}
          <div className="flex flex-col items-center justify-center p-8 space-y-6 border-b md:border-b-0 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-semibold leading-tight">Download</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-600">for Windows</p>
              </div>
              <div className="w-12 h-12 relative">
                <Image src="/assets/download-modal/windows-icon.svg" alt="Windows" fill className="object-contain" />
              </div>
            </div>
            <button 
              onClick={handleWindowsDownload}
              className="bg-white border border-[#9b9797] text-[#004aad] text-lg md:text-xl font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Download Now
            </button>
          </div>

          {/* Mac */}
          <div className="flex flex-col items-center justify-center p-8 space-y-6 border-b md:border-b-0 border-gray-200">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-semibold leading-tight">Download</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-600">for Mac</p>
              </div>
              <div className="w-14 h-14 relative">
                <Image src="/assets/download-modal/mac-icon.svg" alt="Mac" fill className="object-contain" />
              </div>
            </div>
            <button 
              onClick={handleMacDownload}
              className="bg-white border border-[#9b9797] text-[#004aad] text-lg md:text-xl font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Download Now
            </button>
          </div>

          {/* Google Play */}
          <div className="flex items-center justify-center p-8 border-b md:border-b-0 border-gray-200">
            <a
              href="https://play.google.com/store/apps/details?id=com.fahampesa.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-105 transition-transform"
            >
              <Image src="/assets/download-modal/google-play-badge.svg" alt="Get it on Google Play" width={240} height={70} className="h-[70px] w-auto" />
            </a>
          </div>

          {/* App Store */}
          <div className="flex items-center justify-center p-8">
            <a href="#" className=" cursor-not-allowed hover:scale-105 transition-transform">
              <Image src="/assets/download-modal/app-store-badge.svg" alt="Download on the App Store" width={240} height={70} className="h-[70px] w-auto" />
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
