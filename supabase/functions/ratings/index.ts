import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { requireAuth } from '../_shared/auth.ts'

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

    // GET /ratings/:storyId - Get story ratings
    if (method === 'GET' && pathSegments.length === 2) {
      const storyId = pathSegments[1]

      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          profiles!ratings_user_id_fkey(username, full_name, avatar_url)
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /ratings - Create/update rating
    if (method === 'POST' && pathSegments.length === 1) {
      const user = await requireAuth(req)
      const { storyId, rating, review } = await req.json()

      // Check if rating exists
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', user.id)
        .eq('story_id', storyId)
        .single()

      let data, error

      if (existingRating) {
        // Update existing rating
        const result = await supabase
          .from('ratings')
          .update({ rating, review, updated_at: new Date().toISOString() })
          .eq('id', existingRating.id)
          .select()
          .single()
        data = result.data
        error = result.error
      } else {
        // Create new rating
        const result = await supabase
          .from('ratings')
          .insert({
            user_id: user.id,
            story_id: storyId,
            rating,
            review,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        data = result.data
        error = result.error
      }

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
