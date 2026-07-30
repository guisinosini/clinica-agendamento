const fs = require('fs');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://jwgzwjmwhgnnjnkbjwsv.supabase.co";
const supabaseKey = "sb_publishable_o3yxcPfSpSGIriG0nW49Hg_i0NWjf5x";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const filePath = "G:\\Meu Drive\\2. PSICOLOGIA\\CORREÇÕES JULIANA BONIZZI\\1. ADM\\BACKUP APP\\Pacientes retroativos ao app.xlsx";
  
  console.log("Lendo arquivo Excel para pegar os nomes dos novos pacientes...");
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  const excelNames = data.map(row => row['NOME DO PACIENTE'] || row['Nome do paciente'] || row['Nome'] || row['nome']).filter(Boolean);
  
  console.log("Buscando pacientes no Supabase...");
  const { data: patients, error } = await supabase
    .from('patients')
    .select('name, code');

  if (error) {
    console.error("Erro ao buscar do Supabase:", error);
    process.exit(1);
  }

  // Filtrar os pacientes do banco que estão na lista do excel
  const pacientesNovos = patients.filter(p => excelNames.includes(p.name) && p.code);
  
  // Ordenar: menor ano -> maior ano, menor sequencia -> maior sequencia. '26A' fica no fim.
  pacientesNovos.sort((a, b) => {
    const partsA = a.code.split('/');
    const partsB = b.code.split('/');
    if (partsA.length < 2 || partsB.length < 2) return 0;
    
    const seqA = parseInt(partsA[0], 10) || 0;
    const seqB = parseInt(partsB[0], 10) || 0;
    
    const yearAStr = partsA[1];
    const yearBStr = partsB[1];
    
    const yearA = parseInt(yearAStr.replace(/\\D/g, ''), 10) || 0;
    const yearB = parseInt(yearBStr.replace(/\\D/g, ''), 10) || 0;
    
    if (yearA !== yearB) {
      return yearA - yearB;
    }
    
    const hasAA = yearAStr.includes('A');
    const hasAB = yearBStr.includes('A');
    
    if (hasAA && !hasAB) return 1;
    if (!hasAA && hasAB) return -1;
    
    return seqA - seqB;
  });

  console.log(`Encontrados ${pacientesNovos.length} pacientes correspondentes no banco com código gerado.`);

  let htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Imprimir Cabeçalhos - Pacientes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f0f0f0;
    }
    .print-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 20px;
    }
    .cabecalho-box {
      page-break-inside: avoid;
      margin-bottom: 2rem;
      padding-top: 1rem;
    }
    .cabecalho-content {
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      border: 2px solid #000; 
      padding: 1rem; 
      border-radius: 8px;
    }
    .cabecalho-content h2 {
      font-size: 1.4rem; 
      font-weight: 800; 
      color: #000; 
      margin: 0;
    }
    .cabecalho-content p {
      margin: 0.5rem 0 0 0; 
      color: #333; 
      font-size: 1rem;
    }
    .codigo-box {
      text-align: right;
    }
    .codigo-box p {
      margin: 0 0 0.2rem 0; 
      font-size: 0.9rem; 
      color: #555;
    }
    .codigo-box h2 {
      font-size: 2.2rem; 
      font-weight: 900; 
      margin: 0; 
      color: #000;
    }
    .recorte {
      text-align: center; 
      margin-top: 1.5rem; 
      border-bottom: 2px dashed #999; 
      position: relative;
    }
    .recorte span {
      position: absolute; 
      top: -10px; 
      left: 50%; 
      transform: translateX(-50%); 
      background-color: white; 
      padding: 0 10px; 
      color: #666; 
      font-size: 0.85rem;
    }
    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      .print-container {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="print-container">
    <div class="no-print" style="text-align: center; margin-bottom: 20px;">
      <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #000; color: #fff; border: none; border-radius: 4px;">🖨️ Imprimir Cabeçalhos</button>
      <p>Certifique-se de habilitar "Gráficos de plano de fundo" (Background graphics) nas opções de impressão, se necessário.</p>
    </div>
  `;

  for (const p of pacientesNovos) {
    htmlContent += `
    <div class="cabecalho-box">
      <div class="cabecalho-content">
        <div>
          <h2>${p.name}</h2>
          <p>Clínica de Psicologia</p>
        </div>
        <div class="codigo-box">
          <p>Código do Paciente</p>
          <h2>${p.code}</h2>
        </div>
      </div>
      <div class="recorte">
        <span>✂️ Recorte aqui ✂️</span>
      </div>
    </div>
    `;
  }

  htmlContent += `
  </div>
</body>
</html>
  `;

  fs.writeFileSync('imprimir_cabecalhos.html', htmlContent, 'utf8');
  console.log("Arquivo 'imprimir_cabecalhos.html' gerado com sucesso na raiz do projeto!");
}

main().catch(console.error);
