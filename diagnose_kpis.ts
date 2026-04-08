import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kggvnqfwttvyejwmgruz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZ3Zucontent_missing'; // Need to be careful with keys but user has them in local files usually
// Actually I'll use the user's environment if possible

async function diagnose() {
  const { data: roles } = await supabase.from('user_roles').select('*');
  console.log('--- ALL ROLES ---');
  console.log(roles);

  const { data: kpis } = await supabase.from('user_kpis').select('*, profiles(full_name)');
  console.log('--- ALL KPIs ---');
  console.log(kpis);
}
