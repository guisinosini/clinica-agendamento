"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useReservation } from "../../context/ReservationContext";
import { supabase } from "../../lib/supabase";

export default function PerfilPage() {
  const router = useRouter();
  const { professional, loading, updateProfile } = useReservation();

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !professional) {
      router.push("/");
    }
    if (professional) {
      setName(professional.name);
      setSpecialty(professional.specialty || "");
      setAvatarPreview(professional.avatarUrl || null);
    }
  }, [loading, professional, router]);

  if (loading || !professional) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)" }}>Carregando perfil...</p>
      </div>
    );
  }

  const initials = professional.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ type: "error", message: "A foto deve ter no máximo 2MB." });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setFeedback(null);

    let newAvatarUrl: string | undefined = undefined;

    // Faz o upload da foto se uma nova foi selecionada
    if (avatarFile) {
      setUploadingAvatar(true);
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${professional.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) {
        setFeedback({ type: "error", message: "Erro ao enviar a foto. Verifique se o bucket 'avatars' existe no Supabase." });
        setSaving(false);
        setUploadingAvatar(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      newAvatarUrl = urlData.publicUrl;
      setUploadingAvatar(false);
    }

    const result = await updateProfile(professional.id, name.trim(), specialty.trim(), newAvatarUrl);
    setFeedback({ type: result.success ? "success" : "error", message: result.message });
    setSaving(false);

    if (result.success) {
      setTimeout(() => router.push("/"), 1500);
    }
  };

  return (
    <div className="container animate-fade" style={{ maxWidth: "600px", paddingTop: "2rem", paddingBottom: "4rem" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/" className="btn btn-ghost btn-sm" style={{ padding: "0.5rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Editar Perfil</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Atualize suas informações pessoais</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Card da Foto de Perfil */}
        <div className="card" style={{ marginBottom: "1.5rem", textAlign: "center", padding: "2.5rem" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* Avatar */}
            <div
              className="avatar"
              style={{ width: "100px", height: "100px", fontSize: "2rem", margin: "0 auto 1rem" }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </div>

            {/* Botão de edição sobre o avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: "absolute",
                bottom: "12px",
                right: "-8px",
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid white",
                boxShadow: "var(--shadow-md)",
                cursor: "pointer",
              }}
              title="Alterar foto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />

          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Clique no ícone para alterar a foto
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--text-light)", marginTop: "0.25rem" }}>
            PNG, JPEG ou WebP • Máx. 2MB
          </p>
        </div>

        {/* Card dos Dados */}
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Email (somente leitura) */}
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                value={professional.email}
                disabled
                className="input"
                style={{ opacity: 0.6, cursor: "not-allowed", backgroundColor: "var(--border-color)" }}
              />
              <p style={{ fontSize: "0.78rem", color: "var(--text-light)", marginTop: "0.3rem" }}>
                O e-mail não pode ser alterado.
              </p>
            </div>

            {/* Nome */}
            <div>
              <label htmlFor="name" className="label">Nome Completo</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Seu nome completo"
                required
              />
            </div>

            {/* Especialidade */}
            <div>
              <label htmlFor="specialty" className="label">Especialidade</label>
              <input
                id="specialty"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="input"
                placeholder="Ex: Psicólogo, Nutricionista..."
              />
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className="animate-fade"
            style={{
              padding: "0.85rem 1.25rem",
              borderRadius: "var(--radius-sm)",
              backgroundColor: feedback.type === "success" ? "var(--success-light)" : "var(--danger-light)",
              color: feedback.type === "success" ? "var(--success)" : "var(--danger)",
              border: `1px solid ${feedback.type === "success" ? "#A7F3D0" : "#FECACA"}`,
              marginBottom: "1.25rem",
              fontWeight: 500,
              fontSize: "0.9rem",
            }}
          >
            {feedback.message}
          </div>
        )}

        {/* Botão Salvar */}
        <button
          type="submit"
          className="btn btn-lg"
          disabled={saving || !name.trim()}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {uploadingAvatar ? "Enviando foto..." : saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
    </div>
  );
}
