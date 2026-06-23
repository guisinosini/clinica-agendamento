"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";

export default function MinhasReservasPage() {
  const { reservations, cancelReservation, rooms, professional, loading } = useReservation();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !professional) {
      router.push("/");
    }
  }, [loading, professional, router]);

  if (loading || !professional) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Carregando suas reservas...</div>;

  // Filtramos apenas as reservas do profissional logado
  const myReservations = reservations.filter((res) => res.professionalId === professional.id);

  // Ordenamos as reservas por data e depois por hora
  const sortedReservations = [...myReservations].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const getRoomName = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    return room ? room.name : "Sala Desconhecida";
  };

  const formatDate = (dateString: string) => {
    // Evitar problemas de timezone adicionando T12:00:00Z ou split
    const [year, month, day] = dateString.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  };

  const handleCancelReservation = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
      cancelReservation(id);
      alert("Reserva cancelada com sucesso.");
    }
  };

  return (
    <div className="container" style={{ paddingBottom: "4rem" }}>
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>Minhas Reservas</h1>
            <p className="text-muted">Gerencie seus horários agendados</p>
          </div>
          <Link href="/" className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
            Voltar
          </Link>
        </div>
      </header>

      <main>
        {sortedReservations.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", animation: "fadeIn 0.3s" }}>
            <h3 style={{ marginBottom: "1rem", color: "var(--text-main)", fontSize: "1.2rem" }}>Você não possui reservas no momento.</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
              Nenhum agendamento futuro encontrado para o seu perfil.
            </p>
            <Link href="/reservar" className="btn" style={{ display: "inline-block" }}>
              Fazer uma Nova Reserva
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeIn 0.3s" }}>
            {sortedReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="card"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1.5rem",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "white",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      fontWeight: 600,
                      textAlign: "center",
                      minWidth: "85px",
                      boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)",
                    }}
                  >
                    <div>{reservation.startTime}</div>
                    <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>às {reservation.endTime}</div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                      {getRoomName(reservation.roomId)}
                    </h3>
                    <p style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>
                      {formatDate(reservation.date)}
                    </p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => handleCancelReservation(reservation.id)}
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--danger)",
                      border: "1px solid var(--danger)",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      fontWeight: 500,
                      transition: "all 0.2s ease",
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
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
