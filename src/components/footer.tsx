'use client'

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Instagram } from "lucide-react"
import { DownloadModal } from "@/components/DownloadModal"

export default function Footer() {
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  return (
    <>
      <DownloadModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />
      <footer className="bg-[#001223] text-white py-16 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-[100px]">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mb-12 lg:mb-[100px]">
          {/* COMPANY */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[14px] font-semibold text-[#64748b] font-dm-sans tracking-wide uppercase">Company</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/about" className="text-[14px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[14px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[14px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact-information" className="text-[14px] font-medium text-white hover:text-[#004aad] transition-colors font-dm-sans">
                  Contact Information
                </Link>
              </li>
            </ul>
          </div>

          {/* HELP */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[14px] font-semibold text-[#64748b] font-dm-sans tracking-wide uppercase">Help</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/#faq" className="text-[14px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="https://wa.me/message/55YQ3IBJHOQCM1" target="_blank" rel="noopener noreferrer" className="text-[14px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans">
                  WhatsApp Support
                </Link>
              </li>
              <li>
                <a href="mailto:support@fahampesa.com" className="text-[14px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans break-all">
                  support@fahampesa.com
                </a>
              </li>
            </ul>
          </div>

          {/* GET THE APP */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-4">
            <h3 className="text-[14px] font-semibold text-[#64748b] font-dm-sans tracking-wide uppercase">Get the App</h3>
            <ul className="flex flex-col gap-3 mb-4">
              <li>
                <button 
                  onClick={() => setDownloadModalOpen(true)}
                  className="text-[14px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans text-left"
                >
                  Desktop for Windows
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setDownloadModalOpen(true)}
                  className="text-[14px] font-medium text-white hover:text-[#004AAD] transition-colors font-dm-sans text-left"
                >
                  Desktop for Mac
                </button>
              </li>
            </ul>
            <div className="flex flex-row gap-3 flex-wrap">
              <Link 
                href="https://play.google.com/store/apps/details?id=com.fahampesa.app"
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-[150px] h-[44px] hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Image 
                  src="/google_play.png" 
                  alt="Get it on Google Play" 
                  fill
                  className="object-contain"
                />
              </Link>
              <div 
                className="relative w-[150px] h-[44px] hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => alert("iOS app coming soon!")}
              >
                <Image 
                  src="/app_store.png" 
                  alt="Download on the App Store" 
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:border-t md:border-gray-800 md:pt-8">
          <p className="text-[14px] font-medium text-white font-dm-sans text-left">
            Copyright © 2026 Fahampesa - All Rights Reserved
          </p>
          <div className="flex gap-4">
            <Link href="https://www.facebook.com/share/1HGyTGdrpY/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors group">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#001223] fill-current group-hover:scale-110 transition-transform">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </Link>
            <Link href="https://www.tiktok.com/@fahampesa" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors group">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#001223] fill-current group-hover:scale-110 transition-transform">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </Link>
            <Link href="https://www.instagram.com/fahampesa?igsh=MWV5bWlvZGR3bjN4eQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors group">
              <Instagram className="w-4 h-4 text-[#001223] group-hover:scale-110 transition-transform" />
            </Link>
            <Link href="https://wa.me/message/55YQ3IBJHOQCM1" target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors group">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#001223] fill-current group-hover:scale-110 transition-transform">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  )
}
