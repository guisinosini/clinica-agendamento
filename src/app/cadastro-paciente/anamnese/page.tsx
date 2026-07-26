"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const SECTIONS = [
  "Termo de Sigilo",
  "Queixa Principal",
  "Histórico do Desenvolvimento",
  "Histórico Escolar e Ocupacional",
  "História Médica e Psiquiátrica",
  "História Familiar",
  "Avaliação Cognitiva e Emocional",
  "Rotina e Expectativas"
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
    // Seção 2
    queixaPrincipal: "",
    inicioSintomas: "",
    gatilhoInicio: "",
    progressao: "",
    contextosEvidente: "",
    melhorouPiorou: "",
    areasImpacto: [],
    // Seção 3
    gestacao: [],
    intercorrenciasGestacao: "",
    parto: [],
    pesoApgar: "",
    marcosMotor: "",
    marcosLinguagem: "",
    sensorialAlimentar: [],
    // Seção 4 e 5
    idadeIngressoEscolar: "",
    historicoDesempenho: [],
    disciplinaDificuldade: "",
    comportamentoSala: "",
    laudosAnteriores: "",
    cargoAtual: "",
    queixasTrabalho: [],
    historicoMudancasEmprego: "",
    // Seção 6 e 7
    condicoesMedicas: [],
    detalhesMedicos: "",
    cirurgiasPrevias: "",
    medicacoesAtual: "",
    examesRealizados: "",
    usoSubstancias: [],
    frequenciaSubstancias: "",
    diagnosticosPsiquiatricos: "",
    acompanhamentoAtual: "",
    historicoPsicoterapia: "",
    antecedentesPsiquiatricos: [],
    detalhesAntecedentes: "",
    // Seção 8
    composicaoFamiliar: "",
    antecedentesFamiliares: [],
    grauParentescoAntecedentes: "",
    dinamicaFamiliar: "",
    // Seção 9 e 10
    atencao: {},
    funcoesExecutivas: {},
    memoria: {},
    linguagem: {},
    visuoconstrucao: [],
    praxias: [],
    socioemocionais: {},
    coping: "",
    autopercepcao: "",
    estereotipias: "",
    comportamentosAtipicos: "",
    // Seção 11, 12 e 13
    sonoHorario: "",
    alteracoesSono: [],
    padraoAlimentar: "",
    atividadeFisica: "",
    apoioTerceiros: [],
    detalhesApoio: "",
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

  return (
    <div className="container" style={{ padding: '3rem 1rem', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="card animate-slide" style={{ maxWidth: '800px', width: '100%', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        
        {/* PROGRESS BAR */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Passo {currentStep + 1} de {SECTIONS.length}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{SECTIONS[currentStep]}</span>
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
              {["Desempenho acadêmico", "Desempenho profissional", "Relações familiares", "Relações sociais/amizades", "Autonomia para atividades diárias", "Regulação emocional", "Sono", "Autoestima"].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.areasImpacto.includes(opt)} onChange={() => handleCheckbox("areasImpacto", opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Desenvolvimento */}
        {currentStep === 2 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[2]}</h2>
            
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
          </div>
        )}

        {/* STEP 3: Escolar e Ocupacional */}
        {currentStep === 3 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[3]}</h2>
            
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
          </div>
        )}

        {/* STEP 4: Médica e Psiquiátrica */}
        {currentStep === 4 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[4]}</h2>
            
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
          </div>
        )}

        {/* STEP 5: História Familiar */}
        {currentStep === 5 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[5]}</h2>
            
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
          </div>
        )}

        {/* STEP 6: Cognitiva e Emocional */}
        {currentStep === 6 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[6]}</h2>
            
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

            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', marginTop: '1.5rem' }}>Comportamentos</h3>
            <label className="label">O paciente apresenta estereotipias? (Movimentos com o corpo, como chacoalhar das mãos, balançar o tronco para frente e para trás, sons com a boca, entre outros):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.estereotipias} onChange={e => handleChange("estereotipias", e.target.value)}></textarea>

            <label className="label">O paciente apresenta comportamentos atípicos? (Comportamentos que você observa como diferente ou incomum):</label>
            <textarea className="input" style={{ minHeight: '60px', marginBottom: '1rem' }} value={formData.comportamentosAtipicos} onChange={e => handleChange("comportamentosAtipicos", e.target.value)}></textarea>
          </div>
        )}

        {/* STEP 7: Rotina e Expectativas */}
        {currentStep === 7 && (
          <div className="animate-fade">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{SECTIONS[7]}</h2>
            
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
            
            <label className="label" style={{ marginTop: '1rem' }}>Anexar Arquivos (Laudos, fotos, encaminhamentos, exames):</label>
            <input 
              type="file" 
              multiple 
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              className="input" 
              style={{ marginBottom: '1rem', padding: '0.5rem', background: 'var(--bg-color)' }} 
            />
            {files.length > 0 && (
              <div style={{ marginBottom: '1rem', fontSize: '0.9rem', backgroundColor: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: 'var(--primary)' }}>Arquivos selecionados ({files.length}):</strong>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', color: 'var(--text-main)' }}>
                  {files.map((f, i) => <li key={i}>{f.name}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* CONTROLES DO WIZARD */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          {currentStep > 0 ? (
            <button 
              className="btn btn-outline" 
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={loading}
            >
              ← Voltar
            </button>
          ) : <div></div>}
          
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
              style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
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
