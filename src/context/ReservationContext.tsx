"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Reservation, Room, Professional } from "../types";
import { supabase } from "../lib/supabase";

export const getNext7Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    dates.push(nextDate.toISOString().split("T")[0]);
  }
  return dates;
};

export const NEXT_DAYS = getNext7Days();

export const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30",
];

// O UUID fixo que usaremos para o nosso primeiro profissional no banco
const DEFAULT_PROFESSIONAL_ID = "11111111-1111-1111-1111-111111111111";

interface ReservationContextData {
  reservations: Reservation[];
  addReservations: (newReservations: Omit<Reservation, "id">[]) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  rooms: Room[];
  professional: Professional | null;
  loading: boolean;
}

const ReservationContext = createContext<ReservationContextData>({} as ReservationContextData);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Configurando Real-time Subscription para as reservas
    const subscription = supabase
      .channel('reservations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, payload => {
        // Recarregar os dados se houver qualquer mudança no banco
        fetchReservations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProfessional(), fetchRooms(), fetchReservations()]);
    setLoading(false);
  };

  const fetchProfessional = async () => {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', DEFAULT_PROFESSIONAL_ID)
      .single();
    
    if (data) setProfessional({ id: data.id, name: data.name, email: data.email, specialty: data.specialty });
  };

  const fetchRooms = async () => {
    const { data, error } = await supabase.from('rooms').select('*').order('name');
    if (data) setRooms(data.map(r => ({ id: r.id, name: r.name, description: r.description })));
  };

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      // Buscamos as reservas a partir de hoje
      .gte('date', NEXT_DAYS[0]);
    
    if (data) {
      setReservations(data.map(r => ({
        id: r.id,
        roomId: r.room_id,
        professionalId: r.professional_id,
        date: r.date,
        startTime: r.start_time.substring(0, 5), // '08:00:00' -> '08:00'
        endTime: r.end_time.substring(0, 5)
      })));
    }
  };

  const addReservations = async (newReservations: Omit<Reservation, "id">[]) => {
    // Formatar para o banco de dados
    const dbReservations = newReservations.map(res => ({
      room_id: res.roomId,
      professional_id: res.professionalId,
      date: res.date,
      start_time: `${res.startTime}:00`,
      end_time: `${res.endTime}:00`
    }));

    const { data, error } = await supabase
      .from('reservations')
      .insert(dbReservations)
      .select();

    if (!error && data) {
      // Atualiza localmente imediatamente para dar feedback rápido
      fetchReservations();
    } else {
      console.error("Erro ao inserir:", error);
      alert("Houve um erro ao confirmar a reserva.");
    }
  };

  const cancelReservation = async (id: string) => {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (!error) {
      setReservations(prev => prev.filter(res => res.id !== id));
    } else {
      console.error("Erro ao deletar:", error);
      alert("Houve um erro ao cancelar a reserva.");
    }
  };

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        addReservations,
        cancelReservation,
        rooms,
        professional,
        loading
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => useContext(ReservationContext);
