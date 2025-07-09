import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// For development: allow running without Supabase credentials
const isDevelopment = process.env.NODE_ENV === 'development'
const hasSupabaseCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-ref.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here'

if (!hasSupabaseCredentials && !isDevelopment) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Export configuration status
export const isSupabaseConfigured = hasSupabaseCredentials

// Create either a real or mock Supabase client
export const supabase = hasSupabaseCredentials 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Set the session to persist across browser sessions
        persistSession: true,
        // Automatically refresh the token before it expires
        autoRefreshToken: true,
        // Detect a session from the URL (for OAuth redirects)
        detectSessionInUrl: true,
        // Storage key for the session
        storageKey: 'tradeshare-auth-token',
        // Use localStorage to persist the session
        storage: {
          getItem: (key) => {
            if (typeof window !== 'undefined') {
              return window.localStorage.getItem(key)
            }
            return null
          },
          setItem: (key, value) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value)
            }
          },
          removeItem: (key) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key)
            }
          },
        },
      },
    })
  : {
      // Mock Supabase client for development
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
        onAuthStateChange: (callback) => ({
          data: { subscription: { unsubscribe: () => {} } }
        })
      }
    }

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Helper function to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Helper function for Google OAuth sign in
export const signInWithGoogle = async () => {
  if (!hasSupabaseCredentials) {
    return { data: null, error: { message: 'Please configure Supabase credentials to use Google OAuth' } }
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  return { data, error }
}

// Helper function for email/password sign in (for existing users)
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Helper function for email/password sign up (no email verification)
export const signUpWithEmail = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: undefined, // Disable email verification
    },
  })
  return { data, error }
}

// Helper function to sync user with backend after authentication
export const syncUserWithBackend = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.access_token) {
    try {
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const result = await response.json()
        return { data: result, error: null }
      } else {
        const errorData = await response.json()
        return { data: null, error: errorData }
      }
    } catch (error) {
      return { data: null, error: { message: error.message } }
    }
  }
  
  return { data: null, error: { message: 'No active session' } }
}

// Helper function to get user profile from backend
export const getUserProfile = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session?.access_token) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const profile = await response.json()
        return { data: profile, error: null }
      } else {
        const errorData = await response.json()
        return { data: null, error: errorData }
      }
    } catch (error) {
      return { data: null, error: { message: error.message } }
    }
  }
  
  return { data: null, error: { message: 'No active session' } }
}