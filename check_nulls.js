const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jwgzwjmwhgnnjnkbjwsv.supabase.co";
const supabaseKey = "sb_publishable_o3yxcPfSpSGIriG0nW49Hg_i0NWjf5x"; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('reservations')
    .select('id, patient_name, patient_id')
    .is('patient_id', null);
    
  if (error) console.error(error);
  else {
    console.log(`Encontradas ${data.length} reservas com patient_id nulo.`);
    console.log("Amostra:", data.slice(0, 10));
  }
}
check();
