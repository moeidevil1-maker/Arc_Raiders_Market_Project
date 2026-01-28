import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!OMISE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Required Environment Variables are missing')
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const { chargeId, userId } = await req.json()

        if (!chargeId) throw new Error('Charge ID is required')

        console.log(`Checking status for Charge: ${chargeId}`)

        // 1. Fetch charge status from Omise
        const chargeResponse = await fetch(`https://api.omise.co/charges/${chargeId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(OMISE_SECRET_KEY + ':')}`,
            }
        })

        const charge = await chargeResponse.json()
        if (charge.object === 'error') throw new Error(`Omise Error: ${charge.message}`)

        console.log(`Omise Status for ${chargeId}: ${charge.status}`)

        let localStatus = 'pending'
        let creditsToRecord = 0

        // 2. If successful, check if it's already in our database
        if (charge.status === 'successful') {
            const { data: tx, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('ref_no', chargeId)
                .maybeSingle()

            if (tx) {
                console.log(`Charge ${chargeId} already recorded in database.`)
                localStatus = 'recorded'
                creditsToRecord = tx.credits
            } else {
                console.log(`Charge ${chargeId} is successful but NOT yet in database. (Webhook might be slow)`)
                localStatus = 'successful_sync_needed'

                // Optional: We could trigger the sync here if we wanted to be proactive
                // but usually we can just tell the frontend to wait or wait for webhook.
                // For better UX, let's determine the credits based on amount
                const amount = Number(charge.metadata?.amount || charge.amount / 100)
                if (amount === 50) creditsToRecord = 55
                else if (amount === 100) creditsToRecord = 125
                else if (amount === 200) creditsToRecord = 270
            }
        } else if (charge.status === 'expired' || charge.status === 'failed') {
            localStatus = 'failed'
        }

        return new Response(
            JSON.stringify({
                id: charge.id,
                status: charge.status, // successful, pending, expired, failed
                localStatus: localStatus,
                amount: charge.amount / 100,
                credits: creditsToRecord,
                failure_code: charge.failure_code,
                failure_message: charge.failure_message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('VERIFY ERROR:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
