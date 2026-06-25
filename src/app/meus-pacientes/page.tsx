"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";
import { supabase } from "../../lib/supabase";
import { Patient } from "../../types";

export default function MeusPacientesPage() {
  const { reservations, professional, loading } = useReservation();
  const router = useRouter();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
                        <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "0.2rem" }}>{pat.name}</h3>
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

                    <button 
                      onClick={() => handleConcludeProcess(pat.id, pat.name)}
                      className="btn"
                      style={{ width: "100%", backgroundColor: "var(--success)", borderColor: "var(--success)" }}
                    >
                      ✓ Concluir Processo
                    </button>
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
                        <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-main)", marginBottom: "0.2rem", textDecoration: "line-through", textDecorationColor: "var(--border-color)" }}>{pat.name}</h3>
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
