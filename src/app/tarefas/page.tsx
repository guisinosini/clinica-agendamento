"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReservation } from "../../context/ReservationContext";
import { supabase } from "../../lib/supabase";
import { Task, TaskAssignment, Professional } from "../../types";

type CombinedTask = {
  id: string; // assignment_id ou task_id
  taskId: string;
  title: string;
  description?: string;
  dueDate?: string;
  createdBy: string;
  assignedTo: string;
  assignedToName?: string;
  createdByName?: string;
  status: 'pendente' | 'concluida';
  viewed: boolean;
  type: 'minhas' | 'recebidas' | 'atribuidas';
  assignmentId?: string;
  priority?: 'baixa' | 'media' | 'alta';
  comment?: string;
};

export default function TarefasPage() {
  const { professional, allProfessionals, loading } = useReservation();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'minhas' | 'recebidas' | 'atribuidas'>('minhas');
  const [tasks, setTasks] = useState<CombinedTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'media' });
  const [selectedProfs, setSelectedProfs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignedBy, setFilterAssignedBy] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!loading && !professional) {
      router.push("/");
    }
  }, [loading, professional, router]);

  useEffect(() => {
    if (professional) {
      fetchTasks();
    }
  }, [professional]);

  const fetchTasks = async () => {
    if (!professional) return;
    setLoadingTasks(true);
    try {
      // Buscar atribuições a mim
      const { data: myAssignmentsData, error: err1 } = await supabase
        .from('task_assignments')
        .select(`*, task:tasks(*)`)
        .eq('professional_id', professional.id);

      // Buscar tarefas criadas por mim
      const { data: myCreatedTasksData, error: err2 } = await supabase
        .from('tasks')
        .select(`*, assignments:task_assignments(*, professional:professionals(*))`)
        .eq('created_by', professional.id);

      if (err1 || err2) {
        console.error("Error fetching tasks", err1, err2);
      }

      let allTasks: CombinedTask[] = [];

      // Processar atribuições
      if (myAssignmentsData) {
        myAssignmentsData.forEach((assignment: any) => {
          const task = assignment.task;
          if (!task) return;
          const isMine = task.created_by === professional.id;
          
          allTasks.push({
            id: assignment.id,
            taskId: task.id,
            assignmentId: assignment.id,
            title: task.title,
            description: task.description,
            dueDate: task.due_date,
            createdBy: task.created_by,
            assignedTo: assignment.professional_id,
            status: assignment.status,
            viewed: assignment.viewed,
            type: isMine ? 'minhas' : 'recebidas',
            createdByName: allProfessionals.find(p => p.id === task.created_by)?.name || 'Desconhecido',
            priority: task.priority || 'media',
            comment: assignment.comment || '',
          });
        });
      }

      // Processar tarefas atribuídas a outros por mim
      if (myCreatedTasksData) {
        myCreatedTasksData.forEach((task: any) => {
          if (task.assignments) {
            task.assignments.forEach((assignment: any) => {
              if (assignment.professional_id !== professional.id) {
                allTasks.push({
                  id: assignment.id, // unique per assignment
                  taskId: task.id,
                  assignmentId: assignment.id,
                  title: task.title,
                  description: task.description,
                  dueDate: task.due_date,
                  createdBy: task.created_by,
                  assignedTo: assignment.professional_id,
                  assignedToName: assignment.professional_id ? (assignment.professional?.name || 'Desconhecido') : 'Administração',
                  status: assignment.status,
                  viewed: assignment.viewed,
                  type: 'atribuidas',
                  createdByName: professional.name,
                  priority: task.priority || 'media',
                  comment: assignment.comment || '',
                });
              }
            });
          }
        });
      }

      // Marcar "recebidas" como lidas automaticamente se não estiverem lidas
      const unreadAssignments = allTasks.filter(t => t.type === 'recebidas' && !t.viewed).map(t => t.assignmentId);
      if (unreadAssignments.length > 0) {
        await supabase.from('task_assignments').update({ viewed: true }).in('id', unreadAssignments as string[]);
        // Atualizar estado local
        allTasks = allTasks.map(t => unreadAssignments.includes(t.assignmentId) ? { ...t, viewed: true } : t);
      }

      // Ordenar por data
      allTasks.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'pendente' ? -1 : 1; // pendentes primeiro
        return new Date(a.dueDate || '2099').getTime() - new Date(b.dueDate || '2099').getTime();
      });

      setTasks(allTasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !professional) {
      alert("Preencha o título da tarefa.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingTaskId) {
        const { error: updateErr } = await supabase
          .from('tasks')
          .update({
            title: newTask.title,
            description: newTask.description,
            due_date: newTask.dueDate || null,
            priority: newTask.priority
          })
          .eq('id', editingTaskId);
          
        if (updateErr) throw updateErr;
      } else {
        if (selectedProfs.length === 0) {
          alert("Selecione pelo menos um destinatário.");
          setSubmitting(false);
          return;
        }
      // 1. Inserir Tarefa
      const { data: taskData, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.dueDate || null,
          priority: newTask.priority,
          created_by: professional.id
        })
        .select()
        .single();

      if (taskErr || !taskData) throw taskErr;

      // 2. Inserir Assignments
      const assignments = selectedProfs.map(profId => ({
        task_id: taskData.id,
        professional_id: profId === 'admin' ? null : profId,
        status: 'pendente',
        viewed: profId === professional.id 
      }));

      const { error: assignErr } = await supabase.from('task_assignments').insert(assignments);
      if (assignErr) throw assignErr;

      // 3. Disparar E-mails (Fire-and-Forget, sem bloquear a UI)
      const emailsToSend = selectedProfs
        .filter(id => id !== 'admin' && id !== professional.id)
        .map(id => allProfessionals.find(p => p.id === id)?.email)
        .filter(Boolean); // Remover nulos

      if (emailsToSend.length > 0) {
        const taskLink = window.location.origin + '/tarefas';
        emailsToSend.forEach(email => {
          fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: `Nova Tarefa: ${newTask.title}`,
              taskTitle: newTask.title,
              taskDescription: newTask.description,
              assignedBy: professional.name,
              taskLink: taskLink,
            })
          }).catch(err => console.error('Falha ao disparar email:', err));
        });
      }

      // Sucesso
      setShowModal(false);
      setEditingTaskId(null);
      setNewTask({ title: '', description: '', dueDate: '', priority: 'media' });
      setSelectedProfs([]);
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar tarefa. Verifique se as tabelas no Supabase foram criadas.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (task: CombinedTask) => {
    setNewTask({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: task.priority || 'media'
    });
    setEditingTaskId(task.taskId);
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Tem certeza que deseja excluir esta tarefa? Isso a removerá para todos os envolvidos.")) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
        alert("Tarefa excluída com sucesso!");
        fetchTasks();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir tarefa.");
      }
    }
  };

  const toggleTaskStatus = async (task: CombinedTask) => {
    if (!task.assignmentId) return;
    const newStatus = task.status === 'pendente' ? 'concluida' : 'pendente';
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'concluida' ? new Date().toISOString() : null
        })
        .eq('id', task.assignmentId);

      if (error) throw error;
    } catch (err) {
      console.error(err);
      // Revert in case of error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleCommentChange = async (assignmentId: string, comment: string) => {
    setTasks(prev => prev.map(t => t.id === assignmentId ? { ...t, comment } : t));
    try {
      await supabase.from('task_assignments').update({ comment }).eq('id', assignmentId);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter(t => t.type === activeTab).filter(t => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterAssignedBy && t.createdBy !== filterAssignedBy) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  if (loading || loadingTasks) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "var(--text-muted)" }}>Carregando tarefas...</p>
    </div>
  );

  return (
    <div className="container animate-fade" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Tarefas</h1>
        </div>
        <button onClick={() => {
          setEditingTaskId(null);
          setNewTask({ title: '', description: '', dueDate: '', priority: 'media' });
          setSelectedProfs([]);
          setShowModal(true);
        }} className="btn">
          ➕ Nova Tarefa
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {['minhas', 'recebidas', 'atribuidas'].map((tab) => {
          const count = tasks.filter(t => t.type === tab && t.status === 'pendente').length;
          const hasUnread = tasks.some(t => t.type === tab && !t.viewed && t.status === 'pendente');
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`btn ${activeTab === tab ? '' : 'btn-outline'}`}
              style={{ position: 'relative', flexShrink: 0 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {count > 0 && (
                <span style={{ 
                  marginLeft: '8px', 
                  backgroundColor: activeTab === tab ? 'white' : 'var(--primary)', 
                  color: activeTab === tab ? 'var(--primary)' : 'white', 
                  borderRadius: '12px', 
                  padding: '2px 8px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold' 
                }}>
                  {count}
                </span>
              )}
              {hasUnread && tab === 'recebidas' && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--danger)',
                  borderRadius: '50%',
                  border: '2px solid white'
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem", backgroundColor: "var(--bg-color)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
        <div>
          <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Prioridade</label>
          <select className="input" style={{ padding: "0.4rem" }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
        {activeTab === 'recebidas' && (
          <div>
            <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Atribuído por</label>
            <select className="input" style={{ padding: "0.4rem" }} value={filterAssignedBy} onChange={e => setFilterAssignedBy(e.target.value)}>
              <option value="">Todos</option>
              {Array.from(new Set(tasks.filter(t => t.type === 'recebidas').map(t => t.createdBy))).map(id => (
                <option key={id as string} value={id as string}>{id === null ? "Admin" : (allProfessionals.find(p => p.id === id)?.name || "Desconhecido")}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label" style={{ fontSize: "0.85rem", marginBottom: "0.2rem" }}>Status</label>
          <select className="input" style={{ padding: "0.4rem" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="grid" style={{ gridTemplateColumns: "1fr", gap: "1rem" }}>
        {filteredTasks.length === 0 ? (
          <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍃</div>
            <p>Nenhuma tarefa encontrada nesta categoria.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="card animate-slide" style={{ 
              padding: "1.5rem", 
              display: "flex", 
              gap: "1rem", 
              alignItems: "flex-start",
              opacity: task.status === 'concluida' ? 0.6 : 1,
              borderLeft: task.status === 'concluida' ? '4px solid var(--success)' : '4px solid var(--primary)'
            }}>
              {/* Checkbox (só para quem deve fazer a tarefa) */}
              {task.type !== 'atribuidas' && (
                <div style={{ paddingTop: '0.2rem' }}>
                  <input 
                    type="checkbox" 
                    checked={task.status === 'concluida'}
                    onChange={() => toggleTaskStatus(task)}
                    style={{
                      width: "1.25rem", height: "1.25rem",
                      cursor: "pointer",
                      accentColor: "var(--primary)"
                    }}
                  />
                </div>
              )}
              
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  <h3 style={{ 
                    fontSize: "1.1rem", 
                    fontWeight: 700, 
                    margin: 0,
                    textDecoration: task.status === 'concluida' ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {task.priority === 'alta' && <span className="badge" style={{ backgroundColor: "#fee2e2", color: "#991b1b", fontSize: "0.7rem" }}>Alta</span>}
                    {task.priority === 'media' && <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: "0.7rem" }}>Média</span>}
                    {task.priority === 'baixa' && <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: "0.7rem" }}>Baixa</span>}
                    {task.dueDate && (
                      <span className="badge" style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)", fontSize: "0.75rem" }}>
                        📅 Prazo: {new Date(task.dueDate + "T00:00:00").toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                
                {task.description && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1rem", whiteSpace: "pre-wrap" }}>
                    {task.description}
                  </p>
                )}
                
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                  {task.type === 'recebidas' && (
                    <span><strong>De:</strong> {task.createdByName}</span>
                  )}
                  {task.type === 'atribuidas' && (
                    <span>
                      <strong>Para:</strong> {task.assignedToName} 
                      <span style={{ marginLeft: "8px", color: task.status === 'concluida' ? 'var(--success)' : 'var(--warning)' }}>
                        ({task.status === 'concluida' ? 'Concluída' : 'Pendente'})
                      </span>
                    </span>
                  )}
                  
                  {/* Edit and Delete Actions */}
                  {task.createdBy === professional?.id && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => openEditModal(task)} 
                        style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.taskId)} 
                        style={{ background: "none", border: "none", color: "var(--danger)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <textarea 
                    placeholder="Adicionar um comentário ou observação..."
                    style={{ 
                      width: "100%", padding: "0.75rem", borderRadius: "var(--radius-sm)", 
                      border: "1px solid var(--border-color)", backgroundColor: "var(--bg-color)",
                      fontSize: "0.85rem", resize: "vertical", minHeight: "60px",
                      fontFamily: "inherit"
                    }}
                    value={task.comment || ""}
                    onChange={(e) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, comment: e.target.value } : t))}
                    onBlur={(e) => handleCommentChange(task.id, e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nova Tarefa */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex",
          zIndex: 999, padding: "1rem", overflowY: "auto"
        }}>
          <div className="card animate-slide" style={{ margin: "auto", width: "100%", maxWidth: "500px", padding: "1.25rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.25rem" }}>
              {editingTaskId ? "Editar Tarefa" : "Criar Nova Tarefa"}
            </h2>
            <form onSubmit={handleSaveTask} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              <div>
                <label className="label">Título da Tarefa</label>
                <input 
                  type="text" 
                  className="input" 
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  required
                  placeholder="Ex: Atualizar prontuários"
                />
              </div>

              <div>
                <label className="label">Comentário / Descrição</label>
                <textarea 
                  className="input" 
                  value={newTask.description} 
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  rows={3}
                  placeholder="Detalhes adicionais da tarefa..."
                />
              </div>

              <div>
                <label className="label">Prazo (Opcional)</label>
                <input 
                  type="date" 
                  className="input" 
                  value={newTask.dueDate} 
                  onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Prioridade</label>
                <select 
                  className="input" 
                  value={newTask.priority} 
                  onChange={e => setNewTask({...newTask, priority: e.target.value})}
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
                      checked={selectedProfs.includes('admin')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedProfs([...selectedProfs, 'admin']);
                        else setSelectedProfs(selectedProfs.filter(id => id !== 'admin'));
                      }}
                    />
                    ⚙️ Administração
                  </label>
                  {allProfessionals.map(prof => (
                    <label key={prof.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                      <input 
                        type="checkbox"
                        checked={selectedProfs.includes(prof.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProfs([...selectedProfs, prof.id]);
                          else setSelectedProfs(selectedProfs.filter(id => id !== prof.id));
                        }}
                      />
                      {prof.name} {prof.id === professional?.id && "(Eu)"}
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                   <button type="button" onClick={() => setSelectedProfs([professional!.id])} className="badge" style={{ cursor: "pointer" }}>Somente Eu</button>
                   <button type="button" onClick={() => setSelectedProfs(allProfessionals.map(p => p.id))} className="badge badge-primary" style={{ cursor: "pointer" }}>Todos</button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn" style={{ flex: 1 }}>
                  {submitting ? "Salvando..." : "Criar Tarefa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
