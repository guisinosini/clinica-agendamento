"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";
import { supabase } from "../../lib/supabase";
import { Patient } from "../../types";

const calculateAge = (birthDate: string) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate + "T00:00:00");
  const today = new Date();
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  if (today.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years === 0 && months === 0) return "Menos de 1 mês";
  
  let ageStr = "";
  if (years > 0) ageStr += `${years} ano${years > 1 ? 's' : ''}`;
  if (months > 0) {
    if (years > 0) ageStr += " e ";
    ageStr += `${months} mês${months > 1 ? 'es' : ''}`;
  }
  return ageStr;
};

export default function MeusPacientesPage() {
  const { reservations, professional, loading } = useReservation();
  const router = useRouter();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [printingPatient, setPrintingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (!loading && !professional) router.push("/");
  }, [loading, professional, router]);

  useEffect(() => {
    fetchMyPatients();
  }, [professional, reservations]);

  const fetchMyPatients = async () => {
    if (!professional) return;
    setLoadingPatients(true);

    try {
      // 1. Puxar todos os pacientes do banco
      const { data, error } = await supabase.from('patients').select('*').order('name');
      
      if (error) {
        console.error("Erro ao buscar pacientes:", error);
        setLoadingPatients(false);
        return;
      }

      // 2. Descobrir quais pacientes têm reserva com este profissional
      const myReservations = reservations.filter(res => res.professionalId === professional.id);
      const myPatientNames = Array.from(new Set(myReservations.map(res => res.patientName).filter(Boolean)));

      // 3. Filtrar os pacientes que batem com os nomes
      const myPatientsList = (data as Patient[]).filter(pat => myPatientNames.includes(pat.name));
      setPatients(myPatientsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleConcludeProcess = async (patientId: string, patientName: string) => {
    const confirm = window.confirm(`Deseja marcar o processo de ${patientName} como CONCLUÍDO (Alta)?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({ status: 'concluido' })
        .eq('id', patientId);

      if (error) {
        alert("Erro ao concluir processo. Tente novamente.");
        console.error(error);
        return;
      }

      // Atualizar lista localmente
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, status: 'concluido' } : p));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !professional || loadingPatients) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Carregando seus pacientes...</p>
    </div>
  );

  // ─── TELA DE IMPRESSÃO DE RELATÓRIO ──────────────────────────────
  if (printingPatient) {
    const patReservations = reservations
      .filter(r => r.patientName === printingPatient.name && r.professionalId === professional?.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div style={{ backgroundColor: "#fff", minHeight: "100vh", position: "fixed", top: 0, left: 0, width: "100%", zIndex: 9999, padding: "2rem", overflowY: "auto" }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #print-section, #print-section * { visibility: visible; }
            #print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
            .no-print { display: none !important; }
          }
        `}</style>
        
        <div className="no-print" style={{ display: "flex", gap: "1rem", marginBottom: "2rem", justifyContent: "center" }}>
          <button onClick={() => setPrintingPatient(null)} className="btn btn-outline">⬅️ Voltar</button>
          <button onClick={() => window.print()} className="btn">🖨️ Imprimir Agora</button>
        </div>

        <div id="print-section" style={{ color: "#000", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem", borderBottom: "2px solid #eee", paddingBottom: "1rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0 }}>Relatório de Atendimentos</h1>
            <p style={{ fontSize: "1rem", margin: "0.5rem 0 0 0" }}>Clínica de Psicologia</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee" }}>
            <div>
              <p style={{ margin: "0 0 0.5rem 0" }}><strong>Paciente:</strong> {printingPatient.name}</p>
              {printingPatient.birthDate && <p style={{ margin: "0 0 0.5rem 0" }}><strong>Nascimento:</strong> {new Date(printingPatient.birthDate + "T00:00:00").toLocaleDateString("pt-BR")}</p>}
              <p style={{ margin: 0 }}><strong>Convênio:</strong> {printingPatient.healthPlan || "Particular"}</p>
              {printingPatient.guardianName && <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem" }}><strong>Resp:</strong> {printingPatient.guardianName}</p>}
            </div>
            <div>
              <p style={{ margin: "0 0 0.5rem 0" }}><strong>Profissional:</strong> {professional?.name}</p>
              <p style={{ margin: "0 0 0.5rem 0" }}><strong>Especialidade:</strong> {professional?.specialty || "Não informada"}</p>
              <p style={{ margin: 0 }}><strong>Data do Relatório:</strong> {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem", borderBottom: "1px solid #eee", paddingBottom: "0.5rem" }}>Histórico de Sessões</h2>
          
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0", textAlign: "left" }}>
                <th style={{ padding: "0.75rem", borderBottom: "2px solid #ddd" }}>Data</th>
                <th style={{ padding: "0.75rem", borderBottom: "2px solid #ddd" }}>Horário</th>
                <th style={{ padding: "0.75rem", borderBottom: "2px solid #ddd" }}>Serviço / Detalhe</th>
                <th style={{ padding: "0.75rem", borderBottom: "2px solid #ddd" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {patReservations.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "1rem", textAlign: "center" }}>Nenhum agendamento encontrado.</td></tr>
              ) : (
                patReservations.map((res) => {
                  const dataFormatada = new Date(res.date + "T00:00:00").toLocaleDateString("pt-BR");
                  return (
                    <tr key={res.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "0.75rem" }}>{dataFormatada}</td>
                      <td style={{ padding: "0.75rem" }}>{res.startTime} - {res.endTime}</td>
                      <td style={{ padding: "0.75rem" }}>{res.service || "Sessão Padrão"}</td>
                      <td style={{ padding: "0.75rem", textTransform: "capitalize" }}>{res.status || "agendado"}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          <div style={{ marginTop: "5rem", textAlign: "center", fontSize: "0.8rem", color: "#666" }}>
            <p style={{ marginBottom: "0.2rem" }}>____________________________________________________</p>
            <p style={{ margin: "0 0 0.2rem 0", fontWeight: "bold", color: "#000", fontSize: "1rem" }}>{professional?.name}</p>
            <p style={{ margin: 0 }}>Assinatura do Profissional</p>
          </div>
        </div>
      </div>
    );
  }

  // Filtragem e Separação
  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const activePatients = filteredPatients.filter(p => !p.status || p.status === 'ativo');
  const concludedPatients = filteredPatients.filter(p => p.status === 'concluido');

  return (
    <div className="container animate-fade" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      {/* Cabeçalho */}
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Meus Pacientes</h1>
        </div>
      </header>

      {/* Busca */}
      <div className="card animate-slide" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <input 
              type="text" 
              className="input" 
              placeholder="Buscar paciente por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>
            <span><span style={{ color: "var(--primary)" }}>{activePatients.length}</span> Ativos</span>
            <span><span style={{ color: "var(--success)" }}>{concludedPatients.length}</span> Concluídos</span>
          </div>
        </div>
      </div>

      {patients.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.5 }}>👥</div>
          <p style={{ color: "var(--text-muted)", fontWeight: 500 }}>Você ainda não tem pacientes vinculados.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
          
          {/* Sessão Ativos */}
          {activePatients.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Em Tratamento
              </h2>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {activePatients.map(pat => (
                  <div key={pat.id} className="card animate-slide" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div>
                        <h3 
                          onClick={() => setViewingPatient(pat)}
                          style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)", marginBottom: "0.2rem", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "4px", textDecorationColor: "var(--primary-light)" }}
                          title="Ver cadastro do paciente"
                        >
                          {pat.name}
                        </h3>
                        {pat.healthPlan && (
                          <span className="badge badge-primary" style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}>
                            {pat.healthPlan} {pat.healthPlanNumber ? `- ${pat.healthPlanNumber}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                      {(pat.phone || pat.email) && (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {pat.phone && <div>📞 {pat.phone}</div>}
                          {pat.email && <div>✉️ {pat.email}</div>}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => setPrintingPatient(pat)}
                        className="btn btn-outline"
                        style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem" }}
                      >
                        📄 Relatório
                      </button>
                      <button 
                        onClick={() => handleConcludeProcess(pat.id, pat.name)}
                        className="btn"
                        style={{ flex: 1, padding: "0.5rem", fontSize: "0.85rem", backgroundColor: "var(--success)", borderColor: "var(--success)" }}
                      >
                        ✓ Concluir Processo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessão Concluídos */}
          {concludedPatients.length > 0 && (
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Processos Concluídos
              </h2>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                {concludedPatients.map(pat => (
                  <div key={pat.id} className="card animate-slide" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", opacity: 0.8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div>
                        <h3 
                          onClick={() => setViewingPatient(pat)}
                          style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)", marginBottom: "0.2rem", textDecoration: "line-through underline", textDecorationColor: "var(--border-color)", cursor: "pointer", textUnderlineOffset: "4px" }}
                          title="Ver cadastro do paciente"
                        >
                          {pat.name}
                        </h3>
                        <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: "0.7rem", padding: "0.15rem 0.4rem", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                          ✓ Alta Médica
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {(pat.phone || pat.email) && (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {pat.phone && <div>📞 {pat.phone}</div>}
                          {pat.email && <div>✉️ {pat.email}</div>}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setPrintingPatient(pat)}
                      className="btn btn-outline"
                      style={{ width: "100%", padding: "0.5rem", marginTop: "1rem", fontSize: "0.85rem" }}
                    >
                      📄 Gerar Relatório
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {viewingPatient && (
        <div id="prof-modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setViewingPatient(null)}>
          <style>{`
            .only-print { display: none; }
            @media print {
              body * { visibility: hidden; }
              #prof-modal-overlay { align-items: flex-start !important; padding: 0 !important; background: transparent !important; }
              #print-patient-modal, #print-patient-modal * { visibility: visible; }
              #print-patient-modal { 
                position: absolute; left: 0; top: 0; width: 100%; 
                max-width: none !important; max-height: none !important; overflow: visible !important;
                padding: 0 !important; margin: 0 !important; box-shadow: none !important;
                background: white !important; border: none !important; display: block !important;
              }
              .no-print { display: none !important; }
              .only-print { display: block !important; }
              
              .print-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 1rem !important; align-items: start; }
              .print-full { grid-column: 1 / -1 !important; }
              .data-box { background: transparent !important; border: 1px solid #ccc !important; break-inside: avoid; box-shadow: none !important; }
              .data-box h4 { color: #000 !important; border-bottom: 1px solid #ddd; padding-bottom: 0.4rem; margin-bottom: 0.8rem !important; font-size: 1rem !important; }
              .data-box p { font-size: 0.95rem !important; color: #333 !important; }
            }
          `}</style>
          <div id="print-patient-modal" className="card animate-slide" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", backgroundColor: "var(--card-bg)" }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingPatient(null)}
              className="no-print"
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)", zIndex: 10 }}
            >
              ✕
            </button>

            <div className="only-print" style={{ textAlign: "center", marginBottom: "2rem", borderBottom: "2px solid #000", paddingBottom: "1rem" }}>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#000", textTransform: "uppercase" }}>Ficha de Cadastro do Paciente</h1>
              <p style={{ fontSize: "1rem", margin: "0.5rem 0 0 0", color: "#333" }}>Clínica de Psicologia</p>
            </div>

            <h2 className="no-print" style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--primary)" }}>{viewingPatient.name}</h2>
            <h2 className="only-print" style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem", color: "#000" }}>Paciente: {viewingPatient.name}</h2>

            <div className="no-print" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <span className="badge" style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
                {viewingPatient.status === 'concluido' ? '✓ Alta' : 'Em Tratamento'}
              </span>
              {viewingPatient.healthPlan && (
                <span className="badge badge-primary">
                  {viewingPatient.healthPlan} {viewingPatient.healthPlanNumber ? `- ${viewingPatient.healthPlanNumber}` : ""}
                </span>
              )}
            </div>

            <div className="print-grid" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div className="only-print data-box print-full" style={{ display: "none", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                 <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Status e Convênio</h4>
                 <div style={{ display: "flex", gap: "2rem" }}>
                    <p style={{ margin: 0 }}><strong>Status:</strong> {viewingPatient.status === 'concluido' ? 'Alta' : 'Em Tratamento'}</p>
                    <p style={{ margin: 0 }}><strong>Convênio:</strong> {viewingPatient.healthPlan || "Particular"} {viewingPatient.healthPlanNumber ? `(Nº: ${viewingPatient.healthPlanNumber})` : ""}</p>
                 </div>
              </div>

              {(viewingPatient.email || viewingPatient.phone) && (
                <div className="data-box" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Contato</h4>
                  {viewingPatient.phone && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Telefone:</strong> {viewingPatient.phone}</p>}
                  {viewingPatient.email && <p style={{ fontSize: "0.95rem", margin: 0 }}><strong>E-mail:</strong> {viewingPatient.email}</p>}
                </div>
              )}

              {(viewingPatient.birthDate || viewingPatient.gender || viewingPatient.cpf) && (
                <div className="data-box" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Dados Pessoais</h4>
                  {viewingPatient.cpf && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>CPF:</strong> {viewingPatient.cpf}</p>}
                  {viewingPatient.birthDate && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Nascimento:</strong> {new Date(viewingPatient.birthDate + "T00:00:00").toLocaleDateString("pt-BR")} <span style={{ fontSize: "0.85rem", color: "#555", marginLeft: "0.3rem" }}>({calculateAge(viewingPatient.birthDate)})</span></p>}
                  {viewingPatient.gender && <p style={{ fontSize: "0.95rem", margin: 0 }}><strong>Gênero:</strong> {viewingPatient.gender}</p>}
                </div>
              )}

              {(viewingPatient.guardianName || viewingPatient.parentsName || viewingPatient.parentsProfession) && (
                <div className="data-box" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Responsáveis</h4>
                  {viewingPatient.guardianName && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Responsável Direto:</strong> {viewingPatient.guardianName}</p>}
                  {viewingPatient.parentsName && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Nome dos Pais:</strong> {viewingPatient.parentsName}</p>}
                  {viewingPatient.parentsProfession && <p style={{ fontSize: "0.95rem", margin: 0 }}><strong>Profissão dos Pais:</strong> {viewingPatient.parentsProfession}</p>}
                </div>
              )}

              {(viewingPatient.schoolName || viewingPatient.schoolGrade || viewingPatient.schoolType) && (
                <div className="data-box" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Dados Escolares</h4>
                  {viewingPatient.schoolName && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Escola:</strong> {viewingPatient.schoolName}</p>}
                  {viewingPatient.schoolGrade && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Série/Ano:</strong> {viewingPatient.schoolGrade}</p>}
                  {viewingPatient.schoolType && <p style={{ fontSize: "0.95rem", margin: 0 }}><strong>Tipo:</strong> {viewingPatient.schoolType}</p>}
                </div>
              )}

              {viewingPatient.address && (
                <div className="data-box print-full" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Endereço</h4>
                  <p style={{ fontSize: "0.95rem", margin: 0 }}>{viewingPatient.address}</p>
                </div>
              )}

              {viewingPatient.notes && (
                <div className="data-box print-full" style={{ padding: "1rem", backgroundColor: "var(--primary-light)", borderRadius: "var(--radius-sm)", border: "1px solid var(--primary-light)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--primary)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Anotações da Clínica</h4>
                  <p style={{ fontSize: "0.9rem", margin: 0, color: "var(--text-main)", whiteSpace: "pre-wrap" }}>{viewingPatient.notes}</p>
                </div>
              )}
              
              <div className="only-print print-full data-box" style={{ display: "none", marginTop: "1rem" }}>
                  <h4 style={{ fontSize: "1rem", color: "#000", textTransform: "uppercase", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem", marginBottom: "1rem", fontWeight: 700 }}>Datas das Sessões</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginTop: "1.5rem" }}>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                  </div>
              </div>
            </div>

            <div className="no-print" style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button onClick={() => window.print()} className="btn btn-outline" style={{ flex: 1 }}>
                🖨️ Imprimir Cadastro
              </button>
              <button onClick={() => setViewingPatient(null)} className="btn" style={{ flex: 1 }}>
                Fechar Cadastro
              </button>
            </div>
            
            <div className="only-print" style={{ display: "none", marginTop: "3rem", textAlign: "center", borderTop: "1px dashed #ccc", paddingTop: "1rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#666" }}>Impresso em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
