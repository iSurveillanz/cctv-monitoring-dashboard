import { supabase } from './supabase.js'

export async function getSession(){
  const { data } = await supabase.auth.getSession()
  return data.session
}
export async function signIn(email,password){
  return supabase.auth.signInWithPassword({email,password})
}
export async function signOut(){ return supabase.auth.signOut() }
export function onAuthChange(callback){ return supabase.auth.onAuthStateChange(callback) }
