const fs = require('fs');

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

const yearSequences = {};
const insertedPatients = [];

for (const p of patientsToImport) {
  const anoCompleto = p.data.split('/')[1];
  const anoSufixo = anoCompleto.slice(-2);
  
  if (yearSequences[anoSufixo] === undefined) {
    yearSequences[anoSufixo] = 0;
  }
  yearSequences[anoSufixo]++;
  const currentSeq = yearSequences[anoSufixo];
  const code = String(currentSeq).padStart(4, '0') + '/' + anoSufixo + 'B';
  insertedPatients.push({ nome: p.nome, code: code });
}

let htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Imprimir Cabeçalhos - Retroativos</title>
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

for (const p of insertedPatients) {
  htmlContent += `
    <div class="cabecalho-box">
      <div class="cabecalho-content">
        <div>
          <h2>${p.nome}</h2>
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

fs.writeFileSync('cabecalhos_retroativos.html', htmlContent, 'utf-8');
console.log("Arquivo 'cabecalhos_retroativos.html' recriado com o layout original!");
