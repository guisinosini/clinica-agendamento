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

let htmlContent = "<!DOCTYPE html>\n<html lang='pt-BR'>\n<head>\n<meta charset='UTF-8'>\n<title>Cabeçalhos Pacientes Retroativos</title>\n";
htmlContent += "<style>\n  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f0f0f0; }\n";
htmlContent += "  .container { display: flex; flex-direction: column; gap: 10px; }\n";
htmlContent += "  .etiqueta { border: 1px dashed #000; padding: 15px 20px; background-color: #fff; page-break-inside: avoid; display: flex; justify-content: space-between; align-items: center; }\n";
htmlContent += "  .nome { font-size: 18px; font-weight: bold; }\n";
htmlContent += "  .codigo { font-size: 16px; font-weight: normal; color: #000; }\n";
htmlContent += "  @media print { body { background-color: #fff; padding: 0; } .etiqueta { border: 1px dashed #333; } }\n";
htmlContent += "</style>\n</head>\n<body>\n  <div class='container'>\n";

for (const p of insertedPatients) {
  htmlContent += "    <div class='etiqueta'>\n";
  htmlContent += "      <div class='nome'>" + p.nome + "</div>\n";
  htmlContent += "      <div class='codigo'>Cód: " + p.code + "</div>\n";
  htmlContent += "    </div>\n";
}

htmlContent += "  </div>\n</body>\n</html>";

fs.writeFileSync('cabecalhos_retroativos.html', htmlContent, 'utf-8');
console.log("Arquivo 'cabecalhos_retroativos.html' gerado!");
