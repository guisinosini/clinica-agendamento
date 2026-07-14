import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('reservations').select('*').order('created_at', { ascending: false }).limit(10);
  if (error) {
    console.error(error);
  } else {
    console.log("Recent reservations:");
    data.forEach(r => {
      console.log(`ID: ${r.id}, Start: ${r.start_time}, End: ${r.end_time}, Service: ${r.service}`);
    });
  }
}

main();
