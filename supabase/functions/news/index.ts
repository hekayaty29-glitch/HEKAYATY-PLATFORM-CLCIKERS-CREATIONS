import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify authentication
    const authResult = await verifyAuth(req, supabase)
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: authResult.error }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { user } = authResult
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)

    // GET /news - Get all news posts
    if (req.method === 'GET') {
      const type = url.searchParams.get('type') || 'main'
      
      const { data: news, error } = await supabase
        .from('news')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching news:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch news' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(news), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /news - Create news post (admin only)
    if (req.method === 'POST') {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const body = await req.json()
      const { title, content, type = 'main', cover_url } = body

      if (!title || !content) {
        return new Response(JSON.stringify({ error: 'Title and content are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: news, error } = await supabase
        .from('news')
        .insert({
          title,
          content,
          type,
          cover_url,
          author_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating news:', error)
        return new Response(JSON.stringify({ error: 'Failed to create news post' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(news), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /news/:id - Delete news post (admin only)
    if (req.method === 'DELETE' && pathSegments.length >= 2) {
      const newsId = pathSegments[1]

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', newsId)

      if (error) {
        console.error('Error deleting news:', error)
        return new Response(JSON.stringify({ error: 'Failed to delete news post' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
