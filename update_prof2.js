const fs = require('fs');

const text = fs.readFileSync('src/app/cadastro-paciente/anamnese/page.tsx', 'utf8');

const regex = /\{\/\* STEP \d+: (.*?) \*\/\}([\s\S]*?)(?=\{\/\* STEP|\{\/\* CONTROLES)/g;
let matches;
const sections = [];
while ((matches = regex.exec(text)) !== null) {
  if (matches[1] !== 'Sigilo') {
    sections.push({ title: matches[1], content: matches[2] });
  }
}

console.log("Found sections:", sections.length);

let profSections = sections.map(s => {
  let content = s.content
    .replace(/\{currentStep === \d+ && \(/g, '')
    .replace(/<div className=\"animate-fade\">/g, '<section>')
    .replace(/<h2 style=\{\{ fontSize: '1\.4rem', fontWeight: 700, marginBottom: '1\.5rem', color: 'var\(--text-main\)' \}\}>\{SECTIONS\[\d+\]\}<\/h2>/g, 
             '<h2 className=\"print-title\" style={{ fontSize: \'1.2rem\', fontWeight: 700, borderBottom: \'1px solid var(--border-color)\', paddingBottom: \'0.5rem\', marginBottom: \'1rem\', color: \'var(--primary)\' }}>' + s.title + '</h2>')
    .replace(/<\/div>\s*\)\}\s*$/g, '</section>');
  return content;
}).join('\n\n');

// Add the extra professional field to the Cognitiva section (Section 6 - index 5)
profSections = profSections.replace(
  /{renderFrequenciaSelect\("socioemocionais", "humorDeprimido", "Humor deprimido\/anedonia"\)}\s*<\/section>/g,
  '{renderFrequenciaSelect("socioemocionais", "humorDeprimido", "Humor deprimido/anedonia")}\n            <div><label className=\"label\" style={{marginTop: \"1.5rem\"}}>Notas Adicionais do Profissional (Autopercepção e Observações Clínicas):</label><textarea className=\"input\" style={{ minHeight: \'120px\' }} value={formData.autopercepcao} onChange={e => handleChange("autopercepcao", e.target.value)} /></div>\n          </section>'
);

let profPage = fs.readFileSync('src/app/meus-pacientes/anamnese/[patientId]/page.tsx', 'utf8');
profPage = profPage.replace(
  /<div style=\{\{ display: \"flex\", flexDirection: \"column\", gap: \"2\.5rem\" \}\}>[\s\S]*?<\/div>\s*(?=<div style=\{\{ marginTop: \"3rem\")/m,
  '<div className=\"print-sections\" style={{ display: \"flex\", flexDirection: \"column\", gap: \"2.5rem\" }}>\n' + profSections + '\n</div>\n\n'
);

// Adicionar print button
profPage = profPage.replace(
  /<button className=\"btn\" onClick=\{saveAnamnese\}/,
  '<button className=\"btn btn-outline print-hide\" onClick={() => window.print()} style={{ marginRight: \'1rem\' }}>🖨️ Imprimir</button>\n        <button className=\"btn print-hide\" onClick={saveAnamnese}'
);
profPage = profPage.replace(
  /<button className=\"btn\" onClick=\{saveAnamnese\}/g,
  '<button className=\"btn print-hide\" onClick={saveAnamnese}'
);

const css = `
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = \`
      @media print {
        body { background: white !important; }
        .container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
        .card { box-shadow: none !important; border: none !important; padding: 0 !important; }
        header, .print-hide { display: none !important; }
        .print-sections { gap: 1.5rem !important; }
        .print-title { border-bottom: 2px solid black !important; color: black !important; font-size: 14pt !important; margin-bottom: 0.5rem !important; }
        .label { color: black !important; font-weight: bold !important; font-size: 10pt !important; margin-bottom: 0.2rem !important; }
        .input { border: 1px solid #ddd !important; resize: none !important; background: transparent !important; font-size: 10pt !important; padding: 0.3rem !important; min-height: auto !important; }
        textarea.input { height: 40px !important; }
        input[type="checkbox"], input[type="radio"] { appearance: auto !important; -webkit-print-color-adjust: exact !important; }
      }
    \`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
`;
if (!profPage.includes('@media print')) {
  profPage = profPage.replace('  if (loading) return', css + '\n  if (loading) return');
}

// Copy renderFrequenciaSelect
const renderFreqMatch = text.match(/const renderFrequenciaSelect = [\s\S]*?  \};\n/);
if (renderFreqMatch && !profPage.includes('renderFrequenciaSelect')) {
  profPage = profPage.replace('  if (loading) return', renderFreqMatch[0] + '\n  if (loading) return');
}

fs.writeFileSync('src/app/meus-pacientes/anamnese/[patientId]/page.tsx', profPage);
console.log("SUCCESS!");
