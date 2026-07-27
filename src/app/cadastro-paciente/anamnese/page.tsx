"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const SECTIONS = [
  "Termo de Sigilo",
  "Queixa Principal e Histórico da Queixa",
  "História do Desenvolvimento (Gestação, parto e primeira infância)",
  "História Escolar e Acadêmica",
  "História Ocupacional",
  "História Médica e de Saúde Geral",
  "História Psiquiátrica e Psicoterapêutica",
  "História Familiar",
  "Investigação Dirigida por Função Cognitiva",
  "Aspectos Socioemocionais, Comportamentais e Personalidade",
  "Sono, Alimentação e Hábitos",
  "Rotina, Autonomia e Atividades de Vida Diária",
  "Expectativas quanto à Avaliação"
];

function AnamneseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Estado unificado para todas as respostas
  const [formData, setFormData] = useState<any>({
    // 1. Queixa Principal e Histórico da Queixa
    queixaPrincipal: "",
    inicioSintomas: "",
    gatilhoInicio: "",
    progressao: "",
    contextosEvidente: "",
    melhorouPiorou: "",
    areasImpacto: [], // Desempenho acadêmico, Desempenho profissional, Relações familiares, Relações sociais/amizades, Autonomia para AVDs, Regulação emocional, Sono, Autoestima, Outro
    areasImpactoOutro: "",

    // 2. História do Desenvolvimento
    gestacao: [], // Planejada, Não planejada, Pré-natal regular, Intercorrências (infecções, uso de substâncias, medicações), Prematuridade, A termo
    intercorrenciasGestacao: "",
    parto: [], // Normal, Cesárea, Fórceps, Necessidade de UTI neonatal, Icterícia/outras intercorrências
    pesoApgar: "",
    marcosMotor: "",
    marcosLinguagem: "",
    sensorialAlimentar: [], // Seletividade/ restrição alimentar, Hipersensibilidade a sons/texturas/luzes, Atraso no controle esfincteriano, Distúrbio de sono precoce, Sem alterações relatadas
    
    // 3. História Escolar e Acadêmica
    idadeIngressoEscolar: "",
    historicoDesempenho: [], // Repetência, Necessidade de reforço escolar, Encaminhamento anterior para AEE/psicopedagogia, Relatos de professores sobre desatenção, Relatos de dificuldade de leitura/escrita, Relatos de dificuldade em matemática, Bom desempenho geral, Dificuldade específica em uma disciplina
    disciplinaDificuldade: "",
    comportamentoSala: "",
    laudosAnteriores: "",
    
    // 4. História Ocupacional
    cargoAtual: "",
    queixasTrabalho: [], // Dificuldade de organização/planejamento, Esquecimentos frequentes, Dificuldade de concentração em reuniões, Lentidão para concluir tarefas, Conflitos interpessoais, Absenteísmo, Quedas de produtividade recentes, Sem queixas ocupacionais
    historicoMudancasEmprego: "",
    
    // 5. História Médica e de Saúde Geral
    condicoesMedicas: [], // Hipertensão, Diabetes, Dislipidemia, Cardiopatia, Epilepsia/convulsões, TCE (traumatismo cranioencefálico), AVC/AIT, Enxaqueca, Distúrbios da tireoide, Apneia do sono, Doença autoimune, Nenhuma relatada
    detalhesMedicos: "",
    cirurgiasPrevias: "",
    medicacoesAtual: "",
    examesRealizados: "",
    usoSubstancias: [], // Álcool, Tabaco, Outras substâncias psicoativas, Nenhum uso relatado
    frequenciaSubstancias: "",
    
    // 6. História Psiquiátrica e Psicoterapêutica
    diagnosticosPsiquiatricos: "",
    acompanhamentoAtual: "",
    historicoPsicoterapia: "",
    antecedentesRelevantes: [], // Ideação suicida prévia, Tentativa de suicídio prévia, Automutilação, Internação psiquiátrica prévia, Episódios de humor exaltado, Episódios depressivos, Crises de ansiedade/pânico, Sintomas psicóticos relatados, Nenhum antecedente relevante
    detalhesAntecedentes: "",
    
    // 7. História Familiar
    composicaoFamiliar: "",
    antecedentesFamiliares: [], // TDAH, TEA, Deficiência intelectual, Transtornos de aprendizagem, Transtornos de humor, Transtornos de ansiedade, Esquizofrenia/psicose, Demências, Epilepsia, Uso abusivo de substâncias, Nenhum antecedente relatado
    grauParentescoAntecedentes: "",
    dinamicaFamiliar: "",
    
    // 8. Investigação Dirigida por Função Cognitiva
    atencao: {}, // manterFoco, distraiFacilmente, cometeErros, alternarTarefas
    exemplosAtencao: "",
    funcoesExecutivas: {}, // planejar, iniciarTarefas, impulsividade, rigidez, autoMonitorar
    exemplosExecutivas: "",
    memoria: {}, // esquecimentoCompromissos, lembrarEventos, repeticaoPerguntas, reterInstrucoes
    dificuldadeAprenderEvocar: "",
    exemplosMemoria: "",
    linguagem: [], // anomia, trocasFonologicas, gagueira, compreensao, leitura, escrita, semQueixas
    exemplosLinguagem: "",
    visuoconstrucao: [], // orientacaoEspacial, desenhar, montar, estimar, semQueixas
    praxias: [], // coordenacaoFina, desajeitamentoGlobal, imitarGestos, semQueixas
    
    // 9. Aspectos Socioemocionais, Comportamentais e de Personalidade
    socioemocionais: {}, // irritabilidade, ansiedade, humorDeprimido, isolamento, interpretarSinais, rigidezInteresses
    estrategiasCoping: "",
    autopercepcao: "",
    estereotipias: "", // CUSTOM
    comportamentosAtipicos: "", // CUSTOM
    
    // 10. Sono, Alimentação e Hábitos
    sonoHorario: "",
    alteracoesSono: [], // Insônia inicial, Despertares noturnos, Sonolência diurna excessiva, Ronco/apneia relatada, Pesadelos/parassonias, Sono preservado
    padraoAlimentar: "",
    atividadeFisica: "",
    
    // 11. Rotina, Autonomia e Atividades de Vida Diária
    apoioTerceiros: [], // Higiene pessoal, Alimentação, Administração de medicações, Administração financeira, Uso de transporte, Gestão de compromissos/agenda, Tarefas domésticas, Nenhum apoio necessário
    detalhesApoio: "",
    
    // 12. Expectativas quanto à Avaliação
    expectativasAvaliacao: "",
    documentosTrazidos: ""
  });

  useEffect(() => {
    if (!patientId) {
      setError("ID do paciente não fornecido. Por favor, acesse através do formulário de cadastro.");
    }
  }, [patientId]);

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
    if (!patientId) return;
    setLoading(true);
    setError("");
    
    let uploadedUrls: string[] = [];
    
    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${patientId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${patientId}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('patient-documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error("Erro no upload do arquivo:", file.name, uploadError);
        } else if (data) {
          const { data: urlData } = supabase.storage.from('patient-documents').getPublicUrl(filePath);
          uploadedUrls.push(urlData.publicUrl);
        }
      }
    }

    const finalFormData = {
      ...formData,
      documentosAnexos: uploadedUrls
    };
    
    const { error: dbError } = await supabase
      .from("anamneses")
      .insert([{ patient_id: patientId, responses: finalFormData }]);

    setLoading(false);
    if (dbError) {
      setError("Erro ao salvar a anamnese. Tente novamente.");
      console.error(dbError);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div className="card animate-fade" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginBottom: '1rem' }}>Anamnese Concluída!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Muito obrigado por preencher todas as informações. Elas serão fundamentais para o seu atendimento.
          </p>
          <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>
            Agora você pode fechar essa tela.
          </p>
        </div>
      </div>
    );
  }

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
        {options.map(opt => (
          <label key={opt} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', lineHeight: '1.3' }}>
            <input type="checkbox" checked={formData[field]?.includes(opt)} onChange={() => handleCheckbox(field, opt)} style={{ marginTop: '0.2rem', flexShrink: 0 }} />
            <span style={{ wordBreak: 'break-word' }}>{opt}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="card animate-slide" style={{ maxWidth: '800px', width: '100%', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        
        {/* PROGRESS BAR */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Passo {currentStep + 1} de {SECTIONS.length}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>{SECTIONS[currentStep]}</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: 'var(--primary)', width: `${((currentStep + 1) / SECTIONS.length) * 100}%`, transition: 'width 0.3s ease' }}></div>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* STEP 0: Sigilo */}
        {currentStep === 0 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Bem-vindo à sua Anamnese</h2>
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-mid)', marginBottom: '2rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                🔒 Termo de Sigilo e Confidencialidade
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Todas as informações fornecidas neste formulário são estritamente sigilosas. Os dados coletados serão utilizados única e exclusivamente para fins de avaliação clínica e planejamento terapêutico, sob o rigoroso sigilo profissional. Responda com a maior precisão possível.
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: Queixa Principal */}
        {currentStep === 1 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[1]}</h2>
            
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
          </div>
        )}

        {/* STEP 2: Desenvolvimento */}
        {currentStep === 2 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{SECTIONS[2]}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Preencher quando aplicável (avaliação de crianças/adolescentes ou suspeita de condição de neurodesenvolvimento em adultos, por relato retrospectivo).</p>
            
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
          </div>
        )}

        {/* STEP 3: Histórico Escolar */}
        {currentStep === 3 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[3]}</h2>
            
            <label className="label">Idade de ingresso escolar / adaptação inicial:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.idadeIngressoEscolar} onChange={e => handleChange("idadeIngressoEscolar", e.target.value)} />
            
            <label className="label">Histórico de desempenho:</label>
            {renderGridCheckboxes("historicoDesempenho", [
              "Repetência", "Necessidade de reforço escolar", "Encaminhamento anterior para AEE/psicopedagogia", 
              "Relatos de professores sobre desatenção", "Relatos de dificuldade de leitura/escrita", "Relatos de dificuldade em matemática", 
              "Bom desempenho geral", "Dificuldade específica em uma disciplina"
            ])}
            
            <label className="label">Disciplina(s) de maior dificuldade e natureza do erro (ex.: troca de letras, lentidão, esquecimento de regras):</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.disciplinaDificuldade} onChange={e => handleChange("disciplinaDificuldade", e.target.value)} />

            <label className="label">Comportamento em sala de aula relatado por professores (agitação, dispersão, isolamento, oposição):</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.comportamentoSala} onChange={e => handleChange("comportamentoSala", e.target.value)} />
            
            <label className="label">Já realizou avaliação psicopedagógica, fonoaudiológica ou neuropsicológica prévia? Resultados/laudos anteriores:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.laudosAnteriores} onChange={e => handleChange("laudosAnteriores", e.target.value)}></textarea>
          </div>
        )}

        {/* STEP 4: Histórico Ocupacional */}
        {currentStep === 4 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{SECTIONS[4]}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>(quando aplicável)</p>
            
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
          </div>
        )}

        {/* STEP 5: Médica e Psiquiátrica */}
        {currentStep === 5 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[5]}</h2>
            
            <label className="label">Condições médicas relevantes:</label>
            {renderGridCheckboxes("condicoesMedicas", [
              "Hipertensão", "Diabetes", "Dislipidemia", 
              "Cardiopatia", "Epilepsia/convulsões", "TCE (traumatismo cranioencefálico)", 
              "AVC/AIT", "Enxaqueca", "Distúrbios da tireoide", 
              "Apneia do sono", "Doença autoimune", "Nenhuma relatada"
            ], 3)}

            <label className="label">Detalhar diagnóstico, data e tratamento das condições marcadas acima:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.detalhesMedicos} onChange={e => handleChange("detalhesMedicos", e.target.value)}></textarea>

            <label className="label">Cirurgias prévias (especialmente com anestesia geral) e complicações:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.cirurgiasPrevias} onChange={e => handleChange("cirurgiasPrevias", e.target.value)}></textarea>

            <label className="label">Medicações em uso atual (nome, dose, tempo de uso) — atenção a fármacos com efeito cognitivo:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.medicacoesAtual} onChange={e => handleChange("medicacoesAtual", e.target.value)}></textarea>

            <label className="label">Exames complementares já realizados (neuroimagem, EEG, laboratoriais) e resultados, se conhecidos:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.examesRealizados} onChange={e => handleChange("examesRealizados", e.target.value)}></textarea>
            
            <label className="label">Uso de substâncias:</label>
            {renderGridCheckboxes("usoSubstancias", [
              "Álcool", "Tabaco", "Outras substâncias psicoativas", "Nenhum uso relatado"
            ], 3)}

            <label className="label">Detalhar frequência, quantidade e tempo de uso:</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.frequenciaSubstancias} onChange={e => handleChange("frequenciaSubstancias", e.target.value)} />
          </div>
        )}

        {/* STEP 6: História Psiquiátrica */}
        {currentStep === 6 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[6]}</h2>
            
            <label className="label">Diagnósticos psiquiátricos prévios ou atuais (autorrelato/laudo):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.diagnosticosPsiquiatricos} onChange={e => handleChange("diagnosticosPsiquiatricos", e.target.value)}></textarea>

            <label className="label">Acompanhamento psiquiátrico atual (profissional, tempo, medicação psicotrópica em uso):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.acompanhamentoAtual} onChange={e => handleChange("acompanhamentoAtual", e.target.value)}></textarea>

            <label className="label">Histórico de psicoterapia (abordagem, tempo, motivo de início/término):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.historicoPsicoterapia} onChange={e => handleChange("historicoPsicoterapia", e.target.value)}></textarea>

            <label className="label">Antecedentes relevantes:</label>
            {renderGridCheckboxes("antecedentesRelevantes", [
              "Ideação suicida prévia", "Tentativa de suicídio prévia", "Automutilação", 
              "Internação psiquiátrica prévia", "Episódios de humor exaltado", "Episódios depressivos", 
              "Crises de ansiedade/pânico", "Sintomas psicóticos relatados", "Nenhum antecedente relevante"
            ], 3)}

            <label className="label">Detalhar antecedentes marcados acima (datas, contexto, desfecho):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.detalhesAntecedentes} onChange={e => handleChange("detalhesAntecedentes", e.target.value)}></textarea>
          </div>
        )}

        {/* STEP 7: História Familiar */}
        {currentStep === 7 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[7]}</h2>
            
            <label className="label">Composição familiar / estrutura de convívio atual:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.composicaoFamiliar} onChange={e => handleChange("composicaoFamiliar", e.target.value)}></textarea>

            <label className="label">Antecedentes familiares (parentesco em 1º e 2º grau):</label>
            {renderGridCheckboxes("antecedentesFamiliares", [
              "TDAH", "TEA", "Deficiência intelectual", 
              "Transtornos de aprendizagem", "Transtornos de humor", "Transtornos de ansiedade", 
              "Esquizofrenia/psicose", "Demências", "Epilepsia", 
              "Uso abusivo de substâncias", "Nenhum antecedente relatado"
            ], 3)}

            <label className="label">Detalhar grau de parentesco e diagnóstico de cada item marcado:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1.5rem' }} value={formData.grauParentescoAntecedentes} onChange={e => handleChange("grauParentescoAntecedentes", e.target.value)}></textarea>
            
            <label className="label">Dinâmica familiar atual (conflitos, suporte, mudanças recentes relevantes):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.dinamicaFamiliar} onChange={e => handleChange("dinamicaFamiliar", e.target.value)}></textarea>
          </div>
        )}

        {/* STEP 8: Função Cognitiva */}
        {currentStep === 8 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{SECTIONS[8]}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Seção estruturada para corresponder aos domínios analisados.</p>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>9.1 Atenção</h3>
            {renderFrequenciaSelect("atencao", "manterFoco", "Dificuldade em manter o foco em tarefas longas")}
            {renderFrequenciaSelect("atencao", "distraiFacilmente", "Distrai-se facilmente com estímulos externos")}
            {renderFrequenciaSelect("atencao", "cometeErros", "Comete erros por desatenção a detalhes")}
            {renderFrequenciaSelect("atencao", "alternarTarefas", "Dificuldade em alternar entre duas tarefas simultâneas")}
            <label className="label" style={{ marginTop: '0.5rem' }}>Exemplos concretos do cotidiano que ilustrem a queixa atencional:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.exemplosAtencao} onChange={e => handleChange("exemplosAtencao", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>9.2 Funções Executivas</h3>
            {renderFrequenciaSelect("funcoesExecutivas", "planejar", "Dificuldade em planejar e organizar atividades/rotina")}
            {renderFrequenciaSelect("funcoesExecutivas", "iniciarTarefas", "Dificuldade em iniciar tarefas (procrastinação)")}
            {renderFrequenciaSelect("funcoesExecutivas", "impulsividade", "Impulsividade em decisões ou falas")}
            {renderFrequenciaSelect("funcoesExecutivas", "rigidez", "Rigidez/dificuldade em se adaptar a mudanças de plano")}
            {renderFrequenciaSelect("funcoesExecutivas", "autoMonitorar", "Dificuldade em auto monitorar erros durante uma tarefa")}
            <label className="label" style={{ marginTop: '0.5rem' }}>Exemplos concretos que ilustrem a queixa executiva:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.exemplosExecutivas} onChange={e => handleChange("exemplosExecutivas", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>9.3 Memória</h3>
            {renderFrequenciaSelect("memoria", "esquecimentoCompromissos", "Esquecimento de compromissos/combinados (memória prospectiva)")}
            {renderFrequenciaSelect("memoria", "lembrarEventos", "Dificuldade em lembrar eventos recentes (memória episódica)")}
            {renderFrequenciaSelect("memoria", "repeticaoPerguntas", "Repetição de perguntas/assuntos já conversados")}
            {renderFrequenciaSelect("memoria", "reterInstrucoes", "Dificuldade em reter instruções recém-dadas (memória operacional)")}
            <label className="label" style={{ marginTop: '0.5rem' }}>A dificuldade é mais para aprender informação nova ou para evocar o que já foi aprendido?</label>
            <input className="input" style={{ marginBottom: '1rem' }} value={formData.dificuldadeAprenderEvocar} onChange={e => handleChange("dificuldadeAprenderEvocar", e.target.value)} />
            <label className="label">Exemplos concretos que ilustrem a queixa de memória:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.exemplosMemoria} onChange={e => handleChange("exemplosMemoria", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>9.4 Linguagem</h3>
            {renderGridCheckboxes("linguagem", [
              "Dificuldade em encontrar palavras (anomia)", "Trocas fonológicas na fala", "Gagueira/disfluência", 
              "Dificuldade de compreensão de instruções verbais complexas", "Dificuldade em leitura", "Dificuldade em escrita/ortografia", 
              "Sem queixas de linguagem"
            ])}
            <label className="label" style={{ marginTop: '0.5rem' }}>Detalhar exemplos e frequência das dificuldades marcadas:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '2rem' }} value={formData.exemplosLinguagem} onChange={e => handleChange("exemplosLinguagem", e.target.value)}></textarea>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>9.5 Visuoconstrução e Habilidades Visuoespaciais</h3>
            {renderGridCheckboxes("visuoconstrucao", [
              "Dificuldade de orientação espacial/direção", "Dificuldade em desenhar/copiar figuras", "Dificuldade em montar quebra-cabeças ou objetos", 
              "Dificuldade em estimar distâncias/tamanhos", "Sem queixas visuoespaciais"
            ])}

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem' }}>9.6 Praxias e Coordenação Motora</h3>
            {renderGridCheckboxes("praxias", [
              "Dificuldade em coordenação motora fina (escrita, botões)", "Desajeitamento motor global", "Dificuldade em imitar gestos/sequências motoras", 
              "Sem queixas motoras/práxicas"
            ])}
          </div>
        )}

        {/* STEP 9: Socioemocionais */}
        {currentStep === 9 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[9]}</h2>
            
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

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Perguntas Adicionais</h3>
            <label className="label">O paciente apresenta estereotipias? (Movimentos com o corpo, como chacoalhar das mãos, balançar o tronco para frente e para trás, sons com a boca, entre outros):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.estereotipias} onChange={e => handleChange("estereotipias", e.target.value)}></textarea>

            <label className="label">O paciente apresenta comportamentos atípicos? (Comportamentos que você observa como diferente ou incomum):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.comportamentosAtipicos} onChange={e => handleChange("comportamentosAtipicos", e.target.value)}></textarea>
          </div>
        )}

        {/* STEP 10: Sono, Alimentação e Hábitos */}
        {currentStep === 10 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[10]}</h2>
            
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
          </div>
        )}

        {/* STEP 11: Rotina e AVDs */}
        {currentStep === 11 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[11]}</h2>
            
            <label className="label">Necessita de apoio de terceiros para:</label>
            {renderGridCheckboxes("apoioTerceiros", [
              "Higiene pessoal", "Alimentação", "Administração de medicações", 
              "Administração financeira", "Uso de transporte", "Gestão de compromissos/agenda", 
              "Tarefas domésticas", "Nenhum apoio necessário"
            ], 3)}
            
            <label className="label" style={{ marginTop: '1.5rem' }}>Detalhar o tipo e a frequência do apoio necessário nos itens marcados:</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.detalhesApoio} onChange={e => handleChange("detalhesApoio", e.target.value)}></textarea>
          </div>
        )}

        {/* STEP 12: Expectativas e Arquivos */}
        {currentStep === 12 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[12]}</h2>
            
            <label className="label">O que o paciente/responsável espera compreender ou resolver com este processo avaliativo?</label>
            <textarea className="input" style={{ minHeight: '80px', marginBottom: '1.5rem' }} value={formData.expectativasAvaliacao} onChange={e => handleChange("expectativasAvaliacao", e.target.value)}></textarea>
            
            <label className="label">Há laudos, receituários ou documentos escolares/profissionais trazidos para anexar ao processo?</label>
            <input className="input" style={{ marginBottom: '1.5rem' }} value={formData.documentosTrazidos} onChange={e => handleChange("documentosTrazidos", e.target.value)} />
            
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary-mid)' }}>
              <label className="label" style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Anexar Arquivos (Laudos, fotos, encaminhamentos, exames):</label>
              <input 
                type="file" 
                multiple 
                onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
                className="input" 
                style={{ padding: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }} 
              />
              {files.length > 0 && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--text-main)' }}>Arquivos selecionados ({files.length}):</strong>
                  <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                    {files.map((f, i) => <li key={i}>{f.name}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTROLES DO WIZARD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          {currentStep > 0 ? (
            <button 
              className="btn btn-outline" 
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={loading}
            >
              ← Voltar
            </button>
          ) : <div style={{ width: 0 }}></div>}
          
          {currentStep < SECTIONS.length - 1 ? (
            <button 
              className="btn" 
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={loading || !patientId}
            >
              Avançar →
            </button>
          ) : (
            <button 
              className="btn" 
              onClick={saveAnamnese}
              disabled={loading || !patientId}
              style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)', color: 'white', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}
            >
              {loading ? "Salvando..." : "Finalizar e Salvar"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default function AnamnesePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Carregando formulário...</div>}>
      <AnamneseForm />
    </Suspense>
  );
}
