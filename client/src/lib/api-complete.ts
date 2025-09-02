import { supabase } from './supabase'

// Complete API client for all Supabase Edge Functions
export class EdgeFunctionAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${response.status}: ${error}`)
    }

    return response.json()
  }

  // Auth API
  async register(data: any) {
    return this.makeRequest('/auth', { method: 'POST', body: JSON.stringify(data) })
  }

  async login(data: any) {
    return this.makeRequest('/auth', { method: 'POST', body: JSON.stringify(data) })
  }

  async logout() {
    return this.makeRequest('/auth', { method: 'DELETE' })
  }

  async getProfile() {
    return this.makeRequest('/auth')
  }

  // Stories API
  async getStories(params?: any) {
    const searchParams = new URLSearchParams(params)
    return this.makeRequest(`/stories?${searchParams}`)
  }

  async getStory(id: string) {
    return this.makeRequest(`/stories/${id}`)
  }

  async createStory(data: any) {
    return this.makeRequest('/stories', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateStory(id: string, data: any) {
    return this.makeRequest(`/stories/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteStory(id: string) {
    return this.makeRequest(`/stories/${id}`, { method: 'DELETE' })
  }

  // Comics API
  async getComics(params?: any) {
    const searchParams = new URLSearchParams(params)
    return this.makeRequest(`/comics?${searchParams}`)
  }

  async getComic(id: string) {
    return this.makeRequest(`/comics/${id}`)
  }

  async createComic(data: any) {
    return this.makeRequest('/comics', { method: 'POST', body: JSON.stringify(data) })
  }

  // Chapters API
  async getChapters(storyId: string) {
    return this.makeRequest(`/chapters?story_id=${storyId}`)
  }

  async createChapter(data: any) {
    return this.makeRequest('/chapters', { method: 'POST', body: JSON.stringify(data) })
  }

  // Ratings API
  async getRatings(storyId: string) {
    return this.makeRequest(`/ratings?story_id=${storyId}`)
  }

  async createRating(data: any) {
    return this.makeRequest('/ratings', { method: 'POST', body: JSON.stringify(data) })
  }

  // Bookmarks API
  async getBookmarks() {
    return this.makeRequest('/bookmarks')
  }

  async addBookmark(storyId: string) {
    return this.makeRequest('/bookmarks', { method: 'POST', body: JSON.stringify({ story_id: storyId }) })
  }

  async removeBookmark(storyId: string) {
    return this.makeRequest('/bookmarks', { method: 'DELETE', body: JSON.stringify({ story_id: storyId }) })
  }

  // Admin API
  async getAdminStats() {
    return this.makeRequest('/admin')
  }

  async getUsers(params?: any) {
    const searchParams = new URLSearchParams(params)
    return this.makeRequest(`/admin?${searchParams}`)
  }

  async banUser(userId: string) {
    return this.makeRequest('/admin', { method: 'PUT', body: JSON.stringify({ action: 'ban', userId }) })
  }

  async unbanUser(userId: string) {
    return this.makeRequest('/admin', { method: 'PUT', body: JSON.stringify({ action: 'unban', userId }) })
  }

  async updateUserRole(userId: string, role: string) {
    return this.makeRequest('/admin', { method: 'PUT', body: JSON.stringify({ action: 'role', userId, role }) })
  }

  // Subscriptions API
  async getSubscriptionStatus() {
    return this.makeRequest('/subscriptions')
  }

  async generateVipCode(data: any) {
    return this.makeRequest('/subscriptions', { method: 'POST', body: JSON.stringify(data) })
  }

  async redeemVipCode(code: string) {
    return this.makeRequest('/subscriptions', { method: 'PUT', body: JSON.stringify({ code }) })
  }

  // Community API
  async getWorkshops(params?: any) {
    const searchParams = new URLSearchParams(params)
    return this.makeRequest(`/community?${searchParams}`)
  }

  async createWorkshop(data: any) {
    return this.makeRequest('/community', { method: 'POST', body: JSON.stringify(data) })
  }

  // Hall of Quills API
  async getLeaderboard() {
    return this.makeRequest('/hall-of-quills')
  }

  async getCompetitions() {
    return this.makeRequest('/hall-of-quills?type=competitions')
  }

  async createCompetition(data: any) {
    return this.makeRequest('/hall-of-quills', { method: 'POST', body: JSON.stringify(data) })
  }

  // NEW COMPLETE FEATURE APIs

  // Profiles API
  async getUserProfile(id: string) {
    return this.makeRequest(`/profiles/${id}`)
  }

  async updateProfile(id: string, data: any) {
    return this.makeRequest(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async upgradeToPremium(id: string) {
    return this.makeRequest(`/profiles/${id}/premium`, { method: 'POST' })
  }

  // Characters API
  async getCharacters() {
    return this.makeRequest('/characters')
  }

  async getCharacter(id: string) {
    return this.makeRequest(`/characters/${id}`)
  }

  async createCharacter(data: any) {
    return this.makeRequest('/characters', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateCharacter(id: string, data: any) {
    return this.makeRequest(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteCharacter(id: string) {
    return this.makeRequest(`/characters/${id}`, { method: 'DELETE' })
  }

  // Genres API
  async getGenres() {
    return this.makeRequest('/genres')
  }

  async createGenre(data: any) {
    return this.makeRequest('/genres', { method: 'POST', body: JSON.stringify(data) })
  }

  // Search API
  async search(query: string, type?: string) {
    return this.makeRequest(`/search?q=${encodeURIComponent(query)}&type=${type || 'all'}`)
  }

  // Projects API (TaleCraft)
  async getProjects(authorId?: string) {
    return this.makeRequest(`/projects${authorId ? `?authorId=${authorId}` : ''}`)
  }

  async getProject(id: string) {
    return this.makeRequest(`/projects/${id}`)
  }

  async createProject(data: any) {
    return this.makeRequest('/projects', { method: 'POST', body: JSON.stringify(data) })
  }

  async updateProject(id: string, data: any) {
    return this.makeRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async deleteProject(id: string) {
    return this.makeRequest(`/projects/${id}`, { method: 'DELETE' })
  }

  // Creators API
  async getTopCreators(limit?: number) {
    return this.makeRequest(`/creators/top${limit ? `?limit=${limit}` : ''}`)
  }

  async getCreators(params?: any) {
    const searchParams = new URLSearchParams(params)
    return this.makeRequest(`/creators?${searchParams}`)
  }

  // Analytics API (Admin only)
  async getDashboardAnalytics() {
    return this.makeRequest('/analytics/dashboard')
  }

  async getMetrics(period?: number) {
    return this.makeRequest(`/analytics/metrics${period ? `?period=${period}` : ''}`)
  }

  // Security API (Admin only)
  async getAuditLogs(params?: any) {
    const searchParams = new URLSearchParams(params)
    return this.makeRequest(`/security/audit-logs?${searchParams}`)
  }

  async logSecurityAction(data: any) {
    return this.makeRequest('/security/audit-logs', { method: 'POST', body: JSON.stringify(data) })
  }

  async getSuspiciousActivity(hours?: number) {
    return this.makeRequest(`/security/suspicious-activity${hours ? `?hours=${hours}` : ''}`)
  }

  async getIPMonitoring() {
    return this.makeRequest('/security/ip-monitoring')
  }

  // Notifications API
  async getNotifications(unreadOnly?: boolean) {
    return this.makeRequest(`/notifications${unreadOnly ? '?unread=true' : ''}`)
  }

  async markNotificationRead(id: string) {
    return this.makeRequest(`/notifications/${id}/read`, { method: 'PUT' })
  }

  async createNotification(data: any) {
    return this.makeRequest('/notifications', { method: 'POST', body: JSON.stringify(data) })
  }

  // Featured Content API
  async getFeaturedContent(type?: string, limit?: number) {
    return this.makeRequest(`/featured?type=${type || 'all'}&limit=${limit || 10}`)
  }

  async featureContent(type: string, id: string) {
    return this.makeRequest(`/featured/${type}/${id}`, { method: 'POST' })
  }

  async unfeatureContent(type: string, id: string) {
    return this.makeRequest(`/featured/${type}/${id}`, { method: 'DELETE' })
  }

  // File Upload with FormData
  async uploadFile(file: File, folder?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (folder) formData.append('folder', folder)

    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {}
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${response.status}: ${error}`)
    }

    return response.json()
  }
}

export const api = new EdgeFunctionAPI()
