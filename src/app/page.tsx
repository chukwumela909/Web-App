'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import { DownloadModal } from '@/components/DownloadModal'
import { ProductCard, StockDashboardMockup } from '@/components/ProductMockup'

const assets = {
  logo: '/assets/figma/landing/logo-icon.svg',
  check: '/assets/figma/landing/check-circle.svg',
  wifiOff: '/assets/figma/landing/wifi-off.svg',
  sun: '/assets/figma/landing/sun.svg',
  download: '/assets/figma/landing/download.svg',
  arrowForward: '/assets/figma/landing/arrow-forward.svg',
  play: '/assets/figma/landing/play-icon.svg',
  arrowUp: '/assets/figma/landing/arrow-up.svg',
  arrowDown: '/assets/figma/landing/arrow-down.svg',
  arrowUpDuotone: '/assets/figma/landing/arrow-up-duotone.svg',
  arrowUpDuotone1: '/assets/figma/landing/arrow-up-duotone-1.svg',
  card1: '/assets/figma/landing/card-image-1.png',
  card2: '/assets/figma/landing/card-image-2.png',
  card3: '/assets/figma/landing/card-image-3.png',
  heroMock: 'https://www.figma.com/api/mcp/asset/0b078838-baad-42e0-a0f2-bae33da9702f',
  avatar1: '/assets/figma/landing/avatar-1.png',
  avatar2: '/assets/figma/landing/avatar-2.png',
  avatar3: '/assets/figma/landing/avatar-3.png',
  avatar4: '/assets/figma/landing/avatar-4.png',
  avatar5: '/assets/figma/landing/avatar-5.png',
  faqPattern: '/assets/figma/landing/faq-pattern.png',
  instagram: '/assets/figma/landing/instagram.svg',
  facebook: '/assets/figma/landing/facebook.svg',
  xIcon: '/assets/figma/landing/x-icon.svg',
  appStore: '/app_store.png',
  googlePlay: '/google_play.png',
  visualSection: 'https://www.figma.com/api/mcp/asset/0b078838-baad-42e0-a0f2-bae33da9702f',
  testimonialThumbnail: '/testimonial-thumbnail.png',
  testimonialVideo: '/testimonial-mohammed.mp4',
  playIcon: 'https://www.figma.com/api/mcp/asset/8720f529-7764-486a-8aff-9b42c29a01fc',
}

const faqs = [
  {
    question: "What is Fahampesa?",
    answer: "Fahampesa is a professional business management platform combining point of sale, inventory control, and business reporting for growing businesses."
  },
  {
    question: "Who is Fahampesa built for?",
    answer: "Retailers, wholesalers, pharmacies, service businesses, and multi-branch operations that need accuracy and control."
  },
  {
    question: "Does Fahampesa work offline?",
    answer: "Yes. Sales, stock, and records continue working offline and sync securely when internet returns."
  },
  {
    question: "Which devices are supported?",
    answer: "Windows, macOS, Linux, Android, and iOS are supported."
  },
  {
    question: "Does Fahampesa support M-Pesa?",
    answer: "Yes. M-Pesa integration is available in supported regions."
  },
  {
    question: "Is Fahampesa suitable for small businesses?",
    answer: "Yes. Fahampesa supports businesses from early stage to growth phase."
  },
  {
    question: "Can Fahampesa handle multiple branches?",
    answer: "Yes. Multi-branch management and centralized reporting are supported."
  },
  {
    question: "How does Fahampesa help reduce losses?",
    answer: "By providing clear stock tracking, transaction records, and sales visibility to identify issues early."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. Secure infrastructure and controlled access protect your data."
  },
  {
    question: "Who owns the business data?",
    answer: "You own your business data at all times."
  },
  {
    question: "How much does Fahampesa cost?",
    answer: "A free entry plan is available. Paid plans unlock advanced features."
  },
  {
    question: "Do I need a credit card to start?",
    answer: "No. You can start without providing payment details."
  },
  {
    question: "Can I export my data?",
    answer: "Yes. Business records can be exported when required."
  },
  {
    question: "What kind of support is available?",
    answer: "Support is provided through official Fahampesa channels."
  },
  {
    question: "Is Fahampesa compliant with local regulations?",
    answer: "Yes. Fahampesa follows applicable regional regulations."
  },
  {
    question: "How do I get started?",
    answer: "Create an account, install Fahampesa, and begin recording sales and stock."
  },
  {
    question: "Is Fahampesa suitable for long-term use?",
    answer: "Yes. Fahampesa is built as a long-term business system."
  }
]

