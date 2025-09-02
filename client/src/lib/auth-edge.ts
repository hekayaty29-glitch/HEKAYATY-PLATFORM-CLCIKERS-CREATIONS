import { supabaseClient } from './supabase-client'
import { User } from '@supabase/supabase-js'

export class AuthService {
  // Register with profile creation
  async register(email: string, password: string, username: string, fullName: string) {
    // Create auth user
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName
        }
      }
    })

    if (authError) throw authError

    // Create profile (handled by database trigger or manually)
    if (authData.user) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert({
          id: authData.user.id,
          username,
          full_name: fullName,
          email,
          role: 'free',
          is_premium: false
        })

      if (profileError && !profileError.message.includes('duplicate')) {
        throw profileError
      }
    }

    return authData
  }

  // Login
  async login(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Get profile data
    if (data.user) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      return { ...data, profile }
    }

    return data
  }

  // Google OAuth
  async loginWithGoogle() {
    return supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  // Logout
  async logout() {
    return supabaseClient.auth.signOut()
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabaseClient.auth.getUser()
    return user
  }

  // Get current session
  async getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession()
    return session
  }

  // Subscribe to auth changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabaseClient.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }

  // Password reset
  async resetPassword(email: string) {
    return supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
  }

  // Update password
  async updatePassword(newPassword: string) {
    return supabaseClient.auth.updateUser({
      password: newPassword
    })
  }

  // VIP subscription management
  async redeemVipCode(code: string) {
    const { data, error } = await supabaseClient.functions.invoke('subscriptions', {
      body: { code },
      headers: { 'Content-Type': 'application/json' }
    })

    if (error) throw error
    return data
  }

  async getSubscriptionStatus() {
    const { data, error } = await supabaseClient.functions.invoke('subscriptions/status')
    if (error) throw error
    return data
  }
}

export const authService = new AuthService()
