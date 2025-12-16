'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { getCurrencySymbol, useCurrency } from '@/hooks/useCurrency'

// Loading component for Suspense fallback
function LoadingState() {
    return (
        <div className="min-h-screen h-full bg-[#F8F8F9] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004AAD]"></div>
        </div>
    )
}

// Main checkout content component
function CheckoutContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuth()
    const { country, isLoading: isCurrencyLoading } = useCurrency()

    // Determine if user is in Kenya
    const isKenyan = country === 'KE'

    const [selectedPayment, setSelectedPayment] = useState<'mpesa' | 'stripe' | 'whatsapp' | null>(null)
    const [expandedPayment, setExpandedPayment] = useState<'mpesa' | 'stripe' | 'whatsapp' | null>(null)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [isWaitingConfirmation, setIsWaitingConfirmation] = useState(false)
    const [error, setError] = useState('')
    const [pollCount, setPollCount] = useState(0)
    const MAX_POLL_ATTEMPTS = 30 // Poll for up to 60 seconds (30 attempts * 2 seconds)

    // Get plan details from URL params
    const plan = searchParams.get('plan') || 'yearly' // monthly or yearly
    const currency = searchParams.get('currency') || 'USD' // Default to USD

    // Calculate amount based on plan and currency
    const getAmount = () => {
        if (currency === 'KSH') {
            return plan === 'yearly' ? 20000 : 2000
        } else {
            return plan === 'yearly' ? 100 : 10
        }
    }

    const amount = getAmount()
    const planName = plan === 'yearly' ? 'Yearly' : 'Monthly'
    const currencySymbol = getCurrencySymbol(currency as 'KSH' | 'USD')

    const handleWhatsAppClick = () => {
        if (expandedPayment === 'whatsapp') {
            setExpandedPayment(null)
            setSelectedPayment(null)
        } else {
            setSelectedPayment('whatsapp')
            setExpandedPayment('whatsapp')
        }
    }

    const handleMpesaClick = () => {
        if (expandedPayment === 'mpesa') {
            setExpandedPayment(null)
            setSelectedPayment(null)
            setError('')
        } else {
            setSelectedPayment('mpesa')
            setExpandedPayment('mpesa')
            setError('')
        }
    }

    const handleStripeClick = () => {
        if (expandedPayment === 'stripe') {
            setExpandedPayment(null)
            setSelectedPayment(null)
            setError('')
        } else {
            setSelectedPayment('stripe')
            setExpandedPayment('stripe')
            setError('')
        }
    }

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setPhoneNumber(value)
        setError('')
    }

    const validatePhoneNumber = (phone: string) => {
        const phoneRegex = /^\+254[17]\d{8}$/
        return phoneRegex.test(phone)
    }

    const handleMpesaPayment = async () => {
        // Validate phone number
        if (!phoneNumber) {
            setError('Please enter your phone number')
            return
        }

        if (!validatePhoneNumber(phoneNumber)) {
            setError('Please enter a valid phone number (e.g., +254712345678)')
            return
        }

        if (!user) {
            setError('Please log in to subscribe')
            return
        }

        setIsProcessing(true)
        setError('')

        try {
            const response = await fetch('/api/mpesa/stk-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber,
                    amount,
                    accountReference: `FahamPesa-${planName}`,
                    transactionDesc: `FahamPesa Pro ${planName} Subscription`,
                    // Subscription fields for tracking
                    userId: user.uid,
                    email: user.email,
                    planType: plan, // 'monthly' or 'yearly'
                    currency: currency, // 'KSH' or 'USD'
                }),
            })

            const data = await response.json()

            if (data.ResponseCode === '0') {
                // STK push sent successfully - now poll for payment confirmation
                const subscriptionId = data.subscriptionId

                if (!subscriptionId) {
                    setError('Payment initiated but could not track status. Please check your M-Pesa messages.')
                    setIsProcessing(false)
                    return
                }

                // Start polling for payment status
                setIsWaitingConfirmation(true)
                setPollCount(0)
                pollPaymentStatus(subscriptionId)
            } else {
                setError(data.errorMessage || data.ResponseDescription || 'Payment failed. Please try again.')
                setIsProcessing(false)
            }
        } catch (error) {
            console.error('Payment error:', error)
            setError('An error occurred. Please try again.')
            setIsProcessing(false)
        }
    }

    const pollPaymentStatus = async (subscriptionId: string) => {
        let attempts = 0

        const poll = async () => {
            try {
                const response = await fetch(`/api/mpesa/status?subscriptionId=${subscriptionId}`)
                const data = await response.json()

                if (data.status === 'active') {
                    // Payment successful - redirect to success page
                    router.push(`/dashboard/subscription/success?plan=${plan}&amount=${amount}&currency=${currency}&subscriptionId=${subscriptionId}`)
                    return
                } else if (data.status === 'failed') {
                    // Payment failed
                    setError('Payment failed. Please check you have sufficient funds and try again.')
                    setIsProcessing(false)
                    setIsWaitingConfirmation(false)
                    return
                } else if (data.status === 'pending') {
                    // Still pending - continue polling
                    attempts++
                    setPollCount(attempts)

                    if (attempts >= MAX_POLL_ATTEMPTS) {
                        // Timeout - stop polling
                        setError('Payment confirmation timed out. If money was deducted, please contact support.')
                        setIsProcessing(false)
                        setIsWaitingConfirmation(false)
                        return
                    }

                    // Poll again after 2 seconds
                    setTimeout(poll, 2000)
                }
            } catch (error) {
                console.error('Error polling payment status:', error)
                attempts++
                setPollCount(attempts)

                if (attempts >= MAX_POLL_ATTEMPTS) {
                    setError('Could not verify payment status. Please check your M-Pesa messages or contact support.')
                    setIsProcessing(false)
                    setIsWaitingConfirmation(false)
                    return
                }

                // Retry after 2 seconds
                setTimeout(poll, 2000)
            }
        }

        // Start polling after a short delay to give callback time to process
        setTimeout(poll, 3000)
    }

    const handleStripePayment = async () => {
        if (!user) {
            setError('Please log in to subscribe')
            return
        }

        setIsProcessing(true)
        setError('')

        try {
            const response = await fetch('/api/stripe/checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planType: plan, // 'monthly' or 'yearly'
                    userId: user.uid,
                    email: user.email,
                }),
            })

            const data = await response.json()

            if (data.sessionUrl) {
                // Redirect to Stripe Checkout
                window.location.href = data.sessionUrl
            } else {
                setError(data.error || 'Failed to create checkout session. Please try again.')
                setIsProcessing(false)
            }
        } catch (error) {
            console.error('Stripe checkout error:', error)
            setError('An error occurred. Please try again.')
            setIsProcessing(false)
        }
    }

    // Show loading state while detecting currency/country
    if (isCurrencyLoading) {
        return <LoadingState />
    }

    return (
        <div className="min-h-screen h-full bg-[#F8F8F9]">
            {/* Header - Same as subscription page */}
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
                    Checkout
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
            <div className="relative w-full min-h-screen overflow-visible pb-20">
                {/* Back Button - See all plans */}
                <button
                    onClick={() => window.history.back()}
                    className="absolute left-[410px] -translate-x-1/2 top-[90px] flex items-start gap-2 hover:opacity-80 transition-opacity w-fit cursor-pointer"
                >
                    <div className="w-6 h-6 flex items-center justify-center rotate-[270deg]">
                        <Image
                            src="/assets/figma/subscription/arrow-left.svg"
                            alt="back"
                            width={24}
                            height={24}
                        />
                    </div>
                    <p className="font-dm-sans font-normal text-[18px] text-slate-500 leading-normal">
                        See pricing
                    </p>
                </button>

                {/* Checkout Card */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[130px] w-[900px] bg-white border border-[#BFC4CB] rounded-[8px] px-[65px] py-[60px] flex flex-col gap-[28px]">
                    {/* Description Section */}
                    <div className="w-[770px] flex flex-col gap-[65px]">
                        {/* Title and Amount */}
                        <div className="flex flex-col gap-10 w-full">
                            {/* Title */}
                            <div className="flex flex-col gap-4 w-full text-[#191D23]">
                                <p className="font-archivo font-bold text-[24px] leading-normal">
                                    Order summary
                                </p>
                                <p className="font-dm-sans font-normal text-[16px] leading-normal h-11">
                                    You are subscribing to <span className="font-semibold">FahamPesa Pro {planName} plan</span>. You will be charged {currencySymbol} {amount.toLocaleString()} for the subscription.
                                </p>
                            </div>

                            {/* Amount Section */}
                            <div className="flex flex-col gap-[34px] w-full">
                                {/* Line Item */}
                                <div className="flex items-center justify-between w-full pb-4 border-b border-[#8698B2] font-dm-sans font-normal text-[16px] text-[#191D23] leading-normal">
                                    <p>{plan === 'yearly' ? '1 Year Pro Plan + 2 Months Free' : '1 Month Pro Plan'}</p>
                                    <p>{currencySymbol} {amount.toLocaleString()}</p>
                                </div>

                                {/* Tax */}
                                <div className="flex items-center justify-between w-full font-dm-sans font-normal text-[16px] text-[#191D23] leading-normal">
                                    <p>Sales tax/VAT 0%</p>
                                    <p>{currencySymbol} 0</p>
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-between w-full pb-5 border-b border-[#8698B2] font-dm-sans font-bold text-[20px] text-[#191D23] leading-normal">
                                    <p>Order Total</p>
                                    <p>{currencySymbol} {amount.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="w-full bg-[#F8F8F9] border border-dashed border-[#004AAD] px-[14px] py-4 flex items-center gap-[10px]">
                                <div className="w-6 h-6 shrink-0 overflow-hidden">
                                    <Image
                                        src="/assets/figma/subscription/info-icon.svg"
                                        alt="info"
                                        width={24}
                                        height={24}
                                    />
                                </div>
                                <p className="font-dm-sans font-normal text-[16px] text-[#191D23] leading-normal w-[698px]">
                                    {isKenyan
                                        ? <>Choose <span className="font-bold">M-Pesa</span> as your payment method to complete your subscription.</>
                                        : <>Pay securely with <span className="font-bold">Credit/Debit Card</span> via Stripe. Your payment is protected by industry-standard encryption.</>
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Options */}
                    <div className="w-[770px] flex flex-col gap-6">
                        {/* Stripe Card Payment - Only show for non-Kenya users */}
                        {!isKenyan && (
                            <div className="w-full border border-[#004AAD] rounded-[8px] overflow-hidden">
                                {/* Stripe Header */}
                                <button
                                    onClick={handleStripeClick}
                                    className="w-full bg-[#F8F8F9] border-b border-[#004AAD] px-[14px] py-4 h-16 flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-[10px]">
                                        <p className="font-dm-sans font-semibold text-[16px] text-[#191D23] leading-normal">
                                            Pay with
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <svg width="63" height="32" viewBox="0 0 63 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M58.5406 16.5862C58.5406 12.4233 56.5242 9.13856 52.6702 9.13856C48.8001 9.13856 46.4584 12.4233 46.4584 16.5537C46.4584 21.4483 49.2229 23.92 53.1906 23.92C55.1257 23.92 56.5892 23.481 57.695 22.8631V19.6108C56.5892 20.1637 55.3208 20.5052 53.711 20.5052C52.1336 20.5052 50.7351 19.9523 50.5563 18.0335H58.508C58.508 17.8221 58.5406 16.9765 58.5406 16.5862ZM50.5075 15.0414C50.5075 13.2039 51.6295 12.4396 52.654 12.4396C53.6459 12.4396 54.7029 13.2039 54.7029 15.0414H50.5075ZM40.1816 9.13856C38.588 9.13856 37.5635 9.88658 36.9944 10.4069L36.783 9.39874H33.2055V28.3594L37.2708 27.4975L37.2871 22.8956C37.8725 23.3184 38.7343 23.92 40.1653 23.92C43.0761 23.92 45.7267 21.5784 45.7267 16.4236C45.7104 11.7078 43.0273 9.13856 40.1816 9.13856ZM39.2059 20.3426C38.2465 20.3426 37.6774 20.0011 37.2871 19.5783L37.2708 13.5454C37.6936 13.0738 38.279 12.7486 39.2059 12.7486C40.6857 12.7486 41.7101 14.4072 41.7101 16.5374C41.7101 18.7164 40.7019 20.3426 39.2059 20.3426ZM27.6116 8.17914L31.6932 7.30104V4L27.6116 4.86185V8.17914ZM27.6116 9.415H31.6932V23.6436H27.6116V9.415ZM23.2373 10.6183L22.9772 9.415H19.4647V23.6436H23.5301V14.0007C24.4895 12.7486 26.1156 12.9762 26.6197 13.1551V9.415C26.0993 9.21987 24.1968 8.86212 23.2373 10.6183ZM15.1067 5.88631L11.139 6.73189L11.1227 19.7572C11.1227 22.1638 12.9277 23.9363 15.3344 23.9363C16.6678 23.9363 17.6435 23.6924 18.1801 23.3997V20.0987C17.6597 20.31 15.0905 21.0581 15.0905 18.6514V12.8787H18.1801V9.415H15.0905L15.1067 5.88631ZM4.1141 13.5454C4.1141 12.9112 4.63446 12.6673 5.49631 12.6673C6.73216 12.6673 8.29325 13.0413 9.5291 13.708V9.88658C8.17942 9.34996 6.84599 9.13856 5.49631 9.13856C2.19527 9.13856 0 10.8623 0 13.7405C0 18.2286 6.17928 17.5131 6.17928 19.4482C6.17928 20.1962 5.52883 20.4401 4.6182 20.4401C3.26851 20.4401 1.54482 19.8873 0.178874 19.1392V23.0094C1.69117 23.6599 3.21973 23.9363 4.6182 23.9363C8.00054 23.9363 10.3259 22.2614 10.3259 19.3506C10.3096 14.5048 4.1141 15.3666 4.1141 13.5454Z" fill="#635BFF" />
                                            </svg>

                                            <span className="font-dm-sans text-[14px] text-[#4a5565]">Credit/Debit Card</span>
                                        </div>
                                    </div>
                                    <div className="w-5 h-5">
                                        {selectedPayment === 'stripe' ? (
                                            <Image
                                                src="/assets/figma/subscription/radio-selected.svg"
                                                alt="selected"
                                                width={20}
                                                height={20}
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border border-[#B6BABF] bg-white" />
                                        )}
                                    </div>
                                </button>

                                {/* Stripe Expanded Content */}
                                {expandedPayment === 'stripe' && (
                                    <div className="px-6 py-[30px] flex flex-col gap-[37px] bg-white">
                                        <div className="flex flex-col gap-7 w-full">
                                            <p className="font-dm-sans font-bold text-[16px] text-[#191D23] leading-normal tracking-[0.64px] uppercase">
                                                Secure Card Payment via Stripe
                                            </p>
                                        </div>

                                        {error && (
                                            <p className="font-dm-sans text-[14px] text-red-500">
                                                {error}
                                            </p>
                                        )}

                                        <div className="flex flex-col gap-7 w-full">
                                            <p className="font-dm-sans font-normal text-[16px] text-[#191D23] leading-normal">
                                                You will be redirected to Stripe&apos;s secure checkout page to complete your payment. We accept all major credit and debit cards including Visa, Mastercard, and American Express.
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <svg className="h-8 w-auto" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000" opacity=".07" />
                                                    <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" fill="#fff" />
                                                    <path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0 2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4 1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5 8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0 .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9 9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688" />
                                                </svg>
                                                <svg className="h-8 w-auto" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000" opacity=".07" />
                                                    <path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" fill="#fff" />
                                                    <circle fill="#EB001B" cx="15" cy="12" r="7" />
                                                    <circle fill="#F79E1B" cx="23" cy="12" r="7" />
                                                    <path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z" />
                                                </svg>
                                             
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleStripePayment}
                                            disabled={isProcessing}
                                            className="bg-[#635BFF] border-[1.5px] border-[#635BFF] rounded-[24px] px-3 py-[6px] h-[50px] w-[327px] flex items-center justify-center gap-1 hover:bg-[#4B45C6] hover:border-[#4B45C6] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span className="font-dm-sans font-semibold text-[18px] text-white text-center leading-normal ml-2">
                                                        Redirecting...
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="font-dm-sans font-semibold text-[18px] text-white text-center leading-normal">
                                                    Pay ${amount} with Card
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* M-Pesa Dropdown - Only show for Kenya users */}
                        {isKenyan && (
                            <div className="w-full border border-[#004AAD] rounded-[8px] overflow-hidden">
                                {/* M-Pesa Header */}
                                <button
                                    onClick={handleMpesaClick}
                                    className="w-full bg-[#F8F8F9] border-b border-[#004AAD] px-[14px] py-4 h-16 flex items-center justify-between transition-colors"
                                >
                                    <div className="flex items-center gap-[10px]">
                                        <p className="font-dm-sans font-semibold text-[16px] text-[#191D23] leading-normal">
                                            Pay with
                                        </p>
                                        <div className="w-[87px] h-8 relative">
                                            <Image
                                                src="/assets/figma/subscription/mpesa-logo.png"
                                                alt="M-Pesa"
                                                fill
                                                className="object-cover object-center"
                                            />
                                        </div>
                                    </div>
                                    <div className="w-5 h-5">
                                        {selectedPayment === 'mpesa' ? (
                                            <Image
                                                src="/assets/figma/subscription/radio-selected.svg"
                                                alt="selected"
                                                width={20}
                                                height={20}
                                            />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full border border-[#B6BABF] bg-white" />
                                        )}
                                    </div>
                                </button>

                                {/* M-Pesa Expanded Content */}
                                {expandedPayment === 'mpesa' && (
                                    <div className="px-6 py-[30px] flex flex-col gap-[37px] bg-white">
                                        <div className="flex flex-col gap-7 w-full">
                                            <p className="font-dm-sans font-bold text-[16px] text-[#191D23] leading-normal tracking-[0.64px] uppercase">
                                                Complete your payment via M-Pesa
                                            </p>
                                        </div>

                                        {/* Phone Number Input */}
                                        <div className="flex flex-col gap-3 w-full">
                                            <label htmlFor="mpesa-phone" className="font-dm-sans font-semibold text-[14px] text-[#191D23]">
                                                M-Pesa Phone Number
                                            </label>
                                            <input
                                                id="mpesa-phone"
                                                name="mpesa-phone"
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={handlePhoneNumberChange}
                                                placeholder="+254712345678"
                                                autoComplete="tel"
                                                style={{ pointerEvents: 'auto' }}
                                                className="w-full border border-[#BFC4CB] rounded-lg px-4 py-3 font-dm-sans text-[16px] text-[#191D23] focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD] bg-white cursor-text"
                                            />
                                            {error && (
                                                <p className="font-dm-sans text-[14px] text-red-500">
                                                    {error}
                                                </p>
                                            )}
                                            <p className="font-dm-sans text-[14px] text-[#4a5565]">
                                                Enter your M-Pesa registered phone number in format: +254XXXXXXXXX
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-7 w-full">
                                            <p className="font-dm-sans font-normal text-[16px] text-[#191D23] leading-normal">
                                                {isWaitingConfirmation
                                                    ? 'Waiting for payment confirmation. Please complete the transaction on your phone...'
                                                    : isProcessing
                                                        ? 'Check your phone for the M-Pesa prompt. Enter your PIN to complete the payment.'
                                                        : 'You will receive an M-Pesa prompt on your phone to complete the payment. Make sure your phone is on and ready to receive the prompt.'
                                                }
                                            </p>
                                            {isWaitingConfirmation && (
                                                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                                    <svg className="animate-spin h-5 w-5 text-[#004AAD]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span className="font-dm-sans text-[14px] text-[#004AAD]">
                                                        Verifying payment... ({Math.max(0, 60 - pollCount * 2)}s remaining)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleMpesaPayment}
                                            disabled={isProcessing || isWaitingConfirmation}
                                            className="bg-[#004AAD] border-[1.5px] border-[#004AAD] rounded-[24px] px-3 py-[6px] h-[50px] w-[327px] flex items-center justify-center gap-1 hover:bg-[#FF9500] hover:border-[#FF9500] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#004AAD] disabled:hover:border-[#004AAD]"
                                        >
                                            {isProcessing || isWaitingConfirmation ? (
                                                <>
                                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span className="font-dm-sans font-semibold text-[18px] text-white text-center leading-normal ml-2">
                                                        {isWaitingConfirmation ? 'Awaiting Confirmation...' : 'Processing...'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="font-dm-sans font-semibold text-[18px] text-white text-center leading-normal group-hover:text-[#004AAD] transition-colors duration-300">
                                                    Pay with M-Pesa
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* WhatsApp Dropdown */}
                        <div className="w-full border border-[#004AAD] rounded-[8px] overflow-hidden">
                            {/* WhatsApp Header */}
                            <button
                                onClick={handleWhatsAppClick}
                                className="w-full bg-[#F8F8F9] border-b border-[#004AAD] px-[14px] py-4 h-16 flex items-center justify-between transition-colors"
                            >
                                <div className="flex items-center gap-[10px]">
                                    <p className="font-dm-sans font-semibold text-[16px] text-[#191D23] leading-normal">
                                        WhatsApp
                                    </p>
                                </div>
                                <div className="w-5 h-5">
                                    {selectedPayment === 'whatsapp' ? (
                                        <Image
                                            src="/assets/figma/subscription/radio-selected.svg"
                                            alt="selected"
                                            width={20}
                                            height={20}
                                        />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border border-[#B6BABF] bg-white" />
                                    )}
                                </div>
                            </button>

                            {/* WhatsApp Expanded Content */}
                            {expandedPayment === 'whatsapp' && (
                                <div className="px-6 py-[30px] flex flex-col gap-[37px] bg-white">
                                    <div className="flex flex-col gap-7 w-full">
                                        <p className="font-dm-sans font-bold text-[16px] text-[#191D23] leading-normal tracking-[0.64px] uppercase">
                                            Connect with our support team via whatsapp for assisted setup
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-7 w-full">
                                        <p className="font-dm-sans font-normal text-[16px] text-[#191D23] leading-normal">
                                            If you are having issues with the subscription, connect with our support team for assisted subscription plan setup. Click the button below
                                        </p>
                                    </div>
                                    <a
                                        href="https://wa.me/your-whatsapp-number"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#0F866C] border-[1.5px] border-[#0F866C] rounded-[24px] px-3 py-[6px] h-[50px] w-[327px] flex items-center justify-center gap-1 hover:bg-[#FF9500] hover:border-[#FF9500] transition-all duration-300 group"
                                    >
                                        <span className="font-dm-sans font-semibold text-[18px] text-white text-center leading-normal group-hover:text-[#004AAD] transition-colors duration-300">
                                            Chat on WhatsApp
                                        </span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            <div className="h-96"></div>

        </div>
    )
}

// Main page component with Suspense boundary
export default function CheckoutPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <CheckoutContent />
        </Suspense>
    )
}
