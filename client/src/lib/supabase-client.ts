import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Direct database operations for better performance
export class DirectDB {
  // Stories
  async getStories(filters?: { genre?: string; author?: string; premium?: boolean }) {
    let query = supabaseClient
      .from('stories')
      .select(`
        *,
        profiles!stories_author_id_fkey(username, full_name, avatar_url),
        genres(name, icon)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (filters?.genre) query = query.eq('genres.name', filters.genre)
    if (filters?.author) query = query.eq('profiles.username', filters.author)
    if (filters?.premium !== undefined) query = query.eq('is_premium', filters.premium)

    return query
  }

  async getStory(id: string) {
    return supabaseClient
      .from('stories')
      .select(`
        *,
        profiles!stories_author_id_fkey(username, full_name, avatar_url),
        story_chapters(*),
        genres(name, icon)
      `)
      .eq('id', id)
      .single()
  }

  async createStory(story: any) {
    return supabaseClient
      .from('stories')
      .insert(story)
      .select()
      .single()
  }

  // Comics
  async getComics() {
    return supabaseClient
      .from('comics')
      .select(`
        *,
        profiles!comics_author_id_fkey(username, full_name, avatar_url)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
  }

  // Ratings
  async getRatings(storyId: string) {
    return supabaseClient
      .from('ratings')
      .select(`
        *,
        profiles!ratings_user_id_fkey(username, full_name, avatar_url)
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: false })
  }

  async upsertRating(userId: string, storyId: string, rating: number, review?: string) {
    return supabaseClient
      .from('ratings')
      .upsert({
        user_id: userId,
        story_id: storyId,
        rating,
        review,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
  }

  // Bookmarks
  async getBookmarks(userId: string) {
    return supabaseClient
      .from('bookmarks')
      .select(`
        *,
        stories!bookmarks_story_id_fkey(
          *,
          profiles!stories_author_id_fkey(username, full_name, avatar_url)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  }

  async toggleBookmark(userId: string, storyId: string) {
    // Check if bookmark exists
    const { data: existing } = await supabaseClient
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .single()

    if (existing) {
      // Remove bookmark
      return supabaseClient
        .from('bookmarks')
        .delete()
        .eq('id', existing.id)
    } else {
      // Add bookmark
      return supabaseClient
        .from('bookmarks')
        .insert({
          user_id: userId,
          story_id: storyId
        })
        .select()
        .single()
    }
  }

  // Profiles
  async getProfile(userId: string) {
    return supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  }

  async updateProfile(userId: string, updates: any) {
    return supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
  }

  // Community
  async getWorkshops(userId?: string) {
    let query = supabaseClient
      .from('workshops')
      .select(`
        *,
        profiles!workshops_owner_id_fkey(username, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (userId) query = query.eq('owner_id', userId)
    return query
  }

  async createWorkshop(workshop: any) {
    return supabaseClient
      .from('workshops')
      .insert(workshop)
      .select()
      .single()
  }
}

export const directDB = new DirectDB()
