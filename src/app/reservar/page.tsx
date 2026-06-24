"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation, NEXT_DAYS, TIME_SLOTS } from "../../context/ReservationContext";

export default function ReservarPage() {
  const router = useRouter();
  const { rooms, reservations, addReservations, professional, loading } = useReservation();
  
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(NEXT_DAYS[0]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [patientName, setPatientName] = useState("");
  const [service, setService] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");
  
  // Estados para Repetição de Reserva
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"daily" | "weekly">("weekly");
  const [recurrenceCount, setRecurrenceCount] = useState<number>(4);

  useEffect(() => {
    if (!loading && !professional) router.push("/");
  }, [loading, professional, router]);

  if (loading || !professional) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Carregando salas...</p>
    </div>
  );

  const occupiedSlots = useMemo(() => {
    if (!selectedRoom) return [];
    return reservations
      .filter(res => res.roomId === selectedRoom && res.date === selectedDate)
      .map(res => res.startTime);
  }, [reservations, selectedRoom, selectedDate]);

  const handleSlotClick = (slot: string) => {
    if (occupiedSlots.includes(slot)) return;
    setSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort()
    );
  };

  const handleConfirm = () => {
    if (!selectedRoom || selectedSlots.length === 0) return;

    let allReservations = [];
    
    // Converter selectedDate para lidar com o timezone de forma correta
    const [sY, sM, sD] = selectedDate.split("-").map(Number);
    const baseDate = new Date(sY, sM - 1, sD);
    
    const totalOccurrences = isRecurring ? recurrenceCount : 1;

    for (let i = 0; i < totalOccurrences; i++) {
      const currentDate = new Date(baseDate);
      if (isRecurring && recurrenceType === "daily") {
        currentDate.setDate(currentDate.getDate() + i);
      } else if (isRecurring && recurrenceType === "weekly") {
        currentDate.setDate(currentDate.getDate() + (i * 7));
      }
      
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      
      const dailyReservations = selectedSlots.map(slot => {
        const [hours, minutes] = slot.split(":").map(Number);
        const d = new Date();
        d.setHours(hours + 1, minutes, 0); // Presume duração de 1 hora
        return {
          roomId: selectedRoom,
          professionalId: professional.id,
          date: dateStr,
          startTime: slot,
          endTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
          patientName: patientName || undefined,
          service: service || undefined
        };
      });

      allReservations.push(...dailyReservations);
    }

    const conflicts = allReservations.filter(res => 
      reservations.some(existing => 
        existing.roomId === res.roomId && 
        existing.date === res.date && 
        existing.startTime === res.startTime
      )
    );

    let finalReservations = allReservations;

    if (conflicts.length > 0) {
      const confirmSkip = window.confirm(`Atenção: ${conflicts.length} horário(s) já estão ocupados nestas datas recorrentes. Deseja agendar apenas os horários livres e pular os ocupados?`);
      if (!confirmSkip) return;
      
      finalReservations = allReservations.filter(res => !conflicts.includes(res));
      
      if (finalReservations.length === 0) {
        setFeedbackMsg("❌ Nenhum horário disponível nas datas selecionadas.");
        return;
      }
    }

    addReservations(finalReservations);
    
    if (finalReservations.length > 1) {
      setFeedbackMsg(`${finalReservations.length} reservas confirmadas com sucesso!`);
    } else {
      setFeedbackMsg("Reserva confirmada com sucesso!");
    }
    
    setTimeout(() => {
      setSelectedRoom(null);
      setSelectedSlots([]);
      setPatientName("");
      setService("");
      setIsRecurring(false);
      setRecurrenceCount(4);
      setFeedbackMsg("");
      router.push("/minhas-reservas");
    }, 1500);
  };


  const selectedRoomObj = rooms.find(r => r.id === selectedRoom);

  const formatSelectedDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  };

  return (
    <div className="container animate-fade" style={{ paddingBottom: "8rem", paddingTop: "1.5rem" }}>
      {/* Header */}
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Nova Reserva</h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginLeft: "1.75rem" }}>Siga os passos abaixo para agendar sua sala</p>
      </header>

      {/* Feedback */}
      {feedbackMsg && (
        <div className="animate-fade" style={{
          padding: "1rem 1.5rem",
          background: "linear-gradient(135deg, var(--success) 0%, #059669 100%)",
          color: "white",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.5rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
        }}>
          ✅ {feedbackMsg}
        </div>
      )}

      {/* Passo 1: Sala */}
      <section style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "var(--radius-full)",
            background: "var(--primary)",
            color: "var(--primary-mid)", fontSize: "0.9rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "var(--clay-btn)",
          }}>1</div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-secondary)" }}>Selecione a Sala</h2>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.875rem" }}>
          {rooms.map((room) => {
            const isSelected = selectedRoom === room.id;
            return (
              <button
                key={room.id}
                onClick={() => { setSelectedRoom(room.id); setSelectedSlots([]); }}
                style={{
                  padding: "1.5rem",
                  borderRadius: "var(--radius-lg)",
                  border: `2px solid ${isSelected ? "var(--primary)" : "transparent"}`,
                  background: "var(--card-bg)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "var(--shadow-primary)" : "var(--shadow-sm)",
                  textAlign: "left",
                  transform: isSelected ? "translateY(-3px)" : "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "100px",
                }}
              >
                <div>
                  <p style={{
                    fontWeight: 700, fontSize: "1.05rem",
                    color: isSelected ? "var(--primary)" : "var(--text-main)",
                    marginBottom: "0.25rem",
                  }}>
                    {room.name}
                  </p>
                  {room.description && (
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                      {room.description}
                    </p>
                  )}
                </div>
                
                {isSelected && (
                  <div style={{
                    marginTop: "1rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    fontSize: "0.8rem",
                    color: "var(--primary)",
                    fontWeight: 700,
                  }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--primary)" }} />
                    Selecionada
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Passos 2 e 3 (aparecem após sala ser selecionada) */}
      {selectedRoom && (
        <div className="animate-slide">
          {/* Passo 2: Data */}
          <section style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "var(--radius-full)",
                background: "var(--primary)",
                color: "var(--primary-mid)", fontSize: "0.9rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, boxShadow: "var(--clay-btn)",
              }}>2</div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-secondary)" }}>Escolha a Data</h2>
            </div>
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2.5rem 2rem", gap: "0.75rem" }}>
              <div style={{ fontSize: "2rem" }}>📅</div>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>Selecione o dia desejado</p>
              <input
                type="date"
                value={selectedDate}
                min={NEXT_DAYS[0]}
                onChange={(e) => {
                  if (e.target.value) { setSelectedDate(e.target.value); setSelectedSlots([]); }
                }}
                style={{
                  fontSize: "1.35rem", fontWeight: 700,
                  padding: "1rem 2rem",
                  borderRadius: "var(--radius-md)",
                  border: "2px solid var(--primary-mid)",
                  backgroundColor: "var(--primary-light)",
                  color: "var(--primary)",
                  cursor: "pointer", outline: "none",
                  fontFamily: "inherit",
                  width: "100%", maxWidth: "320px",
                  textAlign: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              />
              {selectedDate && (
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", textTransform: "capitalize", marginTop: "0.25rem" }}>
                  {formatSelectedDate(selectedDate)}
                </p>
              )}
            </div>
          </section>

          {/* Passo 3: Horários */}
          <section style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "var(--radius-full)",
                  background: "var(--primary)",
                  color: "var(--primary-mid)", fontSize: "0.9rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: "var(--clay-btn)",
                }}>3</div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-secondary)" }}>Selecione os Horários</h2>
              </div>
              {selectedSlots.length > 0 && (
                <span className="badge badge-primary" style={{ fontSize: "0.8rem" }}>
                  {selectedSlots.length} hora(s) selecionada(s)
                </span>
              )}
            </div>

            <div className="card" style={{ padding: "1.5rem" }}>
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))", gap: "0.625rem" }}>
                {TIME_SLOTS.map(slot => {
                  const isOccupied = occupiedSlots.includes(slot);
                  const isSelected = selectedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      disabled={isOccupied}
                      onClick={() => handleSlotClick(slot)}
                      style={{
                        padding: "0.85rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        border: "1.5px solid",
                        borderColor: isOccupied
                          ? "var(--border-color)"
                          : isSelected ? "var(--primary)" : "var(--border-color)",
                        background: isOccupied
                          ? "var(--primary-light)"
                          : isSelected
                            ? "var(--primary)"
                            : "var(--card-bg)",
                        color: isOccupied ? "var(--text-light)" : isSelected ? "var(--primary-mid)" : "var(--text-secondary)",
                        cursor: isOccupied ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease",
                        textDecoration: isOccupied ? "line-through" : "none",
                        boxShadow: isSelected ? "var(--clay-btn)" : "var(--clay-input)",
                        transform: isSelected ? "translateY(-1px)" : "none",
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {/* Legenda */}
              <div style={{ display: "flex", gap: "1.25rem", marginTop: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                {[
                  { color: "var(--card-bg)", border: "var(--border-color)", label: "Disponível" },
                  { color: "var(--primary)", border: "var(--primary)", label: "Selecionado" },
                  { color: "var(--primary-light)", border: "var(--primary-light)", label: "Ocupado" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: "14px", height: "14px", backgroundColor: item.color, border: `1.5px solid ${item.border}`, borderRadius: "4px" }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Passo 4: Dados do Paciente (Opcional) */}
          {selectedSlots.length > 0 && (
            <section className="animate-slide" style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "var(--radius-full)",
                  background: "var(--primary)",
                  color: "var(--primary-mid)", fontSize: "0.9rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, boxShadow: "var(--clay-btn)",
                }}>4</div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-secondary)" }}>Dados do Agendamento</h2>
              </div>
              
              <div className="card" style={{ padding: "2rem" }}>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                  <div>
                    <label className="label">Nome do Paciente</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Ex: Maria Oliveira" 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Serviço / Procedimento</label>
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="Ex: Terapia de Casal" 
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    />
                  </div>
                </div>

                {/* Opções de Repetição */}
                <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", fontWeight: 600, color: "var(--text-main)" }}>
                    <input 
                      type="checkbox" 
                      checked={isRecurring} 
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      style={{ width: "1.25rem", height: "1.25rem", accentColor: "var(--primary)", cursor: "pointer" }}
                    />
                    🔄 Repetir este agendamento automaticamente
                  </label>
                  
                  {isRecurring && (
                    <div className="grid animate-fade" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginTop: "1.25rem", background: "var(--bg-color)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      <div>
                        <label className="label">Frequência da Repetição</label>
                        <select 
                          className="input" 
                          value={recurrenceType} 
                          onChange={(e) => setRecurrenceType(e.target.value as "daily" | "weekly")}
                          style={{ cursor: "pointer" }}
                        >
                          <option value="weekly">Semanalmente (mesmo dia da semana)</option>
                          <option value="daily">Diariamente (dias consecutivos)</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Quantidade de Repetições</label>
                        <input 
                          type="number" 
                          min="2" 
                          max="50" 
                          className="input" 
                          value={recurrenceCount}
                          onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.35rem", display: "block" }}>
                          Total de dias/sessões (já inclui a 1ª data).
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </section>
          )}
        </div>
      )}

      {/* Barra de Confirmação Fixa */}
      {selectedSlots.length > 0 && (
        <div className="animate-slide" style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "1rem 1.5rem",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border-color)",
          boxShadow: "0 -8px 24px rgba(0,0,0,0.08)",
          display: "flex", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{ width: "100%", maxWidth: "1200px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1rem" }}>
                {selectedRoomObj?.name} · {selectedSlots.length} hora(s)
                {isRecurring && <span style={{ color: "var(--primary)", marginLeft: "0.5rem" }}>· {recurrenceCount} Ocorrências</span>}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                {formatSelectedDate(selectedDate)}
              </p>
            </div>
            <button
              onClick={handleConfirm}
              className="btn"
              style={{ padding: "0.85rem 2rem", whiteSpace: "nowrap" }}
            >
              Confirmar Reserva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
