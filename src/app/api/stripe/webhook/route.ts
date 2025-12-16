import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { activateSubscription, updateSubscriptionStatus } from '@/lib/subscription-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    console.log('Stripe webhook event:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Get metadata from session
        const { subscriptionId, userId, email, planType, amount } = session.metadata || {}

        if (!subscriptionId) {
          console.error('No subscriptionId in session metadata')
          return NextResponse.json({ received: true })
        }

        // Payment was successful, activate the subscription
        const paymentIntentId = session.payment_intent as string
        const transactionId = `STRIPE-${paymentIntentId || session.id}`

        console.log(`Activating subscription ${subscriptionId} with transaction ${transactionId}`)

        try {
          await activateSubscription(subscriptionId, transactionId)
          console.log(`Subscription ${subscriptionId} activated successfully`)
        } catch (error) {
          console.error('Error activating subscription:', error)
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const { subscriptionId } = session.metadata || {}

        if (subscriptionId) {
          console.log(`Checkout session expired for subscription ${subscriptionId}`)
          try {
            await updateSubscriptionStatus(subscriptionId, 'failed')
          } catch (error) {
            console.error('Error updating subscription status:', error)
          }
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment failed:', paymentIntent.id)
        // The subscription status will be handled by checkout.session.expired
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing for webhook (we need raw body for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
}
