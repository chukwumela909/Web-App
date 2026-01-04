'use client'

import { useState } from 'react'
import { Check, X, Menu, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'
import { motion, AnimatePresence } from 'framer-motion'
import { DownloadModal } from '@/components/DownloadModal'

const assets = {
  logo: '/assets/figma/landing/logo-icon.svg',
  facebook: '/assets/figma/landing/facebook.svg',
  instagram: '/assets/figma/landing/instagram.svg',
  googlePlay: '/google_play.png',
  appStore: '/app_store.png',
  arrowUpDuotone: '/assets/figma/landing/arrow-up-duotone.svg',
  arrowUpDuotone1: '/assets/figma/landing/arrow-up-duotone-1.svg',
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

export default function SubscriptionPage() {
    const [isYearly, setIsYearly] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [downloadModalOpen, setDownloadModalOpen] = useState(false)
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
    const [showAllFaqs, setShowAllFaqs] = useState(false)
    const router = useRouter()
    const { currency, isLoading} = useCurrency()

    const scrollToCompareFeatures = () => {
        const element = document.getElementById('compare-features')
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleGetPro = () => {
        const plan = isYearly ? 'yearly' : 'monthly'
        router.push(`/dashboard/subscription/checkout?plan=${plan}&currency=${currency}`)
    }

    // pricing (display depends on toggle and currency)
    const getProPrice = () => {
        if (currency === 'KSH') {
            return isYearly ? 20000 : 2000
        } else {
            return isYearly ? 100 : 10
        }
    }
    
    const proPrice = getProPrice()
    const proUnit = isYearly ? '/ Year' : '/ Month'
    const currencySymbol = getCurrencySymbol(currency)
    
    // Free plan is always 0 but unit changes
    const freePrice = 0
    const freeUnit = isYearly ? '/ Year' : '/ Month'

    const features = [
        {
            name: 'Create Sales',
            mobile: true,
            webFree: { available: true, note: '(Up to 5 daily)' },
            desktop: { available: true, note: 'Unlimited' }
        },
        {
            name: 'Products Limit',
            mobile: true,
            webFree: { available: true, note: '(Up to 10)' },
            desktop: { available: true, note: 'Unlimited' }
        },
        {
            name: 'Inventory Management',
            mobile: true,
            webFree: { available: true },
            desktop: { available: true }
        },
        {
            name: 'Multi-Branch Access',
            mobile: false,
            webFree: { available: false },
            desktop: { available: true }
        },
        {
            name: 'Staff Roles',
            mobile: false,
            webFree: { available: false },
            desktop: { available: true }
        },
        {
            name: 'Advanced Reports',
            mobile: false,
            webFree: { available: false },
            desktop: { available: true }
        },
        {
            name: 'Offline Mode',
            mobile: { available: true, note: '(local)' },
            webFree: { available: false },
            desktop: { available: true, note: '(full sync)' }
        },
        {
            name: 'M-Pesa Integration',
            mobile: false,
            webFree: { available: false },
            desktop: { available: true, note: '(auto + webhook)' }
        },
        {
            name: 'Data Sync',
            mobile: { available: true, note: '(when connected)' },
            webFree: { available: true, note: '(when connected)' },
            desktop: { available: true, note: '(full sync)' }
        },
        {
            name: 'Subscription Required',
            mobile: false,
            webFree: { available: false },
            desktop: { available: true }
        },
        {
            name: 'Download Option',
            mobile: false,
            webFree: { available: false },
            desktop: { available: true, note: '(after payment)' }
        }
    ]

    const freePlanFeatures = [
        { text: 'Add up to 20 products', available: true },
        { text: 'Inventory access', available: true },
        { text: 'Record limited demo sales', available: true },
        { text: 'Debtors record', available: false },
        { text: 'Unlimited Branches', available: false },
        { text: 'Advanced reports (Profit/Loss) ', available: false },
        { text: 'Staff Management & Permissions', available: false },
        { text: 'Sync across Mobile, Web, and Desktop', available: false }
    ]

    const proPlanFeatures = [
        { text: 'Unlimited Products', available: true },
        { text: 'Inventory Access', available: true },
        { text: 'Debtors Record', available: true },
        { text: 'Unlimited Branches', available: true },
        { text: 'Unlimited Suppliers', available: true },
        { text: 'Advanced Reports (Profit/Loss)', available: true },
        { text: 'Staff Management & Permissions', available: true },
        { text: 'Sync across Mobile, Web, and Desktop', available: true }
    ]

    return (
        <div className="min-h-screen bg-[#F8F8F9]">
            <DownloadModal open={downloadModalOpen} onOpenChange={setDownloadModalOpen} />

            {/* Header - Landing Page Style */}
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
                        <Link href="/dashboard/subscription" className="font-dm-sans font-semibold text-[14px] text-[#004AAD] px-4 py-2 rounded-[8px] bg-[#E6F0FF]">Pricing</Link>
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
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Mobile Menu Content */}
                            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
                                <Link 
                                    href="/#product" 
                                    onClick={() => setMobileMenuOpen(false)} 
                                    className="font-dm-sans font-bold text-[16px] text-[#001031] py-3 px-4 rounded-[8px] hover:bg-gray-50 w-full text-center"
                                >
                                    Product
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
                                    className="font-dm-sans font-bold text-[16px] text-[#004AAD] py-3 px-4 rounded-[8px] bg-[#E6F0FF] w-full text-center"
                                >
                                    Pricing
                                </Link>
                            </div>

                            {/* Mobile Menu Footer Actions */}
                            <div className="border-t border-gray-100 p-4 sm:p-6 flex flex-col gap-3 shrink-0">
                                <Link 
                                    href="/login" 
                                    onClick={() => setMobileMenuOpen(false)} 
                                    className="font-dm-sans font-semibold text-[14px] text-[#001031] px-6 py-3 rounded-[8px] hover:bg-[#E6F0FF] transition-colors text-center border border-gray-200"
                                >
                                    Login
                                </Link>
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false)
                                        setDownloadModalOpen(true)
                                    }}
                                    className="font-dm-sans font-semibold text-[14px] text-[#001031] border border-[#001031] rounded-[10px] px-6 py-3 hover:bg-gray-50 transition-colors"
                                >
                                    Get Desktop App
                                </button>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="font-dm-sans font-semibold text-[14px] text-white bg-[#004AAD] rounded-[10px] px-6 py-3 hover:bg-[#003a8c] transition-colors flex items-center justify-center gap-2"
                                >
                                    Start a free trial
                                    <ArrowUpRight size={16} />
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Section 1: Plans */}
            <div className="w-full max-w-[1440px] mx-auto pt-12 md:pt-[82px] pb-12 md:pb-[82px] px-4 md:px-8 mt-[80px]">
                {/* Title Section - Exact Figma Design */}
                <div className="flex flex-col items-center gap-16 mb-[120px] relative">
                    {/* Title and Subtitle */}
                    <div className="flex flex-col items-center gap-4 text-center">
                        <h2 className="text-[50px] leading-[54.44px] font-archivo font-normal">
                            <span className="text-[#191D23]">Special Offer: 1 Year</span>
                            <span> </span>
                            <span className="text-[#004AAD]">+ 2 Months</span>
                        </h2>
                        <p className="text-[20px] leading-[26.04px] font-dm-sans text-[#191D23]">
                            Two months free when choose a yearly plan
                        </p>
                    </div>

                    {/* Toggle Section */}
                    <div className="flex items-center justify-center gap-6 relative w-full">
                        <p className="text-base leading-[20.83px] font-dm-sans text-[#191D23]">
                            Pay Monthly{' '}
                        </p>

                        {/* Toggle Switch */}
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className={`relative w-11 h-6 rounded-[12px] transition-all duration-300 ${
                                isYearly ? 'bg-[#004AAD]' : 'bg-[rgba(4,9,33,0.32)]'
                            }`}
                            aria-label="Toggle yearly payment"
                        >
                            <div
                                className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-[12px] shadow-md transition-all duration-300 ${
                                    isYearly ? 'left-[22px]' : 'left-[2px]'
                                }`}
                            />
                        </button>

                        {/* Pay Yearly with Underline */}
                        <div className="flex flex-col items-center gap-[3px]">
                            <p className="text-base leading-[20.83px] font-dm-sans text-[#191D23]">
                                Pay Yearly
                            </p>
                            {/* Underline SVG from Figma */}
                            <div className="h-[10.038px] w-[66px] relative">
                                <Image
                                    src="/assets/figma/subscription/underline.svg"
                                    alt=""
                                    width={66}
                                    height={11}
                                    className="absolute inset-0"
                                />
                            </div>
                        </div>

                        {/* Save 20% Badge with Curved Arrow - Hidden on mobile */}
                        <div className="hidden lg:block absolute right-4 top-[30px]">
                            <div className="relative">
                                {/* Curved Arrow from Figma */}
                                <div className="absolute right-[450px] top-[0px] w-[91.874px] h-[55.337px] rotate-[203.447deg]">
                                    <Image
                                        src="/assets/figma/subscription/arrow-curved.svg"
                                        alt=""
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <p className="absolute right-[450px] top-[40px] translate-x-full text-[18px] leading-[23.44px] font-dm-sans text-[#004AAD] whitespace-nowrap">
                                    Save 20%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="flex flex-col md:flex-row gap-6 justify-center max-w-6xl mx-auto px-4">
                    {/* Free Plan */}
                    <div className="flex-1 bg-white border border-[#D0D5DD] rounded-[24px] p-6 md:p-10 flex flex-col gap-6 md:gap-10 shadow-sm">
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-[11px]">
                                <h3 className="text-[40px] leading-[43.52px] font-bold font-archivo text-[#191D23]">
                                    Free
                                </h3>
                                <p className="text-base leading-[20.83px] font-dm-sans text-[#64748B]">
                                    Ideal for businesses/individuals who need quick access for testing and onboarding.
                                </p>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-1">
                                    <span className="text-[48px] leading-[65.57px] font-semibold font-manrope text-[#191D23] transition-all duration-300 ease-in-out">
                                        {isLoading ? '...' : `${currencySymbol} 0`}
                                    </span>
                                    <span className="text-base leading-[20.83px] font-dm-sans text-[#4B5768] transition-all duration-300 ease-in-out">
                                        {proUnit}
                                    </span>
                                </div>

                                <button className="w-full h-11 py-[6px] px-3 border-[1.5px] border-[#004AAD] rounded-[24px] text-[18px] leading-[23.44px] font-semibold font-dm-sans text-[#004AAD] text-center hover:bg-[#FF9500] hover:border-[#FF9500] hover:text-[#004AAD] transition-colors">
                                    Get Started Now
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {freePlanFeatures.map((feature, index) => (
                                <div key={index} className="flex items-center gap-[17px]">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${feature.available ? 'bg-[#E9F2F8]' : 'bg-[#F7F8F9]'
                                        }`}>
                                        {feature.available ? (
                                            <Check className="w-4 h-4 text-[#004AAD]" />
                                        ) : (
                                            <X className="w-4 h-4 text-[#A0ABBB]" />
                                        )}
                                    </div>
                                    <span className={`text-base leading-[20.83px] font-medium font-dm-sans ${feature.available ? 'text-[#191D23]' : 'text-[#A0ABBB]'
                                        }`}>
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="flex-1 bg-white border-[3px] border-[#004AAD] rounded-[24px] p-6 md:p-10 flex flex-col gap-6 md:gap-10 shadow-sm">
                        <div className="flex flex-col gap-5">
                            <div className="flex flex-col gap-[11px]">
                                <h3 className="text-[40px] leading-[43.52px] font-bold font-archivo text-[#191D23]">
                                    Pro
                                </h3>
                                <p className="text-base leading-[20.83px] font-dm-sans text-[#64748B] h-11">
                                    Ideal for businesses/individuals who need  full access and advanced features.
                                </p>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-1">
                                    <span className="text-[48px] leading-[62.5px] font-semibold font-dm-sans text-[#191D23] transition-all duration-300 ease-in-out">
                                        {isLoading ? '...' : `${currencySymbol} ${proPrice.toLocaleString()}`}
                                    </span>
                                    <span className="text-base leading-[20.83px] font-dm-sans text-[#4B5768] transition-all duration-300 ease-in-out">
                                        {proUnit}
                                    </span>
                                </div>

                                <button 
                                    onClick={handleGetPro}
                                    className="w-full h-11 py-[6px] px-3 bg-[#004AAD] border-[1.5px] border-[#004AAD] rounded-[24px] text-[18px] leading-[23.44px] font-semibold font-dm-sans text-white text-center hover:bg-[#FF9500] hover:text-[#004AAD] hover:border-[#FF9500] transition-colors"
                                >
                                    Get Pro
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {proPlanFeatures.map((feature, index) => (
                                <div key={index} className="flex items-center gap-[17px]">
                                    <div className="w-8 h-8 rounded-full bg-[#E9F2F8] flex items-center justify-center">
                                        <Check className="w-4 h-4 text-[#004AAD]" />
                                    </div>
                                    <span className="text-base leading-[20.83px] font-medium font-dm-sans text-[#191D23]">
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Compare Features Button */}
                <div className="flex justify-center mt-8 md:mt-[60px]">
                    <button 
                        onClick={scrollToCompareFeatures}
                        className="flex items-center gap-2 px-6 py-[6px] border-[1.5px] border-[#004AAD] rounded-[24px] h-11 hover:bg-[#004AAD] transition-colors group"
                    >
                        <span className="text-base leading-[20.83px] font-semibold font-dm-sans text-center text-[#004AAD] group-hover:text-white transition-colors">
                            Compare Features
                        </span>
                        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="text-[#004AAD] group-hover:text-white transition-colors rotate-90">
                            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Section 2: Feature Comparison Table */}
            <div id="compare-features" className="bg-white py-12 md:py-[83px] px-4">
                <h2 className="text-2xl md:text-[40px] leading-tight md:leading-[43.52px] font-medium font-archivo text-[#191D23] text-center mb-8 md:mb-[75px]">
                    Compare Features
                </h2>

                <img className='mx-auto max-w-6xl' src="/assets/figma/subscription/image.png" alt=""  />

                  <div className="flex justify-center items-center mt-12">
                        <button 
                            onClick={scrollToTop}
                            className="flex items-center justify-center gap-1 px-6 bg-[#004AAD] border-[1.5px] border-[#004AAD] rounded-[36px] h-12 md:h-14 hover:bg-[#FF9500] hover:border-[#FF9500] transition-colors group"
                        >
                            <span className="text-base leading-[20.83px] font-semibold font-dm-sans text-white group-hover:text-[#004AAD] transition-colors">
                                See All Plans
                            </span>
                            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className="text-white group-hover:text-[#004AAD] transition-colors">
                                <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                {/* <div className="max-w-[1031px] mx-auto overflow-x-auto">
                    <div className="min-w-[800px]"> */}
                        {/* Table Header */}
                        {/* <div className="flex rounded-t-[16px] overflow-hidden">
                            <div className="flex-1 bg-[#E9F2F8] h-[60px] flex items-center px-10 rounded-tl-[20px]">
                                <span className="text-base leading-6 font-medium font-archivo text-[#004AAD]">
                                    Features
                                </span>
                            </div>
                            <div className="flex-1 bg-[#E9F2F8] h-[60px] flex items-center justify-center border-l border-[#E5E9EB]">
                                <span className="text-base leading-6 font-medium font-archivo text-[#004AAD]">
                                    Mobile App
                                </span>
                            </div>
                            <div className="flex-1 bg-[#E9F2F8] h-[60px] flex items-center justify-center">
                                <span className="text-base leading-6 font-medium font-archivo text-[#004AAD]">
                                    Web App (Free)
                                </span>
                            </div>
                            <div className="relative flex-1 bg-[#004AAD] h-[60px] flex items-center justify-center rounded-t-[16px] -mt-[25px] pt-[25px]">
                                <span className="text-xs leading-[13.06px] font-archivo text-white tracking-[1%]">
                                    FULL  ACCESS
                                </span>
                            </div>
                            <div className="flex-1 bg-[#E9F2F8] h-[60px] flex items-center justify-center border-l-2 border-t-2 border-[#004AAD] rounded-tr-[16px]">
                                <span className="text-base leading-6 font-medium font-archivo text-[#004AAD]">
                                    Desktop App (Pro)
                                </span>
                            </div>
                        </div> */}

                        {/* Table Rows */}
                        {/* {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`flex border-b border-[#E5E9EB] ${index === features.length - 1 ? 'rounded-b-[20px]' : ''
                                    }`}
                            >
                                <div className="flex-1 h-[60px] flex items-center px-10 border-l border-[#E5E9EB]">
                                    <span className="text-base leading-6 font-medium font-dm-sans text-center text-[#191D23]">
                                        {feature.name}
                                    </span>
                                </div>
                                <div className="flex-1 h-[60px] flex items-center justify-center border-l border-[#E5E9EB]">
                                    {renderFeatureCell(feature.mobile)}
                                </div>
                                <div className="flex-1 h-[60px] flex items-center justify-center">
                                    {renderFeatureCell(feature.webFree)}
                                </div>
                                <div className={`flex-1 h-[60px] flex items-center justify-center border-l-2 border-r-2 border-[#004AAD] ${index === features.length - 1 ? 'border-b-2 rounded-br-[16px]' : ''
                                    }`}>
                                    {renderFeatureCell(feature.desktop)}
                                </div>
                            </div>
                        ))}
                    </div> */}

                    {/* See All Plans Button */}
                  
                {/* </div> */}
            </div>

            {/* FAQ Section */}
            <section id="faq" className="py-[80px] bg-white">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[100px]">
                    <div className="text-center mb-[60px]">
                        <span className="font-inter font-medium text-[18px] text-[#004AAD] tracking-[0.9px] uppercase block mb-4">FAQs</span>
                        <h2 className="font-inter font-medium text-[40px] sm:text-[78px] text-[#001031] leading-[1.19] tracking-[-1.5px]">
                            Frequently Asked<br /> Questions
                        </h2>
                    </div>

                    <div className="max-w-[820px] mx-auto flex flex-col gap-[30px] mb-[40px]">
                        {(showAllFaqs ? faqs : faqs.slice(0, 3)).map((faq, index) => (
                            <FAQItem
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openFaqIndex === index}
                                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                            />
                        ))}
                    </div>

                    {!showAllFaqs && faqs.length > 3 && (
                        <div className="flex justify-center mb-[100px]">
                            <button
                                onClick={() => setShowAllFaqs(true)}
                                className="font-dm-sans font-semibold text-[16px] text-[#004AAD] border border-[#004AAD] rounded-[10px] px-8 py-3 hover:bg-[#004AAD] hover:text-white transition-colors"
                            >
                                See All FAQs
                            </button>
                        </div>
                    )}

                    {showAllFaqs && <div className="mb-[100px]" />}

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
                                className="flex bg-white text-[#001031] font-dm-sans font-semibold text-[20px] px-6 py-4 rounded-[16px] hover:bg-gray-100 transition-colors mt-4 items-center gap-2"
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
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-12">
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
                            <Link href="/#faq" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">FAQ</Link>
                            <Link href="#" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">User Guide</Link>
                            <Link href="https://wa.me/message/55YQ3IBJHOQCM1" target="_blank" rel="noopener noreferrer" className="font-dm-sans font-medium text-[14px] hover:text-[#004AAD] transition-colors">WhatsApp Support</Link>
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
                                    className="w-[140px] h-10 relative cursor-pointer"
                                >
                                    <Image src={assets.googlePlay} alt="Google Play" fill className="object-contain" />
                                </div>
                                <div
                                    onClick={() => setDownloadModalOpen(true)}
                                    className="w-[140px] h-10 relative cursor-pointer"
                                >
                                    <Image src={assets.appStore} alt="App Store" fill className="object-contain" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-[80px] pt-8 border-t border-gray-800">
                        <p className="font-dm-sans font-medium text-[14px] text-white">
                            Copyright © 2026 Fahampesa - All Rights Reserved
                        </p>

                        {/* Column 4: Socials */}
                        <div className="flex flex-col gap-6 mt-4 lg:mt-0 lg:items-end">
                            <div className="flex gap-4">
                                <Link href="https://www.facebook.com/share/1HGyTGdrpY/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <Image src={assets.facebook} alt="Facebook" width={12} height={12} />
                                </Link>
                                <Link href="https://www.tiktok.com/@fahampesa" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="#001223">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                                    </svg>
                                </Link>
                                <Link href="https://www.instagram.com/fahampesa?igsh=MWV5bWlvZGR3bjN4eQ%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <Image src={assets.instagram} alt="Instagram" width={12} height={12} />
                                </Link>
                                <Link href="https://wa.me/message/55YQ3IBJHOQCM1" target="_blank" rel="noopener noreferrer" className="w-[30px] h-[30px] bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3" fill="#001223">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function renderFeatureCell(value: any) {
    if (typeof value === 'boolean') {
        return (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${value ? 'bg-[#E9F2F8]' : 'bg-[#F7F8F9]'
                }`}>
                {value ? (
                    <Check className="w-4 h-4 text-[#004AAD]" />
                ) : (
                    <X className="w-4 h-4 text-[#A0ABBB]" />
                )}
            </div>
        )
    }

    if (value && typeof value === 'object') {
        return (
            <div className="flex items-center gap-[6px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${value.available ? 'bg-[#E9F2F8]' : 'bg-[#F7F8F9]'
                    }`}>
                    {value.available ? (
                        <Check className="w-4 h-4 text-[#004AAD]" />
                    ) : (
                        <X className="w-4 h-4 text-[#A0ABBB]" />
                    )}
                </div>
                {value.note && (
                    <span className="text-base leading-6 font-dm-sans text-[#252C32]">
                        {value.note}
                    </span>
                )}
            </div>
        )
    }

    return null
}
