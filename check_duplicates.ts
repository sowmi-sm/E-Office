import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kggvnqfwttvyejwmgruz.supabase.co',
  'sb_publishable_h0kwL-9rE1Lta7foLCoZsQ_oBIff-p3' 
);

async function check() {
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, role');
  
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, email');

  if (roleError || profileError) {
    console.error(roleError || profileError);
    return;
  }

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

  console.log('--- LATEST NOTIFICATIONS ---');
  const { data: notifies } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  notifies?.forEach(n => {
    const target = profileMap[n.user_id];
    console.log(`TYPE: ${n.title} | TO: ${target?.full_name || n.user_id} | MSG: ${n.message}`);
  });
}

check();
