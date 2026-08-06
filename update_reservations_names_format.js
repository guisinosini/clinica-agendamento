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
  const { data: reservations, error } = await supabase.from('reservations').select('id, patient_name');
  
  if (error) {
    console.error("Erro ao buscar reservas:", error);
    return;
  }

  console.log(`Encontradas ${reservations.length} reservas.`);
  let updatedCount = 0;

  for (const reservation of reservations) {
    if (reservation.patient_name && reservation.patient_name.trim() !== '') {
      const formatted = formatName(reservation.patient_name);
      if (formatted !== reservation.patient_name) {
        console.log(`Atualizando nome da reserva de "${reservation.patient_name}" para "${formatted}"`);
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ patient_name: formatted })
          .eq('id', reservation.id);
        
        if (updateError) {
          console.error(`Erro ao atualizar reserva ${reservation.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`Total de nomes de reservas atualizados: ${updatedCount}`);
}

main();
