"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import { Reservation, Room, Professional, Service } from "../types";
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
  "06:00", "07:00", "08:00", "09:00", "10:00",
  "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

interface ReservationContextData {
  reservations: Reservation[];
  addReservations: (newReservations: Omit<Reservation, "id">[]) => Promise<void>;
  cancelReservation: (id: string) => Promise<void>;
  updateReservationStatus: (id: string, status: string) => Promise<boolean>;
  rooms: Room[];
  professional: Professional | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, specialty: string, password?: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (id: string, name: string, specialty: string, avatarUrl?: string) => Promise<{ success: boolean; message: string }>;
  updatePassword: (id: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  // Funções Administrativas
  fetchAllReservations: () => Reservation[]; // Apenas retorna tudo
  addRoom: (id: string, name: string, description: string) => Promise<boolean>;
  updateRoom: (id: string, name: string, description: string) => Promise<boolean>;
  deleteRoom: (id: string) => Promise<boolean>;
  allProfessionals: Professional[];
  servicesList: Service[];
  fetchServices: () => Promise<void>;
  addService: (name: string, description?: string) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
}

const ReservationContext = createContext<ReservationContextData>({} as ReservationContextData);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ao iniciar o app, apenas carrega salas e reservas gerais, não um profissional fixo
    fetchData();
    
    // Tenta recuperar sessão salva no localStorage (persistência básica de login)
    const savedEmail = localStorage.getItem("@Clinica:email");
    if (savedEmail) {
      login(savedEmail);
    } else {
      setLoading(false);
    }
    
