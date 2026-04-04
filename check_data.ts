import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kggvnqfwttvyejwmgruz.supabase.co";
const SUPABASE_KEY = "sb_publishable_h0kwL-9rE1Lta7foLCoZsQ_oBIff-p3";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
  const { data: roles, error: rolesError } = await (supabase as any).from('user_roles').select('*');
  console.log("ROLES:", roles);

  const { data: notifies, error: notifiesError } = await (supabase as any).from('notifications').select('*').limit(10).order('created_at', { ascending: false });
  console.log("RECENT_NOTIFIES:", notifies);
}
checkData();
