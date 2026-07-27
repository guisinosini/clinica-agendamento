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

export default function ProfessionalAgendaPage() {
  const { reservations, cancelReservation, updateReservationStatus, rooms, professional, loading, addReservations, servicesList } = useReservation();
  const router = useRouter();

  // Estado da semana/data selecionada
  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "monthly">("daily");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterService, setFilterService] = useState("");

  // Estado do Modal de Bloqueio
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split("T")[0]);
  const [blockStartTime, setBlockStartTime] = useState("08:00");
  const [blockEndTime, setBlockEndTime] = useState("09:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockRecurrence, setBlockRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [blockRecurrenceEnd, setBlockRecurrenceEnd] = useState("");

  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);

  const handlePatientClick = async (patientName: string | undefined) => {
    if (!patientName) return;
    setIsLoadingPatient(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('name', patientName)
        .single();
        
      if (data && !error) {
        setViewingPatient(data);
      } else {
        alert("Cadastro do paciente não encontrado.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar paciente.");
    } finally {
      setIsLoadingPatient(false);
    }
  };

  const { TIME_SLOTS } = require("../../context/ReservationContext");

  useEffect(() => {
    if (!loading && !professional) router.push("/");
  }, [loading, professional, router]);

  if (loading || !professional) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Carregando sua agenda...</p>
    </div>
  );

  const handleBlockTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockStartTime || !blockEndTime) return;
    if (blockRecurrence !== "none" && !blockRecurrenceEnd) {
      alert("Por favor, selecione até quando a repetição deve ocorrer.");
      return;
    }
    
    try {
      const blocksToCreate = [];
      let currentDate = new Date(blockDate + "T00:00:00");
      let endDate = blockRecurrence !== "none" && blockRecurrenceEnd 
        ? new Date(blockRecurrenceEnd + "T00:00:00") 
        : currentDate;
        
      // Limite de segurança (máximo de 100 repetições para evitar loops infinitos)
      const maxBlocks = 100;
      let count = 0;
      let hasConflict = false;

      while (currentDate <= endDate && count < maxBlocks) {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        
        // Verificar se há agendamento para o profissional neste horário
        const conflict = myReservations.some(res => {
          if (res.date !== dateStr) return false;
          // Ignorar agendamentos cancelados, faltas ou reagendados
          if (res.status === 'cancelado' || res.status === 'falta' || res.status === 'reagendado') return false;
          
          const startMins = parseInt(res.startTime.split(':')[0]) * 60 + parseInt(res.startTime.split(':')[1]);
          const endMins = parseInt(res.endTime.split(':')[0]) * 60 + parseInt(res.endTime.split(':')[1]);
          const blockStartMins = parseInt(blockStartTime.split(':')[0]) * 60 + parseInt(blockStartTime.split(':')[1]);
          const blockEndMins = parseInt(blockEndTime.split(':')[0]) * 60 + parseInt(blockEndTime.split(':')[1]);
          
          return (startMins < blockEndMins && blockStartMins < endMins);
        });

        if (conflict) {
          hasConflict = true;
          break;
        }

        blocksToCreate.push({
          roomId: null,
          professionalId: professional!.id,
          date: dateStr,
          startTime: blockStartTime,
          endTime: blockEndTime,
          patientName: `Bloqueado: ${blockReason || 'Indisponível'}`,
          status: 'indisponivel' as any
        });

        if (blockRecurrence === "none") break;
        if (blockRecurrence === "daily") currentDate = addDays(currentDate, 1);
        if (blockRecurrence === "weekly") currentDate = addWeeks(currentDate, 1);
        if (blockRecurrence === "monthly") currentDate = addMonths(currentDate, 1);
        
        count++;
      }

      if (hasConflict) {
        alert("Você não pode bloquear este horário. Já existe um paciente agendado para este período.");
        return;
      }

      await addReservations(blocksToCreate);
      setIsBlockModalOpen(false);
      setBlockReason("");
      setBlockRecurrence("none");
      setBlockRecurrenceEnd("");
    } catch (err) {
      alert("Erro ao bloquear horário.");
    }
  };

  // Filtrar apenas reservas do profissional logado
  const myReservations = reservations.filter((res) => res.professionalId === professional.id);

  const getRoomName = (roomId?: string | null) => rooms.find((r) => r.id === roomId)?.name ?? "Sala";

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
    .filter(res => filterService ? res.service === filterService : true)
    .filter(res => res.status !== 'reagendado')
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
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setIsBlockModalOpen(true)} className="btn btn-outline" style={{ fontSize: "0.9rem", padding: "0.5rem 1rem", borderColor: "var(--danger)", color: "var(--danger)" }}>
            Bloquear Agenda
          </button>
          <Link href="/reservar" className="btn" style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}>
            + Novo Agendamento
          </Link>
        </div>
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
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              style={{ width: "auto", padding: "0.4rem 0.8rem", height: "100%", fontSize: "0.85rem", cursor: "pointer", marginRight: "0.5rem" }}
            >
              <option value="">Todos os Serviços</option>
              {servicesList?.map(svc => (
                <option key={svc.id} value={svc.name}>{svc.name}</option>
              ))}
            </select>
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

      {/* Lista de Consultas */}
      <div>
        {viewMode === "weekly" ? (
          <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem", minHeight: "500px" }}>
            {weekDays.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isTodayDay = isToday(day);
              const dayReservations = groupedReservations[dateStr] || [];
              
              return (
                <div key={dateStr} style={{ minWidth: "200px", flex: 1, backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-md)", border: isTodayDay ? "2px solid var(--primary)" : "1px solid var(--border-color)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "0.8rem", textAlign: "center", borderBottom: "1px solid var(--border-color)", backgroundColor: isTodayDay ? "var(--primary-light)" : "rgba(0,0,0,0.02)" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: isTodayDay ? "var(--primary)" : "var(--text-muted)", display: "block" }}>{format(day, "EEEE", { locale: ptBR })}</span>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: isTodayDay ? "var(--primary)" : "var(--text-main)" }}>{format(day, "dd/MM")}</span>
                  </div>
                  <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                    {dayReservations.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", opacity: 0.7 }}>Sem horários</div>
                    ) : (
                      dayReservations.map(res => {
                        const isBlocked = res.status === 'indisponivel';
                        return (
                          <div key={res.id} className="card" style={{ padding: "0.6rem", display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.8rem", borderLeft: `4px solid ${isBlocked ? 'var(--danger)' : (res.status === 'realizado' ? 'var(--success)' : 'var(--primary)')}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 800, color: isBlocked ? 'var(--danger)' : 'var(--text-main)' }}>{res.startTime}</span>
                              {isBlocked && <span className="badge" style={{ backgroundColor: "var(--danger)", color: "white", fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>Bloq</span>}
                              {res.status === 'realizado' && <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>✓</span>}
                              {res.status === 'falta' && <span className="badge" style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>Falta</span>}
                            </div>
                            <div 
                              onClick={() => !isBlocked && handlePatientClick(res.patientName)}
                              style={{ fontWeight: 700, color: isBlocked ? 'var(--danger)' : (res.status === 'realizado' || res.status === 'falta' ? 'var(--text-muted)' : 'var(--primary)'), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: isBlocked ? "default" : "pointer", textDecoration: isBlocked ? "none" : "underline", textUnderlineOffset: "2px" }}
                              title={isBlocked ? "" : "Ver cadastro do paciente"}
                            >
                              {res.patientName || "Paciente"}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {isBlocked ? blockReason || "Indisponível" : res.service}
                            </div>
                            
                            {/* Tiny Actions */}
                            <div style={{ display: "flex", gap: "0.2rem", marginTop: "0.4rem" }}>
                              {isBlocked ? (
                                <button onClick={() => { if(confirm("Desbloquear?")) cancelReservation(res.id); }} style={{ fontSize: "0.65rem", padding: "0.2rem", flex: 1, borderColor: "var(--danger)", color: "var(--danger)" }} className="btn btn-outline" title="Desbloquear">Desbloq.</button>
                              ) : (!res.status || res.status === 'agendado' || res.status === 'confirmado') ? (
                                <>
                                  <button onClick={() => { if(confirm("Atendimento Realizado?")) updateReservationStatus(res.id, 'realizado'); }} style={{ fontSize: "0.8rem", padding: "0.1rem", flex: 1, borderColor: "var(--success)", color: "var(--success)" }} className="btn btn-outline" title="Realizado">✅</button>
                                  <button onClick={() => { if(confirm("Paciente faltou?")) updateReservationStatus(res.id, 'falta'); }} style={{ fontSize: "0.8rem", padding: "0.1rem", flex: 1, borderColor: "var(--danger)", color: "var(--danger)" }} className="btn btn-outline" title="Falta">⚠️</button>
                                  <button onClick={() => { if(confirm("Excluir agendamento?")) cancelReservation(res.id); }} style={{ fontSize: "0.8rem", padding: "0.1rem", flex: 1, borderColor: "var(--text-muted)", color: "var(--text-muted)" }} className="btn btn-outline" title="Excluir">🗑️</button>
                                </>
                              ) : (
                                <button onClick={() => { if(confirm("Desfazer status?")) updateReservationStatus(res.id, 'agendado'); }} style={{ fontSize: "0.65rem", padding: "0.2rem", flex: 1, borderColor: "var(--primary)", color: "var(--primary)" }} className="btn btn-outline" title="Desfazer">↩️ Desfazer</button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          sortedDates.length === 0 ? (
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
                      {groupedReservations[dateStr].map(res => {
                        const isBlocked = res.status === 'indisponivel';
                        return (
                        <div key={res.id} className="card animate-slide" style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1.25rem", ...(isBlocked ? { background: "var(--danger-light)", border: "1px solid var(--danger)" } : {}) }}>
                  {/* Horário */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "70px", paddingRight: "1rem", borderRight: "2px solid var(--border-color)" }}>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: isBlocked ? "var(--danger)" : "var(--text-main)" }}>{res.startTime}</span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: isBlocked ? "var(--danger)" : "var(--text-muted)" }}>{res.endTime}</span>
                  </div>
                  
                  {/* Detalhes */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                      <h4 
                        onClick={() => !isBlocked && handlePatientClick(res.patientName)}
                        style={{ fontSize: "1.1rem", fontWeight: 700, color: isBlocked ? "var(--danger)" : (res.status === 'falta' || res.status === 'reagendado' || res.status === 'realizado' ? "var(--text-muted)" : "var(--primary)"), cursor: isBlocked ? "default" : "pointer", textDecoration: isBlocked ? "none" : "underline", textUnderlineOffset: "4px" }}
                        title={isBlocked ? "" : "Ver cadastro do paciente"}
                      >
                        {res.patientName || "Paciente Não Informado"}
                      </h4>
                      {isBlocked && <span className="badge" style={{ backgroundColor: "var(--danger)", color: "white", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Bloqueado</span>}
                      {res.status === 'falta' && <span className="badge" style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Falta</span>}
                      {res.status === 'reagendado' && <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>Reagendado</span>}
                      {res.status === 'confirmado' && <span className="badge" style={{ backgroundColor: "#dcfce7", color: "var(--success, #166534)", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>✓ Confirmado</span>}
                      {res.status === 'realizado' && <span className="badge" style={{ backgroundColor: "#dcfce7", color: "var(--success, #166534)", border: "1px solid var(--success, #166534)", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}>✅ Realizado</span>}
                    </div>
                    <p style={{ fontSize: "0.85rem", color: isBlocked ? "var(--danger)" : "var(--text-secondary)", marginBottom: "0.4rem" }}>
                      {isBlocked ? "Profissional indisponível" : `${getRoomName(res.roomId || '')} ${res.service ? `• ${res.service}` : ''}`}
                    </p>
                  </div>
  
                  {/* Ações */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "flex-end" }}>
                    {isBlocked ? (
                      <button onClick={() => { if(confirm("Deseja remover este bloqueio da agenda?")) cancelReservation(res.id); }} 
                        className="btn btn-outline" style={{ padding: "0.4rem 0.6rem", fontSize: "0.8rem", borderColor: "var(--danger)", color: "var(--danger)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        Desbloquear
                      </button>
                    ) : (!res.status || res.status === 'agendado' || res.status === 'confirmado') ? (
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
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* MODAL DE BLOQUEIO DE HORÁRIO */}
      {isBlockModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          zIndex: 999, padding: "1rem", paddingTop: "5rem", overflowY: "auto"
        }}>
          <div className="card animate-slide" style={{ width: "100%", maxWidth: "400px", position: "relative", padding: "2rem" }}>
            <button 
              onClick={() => setIsBlockModalOpen(false)}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "var(--text-muted)" }}
            >
              ✖
            </button>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--danger)", marginBottom: "1.5rem" }}>
              Bloquear Horário
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Impede que qualquer paciente ou outro profissional agende reuniões com você neste horário.
            </p>
            <form onSubmit={handleBlockTime} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={blockDate} onChange={e => setBlockDate(e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Início</label>
                  <select className="input" value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)}>
                    {TIME_SLOTS?.map((slot: string) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Fim</label>
                  <select className="input" value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)}>
                    {TIME_SLOTS?.map((slot: string) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Recorrência</label>
                  <select className="input" value={blockRecurrence} onChange={e => setBlockRecurrence(e.target.value as any)}>
                    <option value="none">Nenhuma</option>
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                {blockRecurrence !== "none" && (
                  <div style={{ flex: 1 }}>
                    <label className="label">Até quando?</label>
                    <input type="date" className="input" value={blockRecurrenceEnd} onChange={e => setBlockRecurrenceEnd(e.target.value)} min={blockDate} required />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Motivo (Opcional)</label>
                <input className="input" value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Ex: Almoço, Reunião Externa, Médico..." />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: "var(--danger)", color: "white" }}>
                  Confirmar Bloqueio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PACIENTE */}
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

            {/* Cabeçalho destacável para impressão */}
            <div className="only-print" style={{ marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "2px solid #000", padding: "1rem", borderRadius: "8px" }}>
                <div>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#000", margin: 0 }}>{viewingPatient.name}</h2>
                  <p style={{ margin: "0.5rem 0 0 0", color: "#333", fontSize: "1rem" }}>Clínica de Psicologia</p>
                </div>
                {viewingPatient.code && (
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 0.2rem 0", fontSize: "0.9rem", color: "#555" }}>Código do Paciente</p>
                    <h2 style={{ fontSize: "2.2rem", fontWeight: 900, margin: 0, color: "#000" }}>{viewingPatient.code}</h2>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "center", marginTop: "1.5rem", borderBottom: "2px dashed #999", position: "relative" }}>
                <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", backgroundColor: "white", padding: "0 10px", color: "#666", fontSize: "0.85rem" }}>
                  ✂️ Recorte aqui ✂️
                </span>
              </div>
            </div>

            <div className="only-print" style={{ textAlign: "center", marginBottom: "2rem", borderBottom: "2px solid #000", paddingBottom: "1rem", marginTop: "2rem" }}>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#000", textTransform: "uppercase" }}>Ficha de Cadastro do Paciente</h1>
            </div>

            <h2 className="no-print" style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem", color: "var(--primary)" }}>
              {viewingPatient.name} {viewingPatient.code && <span style={{ color: "var(--text-muted)" }}>[{viewingPatient.code}]</span>}
            </h2>
            <div className="only-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#000", margin: 0 }}>Paciente: {viewingPatient.name}</h2>
            </div>

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

              <div className="data-box print-full" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Termos e Consentimento (LGPD)</h4>
                <p style={{ fontSize: "0.95rem", margin: 0, color: viewingPatient.lgpd_consent ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                  {viewingPatient.lgpd_consent ? "✓ Termos de aceite LGPD e veracidade das informações concordados pelo paciente." : "✗ Aceite pendente ou não registrado."}
                </p>
              </div>

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
