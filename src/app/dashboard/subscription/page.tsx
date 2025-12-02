'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function SubscriptionPage() {
    const [isYearly, setIsYearly] = useState(false)
    const router = useRouter()

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
        const currency = 'KSH' // Default to KSH, can be made dynamic based on location
        router.push(`/dashboard/subscription/checkout?plan=${plan}&currency=${currency}`)
    }

    // pricing (display depends on toggle)
    const monthlyPro = 2000
    const yearlyPro = 20000
    const proPrice = isYearly ? yearlyPro : monthlyPro
    const proUnit = isYearly ? '/ Year' : '/ Month'
    
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
            {/* Header - WHITE BACKGROUND - Exact Figma Design */}
                <header className="relative h-[80px] border-b border-gray-200">
                                   {/* Logo */}
                                   <div className="absolute left-[40px] top-[20px] flex gap-[7px] items-center">
                                       <div className="w-[40px] h-[40px]">
                                           <Image
                                               src="/assets/figma/subscription/logo-vector.svg"
                                               alt="Fahampesa"
                                               width={40}
                                               height={40}
                                           />
                                       </div>
                                       <div className="flex flex-col w-[125px] leading-normal text-[#001223]">
                                           <p className="font-roboto font-bold text-[24px]">
                                               Fahampesa
                                           </p>
                                           <p className="font-inter font-light text-[12px]">
                                               Smart Business Tools
                                           </p>
                                       </div>
                                   </div>
                   
                                   {/* Title */}
                                   <p className="absolute left-1/2 top-[28px] -translate-x-1/2 font-roboto font-bold text-[20px] text-[#001223]">
                                       Subscription plan
                                   </p>
                   
                                   {/* Notification Bell */}
                                   <div className="absolute right-[40px] top-1/2 -translate-y-1/2 w-[32px] h-[32px]">
                                       <Image
                                           src="/assets/figma/subscription/notification-bell-group.svg"
                                           alt="Notifications"
                                           width={32}
                                           height={32}
                                       />
                                   </div>
                               </header>

            {/* Section 1: Plans */}
            <div className="w-full max-w-[1440px] mx-auto pt-12 md:pt-[82px] pb-12 md:pb-[82px] px-4 md:px-8">
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
                                        KSH 0
                                    </span>
                                    <span className="text-base leading-[20.83px] font-dm-sans text-[#4B5768] transition-all duration-300 ease-in-out">
                                        {freeUnit}
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
                                        {`KSH ${proPrice.toLocaleString()}`}
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

            {/* Footer */}
            <footer className="bg-[#001223] py-12 md:py-16 px-6 md:px-20">
                <div className="max-w-[1280px] mx-auto">
                    <div className="flex flex-col lg:flex-row justify-between gap-8 lg:gap-0 mb-8 md:mb-12">
                        <div className="w-full lg:w-[468px]">
                            <h3 className="text-xl md:text-2xl leading-[31.2px] font-segoe text-white mb-4 md:mb-[21px]">
                                FahamPesa
                            </h3>
                            <p className="text-sm md:text-base leading-[26px] font-segoe text-[#99A1AF] mb-6 md:mb-[37px]">
                                Empowering small business owners across Kenya with smart,
                                offline-first sales and inventory management tools.
                            </p>
                            <div className="flex gap-6 md:gap-8">
                                {/* Social Icons */}
                                <Link href="#" className="w-6 h-6 hover:opacity-80 transition-opacity">
                                    <Image src="/assets/figma/subscription/footer-facebook.svg" alt="Facebook" width={24} height={24} />
                                </Link>
                                <Link href="#" className="w-6 h-6 hover:opacity-80 transition-opacity">
                                    <Image src="/assets/figma/subscription/footer-twitter.svg" alt="Twitter" width={24} height={24} />
                                </Link>
                                <Link href="#" className="w-6 h-6 hover:opacity-80 transition-opacity">
                                    <Image src="/assets/figma/subscription/footer-instagram.svg" alt="Instagram" width={24} height={24} />
                                </Link>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-base md:text-lg leading-[28px] font-segoe text-white mb-3 md:mb-4">Support</h4>
                            <ul className="space-y-2 md:space-y-3">
                                <li>
                                    <Link href="#" className="text-sm md:text-base leading-6 font-segoe text-[#99A1AF] hover:text-white transition-colors">
                                        Help Center
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-sm md:text-base leading-6 font-segoe text-[#99A1AF] hover:text-white transition-colors">
                                        Getting Started
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-sm md:text-base leading-6 font-segoe text-[#99A1AF] hover:text-white transition-colors">
                                        User Guide
                                    </Link>
                                </li>
                                <li>
                                    <Link href="#" className="text-sm md:text-base leading-6 font-segoe text-[#99A1AF] hover:text-white transition-colors">
                                        FAQ
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-base md:text-lg leading-[28px] font-segoe text-white mb-3 md:mb-4">Contact</h4>
                            <ul className="space-y-2 md:space-y-3">
                                <li className="flex items-center gap-2">
                                    <Image 
                                        src="/assets/figma/subscription/footer-email.svg" 
                                        alt="email" 
                                        width={16} 
                                        height={16}
                                    />
                                    <Link
                                        href="mailto:support@fahampesa.com"
                                        className="text-xs md:text-sm leading-5 font-segoe text-[#99A1AF] hover:text-white transition-colors"
                                    >
                                        support@fahampesa.com
                                    </Link>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Image 
                                        src="/assets/figma/subscription/footer-whatsapp.svg" 
                                        alt="whatsapp" 
                                        width={16} 
                                        height={16}
                                    />
                                    <Link href="#" className="text-xs md:text-sm leading-5 font-segoe text-[#99A1AF] hover:text-white transition-colors">
                                        WhatsApp Support
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-[#1E2939] pt-6 md:pt-[39.62px] flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-xs md:text-sm leading-[22.75px] font-segoe text-[#99A1AF] text-center md:text-left">
                            © 2024 FahamPesa. Built with ❤️ for small business owners in Kenya and beyond.
                        </p>
                        <Link href="/login" className="text-xs md:text-sm leading-5 font-segoe text-[#99A1AF] hover:text-white transition-colors">
                            Business Login
                        </Link>
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
