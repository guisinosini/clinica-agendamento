"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation, NEXT_DAYS, TIME_SLOTS } from "../../context/ReservationContext";

export default function DisponibilidadePage() {
  const { rooms, reservations, professional, loading } = useReservation();
  const [selectedDate, setSelectedDate] = useState<string>(NEXT_DAYS[0]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !professional) router.push("/");
  }, [loading, professional, router]);

  if (loading || !professional) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Carregando grade de horários...</p>
    </div>
  );

  const formatSelectedDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  };

  // Mapeamento O(1) das reservas para o dia selecionado
  const reservationsMap = useMemo(() => {
    const map = new Map<string, { mine: boolean }>();
    reservations.forEach(res => {
      if (res.date === selectedDate && (!res.status || res.status === 'agendado' || res.status === 'confirmado' || res.status === 'realizado')) {
        map.set(`${res.roomId}-${res.startTime}`, { mine: res.professionalId === professional.id });
      }
    });
    return map;
  }, [reservations, selectedDate, professional.id]);

  // Estatísticas do dia
  const stats = useMemo(() => {
    const total = rooms.length * TIME_SLOTS.length;
    const occupied = reservationsMap.size;
    const mine = Array.from(reservationsMap.values()).filter(v => v.mine).length;
    return { total, occupied, free: total - occupied, mine };
  }, [reservationsMap, rooms.length]);

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
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Disponibilidade</h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginLeft: "1.75rem", textTransform: "capitalize" }}>
          {formatSelectedDate(selectedDate)}
        </p>
      </header>

      {/* Seletor de Data */}
      <section style={{ marginBottom: "1.75rem" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem", gap: "0.75rem" }}>
          <div style={{ fontSize: "2rem" }}>📅</div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>Selecione o dia para visualizar</p>
          <input
            type="date"
            value={selectedDate}
            min={NEXT_DAYS[0]}
            onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
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
        </div>
      </section>

      {/* Cards de Estatísticas */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.875rem", marginBottom: "2rem" }}>
        {[
          { label: "Livres", value: stats.free, color: "var(--success)", bg: "var(--success-light)", icon: "✅" },
          { label: "Ocupados", value: stats.occupied, color: "var(--danger)", bg: "var(--danger-light)", icon: "🔴" },
          { label: "Suas Reservas", value: stats.mine, color: "var(--primary)", bg: "var(--primary-light)", icon: "📌" },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: "center", padding: "1.25rem 1rem", backgroundColor: stat.bg, border: "none" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: "0.3rem" }}>{stat.icon}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: "0.78rem", color: stat.color, fontWeight: 600, marginTop: "0.3rem", opacity: 0.8 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabela de Grade */}
      <section className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ background: "var(--primary-light)" }}>
                <th style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--border-color)",
                  textAlign: "left",
                  width: "90px",
                  position: "sticky", left: 0, zIndex: 2,
                  background: "var(--primary-light)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--primary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  Horário
                </th>
                {rooms.map(room => (
                  <th key={room.id} style={{
                    padding: "1rem",
                    borderBottom: "1px solid var(--border-color)",
                    textAlign: "center",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                  }}>
                    {room.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, slotIdx) => (
                <tr
                  key={slot}
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: slotIdx % 2 === 0 ? "var(--bg-color)" : "var(--card-bg)",
                  }}
                >
                  {/* Coluna de Horário */}
                  <td style={{
                    padding: "0.75rem 1.25rem",
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    position: "sticky", left: 0, zIndex: 1,
                    borderRight: "1px solid var(--border-color)",
                    backgroundColor: slotIdx % 2 === 0 ? "var(--bg-color)" : "var(--card-bg)",
                    whiteSpace: "nowrap",
                  }}>
                    {slot}
                  </td>

                  {/* Células de Status */}
                  {rooms.map(room => {
                    const data = reservationsMap.get(`${room.id}-${slot}`);
                    const occupied = !!data;
                    const mine = data?.mine ?? false;

                    let bg = "var(--bg-color)", color = "var(--text-secondary)", label = "Livre", icon = "✓";
                    if (occupied && mine) { bg = "var(--primary)"; color = "var(--primary-mid)"; label = "Sua Reserva"; icon = "📌"; }
                    if (occupied && !mine) { bg = "var(--primary-light)"; color = "var(--primary)"; label = "Ocupado"; icon = "✗"; }

                    return (
                      <td key={room.id} style={{ padding: "0.5rem", textAlign: "center" }}>
                        <div style={{
                          backgroundColor: bg,
                          color,
                          padding: "0.45rem 0.5rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          minWidth: "90px",
                          justifyContent: "center",
                        }}>
                          <span>{icon}</span>
                          <span>{label}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <p style={{ marginBottom: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Encontrou um horário livre perfeito?</p>
        <Link href="/reservar" className="btn">
          Ir para Nova Reserva
        </Link>
      </div>
    </div>
  );
}
