"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";
import { 
  format, 
  startOfWeek, 
  addDays, 
  subWeeks, 
  addWeeks, 
  isSameDay, 
  isToday 
} from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfessionalAgendaPage() {
  const { reservations, cancelReservation, rooms, professional, loading } = useReservation();
  const router = useRouter();

  // Estado da semana/data selecionada
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!loading && !professional) router.push("/");
  }, [loading, professional, router]);

  if (loading || !professional) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Carregando sua agenda...</p>
    </div>
  );

  // Filtrar apenas reservas do profissional logado
  const myReservations = reservations.filter((res) => res.professionalId === professional.id);

  const getRoomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? "Sala";

  // Gera os 7 dias da semana atual
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  // Reservas para o dia selecionado
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const dayReservations = myReservations
    .filter(res => res.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Navegação de Semanas
  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
    setSelectedDate(prev => subWeeks(prev, 1));
  };
  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
    setSelectedDate(prev => addWeeks(prev, 1));
  };
  const handleToday = () => {
    const now = new Date();
    setCurrentWeekStart(startOfWeek(now, { weekStartsOn: 0 }));
    setSelectedDate(now);
  };

  const getGoogleCalendarUrl = (res: any) => {
    const dateStr = res.date.replace(/-/g, ""); // YYYYMMDD
    const startStr = res.startTime.replace(":", "") + "00";
    const endStr = res.endTime.replace(":", "") + "00";
    const title = `Consulta: ${res.patientName || "Paciente"}`;
    const details = `Serviço: ${res.service || ""}\nSala: ${getRoomName(res.roomId)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateStr}T${startStr}/${dateStr}T${endStr}&details=${encodeURIComponent(details)}`;
  };

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
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Minha Agenda</h1>
        </div>
        <Link href="/reservar" className="btn" style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
          + Novo Agendamento
        </Link>
      </header>

      {/* Navegação do Calendário */}
      <div className="card animate-slide" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-main)", textTransform: "capitalize" }}>
            {format(currentWeekStart, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={handleToday} className="btn btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>Hoje</button>
            <button onClick={handlePrevWeek} className="btn btn-outline" style={{ padding: "0.4rem 0.8rem" }}>&lt;</button>
            <button onClick={handleNextWeek} className="btn btn-outline" style={{ padding: "0.4rem 0.8rem" }}>&gt;</button>
          </div>
        </div>

        {/* Dias da Semana (Bolinhas) */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {weekDays.map(day => {
            const isSelected = isSameDay(day, selectedDate);
            const isDayToday = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "60px",
                  height: "75px",
                  borderRadius: "16px",
                  border: isSelected ? "none" : "1px solid var(--border-color)",
                  background: isSelected ? "var(--primary)" : "var(--bg-color)",
                  color: isSelected ? "var(--primary-mid)" : "var(--text-main)",
                  boxShadow: isSelected ? "0 4px 12px rgba(111, 76, 255, 0.3)" : "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", opacity: isSelected ? 0.9 : 0.6 }}>
                  {format(day, "eee", { locale: ptBR })}
                </span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "0.2rem" }}>
                  {format(day, "dd")}
                </span>
                {isDayToday && !isSelected && (
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--primary)", marginTop: "4px" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Consultas do Dia Selecionado */}
      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-secondary)" }}>
          Compromissos para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
        </h3>

        {dayReservations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.5 }}>🛋️</div>
            <p style={{ color: "var(--text-muted)", fontWeight: 500 }}>Nenhum paciente agendado para este dia.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {dayReservations.map(res => (
              <div key={res.id} className="card animate-slide" style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1.25rem" }}>
                {/* Horário */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "70px", paddingRight: "1rem", borderRight: "2px solid var(--border-color)" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)" }}>{res.startTime}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>{res.endTime}</span>
                </div>
                
                {/* Detalhes */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.2rem" }}>
                    {res.patientName || "Paciente Não Informado"}
                  </h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    {getRoomName(res.roomId)} {res.service && `• ${res.service}`}
                  </p>
                </div>

                {/* Ações */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <a href={getGoogleCalendarUrl(res)} target="_blank" rel="noopener noreferrer" 
                    className="btn btn-outline" style={{ padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Adicionar ao Google Calendar">
                    📅
                  </a>
                  <button onClick={() => { if(confirm("Cancelar esta consulta?")) cancelReservation(res.id); }} 
                    className="btn btn-outline" style={{ padding: "0.5rem", borderColor: "var(--danger)", color: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    title="Cancelar Consulta">
                    ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
