"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useReservation } from "@/context/ReservationContext";

export default function Navbar() {
  const { professional, logout } = useReservation();
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");

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
    { href: "/minhas-reservas", label: "Minhas Reservas" },
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
          <span className="hide-mobile">Clínica</span>
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
    </nav>
  );
}
