"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Reservation, Room, Professional } from "../types";

// Utils
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

export const MOCK_ROOMS: Room[] = [
  { id: "r1", name: "Consultório 1", description: "Terapia Individual" },
  { id: "r2", name: "Consultório 2", description: "Casal e Família" },
  { id: "r3", name: "Consultório 3", description: "Avaliação Psicológica" },
  { id: "r4", name: "Consultório 4", description: "Infantil (Ludoterapia)" },
  { id: "r5", name: "Sala de Reunião", description: "Reuniões e Grupos" },
];

export const loggedInProfessional: Professional = {
  id: "prof_a1b2c3d4",
  name: "Dr. João Silva",
  email: "joao@clinica.com",
  specialty: "Psicologia",
};

// Dados Iniciais Simulados
const INITIAL_RESERVATIONS: Reservation[] = [
  { id: "res1", roomId: "r1", professionalId: "outroid", date: NEXT_DAYS[0], startTime: "09:00", endTime: "09:30" },
  { id: "res2", roomId: "r1", professionalId: "outroid", date: NEXT_DAYS[0], startTime: "09:30", endTime: "10:00" },
  { id: "res3", roomId: "r2", professionalId: "outroid", date: NEXT_DAYS[1], startTime: "14:00", endTime: "14:30" },
  { id: "res4", roomId: "r3", professionalId: "prof_a1b2c3d4", date: NEXT_DAYS[0], startTime: "10:00", endTime: "10:30" },
  { id: "res5", roomId: "r3", professionalId: "prof_a1b2c3d4", date: NEXT_DAYS[0], startTime: "10:30", endTime: "11:00" },
  { id: "res6", roomId: "r5", professionalId: "outroid", date: NEXT_DAYS[0], startTime: "16:00", endTime: "16:30" },
];

interface ReservationContextData {
  reservations: Reservation[];
  addReservations: (newReservations: Omit<Reservation, "id">[]) => void;
  cancelReservation: (id: string) => void;
  rooms: Room[];
  professional: Professional;
}

const ReservationContext = createContext<ReservationContextData>({} as ReservationContextData);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);

  const addReservations = (newReservations: Omit<Reservation, "id">[]) => {
    const createdReservations = newReservations.map((res) => ({
      ...res,
      id: `res_${Math.random().toString(36).substr(2, 9)}`,
    }));
    setReservations((prev) => [...prev, ...createdReservations]);
  };

  const cancelReservation = (id: string) => {
    setReservations((prev) => prev.filter((res) => res.id !== id));
  };

  return (
    <ReservationContext.Provider
      value={{
        reservations,
        addReservations,
        cancelReservation,
        rooms: MOCK_ROOMS,
        professional: loggedInProfessional,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => useContext(ReservationContext);