function FAQItem({ question, answer, isOpen, onClick }: { question: string, answer: string, isOpen: boolean, onClick: () => void }) {
  return (
    <div className="border-b border-[#9b9797] py-2 w-full cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-4 w-full">
          <h3 className="font-inter font-semibold text-[20px] text-[#001031] leading-[35px] tracking-[-0.4px]">
            {question}
          </h3>
          <AnimatePresence>
            {isOpen && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="font-inter font-normal text-[20px] text-[#2f3037] leading-[35px] tracking-[-0.4px] overflow-hidden"
              >
                {answer}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <button className="shrink-0 mt-1">
          <Image
            src={isOpen ? assets.arrowUpDuotone : assets.arrowUpDuotone1}
            alt="Toggle"
            width={24}
            height={24}
            className={`transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`}
          />
        </button>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlay = () => {
    setIsPlaying(true)
    // Small timeout to ensure video element is rendered before playing
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play()
      }
    }, 0)
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <DownloadModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white h-[80px] flex items-center border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] w-full flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-[7px]">
            <div className="w-[32px] h-[32px] relative">
              <Image src={assets.logo} alt="FahamPesa" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-roboto font-bold text-[20px] text-[#001223] leading-none">Fahampesa</span>
              <span className="font-inter font-light text-[10px] text-[#001223]">Smart Business Tools</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="#product" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-4 py-2 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Product</Link>
            <Link href="#benefits" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-4 py-2 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Benefits</Link>
            <Link href="#pricing" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-4 py-2 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Pricing</Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="font-dm-sans font-semibold text-[14px] text-[#001031] px-6 py-3 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">
              Login
            </Link>
            <button
              onClick={() => setDownloadModalOpen(true)}
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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-[80px] left-0 right-0 bg-white border-b border-gray-200 shadow-lg lg:hidden p-4 flex flex-col gap-4"
            >
              <Link href="#product" onClick={() => setMobileMenuOpen(false)} className="font-dm-sans font-semibold text-[14px] text-[#001031] py-2 px-4 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Product</Link>
              <Link href="#benefits" onClick={() => setMobileMenuOpen(false)} className="font-dm-sans font-semibold text-[14px] text-[#001031] py-2 px-4 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Benefits</Link>
              <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="font-dm-sans font-semibold text-[14px] text-[#001031] py-2 px-4 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Pricing</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="font-dm-sans font-semibold text-[14px] text-[#001031] py-2 px-4 rounded-[8px] hover:bg-[#E6F0FF] transition-colors">Login</Link>
              <button
                onClick={() => { setDownloadModalOpen(true); setMobileMenuOpen(false); }}
                className="font-dm-sans font-semibold text-[14px] text-[#001031] border border-[#001031] rounded-[10px] px-6 py-3 w-full hover:border-[#004AAD] hover:text-[#004AAD] transition-colors"
              >
                Get Desktop App
              </button>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="font-dm-sans font-semibold text-[14px] text-white bg-[#004AAD] rounded-[10px] px-6 py-3 w-full text-center flex items-center justify-center gap-2"
              >
                Start a free trial
                <ArrowUpRight size={16} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section className="pt-[80px] bg-[#DEE4FF] min-h-[600px] lg:min-h-[750px] relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] pt-[60px] lg:pt-[60px] pb-[40px] lg:pb-[80px] relative z-10">
          <div className="lg:w-[50%]">
            {/* Floating Tag */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center bg-white mb-6 lg:mb-8 rounded-[90px] px-3 lg:px-5 py-1.5 lg:py-2.5 gap-2"
            >
              <Image src={assets.check} alt="" width={20} height={20} className="lg:w-[24px] lg:h-[24px]" />
              <span className="font-dm-sans font-semibold text-[12px] lg:text-[18px] text-[#004AAD]">Smart tool for modern businesses</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-inter font-medium text-[32px] sm:text-[48px] lg:text-[72px] text-[#001031] leading-[1.1] tracking-[-1px] lg:tracking-[-2px] mb-6 lg:mb-8"
            >
              POS System built for your Business
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-inter font-normal text-[14px] lg:text-[18px] text-[#001031] leading-[22px] lg:leading-[30px] tracking-[-0.4px] mb-8 lg:mb-12 max-w-[600px]"
            >
              Fahampesa gives your business the tools to sell faster, track stock in real time, and stay in control anywhere. Secure, offline-first, and built to scale with you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-row gap-3 lg:gap-5 mb-8 lg:mb-12"
            >
              <button
                onClick={() => setDownloadModalOpen(true)}
                className="flex items-center justify-center gap-[8px] lg:gap-[10px] border border-[#004AAD] rounded-[10px] px-[16px] lg:px-[32px] py-[12px] lg:py-[18px] hover:bg-[#004AAD]/5 transition-colors"
              >
                <span className="font-dm-sans font-semibold text-[14px] lg:text-[18px] text-[#004AAD]">Download App</span>
                <Image src={assets.download} alt="" width={16} height={16} className="lg:w-[22px] lg:h-[22px]" />
              </button>
              <Link href="/login" className="flex items-center justify-center gap-[8px] lg:gap-[10px] bg-[#004AAD] rounded-[10px] px-[16px] lg:px-[32px] py-[12px] lg:py-[18px] hover:bg-[#003a8c] transition-colors">
                <span className="font-dm-sans font-semibold text-[14px] lg:text-[18px] text-white">Start a free trial</span>
                <Image src={assets.arrowForward} alt="" width={16} height={16} className="lg:w-[22px] lg:h-[22px]" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 lg:gap-10"
            >
              <div className="flex items-center gap-[6px] lg:gap-[10px]">
                <Image src={assets.wifiOff} alt="" width={16} height={16} className="lg:w-[20px] lg:h-[20px]" />
                <span className="font-inter font-normal text-[12px] lg:text-[16px] text-[#001031] tracking-[-0.4px]">Works online and offline</span>
              </div>
              <div className="flex items-center gap-[6px] lg:gap-[10px]">
                <Image src={assets.sun} alt="" width={16} height={16} className="lg:w-[20px] lg:h-[20px]" />
                <span className="font-inter font-normal text-[12px] lg:text-[16px] text-[#001031] tracking-[-0.4px]">Real-time reports and insights</span>
              </div>
            </motion.div>
          </div>

          {/* Hero mockup image - Mobile */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:hidden relative -mr-20 ml-4 w-[calc(100%+80px)] h-[350px] mt-8"
          >
            <Image 
              src="/assets/figma/landing/hero-image.png" 
              alt="FahamPesa Dashboard Preview" 
              fill 
              className="object-contain object-right"
              priority
            />
          </motion.div>

          {/* Hero mockup image - Desktop */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden lg:block absolute right-0 top-[50%] -translate-y-[50%] w-[52%] h-[70%] max-h-[450px]"
          >
            <Image 
              src="/assets/figma/landing/hero-image.png" 
              alt="FahamPesa Dashboard Preview" 
              fill 
              className="object-contain object-right"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* Product Section */}
      <section id="product" className="py-[80px] bg-white relative">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px]">
          <div className="text-center mb-[80px]">
            <span className="font-inter font-medium text-[14px] text-[#004AAD] tracking-[0.9px] uppercase block mb-4">Products</span>
            <h2 className="font-inter font-medium text-[36px] sm:text-[48px] lg:text-[60px] text-[#001031] leading-[1.19] tracking-[-1.5px] mb-6">
              Everything You Need <br/> to Run Your Business
            </h2>
            <p className="font-inter font-normal text-[16px] sm:text-[18px] text-[#001031] leading-[28px] tracking-[-0.4px] max-w-[720px] mx-auto">
              From inventory management to sales tracking, FahamPesa provides all the tools small business owners need to succeed in today&apos;s competitive market.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <ProductCard
              title="Smart Inventory Management"
              description="Track your products, manage stock levels, and get low-stock alerts. Perfect for kiosks and small shops."
              imageSrc="/image-mockup1.png"
              bgColor="bg-[#E6EFFC]"
            />

            <ProductCard
              title="Quick Sales Recording"
              description="Record sales instantly and auto-update inventory. Optimized for fast transactions in busy environments."
              imageSrc="/image-mockup2.png"
              bgColor="bg-[#FFF2E7]"
            />

            <ProductCard
              title="Daily & Weekly Reports"
              description="Get insights into your business performance with detailed analytics and export reports via WhatsApp or PDF."
              imageSrc="/image-mockup3.png"
              bgColor="bg-[#EAE6FC]"
            />
          </div>
        </div>
      </section>

      {/* Visual Section with Benefit Cards */}
      <section className="w-full">
        <div className="w-full h-[500px] sm:h-[700px] lg:h-[884px] relative">
          <Image 
            src={assets.visualSection} 
            alt="FahamPesa Dashboard Preview" 
            fill 
            className="object-cover object-center"
            priority
          />
          {/* Benefit Cards Overlay */}
          <div className="absolute inset-0 flex items-end justify-center pb-16 lg:pb-24">
            <div className="flex flex-col lg:flex-row gap-6 px-4 sm:px-6 lg:mb-36  w-full max-w-[1440px] items-center justify-center">
              {/* Sales Analytics Card */}
              <div className="bg-[rgba(9,9,11,0.4)] backdrop-blur-sm border border-[rgba(89,91,93,0.8)] flex flex-col gap-6 lg:gap-9 items-center justify-center py-8 lg:py-10 px-8 lg:px-12 rounded-[32px] lg:rounded-[48px] w-full lg:w-[350px]">
                <div className="bg-[rgba(255,255,255,0.2)] flex items-center justify-center p-4 lg:p-[18px] rounded-[24px] lg:rounded-[30px] size-[50px] lg:size-[60px]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17ZM19 19H5V5H19V19.1M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="white"/>
                  </svg>
                </div>
                <p className="font-inter font-semibold text-[24px] lg:text-[32px] text-white tracking-[-0.4px] leading-[1.2]">
                  Sales Analytics
                </p>
                <p className="font-inter font-normal text-[14px] lg:text-[16px] text-[#eee] text-center tracking-[-0.4px] leading-[24px]">
                  Track daily, weekly, and monthly sales performance with beautiful charts and graphs.
                </p>
              </div>

              {/* Growth Insights Card */}
              <div className="bg-[rgba(9,9,11,0.4)] backdrop-blur-sm border border-[rgba(89,91,93,0.8)] flex flex-col gap-6 lg:gap-9 items-center justify-center py-8 lg:py-10 px-8 lg:px-12 rounded-[32px] lg:rounded-[48px] w-full lg:w-[350px]">
                <div className="bg-[rgba(255,255,255,0.2)] flex items-center justify-center p-4 lg:p-[18px] rounded-[24px] lg:rounded-[30px] size-[50px] lg:size-[60px]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" fill="white"/>
                  </svg>
                </div>
                <p className="font-inter font-semibold text-[24px] lg:text-[32px] text-white tracking-[-0.4px] leading-[1.2]">
                  Growth Insights
                </p>
                <p className="font-inter font-normal text-[14px] lg:text-[16px] text-[#eee] text-center tracking-[-0.4px] leading-[24px]">
                  Identify trends, peak sales hours, and best-selling products to optimize your business.
                </p>
              </div>

              {/* Inventory Reports Card */}
              <div className="bg-[rgba(9,9,11,0.4)] backdrop-blur-sm border border-[rgba(89,91,93,0.8)] flex flex-col gap-6 lg:gap-9 items-center justify-center py-8 lg:py-10 px-8 lg:px-12 rounded-[32px] lg:rounded-[48px] w-full lg:w-[350px]">
                <div className="bg-[rgba(255,255,255,0.2)] flex items-center justify-center p-4 lg:p-[18px] rounded-[24px] lg:rounded-[30px] size-[50px] lg:size-[60px]">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2H4C3 2 2 2.9 2 4V7.01C2 7.73 2.43 8.35 3 8.7V20C3 21.1 4.1 22 5 22H19C19.9 22 21 21.1 21 20V8.7C21.57 8.35 22 7.73 22 7.01V4C22 2.9 21 2 20 2ZM19 20H5V9H19V20ZM20 7H4V4H20V7Z" fill="white"/>
                    <path d="M15 12H9V14H15V12Z" fill="white"/>
                  </svg>
                </div>
                <p className="font-inter font-semibold text-[24px] lg:text-[30px] text-white tracking-[-0.4px] leading-[1.2]">
                  Inventory Reports
                </p>
                <p className="font-inter font-normal text-[14px] lg:text-[16px] text-[#eee] text-center tracking-[-0.4px] leading-[24px]">
                  Monitor stock levels, track product movement, and get alerts for low inventory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section className="py-[80px] bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px]">
          <div className="text-center mb-[80px]">
            <span className="font-inter font-medium text-[14px] text-[#004AAD] tracking-[0.9px] uppercase block mb-4">WHO WE SERVE</span>
            <h2 className="font-inter font-medium text-[36px] sm:text-[48px] lg:text-[60px] text-[#001031] leading-[1.19] tracking-[-1.5px] mb-6">
              Trusted by businesses <br className="hidden lg:block" /> from various industries
            </h2>
            <p className="font-inter font-normal text-[16px] text-[#001031] leading-[28px] tracking-[-0.4px]">
              Here are some of the Business can that benefit&apos;s from our solution
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {/* Card 1: Small retail shops */}
            <div className="bg-[#EFEEF3] rounded-[48px] p-8 lg:p-[50px] min-h-[400px] relative overflow-hidden flex flex-col lg:flex-row items-center">
              <div className="lg:w-[45%] z-10">
                <h3 className="font-inter font-normal text-[32px] lg:text-[48px] text-[#001031] leading-tight tracking-[-0.4px] mb-5">
                  Small retail shops. Dukas and kiosks.
                </h3>
                <p className="font-inter font-normal text-[16px] text-[#001031] leading-[24px] tracking-[-0.4px]">
                  We built Fahampesa for everyday sellers who want to move faster and sell smarter. Easily record sales, track stock, and know what&apos;s selling; even if you run a small shop or kiosk. No complicated setup, just simple tools that help you stay in control and avoid losses.
                </p>
              </div>
              <div className="lg:w-[55%] relative h-[330px] w-full mt-8 lg:mt-0 flex items-center justify-center lg:justify-end gap-4">
                {/* Sales Card Mockup */}
                <div className="relative w-[264px] h-[330px]">
                  <div className="absolute bg-[#fafbfb] h-[88px] left-1/2 translate-x-[calc(-50%+19.5px)] opacity-60 rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-1/2 translate-y-[calc(-50%+21px)] w-[225px]" />
                  <div className="absolute bg-[#fafbfb] h-[88px] left-1/2 translate-x-[calc(-50%+10px)] opacity-80 rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-1/2 translate-y-[calc(-50%-9px)] w-[244px]" />
                  <div className="absolute bg-white flex flex-col gap-[16px] h-[100px] items-start justify-center left-0 px-[22px] py-[13px] rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-[71px] w-[264px]">
                    <p className="font-inter font-medium text-[20px] text-[#09090b]">New Sale - Xiaomi A7...</p>
                    <div className="flex gap-[6px] items-center">
                      <span className="font-inter font-normal text-[16px] text-[#71717a]">12/25/2025</span>
                      <span className="w-[4px] h-[4px] bg-[#71717a] rounded-full" />
                      <span className="font-inter font-normal text-[16px] text-[#71717a]">10:40:02 AM</span>
                    </div>
                  </div>
                </div>
                {/* Person Image */}
                <div className="relative w-[250px] h-[300px]">
                  <div className="relative w-full h-full rounded-[32px] overflow-hidden">
                    <Image src={assets.card1} alt="" fill className="object-cover" />
                  </div>
                  <div className="absolute bottom-[10px] left-[57px] bg-white rounded-[16px] px-[10px] py-[8px] flex items-center gap-[6px] shadow-md">
                    {/* <Image src={assets.avatar1} alt="" width={16} height={16} className="rounded-full" /> */}
                    <span className="w-[10px] h-[10px] bg-[#004AAD] rounded-full" />
                    <span className="font-inter font-normal text-[14px] text-[#001031] tracking-[-0.4px]">Joseph</span>
                  </div>
                  <div className="absolute bottom-[10px] left-[16px]">
                    <Image src={assets.avatar2} alt="" width={33} height={33} className="rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Wholesalers */}
            <div className="bg-[#EFEEF3] rounded-[48px] p-8 lg:p-[50px] min-h-[400px] relative overflow-hidden flex flex-col lg:flex-row items-center">
              <div className="lg:w-[55%] relative h-[330px] w-full mb-8 lg:mb-0 flex items-center justify-center lg:justify-start gap-4 order-2 lg:order-1">
                {/* Sales Card Mockup */}
                <div className="relative w-[264px] h-[330px]">
                  <div className="absolute bg-[#fafbfb] h-[88px] left-1/2 translate-x-[calc(-50%+19.5px)] opacity-60 rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-1/2 translate-y-[calc(-50%+21px)] w-[225px]" />
                  <div className="absolute bg-[#fafbfb] h-[88px] left-1/2 translate-x-[calc(-50%+10px)] opacity-80 rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-1/2 translate-y-[calc(-50%-9px)] w-[244px]" />
                  <div className="absolute bg-white flex flex-col gap-[16px] h-[100px] items-start justify-center left-0 px-[22px] py-[13px] rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-[71px] w-[264px]">
                    <p className="font-inter font-medium text-[20px] text-[#09090b]">New Sale - Rice Bags...</p>
                    <div className="flex gap-[6px] items-center">
                      <span className="font-inter font-normal text-[16px] text-[#71717a]">11/29/2025</span>
                      <span className="w-[4px] h-[4px] bg-[#71717a] rounded-full" />
                      <span className="font-inter font-normal text-[16px] text-[#71717a]">02:50:09 PM</span>
                    </div>
                  </div>
                </div>
                {/* Person Image */}
                <div className="relative w-[250px] h-[300px]">
                  <div className="relative w-full h-full rounded-[32px] overflow-hidden">
                    <Image src={assets.card2} alt="" fill className="object-cover" />
                  </div>
                  <div className="absolute bottom-[10px] left-[57px] bg-white rounded-[16px] px-[10px] py-[8px] flex items-center gap-[6px] shadow-md">
                    <span className="w-[10px] h-[10px] bg-[#004AAD] rounded-full" />
                    <span className="font-inter font-normal text-[14px] text-[#001031] tracking-[-0.4px]">Nelson</span>
                  </div>
                  <div className="absolute bottom-[10px] left-[16px]">
                    <Image src={assets.avatar3} alt="" width={33} height={33} className="rounded-full" />
                  </div>
                </div>
              </div>
              <div className="lg:w-[45%] z-10 order-1 lg:order-2">
                <h3 className="font-inter font-normal text-[32px] lg:text-[48px] text-[#001031] leading-tight tracking-[-0.4px] mb-5">
                  Wholesalers and mini distributors.
                </h3>
                <p className="font-inter font-normal text-[16px] text-[#001031] leading-[24px] tracking-[-0.4px]">
                  Manage high-volume sales with clarity and confidence. Track bulk transactions, monitor inventory levels, and keep accurate sales records across customers. Fahampesa helps you reduce errors, stay organized, and scale your distribution business with ease.
                </p>
              </div>
            </div>

            {/* Card 3: Service businesses */}
            <div className="bg-[#EFEEF3] rounded-[48px] p-8 lg:p-[50px] min-h-[400px] relative overflow-hidden flex flex-col lg:flex-row items-center">
              <div className="lg:w-[45%] z-10">
                <h3 className="font-inter font-normal text-[32px] lg:text-[48px] text-[#001031] leading-tight tracking-[-0.4px] mb-5">
                  Service businesses. Salons, garages, cyber cafes.
                </h3>
                <p className="font-inter font-normal text-[16px] text-[#001031] leading-[24px] tracking-[-0.4px]">
                  Perfect for businesses that sell services, not just products. Quickly record services rendered, manage daily transactions, and understand your earnings without paperwork.
                </p>
              </div>
              <div className="lg:w-[55%] relative h-[330px] w-full mt-8 lg:mt-0 flex items-center justify-center lg:justify-end gap-4">
                {/* Sales Card Mockup */}
                <div className="relative w-[264px] h-[330px]">
                  <div className="absolute bg-[#fafbfb] h-[88px] left-1/2 translate-x-[calc(-50%+19.5px)] opacity-60 rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-1/2 translate-y-[calc(-50%+21px)] w-[225px]" />
                  <div className="absolute bg-[#fafbfb] h-[88px] left-1/2 translate-x-[calc(-50%+10px)] opacity-80 rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-1/2 translate-y-[calc(-50%-9px)] w-[244px]" />
                  <div className="absolute bg-white flex flex-col gap-[16px] h-[100px] items-start justify-center left-0 px-[22px] py-[13px] rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] top-[71px] w-[264px]">
                    <p className="font-inter font-medium text-[20px] text-[#09090b]">New Sale - Virgin Hair..</p>
                    <div className="flex gap-[6px] items-center">
                      <span className="font-inter font-normal text-[16px] text-[#71717a]">12/31/2025</span>
                      <span className="w-[4px] h-[4px] bg-[#71717a] rounded-full" />
                      <span className="font-inter font-normal text-[16px] text-[#71717a]">09:49:00 AM</span>
                    </div>
                  </div>
                </div>
                {/* Person Image */}
                <div className="relative w-[250px] h-[300px]">
                  <div className="relative w-full h-full rounded-[32px] overflow-hidden">
                    <Image src={assets.card3} alt="" fill className="object-cover" />
                  </div>
                  <div className="absolute bottom-[10px] left-[57px] bg-white rounded-[16px] px-[10px] py-[8px] flex items-center gap-[6px] shadow-md">
                     <span className="w-[10px] h-[10px] bg-[#004AAD] rounded-full" />
                    <span className="font-inter font-normal text-[14px] text-[#001031] tracking-[-0.4px]">Maria</span>
                  </div>
                  <div className="absolute bottom-[10px] left-[16px]">
                    <Image src={assets.avatar4} alt="" width={33} height={33} className="rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Review Section */}
      <section className="py-[80px] bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px] text-center">
          <h2 className="font-inter font-medium text-[36px] sm:text-[48px] lg:text-[60px] text-[#001031] mb-4">
            Customer&apos;s Review
          </h2>
          <p className="font-inter font-normal text-[16px] text-[#001031] mb-[60px]">
            Real business owners sharing their success stories with FahamPesa
          </p>

          <div 
            className="relative w-full max-w-[700px] mx-auto h-[350px] sm:h-[550px] bg-[#363232] rounded-[32px] overflow-hidden flex items-center justify-center group cursor-pointer"
            onClick={handlePlay}
          >
            {!isPlaying ? (
              <>
                {/* Video Thumbnail */}
                <div className="absolute inset-0">
                  <Image 
                    src={assets.testimonialThumbnail} 
                    alt="Customer Testimonial" 
                    fill 
                    className="object-cover opacity-80 group-hover:opacity-70 transition-opacity"
                  />
                </div>
                
                {/* Play Button */}
                <div className="w-[80px] h-[80px] relative z-10 transition-transform group-hover:scale-110">
                <Image src={assets.play} alt="Play" fill className="object-contain" />
                </div>
              </>
            ) : (
              <video
                ref={videoRef}
                src={assets.testimonialVideo}
                className="absolute inset-0 h-full w-full object-cover"
                controls
                autoPlay
                playsInline
              />
            )}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-[80px] bg-[#DEE4FF]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px]">
          <h2 className="font-inter font-medium text-[36px] sm:text-[48px] text-[#001031] mb-[80px] tracking-[-1.5px]">
            Get started in 3 simple steps:
          </h2>

          <div className="flex flex-col lg:flex-row justify-between gap-5 items-center lg:items-start">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-[400px] h-[380px] bg-[#001223] rounded-[40px] relative mb-6 shrink-0 overflow-hidden">
                <div className="absolute top-[30px] left-[30px] w-[340px] bg-white rounded-[24px] p-[40px] flex flex-col gap-[29px]">
                  <h3 className="font-dm-sans font-bold text-[24px] text-[#191D23]">Set up your account</h3>
                  <div className="w-full flex flex-col gap-[10px]">
                    <div>
                      <label className="block font-dm-sans text-[16px] text-black mb-[10px]">Business Name</label>
                      <div className="border border-[#BFC4CB] rounded-[8px] p-[16px] w-full">
                        <p className="font-dm-sans text-[16px] text-[#64748B]">Enter your business name</p>
                      </div>
                    </div>
                    <div>
                      <label className="block font-dm-sans text-[16px] text-black mb-[10px]">Phone Number</label>
                      <div className="border border-[#BFC4CB] rounded-[8px] p-[8px] flex gap-[10px] items-center w-full">
                        <div className="bg-[#F0F2F5] rounded-[8px] p-[8px] flex items-center gap-[2px] shrink-0">
                          <Image src={assets.avatar5} alt="" width={24} height={24} />
                          <span className="text-[#64748B] text-[16px] font-dm-sans">+254</span>
                          <Image src={assets.arrowDown} alt="" width={20} height={20} />
                        </div>
                        <p className="text-[#64748B] text-[16px] font-dm-sans flex-1">123 4567...</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F0F2F5] rounded-[16px] p-[16px] flex items-center justify-center w-full">
                    <span className="font-dm-sans font-normal text-[16px] text-[#64748B]">Continue</span>
                  </div>
                </div>
              </div>
              <h3 className="font-inter font-normal text-[30px] text-[#001031] mb-3 text-center">Create account</h3>
              <p className="font-inter font-normal text-[18px] text-[#001031] text-center max-w-[340px] leading-[24px]">
                Create your Fahampesa account with your phone number to get started.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-[400px] h-[380px] bg-[#001223] rounded-[40px] relative mb-6 shrink-0 overflow-hidden">
                <div className="absolute top-[30px] left-[30px] w-[340px] bg-white rounded-[24px] p-[40px] flex flex-col gap-[29px]">
                  <h3 className="font-dm-sans font-bold text-[24px] text-[#191D23]">Add New Product</h3>
                  <div className="w-full flex flex-col gap-[10px]">
                    <div>
                      <label className="block font-dm-sans text-[16px] text-black mb-[10px]">Product Name<span className="text-[#E92C2C]">*</span></label>
                      <div className="border border-[#BFC4CB] rounded-[8px] p-[16px] w-full">
                        <p className="font-dm-sans text-[16px] text-[#64748B]">e.g., Coca-Cola 500ml</p>
                      </div>
                    </div>
                    <div>
                      <label className="block font-dm-sans text-[16px] text-black mb-[10px]">Category<span className="text-[#E92C2C]">*</span></label>
                      <div className="border border-[#BFC4CB] rounded-[8px] p-[16px] flex justify-between items-center gap-[10px] w-full">
                        <span className="text-[#191D23] text-[16px] font-dm-sans">Select Category</span>
                        <Image src={assets.arrowDown} alt="" width={24} height={24} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F0F2F5] rounded-[16px] p-[16px] flex items-center justify-center w-full">
                    <span className="font-dm-sans font-normal text-[16px] text-[#64748B]">Next</span>
                  </div>
                </div>
              </div>
              <h3 className="font-inter font-normal text-[30px] text-[#001031] mb-3 text-center">Add Product</h3>
              <p className="font-inter font-normal text-[18px] text-[#001031] text-center max-w-[340px] leading-[24px]">
                Create your Fahampesa account and set up your business profile to get started.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-[400px] h-[380px] bg-[#001223] rounded-[40px] relative mb-6 shrink-0 overflow-hidden">
                <div className="absolute top-[30px] left-[30px] w-[340px] bg-white rounded-[24px] p-[40px] flex flex-col gap-[29px]">
                  <h3 className="font-dm-sans font-bold text-[24px] text-[#191D23]">Record Sale</h3>
                  <div className="w-full flex flex-col gap-[10px]">
                    <div>
                      <label className="block font-dm-sans text-[16px] text-black mb-[10px]">Product/Service<span className="text-[#E92C2C]">*</span></label>
                      <div className="border border-[#BFC4CB] rounded-[8px] p-[16px] flex justify-between items-center gap-[10px] w-full">
                        <span className="text-[#191D23] text-[16px] font-dm-sans">Product</span>
                        <Image src={assets.arrowDown} alt="" width={24} height={24} />
                      </div>
                    </div>
                    <div>
                      <label className="block font-dm-sans text-[16px] text-black mb-[10px]">Quantity<span className="text-[#E92C2C]">*</span></label>
                      <div className="border border-[#BFC4CB] rounded-[8px] p-[16px] w-full">
                        <p className="text-[#191D23] text-[16px] font-dm-sans">1</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#F0F2F5] rounded-[16px] p-[16px] flex items-center justify-center w-full">
                    <span className="font-dm-sans font-normal text-[16px] text-[#64748B]">Record Sales</span>
                  </div>
                </div>
              </div>
              <h3 className="font-inter font-normal text-[30px] text-[#001031] mb-3 text-center">Start Selling</h3>
              <p className="font-inter font-normal text-[18px] text-[#001031] text-center max-w-[340px] leading-[24px]">
                Create your Fahampesa account and set up your business profile to get started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-[80px] bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px]">
          <div className="text-center mb-[60px]">
            <span className="font-inter font-medium text-[18px] text-[#004AAD] tracking-[0.9px] uppercase block mb-4">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="font-inter font-medium text-[40px] sm:text-[78px] text-[#001031] leading-[1.19] tracking-[-1.5px]">
              Frequently Asked<br/> Questions
            </h2>
          </div>

          <div className="max-w-[820px] mx-auto flex flex-col gap-[30px] mb-[100px]">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaqIndex === index}
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              />
            ))}
          </div>

          <div className="relative w-full max-w-[1235px] mx-auto h-[400px] rounded-[48px] overflow-hidden text-white p-10 flex flex-col justify-center items-center text-center" style={{ background: 'radial-gradient(ellipse at top left, #0A4DA6 0%, #001834 50%, #000D1F 100%)' }}>
            <div className="absolute inset-0">
             
            </div>
            <div className="relative z-10 flex flex-col items-center gap-4 max-w-[675px]">
              <h3 className="font-inter font-semibold text-[32px] sm:text-[48px] leading-tight">Ready to take full control?</h3>
              <p className="font-inter font-normal text-[16px] leading-[24px]">
                Whether you&apos;re a manufacturer, construction firm or a hardware store, we can help you pay employees or casual labourers in cash, into a mobile wallet or bank account.
              </p>
              <Link
                href="/login"
                className="flex bg-white text-[#001031] font-dm-sans font-semibold text-[20px] px-6 py-4 rounded-[16px] hover:bg-gray-100 transition-colors mt-4 flex items-center gap-2"
              >
                Start a free trial
             
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#001223] text-white py-[80px]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Column 1 */}
            <div className="flex flex-col gap-6">
              <h4 className="font-dm-sans font-semibold text-[16px] text-[#64748B]">COMPANY</h4>
              <Link href="#" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">About Us</Link>
              <Link href="#" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">Legal</Link>
              <Link href="#" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">Terms of Service</Link>
              <Link href="#" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">Privacy</Link>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col gap-6">
              <h4 className="font-dm-sans font-semibold text-[16px] text-[#64748B]">HELP</h4>
              <Link href="#" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">FAQ</Link>
              <Link href="#" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">User Guide</Link>
              <Link href="#" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">WhatsApp Support</Link>
              <Link href="mailto:support@fahampesa.com" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">support@fahampesa.com</Link>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col gap-6">
              <h4 className="font-dm-sans font-semibold text-[16px] text-[#64748B]">GET THE APP</h4>
              <button onClick={() => setDownloadModalOpen(true)} className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors text-left">Desktop for Windows</button>
              <button onClick={() => setDownloadModalOpen(true)} className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors text-left">Desktop for Mac</button>

                <div className="flex gap-4 mt-4">
                <div
                 
                  onClick={() => setDownloadModalOpen(true)}
                  className="w-[140px] h-10 relative"
                >
                  <Image src={assets.googlePlay} alt="Google Play" fill className="object-contain" />
                </div>
                <div
                 
                  onClick={() => setDownloadModalOpen(true)}
                  className="w-[140px] h-10 relative"
                >
                  <Image src={assets.appStore} alt="App Store" fill className="object-contain" />
                </div>
                </div>
            </div>

            {/* Column 4: Socials */}
            <div className="flex flex-col gap-6 items-start lg:items-end">
              <div className="flex gap-4">
                <Link href="#" className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Image src={assets.facebook} alt="Facebook" width={12} height={12} />
                </Link>
                <Link href="#" className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Image src={assets.xIcon} alt="X" width={12} height={12} />
                </Link>
                <Link href="#" className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Image src={assets.instagram} alt="Instagram" width={12} height={12} />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-[80px] pt-8 border-t border-gray-800">
            <p className="font-dm-sans font-medium text-[14px] text-white">
              Copyright © 2026 Fahampesa - All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