    const subscription = supabase
      .channel('reservations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchReservations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchRooms(), fetchReservations(), fetchProfessionals(), fetchServices()]);
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase.from('professionals').select('*').order('name');
    if (data) {
      setAllProfessionals(data.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        specialty: p.specialty,
        avatarUrl: p.avatar_url ?? null
      })));
    }
  };

  const login = async (email: string, password?: string) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('professionals')
        .select('*')
        .eq('email', email.trim().toLowerCase());
        
      if (password) {
        query = query.eq('password', password);
      }

      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;

      if (data) {
        setProfessional({ id: data.id, name: data.name, email: data.email, specialty: data.specialty, avatarUrl: data.avatar_url ?? null });
        localStorage.setItem("@Clinica:email", data.email);
        // Não salvamos a senha no localStorage por segurança
        return { success: true, message: "Login realizado com sucesso!" };
      } else {
        return { success: false, message: password ? "E-mail ou senha incorretos." : "E-mail não encontrado." };
      }
    } catch (err) {
      console.error("Erro no login:", err);
      return { success: false, message: "Erro ao realizar o login." };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, specialty: string, password?: string) => {
    try {
      setLoading(true);
      // Verifica se o e-mail já existe
      const { data: existingUser } = await supabase
        .from('professionals')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingUser) {
        return { success: false, message: "Este e-mail já está cadastrado." };
      }

      // Insere o novo profissional
      const payload: any = { name, email: email.trim().toLowerCase(), specialty };
      if (password) payload.password = password;

      const { data, error } = await supabase
        .from('professionals')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProfessional({ id: data.id, name: data.name, email: data.email, specialty: data.specialty, avatarUrl: data.avatar_url ?? null });
        localStorage.setItem("@Clinica:email", data.email);
        return { success: true, message: "Cadastro realizado com sucesso!" };
      }
      return { success: false, message: "Erro desconhecido ao cadastrar." };
    } catch (err) {
      console.error("Erro no cadastro:", err);
      return { success: false, message: "Erro de conexão ao tentar cadastrar." };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setProfessional(null);
    localStorage.removeItem("@Clinica:email");
  };

  const updateProfile = async (id: string, name: string, specialty: string, avatarUrl?: string) => {
    try {
      const updateData: Record<string, string> = { name, specialty };
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

      const { data, error } = await supabase
        .from('professionals')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProfessional({ id: data.id, name: data.name, email: data.email, specialty: data.specialty, avatarUrl: data.avatar_url ?? null });
        return { success: true, message: "Perfil atualizado com sucesso!" };
      }
      return { success: false, message: "Erro desconhecido." };
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err);
      return { success: false, message: "Erro ao atualizar o perfil." };
    }
  };

  const updatePassword = async (id: string, newPassword: string) => {
    try {
      const { error } = await supabase
        .from('professionals')
        .update({ password: newPassword })
        .eq('id', id);

      if (error) throw error;
      return { success: true, message: "Senha atualizada com sucesso!" };
    } catch (err) {
      console.error("Erro ao atualizar senha:", err);
      return { success: false, message: "Erro ao atualizar a senha." };
    }
  };

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('name');
    if (data) setRooms(data.map(r => ({ id: r.id, name: r.name, description: r.description })));
  };

  const addRoom = async (id: string, name: string, description: string) => {
    const { error } = await supabase.from('rooms').insert([{ id, name, description }]);
    if (!error) { await fetchRooms(); return true; }
    console.error(error); return false;
  };

  const updateRoom = async (id: string, name: string, description: string) => {
    const { error } = await supabase.from('rooms').update({ name, description }).eq('id', id);
    if (!error) { await fetchRooms(); return true; }
    console.error(error); return false;
  };

  const deleteRoom = async (id: string) => {
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (!error) { await fetchRooms(); return true; }
    console.error(error); return false;
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('name');
    if (data) setServicesList(data);
  };

  const addService = async (name: string, description?: string) => {
    const { error } = await supabase.from('services').insert([{ name, description }]);
    if (!error) { await fetchServices(); return true; }
    console.error(error); return false;
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (!error) { await fetchServices(); return true; }
    console.error(error); return false;
  };

  const fetchReservations = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .gte('date', NEXT_DAYS[0]);
    
    if (data) {
      setReservations(data.map(r => ({
        id: r.id,
        roomId: r.room_id,
        professionalId: r.professional_id,
        date: r.date,
        startTime: r.start_time.substring(0, 5),
        endTime: r.end_time.substring(0, 5),
        patientName: r.patient_name,
        service: r.service,
        status: r.status || 'agendado'
      })));
    }
  };

  const addReservations = async (newReservations: Omit<Reservation, "id">[]) => {
    const dbReservations = newReservations.map(res => ({
      room_id: res.roomId,
      professional_id: res.professionalId,
      date: res.date,
      start_time: `${res.startTime}:00`,
      end_time: `${res.endTime}:00`,
      patient_name: res.patientName || null,
      service: res.service || null
    }));

    const { data, error } = await supabase.from('reservations').insert(dbReservations).select();

    if (!error && data) {
      fetchReservations();
    } else {
      console.error("Erro ao inserir:", error);
      alert("Houve um erro ao confirmar a reserva.");
    }
  };

  const updateReservationStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (!error) {
      setReservations(prev => prev.map(res => res.id === id ? { ...res, status: status as any } : res));
      return true;
    } else {
      console.error("Erro ao atualizar status:", error);
      return false;
    }
  };

  const cancelReservation = async (id: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id);

    if (!error) {
      setReservations(prev => prev.filter(res => res.id !== id));
    } else {
      console.error("Erro ao deletar:", error);
      alert("Houve um erro ao cancelar a reserva.");
    }
  };

  const contextValue = useMemo(() => ({
    reservations,
    addReservations,
    cancelReservation,
    updateReservationStatus,
    rooms,
    professional,
    loading,
    login,
    register,
    updateProfile,
    updatePassword,
    logout,
    fetchAllReservations: () => reservations,
    addRoom,
    updateRoom,
    deleteRoom,
    allProfessionals,
    servicesList,
    fetchServices,
    addService,
    deleteService
  }), [reservations, rooms, professional, loading, allProfessionals, servicesList]);

  return (
    <ReservationContext.Provider value={contextValue}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => useContext(ReservationContext);
