"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation, NEXT_DAYS, TIME_SLOTS } from "../../context/ReservationContext";
import { supabase } from "../../lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const { rooms, fetchAllReservations, cancelReservation, updateReservationStatus, addRoom, updateRoom, deleteRoom, loading, addReservations, servicesList, addService, updateService, deleteService } = useReservation();
  const allReservations = fetchAllReservations();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "reservations" | "rooms" | "professionals" | "new_reservation" | "patients" | "disponibilidade" | "relatorios" | "services" | "tarefas">("dashboard");
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
  const [viewingPatient, setViewingPatient] = useState<any | null>(null);

  // Service Form State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceDuration, setServiceDuration] = useState("60");

  // Admin Tasks State
  const [adminTasks, setAdminTasks] = useState<any[]>([]);
  const [loadingAdminTasks, setLoadingAdminTasks] = useState(false);

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
  const [filterAdminTaskAssignedBy, setFilterAdminTaskAssignedBy] = useState("");
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
    
    const roomSlots = allReservations
      .filter(res => res.roomId === newResRoomId && res.date === newResDate && (!res.status || res.status === 'agendado' || res.status === 'confirmado' || res.status === 'realizado'))
      .map(res => res.startTime);

    let profSlots: string[] = [];
    if (newResProfId) {
      profSlots = allReservations
        .filter(res => res.professionalId === newResProfId && res.date === newResDate && (!res.status || res.status === 'agendado' || res.status === 'confirmado' || res.status === 'realizado' || res.status === 'indisponivel'))
        .map(res => res.startTime);
    }

    return Array.from(new Set([...roomSlots, ...profSlots]));
  }, [allReservations, newResRoomId, newResDate, newResProfId]);

  const occupiedAdminRescheduleSlots = useMemo(() => {
    if (!rescheduleRoom || !rescheduleDate) return [];
    return allReservations
      .filter(res => res.roomId === rescheduleRoom && res.date === rescheduleDate && res.id !== reschedulingId && (!res.status || res.status === 'agendado' || res.status === 'confirmado' || res.status === 'realizado'))
      .map(res => res.startTime);
  }, [allReservations, rescheduleRoom, rescheduleDate, reschedulingId]);

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
    return adminTasks.filter(t => {
      if (filterAdminTaskPriority && t.task?.priority !== filterAdminTaskPriority && !(filterAdminTaskPriority === 'media' && !t.task?.priority)) return false;
      if (filterAdminTaskAssignedBy && t.task?.created_by !== filterAdminTaskAssignedBy && !(filterAdminTaskAssignedBy === 'admin' && t.task?.created_by === null)) return false;
      if (filterAdminTaskStatus && t.status !== filterAdminTaskStatus) return false;
      return true;
    });
  }, [adminTasks, filterAdminTaskPriority, filterAdminTaskAssignedBy, filterAdminTaskStatus]);

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
    // Basic PIN check using sessionStorage
    const savedPin = sessionStorage.getItem("@Clinica:adminPin");
    if (savedPin === "1234") {
      setIsAdmin(true);
    } else {
      router.push("/");
    }

    // Fetch professionals to show their names and list them
    if (savedPin === "1234") {
      fetchProfessionals();
      fetchPatients();
      setNewResDate(new Date().toISOString().split("T")[0]); // Set default date
    }
  }, [router]);

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
    if (!newResProfId || !newResRoomId || !newResDate || newResSlots.length === 0) return;

    const allNewReservations = newResSlots.map(slot => {
      const [hours, minutes] = slot.split(":").map(Number);
      const d = new Date();
      d.setHours(hours + 1, minutes, 0); 
      return {
        roomId: newResRoomId,
        professionalId: newResProfId,
        date: newResDate,
        startTime: slot,
        endTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        patientName: newResPatient || undefined,
        service: newResService || undefined
      };
    });

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

    const [hours, minutes] = rescheduleStart.split(":").map(Number);
    const d = new Date();
    d.setHours(hours + 1, minutes, 0);
    const calculatedEnd = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

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
          {/* Form de Nova/Edição Paciente */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              {editingPatientId ? "Editar Paciente" : "Novo Paciente"}
            </h2>
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
                  <label className="label">Data de Nascimento</label>
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
                {editingPatientId && (
                  <button type="button" onClick={() => { 
                    setEditingPatientId(null); setPatName(""); setPatEmail(""); setPatPhone(""); setPatBirthDate(""); setPatAddress(""); setPatGuardian(""); setPatHealthPlan(""); setPatHealthPlanNumber(""); setPatGender(""); setPatNotes(""); setPatCpf(""); setPatParentsName(""); setPatParentsProfession(""); setPatSchoolName(""); setPatSchoolGrade(""); setPatSchoolType("");
                  }} className="btn btn-outline">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Lista de Pacientes */}
          <div className="card animate-slide">
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>Pacientes ({patientsList.length})</h2>
            <div style={{ marginBottom: "1rem" }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Pesquisar por nome do paciente..." 
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "600px", overflowY: "auto" }}>
              {(() => {
                const filteredPatients = patientsList.filter(pat => pat.name.toLowerCase().includes(patientSearch.toLowerCase()));
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
                <label className="label">Data</label>
                <input type="date" className="input" value={newResDate} onChange={e => { setNewResDate(e.target.value); setNewResSlots([]); }} required />
              </div>
            </div>

            {newResRoomId && newResDate && (
              <div className="animate-fade" style={{ marginTop: "0.5rem" }}>
                <label className="label">Horários Disponíveis (Pode selecionar múltiplos)</label>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.5rem" }}>
                  {TIME_SLOTS.map(slot => {
                    const isOccupied = occupiedAdminNewResSlots.includes(slot);
                    const isSelected = newResSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => setNewResSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort())}
                        style={{
                          padding: "0.6rem", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: "0.85rem",
                          border: "1px solid",
                          borderColor: isOccupied ? "var(--border-color)" : isSelected ? "var(--primary)" : "var(--border-color)",
                          background: isOccupied ? "var(--primary-light)" : isSelected ? "var(--primary)" : "var(--bg-color)",
                          color: isOccupied ? "var(--text-light)" : isSelected ? "var(--primary-mid)" : "var(--text-secondary)",
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
              <div>
                <label className="label">Serviço/Detalhes (Opcional)</label>
                <select className="input" value={newResService} onChange={e => setNewResService(e.target.value)} style={{ cursor: "pointer" }}>
                  <option value="">(Selecione um serviço...)</option>
                  {servicesList?.map(svc => (
                    <option key={svc.id} value={svc.name}>
                      {svc.name}{svc.duration ? ` (${svc.duration} min)` : ""}
                    </option>
                  ))}
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
              <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Atribuído por</label>
              <select className="input" style={{ padding: "0.4rem" }} value={filterAdminTaskAssignedBy} onChange={e => setFilterAdminTaskAssignedBy(e.target.value)}>
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
                        </div>
                        {assignment.task?.due_date && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            Prazo: {new Date(assignment.task.due_date + "T00:00:00").toLocaleDateString('pt-BR')}
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
                        {assignment.status === 'concluida' ? (
                          <span className="badge" style={{ backgroundColor: "#dcfce7", color: "var(--success, #166534)", fontSize: "0.75rem" }}>✓ Concluída</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-muted)", border: "1px solid var(--border-color)", fontSize: "0.75rem" }}>⏳ Pendente</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
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
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: "1rem"
        }}>
          <div className="card animate-slide" style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "2rem" }}>
            <button 
              onClick={() => setViewingPatient(null)}
              style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)", lineHeight: 1 }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)", marginBottom: "1.5rem", paddingRight: "2rem" }}>
              {viewingPatient.name}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>CPF</span><p style={{ fontWeight: 600 }}>{viewingPatient.cpf || "Não informado"}</p></div>
                <div><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Nascimento</span><p style={{ fontWeight: 600 }}>{viewingPatient.birthDate ? new Date(viewingPatient.birthDate + "T00:00:00").toLocaleDateString("pt-BR") : "Não informado"}</p></div>
                <div><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Sexo</span><p style={{ fontWeight: 600 }}>{viewingPatient.gender || "Não informado"}</p></div>
                <div><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Telefone</span><p style={{ fontWeight: 600 }}>{viewingPatient.phone || "Não informado"}</p></div>
                <div style={{ gridColumn: "span 2" }}><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>E-mail</span><p style={{ fontWeight: 600 }}>{viewingPatient.email || "Não informado"}</p></div>
                <div style={{ gridColumn: "span 2" }}><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Endereço</span><p style={{ fontWeight: 600 }}>{viewingPatient.address || "Não informado"}</p></div>
              </div>

              {(viewingPatient.healthPlan || viewingPatient.healthPlanNumber) && (
                <div style={{ background: "var(--primary-light)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--primary-mid)" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>Plano de Saúde</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div><span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Convênio</span><p style={{ fontWeight: 700 }}>{viewingPatient.healthPlan || "Particular"}</p></div>
                    <div><span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Carteirinha</span><p style={{ fontWeight: 700 }}>{viewingPatient.healthPlanNumber || "-"}</p></div>
                  </div>
                </div>
              )}

              {(viewingPatient.guardianName || viewingPatient.parentsName || viewingPatient.parentsProfession) && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Responsáveis e Família</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {viewingPatient.guardianName && <div><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Responsável Legal</span><p style={{ fontWeight: 600 }}>{viewingPatient.guardianName}</p></div>}
                    {viewingPatient.parentsName && <div><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Nome dos Pais</span><p style={{ fontWeight: 600 }}>{viewingPatient.parentsName}</p></div>}
                    {viewingPatient.parentsProfession && <div style={{ gridColumn: "span 2" }}><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Profissão dos Pais</span><p style={{ fontWeight: 600 }}>{viewingPatient.parentsProfession}</p></div>}
                  </div>
                </div>
              )}

              {(viewingPatient.schoolName || viewingPatient.schoolGrade || viewingPatient.schoolType) && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Dados Escolares</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {viewingPatient.schoolName && <div style={{ gridColumn: "span 2" }}><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Escola</span><p style={{ fontWeight: 600 }}>{viewingPatient.schoolName}</p></div>}
                    {viewingPatient.schoolGrade && <div><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Série/Ano</span><p style={{ fontWeight: 600 }}>{viewingPatient.schoolGrade}</p></div>}
                    {viewingPatient.schoolType && <div><span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Tipo</span><p style={{ fontWeight: 600 }}>{viewingPatient.schoolType}</p></div>}
                  </div>
                </div>
              )}

              {viewingPatient.notes && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Anotações / Observações</h4>
                  <div style={{ padding: "1rem", backgroundColor: "var(--bg-color)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
                    {viewingPatient.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setViewingPatient(null)} className="btn btn-outline">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
