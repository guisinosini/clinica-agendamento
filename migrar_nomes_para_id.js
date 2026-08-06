const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jwgzwjmwhgnnjnkbjwsv.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_o3yxcPfSpSGIriG0nW49Hg_i0NWjf5x"; 

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Iniciando migração de reservas...");

  // 1. Buscar todos os pacientes
  const { data: patients, error: patientsError } = await supabase.from('patients').select('id, name');
  if (patientsError) {
    console.error("Erro ao buscar pacientes:", patientsError);
    return;
  }
  
  // Criar um dicionário para busca rápida (nome -> id)
  const patientDict = {};
  for (const p of patients) {
    patientDict[p.name.trim().toLowerCase()] = p.id;
  }
  console.log(`Encontrados ${patients.length} pacientes cadastrados.`);

  // 2. Buscar reservas que ainda não têm patient_id
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('id, patient_name')
    .is('patient_id', null)
    .not('patient_name', 'is', null);

  if (resError) {
    console.error("Erro ao buscar reservas:", resError);
    return;
  }
  console.log(`Encontradas ${reservations?.length || 0} reservas precisando de migração.`);

  let updatedCount = 0;
  let notFoundCount = 0;

  for (const reservation of (reservations || [])) {
    const name = reservation.patient_name.trim().toLowerCase();
    const patientId = patientDict[name];

    if (patientId) {
      console.log(`Atualizando reserva ${reservation.id} (Paciente: ${reservation.patient_name}) para ID: ${patientId}`);
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ patient_id: patientId })
        .eq('id', reservation.id);
      
      if (updateError) {
        console.error(`Erro ao atualizar reserva ${reservation.id}:`, updateError);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`AVISO: Nenhum paciente encontrado para o nome exato: "${reservation.patient_name}" (Reserva ${reservation.id})`);
      notFoundCount++;
    }
  }

  console.log("--- Resumo da Migração ---");
  console.log(`Reservas atualizadas com sucesso: ${updatedCount}`);
  console.log(`Reservas não migradas (nome não encontrado): ${notFoundCount}`);
}

main();
