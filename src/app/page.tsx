"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useReservation } from "../context/ReservationContext";

export default function Home() {
  const { professional, loading, login, register, logout, reservations, rooms, allProfessionals } = useReservation();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); // Previne o prompt automático nativo
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmiting(true);
    setErrorMsg("");

    let result;
    if (isRegistering) {
      if (!name || !specialty || !password) {
        setErrorMsg("Preencha todos os campos para se cadastrar.");
        setIsSubmiting(false);
        return;
      }
      result = await register(name, email, specialty, password);
    } else {
      if (!password) {
        setErrorMsg("A senha é obrigatória.");
        setIsSubmiting(false);
        return;
      }
      result = await login(email, password);
    }

    if (!result.success) setErrorMsg(result.message);
    setIsSubmiting(false);
  };

  // ─── LOADING ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Carregando dados da clínica...</p>
      </div>
    );
  }

  // ─── TELA DE LOGIN / CADASTRO ────────────────────────────────
  if (!professional) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "transparent",
      }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>
          {/* Logo / Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }} className="animate-slide">
            <div style={{
              width: "72px", height: "72px",
              background: "var(--primary)",
              color: "var(--primary-mid)",
              borderRadius: "20px",
              margin: "0 auto 1.25rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--clay-btn)",
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
              {isRegistering ? "Criar Conta" : "Clínica de Psicologia"}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.4rem" }}>
              {isRegistering
                ? "Preencha seus dados para começar."
                : "Gestão de salas de atendimento."}
            </p>

            {!isRegistering && (
              <div className="animate-fade" style={{ 
                marginTop: "1.5rem", 
                display: "inline-flex", 
                gap: "1.25rem", 
                justifyContent: "center",
                flexWrap: "wrap",
                background: "var(--card-bg)",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-color)",
                boxShadow: "var(--shadow-sm)",
                animationDelay: "0.2s"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <span style={{ fontSize: "1.1rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>🏢</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{rooms.length}</span>
                  <span>Salas</span>
                </div>
                <div style={{ width: "1px", background: "var(--border-color)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <span style={{ fontSize: "1.1rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>👩‍⚕️</span>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{allProfessionals?.length || 0}</span>
                  <span>Profissionais</span>
                </div>
                <div style={{ width: "1px", background: "var(--border-color)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  <span style={{ fontSize: "1.1rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>📅</span>
                  <span style={{ fontWeight: 700, color: "var(--primary)" }}>{reservations.length}</span>
                  <span>Reservas</span>
                </div>
              </div>
            )}
          </div>

          {/* Card do Formulário */}
          <div className="card animate-slide" style={{ padding: "2.5rem 2rem" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {isRegistering && (
                <>
                  <div>
                    <label htmlFor="name" className="label">Nome Completo</label>
                    <input id="name" type="text" placeholder="Dr. João Silva" value={name}
                      onChange={(e) => setName(e.target.value)} className="input" required={isRegistering} />
                  </div>
                  <div>
                    <label htmlFor="specialty" className="label">Especialidade</label>
                    <input id="specialty" type="text" placeholder="Ex: Psicólogo, Nutricionista..." value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)} className="input" required={isRegistering} />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="label">E-mail Profissional</label>
                <input id="email" type="email" placeholder="dr.joao@clinica.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="input" required />
              </div>

              <div>
                <label htmlFor="password" className="label">Senha</label>
                <input id="password" type="password" placeholder="Sua senha" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="input" required />
              </div>

              {errorMsg && (
                <div className="animate-fade" style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--danger-light)",
                  color: "var(--danger)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.875rem",
                  border: "1px solid #FECACA",
                  fontWeight: 500,
                }}>
                  {errorMsg}
                </div>
              )}

              <button type="submit" className="btn btn-lg" disabled={isSubmiting || !email}
                style={{ marginTop: "0.5rem" }}>
                {isSubmiting ? "Aguarde..." : (isRegistering ? "Criar Conta e Acessar" : "Entrar")}
              </button>
            </form>

            <div className="divider" />

            <p style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {isRegistering ? "Já tem uma conta?" : "Ainda não tem conta?"}
              {" "}
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(""); setPassword(""); }}
                style={{ color: "var(--primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              >
                {isRegistering ? "Fazer Login" : "Cadastre-se"}
              </button>
            </p>

            {deferredPrompt && (
              <button 
                type="button" 
                onClick={handleInstallClick} 
                className="btn btn-outline" 
                style={{ marginTop: "1rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--primary)", borderColor: "var(--primary-light)", backgroundColor: "var(--primary-light)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span style={{ fontWeight: 700 }}>Instalar App no Celular</span>
              </button>
            )}
            
            {/* Acesso Admin Oculto/Discreto */}
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button
                onClick={() => {
                  const pin = window.prompt("Digite o PIN Administrativo:");
                  if (pin === "1234") { // PIN simples de exemplo
                    sessionStorage.setItem("@Clinica:adminPin", pin);
                    window.location.href = "/admin";
                  } else if (pin) {
                    alert("PIN Incorreto!");
                  }
                }}
                style={{ fontSize: "0.8rem", color: "var(--text-light)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Acesso Administrativo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ───────────────────────────────────────────────
  const initials = professional.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  const dashboardCards = [
    {
      href: "/reservar",
      emoji: "📅",
      title: "Nova Reserva",
      desc: "Selecione uma sala, escolha o dia e garanta seus horários de atendimento.",
      btnLabel: "Acessar Salas",
      btnClass: "btn",
      bgColor: "#eff6ff",
    },
    {
      href: "/disponibilidade",
      emoji: "👀",
      title: "Disponibilidade",
      desc: "Veja o panorama de toda a clínica e saiba quais horários estão livres.",
      btnLabel: "Ver Calendário",
      btnClass: "btn btn-outline",
      bgColor: "#f0fdf4",
    },
    {
      href: "/minhas-reservas",
      emoji: "📝",
      title: "Minhas Reservas",
      desc: "Acompanhe e gerencie todos os seus agendamentos futuros.",
      btnLabel: "Ver Histórico",
      btnClass: "btn btn-outline",
      bgColor: "#fffbeb",
    },
    {
      href: "/meus-pacientes",
      emoji: "👥",
      title: "Meus Pacientes",
      desc: "Visualize sua lista de pacientes e acompanhe os processos.",
      btnLabel: "Ver Pacientes",
      btnClass: "btn btn-outline",
      bgColor: "#fdf4ff",
    },
  ];

  // Listagem de próximos agendamentos
  const todayDate = new Date().toISOString().split("T")[0];
  const upcomingReservations = reservations
    .filter(res => res.professionalId === professional.id && res.date >= todayDate)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, 5); // Mostrar apenas os próximos 5

  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name ?? "Sala Desconhecida";

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const getGoogleCalendarUrl = (res: any) => {
    const dateStr = res.date.replace(/-/g, ""); // YYYYMMDD
    const startStr = res.startTime.replace(":", "") + "00";
    const endStr = res.endTime.replace(":", "") + "00";
    
    const title = `Consulta: ${res.patientName || "Paciente"}`;
    const details = `Serviço: ${res.service || "Não informado"}\nSala: ${getRoomName(res.roomId)}`;
    const location = "Clínica";

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateStr}T${startStr}/${dateStr}T${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  };

  // Estatísticas do Mês
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const thisMonthReservations = reservations.filter(res => 
    res.professionalId === professional.id && res.date.startsWith(currentMonth)
  );
  
  const totalHoursThisMonth = thisMonthReservations.length; 
  const uniquePatients = new Set(thisMonthReservations.map(r => r.patientName).filter(Boolean)).size;
  const mostUsedRoomId = thisMonthReservations.reduce((acc, curr) => {
    acc[curr.roomId] = (acc[curr.roomId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  let topRoomName = "-";
  if (Object.keys(mostUsedRoomId).length > 0) {
    const topRoom = Object.entries(mostUsedRoomId).sort((a, b) => b[1] - a[1])[0];
    topRoomName = getRoomName(topRoom[0]);
  }

  return (
    <div className="container animate-fade" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* Header do Dashboard */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2.5rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Avatar */}
          <div className="avatar" style={{ width: "56px", height: "56px", fontSize: "1.2rem", flexShrink: 0 }}>
            {professional.avatarUrl ? (
              <img src={professional.avatarUrl} alt={professional.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : initials}
          </div>
          <div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.15rem" }}>Bem-vindo(a) de volta,</p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>{professional.name}</h1>
            {professional.specialty && (
              <span className="badge badge-primary" style={{ marginTop: "0.3rem" }}>{professional.specialty}</span>
            )}
          </div>
        </div>

        {/* Ações do Cabeçalho */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={() => setShowInstallModal(true)} className="btn btn-outline btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="hide-mobile">Instalar App</span>
          </button>
          
          <Link href="/perfil" className="btn btn-outline btn-sm" style={{ padding: "0.5rem" }} title="Editar Perfil">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
          <button onClick={logout} className="btn btn-ghost btn-sm">
            Sair
          </button>
        </div>
      </header>

      {/* Cards do Dashboard */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {dashboardCards.map((card) => (
          <div
            key={card.href}
            className="card card-hover"
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              padding: "1.25rem",
              backgroundColor: card.bgColor,
              border: "1px solid rgba(0,0,0,0.03)"
            }}
          >
            <div style={{
              width: "42px", height: "42px",
              backgroundColor: "var(--bg-color)",
              borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.2rem",
              marginBottom: "0.75rem",
              boxShadow: "var(--clay-input)",
            }}>
              {card.emoji}
            </div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.5rem" }}>{card.title}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: "1.4", flexGrow: 1, marginBottom: "1rem" }}>
              {card.desc}
            </p>
            <Link href={card.href} className={card.btnClass} style={{ textAlign: "center", fontSize: "0.85rem", padding: "0.5rem" }}>
              {card.btnLabel}
            </Link>
          </div>
        ))}
      </div>

      {/* Estatísticas do Mês */}
      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-main)" }}>
          Suas Estatísticas (Neste Mês)
        </h2>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {/* Cartão 1: Horas */}
          <div className="card animate-fade" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
              ⏳
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>Horas Agendadas</p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)" }}>{totalHoursThisMonth}h</h3>
            </div>
          </div>
          
          {/* Cartão 2: Pacientes */}
          <div className="card animate-fade" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem", animationDelay: "0.1s" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
              👥
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>Pacientes Únicos</p>
              <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)" }}>{uniquePatients}</h3>
            </div>
          </div>

          {/* Cartão 3: Sala */}
          <div className="card animate-fade" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem", animationDelay: "0.2s" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
              🏢
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>Sala Favorita</p>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={topRoomName}>{topRoomName}</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Próximos Agendamentos */}
      <section style={{ marginTop: "3rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-main)" }}>
          Seus Próximos Agendamentos
        </h2>
        {upcomingReservations.length === 0 ? (
          <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>Você não tem agendamentos futuros.</p>
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: "1fr", gap: "1rem" }}>
            {upcomingReservations.map(res => (
              <div key={res.id} className="card" style={{ 
                padding: "1.25rem", display: "flex", gap: "1.5rem", alignItems: "center", 
                flexDirection: "row", flexWrap: "wrap" 
              }}>
                {/* Data e Hora */}
                <div style={{
                  backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)",
                  padding: "0.75rem 1rem", borderRadius: "var(--radius-md)",
                  textAlign: "center", minWidth: "90px", display: "flex", flexDirection: "column", gap: "0.2rem",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)", lineHeight: "1" }}>
                    {formatDate(res.date).split(' ')[0]}
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    {formatDate(res.date).split(' ')[1]}
                  </div>
                  <div style={{ width: "100%", height: "1px", background: "var(--border-color)", margin: "0.2rem 0" }} />
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>
                    {res.startTime}
                  </div>
                </div>

                {/* Info Central */}
                <div style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <h3 style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--text-main)", margin: 0 }}>
                      {res.patientName || "Paciente não informado"}
                    </h3>
                    {res.status === 'confirmado' && (
                      <span className="badge" style={{ backgroundColor: "#dcfce7", color: "var(--success, #166534)", fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}>✓ Confirmado</span>
                    )}
                    {(!res.status || res.status === 'agendado') && (
                      <span className="badge" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-muted)", border: "1px solid var(--border-color)", fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}>⏳ Pendente</span>
                    )}
                    {res.status === 'falta' && (
                      <span className="badge" style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}>Falta</span>
                    )}
                    {res.status === 'reagendado' && (
                      <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}>Reagendado</span>
                    )}
                  </div>
                  
                  <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ opacity: 0.7 }}>🏢</span> <span style={{ fontWeight: 500 }}>{getRoomName(res.roomId)}</span>
                    </span>
                    {res.service && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ opacity: 0.7 }}>🩺</span> <span style={{ fontWeight: 500 }}>{res.service}</span>
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Ações */}
                <div style={{ display: "flex", alignItems: "center", paddingLeft: "1rem", borderLeft: "1px solid var(--border-color)" }}>
                  <a
                    href={getGoogleCalendarUrl(res)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "var(--radius-sm)",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      fontSize: "0.85rem", fontWeight: 600
                    }}
                    title="Adicionar ao Google Calendar"
                  >
                    <span>📅</span> <span className="hide-mobile">Agendar Alerta</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
        {upcomingReservations.length > 0 && (
          <div style={{ marginTop: "1rem", textAlign: "right" }}>
            <Link href="/minhas-reservas" style={{ fontSize: "0.9rem", color: "var(--primary)", fontWeight: 600, textDecoration: "underline" }}>
              Ver todos os agendamentos
            </Link>
          </div>
        )}
      </section>

      {/* Modal de Instalação (PWA / Add to Home Screen) */}
      {showInstallModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999, padding: "1rem"
        }}>
          <div className="card animate-slide" style={{ maxWidth: "400px", width: "100%", position: "relative" }}>
            <button 
              onClick={() => setShowInstallModal(false)}
              style={{ position: "absolute", top: "1rem", right: "1rem", color: "var(--text-muted)", fontSize: "1.5rem" }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1rem" }}>📱 Instalar Aplicativo</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              Adicione a Clínica de Psicologia à sua tela inicial para acessar rapidamente, como um aplicativo nativo!
            </p>
            
            <div style={{ background: "var(--primary-light)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem", fontSize: "0.95rem" }}>🍎 iPhone (Safari)</h3>
              <ol style={{ fontSize: "0.85rem", color: "var(--primary-hover)", paddingLeft: "1.2rem", lineHeight: "1.6" }}>
                <li>Toque no ícone de <b>Compartilhar</b> <svg style={{display:"inline", verticalAlign:"middle"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> na barra inferior.</li>
                <li>Role para baixo e toque em <b>Adicionar à Tela de Início</b> <svg style={{display:"inline", verticalAlign:"middle"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>.</li>
                <li>Confirme em <b>Adicionar</b>.</li>
              </ol>
            </div>

            <div style={{ background: "var(--bg-color)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <h3 style={{ fontWeight: 700, color: "var(--text-main)", marginBottom: "0.5rem", fontSize: "0.95rem" }}>🤖 Android (Chrome)</h3>
              <ol style={{ fontSize: "0.85rem", color: "var(--text-secondary)", paddingLeft: "1.2rem", lineHeight: "1.6" }}>
                <li>Toque nos <b>Três pontinhos</b> <svg style={{display:"inline", verticalAlign:"middle"}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg> no canto superior direito.</li>
                <li>Selecione <b>Adicionar à tela inicial</b> ou <b>Instalar aplicativo</b>.</li>
                <li>Confirme em <b>Adicionar</b>.</li>
              </ol>
            </div>
            
            <button onClick={() => setShowInstallModal(false)} className="btn" style={{ width: "100%", marginTop: "1.5rem" }}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
