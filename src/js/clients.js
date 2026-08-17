import { supabase } from './supabase.js'

export async function listClients(){
  const { data, error } = await supabase.from('clients').select('*').order('name')
  if(error) throw error
  return data
}
export async function createClientRecord(client){
  const { data,error } = await supabase.from('clients').insert(client).select().single()
  if(error) throw error
  return data
}
export async function updateClient(id, changes){
  const { data,error } = await supabase.from('clients').update(changes).eq('id',id).select().single()
  if(error) throw error
  return data
}
export async function deleteClient(id){
  const { error } = await supabase.from('clients').delete().eq('id',id)
  if(error) throw error
}
