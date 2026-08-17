import { supabase } from './supabase.js'

export async function listAssignments(unit){
  let q = supabase.from('panel_assignments').select('*, clients(*)').order('panel_code')
  if(unit) q = q.eq('unit', unit)
  const { data,error } = await q
  if(error) throw error
  return data
}
export async function saveAssignment(assignment){
  const { data,error } = await supabase.from('panel_assignments').upsert(assignment,{onConflict:'panel_code'}).select().single()
  if(error) throw error
  return data
}
