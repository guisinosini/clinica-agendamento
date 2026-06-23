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

    if (!result.success) {
      setErrorMsg(result.message);
    }
    
    setIsSubmiting(false);
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregando dados da clínica...</p>
      </div>
    );
  }

  // TELA DE LOGIN / CADASTRO (Mostrada se não houver profissional logado)
  if (!professional) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem 2rem', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--primary)', borderRadius: '16px', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {isRegistering ? "Novo Profissional" : "Clínica Agendamentos"}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              {isRegistering 
                ? "Preencha seus dados para começar a gerenciar seus horários." 
                : "Entre com seu e-mail de profissional para gerenciar suas salas."}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {isRegistering && (
              <>
                <div>
                  <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Nome Completo</label>
                  <input 
                    id="name"
                    type="text" 
                    placeholder="Ex: Dr. João Silva" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }}
                    required={isRegistering}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>

                <div>
                  <label htmlFor="specialty" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Especialidade</label>
                  <input 
                    id="specialty"
                    type="text" 
                    placeholder="Ex: Psicólogo, Nutricionista..." 
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }}
                    required={isRegistering}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>E-mail Cadastrado</label>
              <input 
                id="email"
                type="email" 
                placeholder="dr.joao@clinica.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '1rem', transition: 'border-color 0.2s' }}
                required
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', animation: 'fadeIn 0.2s' }}>
                {errorMsg}
              </div>
            )}

            <button 
              type="submit" 
              className="btn" 
              disabled={isSubmiting || !email}
              style={{ padding: '0.85rem', fontWeight: 600, opacity: isSubmiting ? 0.7 : 1, marginTop: '0.5rem' }}
            >
              {isSubmiting ? "Aguarde..." : (isRegistering ? "Criar Conta e Acessar" : "Acessar Plataforma")}
            </button>
          </form>

          {/* Botão para alternar entre Login e Cadastro */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {isRegistering ? "Já tem uma conta?" : "Ainda não tem conta na clínica?"}
            </p>
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg("");
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline'
              }}
            >
              {isRegistering ? "Fazer Login" : "Cadastre-se como Profissional"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TELA PRINCIPAL (DASHBOARD)
  return (
    <div className="container" style={{ paddingBottom: '4rem', animation: 'fadeIn 0.4s ease' }}>
      <header style={{ marginBottom: '3rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Painel do Profissional</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>Bem-vindo(a), <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{professional.name}</span></p>
          <small style={{ color: 'var(--text-muted)', opacity: 0.7 }}>Especialidade: {professional.specialty}</small>
        </div>
        <button onClick={logout} className="btn btn-outline" style={{ padding: '0.5rem 1.5rem' }}>Sair</button>
      </header>

      <main className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s ease', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📅</span>
          </div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Nova Reserva</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', flexGrow: 1 }}>
            Selecione uma das salas disponíveis, escolha o dia e garanta seus horários de atendimento.
          </p>
          <Link href="/reservar" className="btn" style={{ textAlign: 'center' }}>
            Acessar Salas
          </Link>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s ease', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>👀</span>
          </div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Disponibilidade Geral</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', flexGrow: 1 }}>
            Visualize o panorama de toda a clínica para saber exatamente quais horários estão livres e quem está atendendo.
          </p>
          <Link href="/disponibilidade" className="btn btn-outline" style={{ textAlign: 'center' }}>
            Ver Calendário
          </Link>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'transform 0.2s ease', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#ECFDF5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📝</span>
          </div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Minhas Reservas</h2>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)', flexGrow: 1 }}>
            Acompanhe todos os seus agendamentos futuros e gerencie ou cancele suas marcações.
          </p>
          <Link href="/minhas-reservas" className="btn btn-outline" style={{ textAlign: 'center' }}>
            Histórico Pessoal
          </Link>
        </div>
      </main>
    </div>
  );
}
