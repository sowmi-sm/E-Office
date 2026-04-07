import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kggvnqfwttvyejwmgruz.supabase.co";
const SUPABASE_KEY = "sb_publishable_h0kwL-9rE1Lta7foLCoZsQ_oBIff-p3";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProfiles() {
  const { data: profiles, error: pErr } = await (supabase as any).from('profiles').select('*');
  const { data: roles, error: rErr } = await (supabase as any).from('user_roles').select('*');
  
  if (pErr || rErr) {
    console.error(pErr || rErr);
    return;
  }

  console.log('--- GLOBAL PERMISSION AUDIT ---');
  roles?.forEach(r => {
    const p = profiles?.find(pr => pr.id === r.user_id);
    console.log(`UID: ${r.user_id} | ROLE: ${r.role} | NAME: ${p?.full_name || '!!! GHOST PROFILE !!!'} | EMAIL: ${p?.email || 'N/A'}`);
  });
}
checkProfiles();
