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

  const admins = ['440d9592-273e-46f1-9292-e399f81cac62', 'bbd3df46-302e-4568-b5a4-97d563612954', 'dd56e04d-8f3c-4071-8d79-5a48d6d00003'];
  
  admins.forEach(id => {
    const p = profiles.find(pr => pr.id === id);
    console.log(`ADMIN_USER: ${id} | NAME: ${p?.full_name} | EMAIL: ${p?.email}`);
  });
}

check();
