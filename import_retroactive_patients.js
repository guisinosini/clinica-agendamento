const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = "https://jwgzwjmwhgnnjnkbjwsv.supabase.co";
const supabaseKey = "sb_publishable_o3yxcPfSpSGIriG0nW49Hg_i0NWjf5x";
const supabase = createClient(supabaseUrl, supabaseKey);

const patientsToImport = [
  { nome: "Pedro Sena da Silva", data: "08/2025" },
  { nome: "Lais Furlan", data: "11/2025" },
  { nome: "Gael Pavan", data: "12/2025" },
  { nome: "Heloisa Rafaela Cellulare", data: "12/2025" },
  { nome: "Júlia Rebeca Fernandes", data: "12/2025" },
  { nome: "Lorenzo Chianello Generino", data: "12/2025" },
  { nome: "Thomas Maciel Canestrano", data: "01/2026" },
  { nome: "Victória Corrêa Périco", data: "01/2026" },
  { nome: "Yasmin Oliveira dos Santos", data: "01/2026" },
  { nome: "Ana Alice Soares Souza", data: "02/2026" },
  { nome: "Arthur dos Santos Crispim", data: "02/2026" },
  { nome: "Augusto Oliveira de Campos", data: "02/2026" },
  { nome: "João Pedro Franco de Oliveira", data: "02/2026" },
  { nome: "João Victor Zambelli dos Santos", data: "02/2026" },
  { nome: "Liz Bená Nunes", data: "02/2026" },
  { nome: "Matheus Caetano de Mello", data: "02/2026" },
  { nome: "Miguel Antonio Borella", data: "02/2026" },
  { nome: "Ravi Gabriel de Abreu", data: "02/2026" },
  { nome: "Rebeca Moeira da Silva", data: "02/2026" },
  { nome: "André Aparecido Guimarães", data: "03/2026" },
  { nome: "Arthur dos Anjos Felix", data: "03/2026" },
  { nome: "Geovanna Oliveira de Jesus", data: "03/2026" },
  { nome: "Guilherme Guidotti", data: "03/2026" },
  { nome: "Kendly Emanuelly Stence", data: "03/2026" },
  { nome: "Maria Beatriz Maiochi Coraine", data: "03/2026" },
  { nome: "Nicolas Gabriel Bressan Marsola", data: "03/2026" },
  { nome: "Vicente Moreira Pio", data: "03/2026" },
  { nome: "Yago Rodrigo Silva de Freitas", data: "03/2026" },
  { nome: "Beatriz Alves de Macena", data: "04/2026" },
  { nome: "Ester Mendes de Souza", data: "04/2026" },
  { nome: "Gabriela Carolina de Lima", data: "04/2026" },
  { nome: "Heitor Fabrizio Lopes Santana de Moraes", data: "04/2026" },
  { nome: "João Vitor Silva Santana", data: "04/2026" },
  { nome: "José Miguel Aureliano Ferreira da Silva", data: "04/2026" },
  { nome: "Yago Samuel Alves de Moraes", data: "04/2026" },
  { nome: "Ana Paula Fernandes Barros", data: "05/2026" },
  { nome: "Caio Alexandre Rebelato", data: "05/2026" },
  { nome: "José Otávio Menezes da Silva", data: "05/2026" },
  { nome: "Rubens Canestraro Junior", data: "05/2026" },
  { nome: "Sophia Gonçalves dos Santos", data: "05/2026" },
  { nome: "Davi Binatto", data: "08/2026" }
];

async function getMaxSequenceForYear(yearSuffix) {
  const pattern = "%/" + yearSuffix + "B";
  
  const { data, error } = await supabase
    .from('patients')
    .select('code')
    .like('code', pattern);
    
  if (error) {
    console.error("Erro ao buscar max sequence:", error);
    return 0;
  }
  
  let max = 0;
  for (const p of data) {
    const seqStr = p.code.split('/')[0];
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > max) {
      max = seq;
    }
  }
  
  return max;
}

function convertDateToISO(mesAno) {
  const parts = mesAno.split('/');
  const mes = parts[0];
  const ano = parts[1];
  return new Date(ano + "-" + mes + "-01T12:00:00Z").toISOString();
}

async function main() {
  console.log("Iniciando importação de " + patientsToImport.length + " pacientes...");
  
  const yearSequences = {};
  const insertedPatients = [];

  for (const p of patientsToImport) {
    const anoCompleto = p.data.split('/')[1];
    const anoSufixo = anoCompleto.slice(-2);
    
    if (yearSequences[anoSufixo] === undefined) {
      const maxInDb = await getMaxSequenceForYear(anoSufixo);
      yearSequences[anoSufixo] = maxInDb;
    }
    
    yearSequences[anoSufixo]++;
    const currentSeq = yearSequences[anoSufixo];
    
    const code = String(currentSeq).padStart(4, '0') + '/' + anoSufixo + 'B';
    
    const patientData = {
      name: p.nome,
      code: code,
      created_at: convertDateToISO(p.data),
      status: 'ativo'
    };
    
    console.log("Inserindo: " + p.nome + " -> " + code);
    
    const { data: inserted, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select();
      
    if (error) {
      console.error("Erro ao inserir " + p.nome + ":", error);
    } else {
      insertedPatients.push({ nome: p.nome, code: code });
    }
  }
  
  console.log("\\nImportação concluída. " + insertedPatients.length + " inseridos com sucesso.");
  
  console.log("\\nGerando arquivo HTML para impressão dos cabeçalhos...");
  
  let htmlContent = "<!DOCTYPE html>\\n<html lang='pt-BR'>\\n<head>\\n<meta charset='UTF-8'>\\n<title>Etiquetas Pacientes Retroativos</title>\\n";
  htmlContent += "<style>\\n  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f0f0f0; }\\n";
  htmlContent += "  .container { display: flex; flex-wrap: wrap; gap: 15px; justify-content: flex-start; }\\n";
  htmlContent += "  .etiqueta { width: 8cm; height: 4cm; border: 1px dashed #000; background-color: #fff; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }\\n";
  htmlContent += "  .nome { font-size: 16px; font-weight: bold; margin-bottom: 10px; }\\n";
  htmlContent += "  .codigo { font-size: 22px; font-weight: normal; }\\n";
  htmlContent += "  @media print { body { background-color: #fff; padding: 0; } .container { gap: 10px; } .etiqueta { page-break-inside: avoid; } }\\n";
  htmlContent += "</style>\\n</head>\\n<body>\\n  <div class='container'>\\n";

  for (const p of insertedPatients) {
    htmlContent += "    <div class='etiqueta'>\\n";
    htmlContent += "      <div class='nome'>" + p.nome + "</div>\\n";
    htmlContent += "      <div class='codigo'>" + p.code + "</div>\\n";
    htmlContent += "    </div>\\n";
  }

  htmlContent += "  </div>\\n</body>\\n</html>";

  fs.writeFileSync('etiquetas_retroativos.html', htmlContent, 'utf-8');
  console.log("Arquivo 'etiquetas_retroativos.html' gerado com sucesso na raiz do projeto!");
}

main();
