"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation, NEXT_DAYS, TIME_SLOTS } from "../../context/ReservationContext";
import { supabase } from "../../lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const calculateAge = (birthDate: string) => {
  if (!birthDate) return null;
  const birth = new Date(birthDate + "T00:00:00");
  const today = new Date();
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  if (today.getDate() < birth.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years === 0 && months === 0) return "Menos de 1 mês";
  
  let ageStr = "";
  if (years > 0) ageStr += `${years} ano${years > 1 ? 's' : ''}`;
  if (months > 0) {
    if (years > 0) ageStr += " e ";
    ageStr += `${months} mês${months > 1 ? 'es' : ''}`;
  }
  return ageStr;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { rooms, fetchAllReservations, cancelReservation, updateReservationStatus, addRoom, updateRoom, deleteRoom, loading, addReservations, servicesList, addService, updateService, deleteService, professional } = useReservation();
  const allReservations = fetchAllReservations();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "reservations" | "rooms" | "professionals" | "new_reservation" | "patients" | "disponibilidade" | "relatorios" | "services" | "tarefas" | "finances">("dashboard");
  const [selectedDispDate, setSelectedDispDate] = useState<string>(NEXT_DAYS[0]);
  const [professionalsMap, setProfessionalsMap] = useState<Record<string, string>>({});
  const [professionalsList, setProfessionalsList] = useState<any[]>([]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  
  // Filters State
  const [filterRoom, setFilterRoom] = useState<string>("");
  const [filterProf, setFilterProf] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  // Report Filters State
  const [reportPatient, setReportPatient] = useState("");
  const [reportProf, setReportProf] = useState("");
  const [reportHealthPlan, setReportHealthPlan] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportStatus, setReportStatus] = useState("");

  // Room Form State
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomDesc, setRoomDesc] = useState("");

  // New Reservation Form State
  const [newResProfId, setNewResProfId] = useState("");
  const [newResRoomId, setNewResRoomId] = useState("");
  const [newResDate, setNewResDate] = useState("");
  const [newResSlots, setNewResSlots] = useState<string[]>([]);
  const [newResPatient, setNewResPatient] = useState("");
  const [newResService, setNewResService] = useState("");

  // Reschedule Form State
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleRoom, setRescheduleRoom] = useState("");

  // Patient Form State
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patName, setPatName] = useState("");
  const [patEmail, setPatEmail] = useState("");
  const [patPhone, setPatPhone] = useState("");
  const [patBirthDate, setPatBirthDate] = useState("");
  const [patAddress, setPatAddress] = useState("");
  const [patGuardian, setPatGuardian] = useState("");
  const [patHealthPlan, setPatHealthPlan] = useState("");
  const [patHealthPlanNumber, setPatHealthPlanNumber] = useState("");
  const [patGender, setPatGender] = useState("");
  const [patNotes, setPatNotes] = useState("");
  const [patCpf, setPatCpf] = useState("");
  const [patParentsName, setPatParentsName] = useState("");
  const [patParentsProfession, setPatParentsProfession] = useState("");
  const [patSchoolName, setPatSchoolName] = useState("");
  const [patSchoolGrade, setPatSchoolGrade] = useState("");
  const [patSchoolType, setPatSchoolType] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [patientFilterHealthPlan, setPatientFilterHealthPlan] = useState("");
  const [patientFilterAgeGroup, setPatientFilterAgeGroup] = useState("");
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<any | null>(null);

  // Service Form State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceDuration, setServiceDuration] = useState("60");

  // Admin Tasks State
  const [adminTasks, setAdminTasks] = useState<any[]>([]);
  const [loadingAdminTasks, setLoadingAdminTasks] = useState(false);
  const [delayedAdminTasksCount, setDelayedAdminTasksCount] = useState<number>(0);

  // Finances State
  const [isFinancesUnlocked, setIsFinancesUnlocked] = useState(false);
  const [financePasswordInput, setFinancePasswordInput] = useState("");
  const [financesList, setFinancesList] = useState<any[]>([]);
  const [financeStartDate, setFinanceStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [financeEndDate, setFinanceEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return date.toISOString().split("T")[0];
  });
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [financeForm, setFinanceForm] = useState({ id: "", date: new Date().toISOString().split("T")[0], description: "", category: "Consulta", type: "receita", amount: "", due_date: "", is_paid: true });
  const [isSubmittingFinance, setIsSubmittingFinance] = useState(false);

  const fetchFinances = async () => {
    const { data } = await supabase
      .from('finances')
      .select('*')
      .gte('date', financeStartDate)
      .lte('date', financeEndDate)
      .order('date', { ascending: false });
    if (data) setFinancesList(data);
  };

  useEffect(() => {
    if (activeTab === "finances" && isFinancesUnlocked) {
      fetchFinances();
    }
  }, [activeTab, isFinancesUnlocked, financeStartDate, financeEndDate]);

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFinance(true);
    
    const payload: any = {
      date: financeForm.date,
      description: financeForm.description,
      category: financeForm.category,
      type: financeForm.type,
      amount: parseFloat(financeForm.amount.replace(',', '.')),
      is_paid: financeForm.is_paid
    };

    if (financeForm.type === 'despesa' && financeForm.due_date) {
      payload.due_date = financeForm.due_date;
    }

    if (financeForm.id) {
      await supabase.from('finances').update(payload).eq('id', financeForm.id);
    } else {
      await supabase.from('finances').insert([payload]);
    }
    
    await fetchFinances();
    setShowFinanceModal(false);
    setIsSubmittingFinance(false);
  };

  const handleTogglePaid = async (financeId: string, currentStatus: boolean) => {
    await supabase.from('finances').update({ is_paid: !currentStatus }).eq('id', financeId);
    setFinancesList(prev => prev.map(f => f.id === financeId ? { ...f, is_paid: !currentStatus } : f));
  };

  const handleDeleteFinance = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      await supabase.from('finances').delete().eq('id', id);
      fetchFinances();
    }
  };

  // New Admin Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingAdminTaskId, setEditingAdminTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("media");
  const [selectedTaskProfs, setSelectedTaskProfs] = useState<string[]>([]);
  const [submittingTask, setSubmittingTask] = useState(false);

  // Admin Task Filters
  const [filterAdminTaskPriority, setFilterAdminTaskPriority] = useState("");
  const [filterAdminTaskAssignedTo, setFilterAdminTaskAssignedTo] = useState("");
  const [filterAdminTaskStatus, setFilterAdminTaskStatus] = useState("");

  const handleAdminCommentChange = async (assignmentId: string, comment: string) => {
    setAdminTasks(prev => prev.map(t => t.id === assignmentId ? { ...t, comment } : t));
    try {
      await supabase.from('task_assignments').update({ comment }).eq('id', assignmentId);
    } catch (err) {
      console.error(err);
    }
  };

  const occupiedAdminNewResSlots = useMemo(() => {
    if (!newResRoomId || !newResDate) return [];
    
    const selectedServiceObj = servicesList?.find(s => s.name === newResService);
    const duration = newResService ? (selectedServiceObj?.duration || 60) : 30;

    const isSlotOccupied = (slot: string, res: any) => {
       const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
       const startMinutes = parseInt(res.startTime.split(':')[0]) * 60 + parseInt(res.startTime.split(':')[1]);
       const endMinutes = parseInt(res.endTime.split(':')[0]) * 60 + parseInt(res.endTime.split(':')[1]);
       
       const slotEndMinutes = slotMinutes + duration;
       return slotMinutes < endMinutes && startMinutes < slotEndMinutes;
    };

    const activeReservations = allReservations.filter(res => 
       res.date === newResDate && (!res.status || res.status === 'agendado' || res.status === 'confirmado' || res.status === 'realizado' || res.status === 'indisponivel')
    );

    const roomReservations = activeReservations.filter(res => res.roomId === newResRoomId && res.status !== 'indisponivel');
    const professionalReservations = newResProfId ? activeReservations.filter(res => res.professionalId === newResProfId) : [];

    return TIME_SLOTS.filter(slot => {
       return roomReservations.some(res => isSlotOccupied(slot, res)) ||
              professionalReservations.some(res => isSlotOccupied(slot, res));
    });
  }, [allReservations, newResRoomId, newResDate, newResProfId, newResService, servicesList]);

  const occupiedAdminRescheduleSlots = useMemo(() => {
    if (!rescheduleRoom || !rescheduleDate) return [];
    
    const originalRes = allReservations.find(r => r.id === reschedulingId);
    const serviceName = originalRes?.service;
    const selectedServiceObj = servicesList?.find(s => s.name === serviceName);
    const duration = serviceName ? (selectedServiceObj?.duration || 60) : 30;

    const isSlotOccupied = (slot: string, res: any) => {
       const slotMinutes = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
       const startMinutes = parseInt(res.startTime.split(':')[0]) * 60 + parseInt(res.startTime.split(':')[1]);
       const endMinutes = parseInt(res.endTime.split(':')[0]) * 60 + parseInt(res.endTime.split(':')[1]);
       
       const slotEndMinutes = slotMinutes + duration;
       return slotMinutes < endMinutes && startMinutes < slotEndMinutes;
    };
    
    const activeReservations = allReservations.filter(res => 
       res.roomId === rescheduleRoom && res.date === rescheduleDate && res.id !== reschedulingId && (!res.status || res.status === 'agendado' || res.status === 'confirmado' || res.status === 'realizado')
    );
    
    return TIME_SLOTS.filter(slot => activeReservations.some(res => isSlotOccupied(slot, res)));
  }, [allReservations, rescheduleRoom, rescheduleDate, reschedulingId, servicesList]);

  const fetchAdminTasks = async () => {
    setLoadingAdminTasks(true);
    const { data: assignmentsData, error } = await supabase
      .from('task_assignments')
      .select(`*, task:tasks(*), professional:professionals(*)`);
    
    if (!error && assignmentsData) {
      setAdminTasks(assignmentsData);
    }
    setLoadingAdminTasks(false);
  };

  useEffect(() => {
    if (activeTab === "tarefas") {
      fetchAdminTasks();
    }
  }, [activeTab]);

  const filteredAdminTasks = useMemo(() => {
    return adminTasks.map(t => {
      let computedStatus = t.status;
      if (computedStatus === 'pendente' && t.task?.due_date) {
        const dueDateObj = new Date(t.task.due_date + "T00:00:00");
        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0);
        if (dueDateObj.getTime() < todayObj.getTime()) {
          computedStatus = 'atrasada';
        }
      }
      return { ...t, computedStatus };
    }).filter(t => {
      if (filterAdminTaskPriority && t.task?.priority !== filterAdminTaskPriority && !(filterAdminTaskPriority === 'media' && !t.task?.priority)) return false;
      if (filterAdminTaskAssignedTo && t.professional_id !== filterAdminTaskAssignedTo && !(filterAdminTaskAssignedTo === 'admin' && t.professional_id === null)) return false;
      if (filterAdminTaskStatus && t.computedStatus !== filterAdminTaskStatus) return false;
      return true;
    });
  }, [adminTasks, filterAdminTaskPriority, filterAdminTaskAssignedTo, filterAdminTaskStatus]);

  const filteredReservations = useMemo(() => {
    return allReservations
      .filter(res => {
        if (filterRoom && res.roomId !== filterRoom) return false;
        if (filterProf && res.professionalId !== filterProf) return false;
        if (filterStartDate && res.date < filterStartDate) return false;
        if (filterEndDate && res.date > filterEndDate) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [allReservations, filterRoom, filterProf, filterStartDate, filterEndDate]);

  const filteredReportData = useMemo(() => {
    return allReservations
      .map(res => {
        const patient = patientsList.find(p => p.name === res.patientName);
        return {
          id: res.id,
          patientName: res.patientName || "Não informado",
          healthPlan: patient?.healthPlan || "Particular",
          date: res.date,
          startTime: res.startTime,
          status: res.status || 'agendado',
          processStatus: patient?.status === 'concluido' ? "Concluído" : "Ativo",
          profId: res.professionalId,
          profName: professionalsMap[res.professionalId] || "Desconhecido"
        };
      })
      .filter(item => {
        if (reportPatient && !item.patientName.toLowerCase().includes(reportPatient.toLowerCase())) return false;
        if (reportProf && item.profId !== reportProf) return false;
        if (reportHealthPlan && item.healthPlan !== reportHealthPlan && !(reportHealthPlan === "Particular" && !patientsList.find(p => p.name === item.patientName)?.healthPlan)) return false;
        if (reportStartDate && item.date < reportStartDate) return false;
        if (reportEndDate && item.date > reportEndDate) return false;
        if (reportStatus && item.status !== reportStatus) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allReservations, patientsList, professionalsMap, reportPatient, reportProf, reportHealthPlan, reportStartDate, reportEndDate, reportStatus]);

  // --- Dashboard Data ---
  const totalProfissionais = professionalsList.length;
  const totalPacientes = patientsList.length;
  const totalAgendados = allReservations.filter(r => r.status !== 'cancelado' && r.status !== 'falta' && r.status !== 'indisponivel').length;
  const totalConcluidos = patientsList.filter(p => p.status === 'concluido').length;

  const chartData = useMemo(() => {
    const profs: Record<string, number> = {};
    professionalsList.forEach(p => profs[p.id] = 0);
    allReservations.forEach(r => {
      if (r.status !== 'cancelado' && r.status !== 'falta' && r.status !== 'indisponivel') {
        if (profs[r.professionalId] !== undefined) profs[r.professionalId]++;
        else profs[r.professionalId] = 1;
      }
    });

    return Object.entries(profs).map(([id, count]) => ({
      name: professionalsMap[id] || "Desconhecido",
      reservas: count
    })).sort((a, b) => b.reservas - a.reservas);
  }, [allReservations, professionalsList, professionalsMap]);

  useEffect(() => {
    // Check real Supabase Auth session for admin
    if (loading) return; // Wait for context to load

    if (professional?.email === 'admin@clinica.com') {
      setIsAdmin(true);
      fetchProfessionals();
      fetchPatients();
      setNewResDate(new Date().toISOString().split("T")[0]); // Set default date

      // Fetch global delayed tasks count
      const fetchDelayedCount = async () => {
        const { data } = await supabase
          .from('task_assignments')
          .select(`status, task:tasks(due_date)`)
          .eq('status', 'pendente');

        if (data) {
          let count = 0;
          const today = new Date();
          today.setHours(0,0,0,0);
          
          data.forEach((assignment: any) => {
             if (assignment.task?.due_date) {
               const dueDate = new Date(assignment.task.due_date + "T00:00:00");
               if (dueDate.getTime() < today.getTime()) {
                 count++;
               }
             }
          });
          setDelayedAdminTasksCount(count);
        }
      };
      fetchDelayedCount();
    } else {
      router.push("/");
    }
  }, [professional, loading, router]);

  const fetchProfessionals = async () => {
    const { data } = await supabase.from("professionals").select("*").order("name");
    if (data) {
      setProfessionalsList(data);
      const map: Record<string, string> = {};
      data.forEach(p => map[p.id] = p.name);
      setProfessionalsMap(map);
    }
  };

  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("*").order("name");
    if (data) {
      setPatientsList(data);
    }
  };

  if (loading || !isAdmin) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Autenticando...</p>
    </div>
  );

  const getRoomName = (id?: string | null) => rooms.find(r => r.id === id)?.name ?? "Sala Desconhecida";

  const handleCancelReservation = async (id: string) => {
    if (confirm("ATENÇÃO ADMIN: Tem certeza que deseja cancelar esta reserva? Essa ação não pode ser desfeita.")) {
      await cancelReservation(id);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !roomName) return;

    if (editingRoomId) {
      await updateRoom(editingRoomId, roomName, roomDesc);
    } else {
      // Create new
      const idStr = roomId.trim().toLowerCase().replace(/\s+/g, '-');
      await addRoom(idStr, roomName, roomDesc);
    }

    setEditingRoomId(null);
    setRoomId("");
    setRoomName("");
    setRoomDesc("");
  };

  const handleEditRoom = (room: any) => {
    setEditingRoomId(room.id);
    setRoomId(room.id);
    setRoomName(room.name);
    setRoomDesc(room.description || "");
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm("ATENÇÃO: Deletar uma sala irá cancelar TODAS as reservas associadas a ela. Continuar?")) {
      await deleteRoom(id);
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (confirm("ATENÇÃO: Deletar um profissional irá remover também TODAS as suas reservas! Deseja continuar?")) {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (!error) {
        fetchProfessionals(); // atualiza a lista
        alert("Profissional removido com sucesso.");
      } else {
        alert("Erro ao remover profissional.");
        console.error(error);
      }
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName) return;

    if (editingServiceId) {
      await updateService(editingServiceId, serviceName, serviceDesc, Number(serviceDuration));
      alert("Serviço atualizado com sucesso!");
    } else {
      await addService(serviceName, serviceDesc, Number(serviceDuration));
      alert("Serviço cadastrado com sucesso!");
    }

    setEditingServiceId(null);
    setServiceName("");
    setServiceDesc("");
    setServiceDuration("60");
  };

  const handleEditService = (service: any) => {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServiceDesc(service.description || "");
    setServiceDuration(service.duration ? String(service.duration) : "60");
  };

  const handleDeleteService = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      await deleteService(id);
    }
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patName) return;

    if (patCpf) {
      let query = supabase.from("patients").select("id").eq("cpf", patCpf);
      if (editingPatientId) {
        query = query.neq("id", editingPatientId);
      }
      const { data: existingPatient } = await query.maybeSingle();

      if (existingPatient) {
        alert("Erro: Este CPF já está cadastrado para outro paciente no sistema.");
        return;
      }
    }

    const payload = {
      name: patName,
      email: patEmail,
      phone: patPhone,
      birthDate: patBirthDate,
      address: patAddress,
      guardianName: patGuardian,
      healthPlan: patHealthPlan,
      healthPlanNumber: patHealthPlanNumber,
      gender: patGender,
      notes: patNotes,
      cpf: patCpf,
      parentsName: patParentsName,
      parentsProfession: patParentsProfession,
      schoolName: patSchoolName,
      schoolGrade: patSchoolGrade,
      schoolType: patSchoolType
    };

    if (editingPatientId) {
      const { error } = await supabase.from("patients").update(payload).eq("id", editingPatientId);
      if (!error) {
        alert("Paciente atualizado com sucesso!");
      } else {
        alert("Erro ao atualizar paciente.");
      }
    } else {
      const { error } = await supabase.from("patients").insert([payload]);
      if (!error) {
        alert("Paciente cadastrado com sucesso!");
      } else {
        alert("Erro ao cadastrar paciente.");
      }
    }

    setEditingPatientId(null);
    setPatName("");
    setPatEmail("");
    setPatPhone("");
    setPatBirthDate("");
    setPatAddress("");
    setPatGuardian("");
    setPatHealthPlan("");
    setPatHealthPlanNumber("");
    setPatGender("");
    setPatNotes("");
    setPatCpf("");
    setPatParentsName("");
    setPatParentsProfession("");
    setPatSchoolName("");
    setPatSchoolGrade("");
    setPatSchoolType("");
    setShowPatientForm(false);
    fetchPatients();
  };

  const handleEditPatient = (pat: any) => {
    setEditingPatientId(pat.id);
    setPatName(pat.name);
    setPatEmail(pat.email || "");
    setPatPhone(pat.phone || "");
    setPatBirthDate(pat.birthDate || "");
    setPatAddress(pat.address || "");
    setPatGuardian(pat.guardianName || "");
    setPatHealthPlan(pat.healthPlan || "");
    setPatHealthPlanNumber(pat.healthPlanNumber || "");
    setPatGender(pat.gender || "");
    setPatNotes(pat.notes || "");
    setPatCpf(pat.cpf || "");
    setPatParentsName(pat.parentsName || "");
    setPatParentsProfession(pat.parentsProfession || "");
    setPatSchoolName(pat.schoolName || "");
    setPatSchoolGrade(pat.schoolGrade || "");
    setPatSchoolType(pat.schoolType || "");
    setShowPatientForm(true);
    setActiveTab("patients");
  };

  const handleDeletePatient = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este paciente?")) {
      const { error } = await supabase.from("patients").delete().eq("id", id);
      if (!error) {
        fetchPatients();
        alert("Paciente removido.");
      } else {
        alert("Erro ao remover paciente.");
      }
    }
  };

  const handleAdminCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResProfId || !newResRoomId || !newResDate || newResSlots.length === 0 || !newResService) {
      alert("Por favor, preencha todos os campos obrigatórios (Profissional, Sala, Data, Horários e Serviço).");
      return;
    }

    const allNewReservations = newResSlots.map(slot => {
      const [hours, minutes] = slot.split(":").map(Number);
      
      const selectedServiceObj = servicesList?.find(s => s.name === newResService);
      const duration = selectedServiceObj?.duration || 60;
      
      const totalMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMins = totalMinutes % 60;
      const formattedEndTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;
      
      return {
        roomId: newResRoomId,
        professionalId: newResProfId,
        date: newResDate,
        startTime: slot,
        endTime: formattedEndTime,
        patientName: newResPatient || undefined,
        service: newResService || undefined
      };
    });

    const hasInternalConflicts = allNewReservations.some((res1, index1) => {
      const start1 = parseInt(res1.startTime.split(':')[0]) * 60 + parseInt(res1.startTime.split(':')[1]);
      const end1 = parseInt(res1.endTime.split(':')[0]) * 60 + parseInt(res1.endTime.split(':')[1]);
      return allNewReservations.some((res2, index2) => {
        if (index1 === index2) return false;
        const start2 = parseInt(res2.startTime.split(':')[0]) * 60 + parseInt(res2.startTime.split(':')[1]);
        const end2 = parseInt(res2.endTime.split(':')[0]) * 60 + parseInt(res2.endTime.split(':')[1]);
        return start1 < end2 && start2 < end1;
      });
    });

    const hasExternalConflicts = allNewReservations.some(res => {
      const start1 = parseInt(res.startTime.split(':')[0]) * 60 + parseInt(res.startTime.split(':')[1]);
      const end1 = parseInt(res.endTime.split(':')[0]) * 60 + parseInt(res.endTime.split(':')[1]);
      
      return allReservations.some(existing => {
        if (existing.date !== res.date) return false;
        if (existing.status && existing.status !== 'agendado' && existing.status !== 'confirmado' && existing.status !== 'realizado' && existing.status !== 'indisponivel') return false;
        if (existing.roomId !== res.roomId && existing.professionalId !== res.professionalId) return false;
        
        const start2 = parseInt(existing.startTime.split(':')[0]) * 60 + parseInt(existing.startTime.split(':')[1]);
        const end2 = parseInt(existing.endTime.split(':')[0]) * 60 + parseInt(existing.endTime.split(':')[1]);
        
        return start1 < end2 && start2 < end1;
      });
    });

    if (hasInternalConflicts || hasExternalConflicts) {
      alert("Erro: O horário selecionado (junto com a duração do serviço) conflita com outra reserva já existente nesta sala ou para este profissional.");
      return;
    }

    try {
      await addReservations(allNewReservations);
      alert("Reserva(s) criada(s) com sucesso pelo Administrador!");
      setNewResPatient("");
      setNewResService("");
      setNewResSlots([]);
      setActiveTab("reservations");
    } catch (err) {
      console.error(err);
      alert("Erro ao criar reserva.");
    }
  };

  const handleRescheduleClick = (res: any) => {
    setReschedulingId(res.id);
    setRescheduleDate(res.date);
    setRescheduleStart(res.startTime);
    setRescheduleRoom(res.roomId);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingId || !rescheduleDate || !rescheduleStart || !rescheduleRoom) return;

    const originalRes = allReservations.find(r => r.id === reschedulingId);
    const serviceName = originalRes?.service;
    const selectedServiceObj = servicesList?.find(s => s.name === serviceName);
    const duration = selectedServiceObj?.duration || 60;

    const [hours, minutes] = rescheduleStart.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    const calculatedEnd = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`;

    const hasExternalConflict = allReservations.some(existing => {
        if (existing.id === reschedulingId) return false;
        if (existing.date !== rescheduleDate) return false;
        if (existing.status && existing.status !== 'agendado' && existing.status !== 'confirmado' && existing.status !== 'realizado' && existing.status !== 'indisponivel') return false;
        
        if (existing.roomId !== rescheduleRoom && existing.professionalId !== originalRes?.professionalId) return false;
        
        const start1 = hours * 60 + minutes;
        const end1 = start1 + duration;

        const start2 = parseInt(existing.startTime.split(':')[0]) * 60 + parseInt(existing.startTime.split(':')[1]);
        const end2 = parseInt(existing.endTime.split(':')[0]) * 60 + parseInt(existing.endTime.split(':')[1]);
        
        return start1 < end2 && start2 < end1;
    });

    if (hasExternalConflict) {
        alert("Erro: O novo horário conflita com uma reserva existente.");
        return;
    }

    try {
      const { error } = await supabase.from('reservations').update({
        date: rescheduleDate,
        start_time: `${rescheduleStart}:00`,
        end_time: `${calculatedEnd}:00`,
        room_id: rescheduleRoom,
        status: 'reagendado'
      }).eq('id', reschedulingId);

      if (error) throw error;
      
      alert("Reserva reagendada com sucesso!");
      setReschedulingId(null);
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao tentar reagendar.");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("@Clinica:adminPin");
    router.push("/");
  };

  const toggleAdminTaskStatus = async (assignment: any) => {
    const newStatus = (assignment.status === 'pendente' || assignment.computedStatus === 'atrasada') ? 'concluida' : 'pendente';
    
    // Optimistic update
    setAdminTasks(prev => prev.map(t => t.id === assignment.id ? { ...t, status: newStatus } : t));

    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'concluida' ? new Date().toISOString() : null
        })
        .eq('id', assignment.id);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      // Revert in case of error
      setAdminTasks(prev => prev.map(t => t.id === assignment.id ? { ...t, status: assignment.status } : t));
      alert("Erro ao atualizar o status da tarefa.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("ATENÇÃO ADMIN: Tem certeza que deseja excluir esta tarefa de TODOS os profissionais?")) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (!error) {
        alert("Tarefa excluída com sucesso!");
        fetchAdminTasks();
      } else {
        alert("Erro ao excluir tarefa.");
      }
    }
  };

  const openEditAdminTask = (assignment: any) => {
    setNewTaskTitle(assignment.task?.title || "");
    setNewTaskDesc(assignment.task?.description || "");
    setNewTaskDueDate(assignment.task?.due_date || "");
    setNewTaskPriority(assignment.task?.priority || "media");
    setEditingAdminTaskId(assignment.task?.id);
    setSelectedTaskProfs([]); // Admin must select again, or we disable it. Better to keep it simple and just don't re-assign on edit, only edit task metadata.
    setShowTaskModal(true);
  };

  const handleSaveAdminTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || selectedTaskProfs.length === 0) {
      alert("Preencha o título e selecione pelo menos um destinatário.");
      return;
    }

    setSubmittingTask(true);
    try {
      if (editingAdminTaskId) {
        const { error: updateErr } = await supabase
          .from('tasks')
          .update({
            title: newTaskTitle,
            description: newTaskDesc,
            due_date: newTaskDueDate || null,
            priority: newTaskPriority
          })
          .eq('id', editingAdminTaskId);
        if (updateErr) throw updateErr;
      } else {
        // 1. Inserir Tarefa
        const { data: taskData, error: taskErr } = await supabase
          .from('tasks')
          .insert({
            title: newTaskTitle,
            description: newTaskDesc,
            due_date: newTaskDueDate || null,
            priority: newTaskPriority,
            created_by: null // admin
          })
          .select()
          .single();

        if (taskErr || !taskData) throw taskErr;

        // 2. Inserir Assignments
        const assignments = selectedTaskProfs.map(profId => ({
          task_id: taskData.id,
          professional_id: profId === 'admin' ? null : profId,
          status: 'pendente',
          viewed: profId === 'admin'
        }));

        const { error: assignErr } = await supabase.from('task_assignments').insert(assignments);
        if (assignErr) throw assignErr;

        // Disparar notificação por e-mail para os profissionais (exceto admin)
        const emailsToNotify = selectedTaskProfs
          .filter(id => id !== 'admin')
          .map(id => professionalsList.find(p => p.id === id)?.email)
          .filter(Boolean);

        if (emailsToNotify.length > 0) {
          Promise.all(emailsToNotify.map(email => 
            fetch('/api/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email,
                subject: `Nova Tarefa Atribuída: ${newTaskTitle}`,
                taskTitle: newTaskTitle,
                taskDescription: newTaskDesc,
                assignedBy: "Administração",
                taskLink: `${window.location.origin}/tarefas`
              })
            })
          )).catch(err => console.error("Erro ao enviar notificação por e-mail:", err));
        }
      }

      // Sucesso
      setShowTaskModal(false);
      setEditingAdminTaskId(null);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskDueDate("");
      setNewTaskPriority("media");
      setSelectedTaskProfs([]);
      fetchAdminTasks();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar tarefa.");
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleExportBackup = () => {
    let htmlContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>table { border-collapse: collapse; margin-bottom: 20px; } th, td { border: 1px solid #000; padding: 5px; text-align: left; }</style>
      </head>
      <body>`;

    // 1. Pacientes
    htmlContent += `<h2>Pacientes</h2><table><thead><tr><th style="background-color: #f2f2f2;">Nome</th><th style="background-color: #f2f2f2;">Email</th><th style="background-color: #f2f2f2;">Telefone</th><th style="background-color: #f2f2f2;">Nascimento</th><th style="background-color: #f2f2f2;">Convênio</th><th style="background-color: #f2f2f2;">Status</th><th style="background-color: #f2f2f2;">Anotações</th></tr></thead><tbody>`;
    patientsList.forEach(p => {
      htmlContent += `<tr><td>${p.name}</td><td>${p.email || ''}</td><td>${p.phone || ''}</td><td>${p.birthDate ? new Date(p.birthDate + "T00:00:00").toLocaleDateString("pt-BR") : ''}</td><td>${p.healthPlan || ''} ${p.healthPlanNumber || ''}</td><td>${p.status || 'Ativo'}</td><td>${p.notes || ''}</td></tr>`;
    });
    htmlContent += `</tbody></table><br/>`;

    // 2. Agendamentos
    htmlContent += `<h2>Agendamentos (Histórico)</h2><table><thead><tr><th style="background-color: #f2f2f2;">Data</th><th style="background-color: #f2f2f2;">Início</th><th style="background-color: #f2f2f2;">Fim</th><th style="background-color: #f2f2f2;">Paciente</th><th style="background-color: #f2f2f2;">Profissional</th><th style="background-color: #f2f2f2;">Serviço</th><th style="background-color: #f2f2f2;">Sala</th><th style="background-color: #f2f2f2;">Status</th></tr></thead><tbody>`;
    allReservations.forEach(r => {
      const profName = professionalsMap[r.professionalId] || 'Desconhecido';
      const roomName = rooms.find(rm => rm.id === r.roomId)?.name || 'Desconhecida';
      const dataFormatada = new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR");
      htmlContent += `<tr><td>${dataFormatada}</td><td>${r.startTime}</td><td>${r.endTime}</td><td>${r.patientName || ''}</td><td>${profName}</td><td>${r.service || ''}</td><td>${roomName}</td><td style="text-transform: capitalize;">${r.status || 'Agendado'}</td></tr>`;
    });
    htmlContent += `</tbody></table><br/>`;

    // 3. Profissionais
    htmlContent += `<h2>Profissionais</h2><table><thead><tr><th style="background-color: #f2f2f2;">Nome</th><th style="background-color: #f2f2f2;">Especialidade</th><th style="background-color: #f2f2f2;">Email</th></tr></thead><tbody>`;
    professionalsList.forEach(p => {
      htmlContent += `<tr><td>${p.name}</td><td>${p.specialty || ''}</td><td>${p.email || ''}</td></tr>`;
    });
    htmlContent += `</tbody></table><br/>`;

    // 4. Tarefas
    htmlContent += `<h2>Tarefas</h2><table><thead><tr><th style="background-color: #f2f2f2;">Título</th><th style="background-color: #f2f2f2;">Descrição</th><th style="background-color: #f2f2f2;">Atribuído Para</th><th style="background-color: #f2f2f2;">Prazo</th><th style="background-color: #f2f2f2;">Prioridade</th><th style="background-color: #f2f2f2;">Status</th><th style="background-color: #f2f2f2;">Comentário</th></tr></thead><tbody>`;
    adminTasks.forEach(assignment => {
      const task = assignment.task || {};
      const profName = assignment.professional_id === null ? "Administração" : (assignment.professional?.name || "Desconhecido");
      const dueDate = task.due_date ? new Date(task.due_date + "T00:00:00").toLocaleDateString("pt-BR") : "";
      htmlContent += `<tr><td>${task.title || ""}</td><td>${task.description || ""}</td><td>${profName}</td><td>${dueDate}</td><td style="text-transform: capitalize;">${task.priority || "media"}</td><td style="text-transform: capitalize;">${assignment.status || "pendente"}</td><td>${assignment.comment || ""}</td></tr>`;
    });
    htmlContent += `</tbody></table><br/>`;

    htmlContent += `</body></html>`;

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_clinica_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container animate-fade" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--danger)" }}>
            Painel Administrativo
          </h1>
        </div>
        <button 
          onClick={handleAdminLogout}
          className="btn btn-outline"
          style={{ padding: "0.5rem 1rem", borderColor: "var(--danger)", color: "var(--danger)", fontWeight: 600 }}
        >
          Sair do Admin
        </button>
      </header>

      <style>{`
        .admin-nav::-webkit-scrollbar { display: none; }
        .admin-nav { -ms-overflow-style: none; scrollbar-width: none; }
        .admin-nav-group-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 0.4rem;
        }
        .admin-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 0.6rem;
          padding: 0.5rem 1rem;
          font-size: 0.83rem;
          font-weight: 600;
          white-space: nowrap;
          border: 1.5px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .admin-nav-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-light);
        }
        .admin-nav-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .admin-nav-btn.action-primary {
          background: var(--success);
          border-color: var(--success);
          color: #fff;
        }
        .admin-nav-btn.action-primary:hover {
          opacity: 0.88;
          color: #fff;
        }
        .admin-nav-btn.action-secondary {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--primary-light);
        }
        .admin-nav-btn.action-secondary:hover {
          background: var(--primary);
          color: #fff;
        }
        .admin-nav-divider {
          width: 1px;
          background: var(--border-color);
          align-self: stretch;
          margin: 0 0.5rem;
        }
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
          .print-hidden { display: none !important; }
        }
        @media (max-width: 768px) {
          .admin-nav-divider { display: none; }
          .admin-nav-row { flex-wrap: wrap !important; }
        }
      `}</style>

      {/* Navegação do Admin — organizada em grupos */}
      <nav className="admin-nav card" style={{
        marginBottom: "2rem",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
            {/* Grupo: Análise */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="admin-nav-group-label">📊 Análise</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => setActiveTab("dashboard")} className={`admin-nav-btn${activeTab === "dashboard" ? " active" : ""}`}>
                  Visão Geral
                </button>
                <button onClick={() => setActiveTab("relatorios")} className={`admin-nav-btn${activeTab === "relatorios" ? " active" : ""}`}>
                  Relatórios
                </button>
                <button onClick={() => setActiveTab("disponibilidade")} className={`admin-nav-btn${activeTab === "disponibilidade" ? " active" : ""}`}>
                  Grade
                </button>
              </div>
            </div>

            {/* Grupo: Gestão */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="admin-nav-group-label">🗂️ Gestão</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => setActiveTab("reservations")} className={`admin-nav-btn${activeTab === "reservations" ? " active" : ""}`}>
                  📋 Reservas
                </button>
                <button onClick={() => setActiveTab("patients")} className={`admin-nav-btn${activeTab === "patients" ? " active" : ""}`}>
                  👥 Pacientes
                </button>
                <button onClick={() => setActiveTab("professionals")} className={`admin-nav-btn${activeTab === "professionals" ? " active" : ""}`}>
                  🩺 Equipe
                </button>
                <button onClick={() => setActiveTab("services")} className={`admin-nav-btn${activeTab === "services" ? " active" : ""}`}>
                  🏷️ Serviços
                </button>
                <button onClick={() => setActiveTab("rooms")} className={`admin-nav-btn${activeTab === "rooms" ? " active" : ""}`}>
                  🚪 Salas
                </button>
                <button onClick={() => setActiveTab("tarefas")} className={`admin-nav-btn${activeTab === "tarefas" ? " active" : ""}`}>
                  ✅ Tarefas
                  {delayedAdminTasksCount > 0 && (
                    <span style={{ marginLeft: "4px", backgroundColor: "var(--danger)", color: "white", padding: "0.1rem 0.4rem", borderRadius: "10px", fontSize: "0.65rem", fontWeight: 700 }}>
                      {delayedAdminTasksCount}
                    </span>
                  )}
                </button>
                <button onClick={() => setActiveTab("finances")} className={`admin-nav-btn${activeTab === "finances" ? " active" : ""}`}>
                  💰 Finanças
                </button>
              </div>
            </div>
          </div>

          {/* Grupo: Ações Rápidas */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="admin-nav-group-label">⚡ Ações Rápidas</span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setActiveTab("new_reservation")}
                className={`admin-nav-btn action-primary${activeTab === "new_reservation" ? " active" : ""}`}
              >
                + Nova Reserva
              </button>
              <button onClick={handleExportBackup} className="admin-nav-btn action-secondary">
                💾 Backup XLS
              </button>
            </div>
          </div>

        </div>
      </nav>

      {activeTab === "dashboard" && (
        <div className="animate-fade">
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Profissionais</h3>
              <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", marginTop: "0.5rem" }}>{totalProfissionais}</p>
            </div>
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Pacientes</h3>
              <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", marginTop: "0.5rem" }}>{totalPacientes}</p>
            </div>
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Agendamentos Ativos</h3>
              <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", marginTop: "0.5rem" }}>{totalAgendados}</p>
            </div>
            <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Processos Concluídos</h3>
              <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--success)", marginTop: "0.5rem" }}>{totalConcluidos}</p>
            </div>
          </div>

          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-main)" }}>Reservas por Profissional</h2>
            <div style={{ width: "100%", height: "400px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                  <Tooltip cursor={{ fill: "var(--bg-color)" }} contentStyle={{ borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "var(--card-bg)" }} />
                  <Bar dataKey="reservas" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Qtd de Reservas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "reservations" && (
        <div className="card animate-slide">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Todas as Reservas Ativas ({filteredReservations.length})</h2>
            
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label className="label" style={{ marginBottom: 0, fontSize: "0.85rem" }}>De:</label>
                <input 
                  type="date"
                  className="input" 
                  style={{ padding: "0.5rem", width: "auto" }}
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label className="label" style={{ marginBottom: 0, fontSize: "0.85rem" }}>Até:</label>
                <input 
                  type="date"
                  className="input" 
                  style={{ padding: "0.5rem", width: "auto" }}
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                />
              </div>

              <select 
                className="input" 
                style={{ padding: "0.5rem", width: "auto" }}
                value={filterProf}
                onChange={e => setFilterProf(e.target.value)}
              >
                <option value="">Todos os Profissionais</option>
                {Object.entries(professionalsMap).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              <select 
                className="input" 
                style={{ padding: "0.5rem", width: "auto" }}
                value={filterRoom}
                onChange={e => setFilterRoom(e.target.value)}
              >
                <option value="">Todas as Salas</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredReservations.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Nenhuma reserva encontrada com os filtros selecionados.</p>
          ) : (
            <div className="table-scroll">
              <table className="responsive-table" style={{ minWidth: "560px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Data</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Horário</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Profissional</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Sala / Paciente</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map(res => (
                    <tr key={res.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem", fontWeight: 600 }}>{res.date.split('-').reverse().join('/')}</td>
                      <td style={{ padding: "1rem" }}>{res.startTime} - {res.endTime}</td>
                      <td style={{ padding: "1rem", fontWeight: 500, color: "var(--primary)" }}>
                        {professionalsMap[res.professionalId] || "Desconhecido"}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {res.status === 'indisponivel' ? (
                          <div style={{ fontWeight: 600, color: "var(--danger)" }}>Sem Sala (Bloqueio)</div>
                        ) : (
                          <div style={{ fontWeight: 600 }}>{getRoomName(res.roomId)}</div>
                        )}
                        {(res.patientName || res.service) && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {res.patientName && <span>{res.patientName}</span>}
                            {res.patientName && res.service && <span> • </span>}
                            {res.service && <span>{res.service}</span>}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                          {res.status === 'indisponivel' ? (
                            <button 
                              onClick={() => handleCancelReservation(res.id)}
                              style={{ color: "var(--danger)", backgroundColor: "var(--danger-light)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, border: "1px solid var(--danger)", cursor: "pointer" }}
                              title="Remover este bloqueio"
                            >
                              Desbloquear
                            </button>
                          ) : res.status === 'realizado' ? (
                            <span style={{ color: "var(--success)", fontWeight: 700, fontSize: "0.85rem" }}>✅ Realizado</span>
                          ) : res.status === 'falta' ? (
                            <span style={{ color: "var(--danger)", fontWeight: 700, fontSize: "0.85rem" }}>❌ Falta</span>
                          ) : res.status === 'cancelado' ? (
                            <span style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "0.85rem" }}>🚫 Cancelado</span>
                          ) : (
                            <>
                              {res.status === 'confirmado' ? (
                                <span style={{ color: "var(--success)", fontWeight: 700, fontSize: "0.85rem" }}>✓ Confirmado</span>
                              ) : (
                                <button 
                                  onClick={() => updateReservationStatus(res.id, 'confirmado')}
                                  style={{ color: "white", backgroundColor: "var(--success)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer" }}
                                >
                                  Confirmar
                                </button>
                              )}
                              <button 
                                onClick={() => handleRescheduleClick(res)}
                                style={{ color: "white", backgroundColor: "#f59e0b", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer" }}
                              >
                                Reagendar
                              </button>
                              <button 
                                onClick={() => handleCancelReservation(res.id)}
                                style={{ color: "white", backgroundColor: "var(--danger)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer" }}
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "relatorios" && (
        <div className="card animate-slide print-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Relatório de Atendimentos ({filteredReportData.length})</h2>
            <button 
              onClick={() => window.print()}
              className="btn btn-outline print-hidden"
              style={{ padding: "0.5rem 1rem", borderRadius: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
              Imprimir
            </button>
          </div>

          {/* Filtros do Relatório */}
          <div className="grid print-hidden" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem", backgroundColor: "var(--bg-color)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div>
              <label className="label" style={{ fontSize: "0.85rem" }}>Paciente</label>
              <select className="input" value={reportPatient} onChange={e => setReportPatient(e.target.value)}>
                <option value="">Todos</option>
                {patientsList.map(pat => (
                  <option key={pat.id} value={pat.name}>{pat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" style={{ fontSize: "0.85rem" }}>Profissional</label>
              <select className="input" value={reportProf} onChange={e => setReportProf(e.target.value)}>
                <option value="">Todos</option>
                {professionalsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" style={{ fontSize: "0.85rem" }}>Convênio</label>
              <select className="input" value={reportHealthPlan} onChange={e => setReportHealthPlan(e.target.value)}>
                <option value="">Todos</option>
                <option value="Particular">Particular</option>
                {Array.from(new Set(patientsList.map(p => p.healthPlan).filter(Boolean))).map(hp => (
                  <option key={hp as string} value={hp as string}>{hp as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" style={{ fontSize: "0.85rem" }}>De</label>
              <input type="date" className="input" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label" style={{ fontSize: "0.85rem" }}>Até</label>
              <input type="date" className="input" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} />
            </div>
            <div>
              <label className="label" style={{ fontSize: "0.85rem" }}>Status</label>
              <select className="input" value={reportStatus} onChange={e => setReportStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="falta">Falta</option>
                <option value="reagendado">Reagendado</option>
              </select>
            </div>
          </div>

          <div className="table-scroll">
            <table className="responsive-table" style={{ minWidth: "700px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left", backgroundColor: "var(--bg-color)" }}>
                  <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Data</th>
                  <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Paciente</th>
                  <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Convênio</th>
                  <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Profissional</th>
                  <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Status Consulta</th>
                  <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Processo Paciente</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportData.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "1rem", fontWeight: 600 }}>
                      {item.date.split('-').reverse().join('/')} 
                      <span style={{fontSize:"0.8rem", color:"var(--text-muted)", marginLeft: "0.4rem"}}>{item.startTime}</span>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{item.patientName}</td>
                    <td style={{ padding: "1rem" }}>
                      <span className={item.healthPlan === "Particular" ? "badge" : "badge badge-primary"}>{item.healthPlan}</span>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 500 }}>{item.profName}</td>
                    <td style={{ padding: "1rem" }}>
                      {item.status === 'confirmado' && <span style={{ color: "var(--success)", fontWeight: 700, fontSize: "0.9rem" }}>✓ Confirmado</span>}
                      {item.status === 'falta' && <span style={{ color: "var(--danger)", fontWeight: 700, fontSize: "0.9rem" }}>✗ Falta</span>}
                      {item.status === 'reagendado' && <span style={{ color: "#b45309", fontWeight: 700, fontSize: "0.9rem" }}>↻ Reagendado</span>}
                      {(!item.status || item.status === 'agendado') && <span style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "0.9rem" }}>⏳ Agendado</span>}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {item.processStatus === 'Concluído' ? (
                        <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: "0.75rem" }}>Alta (Concluído)</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-muted)", border: "1px solid var(--border-color)", fontSize: "0.75rem" }}>Ativo</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredReportData.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                      Nenhum atendimento corresponde aos filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "services" && (
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {/* Lista de Serviços */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Serviços Cadastrados ({servicesList.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {servicesList.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Nenhum serviço cadastrado.</p>}
              {servicesList.map(service => (
                <div key={service.id} style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <h3 style={{ fontWeight: 700, color: "var(--primary)" }}>{service.name}</h3>
                      {service.duration && (
                        <span className="badge" style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.2rem 0.5rem" }}>
                          ⏱ {service.duration} min
                        </span>
                      )}
                    </div>
                    {service.description && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{service.description}</p>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleEditService(service)} style={{ padding: "0.4rem 0.8rem", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                      Editar
                    </button>
                    <button onClick={() => handleDeleteService(service.id)} style={{ padding: "0.4rem 0.8rem", backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form de Novo Serviço */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              {editingServiceId ? "Editar Serviço" : "Adicionar Novo Serviço"}
            </h2>
            <form onSubmit={handleSaveService} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Nome do Serviço / Procedimento</label>
                <input className="input" value={serviceName} onChange={e => setServiceName(e.target.value)} required placeholder="Ex: Terapia de Casal" />
              </div>
              <div>
                <label className="label">Descrição (Opcional)</label>
                <input className="input" value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} placeholder="Ex: Sessão focada em conflitos do casal..." />
              </div>
              <div>
                <label className="label">Duração da Sessão (minutos)</label>
                <input type="number" min="10" max="480" className="input" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} required />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  {editingServiceId ? "Salvar Alterações" : "Criar Serviço"}
                </button>
                {editingServiceId && (
                  <button type="button" onClick={() => { setEditingServiceId(null); setServiceName(""); setServiceDesc(""); setServiceDuration("60"); }} className="btn btn-outline">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "rooms" && (
        <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {/* Lista de Salas */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Salas Cadastradas ({rooms.length})</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {rooms.map(room => (
                <div key={room.id} style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontWeight: 700, color: "var(--primary)" }}>{room.name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>ID: {room.id}</p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleEditRoom(room)} style={{ padding: "0.4rem 0.8rem", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
                      Editar
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id)} style={{ padding: "0.4rem 0.8rem", backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form de Nova/Edição Sala */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              {editingRoomId ? "Editar Sala" : "Adicionar Nova Sala"}
            </h2>
            <form onSubmit={handleSaveRoom} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {!editingRoomId && (
                <div>
                  <label className="label">ID da Sala (ex: r6, cons-5)</label>
                  <input className="input" value={roomId} onChange={e => setRoomId(e.target.value)} required placeholder="Identificador único" />
                </div>
              )}
              <div>
                <label className="label">Nome da Sala</label>
                <input className="input" value={roomName} onChange={e => setRoomName(e.target.value)} required placeholder="Ex: Consultório 5" />
              </div>
              <div>
                <label className="label">Descrição (Opcional)</label>
                <input className="input" value={roomDesc} onChange={e => setRoomDesc(e.target.value)} placeholder="Ex: Equipado com maca..." />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  {editingRoomId ? "Salvar Alterações" : "Criar Sala"}
                </button>
                {editingRoomId && (
                  <button type="button" onClick={() => { setEditingRoomId(null); setRoomId(""); setRoomName(""); setRoomDesc(""); }} className="btn btn-outline">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "professionals" && (
        <div className="animate-slide" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Cabeçalho informativo */}
          <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", background: "var(--primary-light)", border: "1px solid var(--primary-mid)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{professionalsList.length}</span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Profissionais<br/>cadastrados</span>
              </div>
              <div style={{ width: "1px", height: "32px", background: "var(--primary-mid)" }} />
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: "320px", lineHeight: 1.5 }}>
                Para <strong>adicionar</strong> um profissional, envie o link de convite. Para <strong>remover</strong>, use o botão no card.
              </p>
            </div>
          </div>

          {/* Lista de cards */}
          {professionalsList.length === 0 ? (
            <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🩺</div>
              <p>Nenhum profissional cadastrado ainda.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1rem" }}>
              {professionalsList.map(prof => (
                <div key={prof.id} style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  boxShadow: "var(--clay-card)"
                }}>
                  {/* Topo do card: avatar + info */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "50%", flexShrink: 0,
                      background: "var(--primary-light)", color: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "1.2rem",
                      border: "2px solid var(--primary-mid)"
                    }}>
                      {prof.avatar_url ? (
                        <img src={prof.avatar_url} alt={prof.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        prof.name.split(" ").slice(0,2).map((n: string) => n[0]).join("").toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "1rem", marginBottom: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {prof.name}
                      </h3>
                      <p style={{ fontSize: "0.82rem", color: "var(--primary)", fontWeight: 600 }}>{prof.specialty || "Clínico"}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {prof.email}
                      </p>
                    </div>
                  </div>

                  {/* Badge de status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      fontSize: "0.72rem", fontWeight: 700,
                      padding: "0.2rem 0.6rem", borderRadius: "999px",
                      backgroundColor: "#dcfce7", color: "#166534"
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                      Ativo
                    </span>

                    <button
                      onClick={() => handleDeleteProfessional(prof.id)}
                      title="Remover profissional permanentemente"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.3rem",
                        padding: "0.35rem 0.75rem",
                        backgroundColor: "transparent",
                        color: "var(--danger)",
                        border: "1.5px solid var(--danger)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--danger)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)"; }}
                    >
                      🗑 Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "patients" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {!showPatientForm && !editingPatientId && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowPatientForm(true)} 
                className="btn"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                Cadastrar Novo Paciente
              </button>
            </div>
          )}

          {/* Form de Nova/Edição Paciente */}
          {(showPatientForm || editingPatientId) && (
          <div className="card animate-slide">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>
                {editingPatientId ? "Editar Paciente" : "Novo Paciente"}
              </h2>
              {!editingPatientId && (
                <button 
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/cadastro-paciente`;
                    navigator.clipboard.writeText(link);
                    alert("Link de auto-cadastro copiado para a área de transferência!\n\nEnvie este link para o paciente preencher seus próprios dados: \n" + link);
                  }}
                  className="btn btn-outline"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", borderColor: "var(--primary)", color: "var(--primary)", fontWeight: 700 }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path></svg>
                  Copiar Link de Auto-cadastro
                </button>
              )}
            </div>
            <form onSubmit={handleSavePatient} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label className="label">Nome do Paciente</label>
                  <input className="input" value={patName} onChange={e => setPatName(e.target.value)} required placeholder="Ex: Maria Souza" />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">CPF</label>
                  <input className="input" value={patCpf} onChange={e => setPatCpf(e.target.value)} placeholder="000.000.000-00" />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Data de Nascimento</span>
                    {patBirthDate && <span style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700 }}>{calculateAge(patBirthDate)}</span>}
                  </label>
                  <input type="date" className="input" value={patBirthDate} onChange={e => setPatBirthDate(e.target.value)} />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Sexo</label>
                  <select className="input" value={patGender} onChange={e => setPatGender(e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefere não informar">Prefere não informar</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Convênio</label>
                  <select className="input" value={patHealthPlan} onChange={e => setPatHealthPlan(e.target.value)}>
                    <option value="">Particular (Sem Convênio)</option>
                    <option value="Unimed">Unimed</option>
                    <option value="Prefeitura">Prefeitura</option>
                    <option value="Lumiar">Lumiar</option>
                    <option value="Bradesco">Bradesco</option>
                    <option value="Pró Saúde">Pró Saúde</option>
                    <option value="São Luiz Saúde">São Luiz Saúde</option>
                    <option value="KR Saúde">KR Saúde</option>
                  </select>
                </div>
                {patHealthPlan && (
                  <div style={{ flex: "1 1 150px" }}>
                    <label className="label">Nº da Carteirinha</label>
                    <input className="input" value={patHealthPlanNumber} onChange={e => setPatHealthPlanNumber(e.target.value)} placeholder="Apenas se tiver convênio" />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Nome do Responsável (se menor)</label>
                  <input className="input" value={patGuardian} onChange={e => setPatGuardian(e.target.value)} placeholder="Ex: João Souza" />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Nome dos Pais</label>
                  <input className="input" value={patParentsName} onChange={e => setPatParentsName(e.target.value)} placeholder="Ex: João e Ana" />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Profissão dos Pais</label>
                  <input className="input" value={patParentsProfession} onChange={e => setPatParentsProfession(e.target.value)} placeholder="Ex: Professor e Advogada" />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Escola (Instituição de Ensino)</label>
                  <input className="input" value={patSchoolName} onChange={e => setPatSchoolName(e.target.value)} placeholder="Nome da escola" />
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <label className="label">Série/Ano Escolar</label>
                  <input className="input" value={patSchoolGrade} onChange={e => setPatSchoolGrade(e.target.value)} placeholder="Ex: 5º Ano" />
                </div>
                <div style={{ flex: "1 1 150px" }}>
                  <label className="label">Tipo de Escola</label>
                  <select className="input" value={patSchoolType} onChange={e => setPatSchoolType(e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Pública">Pública</option>
                    <option value="Particular">Particular</option>
                  </select>
                </div>
              </div>


              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label className="label">Telefone (WhatsApp)</label>
                  <input className="input" value={patPhone} onChange={e => setPatPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label className="label">E-mail</label>
                  <input type="email" className="input" value={patEmail} onChange={e => setPatEmail(e.target.value)} placeholder="maria@email.com" />
                </div>
              </div>

              <div>
                <label className="label">Endereço Completo</label>
                <input className="input" value={patAddress} onChange={e => setPatAddress(e.target.value)} placeholder="Rua, Número, Bairro, Cidade" />
              </div>

              <div>
                <label className="label">Anotações / Observações</label>
                <textarea className="input" value={patNotes} onChange={e => setPatNotes(e.target.value)} placeholder="Alergias, histórico clínico, etc." rows={3} style={{ resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  {editingPatientId ? "Salvar Alterações" : "Cadastrar Paciente"}
                </button>
                <button type="button" onClick={() => { 
                  setEditingPatientId(null); setPatName(""); setPatEmail(""); setPatPhone(""); setPatBirthDate(""); setPatAddress(""); setPatGuardian(""); setPatHealthPlan(""); setPatHealthPlanNumber(""); setPatGender(""); setPatNotes(""); setPatCpf(""); setPatParentsName(""); setPatParentsProfession(""); setPatSchoolName(""); setPatSchoolGrade(""); setPatSchoolType("");
                  setShowPatientForm(false);
                }} className="btn btn-outline">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
          )}

          {/* Lista de Pacientes */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Pacientes ({patientsList.length})</h2>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Pesquisar</label>
                <input 
                  type="text" 
                  className="input" 
                  style={{ padding: "0.4rem" }}
                  placeholder="Nome do paciente..." 
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Convênio</label>
                <select className="input" style={{ padding: "0.4rem" }} value={patientFilterHealthPlan} onChange={(e) => setPatientFilterHealthPlan(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="Particular">Particular</option>
                  <option value="Unimed">Unimed</option>
                  <option value="Prefeitura">Prefeitura</option>
                  <option value="Lumiar">Lumiar</option>
                  <option value="Bradesco">Bradesco</option>
                  <option value="Pró Saúde">Pró Saúde</option>
                  <option value="São Luiz Saúde">São Luiz Saúde</option>
                  <option value="KR Saúde">KR Saúde</option>
                </select>
              </div>
              <div style={{ flex: "1 1 150px" }}>
                <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Faixa Etária</label>
                <select className="input" style={{ padding: "0.4rem" }} value={patientFilterAgeGroup} onChange={(e) => setPatientFilterAgeGroup(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="crianca">Criança (0 a 11 anos)</option>
                  <option value="adolescente">Adolescente (12 a 17 anos)</option>
                  <option value="adulto">Adulto (18 a 59 anos)</option>
                  <option value="idoso">Idoso (60+ anos)</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "600px", overflowY: "auto" }}>
              {(() => {
                const filteredPatients = patientsList.filter(pat => {
                  if (patientSearch && !pat.name.toLowerCase().includes(patientSearch.toLowerCase())) return false;
                  
                  if (patientFilterHealthPlan) {
                    if (patientFilterHealthPlan === "Particular" && pat.healthPlan && pat.healthPlan !== "Particular") return false;
                    if (patientFilterHealthPlan !== "Particular" && pat.healthPlan !== patientFilterHealthPlan) return false;
                  }

                  if (patientFilterAgeGroup && pat.birthDate) {
                    const birth = new Date(pat.birthDate + "T00:00:00");
                    const today = new Date();
                    let age = today.getFullYear() - birth.getFullYear();
                    const m = today.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

                    if (patientFilterAgeGroup === "crianca" && age > 11) return false;
                    if (patientFilterAgeGroup === "adolescente" && (age < 12 || age > 17)) return false;
                    if (patientFilterAgeGroup === "adulto" && (age < 18 || age > 59)) return false;
                    if (patientFilterAgeGroup === "idoso" && age < 60) return false;
                  } else if (patientFilterAgeGroup && !pat.birthDate) {
                    return false; // se filtrou por idade mas não tem data, não exibe
                  }

                  return true;
                });
                if (filteredPatients.length === 0) {
                  return <p style={{ color: "var(--text-muted)" }}>Nenhum paciente encontrado.</p>;
                }
                return filteredPatients.map(pat => (
                  <div key={pat.id} style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button 
                            onClick={() => setViewingPatient(pat)}
                            title="Clique para ver o cadastro completo"
                            style={{ fontWeight: 700, color: "var(--primary)", background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "1.1rem", textDecoration: "underline", textAlign: "left" }}
                          >
                            {pat.name}
                          </button>
                          {pat.gender && <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>({pat.gender})</span>}
                          {pat.healthPlan && (
                            <span className="badge badge-primary" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                              {pat.healthPlan} {pat.healthPlanNumber ? `- Nº: ${pat.healthPlanNumber}` : ''}
                            </span>
                          )}
                        </div>
                        {(pat.phone || pat.email) && (
                          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {pat.phone} {pat.phone && pat.email && " • "} {pat.email}
                          </p>
                        )}
                        {pat.guardianName && (
                          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>Resp: {pat.guardianName}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => handleEditPatient(pat)} style={{ padding: "0.3rem 0.6rem", backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600 }}>
                          Editar
                        </button>
                        <button onClick={() => handleDeletePatient(pat.id)} style={{ padding: "0.3rem 0.6rem", backgroundColor: "var(--danger-light)", color: "var(--danger)", border: "none", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600 }}>
                          Remover
                        </button>
                      </div>
                    </div>
                    {pat.notes && (
                      <div style={{ marginTop: "0.5rem", padding: "0.75rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <strong>Anotações:</strong> <br/>
                        {pat.notes}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === "new_reservation" && (
        <div className="card animate-slide">
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Agendar em nome de um Profissional</h2>
          <form onSubmit={handleAdminCreateReservation} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="label">Profissional</label>
                <select className="input" value={newResProfId} onChange={e => setNewResProfId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {professionalsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Sala</label>
                <select className="input" value={newResRoomId} onChange={e => setNewResRoomId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Serviço/Detalhes</label>
                <select className="input" value={newResService} onChange={e => { setNewResService(e.target.value); setNewResSlots([]); }} required style={{ cursor: "pointer" }}>
                  <option value="">(Selecione um serviço...)</option>
                  {servicesList?.map(svc => (
                    <option key={svc.id} value={svc.name}>
                      {svc.name}{svc.duration ? ` (${svc.duration} min)` : ""}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={newResDate} onChange={e => { setNewResDate(e.target.value); setNewResSlots([]); }} required />
              </div>
            </div>

            {newResRoomId && newResDate && newResService && (
              <div className="animate-fade" style={{ marginTop: "0.5rem" }}>
                <label className="label">Horários Disponíveis (Pode selecionar múltiplos)</label>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem" }}>
                  {TIME_SLOTS.map(slot => {
                    const isOccupied = occupiedAdminNewResSlots.includes(slot);
                    const isSelected = newResSlots.includes(slot);
                    
                    const isBlockedBySelection = newResSlots.some(selectedSlot => {
                      if (selectedSlot === slot) return false;
                      const startMins = parseInt(selectedSlot.split(':')[0]) * 60 + parseInt(selectedSlot.split(':')[1]);
                      const currentMins = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
                      const selectedServiceObj = servicesList?.find(s => s.name === newResService);
                      const duration = newResService ? (selectedServiceObj?.duration || 60) : 30;
                      return currentMins > startMins && currentMins < startMins + duration;
                    });

                    const isDisabled = isOccupied || isBlockedBySelection;
                    
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setNewResSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort())}
                        style={{
                          padding: "0.6rem", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "0.85rem",
                          border: "1px solid",
                          borderColor: isDisabled ? "var(--border-color)" : isSelected ? "var(--primary)" : "var(--border-color)",
                          background: isDisabled ? "var(--primary-light)" : isSelected ? "var(--primary)" : "var(--bg-color)",
                          color: isDisabled ? "var(--text-light)" : isSelected ? "var(--primary-mid)" : "var(--text-secondary)",
                          cursor: isDisabled ? "not-allowed" : "pointer",
                          textDecoration: isDisabled ? "line-through" : "none"
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="label">Nome do Paciente (Opcional)</label>
                <select className="input" value={newResPatient} onChange={e => setNewResPatient(e.target.value)} style={{ cursor: "pointer" }}>
                  <option value="">(Sem paciente / Selecione...)</option>
                  {patientsList.map(pat => {
                    let ageStr = "";
                    if (pat.birthDate) {
                      const birthDate = new Date(pat.birthDate);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                      if (age >= 0) ageStr = ` (${age} anos)`;
                    }
                    return <option key={pat.id} value={pat.name}>{pat.name}{ageStr}</option>;
                  })}
                </select>
              </div>

            </div>

            <button type="submit" className="btn" style={{ marginTop: "1rem", alignSelf: "flex-start" }}>
              Confirmar Agendamento Admin
            </button>
          </form>
        </div>
      )}

      {/* DISPONIBILIDADE */}
      {activeTab === "disponibilidade" && (
        <section className="animate-slide">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-main)" }}>Grade de Ocupação</h2>
            <input
              type="date"
              value={selectedDispDate}
              onChange={(e) => { if (e.target.value) setSelectedDispDate(e.target.value); }}
              className="input"
              style={{ width: "200px" }}
            />
          </div>

          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ background: "var(--primary-light)" }}>
                    <th style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color)", textAlign: "left", width: "90px", position: "sticky", left: 0, zIndex: 2, background: "var(--primary-light)", fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                      Horário
                    </th>
                    {rooms.map(room => (
                      <th key={room.id} style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                        {room.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, slotIdx) => (
                    <tr key={slot} style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: slotIdx % 2 === 0 ? "var(--bg-color)" : "var(--card-bg)" }}>
                      <td style={{ padding: "0.75rem 1.25rem", fontWeight: 700, fontSize: "0.875rem", color: "var(--text-secondary)", position: "sticky", left: 0, zIndex: 1, borderRight: "1px solid var(--border-color)", backgroundColor: slotIdx % 2 === 0 ? "var(--bg-color)" : "var(--card-bg)", whiteSpace: "nowrap" }}>
                        {slot}
                      </td>
                      {rooms.map(room => {
                        // Encontra reserva para esta sala, dia e horário
                        const res = allReservations.find(r => r.roomId === room.id && r.date === selectedDispDate && r.startTime === slot && (!r.status || r.status === 'agendado' || r.status === 'confirmado' || r.status === 'realizado'));
                        
                        let bg = "var(--bg-color)", color = "var(--text-secondary)", label = "Livre", icon = "✓";
                        if (res) {
                          bg = "var(--primary-light)"; color = "var(--primary)"; label = professionalsMap[res.professionalId] || "Ocupado"; icon = "✗";
                        }

                        return (
                          <td key={room.id} style={{ padding: "0", borderRight: "1px solid var(--border-color)" }}>
                            <div style={{ backgroundColor: bg, color, height: "100%", width: "100%", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.2rem" }}>
                              <span style={{ fontSize: "1rem", fontWeight: 800 }}>{icon}</span>
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, textAlign: "center" }}>{label}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ADMIN TAREFAS */}
      {activeTab === "tarefas" && (
        <div className="card animate-slide">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Gestão Global de Tarefas ({filteredAdminTasks.length})</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={fetchAdminTasks} className="btn btn-outline btn-sm">↻ Atualizar</button>
              <button onClick={() => {
                setEditingAdminTaskId(null);
                setNewTaskTitle("");
                setNewTaskDesc("");
                setNewTaskDueDate("");
                setNewTaskPriority("media");
                setSelectedTaskProfs([]);
                setShowTaskModal(true);
              }} className="btn btn-sm">➕ Nova Tarefa</button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem", backgroundColor: "var(--bg-color)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div>
              <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Prioridade</label>
              <select className="input" style={{ padding: "0.4rem" }} value={filterAdminTaskPriority} onChange={e => setFilterAdminTaskPriority(e.target.value)}>
                <option value="">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Atribuído para</label>
              <select className="input" style={{ padding: "0.4rem" }} value={filterAdminTaskAssignedTo} onChange={e => setFilterAdminTaskAssignedTo(e.target.value)}>
                <option value="">Todos</option>
                <option value="admin">Admin</option>
                {professionalsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Status</label>
              <select className="input" style={{ padding: "0.4rem" }} value={filterAdminTaskStatus} onChange={e => setFilterAdminTaskStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="atrasada">Atrasada</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          </div>
          
          {loadingAdminTasks ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div className="spinner" style={{ margin: "0 auto 1rem" }} />
              <p style={{ color: "var(--text-muted)" }}>Carregando tarefas...</p>
            </div>
          ) : filteredAdminTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍃</div>
              <p>Nenhuma tarefa atribuída no sistema.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="responsive-table" style={{ minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left", backgroundColor: "var(--bg-color)" }}>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Tarefa</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Atribuído Para</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Status</th>
                    <th style={{ padding: "1rem", color: "var(--text-secondary)", textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminTasks.map(assignment => (
                    <tr key={assignment.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-main)" }}>{assignment.task?.title || "Sem Título"}</div>
                          {(!assignment.task?.priority || assignment.task?.priority === 'media') && <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: "0.6rem" }}>Média</span>}
                          {assignment.task?.priority === 'alta' && <span className="badge" style={{ backgroundColor: "#fee2e2", color: "#991b1b", fontSize: "0.6rem" }}>Alta</span>}
                          {assignment.task?.priority === 'baixa' && <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: "0.6rem" }}>Baixa</span>}
                          {assignment.computedStatus === 'atrasada' && <span className="badge" style={{ backgroundColor: "var(--danger)", color: "white", fontSize: "0.6rem" }}>⚠️ Atrasada</span>}
                        </div>
                        {assignment.task?.due_date && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Prazo: {new Date(assignment.task.due_date + "T00:00:00").toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {assignment.task?.created_at && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Criada em: {new Date(assignment.task.created_at).toLocaleString('pt-BR')}
                          </div>
                        )}
                        {assignment.task?.description && (
                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                            {assignment.task.description}
                          </div>
                        )}
                        <div style={{ marginTop: "0.5rem" }}>
                          <textarea 
                            placeholder="Comentário..."
                            style={{ 
                              width: "100%", padding: "0.4rem", borderRadius: "var(--radius-sm)", 
                              border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)",
                              fontSize: "0.8rem", resize: "vertical", minHeight: "40px",
                              fontFamily: "inherit"
                            }}
                            value={assignment.comment || ""}
                            onChange={(e) => setAdminTasks(prev => prev.map(t => t.id === assignment.id ? { ...t, comment: e.target.value } : t))}
                            onBlur={(e) => handleAdminCommentChange(assignment.id, e.target.value)}
                          />
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontWeight: 500, color: "var(--primary)" }}>
                        {assignment.professional_id === null ? "⚙️ Administração" : (assignment.professional?.name || "Desconhecido")}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {assignment.computedStatus === 'concluida' ? (
                          <span className="badge" style={{ backgroundColor: "#dcfce7", color: "var(--success, #166534)", fontSize: "0.75rem" }}>✓ Concluída</span>
                        ) : assignment.computedStatus === 'atrasada' ? (
                          <span className="badge" style={{ backgroundColor: "var(--danger)", color: "white", fontSize: "0.75rem" }}>⚠️ Atrasada</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-muted)", border: "1px solid var(--border-color)", fontSize: "0.75rem" }}>⏳ Pendente</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button 
                            onClick={() => toggleAdminTaskStatus(assignment)}
                            style={{ 
                              color: assignment.computedStatus === 'pendente' || assignment.computedStatus === 'atrasada' ? "white" : "var(--success)", 
                              backgroundColor: assignment.computedStatus === 'pendente' || assignment.computedStatus === 'atrasada' ? "var(--success)" : "#dcfce7", 
                              padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer" 
                            }}
                          >
                            {assignment.computedStatus === 'pendente' || assignment.computedStatus === 'atrasada' ? 'Concluir' : 'Reabrir'}
                          </button>
                          <button 
                            onClick={() => openEditAdminTask(assignment)}
                            style={{ color: "var(--primary)", backgroundColor: "var(--primary-light)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer" }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteTask(assignment.task_id)}
                            style={{ color: "white", backgroundColor: "var(--danger)", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer" }}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE REAGENDAMENTO */}
      {reschedulingId && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: "1rem"
        }}>
          <div className="card animate-slide" style={{ maxWidth: "400px", width: "100%", position: "relative", boxShadow: "var(--clay-card-hover)" }}>
            <button 
              onClick={() => setReschedulingId(null)}
              style={{ position: "absolute", top: "1rem", right: "1rem", color: "var(--text-muted)", fontSize: "1.5rem" }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem", color: "var(--text-main)" }}>Reagendar Sessão</h2>
            <form onSubmit={handleRescheduleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Nova Sala</label>
                <select className="input" value={rescheduleRoom} onChange={e => setRescheduleRoom(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Nova Data</label>
                <input type="date" className="input" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} required />
              </div>
              {rescheduleDate && rescheduleRoom && (
                <div className="animate-fade">
                  <label className="label">Escolha o novo horário</label>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.4rem", maxHeight: "200px", overflowY: "auto", padding: "0.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                    {TIME_SLOTS.map(slot => {
                      const isOccupied = occupiedAdminRescheduleSlots.includes(slot);
                      const isSelected = rescheduleStart === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => setRescheduleStart(slot)}
                          style={{
                            padding: "0.5rem", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "0.85rem",
                            border: "1px solid",
                            borderColor: isOccupied ? "var(--border-color)" : isSelected ? "var(--primary)" : "var(--border-color)",
                            background: isOccupied ? "var(--primary-light)" : isSelected ? "var(--primary)" : "var(--bg-color)",
                            color: isOccupied ? "var(--text-light)" : isSelected ? "white" : "var(--text-secondary)",
                            cursor: isOccupied ? "not-allowed" : "pointer",
                            textDecoration: isOccupied ? "line-through" : "none"
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <button type="submit" className="btn" style={{ marginTop: "1rem", backgroundColor: "#f59e0b", color: "white" }}>
                Confirmar Reagendamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVA TAREFA (ADMIN) */}
      {showTaskModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex",
          zIndex: 999, padding: "1rem", overflowY: "auto"
        }}>
          <div className="card animate-slide" style={{ margin: "auto", width: "100%", maxWidth: "500px", padding: "1.25rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem" }}>
              {editingAdminTaskId ? "Editar Tarefa" : "Atribuir Nova Tarefa"}
            </h2>
            <form onSubmit={handleSaveAdminTask} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div>
                <label className="label">Título da Tarefa</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newTaskTitle} 
                  onChange={e => setNewTaskTitle(e.target.value)}
                  required
                  placeholder="Ex: Atualizar prontuários"
                />
              </div>

              <div>
                <label className="label">Comentário / Descrição</label>
                <textarea 
                  className="input" 
                  value={newTaskDesc} 
                  onChange={e => setNewTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="Detalhes adicionais da tarefa..."
                />
              </div>

              <div>
                <label className="label">Prazo (Opcional)</label>
                <input 
                  type="date" 
                  className="input" 
                  value={newTaskDueDate} 
                  onChange={e => setNewTaskDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Prioridade</label>
                <select 
                  className="input" 
                  value={newTaskPriority} 
                  onChange={e => setNewTaskPriority(e.target.value)}
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="label">Atribuir para:</label>
                <div style={{ display: "grid", gap: "0.5rem", maxHeight: "150px", overflowY: "auto", border: "1px solid var(--border-color)", padding: "0.5rem", borderRadius: "var(--radius-md)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem", fontWeight: 700, color: "var(--danger)" }}>
                    <input 
                      type="checkbox"
                      checked={selectedTaskProfs.includes('admin')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTaskProfs([...selectedTaskProfs, 'admin']);
                        else setSelectedTaskProfs(selectedTaskProfs.filter(id => id !== 'admin'));
                      }}
                    />
                    ⚙️ Administração
                  </label>
                  {professionalsList.map(prof => (
                    <label key={prof.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                      <input 
                        type="checkbox"
                        checked={selectedTaskProfs.includes(prof.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTaskProfs([...selectedTaskProfs, prof.id]);
                          else setSelectedTaskProfs(selectedTaskProfs.filter(id => id !== prof.id));
                        }}
                      />
                      {prof.name}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                   <button type="button" onClick={() => setSelectedTaskProfs(professionalsList.map(p => p.id))} className="badge badge-primary" style={{ cursor: "pointer" }}>Todos os Profissionais</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submittingTask} className="btn" style={{ flex: 1 }}>
                  {submittingTask ? "Salvando..." : "Criar Tarefa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DE PACIENTE */}
      {viewingPatient && (
        <div id="admin-modal-overlay" style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: "1rem"
        }} onClick={() => setViewingPatient(null)}>
          <style>{`
            .only-print { display: none; }
            @media print {
              body * { visibility: hidden; }
              #admin-modal-overlay { align-items: flex-start !important; padding: 0 !important; background: transparent !important; }
              #print-admin-patient-modal, #print-admin-patient-modal * { visibility: visible; }
              #print-admin-patient-modal { 
                position: absolute; left: 0; top: 0; width: 100%; 
                max-width: none !important; max-height: none !important; overflow: visible !important;
                padding: 0 !important; margin: 0 !important; box-shadow: none !important;
                background: white !important; border: none !important; display: block !important;
              }
              .no-print { display: none !important; }
              .only-print { display: block !important; }
              
              .print-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 1rem !important; align-items: start; }
              .print-full { grid-column: 1 / -1 !important; }
              .data-box { background: transparent !important; border: 1px solid #ccc !important; break-inside: avoid; box-shadow: none !important; padding: 1rem !important; border-radius: 8px !important; }
              .data-box h4 { color: #000 !important; border-bottom: 1px solid #ddd; padding-bottom: 0.4rem; margin-bottom: 0.8rem !important; font-size: 1rem !important; }
              .data-box p { font-size: 0.95rem !important; color: #333 !important; }
            }
          `}</style>
          <div id="print-admin-patient-modal" className="card animate-slide" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative", backgroundColor: "var(--card-bg)" }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingPatient(null)}
              className="no-print"
              style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1, zIndex: 10 }}
            >
              &times;
            </button>
            
            <div className="only-print" style={{ textAlign: "center", marginBottom: "2rem", borderBottom: "2px solid #000", paddingBottom: "1rem" }}>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "bold", margin: 0, color: "#000", textTransform: "uppercase" }}>Ficha de Cadastro do Paciente</h1>
              <p style={{ fontSize: "1rem", margin: "0.5rem 0 0 0", color: "#333" }}>Clínica de Psicologia</p>
            </div>

            <h2 className="no-print" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)", marginBottom: "1.5rem", paddingRight: "2rem" }}>
              {viewingPatient.name}
            </h2>
            <h2 className="only-print" style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "1rem", color: "#000" }}>Paciente: {viewingPatient.name}</h2>

            <div className="print-grid" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div className="only-print data-box print-full" style={{ display: "none", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                 <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Status e Convênio</h4>
                 <div style={{ display: "flex", gap: "2rem" }}>
                    <p style={{ margin: 0 }}><strong>Status:</strong> {viewingPatient.status === 'concluido' ? 'Alta' : 'Em Tratamento'}</p>
                    <p style={{ margin: 0 }}><strong>Convênio:</strong> {viewingPatient.healthPlan || "Particular"} {viewingPatient.healthPlanNumber ? `(Nº: ${viewingPatient.healthPlanNumber})` : ""}</p>
                 </div>
              </div>

              {(viewingPatient.email || viewingPatient.phone) && (
                <div className="data-box" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Contato</h4>
                  {viewingPatient.phone && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Telefone:</strong> {viewingPatient.phone}</p>}
                  {viewingPatient.email && <p style={{ fontSize: "0.95rem", margin: 0 }}><strong>E-mail:</strong> {viewingPatient.email}</p>}
                </div>
              )}

              {(viewingPatient.birthDate || viewingPatient.gender || viewingPatient.cpf) && (
                <div className="data-box" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Dados Pessoais</h4>
                  {viewingPatient.cpf && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>CPF:</strong> {viewingPatient.cpf}</p>}
                  {viewingPatient.birthDate && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Nascimento:</strong> {new Date(viewingPatient.birthDate + "T00:00:00").toLocaleDateString("pt-BR")} <span style={{ fontSize: "0.85rem", color: "#555", marginLeft: "0.3rem" }}>({calculateAge(viewingPatient.birthDate)})</span></p>}
                  {viewingPatient.gender && <p style={{ fontSize: "0.95rem", margin: 0 }}><strong>Gênero:</strong> {viewingPatient.gender}</p>}
                </div>
              )}

              {(viewingPatient.guardianName || viewingPatient.parentsName || viewingPatient.parentsProfession) && (
                <div className="data-box" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Responsáveis</h4>
                  {viewingPatient.guardianName && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Responsável Direto:</strong> {viewingPatient.guardianName}</p>}
                  {viewingPatient.parentsName && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Nome dos Pais:</strong> {viewingPatient.parentsName}</p>}
                  {viewingPatient.parentsProfession && <p style={{ fontSize: "0.95rem", margin: 0 }}><strong>Profissão dos Pais:</strong> {viewingPatient.parentsProfession}</p>}
                </div>
              )}

              {(viewingPatient.schoolName || viewingPatient.schoolGrade || viewingPatient.schoolType) && (
                <div className="data-box" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Dados Escolares</h4>
                  {viewingPatient.schoolName && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Escola:</strong> {viewingPatient.schoolName}</p>}
                  {viewingPatient.schoolGrade && <p style={{ fontSize: "0.95rem", margin: "0 0 0.3rem 0" }}><strong>Série/Ano:</strong> {viewingPatient.schoolGrade}</p>}
                  {viewingPatient.schoolType && <p style={{ fontSize: "0.95rem", margin: 0 }}><strong>Tipo:</strong> {viewingPatient.schoolType}</p>}
                </div>
              )}

              {viewingPatient.address && (
                <div className="data-box print-full" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Endereço</h4>
                  <p style={{ fontSize: "0.95rem", margin: 0 }}>{viewingPatient.address}</p>
                </div>
              )}

              <div className="data-box print-full" style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <h4 style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Termos e Consentimento (LGPD)</h4>
                <p style={{ fontSize: "0.95rem", margin: 0, color: viewingPatient.lgpd_consent ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                  {viewingPatient.lgpd_consent ? "✓ Termos de aceite LGPD e veracidade das informações concordados pelo paciente." : "✗ Aceite pendente ou não registrado."}
                </p>
              </div>

              {viewingPatient.notes && (
                <div className="data-box print-full" style={{ padding: "1rem", backgroundColor: "var(--primary-light)", borderRadius: "var(--radius-sm)", border: "1px solid var(--primary-light)" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--primary)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Anotações da Clínica</h4>
                  <p style={{ fontSize: "0.9rem", margin: 0, color: "var(--text-main)", whiteSpace: "pre-wrap" }}>{viewingPatient.notes}</p>
                </div>
              )}
              
              <div className="only-print print-full data-box" style={{ display: "none", marginTop: "1rem" }}>
                  <h4 style={{ fontSize: "1rem", color: "#000", textTransform: "uppercase", borderBottom: "1px solid #ddd", paddingBottom: "0.4rem", marginBottom: "1rem", fontWeight: 700 }}>Datas das Sessões</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", marginTop: "1.5rem" }}>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                      <div style={{ borderBottom: "1px solid #999", width: "100%" }}></div>
                  </div>
              </div>
            </div>

            <div className="no-print" style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
              <button onClick={() => window.print()} className="btn btn-outline" style={{ flex: 1 }}>
                🖨️ Imprimir Cadastro
              </button>
              <button onClick={() => setViewingPatient(null)} className="btn" style={{ flex: 1 }}>
                Fechar
              </button>
            </div>
            
            <div className="only-print" style={{ display: "none", marginTop: "3rem", textAlign: "center", borderTop: "1px dashed #ccc", paddingTop: "1rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#666" }}>Impresso em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </div>
      )}

      {/* FINANÇAS */}
      {activeTab === "finances" && (
        <div className="animate-slide">
          {!isFinancesUnlocked ? (
            <div className="card" style={{ padding: "4rem 2rem", maxWidth: "450px", margin: "4rem auto", textAlign: "center" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1.5rem", color: "var(--primary)" }}>🔒</div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>Acesso Restrito</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
                O módulo financeiro contém informações sensíveis. Digite a senha para continuar.
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (financePasswordInput === "riqueza123") {
                  setIsFinancesUnlocked(true);
                  setFinancePasswordInput("");
                } else {
                  alert("Senha incorreta!");
                }
              }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <input 
                  type="password" 
                  className="input" 
                  placeholder="Digite a senha..." 
                  value={financePasswordInput}
                  onChange={e => setFinancePasswordInput(e.target.value)}
                  style={{ textAlign: "center", fontSize: "1.1rem", padding: "0.8rem", letterSpacing: "2px" }}
                  autoFocus
                />
                <button type="submit" className="btn" style={{ padding: "0.8rem", fontSize: "1rem" }}>
                  Desbloquear
                </button>
              </form>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>💰</span> Dashboard Financeiro
                </h2>
                <button 
                  onClick={() => setIsFinancesUnlocked(false)} 
                  className="btn btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
                  title="Bloquear painel"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 11V7a4 4 0 00-8 0v4M5 11h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z"></path></svg>
                  Bloquear
                </button>
              </div>

              <div style={{ display: "flex", gap: "1rem", backgroundColor: "var(--bg-color)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", flexWrap: "wrap", alignItems: "center" }}>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>Período:</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>De</label>
                  <input type="date" className="input" style={{ padding: "0.4rem" }} value={financeStartDate} onChange={e => setFinanceStartDate(e.target.value)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Até</label>
                  <input type="date" className="input" style={{ padding: "0.4rem" }} value={financeEndDate} onChange={e => setFinanceEndDate(e.target.value)} />
                </div>
              </div>

              {/* Cards de Resumo */}
              {(() => {
                const totalReceitas = financesList.filter(f => f.type === 'receita').reduce((acc, curr) => acc + Number(curr.amount), 0);
                const totalDespesas = financesList.filter(f => f.type === 'despesa').reduce((acc, curr) => acc + Number(curr.amount), 0);
                const saldo = totalReceitas - totalDespesas;
                
                return (
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                    <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--success)" }}>
                      <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Entradas</h3>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success)", marginTop: "0.5rem" }}>
                        R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--danger)" }}>
                      <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Saídas</h3>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--danger)", marginTop: "0.5rem" }}>
                        R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--primary)", backgroundColor: "var(--primary-light)" }}>
                      <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Saldo Líquido</h3>
                      <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)", marginTop: "0.5rem" }}>
                        R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Gráfico Financeiro */}
              <div className="card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "1.5rem" }}>Visão Geral</h3>
                {financesList.length > 0 ? (
                  <div style={{ height: "300px", width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Receitas', valor: financesList.filter(f => f.type === 'receita').reduce((a, c) => a + Number(c.amount), 0), fill: 'var(--success)' },
                        { name: 'Despesas', valor: financesList.filter(f => f.type === 'despesa').reduce((a, c) => a + Number(c.amount), 0), fill: 'var(--danger)' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} tickFormatter={(value) => `R$ ${value}`} />
                        <Tooltip cursor={{fill: 'var(--bg-color)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:2})}`, 'Valor']} />
                        <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 0" }}>Não há dados para gerar o gráfico neste período.</p>
                )}
              </div>

              {/* Tabela de Transações */}
              <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-main)" }}>Transações</h3>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={() => { setFinanceForm({ id: "", date: new Date().toISOString().split("T")[0], description: "", category: "Consulta", type: "receita", amount: "", due_date: "", is_paid: true }); setShowFinanceModal(true); }} className="btn btn-outline" style={{ borderColor: "var(--success)", color: "var(--success)", padding: "0.4rem 1rem", fontSize: "0.85rem" }}>+ Nova Receita</button>
                        <button onClick={() => { setFinanceForm({ id: "", date: new Date().toISOString().split("T")[0], description: "", category: "Material", type: "despesa", amount: "", due_date: "", is_paid: false }); setShowFinanceModal(true); }} className="btn btn-outline" style={{ borderColor: "var(--danger)", color: "var(--danger)", padding: "0.4rem 1rem", fontSize: "0.85rem" }}>- Nova Despesa</button>
                  </div>
                </div>

                <div className="table-scroll">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                        <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Data</th>
                        <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Descrição</th>
                        <th style={{ padding: "1rem", color: "var(--text-secondary)" }}>Categoria</th>
                        <th style={{ padding: "1rem", color: "var(--text-secondary)", textAlign: "right" }}>Valor</th>
                        <th style={{ padding: "1rem", color: "var(--text-secondary)", textAlign: "center" }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financesList.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                            Nenhuma transação encontrada no período.
                          </td>
                        </tr>
                      ) : (
                        financesList.map(finance => (
                          <tr key={finance.id} style={{ borderBottom: "1px solid var(--border-color)", opacity: (!finance.is_paid && finance.type === 'despesa') ? 0.7 : 1 }}>
                            <td style={{ padding: "1rem", color: "var(--text-main)" }}>
                              {new Date(finance.date + "T00:00:00").toLocaleDateString('pt-BR')}
                              {finance.type === 'despesa' && finance.due_date && (
                                <div style={{ fontSize: "0.75rem", color: finance.is_paid ? "var(--text-muted)" : "var(--danger)", marginTop: "0.2rem", fontWeight: finance.is_paid ? "normal" : "bold" }}>
                                  Venc: {new Date(finance.due_date + "T00:00:00").toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "1rem", color: "var(--text-main)", fontWeight: 500 }}>
                              {finance.description}
                              {finance.type === 'despesa' && (
                                 <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "10px", backgroundColor: finance.is_paid ? "rgba(40,167,69,0.1)" : "rgba(220,53,69,0.1)", color: finance.is_paid ? "var(--success)" : "var(--danger)" }}>
                                   {finance.is_paid ? "Pago" : "Pendente"}
                                 </span>
                              )}
                            </td>
                            <td style={{ padding: "1rem" }}>
                               <span className="badge" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-muted)", border: "1px solid var(--border-color)", fontSize: "0.75rem" }}>
                                 {finance.category}
                               </span>
                            </td>
                            <td style={{ padding: "1rem", color: finance.type === 'receita' ? "var(--success)" : "var(--danger)", fontWeight: 700, textAlign: "right" }}>
                              {finance.type === 'receita' ? '+' : '-'} R$ {Number(finance.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "1rem", textAlign: "center", display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center" }}>
                              {finance.type === 'despesa' && (
                                <button onClick={() => handleTogglePaid(finance.id, finance.is_paid)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }} title={finance.is_paid ? "Marcar como pendente" : "Marcar como pago"}>
                                  {finance.is_paid ? '↩️' : '✅'}
                                </button>
                              )}
                              <button onClick={() => handleDeleteFinance(finance.id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "1.3rem" }} title="Excluir">
                                &times;
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showFinanceModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide" style={{ maxWidth: "500px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "1rem" }}>
              Adicionar {financeForm.type === 'receita' ? 'Receita' : 'Despesa'}
            </h2>
            <form onSubmit={handleSaveFinance} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Data {financeForm.type === 'despesa' ? "da Despesa" : "da Receita"}</label>
                  <input type="date" className="input" value={financeForm.date} onChange={e => setFinanceForm({...financeForm, date: e.target.value})} required />
                </div>
                {financeForm.type === 'despesa' && (
                  <div style={{ flex: 1 }}>
                    <label className="label">Vencimento (Opcional)</label>
                    <input type="date" className="input" value={financeForm.due_date || ""} onChange={e => setFinanceForm({...financeForm, due_date: e.target.value})} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <label className="label">Valor (R$)</label>
                  <input type="text" className="input" value={financeForm.amount} onChange={e => setFinanceForm({...financeForm, amount: e.target.value})} placeholder="0,00" required />
                </div>
              </div>
              
              {financeForm.type === 'despesa' && (
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "-0.5rem", fontSize: "0.95rem", color: "var(--text-main)" }}>
                  <input type="checkbox" checked={financeForm.is_paid} onChange={e => setFinanceForm({...financeForm, is_paid: e.target.checked})} style={{ width: "18px", height: "18px" }} />
                  <strong>Esta despesa já foi paga</strong>
                </label>
              )}

              <div>
                <label className="label">Descrição</label>
                <input type="text" className="input" value={financeForm.description} onChange={e => setFinanceForm({...financeForm, description: e.target.value})} placeholder="Ex: Consulta João Silva" required />
              </div>
              <div>
                <label className="label">Categoria</label>
                <select className="input" value={financeForm.category} onChange={e => setFinanceForm({...financeForm, category: e.target.value})} required>
                  {financeForm.type === 'receita' ? (
                    <>
                      <option value="Consulta">Consulta Particular</option>
                      <option value="Convênio">Convênio</option>
                      <option value="Avaliação">Avaliação</option>
                      <option value="Outros">Outros</option>
                    </>
                  ) : (
                    <>
                      <option value="Aluguel">Aluguel/Condomínio</option>
                      <option value="Material">Material de Escritório</option>
                      <option value="Impostos">Impostos</option>
                      <option value="Marketing">Marketing/Software</option>
                      <option value="Outros">Outros</option>
                    </>
                  )}
                </select>
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowFinanceModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={isSubmittingFinance}>
                  {isSubmittingFinance ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
