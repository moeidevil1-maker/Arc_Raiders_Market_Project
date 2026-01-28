import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const OMISE_SECRET_KEY = Deno.env.get('OMISE_SECRET_KEY')
        if (!OMISE_SECRET_KEY) {
            throw new Error('OMISE_SECRET_KEY is missing')
        }

        const { amount, userId, email, packageLabel, orderId } = await req.json()
        console.log(`Processing charge for user ${userId} (${email}) - Order: ${orderId}`)

        // 1. Create Source (PromptPay) - Use JSON
        const sourceResponse = await fetch('https://api.omise.co/sources', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(OMISE_SECRET_KEY + ':')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100),
                currency: 'thb',
                type: 'promptpay',
            }),
        })

        const source = await sourceResponse.json()
        if (source.object === 'error') throw new Error(`Omise Source: ${source.message}`)

        // 2. Create Charge - Use JSON (Fixes Metadata error)
        const chargeResponse = await fetch('https://api.omise.co/charges', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(OMISE_SECRET_KEY + ':')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(amount * 100),
                currency: 'thb',
                source: source.id,
                description: `Top-up: ${packageLabel} for ${email}`,
                metadata: { userId, amount, orderId, order_no: orderId } // Send both for compatibility
            }),
        })

        const charge = await chargeResponse.json()
        if (charge.object === 'error') throw new Error(`Omise Charge: ${charge.message}`)

        console.log(`Charge created: ${charge.id}`)

        return new Response(
            JSON.stringify({
                id: charge.id,
                qr_code: charge.source.scannable_code?.image?.download_uri || charge.source.scannable_code?.image?.url
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('SERVER ERROR:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
