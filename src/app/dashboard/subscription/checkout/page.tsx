'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

export default function CheckoutPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuth()
    
    const [selectedPayment, setSelectedPayment] = useState<'mpesa' | 'whatsapp' | null>(null)
    const [expandedPayment, setExpandedPayment] = useState<'mpesa' | 'whatsapp' | null>(null)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState('')
    
    // Get plan details from URL params
    const plan = searchParams.get('plan') || 'yearly' // monthly or yearly
    const currency = searchParams.get('currency') || 'KSH'
    
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
                // STK push sent successfully
                // Store subscription ID for later verification
                const subscriptionId = data.subscriptionId
                
                // Wait a bit for user to complete payment, then redirect to success page
                setTimeout(() => {
                    router.push(`/dashboard/subscription/success?plan=${plan}&amount=${amount}&currency=${currency}${subscriptionId ? `&subscriptionId=${subscriptionId}` : ''}`)
                }, 3000) // Give user 3 seconds to see the prompt on their phone
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
                                    You are subscribing to <span className="font-semibold">FahamPesa Pro {planName} plan</span>. You will be charged {currency} {amount.toLocaleString()} for the subscription.
                                </p>
                            </div>

                            {/* Amount Section */}
                            <div className="flex flex-col gap-[34px] w-full">
                                {/* Line Item */}
                                <div className="flex items-center justify-between w-full pb-4 border-b border-[#8698B2] font-dm-sans font-normal text-[16px] text-[#191D23] leading-normal">
                                    <p>{plan === 'yearly' ? '1 Year Pro Plan + 2 Months Free' : '1 Month Pro Plan'}</p>
                                    <p>{currency} {amount.toLocaleString()}</p>
                                </div>

                                {/* Tax */}
                                <div className="flex items-center justify-between w-full font-dm-sans font-normal text-[16px] text-[#191D23] leading-normal">
                                    <p>Sales tax/VAT 0%</p>
                                    <p>{currency} 0</p>
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-between w-full pb-5 border-b border-[#8698B2] font-dm-sans font-bold text-[20px] text-[#191D23] leading-normal">
                                    <p>Order Total</p>
                                    <p>{currency} {amount.toLocaleString()}</p>
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
                                    If your are in Kenya, choose <span className="font-bold">M-Pesa</span> as your payment method. Users Outside Kenya can use credit card as mode of payment.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Options */}
                    <div className="w-[770px] flex flex-col gap-6">
                        {/* M-Pesa Dropdown */}
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
                                            {isProcessing 
                                                ? 'Check your phone for the M-Pesa prompt. Enter your PIN to complete the payment.'
                                                : 'You will receive an M-Pesa prompt on your phone to complete the payment. Make sure your phone is on and ready to receive the prompt.'
                                            }
                                        </p>
                                    </div>
                                    
                                    <button
                                        onClick={handleMpesaPayment}
                                        disabled={isProcessing}
                                        className="bg-[#004AAD] border-[1.5px] border-[#004AAD] rounded-[24px] px-3 py-[6px] h-[50px] w-[327px] flex items-center justify-center gap-1 hover:bg-[#FF9500] hover:border-[#FF9500] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#004AAD] disabled:hover:border-[#004AAD]"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span className="font-dm-sans font-semibold text-[18px] text-white text-center leading-normal ml-2">
                                                    Processing...
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
