"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CadastroPaciente() {
  const [patName, setPatName] = useState("");
  const [patEmail, setPatEmail] = useState("");
  const [patPhone, setPatPhone] = useState("");
  const [patBirthDate, setPatBirthDate] = useState("");
  const [patAddress, setPatAddress] = useState("");
  const [patGuardian, setPatGuardian] = useState("");
  const [patHealthPlan, setPatHealthPlan] = useState("");
  const [patHealthPlanNumber, setPatHealthPlanNumber] = useState("");
  const [patGender, setPatGender] = useState("");
  const [patCpf, setPatCpf] = useState("");
  const [patParentsName, setPatParentsName] = useState("");
  const [patParentsProfession, setPatParentsProfession] = useState("");
  const [patSchoolName, setPatSchoolName] = useState("");
  const [patSchoolGrade, setPatSchoolGrade] = useState("");
  const [patSchoolType, setPatSchoolType] = useState("");
  const [lgpdConsent, setLgpdConsent] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patName || !patCpf || !patBirthDate || !patGender || !patHealthPlan || !patPhone || !patEmail) {
      setError("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }
    if (!lgpdConsent) {
      setError("Você deve concordar com os termos de consentimento e LGPD para continuar.");
      return;
    }
    
    setLoading(true);
    setError("");

    const payload = {
      name: patName,
      email: patEmail,
      phone: patPhone,
      birthDate: patBirthDate,
      address: patAddress,
      guardianName: patGuardian,
      healthPlan: patHealthPlan,
      healthPlanNumber: patHealthPlanNumber,
      gender: patGender,
      cpf: patCpf,
      parentsName: patParentsName,
      parentsProfession: patParentsProfession,
      schoolName: patSchoolName,
      schoolGrade: patSchoolGrade,
      schoolType: patSchoolType
    };

    const { error: dbError } = await supabase.from("patients").insert([payload]);
    
    setLoading(false);

    if (!dbError) {
      setSuccess(true);
    } else {
      setError("Ocorreu um erro ao enviar os dados. Tente novamente.");
    }
  };

  if (success) {
    return (
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
        <div className="card animate-fade" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginBottom: '1rem' }}>Cadastro Enviado com Sucesso!</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Seus dados foram recebidos pela clínica. Você já pode fechar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--bg-color)', minHeight: '100vh' }}>
      <div className="card animate-slide" style={{ maxWidth: '800px', width: '100%', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>Auto-cadastro de Paciente</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Por favor, preencha o formulário abaixo para registrar seus dados na clínica.</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSavePatient} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Identificação */}
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Dados Pessoais</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 250px" }}>
                <label className="label">Nome Completo *</label>
                <input className="input" value={patName} onChange={e => setPatName(e.target.value)} required placeholder="Ex: Maria Souza" />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <label className="label">CPF *</label>
                <input className="input" value={patCpf} onChange={e => setPatCpf(e.target.value)} required placeholder="000.000.000-00" />
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <div style={{ flex: "1 1 150px" }}>
                <label className="label">Data de Nascimento *</label>
                <input type="date" className="input" value={patBirthDate} onChange={e => setPatBirthDate(e.target.value)} required />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <label className="label">Sexo *</label>
                <select className="input" value={patGender} onChange={e => setPatGender(e.target.value)} required>
                  <option value="">Selecione...</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                  <option value="Prefere não informar">Prefere não informar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contato */}
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Contato e Endereço</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label className="label">Telefone (WhatsApp) *</label>
                <input className="input" value={patPhone} onChange={e => setPatPhone(e.target.value)} required placeholder="(11) 99999-9999" />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label className="label">E-mail *</label>
                <input type="email" className="input" value={patEmail} onChange={e => setPatEmail(e.target.value)} required placeholder="maria@email.com" />
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label className="label">Endereço Completo</label>
              <input className="input" value={patAddress} onChange={e => setPatAddress(e.target.value)} placeholder="Rua, Número, Bairro, Cidade" />
            </div>
          </div>

          {/* Convênio */}
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Convênio Médico</h3>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label className="label">Plano de Saúde *</label>
                <select className="input" value={patHealthPlan} onChange={e => setPatHealthPlan(e.target.value)} required>
                  <option value="">Selecione...</option>
                  <option value="Particular">Particular (Sem Convênio)</option>
                  <option value="Unimed">Unimed</option>
                  <option value="Prefeitura">Prefeitura</option>
                  <option value="Lumiar">Lumiar</option>
                  <option value="Bradesco">Bradesco</option>
                  <option value="Pró Saúde">Pró Saúde</option>
                  <option value="São Luiz Saúde">São Luiz Saúde</option>
                  <option value="KR Saúde">KR Saúde</option>
                </select>
              </div>
              {patHealthPlan && patHealthPlan !== "Particular" && (
                <div style={{ flex: "1 1 200px" }}>
                  <label className="label">Nº da Carteirinha</label>
                  <input className="input" value={patHealthPlanNumber} onChange={e => setPatHealthPlanNumber(e.target.value)} placeholder="Número da sua carteirinha" />
                </div>
              )}
            </div>
          </div>

          {/* Dados do Responsável (Opcional) */}
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Dados Familiares & Escolares (Para Menores)</h3>
            
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label className="label">Nome do Responsável Legal</label>
                <input className="input" value={patGuardian} onChange={e => setPatGuardian(e.target.value)} placeholder="Ex: João Souza" />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label className="label">Nome dos Pais</label>
                <input className="input" value={patParentsName} onChange={e => setPatParentsName(e.target.value)} placeholder="Ex: João e Ana" />
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label className="label">Profissão dos Pais</label>
                <input className="input" value={patParentsProfession} onChange={e => setPatParentsProfession(e.target.value)} placeholder="Ex: Professor e Advogada" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label className="label">Escola (Instituição de Ensino)</label>
                <input className="input" value={patSchoolName} onChange={e => setPatSchoolName(e.target.value)} placeholder="Nome da escola" />
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <label className="label">Série/Ano Escolar</label>
                <input className="input" value={patSchoolGrade} onChange={e => setPatSchoolGrade(e.target.value)} placeholder="Ex: 5º Ano" />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <label className="label">Tipo de Escola</label>
                <select className="input" value={patSchoolType} onChange={e => setPatSchoolType(e.target.value)}>
                  <option value="">Selecione...</option>
                  <option value="Pública">Pública</option>
                  <option value="Particular">Particular</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary-mid)' }}>
              <input 
                type="checkbox" 
                id="lgpdConsent"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                style={{ width: '20px', height: '20px', marginTop: '0.15rem', cursor: 'pointer' }}
                required
              />
              <label htmlFor="lgpdConsent" style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4', cursor: 'pointer' }}>
                <strong>Declaro que as informações acima são verdadeiras</strong> e concordo em compartilhar estes dados com a clínica, ciente de que serão armazenados e tratados com segurança, conforme os termos da Lei Geral de Proteção de Dados (LGPD).
              </label>
            </div>

            <button 
              type="submit" 
              className="btn" 
              style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", fontWeight: 800 }}
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar e Enviar para a Clínica"}
            </button>
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "1rem" }}>
              As informações são confidenciais e armazenadas com segurança.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
