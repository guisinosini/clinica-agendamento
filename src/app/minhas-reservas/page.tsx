"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";

export default function MinhasReservasPage() {
  const { reservations, cancelReservation, rooms, professional, loading } = useReservation();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !professional) router.push("/");
  }, [loading, professional, router]);

  if (loading || !professional) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Carregando suas reservas...</p>
    </div>
  );

  const myReservations = reservations
    .filter((res) => res.professionalId === professional.id)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  const getRoomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.name ?? "Sala Desconhecida";

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  };

  const isToday = (dateString: string) => {
    return dateString === new Date().toISOString().split("T")[0];
  };

  const handleCancel = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
      cancelReservation(id);
    }
  };

  // Agrupar por data
  const grouped = myReservations.reduce<Record<string, typeof myReservations>>((acc, res) => {
    if (!acc[res.date]) acc[res.date] = [];
    acc[res.date].push(res);
    return acc;
  }, {});

  return (
    <div className="container animate-fade" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      {/* Header */}
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Minhas Reservas</h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginLeft: "1.75rem" }}>
          {myReservations.length > 0
            ? `${myReservations.length} agendamento(s) encontrado(s)`
            : "Nenhum agendamento futuro"}
        </p>
      </header>

      {myReservations.length === 0 ? (
        <div className="card animate-slide" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>📋</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.75rem" }}>Nenhuma reserva encontrada</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", maxWidth: "320px", margin: "0 auto 2rem" }}>
            Você ainda não tem agendamentos. Que tal reservar uma sala agora?
          </p>
          <Link href="/reservar" className="btn">
            Fazer Nova Reserva
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              {/* Separador de Data */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                <div style={{
                  padding: "0.3rem 0.875rem",
                  borderRadius: "var(--radius-full)",
                  background: isToday(date)
                    ? "var(--primary)"
                    : "var(--primary-light)",
                  color: isToday(date) ? "var(--primary-mid)" : "var(--primary)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "capitalize",
                  boxShadow: isToday(date) ? "var(--clay-btn)" : "var(--clay-input)",
                }}>
                  {isToday(date) ? "📍 Hoje" : formatDate(date)}
                </div>
                <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }} />
              </div>

              {/* Cards de Reserva */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {items.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="card"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "1.25rem 1.5rem",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                      {/* Badge de Horário */}
                      <div style={{
                        background: "var(--primary)",
                        color: "var(--primary-mid)",
                        padding: "0.85rem 1rem",
                        borderRadius: "var(--radius-md)",
                        fontWeight: 700,
                        textAlign: "center",
                        minWidth: "90px",
                        boxShadow: "var(--clay-btn)",
                        flexShrink: 0,
                      }}>
                        <div style={{ fontSize: "1.1rem" }}>{reservation.startTime}</div>
                        <div style={{ fontSize: "0.72rem", opacity: 0.85, marginTop: "0.1rem" }}>até {reservation.endTime}</div>
                      </div>

                      {/* Info da Reserva */}
                      <div>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.2rem", color: "var(--text-main)" }}>
                          {reservation.patientName || "Paciente não informado"}
                        </h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                          {getRoomName(reservation.roomId)}
                          {reservation.service && ` • ${reservation.service}`}
                        </p>
                        <span className="badge badge-primary" style={{ fontSize: "0.72rem" }}>
                          1 hora
                        </span>
                      </div>
                    </div>

                    {/* Botão Cancelar */}
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      style={{
                        backgroundColor: "transparent",
                        color: "var(--danger)",
                        border: "1.5px solid var(--danger)",
                        padding: "0.5rem 1.1rem",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--danger)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "var(--danger)";
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
