import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
    try {
        const body = await req.json()
        console.log('Webhook Event:', body.key)
        console.log('Webhook Data Status:', body.data?.status)

        if (body.key === 'charge.complete' && body.data.status === 'successful') {
            const charge = body.data
            const metadata = charge.metadata
            const userId = metadata.userId
            const amount = metadata.amount

            console.log(`Processing successful charge for User: ${userId}, Amount: ${amount}`)

            if (!userId) {
                console.error('No UserID found in charge metadata')
                throw new Error('No UserID in metadata')
            }

            let creditsToAdd = 0
            if (amount === 50) creditsToAdd = 55
            else if (amount === 100) creditsToAdd = 125
            else if (amount === 200) creditsToAdd = 270

            if (creditsToAdd > 0) {
                console.log(`Adding ${creditsToAdd} credits to user ${userId}...`)

                const { data: profile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single()

                if (fetchError) {
                    console.error('Error fetching profile:', fetchError.message)
                    throw fetchError
                }

                const newBalance = (profile?.credits || 0) + creditsToAdd

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ credits: newBalance })
                    .eq('id', userId)

                if (updateError) {
                    console.error('Error updating credits:', updateError.message)
                    throw updateError
                }

                console.log(`SUCCESS: Added ${creditsToAdd} credits. New balance: ${newBalance}`)
            } else {
                console.warn(`Amount ${amount} does not match any known package. No credits added.`)
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Webhook processing failed:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
