'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const assets = {
  logo: '/assets/figma/landing/logo-icon.svg',
}

interface PublicHeaderProps {
  onOpenDownload?: () => void;
}

export default function PublicHeader({ onOpenDownload }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const handleOpenDownload = () => {
    if (onOpenDownload) {
      onOpenDownload();
    }
  }

  return (
    <>
      {/* Header - Matches Landing Page exactly */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white h-[80px] flex items-center border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] w-full flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-[7px]">
            <div className="w-[32px] h-[32px] relative">
              <Image src={assets.logo} alt="FahamPesa" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-roboto font-bold text-[20px] text-[#001223] leading-none">Fahampesa</span>
              <span className="font-inter font-light text-[10px] text-[#001223]">Smart Business Tools</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/#product" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-4 py-2 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Product</Link>
            <Link href="/#who-we-serve" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-4 py-2 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Customers</Link>
            <Link href="/dashboard/subscription" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-4 py-2 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Pricing</Link>
            <Link href="/installation" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-4 py-2 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Installation</Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-6 py-3 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">
              Login
            </Link>
            <button
              onClick={handleOpenDownload}
              className="font-dm-sans font-semibold text-[14px] text-[#001031] border border-[#001031] rounded-[10px] px-6 py-3 hover:bg-gray-50 hover:border-[#004AAD] hover:text-[#004AAD] transition-colors"
            >
              Get Desktop App
            </button>
            <Link
              href="/login"
              className="font-dm-sans font-semibold text-[14px] text-white bg-[#004AAD] rounded-[10px] px-6 py-3 hover:bg-[#003a8c] transition-colors flex items-center gap-2"
            >
              Start a free trial
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-white lg:hidden flex flex-col"
            >
              {/* Mobile Menu Header */}
              <div className="h-[80px] flex items-center justify-between px-4 sm:px-6 border-b border-gray-100 shrink-0">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-[7px]">
                  <div className="w-[32px] h-[32px] relative">
                    <Image src={assets.logo} alt="FahamPesa" fill className="object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-roboto font-bold text-[20px] text-[#001223] leading-none">Fahampesa</span>
                    <span className="font-inter font-light text-[10px] text-[#001223]">Smart Business Tools</span>
                  </div>
                </Link>
                <button
                  className="p-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={24} className="text-[#001031]" />
                </button>
              </div>

              {/* Mobile Menu Links */}
              <div className="flex-1 flex flex-col items-center pt-8 gap-2 px-4">
                <Link 
                  href="/#product" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="font-dm-sans font-bold text-[16px] text-[#001031] py-3 px-4 rounded-[8px] hover:bg-[#F0F5FF] transition-colors w-full text-center"
                >
                  Products
                </Link>
                <Link 
                  href="/#who-we-serve" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="font-dm-sans font-bold text-[16px] text-[#001031] py-3 px-4 rounded-[8px] hover:bg-gray-50 w-full text-center"
                >
                  Customers
                </Link>
                <Link 
                  href="/dashboard/subscription" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="font-dm-sans font-bold text-[16px] text-[#001031] py-3 px-4 rounded-[8px] hover:bg-gray-50 w-full text-center"
                >
                  Pricing
                </Link>
                <Link 
                  href="/installation" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="font-dm-sans font-bold text-[16px] text-[#001031] py-3 px-4 rounded-[8px] hover:bg-gray-50 w-full text-center"
                >
                  Installation
                </Link>
              </div>

              {/* Mobile Menu Footer Actions */}
              <div className="p-4 flex flex-col gap-4 mb-4">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="font-dm-sans font-bold text-[16px] text-[#001031] border border-[#001031] rounded-[12px] py-4 w-full text-center hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-dm-sans font-bold text-[16px] text-white bg-[#1D4ED8] rounded-[12px] py-4 w-full text-center hover:bg-[#1e40af] transition-colors"
                >
                  Start a free trial
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer to account for fixed header */}
      <div className="h-[80px]" />
    </>
  )
}
