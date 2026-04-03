import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kggvnqfwttvyejwmgruz.supabase.co";
const SUPABASE_KEY = "sb_publishable_h0kwL-9rE1Lta7foLCoZsQ_oBIff-p3";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
  const { data: roles } = await supabase.from('user_roles').select('*');
  const { data: profiles } = await supabase.from('profiles').select('id, email, full_name');
  console.log("PROFILES:", profiles);
  console.log("ROLES:", roles);
}
checkData();
