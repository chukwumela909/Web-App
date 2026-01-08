'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { DownloadModal } from '@/components/DownloadModal'

const assets = {
  logo: '/assets/figma/landing/logo-icon.svg',
}

interface PublicHeaderProps {
  onOpenDownload?: () => void;
}

export default function PublicHeader({ onOpenDownload }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Use local state for modal if not provided by parent, 
  // but ideally parent controls modal visibility so it can be shared or at root.
  // For simplicity here, we assume parent might manage it, but if not we can't open it easily 
  // without duplicating the modal. 
  // The LandingPage has the modal at root. 
  // Let's assume the PAGES (Terms, Privacy, Contact) will render the Modal and pass the open handler.
  
  const handleOpenDownload = () => {
    if (onOpenDownload) {
      onOpenDownload();
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white h-[80px] lg:h-[100px] flex items-center border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] w-full flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-[7px]">
            <div className="w-[32px] h-[32px] lg:w-[40px] lg:h-[40px] relative">
              <Image src={assets.logo} alt="FahamPesa" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-roboto font-bold text-[18px] lg:text-[24px] text-[#001223] leading-none">Fahampesa</span>
              <span className="font-inter font-light text-[10px] lg:text-[12px] text-[#001223]">Smart Business Tools</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/about" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-6 py-4 rounded-[12px] hover:bg-[#E6F0FF] transition-colors">About Us</Link>
            <Link href="/#product" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-6 py-4 rounded-[12px] hover:bg-[#E6F0FF] transition-colors">Products</Link>
            <Link href="/#who-we-serve" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-6 py-4 rounded-[12px] hover:bg-[#E6F0FF] transition-colors">Benefits</Link>
            <Link href="/dashboard/subscription" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-6 py-4 rounded-[12px] hover:bg-[#E6F0FF] transition-colors">Pricing</Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-6 py-4 rounded-[12px] hover:bg-[#E6F0FF] transition-colors">
              Login
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleOpenDownload();
              }}
              className="font-dm-sans font-semibold text-[16px] text-[#001031] border border-[#001031] rounded-[12px] px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              Get Desktop App
            </button>
            <Link
              href="/login"
              className="font-dm-sans font-semibold text-[16px] text-white bg-[#004aad] rounded-[12px] px-6 py-4 hover:bg-[#003d8f] transition-colors"
            >
              Start a free trial
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-[#001223]" />
            ) : (
              <Menu className="w-6 h-6 text-[#001223]" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[80px] z-40 bg-white border-t border-gray-100 p-4">
          <nav className="flex flex-col gap-2">
            <Link href="/about" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-4 py-3 rounded-[12px] hover:bg-[#E6F0FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link href="/#product" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-4 py-3 rounded-[12px] hover:bg-[#E6F0FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>Products</Link>
            <Link href="/#who-we-serve" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-4 py-3 rounded-[12px] hover:bg-[#E6F0FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>Benefits</Link>
            <Link href="/dashboard/subscription" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-4 py-3 rounded-[12px] hover:bg-[#E6F0FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <hr className="my-2 border-gray-200" />
            <Link href="/login" className="font-dm-sans font-semibold text-[16px] text-[#001031] px-4 py-3 rounded-[12px] hover:bg-[#E6F0FF] transition-colors" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleOpenDownload()
              }}
              className="font-dm-sans font-semibold text-[16px] text-[#001031] border border-[#001031] rounded-[12px] px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              Get Desktop App
            </button>
            <Link
              href="/login"
              className="font-dm-sans font-semibold text-[16px] text-white bg-[#004aad] rounded-[12px] px-4 py-3 hover:bg-[#003d8f] transition-colors text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start a free trial
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
