import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crown, CheckCircle2, Star } from 'lucide-react'
import { FEATURE_NAMES } from '@/lib/plan-limits'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: keyof typeof FEATURE_NAMES
  currentCount?: number
  limit?: number | 'unlimited'
  message?: string
}

export function UpgradeModal({
  open,
  onOpenChange,
  feature,
  currentCount,
  limit,
  message,
}: UpgradeModalProps) {
  const router = useRouter()

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push('/dashboard/pricing')
  }

  const featureName = feature ? FEATURE_NAMES[feature] : 'This feature'

  const defaultMessage =
    message ||
    (typeof limit === 'number'
      ? `You've reached your ${featureName} limit (${limit}) on the Free plan.`
      : `${featureName} is not available on the Free plan.`)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-50 rounded-full">
              <Crown className="h-6 w-6 text-[#2175C7]" />
            </div>
            <DialogTitle className="text-xl text-gray-900">Upgrade to Pro</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-1 text-gray-600">
            {defaultMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-5">
          {/* Benefits List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
              <Star className="h-4 w-4 text-[#2175C7] fill-current" />
              Pro Plan Benefits
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#66BB6A] shrink-0" />
                <span className="text-sm text-gray-600">Unlimited products, sales, and suppliers</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#66BB6A] shrink-0" />
                <span className="text-sm text-gray-600">Multiple branches and staff management</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#66BB6A] shrink-0" />
                <span className="text-sm text-gray-600">Advanced reports and analytics</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#66BB6A] shrink-0" />
                <span className="text-sm text-gray-600">Priority support and updates</span>
              </li>
            </ul>
          </div>

          {/* Usage Stats if applicable */}
          {typeof currentCount === 'number' && typeof limit === 'number' && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 font-medium">Current Usage</span>
                <span className="font-bold text-gray-900">{currentCount} / {limit}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#2175C7] rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min((currentCount / limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-[#2175C7] hover:bg-[#1a5c9e] text-white"
          >
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
