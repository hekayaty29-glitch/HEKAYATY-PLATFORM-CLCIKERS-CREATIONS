import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { requireAdmin } from '../_shared/auth.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // GET /admin/dashboard - Dashboard stats
    if (method === 'GET' && pathSegments[0] === 'dashboard') {
      await requireAdmin(req)

      const [usersCount, storiesCount, premiumCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('stories').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true)
      ])

      return new Response(JSON.stringify({
        totalUsers: usersCount.count || 0,
        totalStories: storiesCount.count || 0,
        premiumUsers: premiumCount.count || 0,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /admin/users - List users with pagination
    if (method === 'GET' && pathSegments[0] === 'users') {
      await requireAdmin(req)
      
      const { searchParams } = url
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /admin/users/:id/ban - Ban/unban user
    if (method === 'PUT' && pathSegments[0] === 'users' && pathSegments[2] === 'ban') {
      await requireAdmin(req)
      
      const userId = pathSegments[1]
      const { banned, reason } = await req.json()

      const { data, error } = await supabase
        .from('profiles')
        .update({
          is_banned: banned,
          ban_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: banned ? 'user_banned' : 'user_unbanned',
          details: { reason },
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          created_at: new Date().toISOString()
        })

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /admin/users/:id/role - Update user role
    if (method === 'PUT' && pathSegments[0] === 'users' && pathSegments[2] === 'role') {
      await requireAdmin(req)
      
      const userId = pathSegments[1]
      const { role } = await req.json()

      const { data, error } = await supabase
        .from('profiles')
        .update({
          role,
          is_premium: role === 'vip',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
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
