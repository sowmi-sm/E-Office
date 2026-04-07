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
    if (p.email?.includes('sowmiya')) {
       console.log(`FOUND_SOWMIYA: ${p.id} | ${p.email} | ROLE: ${userRole?.role}`);
    }
  });

  console.log('--- ALL ADMINS ---');
  for (const p of profiles || []) {
    if (p.full_name?.toLowerCase().includes('sowmiya') || p.email?.toLowerCase().includes('sowmiya')) {
       console.log(`CHECKING_SOWMIYA: ${p.id} | ${p.email}`);
       const { data: existing } = await supabase.from('user_roles').select('*').eq('user_id', p.id).eq('role', 'admin').maybeSingle();
       if (!existing) {
         console.log(`ADDING_ADMIN_ROLE_FOR: ${p.id}`);
         await supabase.from('user_roles').insert({ user_id: p.id, role: 'admin' });
       } else {
         console.log(`SOWMIYA_ALREADY_ADMIN: ${p.id}`);
       }
    }
  }
}
checkProfiles();
