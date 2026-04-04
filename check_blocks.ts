import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kggvnqfwttvyejwmgruz.supabase.co";
const SUPABASE_KEY = "sb_publishable_h0kwL-9rE1Lta7foLCoZsQ_oBIff-p3";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkBlocks() {
  const { data: blocks } = await (supabase as any).from('user_blocks').select('*');
  console.log("USER_BLOCKS:", blocks);

  const { data: tasks } = await (supabase as any)
    .from('tasks')
    .select('*')
    .eq('title', '___USER_BLOCK_RECORD___');
  console.log("BLOCK_TASKS:", tasks);
}
checkBlocks();
