const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jwgzwjmwhgnnjnkbjwsv.supabase.co";
const supabaseKey = "sb_publishable_o3yxcPfSpSGIriG0nW49Hg_i0NWjf5x";

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = false; // Altere para false quando quiser realmente inserir no banco

async function main() {
  const filePath = "G:\\Meu Drive\\2. PSICOLOGIA\\CORREÇÕES JULIANA BONIZZI\\1. ADM\\BACKUP APP\\Pacientes retroativos ao app.xlsx";
  
  if (!fs.existsSync(filePath)) {
    console.error(`ERRO: Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  console.log("Lendo arquivo Excel...");
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(`Encontrados ${data.length} registros no Excel.`);

  // Find max sequence per year currently in DB
  console.log("Buscando maiores sequências já cadastradas no banco...");
  const { data: existingPatients, error } = await supabase
    .from('patients')
    .select('code');

  if (error) {
    console.error("Erro ao buscar pacientes no banco:", error);
    process.exit(1);
  }

  const maxSeqPerYear = {};

  if (existingPatients && existingPatients.length > 0) {
    for (const p of existingPatients) {
      if (p.code && p.code.includes('/')) {
        const [seqStr, yearStr] = p.code.split('/');
        // Extract only the numbers from the sequence
        const seqNumStr = seqStr.replace(/\D/g, '');
        if (seqNumStr) {
          const seq = parseInt(seqNumStr, 10);
          
          if (!maxSeqPerYear[yearStr]) {
            maxSeqPerYear[yearStr] = 0;
          }
          if (seq > maxSeqPerYear[yearStr]) {
            maxSeqPerYear[yearStr] = seq;
          }
        }
      }
    }
  }

  console.log("Sequências iniciais encontradas no banco:", maxSeqPerYear);
  console.log("Exemplo da primeira linha lida do Excel:", data[0]);

  // Track sequence increments during this run
  const currentSeqPerYear = { ...maxSeqPerYear };

  const patientsToInsert = [];

  for (const row of data) {
    // Normalizando nomes de colunas baseado no que o usuário descreveu:
    // "Nome do paciente", "Data", "Convênio"
    // Caso tenham variações na planilha, ajustamos abaixo.
    const name = row['NOME DO PACIENTE'] || row['Nome do paciente'] || row['Nome'] || row['nome'];
    let dateVal = row['DATA '] || row['DATA'] || row['Data'] || row['data'];
    const healthPlan = row['CONVÊNIO'] || row['Convênio'] || row['convênio'] || row['convenio'] || null;

    if (!name) continue;

    // Converte Data do Excel (que pode vir como número serial do excel) para string/Data real
    let createdAt = null;
    let yearSuffix = '24'; // fallback

    if (dateVal) {
        if (typeof dateVal === 'number') {
            // Excel serial date to JS Date
            const date = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            createdAt = date.toISOString();
            yearSuffix = date.getFullYear().toString().slice(-2);
        } else if (typeof dateVal === 'string') {
            // Assume format DD/MM/YYYY or similar
            let parts = dateVal.split(/[-/]/);
            if (parts.length === 3) {
                // If it's DD/MM/YYYY
                if (parts[0].length === 2 && parts[2].length === 4) {
                    yearSuffix = parts[2].slice(-2);
                    createdAt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`).toISOString();
                } else if (parts[0].length === 4) { // YYYY/MM/DD
                    yearSuffix = parts[0].slice(-2);
                    createdAt = new Date(dateVal).toISOString();
                } else {
                    createdAt = new Date(dateVal).toISOString();
                }
            } else {
                createdAt = new Date(dateVal).toISOString();
            }
        }
    } else {
        // Se não tiver data, usa a data atual (ou ignora, mas vamos usar fallback)
        createdAt = new Date().toISOString();
        yearSuffix = new Date().getFullYear().toString().slice(-2);
    }

    // Regra do "26A"
    const fullYearStr = yearSuffix === '26' ? '26A' : yearSuffix;

    // Calcular próximo código
    if (!currentSeqPerYear[fullYearStr]) {
      currentSeqPerYear[fullYearStr] = 0;
    }
    currentSeqPerYear[fullYearStr] += 1;

    const nextSeq = currentSeqPerYear[fullYearStr];
    const paddedSeq = nextSeq.toString().padStart(4, '0');
    const newCode = `${paddedSeq}/${fullYearStr}`;

    const newPatient = {
      name: name,
      code: newCode,
      healthPlan: healthPlan,
      created_at: createdAt
    };

    patientsToInsert.push(newPatient);
  }

  console.log(`\n=== MODO DRY RUN (${DRY_RUN ? "ATIVADO" : "DESATIVADO"}) ===\n`);
  
  if (DRY_RUN) {
    console.log("Prévia dos pacientes que seriam inseridos (primeiros 10):");
    console.table(patientsToInsert.slice(0, 10).map(p => ({
        Nome: p.name,
        Código: p.code,
        Data: p.created_at,
        Convênio: p.healthPlan
    })));
    console.log(`\nTotal de pacientes mapeados para inserção: ${patientsToInsert.length}`);
    console.log("Para rodar a inserção definitiva, mude DRY_RUN para false no script e rode novamente.");
  } else {
    console.log(`Inserindo ${patientsToInsert.length} pacientes no banco de dados...`);
    
    // Inserção em lotes ou direto
    const { data: insertedData, error: insertError } = await supabase
      .from('patients')
      .insert(patientsToInsert)
      .select('id, code, name');

    if (insertError) {
      console.error("Erro ao inserir pacientes:", insertError);
    } else {
      console.log(`Inserção concluída com sucesso! ${insertedData.length} pacientes inseridos.`);
      console.log("Os pacientes agora possuem IDs gerados pelo banco.");
    }
  }
}

main().catch(console.error);
