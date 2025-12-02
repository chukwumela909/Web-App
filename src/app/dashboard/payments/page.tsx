'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface SubscriptionHistory {
  id: string
  planName: string
  planType: 'monthly' | 'yearly'
  amount: number
  currency: 'KSH' | 'USD'
  status: 'active' | 'expired' | 'failed' | 'pending' | 'cancelled'
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
}

function PaymentsPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<SubscriptionHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPlan, setCurrentPlan] = useState<'free' | 'monthly' | 'yearly'>('free')

  // Fetch user's subscription history
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const subscriptionsRef = collection(db, 'subscriptions')
        // Simple query without orderBy to avoid index requirement
        const q = query(
          subscriptionsRef,
          where('userId', '==', user.uid)
        )
        
        const snapshot = await getDocs(q)
        const subs: SubscriptionHistory[] = []
        
        snapshot.forEach((doc) => {
          const data = doc.data()
          
          // Handle different date formats (timestamp number or Firestore Timestamp)
          const parseDate = (value: any): Date | null => {
            if (!value) return null
            if (typeof value === 'number') return new Date(value)
            if (value?.toDate) return value.toDate()
            if (value?.seconds) return new Date(value.seconds * 1000)
            if (typeof value === 'string') return new Date(value)
            return null
          }
          
          subs.push({
            id: doc.id,
            planName: data.planName || (data.planType === 'yearly' ? '1 Year Pro Plan' : '1 Month Pro Plan'),
            planType: data.planType || 'monthly',
            amount: data.amount || 0,
            currency: data.currency || 'KSH',
            status: data.status || 'pending',
            startDate: parseDate(data.startDate),
            endDate: parseDate(data.endDate),
            createdAt: parseDate(data.createdAt) || new Date()
          })
        })
        
        // Sort by createdAt descending (newest first)
        subs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        
        setSubscriptions(subs)
        
        // Determine current plan based on active subscription
        const activeSubscription = subs.find(s => s.status === 'active')
        if (activeSubscription) {
          setCurrentPlan(activeSubscription.planType)
        } else {
          setCurrentPlan('free')
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSubscriptions()
  }, [user])

  const handleUpgradePlan = () => {
    router.push('/dashboard/pricing')
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    }).replace(/\//g, '-')
  }

  const getStatusBadge = (status: SubscriptionHistory['status']) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-[#ecfdf3]',
          text: 'text-[#027a48]',
          dot: '/assets/figma/payments/dot-green.svg',
          label: 'Active'
        }
      case 'pending':
        return {
          bg: 'bg-[#fffaeb]',
          text: 'text-[#b54708]',
          dot: '/assets/figma/payments/dot-yellow.svg',
          label: 'Pending'
        }
      case 'failed':
      case 'cancelled':
        return {
          bg: 'bg-[#fef3f2]',
          text: 'text-[#f04438]',
          dot: '/assets/figma/payments/dot-red.svg',
          label: status === 'failed' ? 'Failed' : 'Cancelled'
        }
      default:
        return {
          bg: 'bg-zinc-100',
          text: 'text-[#717171]',
          dot: '/assets/figma/payments/dot-gray.svg',
          label: 'Expired'
        }
    }
  }

  return (
    <div className="w-full">
      {/* Current Plan Section */}
      <div className="bg-white border border-[#222222] rounded-[12px] p-4 mb-6">
        <div className="flex flex-col gap-[23px]">
          <h2 className="font-dm-sans font-semibold text-[24px] text-[#001223]">
            Current Plan
          </h2>
          
          <div className="flex items-center justify-between">
            {/* Current Plan Display (Read-only) */}
            <div className="flex gap-4 items-center">
              <div
                className={`flex gap-2.5 items-center p-3 rounded-lg ${
                  currentPlan === 'free'
                    ? 'border-2 border-[#2b81c3] bg-blue-50'
                    : 'border border-[#d7d7d7]'
                }`}
              >
                <div className="w-6 h-6 shrink-0">
                  {currentPlan === 'free' ? (
                    <Image
                      src="/assets/figma/payments/check-fill.svg"
                      alt="current plan"
                      width={24}
                      height={24}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-gray-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <p className="font-dm-sans font-medium text-base text-[#222222]">
                    Free Plan
                  </p>
                  <p className="font-dm-sans text-sm text-[#717171]">
                    KSH 0 / month
                  </p>
                </div>
              </div>

              <div
                className={`flex gap-2.5 items-center p-3 rounded-lg ${
                  currentPlan === 'monthly'
                    ? 'border-2 border-[#2b81c3] bg-blue-50'
                    : 'border border-[#d7d7d7]'
                }`}
              >
                <div className="w-6 h-6 shrink-0">
                  {currentPlan === 'monthly' ? (
                    <Image
                      src="/assets/figma/payments/check-fill.svg"
                      alt="current plan"
                      width={24}
                      height={24}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-gray-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <p className="font-dm-sans font-medium text-base text-[#222222]">
                    1 Month Pro Plan
                  </p>
                  <p className="font-dm-sans text-sm text-[#717171]">
                    KSH 2,000 / month
                  </p>
                </div>
              </div>

              <div
                className={`flex gap-2.5 items-center p-3 rounded-lg ${
                  currentPlan === 'yearly'
                    ? 'border-2 border-[#2b81c3] bg-blue-50'
                    : 'border border-[#d7d7d7]'
                }`}
              >
                <div className="w-6 h-6 shrink-0">
                  {currentPlan === 'yearly' ? (
                    <Image
                      src="/assets/figma/payments/check-fill.svg"
                      alt="current plan"
                      width={24}
                      height={24}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-gray-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <p className="font-dm-sans font-medium text-base text-[#222222]">
                    1 Year Pro Plan
                  </p>
                  <p className="font-dm-sans text-sm text-[#717171]">
                    KSH 20,000 / year
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade Plan Button - only show if on free plan */}
            {currentPlan === 'free' && (
              <button 
                onClick={handleUpgradePlan}
                className="bg-[#004aad] border-[1.5px] border-[#004aad] rounded-full px-6 py-1.5 h-14 w-[180px] flex items-center justify-center hover:bg-[#003a8c] transition-colors"
              >
                <p className="font-dm-sans font-semibold text-base text-white text-center">
                  Upgrade Plan
                </p>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Billing History Section */}
      <div className="bg-white border border-[#222222] rounded-[12px] p-4">
        <div className="flex flex-col gap-[30px]">
          <h2 className="font-dm-sans font-semibold text-[24px] text-[#001223]">
            Billing History
          </h2>

          {/* Table */}
          <div className="flex flex-col gap-[8px]">
            {/* Table Header */}
            <div className="bg-zinc-100 flex gap-[20px] items-center px-[8px] rounded-[8px]">
              <div className="flex gap-[10px] items-center p-[10px] rounded-[4px] w-[250px]">
                <p className="font-dm-sans font-normal text-[16px] text-[#717171]">
                  Plan Name
                </p>
              </div>
              <div className="flex flex-1 gap-[10px] items-center p-[10px] rounded-[4px]">
                <p className="font-dm-sans font-normal text-[16px] text-[#717171]">
                  Amount
                </p>
              </div>
              <div className="flex flex-1 gap-[10px] items-center p-[10px] rounded-[4px]">
                <p className="font-dm-sans font-normal text-[16px] text-[#717171]">
                  Purchase Date
                </p>
              </div>
              <div className="flex flex-1 gap-[10px] items-center p-[10px] rounded-[4px]">
                <p className="font-dm-sans font-normal text-[16px] text-[#717171]">
                  End Date
                </p>
              </div>
              <div className="flex flex-1 gap-[10px] items-center p-[10px] rounded-[4px]">
                <p className="font-dm-sans font-normal text-[16px] text-[#717171]">
                  Status
                </p>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="py-8 text-center">
                <p className="font-dm-sans text-[16px] text-[#717171]">Loading billing history...</p>
              </div>
            )}

            {/* No subscriptions */}
            {!isLoading && subscriptions.length === 0 && (
              <div className="py-8 text-center">
                <p className="font-dm-sans text-[16px] text-[#717171]">No billing history yet</p>
                <p className="font-dm-sans text-[14px] text-[#999] mt-2">Subscribe to a plan to see your billing history here</p>
              </div>
            )}

            {/* Table Rows - Real Data */}
            {!isLoading && subscriptions.map((sub) => {
              const badge = getStatusBadge(sub.status)
              const isActive = sub.status === 'active'
              return (
                <div key={sub.id} className="flex gap-[20px] items-center px-[8px] rounded-[8px]">
                  <div className="flex gap-[10px] items-center p-[10px] rounded-[4px] w-[250px]">
                    <p className={`font-dm-sans font-normal text-[16px] ${isActive ? 'text-[#222222]' : 'text-[#717171]'}`}>
                      {sub.planName}
                    </p>
                  </div>
                  <div className="flex flex-1 gap-[10px] items-center p-[10px] rounded-[4px]">
                    <p className="font-dm-sans font-normal text-[16px] text-[#717171]">
                      {sub.currency === 'USD' ? '$' : 'KSH'} <span className={isActive ? 'text-[#222222]' : 'text-[#717171]'}>{sub.amount.toLocaleString()}</span>
                    </p>
                  </div>
                  <div className="flex flex-1 gap-[10px] items-center p-[10px] rounded-[4px]">
                    <p className={`font-dm-sans font-normal text-[16px] ${isActive ? 'text-[#222222]' : 'text-[#717171]'}`}>
                      {formatDate(sub.startDate || sub.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-1 gap-[10px] items-center p-[10px] rounded-[4px]">
                    <p className={`font-dm-sans font-normal text-[16px] ${isActive ? 'text-[#222222]' : 'text-[#717171]'}`}>
                      {formatDate(sub.endDate)}
                    </p>
                  </div>
                  <div className="flex flex-1 gap-[10px] items-center px-[10px] py-[6px] rounded-[4px]">
                    <div className="flex items-start">
                      <div className={`${badge.bg} flex gap-[6px] items-center justify-center pl-[6px] pr-[8px] py-[4px] rounded-[16px]`}>
                        <Image
                          src={badge.dot}
                          alt={badge.label}
                          width={8}
                          height={8}
                        />
                        <p className={`font-dm-sans font-medium text-[14px] leading-[18px] ${badge.text} text-center`}>
                          {badge.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pb-[16px] pt-[12px] px-[24px]">
            <p className="font-dm-sans font-medium text-[14px] leading-[20px] text-[#717171]">
              {subscriptions.length > 0 ? `Showing ${subscriptions.length} subscription(s)` : 'Page 1 of 1'}
            </p>
            <div className="flex gap-[12px]">
              <button className="bg-white border border-[#d0d5dd] rounded-[8px] px-[14px] py-[8px]" disabled>
                <p className="font-dm-sans font-medium text-[14px] leading-[20px] text-[#d7d7d7]">
                  Previous
                </p>
              </button>
              <button className="bg-white border border-[#d0d5dd] rounded-[8px] px-[14px] py-[8px]" disabled>
                <p className="font-dm-sans font-medium text-[14px] leading-[20px] text-[#d7d7d7]">
                  Next
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PaymentsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
