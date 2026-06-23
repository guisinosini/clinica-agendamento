"use client";

import { useState } from "react";
import Link from "next/link";
import { useReservation } from "../context/ReservationContext";

export default function Home() {
  const { professional, loading, login, register, logout } = useReservation();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmiting, setIsSubmiting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmiting(true);
    setErrorMsg("");

    let result;
    if (isRegistering) {
      if (!name || !specialty) {
        setErrorMsg("Preencha todos os campos para se cadastrar.");
        setIsSubmiting(false);
        return;
      }
      result = await register(name, email, specialty);
    } else {
      result = await login(email);
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
        background: "var(--bg-color)",
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
              {isRegistering ? "Criar Conta" : "Clínica"}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.4rem" }}>
              {isRegistering
                ? "Preencha seus dados para começar."
                : "Bem-vindo(a) de volta! Entre para continuar."}
            </p>
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
                onClick={() => { setIsRegistering(!isRegistering); setErrorMsg(""); }}
                style={{ color: "var(--primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              >
                {isRegistering ? "Fazer Login" : "Cadastre-se"}
              </button>
            </p>
            
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
    },
    {
      href: "/disponibilidade",
      emoji: "👀",
      title: "Disponibilidade",
      desc: "Veja o panorama de toda a clínica e saiba quais horários estão livres.",
      btnLabel: "Ver Calendário",
      btnClass: "btn btn-outline",
    },
    {
      href: "/minhas-reservas",
      emoji: "📝",
      title: "Minhas Reservas",
      desc: "Acompanhe e gerencie todos os seus agendamentos futuros.",
      btnLabel: "Ver Histórico",
      btnClass: "btn btn-outline",
    },
  ];

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
          <Link href="/perfil" className="btn btn-outline btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="hide-mobile">Editar Perfil</span>
          </Link>
          <button onClick={logout} className="btn btn-ghost btn-sm">
            Sair
          </button>
        </div>
      </header>

      {/* Cards do Dashboard */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {dashboardCards.map((card) => (
          <div
            key={card.href}
            className="card card-hover"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div style={{
              width: "56px", height: "56px",
              backgroundColor: "var(--bg-color)",
              borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.6rem",
              marginBottom: "1.25rem",
              boxShadow: "var(--clay-input)",
            }}>
              {card.emoji}
            </div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.65rem" }}>{card.title}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.6", flexGrow: 1, marginBottom: "1.5rem" }}>
              {card.desc}
            </p>
            <Link href={card.href} className={card.btnClass} style={{ textAlign: "center" }}>
              {card.btnLabel}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
