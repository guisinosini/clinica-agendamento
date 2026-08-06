const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jwgzwjmwhgnnjnkbjwsv.supabase.co";
const supabaseKey = "sb_publishable_o3yxcPfSpSGIriG0nW49Hg_i0NWjf5x";

const supabase = createClient(supabaseUrl, supabaseKey);

const formatCPF = (value) => {
  if (!value) return value;
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

async function main() {
  const { data: patients, error } = await supabase.from('patients').select('id, cpf');
  
  if (error) {
    console.error("Erro ao buscar pacientes:", error);
    return;
  }

  console.log(`Encontrados ${patients.length} pacientes.`);
  let updatedCount = 0;

  for (const patient of patients) {
    if (patient.cpf && patient.cpf.trim() !== '') {
      const formatted = formatCPF(patient.cpf);
      if (formatted !== patient.cpf) {
        console.log(`Atualizando CPF de ${patient.cpf} para ${formatted}`);
        const { error: updateError } = await supabase
          .from('patients')
          .update({ cpf: formatted })
          .eq('id', patient.id);
        
        if (updateError) {
          console.error(`Erro ao atualizar paciente ${patient.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`Total de CPFs atualizados: ${updatedCount}`);
}

main();
