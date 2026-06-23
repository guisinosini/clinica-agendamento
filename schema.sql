-- Criação da tabela de Profissionais
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  specialty TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criação da tabela de Salas
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inserindo as salas padrão
INSERT INTO rooms (id, name, description) VALUES
  ('r1', 'Consultório 1', ''),
  ('r2', 'Consultório 2', ''),
  ('r3', 'Consultório 3', ''),
  ('r4', 'Consultório 4', ''),
  ('r5', 'Sala de Reunião', '');

-- Criação da tabela de Reservas
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Otimização: Índice para buscas rápidas de disponibilidade (evita conflitos de horário)
CREATE INDEX idx_reservations_lookup ON reservations(room_id, date, start_time);

-- RLS (Segurança de Linha)
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (Políticas básicas iniciais)
CREATE POLICY "Leitura pública para salas" ON rooms FOR SELECT USING (true);
CREATE POLICY "Leitura pública para reservas" ON reservations FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de reservas" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir deleção de reservas" ON reservations FOR DELETE USING (true);

-- Políticas para Profissionais (Necessárias para o Cadastro e Login)
CREATE POLICY "Leitura pública para profissionais" ON professionals FOR SELECT USING (true);
CREATE POLICY "Permitir cadastro de profissionais" ON professionals FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de perfil" ON professionals FOR UPDATE USING (true);

-- STORAGE: Criar bucket para avatares
-- Execute no painel do Supabase > Storage > New Bucket:
-- Nome: avatars | Public: true
-- Depois execute:
-- CREATE POLICY "Avatares públicos" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Upload de avatares" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
-- CREATE POLICY "Atualizar avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
