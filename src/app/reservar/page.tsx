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
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");

  useEffect(() => {
    if (!loading && !professional) {
      router.push("/");
    }
  }, [loading, professional, router]);

  if (loading || !professional) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Carregando salas...</div>;

  const formatDayName = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00Z");
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Hoje";
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
  };

  const formatDayNumber = (dateStr: string) => {
    return dateStr.split('-')[2];
  };

  // Identifica slots que já estão ocupados para a sala e data selecionadas (Otimizado com useMemo)
  const occupiedSlots = useMemo(() => {
    if (!selectedRoom) return [];
    return reservations
      .filter(res => res.roomId === selectedRoom && res.date === selectedDate)
      .map(res => res.startTime);
  }, [reservations, selectedRoom, selectedDate]);

  const handleSlotClick = (slot: string) => {
    if (occupiedSlots.includes(slot)) return; // não faz nada se estiver ocupado
    
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot].sort());
    }
  };

  const handleConfirm = () => {
    if (!selectedRoom || selectedSlots.length === 0) return;
    
    // Gerar reservas para cada slot selecionado
    // Como os slots são de 30 min, precisamos calcular o endTime
    const newReservations = selectedSlots.map(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const dateObj = new Date();
      dateObj.setHours(hours, minutes + 30, 0); // soma 30 min
      
      const endHours = String(dateObj.getHours()).padStart(2, '0');
      const endMinutes = String(dateObj.getMinutes()).padStart(2, '0');
      const endTime = `${endHours}:${endMinutes}`;

      return {
        roomId: selectedRoom,
        professionalId: professional.id,
        date: selectedDate,
        startTime: slot,
        endTime: endTime
      };
    });

    addReservations(newReservations);
    
    setFeedbackMsg("Reserva confirmada com sucesso!");
    
    setTimeout(() => {
      setSelectedRoom(null);
      setSelectedSlots([]);
      setFeedbackMsg("");
      router.push("/minhas-reservas"); // Redireciona para ver a reserva
    }, 1500);
  };

  return (
    <div className="container" style={{ paddingBottom: '6rem' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nova Reserva</h1>
        <Link href="/" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Voltar</Link>
      </header>

      {feedbackMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--success)', color: 'white', borderRadius: '8px', marginBottom: '1.5rem', animation: 'fadeIn 0.3s' }}>
          {feedbackMsg}
        </div>
      )}

      {/* Passo 1: Selecionar a Sala */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>1. Selecione a Sala</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {rooms.map(room => (
            <div 
              key={room.id}
              onClick={() => { setSelectedRoom(room.id); setSelectedSlots([]); }}
              style={{
                padding: '1.5rem',
                borderRadius: '12px',
                border: `2px solid ${selectedRoom === room.id ? 'var(--primary)' : 'var(--border-color)'}`,
                backgroundColor: selectedRoom === room.id ? '#EEF2FF' : 'var(--card-bg)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRoom === room.id ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none'
              }}
            >
              <h3 style={{ marginBottom: '0.5rem', color: selectedRoom === room.id ? 'var(--primary)' : 'inherit' }}>{room.name}</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{room.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Só mostra calendário e horários se uma sala for selecionada */}
      {selectedRoom && (
        <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
          
          {/* Passo 2: Selecionar Data */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>2. Escolha o Dia</h2>
            <div className="flex" style={{ gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {NEXT_DAYS.map(date => (
                <div 
                  key={date}
                  onClick={() => { setSelectedDate(date); setSelectedSlots([]); }}
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
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.2rem' }}>{formatDayNumber(date)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Passo 3: Escolher os Horários (Slots 30 min) */}
          <section style={{ marginBottom: '2rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem' }}>3. Selecione os Horários (30 min)</h2>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {selectedSlots.length} slot(s) escolhidos
              </span>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem' }}>
              {TIME_SLOTS.map(slot => {
                const isOccupied = occupiedSlots.includes(slot);
                const isSelected = selectedSlots.includes(slot);
                
                return (
                  <button
                    key={slot}
                    disabled={isOccupied}
                    onClick={() => handleSlotClick(slot)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontWeight: 500,
                      border: '1px solid',
                      borderColor: isOccupied ? 'var(--border-color)' : isSelected ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: isOccupied ? '#F3F4F6' : isSelected ? 'var(--primary)' : 'white',
                      color: isOccupied ? '#9CA3AF' : isSelected ? 'white' : 'var(--text-main)',
                      cursor: isOccupied ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      textDecoration: isOccupied ? 'line-through' : 'none'
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            
            {/* Legenda */}
            <div className="flex" style={{ gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <div className="flex items-center" style={{ gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}></div>
                <span>Disponível</span>
              </div>
              <div className="flex items-center" style={{ gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: 'var(--primary)', borderRadius: '4px' }}></div>
                <span>Selecionado</span>
              </div>
              <div className="flex items-center" style={{ gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: '#F3F4F6', border: '1px solid var(--border-color)', borderRadius: '4px' }}></div>
                <span>Ocupado</span>
              </div>
            </div>
          </section>

          {/* Passo 4: Confirmação */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', backgroundColor: 'white', borderTop: '1px solid var(--border-color)', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600 }}>Total: {selectedSlots.length * 30} minutos</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {selectedRoom && rooms.find(r => r.id === selectedRoom)?.name} | {selectedDate.split('-').reverse().join('/')}
                </p>
              </div>
              <button 
                onClick={handleConfirm}
                disabled={selectedSlots.length === 0}
                className="btn"
                style={{ opacity: selectedSlots.length === 0 ? 0.5 : 1, padding: '0.75rem 2rem' }}
              >
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
