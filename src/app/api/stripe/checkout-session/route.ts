import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createPendingSubscription } from '@/lib/subscription-service'
import { PLAN_PRICING, PlanType } from '@/lib/subscription-types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planType, userId, email } = body as {
      planType: PlanType
      userId: string
      email: string
    }

    if (!planType || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: planType, userId, email' },
        { status: 400 }
      )
    }

    // Get amount in cents (Stripe uses smallest currency unit)
    const amount = PLAN_PRICING[planType].USD
    const amountInCents = amount * 100

    const planName = planType === 'yearly' ? '1 Year Pro Plan' : '1 Month Pro Plan'

    // Create pending subscription in Firestore first
    const subscription = await createPendingSubscription({
      userId,
      email,
      planType,
      amount,
      currency: 'USD',
      phoneNumber: '', // Not needed for Stripe
    })

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `FahamPesa Pro - ${planName}`,
              description: planType === 'yearly' 
                ? 'Annual subscription with 2 months free' 
                : 'Monthly subscription',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        subscriptionId: subscription.id,
        userId,
        email,
        planType,
        amount: amount.toString(),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fahampesa.com'}/dashboard/subscription/success?plan=${planType}&amount=${amount}&currency=USD&subscriptionId=${subscription.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fahampesa.com'}/dashboard/subscription/checkout?plan=${planType}&currency=USD&cancelled=true`,
    })

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error('Stripe checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
