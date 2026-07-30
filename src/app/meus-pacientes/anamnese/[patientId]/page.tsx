"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabase";
import { useReservation } from "../../../../context/ReservationContext";

export default function ProfissionalAnamnesePage({ params }: { params: { patientId: string } }) {
  const router = useRouter();
  const patientId = params.patientId;
  const { professional } = useReservation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState<any>(null);
  const [anamneseId, setAnamneseId] = useState<string | null>(null);
  const [anamneseDate, setAnamneseDate] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    queixaPrincipal: "", inicioSintomas: "", gatilhoInicio: "", progressao: "", contextosEvidente: "", melhorouPiorou: "", areasImpacto: [], areasImpactoOutro: "",
    gestacao: [], intercorrenciasGestacao: "", parto: [], pesoApgar: "", marcosMotor: "", marcosLinguagem: "", sensorialAlimentar: [],
    idadeIngressoEscolar: "", historicoDesempenho: [], disciplinaDificuldade: "", comportamentoSala: "", laudosAnteriores: "",
    cargoAtual: "", queixasTrabalho: [], historicoMudancasEmprego: "",
    condicoesMedicas: [], detalhesMedicos: "", cirurgiasPrevias: "", medicacoesAtual: "", examesRealizados: "", usoSubstancias: [], frequenciaSubstancias: "",
    diagnosticosPsiquiatricos: "", acompanhamentoAtual: "", historicoPsicoterapia: "", antecedentesRelevantes: [], detalhesAntecedentes: "",
    composicaoFamiliar: "", antecedentesFamiliares: [], grauParentescoAntecedentes: "", dinamicaFamiliar: "",
    atencao: {}, exemplosAtencao: "", funcoesExecutivas: {}, exemplosExecutivas: "", memoria: {}, dificuldadeAprenderEvocar: "", exemplosMemoria: "", linguagem: [], exemplosLinguagem: "", visuoconstrucao: [], praxias: [],
    socioemocionais: {}, estrategiasCoping: "", autopercepcao: "", estereotipias: "", comportamentosAtipicos: "",
    sonoHorario: "", alteracoesSono: [], padraoAlimentar: "", atividadeFisica: "",
    apoioTerceiros: [], detalhesApoio: "",
    expectativasAvaliacao: "", documentosTrazidos: "", documentosAnexos: []
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
      setAnamneseDate(anamData.created_at);
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

  const calculateAge = (birthDateString: string) => {
    if (!birthDateString) return "";
    const today = new Date();
    // try to handle DD/MM/YYYY or YYYY-MM-DD
    let birthDate;
    if (birthDateString.includes("/")) {
      const parts = birthDateString.split("/");
      if (parts.length === 3) {
        birthDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      } else {
        birthDate = new Date(birthDateString);
      }
    } else {
      birthDate = new Date(birthDateString);
    }
    
    if (isNaN(birthDate.getTime())) return "";

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return `${age} anos`;
  };

  const renderFrequenciaSelect = (category: string, field: string, label: string) => {
    const opcoes = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"];
    return (
      <div style={{ marginBottom: "1.2rem", paddingBottom: "1.2rem", borderBottom: "1px dashed var(--border-color)" }}>
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

  const renderGridCheckboxes = (field: string, options: string[], columns: number = 2) => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '0.5rem', marginBottom: '1rem' }}>
        {options.map(opt => (
          <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', lineHeight: '1.3' }}>
            <input type="checkbox" checked={formData[field]?.includes(opt)} onChange={() => handleCheckbox(field, opt)} style={{ marginTop: '0.2rem' }} />
            {opt}
          </label>
        ))}
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
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        body { background: white !important; color: black !important; font-size: 10pt !important; line-height: 1.6 !important; }
        .screen-only, header, nav, .navbar, .card, .btn { display: none !important; }
        .print-report { display: block !important; width: 100%; }
        .print-header { border-bottom: 2px solid black; padding-bottom: 15px; margin-bottom: 20px; }
        .print-title { font-size: 12pt; font-weight: bold; border-bottom: 1px solid #ddd; margin: -15px -15px 15px -15px; padding: 8px 15px; background: #f8f9fa !important; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        .print-item { margin-bottom: 8px; }
        .print-label { font-weight: bold; display: inline; margin-right: 5px; }
        .print-value { display: inline; }
        .print-section { page-break-inside: avoid; border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
        .allow-break { page-break-inside: auto !important; }
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
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>1. Queixa Principal e Histórico</h2>
            
            <label className="label">Queixa principal (verbatim do informante):</label>
            <textarea className="input" style={{ minHeight: '80px', marginBottom: '1rem' }} value={formData.queixaPrincipal} onChange={e => handleChange("queixaPrincipal", e.target.value)}></textarea>

            <label className="label">Desde quando foi notada? Início súbito ou insidioso?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.inicioSintomas} onChange={e => handleChange("inicioSintomas", e.target.value)} />

            <label className="label">Houve algum evento/gatilho associado ao início (doença, luto, mudança, trauma)?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.gatilhoInicio} onChange={e => handleChange("gatilhoInicio", e.target.value)} />
            
            <label className="label">A queixa é progressiva, estável ou flutuante ao longo do tempo?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.progressao} onChange={e => handleChange("progressao", e.target.value)} />

            <label className="label">Contextos em que a dificuldade é mais evidente (escola, trabalho, casa, social):</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.contextosEvidente} onChange={e => handleChange("contextosEvidente", e.target.value)} />

            <label className="label">O que já melhorou, piorou ou permaneceu igual desde o início?</label>
            <input className="input" style={{ marginBottom: '1.5rem' }} value={formData.melhorouPiorou} onChange={e => handleChange("melhorouPiorou", e.target.value)} />

            <label className="label">Áreas em que a queixa mais impacta (selecione as opções):</label>
            {renderGridCheckboxes("areasImpacto", [
              "Desempenho acadêmico", "Desempenho profissional", "Relações familiares", 
              "Relações sociais/amizades", "Autonomia para atividades diárias", "Regulação emocional", 
              "Sono", "Autoestima", "Outro"
            ])}
            {formData.areasImpacto?.includes("Outro") && (
              <input className="input" placeholder="Detalhe as outras áreas" style={{ marginBottom: '1rem' }} value={formData.areasImpactoOutro} onChange={e => handleChange("areasImpactoOutro", e.target.value)} />
            )}
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>2. História do Desenvolvimento</h2>
            
            <label className="label">Gestação:</label>
            {renderGridCheckboxes("gestacao", [
              "Planejada", "Não planejada", "Pré-natal regular", 
              "Intercorrências (infecções, uso de substâncias, medicações)", "Prematuridade", "A termo"
            ])}
            
            <label className="label">Detalhar intercorrências gestacionais, se houver:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.intercorrenciasGestacao} onChange={e => handleChange("intercorrenciasGestacao", e.target.value)}></textarea>
            
            <label className="label">Parto:</label>
            {renderGridCheckboxes("parto", [
              "Normal", "Cesárea", "Fórceps", "Necessidade de UTI neonatal", "Icterícia/outras intercorrências"
            ])}

            <label className="label">Peso e Apgar ao nascer (se disponível):</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.pesoApgar} onChange={e => handleChange("pesoApgar", e.target.value)} />
            
            <label className="label">Marcos do desenvolvimento motor (sustentar cabeça, sentar, engatinhar, andar) — idades:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.marcosMotor} onChange={e => handleChange("marcosMotor", e.target.value)} />

            <label className="label">Marcos da linguagem (primeiras palavras, frases, fluência) — idades:</label>
            <input className="input" style={{ marginBottom: '1.5rem' }} value={formData.marcosLinguagem} onChange={e => handleChange("marcosLinguagem", e.target.value)} />

            <label className="label">Desenvolvimento sensorial/alimentar na infância:</label>
            {renderGridCheckboxes("sensorialAlimentar", [
              "Seletividade/ restrição alimentar", "Hipersensibilidade a sons/texturas/luzes", "Atraso no controle esfincteriano", 
              "Distúrbio de sono precoce", "Sem alterações relatadas"
            ])}
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>3. História Escolar e Acadêmica</h2>
            
            <label className="label">Idade de ingresso escolar / adaptação inicial:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.idadeIngressoEscolar} onChange={e => handleChange("idadeIngressoEscolar", e.target.value)} />
            
            <label className="label">Histórico de desempenho:</label>
            {renderGridCheckboxes("historicoDesempenho", [
              "Repetência", "Necessidade de reforço escolar", "Encaminhamento anterior para AEE/psicopedagogia", 
              "Relatos de professores sobre desatenção", "Relatos de dificuldade de leitura/escrita", "Relatos de dificuldade em matemática", 
              "Bom desempenho geral", "Dificuldade específica em uma disciplina"
            ])}
            
            <label className="label">Disciplina(s) de maior dificuldade e natureza do erro:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.disciplinaDificuldade} onChange={e => handleChange("disciplinaDificuldade", e.target.value)} />

            <label className="label">Comportamento em sala de aula relatado por professores:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.comportamentoSala} onChange={e => handleChange("comportamentoSala", e.target.value)} />
            
            <label className="label">Já realizou avaliação prévia? Resultados/laudos:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.laudosAnteriores} onChange={e => handleChange("laudosAnteriores", e.target.value)}></textarea>
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>4. História Ocupacional</h2>

            <label className="label">Cargo atual e tempo na função:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.cargoAtual} onChange={e => handleChange("cargoAtual", e.target.value)} />

            <label className="label">Queixas no ambiente de trabalho:</label>
            {renderGridCheckboxes("queixasTrabalho", [
              "Dificuldade de organização/planejamento", "Esquecimentos frequentes", "Dificuldade de concentração em reuniões", 
              "Lentidão para concluir tarefas", "Conflitos interpessoais", "Absenteísmo", 
              "Quedas de produtividade recentes", "Sem queixas ocupacionais"
            ])}

            <label className="label">Histórico de mudanças/perdas de emprego relacionadas à queixa atual:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.historicoMudancasEmprego} onChange={e => handleChange("historicoMudancasEmprego", e.target.value)}></textarea>
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>5. História Médica e de Saúde Geral</h2>
            
            <label className="label">Condições médicas relevantes:</label>
            {renderGridCheckboxes("condicoesMedicas", [
              "Hipertensão", "Diabetes", "Dislipidemia", 
              "Cardiopatia", "Epilepsia/convulsões", "TCE (traumatismo cranioencefálico)", 
              "AVC/AIT", "Enxaqueca", "Distúrbios da tireoide", 
              "Apneia do sono", "Doença autoimune", "Nenhuma relatada"
            ], 3)}

            <label className="label">Detalhar diagnóstico, data e tratamento das condições marcadas acima:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.detalhesMedicos} onChange={e => handleChange("detalhesMedicos", e.target.value)}></textarea>

            <label className="label">Cirurgias prévias e complicações:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.cirurgiasPrevias} onChange={e => handleChange("cirurgiasPrevias", e.target.value)}></textarea>

            <label className="label">Medicações em uso atual (nome, dose, tempo):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.medicacoesAtual} onChange={e => handleChange("medicacoesAtual", e.target.value)}></textarea>

            <label className="label">Exames complementares já realizados (neuroimagem, EEG, laboratoriais):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.examesRealizados} onChange={e => handleChange("examesRealizados", e.target.value)}></textarea>
            
            <label className="label">Uso de substâncias:</label>
            {renderGridCheckboxes("usoSubstancias", [
              "Álcool", "Tabaco", "Outras substâncias psicoativas", "Nenhum uso relatado"
            ], 3)}

            <label className="label">Detalhar frequência, quantidade e tempo de uso:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.frequenciaSubstancias} onChange={e => handleChange("frequenciaSubstancias", e.target.value)} />
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>6. História Psiquiátrica e Psicoterapêutica</h2>
            
            <label className="label">Diagnósticos psiquiátricos prévios ou atuais:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.diagnosticosPsiquiatricos} onChange={e => handleChange("diagnosticosPsiquiatricos", e.target.value)}></textarea>

            <label className="label">Acompanhamento psiquiátrico atual:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.acompanhamentoAtual} onChange={e => handleChange("acompanhamentoAtual", e.target.value)}></textarea>

            <label className="label">Histórico de psicoterapia:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.historicoPsicoterapia} onChange={e => handleChange("historicoPsicoterapia", e.target.value)}></textarea>

            <label className="label">Antecedentes relevantes:</label>
            {renderGridCheckboxes("antecedentesRelevantes", [
              "Ideação suicida prévia", "Tentativa de suicídio prévia", "Automutilação", 
              "Internação psiquiátrica prévia", "Episódios de humor exaltado", "Episódios depressivos", 
              "Crises de ansiedade/pânico", "Sintomas psicóticos relatados", "Nenhum antecedente relevante"
            ], 3)}

            <label className="label">Detalhar antecedentes marcados acima:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.detalhesAntecedentes} onChange={e => handleChange("detalhesAntecedentes", e.target.value)}></textarea>
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>7. História Familiar</h2>
            
            <label className="label">Composição familiar / estrutura de convívio atual:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.composicaoFamiliar} onChange={e => handleChange("composicaoFamiliar", e.target.value)}></textarea>

            <label className="label">Antecedentes familiares (parentesco em 1º e 2º grau):</label>
            {renderGridCheckboxes("antecedentesFamiliares", [
              "TDAH", "TEA", "Deficiência intelectual", 
              "Transtornos de aprendizagem", "Transtornos de humor", "Transtornos de ansiedade", 
              "Esquizofrenia/psicose", "Demências", "Epilepsia", 
              "Uso abusivo de substâncias", "Nenhum antecedente relatado"
            ], 3)}

            <label className="label">Detalhar grau de parentesco e diagnóstico:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.grauParentescoAntecedentes} onChange={e => handleChange("grauParentescoAntecedentes", e.target.value)}></textarea>
            
            <label className="label">Dinâmica familiar atual:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.dinamicaFamiliar} onChange={e => handleChange("dinamicaFamiliar", e.target.value)}></textarea>
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>8. Investigação Dirigida por Função Cognitiva</h2>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>9.1 Atenção</h3>
            {renderFrequenciaSelect("atencao", "manterFoco", "Dificuldade em manter o foco em tarefas longas")}
            {renderFrequenciaSelect("atencao", "distraiFacilmente", "Distrai-se facilmente com estímulos externos")}
            {renderFrequenciaSelect("atencao", "cometeErros", "Comete erros por desatenção a detalhes")}
            {renderFrequenciaSelect("atencao", "alternarTarefas", "Dificuldade em alternar entre duas tarefas simultâneas")}
            <label className="label" style={{ marginTop: '0.5rem' }}>Exemplos concretos atencional:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.exemplosAtencao} onChange={e => handleChange("exemplosAtencao", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>9.2 Funções Executivas</h3>
            {renderFrequenciaSelect("funcoesExecutivas", "planejar", "Dificuldade em planejar e organizar atividades/rotina")}
            {renderFrequenciaSelect("funcoesExecutivas", "iniciarTarefas", "Dificuldade em iniciar tarefas (procrastinação)")}
            {renderFrequenciaSelect("funcoesExecutivas", "impulsividade", "Impulsividade em decisões ou falas")}
            {renderFrequenciaSelect("funcoesExecutivas", "rigidez", "Rigidez/dificuldade em se adaptar a mudanças de plano")}
            {renderFrequenciaSelect("funcoesExecutivas", "autoMonitorar", "Dificuldade em auto monitorar erros durante uma tarefa")}
            <label className="label" style={{ marginTop: '0.5rem' }}>Exemplos concretos executiva:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.exemplosExecutivas} onChange={e => handleChange("exemplosExecutivas", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>9.3 Memória</h3>
            {renderFrequenciaSelect("memoria", "esquecimentoCompromissos", "Esquecimento de compromissos/combinados (memória prospectiva)")}
            {renderFrequenciaSelect("memoria", "lembrarEventos", "Dificuldade em lembrar eventos recentes (memória episódica)")}
            {renderFrequenciaSelect("memoria", "repeticaoPerguntas", "Repetição de perguntas/assuntos já conversados")}
            {renderFrequenciaSelect("memoria", "reterInstrucoes", "Dificuldade em reter instruções recém-dadas (memória operacional)")}
            <label className="label" style={{ marginTop: '0.5rem' }}>A dificuldade é mais para aprender informação nova ou para evocar o que já foi aprendido?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.dificuldadeAprenderEvocar} onChange={e => handleChange("dificuldadeAprenderEvocar", e.target.value)} />
            <label className="label">Exemplos concretos de memória:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.exemplosMemoria} onChange={e => handleChange("exemplosMemoria", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>9.4 Linguagem</h3>
            {renderGridCheckboxes("linguagem", [
              "Dificuldade em encontrar palavras (anomia)", "Trocas fonológicas na fala", "Gagueira/disfluência", 
              "Dificuldade de compreensão de instruções verbais complexas", "Dificuldade em leitura", "Dificuldade em escrita/ortografia", 
              "Sem queixas de linguagem"
            ])}
            <label className="label" style={{ marginTop: '0.5rem' }}>Detalhar exemplos de linguagem:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.exemplosLinguagem} onChange={e => handleChange("exemplosLinguagem", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>9.5 Visuoconstrução e Habilidades Visuoespaciais</h3>
            {renderGridCheckboxes("visuoconstrucao", [
              "Dificuldade de orientação espacial/direção", "Dificuldade em desenhar/copiar figuras", "Dificuldade em montar quebra-cabeças ou objetos", 
              "Dificuldade em estimar distâncias/tamanhos", "Sem queixas visuoespaciais"
            ])}

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', marginTop: '2rem' }}>9.6 Praxias e Coordenação Motora</h3>
            {renderGridCheckboxes("praxias", [
              "Dificuldade em coordenação motora fina (escrita, botões)", "Desajeitamento motor global", "Dificuldade em imitar gestos/sequências motoras", 
              "Sem queixas motoras/práxicas"
            ])}
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>9. Aspectos Socioemocionais, Comportamentais e de Personalidade</h2>
            
            {renderFrequenciaSelect("socioemocionais", "irritabilidade", "Irritabilidade/labilidade emocional")}
            {renderFrequenciaSelect("socioemocionais", "ansiedade", "Ansiedade antecipatória ou generalizada")}
            {renderFrequenciaSelect("socioemocionais", "humorDeprimido", "Humor deprimido/anedonia")}
            {renderFrequenciaSelect("socioemocionais", "isolamento", "Isolamento social")}
            {renderFrequenciaSelect("socioemocionais", "interpretarSinais", "Dificuldade em interpretar sinais sociais/nuances (ex.: ironia, expressões faciais)")}
            {renderFrequenciaSelect("socioemocionais", "rigidezInteresses", "Rigidez de interesses/rotinas ou interesses restritos e intensos")}

            <label className="label" style={{ marginTop: '0.5rem' }}>Estratégias de enfrentamento (coping) habitualmente utilizadas:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.estrategiasCoping} onChange={e => handleChange("estrategiasCoping", e.target.value)}></textarea>

            <label className="label">Autopercepção do paciente sobre suas dificuldades e pontos fortes:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.autopercepcao} onChange={e => handleChange("autopercepcao", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>Perguntas Adicionais</h3>
            <label className="label">O paciente apresenta estereotipias?</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.estereotipias} onChange={e => handleChange("estereotipias", e.target.value)}></textarea>

            <label className="label">O paciente apresenta comportamentos atípicos?</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.comportamentosAtipicos} onChange={e => handleChange("comportamentosAtipicos", e.target.value)}></textarea>
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>10. Sono, Alimentação e Hábitos</h2>
            
            <label className="label">Horário habitual de dormir/acordar e qualidade percebida do sono:</label>
            <input className="input" style={{ marginBottom: '1.5rem' }} value={formData.sonoHorario} onChange={e => handleChange("sonoHorario", e.target.value)} />
            
            <label className="label">Alterações do sono:</label>
            {renderGridCheckboxes("alteracoesSono", [
              "Insônia inicial", "Despertares noturnos", "Sonolência diurna excessiva", 
              "Ronco/apneia relatada", "Pesadelos/parassonias", "Sono preservado"
            ], 3)}
            
            <label className="label" style={{ marginTop: '1.5rem' }}>Padrão alimentar e apetite (alterações recentes):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.padraoAlimentar} onChange={e => handleChange("padraoAlimentar", e.target.value)}></textarea>
            
            <label className="label">Nível de atividade física habitual:</label>
            <input className="input" style={{ marginBottom: '1.5rem' }} value={formData.atividadeFisica} onChange={e => handleChange("atividadeFisica", e.target.value)} />
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>11. Rotina, Autonomia e Atividades de Vida Diária</h2>
            
            <label className="label">Necessita de apoio de terceiros para:</label>
            {renderGridCheckboxes("apoioTerceiros", [
              "Higiene pessoal", "Alimentação", "Administração de medicações", 
              "Administração financeira", "Uso de transporte", "Gestão de compromissos/agenda", 
              "Tarefas domésticas", "Nenhum apoio necessário"
            ], 3)}
            
            <label className="label" style={{ marginTop: '1.5rem' }}>Detalhar o tipo e a frequência do apoio necessário nos itens marcados:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.detalhesApoio} onChange={e => handleChange("detalhesApoio", e.target.value)}></textarea>
          </section>

          <section>
            <h2 className="print-title" style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>12. Expectativas quanto à Avaliação</h2>
            
            <label className="label">O que o paciente/responsável espera compreender ou resolver com este processo avaliativo?</label>
            <textarea className="input" style={{ minHeight: '80px', marginBottom: '1.5rem' }} value={formData.expectativasAvaliacao} onChange={e => handleChange("expectativasAvaliacao", e.target.value)}></textarea>
            
            <label className="label">Há laudos, receituários ou documentos escolares/profissionais trazidos para anexar ao processo?</label>
            <input className="input" style={{ marginBottom: '1.5rem' }} value={formData.documentosTrazidos} onChange={e => handleChange("documentosTrazidos", e.target.value)} />
            
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: "10px", fontSize: "10pt", gap: "5px" }}>
              <div><strong>Código do Paciente:</strong> {patient.code || "-"}</div>
              <div>
                <strong>Data de Nascimento:</strong> {patient.birthDate ? `${patient.birthDate} ${calculateAge(patient.birthDate) ? `(${calculateAge(patient.birthDate)})` : ''}` : "-"}
              </div>
              <div><strong>Responsável/Pais:</strong> {patient.guardianName || patient.parentsName || "-"}</div>
              <div>
                <strong>Convênio:</strong> {patient.healthPlan || "-"}
                {patient.healthPlanNumber ? ` (Carteirinha: ${patient.healthPlanNumber})` : ""}
              </div>
              <div><strong>Escolaridade:</strong> {patient.schoolGrade || "-"}</div>
              <div><strong>Data da Sessão:</strong> {anamneseDate ? new Date(anamneseDate).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}</div>
              {professional && (
                <div style={{ gridColumn: "span 2" }}><strong>Profissional Atendente:</strong> {professional.name}</div>
              )}
            </div>
          </div>
        )}

        <div className="print-section">
          <h2 className="print-title">1. Queixa Principal e Histórico da Queixa</h2>
          <div className="print-item"><span className="print-label">Queixa principal:</span><span className="print-value">{formData.queixaPrincipal}</span></div>
          <div className="print-item"><span className="print-label">Desde quando foi notada? Início súbito ou insidioso?</span><span className="print-value">{formData.inicioSintomas}</span></div>
          <div className="print-item"><span className="print-label">Gatilho associado ao início:</span><span className="print-value">{formData.gatilhoInicio}</span></div>
          <div className="print-item"><span className="print-label">Progressão ao longo do tempo:</span><span className="print-value">{formData.progressao}</span></div>
          <div className="print-item"><span className="print-label">Contextos em que a dificuldade é mais evidente:</span><span className="print-value">{formData.contextosEvidente}</span></div>
          <div className="print-item"><span className="print-label">O que já melhorou/piorou:</span><span className="print-value">{formData.melhorouPiorou}</span></div>
          <div className="print-item"><span className="print-label">Áreas em que mais impacta:</span><span className="print-value">{formData.areasImpacto?.join(", ")} {formData.areasImpactoOutro ? `(${formData.areasImpactoOutro})` : ''}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">2. História do Desenvolvimento</h2>
          <div className="print-item"><span className="print-label">Gestação:</span><span className="print-value">{formData.gestacao?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Intercorrências gestacionais:</span><span className="print-value">{formData.intercorrenciasGestacao}</span></div>
          <div className="print-item"><span className="print-label">Parto:</span><span className="print-value">{formData.parto?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Peso e Apgar ao nascer:</span><span className="print-value">{formData.pesoApgar}</span></div>
          <div className="print-item"><span className="print-label">Marcos do desenvolvimento motor:</span><span className="print-value">{formData.marcosMotor}</span></div>
          <div className="print-item"><span className="print-label">Marcos da linguagem:</span><span className="print-value">{formData.marcosLinguagem}</span></div>
          <div className="print-item"><span className="print-label">Desenvolvimento sensorial/alimentar:</span><span className="print-value">{formData.sensorialAlimentar?.join(", ")}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">3. História Escolar e Acadêmica</h2>
          <div className="print-item"><span className="print-label">Idade de ingresso escolar / adaptação inicial:</span><span className="print-value">{formData.idadeIngressoEscolar}</span></div>
          <div className="print-item"><span className="print-label">Histórico de desempenho:</span><span className="print-value">{formData.historicoDesempenho?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Disciplinas de maior dificuldade:</span><span className="print-value">{formData.disciplinaDificuldade}</span></div>
          <div className="print-item"><span className="print-label">Comportamento em sala de aula:</span><span className="print-value">{formData.comportamentoSala}</span></div>
          <div className="print-item"><span className="print-label">Avaliação prévia/laudos anteriores:</span><span className="print-value">{formData.laudosAnteriores}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">4. História Ocupacional (Trabalho)</h2>
          <div className="print-item"><span className="print-label">Cargo atual e tempo na função:</span><span className="print-value">{formData.cargoAtual}</span></div>
          <div className="print-item"><span className="print-label">Queixas no ambiente de trabalho:</span><span className="print-value">{formData.queixasTrabalho?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Histórico de mudanças/perdas de emprego:</span><span className="print-value">{formData.historicoMudancasEmprego}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">5. História Médica e de Saúde Geral</h2>
          <div className="print-item"><span className="print-label">Condições médicas relevantes:</span><span className="print-value">{formData.condicoesMedicas?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Detalhes médicos:</span><span className="print-value">{formData.detalhesMedicos}</span></div>
          <div className="print-item"><span className="print-label">Cirurgias prévias:</span><span className="print-value">{formData.cirurgiasPrevias}</span></div>
          <div className="print-item"><span className="print-label">Medicações em uso atual:</span><span className="print-value">{formData.medicacoesAtual}</span></div>
          <div className="print-item"><span className="print-label">Exames complementares:</span><span className="print-value">{formData.examesRealizados}</span></div>
          <div className="print-item"><span className="print-label">Uso de substâncias:</span><span className="print-value">{formData.usoSubstancias?.join(", ")} ({formData.frequenciaSubstancias})</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">6. História Psiquiátrica e Psicoterapêutica</h2>
          <div className="print-item"><span className="print-label">Diagnósticos psiquiátricos:</span><span className="print-value">{formData.diagnosticosPsiquiatricos}</span></div>
          <div className="print-item"><span className="print-label">Acompanhamento psiquiátrico atual:</span><span className="print-value">{formData.acompanhamentoAtual}</span></div>
          <div className="print-item"><span className="print-label">Histórico de psicoterapia:</span><span className="print-value">{formData.historicoPsicoterapia}</span></div>
          <div className="print-item"><span className="print-label">Antecedentes relevantes:</span><span className="print-value">{formData.antecedentesRelevantes?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Detalhar antecedentes:</span><span className="print-value">{formData.detalhesAntecedentes}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">7. História Familiar</h2>
          <div className="print-item"><span className="print-label">Composição familiar / estrutura de convívio:</span><span className="print-value">{formData.composicaoFamiliar}</span></div>
          <div className="print-item"><span className="print-label">Antecedentes familiares (1º e 2º grau):</span><span className="print-value">{formData.antecedentesFamiliares?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Detalhar parentesco e diagnóstico:</span><span className="print-value">{formData.grauParentescoAntecedentes}</span></div>
          <div className="print-item"><span className="print-label">Dinâmica familiar atual:</span><span className="print-value">{formData.dinamicaFamiliar}</span></div>
        </div>

        <div className="print-section allow-break">
          <h2 className="print-title">8. Investigação Dirigida por Função Cognitiva</h2>
          <div className="print-item"><span className="print-label">Atenção - Dificuldade em manter o foco:</span><span className="print-value">{formData.atencao?.manterFoco}</span></div>
          <div className="print-item"><span className="print-label">Atenção - Distrai-se facilmente:</span><span className="print-value">{formData.atencao?.distraiFacilmente}</span></div>
          <div className="print-item"><span className="print-label">Atenção - Comete erros por desatenção:</span><span className="print-value">{formData.atencao?.cometeErros}</span></div>
          <div className="print-item"><span className="print-label">Atenção - Dificuldade em alternar tarefas:</span><span className="print-value">{formData.atencao?.alternarTarefas}</span></div>
          <div className="print-item"><span className="print-label">Exemplos Atencional:</span><span className="print-value">{formData.exemplosAtencao}</span></div>
          <br/>
          <div className="print-item"><span className="print-label">F. Executivas - Planejar atividades/rotina:</span><span className="print-value">{formData.funcoesExecutivas?.planejar}</span></div>
          <div className="print-item"><span className="print-label">F. Executivas - Iniciar tarefas (procrastinação):</span><span className="print-value">{formData.funcoesExecutivas?.iniciarTarefas}</span></div>
          <div className="print-item"><span className="print-label">F. Executivas - Impulsividade em decisões:</span><span className="print-value">{formData.funcoesExecutivas?.impulsividade}</span></div>
          <div className="print-item"><span className="print-label">F. Executivas - Rigidez/adaptação a mudanças:</span><span className="print-value">{formData.funcoesExecutivas?.rigidez}</span></div>
          <div className="print-item"><span className="print-label">F. Executivas - Auto monitorar erros:</span><span className="print-value">{formData.funcoesExecutivas?.autoMonitorar}</span></div>
          <div className="print-item"><span className="print-label">Exemplos Executivas:</span><span className="print-value">{formData.exemplosExecutivas}</span></div>
          <br/>
          <div className="print-item"><span className="print-label">Memória - Esquecimento de compromissos:</span><span className="print-value">{formData.memoria?.esquecimentoCompromissos}</span></div>
          <div className="print-item"><span className="print-label">Memória - Lembrar eventos recentes:</span><span className="print-value">{formData.memoria?.lembrarEventos}</span></div>
          <div className="print-item"><span className="print-label">Memória - Repetição de assuntos:</span><span className="print-value">{formData.memoria?.repeticaoPerguntas}</span></div>
          <div className="print-item"><span className="print-label">Memória - Reter instruções recém-dadas:</span><span className="print-value">{formData.memoria?.reterInstrucoes}</span></div>
          <div className="print-item"><span className="print-label">Dificuldade é aprender ou evocar?</span><span className="print-value">{formData.dificuldadeAprenderEvocar}</span></div>
          <div className="print-item"><span className="print-label">Exemplos Memória:</span><span className="print-value">{formData.exemplosMemoria}</span></div>
          <br/>
          <div className="print-item"><span className="print-label">Linguagem:</span><span className="print-value">{formData.linguagem?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Exemplos Linguagem:</span><span className="print-value">{formData.exemplosLinguagem}</span></div>
          <br/>
          <div className="print-item"><span className="print-label">Visuoconstrução e Visuoespacial:</span><span className="print-value">{formData.visuoconstrucao?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Praxias e Coordenação Motora:</span><span className="print-value">{formData.praxias?.join(", ")}</span></div>
        </div>

        <div className="print-section allow-break">
          <h2 className="print-title">9. Aspectos Socioemocionais, Comportamentais e de Personalidade</h2>
          <div className="print-item"><span className="print-label">Irritabilidade / Labilidade emocional:</span><span className="print-value">{formData.socioemocionais?.irritabilidade}</span></div>
          <div className="print-item"><span className="print-label">Ansiedade (antecipatória/generalizada):</span><span className="print-value">{formData.socioemocionais?.ansiedade}</span></div>
          <div className="print-item"><span className="print-label">Humor deprimido / Anedonia:</span><span className="print-value">{formData.socioemocionais?.humorDeprimido}</span></div>
          <div className="print-item"><span className="print-label">Isolamento social:</span><span className="print-value">{formData.socioemocionais?.isolamento}</span></div>
          <div className="print-item"><span className="print-label">Dificuldade interpretar sinais sociais:</span><span className="print-value">{formData.socioemocionais?.interpretarSinais}</span></div>
          <div className="print-item"><span className="print-label">Rigidez de interesses/rotinas:</span><span className="print-value">{formData.socioemocionais?.rigidezInteresses}</span></div>
          <div className="print-item"><span className="print-label">Estratégias de enfrentamento (coping):</span><span className="print-value">{formData.estrategiasCoping}</span></div>
          <div className="print-item"><span className="print-label">Autopercepção das dificuldades:</span><span className="print-value">{formData.autopercepcao}</span></div>
          <div className="print-item"><span className="print-label">Estereotipias (movimentos com o corpo):</span><span className="print-value">{formData.estereotipias}</span></div>
          <div className="print-item"><span className="print-label">Comportamentos atípicos:</span><span className="print-value">{formData.comportamentosAtipicos}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">10. Sono, Alimentação e Hábitos</h2>
          <div className="print-item"><span className="print-label">Horário de dormir/acordar e qualidade:</span><span className="print-value">{formData.sonoHorario}</span></div>
          <div className="print-item"><span className="print-label">Alterações do sono:</span><span className="print-value">{formData.alteracoesSono?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Padrão alimentar e apetite:</span><span className="print-value">{formData.padraoAlimentar}</span></div>
          <div className="print-item"><span className="print-label">Nível de atividade física:</span><span className="print-value">{formData.atividadeFisica}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">11. Rotina, Autonomia e Atividades de Vida Diária</h2>
          <div className="print-item"><span className="print-label">Necessita de apoio de terceiros para:</span><span className="print-value">{formData.apoioTerceiros?.join(", ")}</span></div>
          <div className="print-item"><span className="print-label">Detalhes da frequência do apoio:</span><span className="print-value">{formData.detalhesApoio}</span></div>
        </div>

        <div className="print-section">
          <h2 className="print-title">12. Expectativas quanto à Avaliação</h2>
          <div className="print-item"><span className="print-label">Expectativas:</span><span className="print-value">{formData.expectativasAvaliacao}</span></div>
          <div className="print-item"><span className="print-label">Documentos trazidos:</span><span className="print-value">{formData.documentosTrazidos}</span></div>
        </div>

      </div>
    </div>
  );
}
