import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kggvnqfwttvyejwmgruz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnZ3ZucWZ3dHR2eWVqd21ncnV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwOTEwMDIyMCwiZXhwIjoyMDI0Njc2MjIwfQ.20yD96_K_U-i1_9I_T_P_R_S_T_U_V_W_X_Y_Z' 
);

async function check() {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, role');
  
  if (error) {
    console.error(error);
    return;
  }

  const counts: Record<string, number> = {};
  data.forEach(r => {
    const key = `${r.user_id}:${r.role}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  Object.entries(counts).forEach(([key, count]) => {
    if (count > 1) {
      console.log(`DUPLICATE: ${key} appeared ${count} times`);
    }
  });
}

check();
