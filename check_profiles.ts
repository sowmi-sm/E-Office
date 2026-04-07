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

  profiles?.forEach(p => {
    const userRole = roles?.find(r => r.user_id === p.id);
    console.log(`USER: ${p.full_name} | EMAIL: ${p.email} | ROLE: ${userRole?.role || 'NONE'}`);
  });
}
checkProfiles();
