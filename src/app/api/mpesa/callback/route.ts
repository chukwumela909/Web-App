/**
 * M-Pesa Callback Handler
 * Receives payment confirmation from Safaricom and activates subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  findSubscriptionByCheckoutRequestId,
  activateSubscription,
  markSubscriptionFailed,
} from '@/lib/subscription-service'
import { MpesaCallbackBody, MpesaCallbackMetadata } from '@/lib/subscription-types'

export async function POST(request: NextRequest) {
  try {
    const body: MpesaCallbackBody = await request.json()
    
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2))
    
    const { stkCallback } = body.Body
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback
    
    // Find the pending subscription by CheckoutRequestID
    const subscription = await findSubscriptionByCheckoutRequestId(CheckoutRequestID)
    
    if (!subscription) {
      console.error('Subscription not found for CheckoutRequestID:', CheckoutRequestID)
      // Still return 200 to acknowledge receipt
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Callback received but subscription not found',
      })
    }
    
    // Check if payment was successful
    if (ResultCode === 0) {
      // Payment successful - extract metadata
      const metadata = extractCallbackMetadata(CallbackMetadata)
      
      if (metadata) {
        // Activate the subscription
        await activateSubscription(subscription.id, metadata.mpesaReceiptNumber)
        
        console.log('Subscription activated:', {
          subscriptionId: subscription.id,
          transactionId: metadata.mpesaReceiptNumber,
          amount: metadata.amount,
        })
      } else {
        // Activate without receipt number if metadata parsing fails
        await activateSubscription(subscription.id, `MPESA-${CheckoutRequestID}`)
      }
      
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Subscription activated successfully',
      })
    } else {
      // Payment failed
      await markSubscriptionFailed(subscription.id, ResultDesc)
      
      console.log('Payment failed:', {
        subscriptionId: subscription.id,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
      })
      
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Payment failure recorded',
      })
    }
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error)
    
    // Still return 200 to prevent Safaricom from retrying
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Error processing callback',
    })
  }
}

/**
 * Extract metadata from M-Pesa callback
 */
function extractCallbackMetadata(
  callbackMetadata?: { Item: Array<{ Name: string; Value: string | number }> }
): MpesaCallbackMetadata | null {
  if (!callbackMetadata?.Item) {
    return null
  }
  
  const metadata: Partial<MpesaCallbackMetadata> = {}
  
  for (const item of callbackMetadata.Item) {
    switch (item.Name) {
      case 'Amount':
        metadata.amount = Number(item.Value)
        break
      case 'MpesaReceiptNumber':
        metadata.mpesaReceiptNumber = String(item.Value)
        break
      case 'TransactionDate':
        metadata.transactionDate = String(item.Value)
        break
      case 'PhoneNumber':
        metadata.phoneNumber = String(item.Value)
        break
    }
  }
  
  if (metadata.mpesaReceiptNumber) {
    return metadata as MpesaCallbackMetadata
  }
  
  return null
}

// Also handle GET for testing/verification
export async function GET() {
  return NextResponse.json({
    status: 'M-Pesa callback endpoint is active',
    timestamp: new Date().toISOString(),
  })
}
