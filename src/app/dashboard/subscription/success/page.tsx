'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function SuccessPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [countdown, setCountdown] = useState(5)

    const plan = searchParams.get('plan') || 'yearly'
    const amount = searchParams.get('amount') || '20000'
    const currency = searchParams.get('currency') || 'KSH'
    const planName = plan === 'yearly' ? 'Yearly' : 'Monthly'

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    router.push('/dashboard')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [router])

    return (
        <div className="min-h-screen h-full bg-[#F8F8F9]">
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
                    Payment Successful
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
            <div className="relative w-full min-h-screen overflow-visible pb-20 flex items-center justify-center">
                <div className="w-[700px] bg-white border border-[#BFC4CB] rounded-lg px-16 py-16 flex flex-col items-center gap-8">
                    {/* Success Icon */}
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                            className="w-12 h-12 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    {/* Success Message */}
                    <div className="flex flex-col items-center gap-4 text-center">
                        <h1 className="font-archivo font-bold text-[32px] text-[#191D23]">
                            Payment Successful!
                        </h1>
                        <p className="font-dm-sans font-normal text-[18px] text-[#4a5565] max-w-md">
                            Thank you for subscribing to FahamPesa Pro {planName} Plan
                        </p>
                    </div>

                    {/* Payment Details */}
                    <div className="w-full bg-[#F8F8F9] rounded-lg px-8 py-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <p className="font-dm-sans font-medium text-[16px] text-[#191D23]">
                                Plan
                            </p>
                            <p className="font-dm-sans font-semibold text-[16px] text-[#191D23]">
                                FahamPesa Pro {planName}
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="font-dm-sans font-medium text-[16px] text-[#191D23]">
                                Amount Paid
                            </p>
                            <p className="font-dm-sans font-semibold text-[18px] text-[#004AAD]">
                                {currency} {Number(amount).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="font-dm-sans font-medium text-[16px] text-[#191D23]">
                                Status
                            </p>
                            <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-dm-sans font-semibold text-[14px]">
                                Active
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col items-center gap-4 w-full mt-4">
                        <Link
                            href="/dashboard"
                            className="bg-[#004AAD] rounded-3xl h-[50px] w-full flex items-center justify-center hover:bg-[#FF9500] transition-all duration-300 group"
                        >
                            <span className="font-dm-sans font-semibold text-[18px] text-white group-hover:text-[#004AAD] transition-colors duration-300">
                                Go to Dashboard
                            </span>
                        </Link>

                        <p className="font-dm-sans text-[14px] text-[#4a5565]">
                            Redirecting to dashboard in {countdown} seconds...
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className="w-full bg-blue-50 border border-dashed border-[#004AAD] rounded-lg px-4 py-4 flex items-start gap-3">
                        <div className="w-6 h-6 shrink-0">
                            <Image
                                src="/assets/figma/subscription/info-icon.svg"
                                alt="info"
                                width={24}
                                height={24}
                            />
                        </div>
                        <p className="font-dm-sans font-normal text-[14px] text-[#191D23] leading-relaxed">
                            A confirmation email has been sent to your registered email address. You now have full access to all FahamPesa Pro features.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
