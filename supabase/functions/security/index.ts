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

    await requireAdmin(req)

    // GET /security/audit-logs - Get audit logs
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'audit-logs') {
      const { searchParams } = url
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /security/audit-logs - Create audit log
    if (method === 'POST' && pathSegments.length === 2 && pathSegments[1] === 'audit-logs') {
      const body = await req.json()

      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          ...body,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /security/suspicious-activity - Monitor suspicious activity
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'suspicious-activity') {
      const { searchParams } = url
      const hours = parseInt(searchParams.get('hours') || '24')

      const dateFrom = new Date()
      dateFrom.setHours(dateFrom.getHours() - hours)

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', dateFrom.toISOString())
        .in('action', ['failed_login', 'account_locked', 'suspicious_upload'])
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /security/ip-monitoring - Monitor IP addresses
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'ip-monitoring') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('ip_address, action, created_at, user_id')
        .not('ip_address', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Group by IP for analysis
      const ipStats = data?.reduce((acc: any, log: any) => {
        if (!acc[log.ip_address]) {
          acc[log.ip_address] = {
            ip: log.ip_address,
            actions: [],
            last_seen: log.created_at,
            user_count: new Set()
          }
        }
        acc[log.ip_address].actions.push(log.action)
        acc[log.ip_address].user_count.add(log.user_id)
        return acc
      }, {})

      const result = Object.values(ipStats || {}).map((stat: any) => ({
        ...stat,
        user_count: stat.user_count.size,
        action_count: stat.actions.length,
        suspicious_score: stat.actions.filter((a: string) => 
          a.includes('failed') || a.includes('suspicious')).length
      }))

      return new Response(JSON.stringify(result), {
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
