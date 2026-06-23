"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";

export default function AdminDashboard() {
  const router = useRouter();
  const { rooms, fetchAllReservations, cancelReservation, addRoom, updateRoom, deleteRoom, loading } = useReservation();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"reservations" | "rooms">("reservations");
  
  // Room Form State
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomDesc, setRoomDesc] = useState("");

  useEffect(() => {
    // Basic PIN check using sessionStorage
    const savedPin = sessionStorage.getItem("@Clinica:adminPin");
    if (savedPin === "1234") {
      setIsAdmin(true);
    } else {
      router.push("/");
    }
  }, [router]);

  if (loading || !isAdmin) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Autenticando...</p>
    </div>
  );

  const allReservations = fetchAllReservations().sort((a, b) => {
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
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
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
      </div>

      {activeTab === "reservations" && (
        <div className="card animate-slide">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Todas as Reservas Ativas ({allReservations.length})</h2>
          {allReservations.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Nenhuma reserva encontrada no sistema.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Data</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Horário</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Sala</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {allReservations.map(res => (
                    <tr key={res.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>{res.date.split('-').reverse().join('/')}</td>
                      <td style={{ padding: "1rem" }}>{res.startTime} - {res.endTime}</td>
                      <td style={{ padding: "1rem" }}>{getRoomName(res.roomId)}</td>
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
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
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
    </div>
  );
}
