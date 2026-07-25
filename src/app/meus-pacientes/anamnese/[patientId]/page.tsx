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
    atencao: {}, funcoesExecutivas: {}, memoria: {}, linguagem: {}, visuoconstrucao: [], praxias: [], socioemocionais: {}, coping: "", autopercepcao: "",
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
        <button className="btn" onClick={saveAnamnese} disabled={saving} style={{ backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Queixa Principal</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div><label className="label">Queixa principal:</label><textarea className="input" value={formData.queixaPrincipal} onChange={e => handleChange("queixaPrincipal", e.target.value)} /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div><label className="label">Início (súbito/insidioso):</label><input className="input" value={formData.inicioSintomas} onChange={e => handleChange("inicioSintomas", e.target.value)} /></div>
                <div><label className="label">Gatilho associado:</label><input className="input" value={formData.gatilhoInicio} onChange={e => handleChange("gatilhoInicio", e.target.value)} /></div>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>História Médica e Psiquiátrica</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Condições médicas:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {["Hipertensão", "Diabetes", "Cardiopatia", "Epilepsia", "Enxaqueca", "TCE", "Apneia do sono", "Distúrbios da tireoide"].map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={formData.condicoesMedicas?.includes(opt)} onChange={() => handleCheckbox("condicoesMedicas", opt)} /> {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="label">Medicações atuais:</label><textarea className="input" value={formData.medicacoesAtual} onChange={e => handleChange("medicacoesAtual", e.target.value)} /></div>
              <div><label className="label">Diagnósticos psiquiátricos:</label><input className="input" value={formData.diagnosticosPsiquiatricos} onChange={e => handleChange("diagnosticosPsiquiatricos", e.target.value)} /></div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>Avaliação Cognitiva e Emocional</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
               <div>
                  <label className="label">Humor Deprimido/Anedonia:</label>
                  <select className="input" value={formData.socioemocionais?.humorDeprimido || ""} onChange={(e) => handleSubFieldChange("socioemocionais", "humorDeprimido", e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Nunca">Nunca</option><option value="Às vezes">Às vezes</option><option value="Sempre">Sempre</option>
                  </select>
               </div>
               <div>
                  <label className="label">Irritabilidade / Labilidade:</label>
                  <select className="input" value={formData.socioemocionais?.irritabilidade || ""} onChange={(e) => handleSubFieldChange("socioemocionais", "irritabilidade", e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Nunca">Nunca</option><option value="Às vezes">Às vezes</option><option value="Sempre">Sempre</option>
                  </select>
               </div>
               <div><label className="label">Notas Adicionais do Profissional (Autopercepção e Observações Clínicas):</label><textarea className="input" style={{ minHeight: '120px' }} value={formData.autopercepcao} onChange={e => handleChange("autopercepcao", e.target.value)} /></div>
            </div>
          </section>

        </div>
        
        <div style={{ marginTop: "3rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn" onClick={saveAnamnese} disabled={saving} style={{ padding: "1rem 2rem" }}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>

      </div>
    </div>
  );
}
