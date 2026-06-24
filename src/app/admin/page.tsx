"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const { rooms, fetchAllReservations, cancelReservation, addRoom, updateRoom, deleteRoom, loading, addReservations } = useReservation();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"reservations" | "rooms" | "professionals" | "new_reservation" | "patients">("reservations");
  const [professionalsMap, setProfessionalsMap] = useState<Record<string, string>>({});
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  
  // Filters State
  const [filterRoom, setFilterRoom] = useState<string>("");
  const [filterProf, setFilterProf] = useState<string>("");

  // Room Form State
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomDesc, setRoomDesc] = useState("");

  // New Reservation Form State
  const [newResProfId, setNewResProfId] = useState("");
  const [newResRoomId, setNewResRoomId] = useState("");
  const [newResDate, setNewResDate] = useState("");
  const [newResStart, setNewResStart] = useState("08:00");
  const [newResEnd, setNewResEnd] = useState("09:00");
  const [newResPatient, setNewResPatient] = useState("");
  const [newResService, setNewResService] = useState("");

  // Patient Form State
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patName, setPatName] = useState("");
  const [patEmail, setPatEmail] = useState("");
  const [patPhone, setPatPhone] = useState("");
  const [patBirthDate, setPatBirthDate] = useState("");
  const [patAddress, setPatAddress] = useState("");
  const [patGuardian, setPatGuardian] = useState("");
  const [patHealthPlan, setPatHealthPlan] = useState("");
  const [patNotes, setPatNotes] = useState("");

  useEffect(() => {
    // Basic PIN check using sessionStorage
    const savedPin = sessionStorage.getItem("@Clinica:adminPin");
    if (savedPin === "1234") {
      setIsAdmin(true);
    } else {
      router.push("/");
    }

    // Fetch professionals to show their names and list them
    if (savedPin === "1234") {
      fetchProfessionals();
      fetchPatients();
      setNewResDate(new Date().toISOString().split("T")[0]); // Set default date
    }
  }, [router]);

  const fetchProfessionals = async () => {
    const { data } = await supabase.from("professionals").select("*").order("name");
    if (data) {
      setProfessionalsList(data);
      const map: Record<string, string> = {};
      data.forEach(p => map[p.id] = p.name);
      setProfessionalsMap(map);
    }
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("*").order("name");
    if (data) {
      setPatientsList(data);
    }
  };

  if (loading || !isAdmin) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Autenticando...</p>
    </div>
  );

  const filteredReservations = fetchAllReservations()
    .filter(res => {
      if (filterRoom && res.roomId !== filterRoom) return false;
      if (filterProf && res.professionalId !== filterProf) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name ?? "Sala Desconhecida";

  const handleCancelReservation = async (id: string) => {
    if (confirm("ATENÇÃO ADMIN: Tem certeza que deseja cancelar esta reserva? Essa ação não pode ser desfeita.")) {
      await cancelReservation(id);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !roomName) return;

    if (editingRoomId) {
      await updateRoom(editingRoomId, roomName, roomDesc);
    } else {
      // Create new
      const idStr = roomId.trim().toLowerCase().replace(/\s+/g, '-');
      await addRoom(idStr, roomName, roomDesc);
    }

    setEditingRoomId(null);
    setRoomId("");
    setRoomName("");
    setRoomDesc("");
  };

  const handleEditRoom = (room: any) => {
    setEditingRoomId(room.id);
    setRoomId(room.id);
    setRoomName(room.name);
    setRoomDesc(room.description || "");
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm("ATENÇÃO: Deletar uma sala irá cancelar TODAS as reservas associadas a ela. Continuar?")) {
      await deleteRoom(id);
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (confirm("ATENÇÃO: Deletar um profissional irá remover também TODAS as suas reservas! Deseja continuar?")) {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (!error) {
        fetchProfessionals(); // atualiza a lista
        alert("Profissional removido com sucesso.");
      } else {
        alert("Erro ao remover profissional.");
        console.error(error);
      }
    }
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patName) return;

    const payload = {
      name: patName,
      email: patEmail,
      phone: patPhone,
      birthDate: patBirthDate,
      address: patAddress,
      guardianName: patGuardian,
      healthPlan: patHealthPlan,
      notes: patNotes
    };

    if (editingPatientId) {
      const { error } = await supabase.from("patients").update(payload).eq("id", editingPatientId);
      if (!error) {
        alert("Paciente atualizado com sucesso!");
      } else {
        alert("Erro ao atualizar paciente.");
      }
    } else {
      const { error } = await supabase.from("patients").insert([payload]);
      if (!error) {
        alert("Paciente cadastrado com sucesso!");
      } else {
        alert("Erro ao cadastrar paciente.");
      }
    }

    setEditingPatientId(null);
    setPatName("");
    setPatEmail("");
    setPatPhone("");
    setPatBirthDate("");
    setPatAddress("");
    setPatGuardian("");
    setPatHealthPlan("");
    setPatNotes("");
    fetchPatients();
  };

  const handleEditPatient = (pat: any) => {
    setEditingPatientId(pat.id);
    setPatName(pat.name);
    setPatEmail(pat.email || "");
    setPatPhone(pat.phone || "");
    setPatBirthDate(pat.birthDate || "");
    setPatAddress(pat.address || "");
    setPatGuardian(pat.guardianName || "");
    setPatHealthPlan(pat.healthPlan || "");
    setPatNotes(pat.notes || "");
    setActiveTab("patients");
  };

  const handleDeletePatient = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este paciente?")) {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (!error) {
        fetchPatients();
        alert("Paciente removido.");
      } else {
        alert("Erro ao remover paciente.");
      }
    }
  };

  const handleAdminCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResProfId || !newResRoomId || !newResDate || !newResStart || !newResEnd) return;

    const conflict = fetchAllReservations().find(r => 
      r.roomId === newResRoomId && r.date === newResDate && r.startTime === newResStart
    );
    if (conflict) {
      alert("ERRO: Já existe uma reserva para esta sala neste dia e horário inicial.");
      return;
    }

    await addReservations([{
      roomId: newResRoomId,
      professionalId: newResProfId,
      date: newResDate,
      startTime: newResStart,
      endTime: newResEnd,
      patientName: newResPatient || undefined,
      service: newResService || undefined
    }]);

    alert("Reserva criada com sucesso pelo Administrador!");
    setNewResPatient("");
    setNewResService("");
    setActiveTab("reservations");
  };

  return (
    <div className="container animate-fade" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--danger)" }}>
            Painel Administrativo
          </h1>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <button 
          onClick={() => setActiveTab("reservations")}
          className={activeTab === "reservations" ? "btn" : "btn btn-outline"}
        >
          Gerenciar Reservas
        </button>
        <button 
          onClick={() => setActiveTab("rooms")}
          className={activeTab === "rooms" ? "btn" : "btn btn-outline"}
        >
          Gerenciar Salas
        </button>
        <button 
          onClick={() => setActiveTab("professionals")}
          className={activeTab === "professionals" ? "btn" : "btn btn-outline"}
        >
          Profissionais
        </button>
        <button 
          onClick={() => setActiveTab("patients")}
          className={activeTab === "patients" ? "btn" : "btn btn-outline"}
        >
          Pacientes
        </button>
        <button 
          onClick={() => setActiveTab("new_reservation")}
          className={activeTab === "new_reservation" ? "btn" : "btn btn-outline"}
        >
          + Nova Reserva (Admin)
        </button>
      </div>

      {activeTab === "reservations" && (
        <div className="card animate-slide">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Todas as Reservas Ativas ({filteredReservations.length})</h2>
            
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <select 
                className="input" 
                style={{ padding: "0.5rem", width: "auto" }}
                value={filterProf}
                onChange={e => setFilterProf(e.target.value)}
              >
                <option value="">Todos os Profissionais</option>
                {Object.entries(professionalsMap).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              <select 
                className="input" 
                style={{ padding: "0.5rem", width: "auto" }}
                value={filterRoom}
                onChange={e => setFilterRoom(e.target.value)}
              >
                <option value="">Todas as Salas</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredReservations.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Nenhuma reserva encontrada com os filtros selecionados.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Data</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Horário</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Profissional</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Sala / Paciente</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map(res => (
                    <tr key={res.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>{res.date.split('-').reverse().join('/')}</td>
                      <td style={{ padding: "1rem" }}>{res.startTime} - {res.endTime}</td>
                      <td style={{ padding: "1rem", fontWeight: 500, color: "var(--primary)" }}>
                        {professionalsMap[res.professionalId] || "Desconhecido"}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600 }}>{getRoomName(res.roomId)}</div>
                        {(res.patientName || res.service) && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {res.patientName && <span>{res.patientName}</span>}
                            {res.patientName && res.service && <span> • </span>}
                            {res.service && <span>{res.service}</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <button 
                          onClick={() => handleCancelReservation(res.id)}
                          style={{ color: "white", backgroundColor: "var(--danger)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}
                        >
                          Excluir Forçado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "rooms" && (
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {/* Lista de Salas */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Salas Cadastradas ({rooms.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {rooms.map(room => (
                <div key={room.id} style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "var(--primary)" }}>{room.name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>ID: {room.id}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleEditRoom(room)} style={{ padding: "0.4rem 0.8rem", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
                      Editar
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id)} style={{ padding: "0.4rem 0.8rem", backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form de Nova/Edição Sala */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              {editingRoomId ? "Editar Sala" : "Adicionar Nova Sala"}
            </h2>
            <form onSubmit={handleSaveRoom} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {!editingRoomId && (
                <div>
                  <label className="label">ID da Sala (ex: r6, cons-5)</label>
                  <input className="input" value={roomId} onChange={e => setRoomId(e.target.value)} required placeholder="Identificador único" />
                </div>
              )}
              <div>
                <label className="label">Nome da Sala</label>
                <input className="input" value={roomName} onChange={e => setRoomName(e.target.value)} required placeholder="Ex: Consultório 5" />
              </div>
              <div>
                <label className="label">Descrição (Opcional)</label>
                <input className="input" value={roomDesc} onChange={e => setRoomDesc(e.target.value)} placeholder="Ex: Equipado com maca..." />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  {editingRoomId ? "Salvar Alterações" : "Criar Sala"}
                </button>
                {editingRoomId && (
                  <button type="button" onClick={() => { setEditingRoomId(null); setRoomId(""); setRoomName(""); setRoomDesc(""); }} className="btn btn-outline">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "professionals" && (
        <div className="card animate-slide">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>Profissionais Cadastrados ({professionalsList.length})</h2>
          
          {professionalsList.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Nenhum profissional encontrado.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {professionalsList.map(prof => (
                <div key={prof.id} style={{ 
                  padding: "1.25rem", border: "1px solid var(--border-color)", 
                  borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" 
                }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ 
                      width: "48px", height: "48px", borderRadius: "50%", 
                      background: "var(--primary-light)", color: "var(--primary)", 
                      display: "flex", alignItems: "center", justifyContent: "center", 
                      fontWeight: 700, fontSize: "1.2rem" 
                    }}>
                      {prof.avatar_url ? (
                        <img src={prof.avatar_url} alt={prof.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        prof.name.split(" ").slice(0,2).map((n: string) => n[0]).join("").toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "1.05rem" }}>{prof.name}</h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{prof.specialty || "Clínico"}</p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{prof.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteProfessional(prof.id)} 
                    style={{ 
                      padding: "0.4rem 0.8rem", backgroundColor: "var(--danger-light)", color: "var(--danger)", 
                      border: "none", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" 
                    }}
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "patients" && (
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {/* Form de Nova/Edição Paciente */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              {editingPatientId ? "Editar Paciente" : "Novo Paciente"}
            </h2>
            <form onSubmit={handleSavePatient} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Nome do Paciente</label>
                <input className="input" value={patName} onChange={e => setPatName(e.target.value)} required placeholder="Ex: Maria Souza" />
              </div>
              
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Data de Nascimento</label>
                  <input type="date" className="input" value={patBirthDate} onChange={e => setPatBirthDate(e.target.value)} />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Convênio</label>
                  <select className="input" value={patHealthPlan} onChange={e => setPatHealthPlan(e.target.value)}>
                    <option value="">Particular (Sem Convênio)</option>
                    <option value="Unimed">Unimed</option>
                    <option value="Prefeitura">Prefeitura</option>
                    <option value="Lumiar">Lumiar</option>
                    <option value="Bradesco">Bradesco</option>
                    <option value="Pró Saúde">Pró Saúde</option>
                    <option value="São Luiz Saúde">São Luiz Saúde</option>
                    <option value="KR Saúde">KR Saúde</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Nome do Responsável (se menor de idade)</label>
                <input className="input" value={patGuardian} onChange={e => setPatGuardian(e.target.value)} placeholder="Ex: João Souza (Pai)" />
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label className="label">Telefone (WhatsApp)</label>
                  <input className="input" value={patPhone} onChange={e => setPatPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label className="label">E-mail</label>
                  <input type="email" className="input" value={patEmail} onChange={e => setPatEmail(e.target.value)} placeholder="maria@email.com" />
                </div>
              </div>

              <div>
                <label className="label">Endereço Completo</label>
                <input className="input" value={patAddress} onChange={e => setPatAddress(e.target.value)} placeholder="Rua, Número, Bairro, Cidade" />
              </div>

              <div>
                <label className="label">Anotações / Observações</label>
                <textarea className="input" value={patNotes} onChange={e => setPatNotes(e.target.value)} placeholder="Alergias, histórico clínico, etc." rows={3} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  {editingPatientId ? "Salvar Alterações" : "Cadastrar Paciente"}
                </button>
                {editingPatientId && (
                  <button type="button" onClick={() => { 
                    setEditingPatientId(null); setPatName(""); setPatEmail(""); setPatPhone(""); setPatBirthDate(""); setPatAddress(""); setPatGuardian(""); setPatHealthPlan(""); setPatNotes(""); 
                  }} className="btn btn-outline">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de Pacientes */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Pacientes ({patientsList.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "600px", overflowY: "auto" }}>
              {patientsList.length === 0 ? (
                <p style={{ color: "var(--text-muted)" }}>Nenhum paciente cadastrado.</p>
              ) : (
                patientsList.map(pat => (
                  <div key={pat.id} style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <h3 style={{ fontWeight: 700, color: "var(--primary)" }}>{pat.name}</h3>
                          {pat.healthPlan && <span className="badge badge-primary" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>{pat.healthPlan}</span>}
                        </div>
                        {(pat.phone || pat.email) && (
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {pat.phone} {pat.phone && pat.email && " • "} {pat.email}
                          </p>
                        )}
                        {pat.guardianName && (
                          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>Resp: {pat.guardianName}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleEditPatient(pat)} style={{ padding: "0.3rem 0.6rem", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600 }}>
                          Editar
                        </button>
                        <button onClick={() => handleDeletePatient(pat.id)} style={{ padding: "0.3rem 0.6rem", backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600 }}>
                          Remover
                        </button>
                      </div>
                    </div>
                    {pat.notes && (
                      <div style={{ marginTop: "0.5rem", padding: "0.75rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <strong>Anotações:</strong> <br/>
                        {pat.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "new_reservation" && (
        <div className="card animate-slide">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Agendar em nome de um Profissional</h2>
          <form onSubmit={handleAdminCreateReservation} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="label">Profissional</label>
                <select className="input" value={newResProfId} onChange={e => setNewResProfId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {professionalsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sala</label>
                <select className="input" value={newResRoomId} onChange={e => setNewResRoomId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={newResDate} onChange={e => setNewResDate(e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Hora Início</label>
                  <input type="time" className="input" value={newResStart} onChange={e => setNewResStart(e.target.value)} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Hora Fim</label>
                  <input type="time" className="input" value={newResEnd} onChange={e => setNewResEnd(e.target.value)} required />
                </div>
              </div>
            </div>
            
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="label">Nome do Paciente (Opcional)</label>
                <input className="input" value={newResPatient} onChange={e => setNewResPatient(e.target.value)} placeholder="Ex: Maria da Silva" />
              </div>
              <div>
                <label className="label">Serviço/Detalhes (Opcional)</label>
                <input className="input" value={newResService} onChange={e => setNewResService(e.target.value)} placeholder="Ex: Terapia de Casal" />
              </div>
            </div>

            <button type="submit" className="btn" style={{ marginTop: "1rem", alignSelf: "flex-start" }}>
              Confirmar Agendamento Admin
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
