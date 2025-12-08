'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useCurrency, getCurrencySymbol } from '@/hooks/useCurrency'

function PricingPageContent() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const { currency, isLoading } = useCurrency()
    const router = useRouter()

    const handleGetPro = () => {
        router.push(`/dashboard/subscription/checkout?plan=${billingCycle}&currency=${currency}`)
    }

    // Get price based on currency and billing cycle
    const getPrice = () => {
        if (currency === 'KSH') {
            return billingCycle === 'monthly' ? '2,000' : '20,000'
        } else {
            return billingCycle === 'monthly' ? '10' : '100'
        }
    }
    
    const currencySymbol = getCurrencySymbol(currency)

    return (
        <div className="min-h-screen bg-[#f8f8f9]">
            {/* Header */}
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
                    Subscription
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

            {/* Main Content */}
            <main className="w-full mx-auto  py-16">
                {/* Hero Section - Two Column Layout */}
                <div id="pricing-plan" className="grid grid-cols-2 gap-8 mb-16 items-center justify-items-center">
                    {/* Left Column - Text Content */}
                    <div className="flex flex-col ml-20 ">
                        {/* Pro Plan Badge */}
                        <div className="border border-[#004aad] inline-block  gap-[2.815px] items-center justify-center px-[7px] py-1 rounded-md w-fit">
                            <p className="font-dm-sans font-semibold text-[11px] text-[#004aad] ">
                                Pro Plan
                            </p>
                        </div>

                        {/* Headline */}
                        <div className="font-manrope font-semibold text-[68px] text-[#191d23] leading-[80px] mb-8">
                            <p className="mb-0">Go beyond selling,</p>
                            <p>control your business</p>
                        </div>

                        {/* Subheadline */}
                        <p className="font-dm-sans font-medium text-[16px] text-[#191d23]">
                            All-in-one POS to manage products, staff, and track profits.
                        </p>
                    </div>

                    {/* Right Column - Pricing Card */}
                    <div className="bg-white rounded-[24px] px-6 py-10 flex flex-col  gap-10 ">
                        {/* Price */}
                        <div className="flex gap-1 items-center">
                            <p className="font-dm-sans font-semibold text-[48px] text-[#191d23] transition-all duration-300 ease-in-out">
                                {isLoading ? '...' : `${currencySymbol} ${getPrice()}`}
                            </p>
                            <p className="font-dm-sans font-normal text-[16px] text-[#4b5768] transition-all duration-300 ease-in-out">
                                / {billingCycle === 'monthly' ? 'Month' : 'Year'}
                            </p>
                        </div>

                        {/* Toggle */}
                        <div className="flex gap-2 items-center">
                            <button
                                className="relative w-[44px] h-6 rounded-xl transition-colors duration-300"
                                style={{ backgroundColor: billingCycle === 'yearly' ? '#004AAD' : 'rgba(4,9,33,0.32)' }}
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            >
                                <div
                                    className="absolute top-[2px] w-5 h-5 bg-white rounded-xl transition-all duration-300"
                                    style={{ left: billingCycle === 'yearly' ? '22px' : '2px' }}
                                />
                            </button>
                            <p className="font-dm-sans font-semibold text-[16px] text-[#191d23] transition-opacity duration-300">
                                {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                            </p>
                            {billingCycle === 'yearly' && (
                                <p className="font-dm-sans font-normal text-[18px] text-[#004aad] animate-fade-in">
                                    You Save 20%
                                </p>
                            )}
                        </div>

                        {/* Features List */}
                        <div className="flex flex-col gap-3">
                            {[
                                'Unlimited Products',
                                'Inventory Access',
                                'Debtors Record',
                                'Unlimited Branches',
                                'Unlimited Suppliers',
                                'Advanced Reports (Profit/Loss)',
                                'Staff Management & Permissions',
                                'Sync across Mobile, Web, and Desktop'
                            ].map((feature, index) => (
                                <div key={index} className="flex gap-[17px] items-center">
                                    <div className="bg-[#e9f2f8] flex items-start justify-center p-2 rounded-full shrink-0">
                                        <Image
                                            src="/assets/figma/subscription/check-blue.svg"
                                            alt="check"
                                            width={16}
                                            height={16}
                                        />
                                    </div>
                                    <p className="flex-1 font-dm-sans font-medium text-[16px] text-[#191d23]">
                                        {feature}
                                    </p>
                                </div>
                            ))}
                            {billingCycle === 'yearly' && (
                                <div className="flex gap-[17px] items-center animate-fade-in">
                                    <div className="bg-[#e9f2f8] flex items-start justify-center p-2 rounded-full shrink-0">
                                        <Image
                                            src="/assets/figma/subscription/check-blue.svg"
                                            alt="check"
                                            width={16}
                                            height={16}
                                        />
                                    </div>
                                    <p className="flex-1 font-dm-sans font-medium text-[16px] text-[#191d23]">
                                        12 + 2 months free plan
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* CTA Button */}
                        <button 
                            onClick={handleGetPro}
                            className="bg-[#004aad] rounded-[24px] h-[50px] w-[200px] flex items-center justify-center hover:bg-[#FF9500] transition-all duration-300 ease-in-out group"
                        >
                            <p className="font-dm-sans font-semibold text-[18px] text-white group-hover:text-[#004aad] text-center transition-colors duration-300 ease-in-out">
                                Get Pro
                            </p>
                        </button>
                    </div>
                </div>

                {/* Features Section */}
                <div className="mb-16">
                    {/* Section Title */}
                    <div className="text-center mb-12">
                        <h2 className="font-manrope font-semibold text-[40px] text-[#191d23] mb-4">
                            Everything You Need to Run Your Business
                        </h2>
                        <p className="font-dm-sans font-normal text-[16px] text-[#4a5565] max-w-3xl mx-auto">
                            From inventory management to sales tracking, FahamPesa provides all the tools small business owners need to succeed in today's competitive market.
                        </p>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="flex gap-[13px] justify-center mb-12">
                        {/* Card 1 - Smart Inventory Management */}
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] px-4 py-6 flex flex-col gap-[22px] w-[250px] h-[280px] group cursor-pointer transition-all">
                            <div className="bg-[#004aad] group-hover:bg-[#FF9500] rounded-lg p-2 w-[50px] h-[50px] flex items-center justify-center transition-colors">
                                <Image
                                    src="/assets/figma/subscription/inventory-icon.svg"
                                    alt="inventory"
                                    width={32}
                                    height={32}
                                    className="transition-all group-hover:brightness-0"
                                />
                            </div>
                            <p className="font-dm-sans font-bold text-[18px] text-[#191d23]">
                                Smart Inventory Management
                            </p>
                            <p className="font-dm-sans font-normal text-[14px] leading-[22px] text-[#4a5565]">
                                Track your products, manage stock levels, and get low-stock alerts. Perfect for kiosks and small shops.
                            </p>
                        </div>

                        {/* Card 2 - Quick Sales Reconciling */}
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] px-4 py-6 flex flex-col gap-[22px] w-[250px] h-[280px] group cursor-pointer transition-all">
                            <div className="bg-[#004aad] group-hover:bg-[#FF9500] rounded-lg p-2 w-[50px] h-[50px] flex items-center justify-center transition-colors">
                                <Image
                                    src="/assets/figma/subscription/cart-icon.svg"
                                    alt="cart"
                                    width={32}
                                    height={32}
                                    className="transition-all group-hover:brightness-0"
                                />
                            </div>
                            <p className="font-dm-sans font-bold text-[18px] text-[#191d23]">
                                Quick Sales Reconciling
                            </p>
                            <p className="font-dm-sans font-normal text-[14px] leading-[22px] text-[#4a5565]">
                                Record sales instantly and auto-update inventory Optimized for fast transactions in busy environments.
                            </p>
                        </div>

                        {/* Card 3 - Daily & Weekly Reports */}
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] px-4 py-6 flex flex-col gap-[22px] w-[250px] h-[280px] group cursor-pointer transition-all">
                            <div className="bg-[#004aad] group-hover:bg-[#FF9500] rounded-lg p-2 w-[50px] h-[50px] flex items-center justify-center transition-colors">
                                <Image
                                    src="/assets/figma/subscription/reports-icon.svg"
                                    alt="reports"
                                    width={32}
                                    height={32}
                                    className="transition-all group-hover:brightness-0"
                                />
                            </div>
                            <p className="font-dm-sans font-bold text-[18px] text-[#191d23]">
                                Daily & Weekly Reports
                            </p>
                            <p className="font-dm-sans font-normal text-[14px] leading-[22px] text-[#4a5565]">
                                Track your products, manage stock levels, and get low-stock alerts. Perfect for kiosks and small shops.
                            </p>
                        </div>

                        {/* Card 4 - Offline-First Design */}
                        <div className="bg-white rounded-[16px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.05)] px-4 py-6 flex flex-col gap-[22px] w-[250px] h-[280px] group cursor-pointer transition-all">
                            <div className="bg-[#004aad] group-hover:bg-[#FF9500] rounded-lg p-2 w-[50px] h-[50px] flex items-center justify-center transition-colors">
                                <Image
                                    src="/assets/figma/subscription/offline-icon.svg"
                                    alt="offline"
                                    width={32}
                                    height={32}
                                    className="transition-all group-hover:brightness-0"
                                />
                            </div>
                            <p className="font-dm-sans font-bold text-[18px] text-[#191d23]">
                                Offline-First Design
                            </p>
                            <p className="font-dm-sans font-normal text-[14px] leading-[22px] text-[#4a5565]">
                                Works completely offline, syncs automatically when connected. Never lose a sale due to poor internet.
                            </p>
                        </div>
                    </div>

                    {/* Compare Features Button */}
                    <div className="flex justify-center">
                        <button 
                            onClick={() => document.getElementById('compare-features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className="border-[1.5px] border-[#004aad] rounded-[24px] px-6 py-[6px] flex gap-2 items-center hover:bg-[#004aad] hover:text-white transition-colors group"
                        >
                            <p className="font-dm-sans font-semibold text-[16px] text-[#004aad] group-hover:text-white">
                                Compare Features
                            </p>
                            <div className="w-6 h-6 rotate-180">
                                <Image
                                    src="/assets/figma/subscription/arrow-down.svg"
                                    alt="arrow"
                                    width={24}
                                    height={24}
                                    className="group-hover:brightness-0 group-hover:invert"
                                />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Compare Features Table Section */}
                <div id="compare-features" className="bg-white py-20">
                    {/* Section Title */}
                    <h2 className="font-archivo font-semibold text-[40px] text-[#191d23] text-center mb-12">
                        Compare Features
                    </h2>

                    {/* Comparison Table Image */}
                    <div className="flex justify-center">
                        <Image
                            src="/comparison-table.png"
                            alt="Feature Comparison Table"
                            width={1144}
                            height={760}
                            className="max-w-full h-auto"
                        />
                    </div>

                    {/* Back to Plan Button */}
                    <div className="flex justify-center mt-16">
                        <button 
                            onClick={() => document.getElementById('pricing-plan')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className="bg-[#004aad] rounded-[36px] h-[56px] w-[215px] px-6 py-[6px] flex gap-1 items-center justify-center hover:bg-[#FF9500] transition-all duration-300 ease-in-out group"
                        >
                            <p className="font-dm-sans font-semibold text-[16px] text-white group-hover:text-[#004aad] text-center transition-colors duration-300 ease-in-out">
                                Back to Plan
                            </p>
                            <div className="w-6 h-6">
                                <Image
                                    src="/assets/figma/subscription/arrow-up.svg"
                                    alt="arrow up"
                                    width={24}
                                    height={24}
                                    className="brightness-0 invert group-hover:invert-0 transition-all duration-300 ease-in-out"
                                />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Customer Testimonial Video Section */}
                <div className="bg-white py-20">
                    {/* Section Title and Subtitle */}
                    <div className="max-w-[655px] mx-auto text-center mb-12">
                        <h2 className="font-dm-sans font-semibold text-[40px] text-[#191d23] mb-4">
                            Hear from our Happy Customers
                        </h2>
                        <p className="font-dm-sans font-normal text-[16px] text-[#191d23]">
                            Real business owners sharing their success stories with FahamPesa
                        </p>
                    </div>

                    {/* Video Container */}
                    <div className="max-w-[700px] mx-auto">
                        <div className="relative bg-[#363232] rounded-[32px] h-[550px] overflow-hidden cursor-pointer group">
                            {/* Video Thumbnail */}
                            <div className="absolute inset-0">
                                <Image
                                    src="/assets/figma/subscription/video-thumbnail.jpg"
                                    alt="Customer testimonial video"
                                    fill
                                    className="object-cover"
                                />
                                {/* Dark Overlay */}
                                <div className="absolute inset-0 bg-black/20" />
                            </div>

                            {/* Play Button */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80px] h-[80px] transition-transform group-hover:scale-110">
                                <Image
                                    src="/assets/figma/subscription/play-button.svg"
                                    alt="Play video"
                                    width={80}
                                    height={80}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final CTA Section */}
                <div className="bg-[#f8f8f9] py-20">
                    {/* Section Title */}
                    <h2 className="font-archivo font-semibold text-[40px] text-[#191d23] text-center mb-16">
                        Take full control of your business today
                    </h2>

                    {/* Pricing Card */}
                    <div className="max-w-[650px] mx-auto bg-white rounded-[24px] px-20 py-10 flex flex-col gap-10 items-center">
                        {/* Price */}
                        <div className="flex gap-1 items-center">
                            <p className="font-dm-sans font-semibold text-[48px] text-[#191d23] transition-all duration-300 ease-in-out">
                                {isLoading ? '...' : `${currencySymbol} ${getPrice()}`}
                            </p>
                            <p className="font-dm-sans font-normal text-[16px] text-[#4b5768] transition-all duration-300 ease-in-out">
                                / {billingCycle === 'monthly' ? 'Month' : 'Year'}
                            </p>
                        </div>

                        {/* Toggle */}
                        <div className="flex gap-2 items-center w-full">
                            <button
                                className="relative w-[44px] h-6 rounded-xl transition-colors duration-300"
                                style={{ backgroundColor: billingCycle === 'yearly' ? '#004AAD' : 'rgba(4,9,33,0.32)' }}
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            >
                                <div
                                    className="absolute top-[2px] w-5 h-5 bg-white rounded-xl transition-all duration-300"
                                    style={{ left: billingCycle === 'yearly' ? '22px' : '2px' }}
                                />
                            </button>
                            <p className="font-dm-sans font-semibold text-[16px] text-[#191d23] transition-opacity duration-300">
                                {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                            </p>
                            {billingCycle === 'yearly' && (
                                <p className="font-dm-sans font-normal text-[18px] text-[#004aad] animate-fade-in">
                                    You Save 20%
                                </p>
                            )}
                        </div>

                        {/* Features List */}
                        <div className="flex flex-col gap-3 w-full">
                            {[
                                'Unlimited Products',
                                'Inventory Access',
                                'Debtors Record',
                                'Unlimited Branches',
                                'Unlimited Suppliers',
                                'Advanced Reports (Profit/Loss)',
                                'Staff Management & Permissions',
                                'Sync across Mobile, Web, and Desktop'
                            ].map((feature, index) => (
                                <div key={index} className="flex gap-[17px] items-center">
                                    <div className="bg-[#e9f2f8] flex items-start justify-center p-2 rounded-full shrink-0">
                                        <Image
                                            src="/assets/figma/subscription/check-blue.svg"
                                            alt="check"
                                            width={16}
                                            height={16}
                                        />
                                    </div>
                                    <p className="flex-1 font-dm-sans font-medium text-[16px] text-[#191d23]">
                                        {feature}
                                    </p>
                                </div>
                            ))}
                            {billingCycle === 'yearly' && (
                                <div className="flex gap-[17px] items-center animate-fade-in">
                                    <div className="bg-[#e9f2f8] flex items-start justify-center p-2 rounded-full shrink-0">
                                        <Image
                                            src="/assets/figma/subscription/check-blue.svg"
                                            alt="check"
                                            width={16}
                                            height={16}
                                        />
                                    </div>
                                    <p className="flex-1 font-dm-sans font-medium text-[16px] text-[#191d23]">
                                        12 + 2 months free plan
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* CTA Button */}
                        <button 
                            onClick={handleGetPro}
                            className="bg-[#004aad] rounded-[24px] h-[50px] w-[200px] flex items-center justify-center hover:bg-[#FF9500] transition-all duration-300 ease-in-out group"
                        >
                            <p className="font-dm-sans font-semibold text-[18px] text-white group-hover:text-[#004aad] text-center transition-colors duration-300 ease-in-out">
                                Get Pro
                            </p>
                        </button>
                    </div>
                </div>
            </main>

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

export default function PricingPage() {
    return (
        <ProtectedRoute>
            <PricingPageContent />
        </ProtectedRoute>
    )
}
