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
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react'
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
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {defaultMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Pro Plan Benefits
              </h3>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Unlimited products, sales, and suppliers
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Multiple branches and staff management
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Advanced reports and analytics
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Priority support and updates
                </span>
              </li>
            </ul>
          </div>

          {typeof currentCount === 'number' && typeof limit === 'number' && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Current Usage:
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {currentCount} / {limit}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
