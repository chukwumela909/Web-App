import { NextRequest, NextResponse } from 'next/server'
import { createPendingSubscription } from '@/lib/subscription-service'
import { PlanType, Currency, PLAN_PRICING } from '@/lib/subscription-types'

export async function POST(request: NextRequest) {
    try {
        const { 
            phoneNumber, 
            amount, 
            accountReference, 
            transactionDesc,
            // New subscription fields
            userId,
            email,
            planType,
            currency 
        } = await request.json()

        // Validate inputs
        if (!phoneNumber || !amount) {
            return NextResponse.json(
                { error: 'Phone number and amount are required' },
                { status: 400 }
            )
        }

        // Get access token
        const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mpesa/token`)
        const tokenData = await tokenResponse.json()

        if (!tokenData.access_token) {
            throw new Error('Failed to get access token')
        }

        const accessToken = tokenData.access_token
        const environment = process.env.MPESA_ENVIRONMENT || 'sandbox'
        const shortcode = process.env.MPESA_SHORTCODE || '174379'
        const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'

        // Generate timestamp
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
        
        // Generate password
        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

        // Format phone number (remove + and spaces)
        const formattedPhone = phoneNumber.replace(/\+/g, '').replace(/\s/g, '')

        const url = environment === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

        const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mpesa/callback`

        const stkPushData = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount), // Ensure it's an integer
            PartyA: formattedPhone,
            PartyB: shortcode,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: accountReference || 'FahamPesa',
            TransactionDesc: transactionDesc || 'Subscription Payment',
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(stkPushData),
        })

        const data = await response.json()

        // If STK push was initiated successfully, create a pending subscription
        if (data.ResponseCode === '0' && userId && email && planType) {
            try {
                const subscription = await createPendingSubscription({
                    userId,
                    email,
                    planType: planType as PlanType,
                    amount: Math.round(amount),
                    currency: (currency || 'KSH') as Currency,
                    phoneNumber: formattedPhone,
                    checkoutRequestId: data.CheckoutRequestID,
                })
                
                console.log('Pending subscription created:', subscription.id)
                
                // Return subscription ID with the response
                return NextResponse.json({
                    ...data,
                    subscriptionId: subscription.id,
                })
            } catch (subError) {
                console.error('Error creating pending subscription:', subError)
                // Still return the STK push response even if subscription creation fails
                return NextResponse.json(data)
            }
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error initiating STK push:', error)
        return NextResponse.json(
            { error: 'Failed to initiate payment' },
            { status: 500 }
        )
    }
}
