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

    // GET /hall-of-quills/active - Most active writers
    if (method === 'GET' && pathSegments[0] === 'active') {
      const limit = parseInt(url.searchParams.get('limit') || '3')

      const { data: stories, error } = await supabase
        .from('stories')
        .select('author_id')
        .eq('is_published', true)

      if (error) throw error

      // Count stories per author
      const authorCounts = stories.reduce((acc: Record<string, number>, story) => {
        acc[story.author_id] = (acc[story.author_id] || 0) + 1
        return acc
      }, {})

      // Get top authors
      const topAuthors = Object.entries(authorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)

      const writers = await Promise.all(
        topAuthors.map(async ([authorId, count]) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', authorId)
            .single()

          return {
            id: profile?.id,
            name: profile?.username || 'Unknown',
            title: profile?.full_name || 'Writer',
            avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'A'}`,
            stories: count
          }
        })
      )

      return new Response(JSON.stringify(writers), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /hall-of-quills/competitions - List competitions
    if (method === 'GET' && pathSegments[0] === 'competitions') {
      const { data, error } = await supabase
        .from('hall_competitions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /hall-of-quills/competitions - Add competition (admin only)
    if (method === 'POST' && pathSegments[0] === 'competitions') {
      await requireAdmin(req)
      
      const { name, winnerName, storyTitle, winnerId } = await req.json()

      const { data, error } = await supabase
        .from('hall_competitions')
        .insert({
          name,
          winner_name: winnerName,
          story_title: storyTitle,
          winner_id: winnerId || null,
          created_at: new Date().toISOString()
        })
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
