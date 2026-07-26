"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";

export default function ProfissionalAnamnesePage({ params }: { params: { patientId: string } }) {
  const router = useRouter();
  const patientId = params.patientId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [anamneseId, setAnamneseId] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    queixaPrincipal: "", inicioSintomas: "", gatilhoInicio: "", progressao: "", contextosEvidente: "", melhorouPiorou: "", areasImpacto: [],
    gestacao: [], intercorrenciasGestacao: "", parto: [], pesoApgar: "", marcosMotor: "", marcosLinguagem: "", sensorialAlimentar: [],
    idadeIngressoEscolar: "", historicoDesempenho: [], disciplinaDificuldade: "", comportamentoSala: "", laudosAnteriores: "", cargoAtual: "", queixasTrabalho: [], historicoMudancasEmprego: "",
    condicoesMedicas: [], detalhesMedicos: "", cirurgiasPrevias: "", medicacoesAtual: "", examesRealizados: "", usoSubstancias: [], frequenciaSubstancias: "", diagnosticosPsiquiatricos: "", acompanhamentoAtual: "", historicoPsicoterapia: "", antecedentesPsiquiatricos: [], detalhesAntecedentes: "",
    composicaoFamiliar: "", antecedentesFamiliares: [], grauParentescoAntecedentes: "", dinamicaFamiliar: "",
    atencao: {}, funcoesExecutivas: {}, memoria: {}, linguagem: {}, visuoconstrucao: [], praxias: [], socioemocionais: {}, coping: "", autopercepcao: "", estereotipias: "", comportamentosAtipicos: "",
    sonoHorario: "", alteracoesSono: [], padraoAlimentar: "", atividadeFisica: "", apoioTerceiros: [], detalhesApoio: "", expectativasAvaliacao: "", documentosTrazidos: ""
  });

  useEffect(() => {
    fetchData();
  }, [patientId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch patient
    const { data: patData } = await supabase.from("patients").select("*").eq("id", patientId).single();
    if (patData) setPatient(patData);

    // Fetch anamnese se existir
    const { data: anamData } = await supabase.from("anamneses").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }).limit(1).single();
    
    if (anamData) {
      setAnamneseId(anamData.id);
      setFormData((prev: any) => ({ ...prev, ...anamData.responses }));
    }
    
    setLoading(false);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleCheckbox = (field: string, option: string) => {
    setFormData((prev: any) => {
      const list = prev[field] || [];
      if (list.includes(option)) {
        return { ...prev, [field]: list.filter((item: string) => item !== option) };
      } else {
        return { ...prev, [field]: [...list, option] };
      }
    });
  };

  const handleSubFieldChange = (category: string, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const saveAnamnese = async () => {
    setSaving(true);
    
    if (anamneseId) {
      // Atualizar existente
      await supabase.from("anamneses").update({ responses: formData }).eq("id", anamneseId);
    } else {
      // Criar nova
      const { data } = await supabase.from("anamneses").insert([{ patient_id: patientId, responses: formData }]).select().single();
      if (data) setAnamneseId(data.id);
    }
    
    setSaving(false);
    alert("Anamnese salva com sucesso!");
  };


  const renderFrequenciaSelect = (category: string, field: string, label: string) => {
    const opcoes = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];
    return (
      <div style={{ marginBottom: "1rem" }}>
        <label className="label" style={{ marginBottom: "0.5rem", display: "block" }}>{label}</label>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {opcoes.map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name={`${category}_${field}`}
                checked={formData[category]?.[field] === opt}
                onChange={() => handleSubFieldChange(category, field, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media screen {
        .print-report { display: none !important; }
      }
      @media print {
        @page { margin: 1cm; }
        body { background: white !important; color: black !important; font-size: 10pt !important; line-height: 1.3 !important; }
        .screen-only, header, nav, .navbar, .card, .btn { display: none !important; }
        .print-report { display: block !important; width: 100%; }
        .print-header { border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 10px; }
        .print-title { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #ccc; margin: 10px 0 4px 0; padding-bottom: 2px; }
        .print-item { margin-bottom: 4px; }
        .print-label { font-weight: bold; display: inline; margin-right: 5px; }
        .print-value { display: inline; }
        .print-section { page-break-inside: avoid; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}>Carregando anamnese...</div>;

  return (
    <div className="container animate-fade" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/meus-pacientes" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Anamnese - {patient?.name}</h1>
        </div>
        <button className="btn btn-outline print-hide" onClick={() => window.print()} style={{ marginRight: '1rem' }}>🖨️ Imprimir</button>
        <button className="btn print-hide" onClick={saveAnamnese} disabled={saving} style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }}>
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </header>

      <div className="card" style={{ padding: "2rem" }}>
        {!anamneseId && (
          <div style={{ padding: "1rem", backgroundColor: "var(--warning-light)", color: "#854d0e", marginBottom: "1.5rem", borderRadius: "8px" }}>
            O paciente ainda não preencheu a anamnese no cadastro. Você pode preenchê-la agora durante a sessão.
          </div>
        )}

        {/* Todas as seções em um scroll único para o profissional */}
        <div className="print-sections" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

        
          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Queixa Principal</h2>
            
            <label className="label">Queixa principal (suas próprias palavras):</label>
            <textarea className="input" style={{ minHeight: '80px', marginBottom: '1rem' }} value={formData.queixaPrincipal} onChange={e => handleChange("queixaPrincipal", e.target.value)}></textarea>

            <label className="label">Desde quando foi notada? Início súbito ou insidioso?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.inicioSintomas} onChange={e => handleChange("inicioSintomas", e.target.value)} />

            <label className="label">Houve algum evento/gatilho associado ao início (doença, luto, mudança, trauma)?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.gatilhoInicio} onChange={e => handleChange("gatilhoInicio", e.target.value)} />
            
            <label className="label">A queixa é progressiva, estável ou flutuante ao longo do tempo?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.progressao} onChange={e => handleChange("progressao", e.target.value)} />

            <label className="label">O que já melhorou, piorou ou permaneceu igual desde o início?</label>
            <input className="input" style={{ marginBottom: '1.5rem' }} value={formData.melhorouPiorou} onChange={e => handleChange("melhorouPiorou", e.target.value)} />

            <label className="label">Áreas em que a queixa mais impacta (selecione as opções):</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {["Desempenho acadêmico", "Desempenho profissional", "Relações familiares", "Relações sociais/amizades", "Autonomia para AVDs", "Regulação emocional", "Sono", "Autoestima"].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.areasImpacto.includes(opt)} onChange={() => handleCheckbox("areasImpacto", opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </section>


        
          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Desenvolvimento</h2>
            
            <label className="label">Gestação e Parto:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {["Planejada", "Não planejada", "Pré-natal regular", "Prematuridade", "Parto Normal", "Cesárea", "Necessidade de UTI neonatal"].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.gestacao.includes(opt)} onChange={() => handleCheckbox("gestacao", opt)} />
                  {opt}
                </label>
              ))}
            </div>
            
            <label className="label">Detalhar intercorrências gestacionais, se houver:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.intercorrenciasGestacao} onChange={e => handleChange("intercorrenciasGestacao", e.target.value)}></textarea>
            
            <label className="label">Peso e Apgar ao nascer (se disponível):</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.pesoApgar} onChange={e => handleChange("pesoApgar", e.target.value)} />
            
            <label className="label">Marcos do desenvolvimento motor (sustentar cabeça, sentar, engatinhar, andar) — idades:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.marcosMotor} onChange={e => handleChange("marcosMotor", e.target.value)} />

            <label className="label">Marcos da linguagem (primeiras palavras, frases, fluência) — idades:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.marcosLinguagem} onChange={e => handleChange("marcosLinguagem", e.target.value)} />
          </section>


        
          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Escolar e Ocupacional</h2>
            
            <label className="label">Idade de ingresso escolar / adaptação inicial:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.idadeIngressoEscolar} onChange={e => handleChange("idadeIngressoEscolar", e.target.value)} />
            
            <label className="label">Histórico Escolar:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {["Repetência", "Necessidade de reforço", "Bom desempenho geral", "Relatos de desatenção", "Dificuldade leitura/escrita"].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.historicoDesempenho.includes(opt)} onChange={() => handleCheckbox("historicoDesempenho", opt)} />
                  {opt}
                </label>
              ))}
            </div>
            
            <label className="label">Disciplina(s) de maior dificuldade e natureza do erro:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.disciplinaDificuldade} onChange={e => handleChange("disciplinaDificuldade", e.target.value)} />
            
            <label className="label">Cargo atual e tempo na função:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.cargoAtual} onChange={e => handleChange("cargoAtual", e.target.value)} />

            <label className="label">Queixas no ambiente de trabalho:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {["Dificuldade de organização", "Esquecimentos frequentes", "Conflitos interpessoais", "Quedas de produtividade"].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.queixasTrabalho.includes(opt)} onChange={() => handleCheckbox("queixasTrabalho", opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </section>


        
          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Médica e Psiquiátrica</h2>
            
            <label className="label">Condições médicas relevantes:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {["Hipertensão", "Diabetes", "Cardiopatia", "Epilepsia", "Enxaqueca", "TCE", "Apneia do sono", "Distúrbios da tireoide", "Nenhuma"].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.condicoesMedicas.includes(opt)} onChange={() => handleCheckbox("condicoesMedicas", opt)} />
                  {opt}
                </label>
              ))}
            </div>

            <label className="label">Medicações em uso atual (nome, dose, tempo):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.medicacoesAtual} onChange={e => handleChange("medicacoesAtual", e.target.value)}></textarea>

            <label className="label">Diagnósticos psiquiátricos prévios ou atuais:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.diagnosticosPsiquiatricos} onChange={e => handleChange("diagnosticosPsiquiatricos", e.target.value)} />

            <label className="label">Histórico de psicoterapia (abordagem, tempo, motivo):</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.historicoPsicoterapia} onChange={e => handleChange("historicoPsicoterapia", e.target.value)} />
            
            <label className="label">Uso de substâncias:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {["Álcool", "Tabaco", "Outras substâncias", "Nenhum uso"].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.usoSubstancias.includes(opt)} onChange={() => handleCheckbox("usoSubstancias", opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </section>


        
          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>História Familiar</h2>
            
            <label className="label">Composição familiar / estrutura de convívio atual:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.composicaoFamiliar} onChange={e => handleChange("composicaoFamiliar", e.target.value)}></textarea>

            <label className="label">Antecedentes familiares (parentesco em 1º e 2º grau):</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              {["TDAH", "TEA", "Transtornos de aprendizagem", "Transtornos de humor", "Demências", "Epilepsia", "Esquizofrenia/psicose", "Nenhum"].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.antecedentesFamiliares.includes(opt)} onChange={() => handleCheckbox("antecedentesFamiliares", opt)} />
                  {opt}
                </label>
              ))}
            </div>

            <label className="label">Detalhar grau de parentesco dos itens marcados:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.grauParentescoAntecedentes} onChange={e => handleChange("grauParentescoAntecedentes", e.target.value)} />
            
            <label className="label">Dinâmica familiar atual (conflitos, suporte, mudanças recentes):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.dinamicaFamiliar} onChange={e => handleChange("dinamicaFamiliar", e.target.value)}></textarea>
          </section>


        
          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Cognitiva e Emocional</h2>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Atenção e Funções Executivas</h3>
            {renderFrequenciaSelect("atencao", "manterFoco", "Dificuldade em manter o foco em tarefas longas")}
            {renderFrequenciaSelect("atencao", "distraiFacilmente", "Distrai-se facilmente com estímulos externos")}
            {renderFrequenciaSelect("funcoesExecutivas", "planejar", "Dificuldade em planejar e organizar atividades/rotina")}
            {renderFrequenciaSelect("funcoesExecutivas", "iniciarTarefas", "Dificuldade em iniciar tarefas (procrastinação)")}
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', marginTop: '1.5rem' }}>Memória</h3>
            {renderFrequenciaSelect("memoria", "esquecimentoEventos", "Dificuldade em lembrar eventos recentes (memória episódica)")}
            {renderFrequenciaSelect("memoria", "repeticaoAssuntos", "Repetição de perguntas/assuntos já conversados")}
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', marginTop: '1.5rem' }}>Socioemocionais</h3>
            {renderFrequenciaSelect("socioemocionais", "irritabilidade", "Irritabilidade/labilidade emocional")}
            {renderFrequenciaSelect("socioemocionais", "ansiedade", "Ansiedade antecipatória ou generalizada")}
            {renderFrequenciaSelect("socioemocionais", "humorDeprimido", "Humor deprimido/anedonia")}
            <div><label className="label" style={{marginTop: "1.5rem"}}>Notas Adicionais do Profissional (Autopercepção e Observações Clínicas):</label><textarea className="input" style={{ minHeight: '120px' }} value={formData.autopercepcao} onChange={e => handleChange("autopercepcao", e.target.value)} /></div>
          </section>


        
          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Rotina e Expectativas</h2>
            
            <label className="label">Horário habitual de dormir/acordar e qualidade do sono:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.sonoHorario} onChange={e => handleChange("sonoHorario", e.target.value)} />
            
            <label className="label">Padrão alimentar e apetite (alterações recentes):</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.padraoAlimentar} onChange={e => handleChange("padraoAlimentar", e.target.value)} />
            
            <label className="label">Nível de atividade física habitual:</label>
            <input className="input" style={{ marginBottom: '1.5rem' }} value={formData.atividadeFisica} onChange={e => handleChange("atividadeFisica", e.target.value)} />
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Expectativas quanto à Avaliação</h3>
            <label className="label">O que o paciente/responsável espera compreender ou resolver com este processo avaliativo?</label>
            <textarea className="input" style={{ minHeight: '80px', marginBottom: '1rem' }} value={formData.expectativasAvaliacao} onChange={e => handleChange("expectativasAvaliacao", e.target.value)}></textarea>
            
            <label className="label">Há laudos, receituários ou documentos trazidos para anexar ao processo?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.documentosTrazidos} onChange={e => handleChange("documentosTrazidos", e.target.value)} />

            {formData.documentosAnexos && formData.documentosAnexos.length > 0 && (
              <div style={{ marginTop: '1.5rem', backgroundColor: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-mid)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📎 Documentos Anexados pelo Paciente
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: 0, listStyle: 'none' }}>
                  {formData.documentosAnexos.map((url: string, idx: number) => {
                    const fileName = url.split('/').pop()?.split('?')[0] || `Documento ${idx + 1}`;
                    return (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 500 }}
                        >
                          📄 {decodeURIComponent(fileName)}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
</div>

<div style={{ marginTop: "3rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn print-hide" onClick={saveAnamnese} disabled={saving} style={{ padding: "1rem 2rem" }}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

      </div>

      <div className="print-report">
        {patient && (
          <div className="print-header">
            <h1 style={{ fontSize: "16pt", margin: 0 }}>Anamnese Clínica - {patient.name}</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: "10px", fontSize: "10pt" }}>
              <div><strong>Código do Paciente:</strong> {patient.code || "-"}</div>
              <div><strong>Data de Nascimento:</strong> {patient.birthDate || "-"}</div>
              <div><strong>Responsável/Pais:</strong> {patient.guardianName || patient.parentsName || "-"}</div>
              <div><strong>Convênio:</strong> {patient.healthPlan || "-"}</div>
              <div><strong>Escolaridade:</strong> {patient.schoolGrade || "-"}</div>
              <div><strong>Data de Impressão:</strong> {new Date().toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
        )}

        <div className="print-section">
          <h2 className="print-title">Queixa Principal</h2>
          <div className="print-item"><span className="print-label">Queixa principal (suas próprias palavras):</span><span className="print-value">{formData.queixaPrincipal}</span></div>
          <div className="print-item"><span className="print-label">Desde quando foi notada? Início súbito ou insidioso?</span><span className="print-value">{formData.inicioSintomas}</span></div>
          <div className="print-item"><span className="print-label">Gatilho associado ao início:</span><span className="print-value">{formData.gatilhoInicio}</span></div>
          <div className="print-item"><span className="print-label">Progressão ao longo do tempo:</span><span className="print-value">{formData.progressao}</span></div>
          <div className="print-item"><span className="print-label">O que já melhorou/piorou:</span><span className="print-value">{formData.melhorouPiorou}</span></div>
          <div className="print-item"><span className="print-label">Áreas em que mais impacta:</span><span className="print-value">{formData.areasImpacto?.join(", ")}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">Desenvolvimento</h2>
          <div className="print-item"><span className="print-label">Gestação e Parto:</span><span className="print-value">{formData.gestacao?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Intercorrências gestacionais:</span><span className="print-value">{formData.intercorrenciasGestacao}</span></div>
          <div className="print-item"><span className="print-label">Peso e Apgar ao nascer:</span><span className="print-value">{formData.pesoApgar}</span></div>
          <div className="print-item"><span className="print-label">Marcos do desenvolvimento motor:</span><span className="print-value">{formData.marcosMotor}</span></div>
          <div className="print-item"><span className="print-label">Marcos da linguagem:</span><span className="print-value">{formData.marcosLinguagem}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">Escolar e Ocupacional</h2>
          <div className="print-item"><span className="print-label">Idade de ingresso escolar / adaptação inicial:</span><span className="print-value">{formData.idadeIngressoEscolar}</span></div>
          <div className="print-item"><span className="print-label">Histórico Escolar:</span><span className="print-value">{formData.historicoDesempenho?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Disciplinas de maior dificuldade:</span><span className="print-value">{formData.disciplinaDificuldade}</span></div>
          <div className="print-item"><span className="print-label">Cargo atual e tempo na função:</span><span className="print-value">{formData.cargoAtual}</span></div>
          <div className="print-item"><span className="print-label">Queixas no ambiente de trabalho:</span><span className="print-value">{formData.queixasTrabalho?.join(", ")}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">Médica e Psiquiátrica</h2>
          <div className="print-item"><span className="print-label">Condições médicas relevantes:</span><span className="print-value">{formData.condicoesMedicas?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Medicações em uso atual (nome, dose, tempo):</span><span className="print-value">{formData.medicacoesAtual}</span></div>
          <div className="print-item"><span className="print-label">Diagnósticos psiquiátricos prévios ou atuais:</span><span className="print-value">{formData.diagnosticosPsiquiatricos}</span></div>
          <div className="print-item"><span className="print-label">Histórico de psicoterapia:</span><span className="print-value">{formData.historicoPsicoterapia}</span></div>
          <div className="print-item"><span className="print-label">Uso de substâncias:</span><span className="print-value">{formData.usoSubstancias?.join(", ")}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">História Familiar</h2>
          <div className="print-item"><span className="print-label">Composição familiar / estrutura atual:</span><span className="print-value">{formData.composicaoFamiliar}</span></div>
          <div className="print-item"><span className="print-label">Antecedentes familiares:</span><span className="print-value">{formData.antecedentesFamiliares?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Detalhar grau de parentesco:</span><span className="print-value">{formData.grauParentescoAntecedentes}</span></div>
          <div className="print-item"><span className="print-label">Dinâmica familiar atual (conflitos, suporte):</span><span className="print-value">{formData.dinamicaFamiliar}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">Cognitiva, Emocional e Comportamental</h2>
          <div className="print-item"><span className="print-label">Dificuldade em manter foco:</span><span className="print-value">{formData.atencao?.manterFoco}</span></div>
          <div className="print-item"><span className="print-label">Distrai-se facilmente:</span><span className="print-value">{formData.atencao?.distraiFacilmente}</span></div>
          <div className="print-item"><span className="print-label">Dificuldade em planejar/organizar:</span><span className="print-value">{formData.funcoesExecutivas?.planejar}</span></div>
          <div className="print-item"><span className="print-label">Dificuldade em iniciar tarefas:</span><span className="print-value">{formData.funcoesExecutivas?.iniciarTarefas}</span></div>
          <div className="print-item"><span className="print-label">Esquecimento de eventos recentes:</span><span className="print-value">{formData.memoria?.esquecimentoEventos}</span></div>
          <div className="print-item"><span className="print-label">Repetição de assuntos:</span><span className="print-value">{formData.memoria?.repeticaoAssuntos}</span></div>
          
          <div className="print-item"><span className="print-label">Irritabilidade / Labilidade emocional:</span><span className="print-value">{formData.socioemocionais?.irritabilidade}</span></div>
          <div className="print-item"><span className="print-label">Ansiedade (antecipatória/generalizada):</span><span className="print-value">{formData.socioemocionais?.ansiedade}</span></div>
          <div className="print-item"><span className="print-label">Humor deprimido / Anedonia:</span><span className="print-value">{formData.socioemocionais?.humorDeprimido}</span></div>
          
          <div className="print-item"><span className="print-label">Estereotipias (movimentos/chacoalhos):</span><span className="print-value">{formData.estereotipias}</span></div>
          <div className="print-item"><span className="print-label">Comportamentos atípicos:</span><span className="print-value">{formData.comportamentosAtipicos}</span></div>
          
          <div className="print-item"><span className="print-label">Notas Adicionais do Profissional:</span><span className="print-value">{formData.autopercepcao}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">Rotina e Expectativas</h2>
          <div className="print-item"><span className="print-label">Horário de dormir e qualidade do sono:</span><span className="print-value">{formData.sonoHorario}</span></div>
          <div className="print-item"><span className="print-label">Padrão alimentar e apetite:</span><span className="print-value">{formData.padraoAlimentar}</span></div>
          <div className="print-item"><span className="print-label">Nível de atividade física:</span><span className="print-value">{formData.atividadeFisica}</span></div>
          <div className="print-item"><span className="print-label">Expectativas quanto à Avaliação:</span><span className="print-value">{formData.expectativasAvaliacao}</span></div>
          <div className="print-item"><span className="print-label">Documentos trazidos (Laudos, etc):</span><span className="print-value">{formData.documentosTrazidos}</span></div>
        </div>
      </div>
    </div>
  );
}
