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
    if (!loading && !professional) {
      router.push("/");
    }
  }, [loading, professional, router]);

  if (loading || !professional) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Carregando grade de horários...</div>;

  const formatDayName = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00Z");
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Hoje";
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
  };

  // Mapeamento otimizado das reservas para o dia selecionado (O(1) lookup)
  const reservationsMap = useMemo(() => {
    const map = new Map<string, { mine: boolean }>();
    reservations.forEach(res => {
      if (res.date === selectedDate) {
        const key = `${res.roomId}-${res.startTime}`;
        map.set(key, { mine: res.professionalId === professional.id });
      }
    });
    return map;
  }, [reservations, selectedDate, professional.id]);

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Espiar Disponibilidade</h1>
        <Link href="/" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Voltar</Link>
      </header>

      {/* Selecionador de Data */}
      <section style={{ marginBottom: '2rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Escolha o dia para visualizar</h2>
          <input 
            type="date" 
            value={selectedDate}
            min={NEXT_DAYS[0]}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(e.target.value);
              }
            }}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              outline: 'none',
              fontFamily: 'inherit',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          />
        </div>
        <div className="flex" style={{ gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {NEXT_DAYS.map(date => (
            <div 
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                minWidth: '80px',
                padding: '1rem 0.5rem',
                textAlign: 'center',
                borderRadius: '12px',
                border: `2px solid ${selectedDate === date ? 'var(--primary)' : 'var(--border-color)'}`,
                backgroundColor: selectedDate === date ? 'var(--primary)' : 'var(--card-bg)',
                color: selectedDate === date ? 'white' : 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.9 }}>{formatDayName(date)}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{date.split('-')[2]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grade / Matriz de Horários */}
      <section className="card" style={{ padding: '0', overflowX: 'auto', animation: 'fadeIn 0.3s' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', position: 'sticky', left: 0, zIndex: 2, textAlign: 'left', width: '100px' }}>
                Horário
              </th>
              {rooms.map(room => (
                <th key={room.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', textAlign: 'center' }}>
                  {room.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot} style={{ borderBottom: '1px solid var(--border-color)' }}>
                {/* Coluna Horário Fixa */}
                <td style={{ padding: '1rem', fontWeight: 600, backgroundColor: 'white', position: 'sticky', left: 0, zIndex: 1, borderRight: '1px solid var(--border-color)' }}>
                  {slot}
                </td>
                
                {/* Status de Cada Sala */}
                {rooms.map(room => {
                  const cellKey = `${room.id}-${slot}`;
                  const reservation = reservationsMap.get(cellKey);
                  const occupied = !!reservation;
                  const mine = reservation?.mine ?? false;
                  
                  return (
                    <td key={room.id} style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <div 
                        style={{
                          backgroundColor: occupied ? (mine ? '#E0E7FF' : '#FEE2E2') : '#D1FAE5',
                          color: occupied ? (mine ? 'var(--primary)' : '#B91C1C') : '#047857',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        {occupied ? (mine ? "Sua Reserva" : "Ocupado") : "Livre"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      {/* Botão Flutuante Sugerindo Ação */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Encontrou um horário livre perfeito para você?</p>
        <Link href="/reservar" className="btn">
          Ir para Nova Reserva
        </Link>
      </div>

    </div>
  );
}
