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

    // GET /stories/special - Get special stories
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'special') {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Stories/special error:', error)
        return new Response(JSON.stringify({ error: error.message, data: [] }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories/gems - Get gem stories
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'gems') {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_published', true)
        // .eq('placement', 'gems') // Remove placement filter to show all published stories
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories/workshops - Get workshop stories
    if (method === 'GET' && pathSegments.length === 2 && pathSegments[1] === 'workshops') {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('is_published', true)
        // .eq('placement', 'workshops') // Remove placement filter to show all published stories
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories - List stories with filters
    if (method === 'GET' && pathSegments.length === 1) {
      const { searchParams } = url
      const genre = searchParams.get('genre')
      const author = searchParams.get('author')
      const premium = searchParams.get('premium')
      const shortStory = searchParams.get('shortStory')
      const limit = parseInt(searchParams.get('limit') || '20')
      const offset = parseInt(searchParams.get('offset') || '0')

      let query = supabase
        .from('stories')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Remove broken filters that reference non-existent joins
      // if (genre) query = query.eq('genres.name', genre)
      // if (author) query = query.eq('profiles.username', author)
      if (premium) query = query.eq('is_premium', premium === 'true')
      if (shortStory) query = query.eq('is_short_story', shortStory === 'true')

      const { data, error } = await query
      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories/:id/chapters - Get story chapters
    if (method === 'GET' && pathSegments.length === 3 && pathSegments[2] === 'chapters') {
      const storyId = pathSegments[1]
      
      // Fetch chapters from story_chapters table
      const { data, error } = await supabase
        .from('story_chapters')
        .select('*')
        .eq('story_id', storyId)
        .order('chapter_order', { ascending: true })

      if (error) {
        console.error('Error fetching chapters:', error)
        return new Response(JSON.stringify({ chapters: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ chapters: data || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories/:id/ratings - Get story ratings
    if (method === 'GET' && pathSegments.length === 3 && pathSegments[2] === 'ratings') {
      const storyId = pathSegments[1]
      
      // Return empty ratings array since table doesn't exist yet
      const data = []

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /stories/:id/chapters - Upload chapters
    if (method === 'POST' && pathSegments.length === 3 && pathSegments[2] === 'chapters') {
      const user = await requireAuth(req)
      const storyId = pathSegments[1]
      
      // Check ownership
      const { data: story } = await supabase
        .from('stories')
        .select('author_id')
        .eq('id', storyId)
        .single()

      if (story?.author_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const formData = await req.formData()
      const chapters = formData.getAll('chapters') as File[]
      const chapterNames = formData.getAll('chapterNames') as string[]
      const chapterOrders = formData.getAll('chapterOrders') as string[]

      // Upload each chapter file and create database entries
      const uploadedChapters = []
      
      for (let i = 0; i < chapters.length; i++) {
        const file = chapters[i]
        const name = chapterNames[i]
        const order = parseInt(chapterOrders[i])

        // Upload file to Cloudinary via upload function
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('folder', 'chapters')

        const uploadResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/upload`, {
          method: 'POST',
          headers: {
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: uploadFormData
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload chapter ${name}`)
        }

        const uploadResult = await uploadResponse.json()
        
        // Create chapter record
        const { data: chapter, error: chapterError } = await supabase
          .from('story_chapters')
          .insert({
            story_id: storyId,
            chapter_title: name,
            chapter_order: order,
            content_url: uploadResult.url,
            content_type: file.type.includes('pdf') ? 'pdf' : 'text',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (chapterError) throw chapterError
        uploadedChapters.push(chapter)
      }

      return new Response(JSON.stringify({ chapters: uploadedChapters }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /stories/:id/rate - Rate story
    if (method === 'POST' && pathSegments.length === 3 && pathSegments[2] === 'rate') {
      const storyId = pathSegments[1]
      
      return new Response(JSON.stringify({ success: true, message: 'Rating not implemented yet' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /stories/:id/bookmark - Bookmark story
    if (method === 'POST' && pathSegments.length === 3 && pathSegments[2] === 'bookmark') {
      const storyId = pathSegments[1]
      
      return new Response(JSON.stringify({ success: true, message: 'Bookmark not implemented yet' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /stories/:id/bookmark - Remove bookmark
    if (method === 'DELETE' && pathSegments.length === 3 && pathSegments[2] === 'bookmark') {
      const storyId = pathSegments[1]
      
      return new Response(JSON.stringify({ success: true, message: 'Bookmark removal not implemented yet' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /stories/:id - Get single story
    if (method === 'GET' && pathSegments.length === 2) {
      const storyId = pathSegments[1]
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /stories/create-with-chapters - Create story with chapters
    if (method === 'POST' && pathSegments.length === 2 && pathSegments[1] === 'create-with-chapters') {
      const user = await requireAuth(req)
      const storyData = await req.json()

      // Create the story first
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: storyData.title,
          description: storyData.description,
          cover_image: storyData.coverImage,
          placement: storyData.placement,
          author_name: storyData.authorName,
          genre: storyData.genre,
          collaborators: storyData.collaborators,
          is_premium: storyData.isPremium,
          is_published: storyData.isPublished,
          author_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (storyError) throw storyError

      return new Response(JSON.stringify({ storyId: story.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /stories/:id/publish - Publish story
    if (method === 'PUT' && pathSegments.length === 3 && pathSegments[2] === 'publish') {
      const user = await requireAuth(req)
      const storyId = pathSegments[1]
      const body = await req.json()

      // Check ownership
      const { data: story } = await supabase
        .from('stories')
        .select('author_id')
        .eq('id', storyId)
        .single()

      if (story?.author_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = {
        is_published: true,
        updated_at: new Date().toISOString()
      }

      if (body.publish_at) {
        updateData.publish_at = body.publish_at
      }

      const { data, error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /stories - Create new story
    if (method === 'POST' && pathSegments.length === 1) {
      const user = await requireAuth(req)
      
      // Handle both JSON and FormData
      let storyData: any = {}
      let pdfFile: File | null = null
      
      const contentType = req.headers.get('content-type')
      
      if (contentType?.includes('multipart/form-data')) {
        const formData = await req.formData()
        
        storyData = {
          title: formData.get('title'),
          description: formData.get('description'),
          content: formData.get('content'),
          coverImage: formData.get('coverImage'),
          isShortStory: formData.get('isShortStory') === 'true',
          isPremium: formData.get('isPremium') === 'true',
          genreIds: formData.get('genreIds')
        }
        
        pdfFile = formData.get('pdfFile') as File
      } else {
        storyData = await req.json()
      }

      // If PDF file is provided, upload to Cloudinary and set content
      let pdfUrl = null
      if (pdfFile) {
        // For now, just set a placeholder - you'll need to implement Cloudinary upload
        pdfUrl = 'PDF_UPLOAD_PLACEHOLDER'
        storyData.content = `[PDF_CHAPTER:${pdfUrl}]`
      }

      const { data, error } = await supabase
        .from('stories')
        .insert({
          ...storyData,
          author_id: user.id,
          pdf_url: pdfUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PUT /stories/:id - Update story
    if (method === 'PUT' && pathSegments.length === 2) {
      const user = await requireAuth(req)
      const storyId = pathSegments[1]
      const body = await req.json()

      // Check ownership
      const { data: story } = await supabase
        .from('stories')
        .select('author_id')
        .eq('id', storyId)
        .single()

      if (story?.author_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data, error } = await supabase
        .from('stories')
        .update({
          ...body,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select()
        .single()

      if (error) throw error

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /stories/:id - Delete story
    if (method === 'DELETE' && pathSegments.length === 2) {
      const user = await requireAuth(req)
      const storyId = pathSegments[1]

      // Check ownership
      const { data: story } = await supabase
        .from('stories')
        .select('author_id')
        .eq('id', storyId)
        .single()

      if (story?.author_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
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
