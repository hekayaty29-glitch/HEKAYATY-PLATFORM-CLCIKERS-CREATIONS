import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { requireAuth, requireAdmin } from '../_shared/auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Generate random VIP code
function generateVipCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // POST /subscriptions/generate-code - Generate free VIP code (admin only)
    if (method === 'POST' && pathSegments[0] === 'generate-code') {
      await requireAdmin(req)
      
      const { email, durationDays = 30 } = await req.json()
      const code = generateVipCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + durationDays)

      const { data, error } = await supabase
        .from('vip_codes')
        .insert({
          code,
          email,
          expires_at: expiresAt.toISOString(),
          is_used: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send email notification
      const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-vip-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: email,
          code,
          expiresAt: expiresAt.toISOString(),
          paid: false
        })
      })

      return new Response(JSON.stringify({ code: data, emailSent: emailResponse.ok }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /subscriptions/redeem - Redeem VIP code
    if (method === 'POST' && pathSegments[0] === 'redeem') {
      const user = await requireAuth(req)
      const { code } = await req.json()

      // Check if code exists and is valid
      const { data: vipCode, error: codeError } = await supabase
        .from('vip_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (codeError || !vipCode) {
        return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Mark code as used
      await supabase
        .from('vip_codes')
        .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() })
        .eq('id', vipCode.id)

      // Upgrade user to VIP
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'vip',
          is_premium: true,
          subscription_end_date: vipCode.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (profileError) throw profileError

      return new Response(JSON.stringify({ success: true, profile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /subscriptions/status - Check subscription status
    if (method === 'GET' && pathSegments[0] === 'status') {
      const user = await requireAuth(req)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, is_premium, subscription_end_date')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const isExpired = profile.subscription_end_date && 
        new Date(profile.subscription_end_date) < new Date()

      return new Response(JSON.stringify({
        role: profile.role,
        isPremium: profile.is_premium && !isExpired,
        expiresAt: profile.subscription_end_date,
        isExpired
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
