const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jwgzwjmwhgnnjnkbjwsv.supabase.co";
const supabaseKey = "sb_publishable_o3yxcPfSpSGIriG0nW49Hg_i0NWjf5x";

const supabase = createClient(supabaseUrl, supabaseKey);

const formatName = (name) => {
  if (!name) return name;
  const prepositions = ["da", "de", "do", "das", "dos", "e"];
  
  return name
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      // Sempre capitaliza a primeira palavra e palavras que não são preposições
      if (index === 0 || !prepositions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word; // Retorna preposição em minúsculo
    })
    .join(' ');
};

async function main() {
  const { data: patients, error } = await supabase.from('patients').select('id, name');
  
  if (error) {
    console.error("Erro ao buscar pacientes:", error);
    return;
  }

  console.log(`Encontrados ${patients.length} pacientes.`);
  let updatedCount = 0;

  for (const patient of patients) {
    if (patient.name && patient.name.trim() !== '') {
      const formatted = formatName(patient.name);
      if (formatted !== patient.name) {
        console.log(`Atualizando nome de "${patient.name}" para "${formatted}"`);
        const { error: updateError } = await supabase
          .from('patients')
          .update({ name: formatted })
          .eq('id', patient.id);
        
        if (updateError) {
          console.error(`Erro ao atualizar paciente ${patient.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`Total de nomes atualizados: ${updatedCount}`);
}

main();
