"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";
import { 
  format, 
  startOfWeek, 
  endOfWeek,
  addDays, 
  subDays,
  subWeeks, 
  addWeeks, 
  isSameDay, 
  isToday,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProfessionalAgendaPage() {
  const { reservations, cancelReservation, updateReservationStatus, rooms, professional, loading } = useReservation();
  const router = useRouter();

  // Estado da semana/data selecionada
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");
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

  // Gera os 7 dias da semana atual para a visualização diária
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

  // Datas baseadas no viewMode
  let startDate = selectedDate;
  let endDate = selectedDate;
  if (viewMode === "weekly") {
    startDate = currentWeekStart;
    endDate = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  } else if (viewMode === "monthly") {
    startDate = startOfMonth(selectedDate);
    endDate = endOfMonth(selectedDate);
  }

  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  const periodReservations = myReservations
    .filter(res => res.date >= startStr && res.date <= endStr)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  // Agrupa reservas por data
  const groupedReservations = periodReservations.reduce((acc, res) => {
    if (!acc[res.date]) acc[res.date] = [];
    acc[res.date].push(res);
    return acc;
  }, {} as Record<string, typeof periodReservations>);

  const sortedDates = Object.keys(groupedReservations).sort();

  // Navegação
  const handlePrev = () => {
    if (viewMode === "daily") {
      const newDate = subDays(selectedDate, 1);
      setSelectedDate(newDate);
      setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else if (viewMode === "weekly") {
      setCurrentWeekStart((prev: Date) => subWeeks(prev, 1));
      setSelectedDate((prev: Date) => subWeeks(prev, 1));
    } else {
      const newDate = subMonths(selectedDate, 1);
      setSelectedDate(newDate);
      setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    }
  };
  const handleNext = () => {
    if (viewMode === "daily") {
      const newDate = addDays(selectedDate, 1);
      setSelectedDate(newDate);
      setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    } else if (viewMode === "weekly") {
      setCurrentWeekStart((prev: Date) => addWeeks(prev, 1));
      setSelectedDate((prev: Date) => addWeeks(prev, 1));
    } else {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
      setCurrentWeekStart(startOfWeek(newDate, { weekStartsOn: 0 }));
    }
  };
  const handleToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentWeekStart(startOfWeek(now, { weekStartsOn: 0 }));
  };

  const getHeaderTitle = () => {
    if (viewMode === "daily") return format(currentWeekStart, "MMMM yyyy", { locale: ptBR });
    if (viewMode === "weekly") return `Semana de ${format(startDate, "dd/MM", { locale: ptBR })} a ${format(endDate, "dd/MM", { locale: ptBR })}`;
    if (viewMode === "monthly") return format(startDate, "MMMM yyyy", { locale: ptBR });
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
            {getHeaderTitle()}
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <select 
              className="input" 
              value={viewMode} 
              onChange={e => setViewMode(e.target.value as any)}
              style={{ width: "auto", padding: "0.4rem 0.8rem", height: "100%", fontSize: "0.85rem", cursor: "pointer", marginRight: "0.5rem" }}
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
            <button onClick={handleToday} className="btn btn-outline" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>Hoje</button>
            <button onClick={handlePrev} className="btn btn-outline" style={{ padding: "0.4rem 0.8rem" }}>&lt;</button>
            <button onClick={handleNext} className="btn btn-outline" style={{ padding: "0.4rem 0.8rem" }}>&gt;</button>
          </div>
        </div>

        {/* Dias da Semana (Bolinhas) - Só aparece no Diário */}
        {viewMode === "daily" && (
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
        )}
      </div>

      {/* Lista de Consultas Agrupadas */}
      <div>
        {sortedDates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", border: "2px dashed var(--border-color)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.5 }}>🛋️</div>
            <p style={{ color: "var(--text-muted)", fontWeight: 500 }}>Nenhum agendamento encontrado neste período.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {sortedDates.map(dateStr => {
              const dateObj = new Date(dateStr + "T00:00:00");
              return (
                <div key={dateStr}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-secondary)", textTransform: "capitalize", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", backgroundColor: "var(--primary)", borderRadius: "50%" }} />
                    {format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {groupedReservations[dateStr].map(res => (
                      <div key={res.id} className="card animate-slide" style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1.25rem" }}>
                {/* Horário */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "70px", paddingRight: "1rem", borderRight: "2px solid var(--border-color)" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)" }}>{res.startTime}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)" }}>{res.endTime}</span>
                </div>
                
                {/* Detalhes */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: res.status === 'falta' || res.status === 'reagendado' || res.status === 'realizado' ? "var(--text-muted)" : "var(--primary)" }}>
                      {res.patientName || "Paciente Não Informado"}
                    </h4>
                    {res.status === 'falta' && <span className="badge" style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Falta</span>}
                    {res.status === 'reagendado' && <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Reagendado</span>}
                    {res.status === 'confirmado' && <span className="badge" style={{ backgroundColor: "#dcfce7", color: "var(--success, #166534)", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>✓ Confirmado</span>}
                    {res.status === 'realizado' && <span className="badge" style={{ backgroundColor: "#dcfce7", color: "var(--success, #166534)", border: "1px solid var(--success, #166534)", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>✅ Realizado</span>}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    {getRoomName(res.roomId)} {res.service && `• ${res.service}`}
                  </p>
                </div>

                {/* Ações */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "flex-end" }}>
                  {(!res.status || res.status === 'agendado' || res.status === 'confirmado') ? (
                    <>
                      <a href={getGoogleCalendarUrl(res)} target="_blank" rel="noopener noreferrer" 
                        className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                        title="Adicionar ao Google Calendar">
                        📅 <span className="hide-mobile">GCal</span>
                      </a>
                      
                      <button onClick={() => { if(confirm("Marcar este atendimento como finalizado/realizado?")) updateReservationStatus(res.id, 'realizado'); }} 
                        className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", borderColor: "var(--success, #166534)", color: "var(--success, #166534)", display: "flex", alignItems: "center", gap: "0.3rem" }}
                        title="Atendimento Realizado">
                        ✅ <span className="hide-mobile">Realizado</span>
                      </button>

                      <button onClick={() => { if(confirm("Marcar como falta do paciente?")) updateReservationStatus(res.id, 'falta'); }} 
                        className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", borderColor: "var(--danger)", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.3rem" }}
                        title="Marcar Falta">
                        ⚠️ <span className="hide-mobile">Falta</span>
                      </button>

                      <button onClick={() => { 
                          if(confirm("Deseja reagendar? O status será alterado e você será redirecionado para a tela de agendamento.")) {
                            updateReservationStatus(res.id, 'reagendado');
                            router.push('/reservar');
                          }
                        }} 
                        className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", borderColor: "#b45309", color: "#b45309", display: "flex", alignItems: "center", gap: "0.3rem" }}
                        title="Reagendar Consulta">
                        🔄 <span className="hide-mobile">Reagendar</span>
                      </button>
                      
                      <button onClick={() => { if(confirm("Deseja realmente excluir e cancelar esta consulta?")) cancelReservation(res.id); }} 
                        className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", borderColor: "var(--text-muted)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}
                        title="Cancelar Consulta">
                        ❌ <span className="hide-mobile">Cancelar</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { if(confirm("Deseja desfazer o status atual e retornar para 'Agendado'?")) updateReservationStatus(res.id, 'agendado'); }} 
                        className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", borderColor: "var(--primary)", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.3rem" }}
                        title="Desfazer Status / Editar">
                        ↩️ <span className="hide-mobile">Desfazer</span>
                      </button>
                      <button onClick={() => { if(confirm("Deseja excluir permanentemente este registro do histórico?")) cancelReservation(res.id); }} 
                        className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", borderColor: "var(--text-muted)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}
                        title="Excluir Registro">
                        🗑️ <span className="hide-mobile">Excluir</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
