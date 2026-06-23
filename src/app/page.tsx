"use client";

import Link from "next/link";
import { useReservation } from "../context/ReservationContext";

export default function Home() {
  const { professional, loading } = useReservation();

  if (loading || !professional) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Carregando dados da clínica...</div>;

  return (
    <div className="container">
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Clínica Agendamentos</h1>
          <p className="text-muted">Bem-vindo(a), {professional.name}</p>
          <small style={{ color: 'var(--text-muted)' }}>ID do Profissional: {professional.id}</small>
        </div>
        <button className="btn btn-outline">Sair</button>
      </header>

      <main className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Fazer uma Nova Reserva</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            Selecione uma das 5 salas disponíveis e reserve o seu horário.
          </p>
          <Link href="/reservar" className="btn" style={{ display: 'inline-block' }}>
            Acessar Salas
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Espiar Disponibilidade</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            Visualize o calendário geral para saber quais horários e salas estão livres hoje.
          </p>
          <Link href="/disponibilidade" className="btn btn-outline" style={{ display: 'inline-block' }}>
            Ver Calendário Geral
          </Link>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem' }}>Minhas Reservas</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            Acompanhe seus horários agendados e gerencie suas marcações.
          </p>
          <Link href="/minhas-reservas" className="btn btn-outline" style={{ display: 'inline-block' }}>
            Visualizar Histórico
          </Link>
        </div>
      </main>
    </div>
  );
}
