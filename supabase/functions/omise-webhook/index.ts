import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Enhanced Webhook with strict logging
serve(async (req) => {
    try {
        // 0. Check for necessary ENV variables immediately
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error('CRITICAL ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from Deno.env')
            console.log('Available env keys:', Object.keys(Deno.env.toObject()))
        }

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        const body = await req.json()
        console.log('--- [START] Webhook Event Received ---')
        console.log('Event Type:', body.key)

        if (body.key === 'charge.complete' && body.data.status === 'successful') {
            const charge = body.data
            const metadata = charge.metadata || {}
            console.log('--- [DEBUG] Full Metadata received from Omise:', JSON.stringify(metadata))

            const userId = metadata.userId || metadata.user_id
            const amount = Number(metadata.amount)
            const orderNo = metadata.orderId || metadata.order_id || metadata.order_no

            console.log(`[CHARGE SUCCESSFUL] ID: ${charge.id} | User: ${userId} | OrderNo: ${orderNo} | Amount: ${amount}`)

            if (!userId) {
                console.error('[FAIL] No UserID found in charge metadata. Webhook cannot proceed.')
                console.log('Available keys in metadata:', Object.keys(metadata))
                return new Response(JSON.stringify({ error: 'No UserID in metadata' }), { status: 400 })
            }

            // Determine credits
            let creditsToAdd = 0
            if (amount === 50) creditsToAdd = 55
            else if (amount === 100) creditsToAdd = 125
            else if (amount === 200) creditsToAdd = 270

            if (creditsToAdd > 0) {
                console.log(`[PROCESSING] Adding ${creditsToAdd} credits to user ${userId}...`)

                // 1. Check for existing transaction (Idempotency)
                const { data: existingTx, error: checkError } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('ref_no', charge.id)
                    .maybeSingle()

                if (checkError) {
                    console.error('[DB ERROR] Checking for existing transaction failed:', checkError.message)
                }

                if (existingTx) {
                    console.log(`[SKIP] Charge ID ${charge.id} has already been processed. Skipping credit update.`)
                    return new Response(JSON.stringify({ success: true, message: 'Already processed' }), {
                        headers: { 'Content-Type': 'application/json' },
                        status: 200,
                    })
                }

                // 2. Fetch current balance
                const { data: profile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single()

                if (fetchError) {
                    console.error('[DB ERROR] Fetching profile failed:', fetchError.message)
                    throw fetchError
                }

                const currentBalance = profile?.credits || 0
                const newBalance = currentBalance + creditsToAdd

                // 2. Update credits
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ credits: newBalance })
                    .eq('id', userId)

                if (updateError) {
                    console.error('[DB ERROR] Updating credits failed:', updateError.message)
                    throw updateError
                }
                console.log(`[DB SUCCESS] Updated balance: ${currentBalance} -> ${newBalance}`)

                // 3. Insert transaction history
                const { error: txError } = await supabase
                    .from('transactions')
                    .insert({
                        user_id: userId,
                        amount: amount,
                        credits: creditsToAdd,
                        ref_no: charge.id,
                        order_no: orderNo, // Updated to use the variable with fallback
                        status: 'completed'
                    })

                if (txError) {
                    console.error('[DB ERROR] Inserting history failed (non-critical):', txError.message)
                } else {
                    console.log(`[DB SUCCESS] Transaction record saved: ${charge.id}`)
                }

                console.log(`--- [FINISH] Successfully processed payment for ${userId} ---`)
            } else {
                console.warn(`[SKIP] Amount ฿${amount} does not match any package (50, 100, 200).`)
            }
        } else {
            console.log(`[SKIP] Event ${body.key} with status ${body.data?.status} is ignored.`)
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('--- [CRITICAL FAILURE] ---')
        console.error('Error Message:', (error as Error).message)
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
