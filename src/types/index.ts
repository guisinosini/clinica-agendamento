export type Professional = {
  id: string; // ID único na base de dados, como solicitado (ex: UUID)
  name: string;
  email: string;
  specialty: string;
  avatarUrl?: string | null; // URL da foto de perfil (opcional)
};

export type Room = {
  id: string;
  name: string;
  description: string;
};

export type Reservation = {
  id: string;
  roomId: string;
  professionalId: string;
  date: string; // Formato YYYY-MM-DD
  startTime: string; // Ex: "08:00"
  endTime: string; // Ex: "09:00"
  patientName?: string;
  service?: string;
  status?: "agendado" | "reagendado" | "falta" | "cancelado" | "concluido" | "confirmado";
};

export type Patient = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  guardianName?: string;
  healthPlan?: string;
  healthPlanNumber?: string;
  gender?: string;
  status?: string;
  notes?: string;
  created_at?: string;
};
