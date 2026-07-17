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
  roomId?: string | null;
  professionalId: string;
  date: string; // Formato YYYY-MM-DD
  startTime: string; // Ex: "08:00"
  endTime: string; // Ex: "09:00"
  patientName?: string;
  service?: string;
  status?: "agendado" | "reagendado" | "falta" | "cancelado" | "concluido" | "confirmado" | "realizado" | "indisponivel";
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
  cpf?: string;
  parentsName?: string;
  parentsProfession?: string;
  schoolName?: string;
  schoolGrade?: string;
  schoolType?: string;
  lgpd_consent?: boolean;
  created_at?: string;
};

export type Service = {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  created_at?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'baixa' | 'media' | 'alta';
  created_by: string; // ID do profissional que criou
  created_at?: string;
};

export type TaskAssignment = {
  id: string;
  task_id: string;
  professional_id: string; // ID do profissional que recebeu a tarefa
  status: 'pendente' | 'concluida';
  viewed: boolean;
  comment?: string;
  completed_at?: string;
  created_at?: string;
  task?: Task; // Relação para quando fizermos JOIN
  professional?: Professional; // Relação para quem atribuiu/recebeu
};
