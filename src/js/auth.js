import { supabase } from './supabase.js'

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Get session error:', error)
    return null
  }

  return data?.session || null
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Supabase login error:', error)
    return { data: null, error }
  }

  console.log('Login successful:', data.user?.email)

  return {
    data,
    error: null
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Supabase logout error:', error)
    throw error
  }
}