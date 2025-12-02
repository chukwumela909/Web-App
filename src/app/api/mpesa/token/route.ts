import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const consumerKey = process.env.MPESA_CONSUMER_KEY
        const consumerSecret = process.env.MPESA_CONSUMER_SECRET
        const environment = process.env.MPESA_ENVIRONMENT || 'sandbox'

        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
        
        const url = environment === 'sandbox'
            ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
            },
        })

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error getting M-Pesa token:', error)
        return NextResponse.json(
            { error: 'Failed to get access token' },
            { status: 500 }
        )
    }
}
