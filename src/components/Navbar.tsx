"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReservation } from "@/context/ReservationContext";

export default function Navbar() {
  const { professional, logout } = useReservation();
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("@Clinica:theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("@Clinica:theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Não mostra a navbar na tela de login (página inicial sem autenticação)
  if (!professional) return null;

  const initials = professional.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const navLinks = [
    { href: "/", label: "Painel" },
    { href: "/reservar", label: "Nova Reserva" },
    { href: "/disponibilidade", label: "Disponibilidade" },
    { href: "/minhas-reservas", label: "Minha Agenda" },
    { href: "/tarefas", label: "Tarefas" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo / Marca */}
        <Link href="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span className="hide-mobile">Clínica de Psicologia</span>
        </Link>

        {/* Links de Navegação */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} className="hide-mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: pathname === link.href ? "var(--primary)" : "var(--text-muted)",
                backgroundColor: pathname === link.href ? "var(--primary-light)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Ações do Usuário */}
        <div className="navbar-actions">
          {/* Botão Hamburger (Mobile) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="btn btn-outline hide-desktop"
            style={{ 
              padding: "0", 
              borderRadius: "var(--radius-sm)", 
              width: "42px", height: "42px", 
              display: "flex", alignItems: "center", justifyContent: "center", 
              fontSize: "1.4rem",
              boxShadow: "var(--clay-btn)"
            }}
            title="Menu"
          >
            {isMobileMenuOpen ? "✖" : "☰"}
          </button>

          {/* Botão Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="btn btn-outline"
            style={{ 
              padding: "0.45rem", 
              borderRadius: "var(--radius-full)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              width: "42px",
              height: "42px",
              fontSize: "1.2rem"
            }}
            title={theme === "light" ? "Mudar para Modo Escuro" : "Mudar para Modo Claro"}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          <Link href="/perfil" title="Editar Perfil">
            <div className="navbar-avatar">
              {professional.avatarUrl ? (
                <img
                  src={professional.avatarUrl}
                  alt={professional.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>
          </Link>
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm hide-mobile"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Menu Mobile Expandido */}
      {isMobileMenuOpen && (
        <div className="hide-desktop animate-slide" style={{
          position: "absolute",
          top: "70px", left: 0, right: 0,
          background: "var(--card-bg)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          padding: "1.5rem 1rem",
          display: "flex", flexDirection: "column", gap: "0.75rem",
          borderBottom: "1px solid var(--primary-light)",
          zIndex: 99
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                fontSize: "1.05rem",
                fontWeight: 600,
                color: pathname === link.href ? "var(--primary)" : "var(--text-secondary)",
                backgroundColor: pathname === link.href ? "var(--primary-light)" : "var(--bg-color)",
                border: pathname === link.href ? "2px solid var(--primary-mid)" : "2px solid transparent",
                display: "flex",
                alignItems: "center",
                boxShadow: pathname === link.href ? "var(--clay-btn)" : "var(--clay-input)"
              }}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => { logout(); setIsMobileMenuOpen(false); }}
            className="btn"
            style={{ marginTop: "1rem", width: "100%", backgroundColor: "var(--danger)", color: "white" }}
          >
            Sair da Conta
          </button>
        </div>
      )}
    </nav>
  );
}
