-- Criação da tabela de Profissionais
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- nova coluna de senha
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
  patient_name TEXT,
  service TEXT,
  status TEXT DEFAULT 'agendado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Otimização: Índice para buscas rápidas de disponibilidade (evita conflitos de horário)
CREATE INDEX idx_reservations_lookup ON reservations(room_id, date, start_time);

-- RLS (Segurança de Linha)
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Políticas para Salas (Admin CRUD e Leitura Pública)
CREATE POLICY "Leitura pública para salas" ON rooms FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de salas" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de salas" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção de salas" ON rooms FOR DELETE USING (true);
CREATE POLICY "Leitura pública para reservas" ON reservations FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de reservas" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de reservas" ON reservations FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção de reservas" ON reservations FOR DELETE USING (true);

-- Políticas para Profissionais (Necessárias para o Cadastro e Login)
CREATE POLICY "Leitura pública para profissionais" ON professionals FOR SELECT USING (true);
CREATE POLICY "Permitir cadastro de profissionais" ON professionals FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de perfil" ON professionals FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção de profissionais" ON professionals FOR DELETE USING (true);

-- STORAGE: Criar bucket para avatares
-- Execute no painel do Supabase > Storage > New Bucket:
-- Nome: avatars | Public: true
-- Depois execute:
-- CREATE POLICY "Avatares públicos" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Upload de avatares" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
-- CREATE POLICY "Atualizar avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

-- Criação da tabela de Pacientes
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  "birthDate" TEXT,
  address TEXT,
  "guardianName" TEXT,
  "healthPlan" TEXT,
  "healthPlanNumber" TEXT,
  gender TEXT,
  cpf TEXT,
  "parentsName" TEXT,
  "parentsProfession" TEXT,
  "schoolName" TEXT,
  "schoolGrade" TEXT,
  "schoolType" TEXT,
  lgpd_consent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'ativo',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS para Pacientes
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para pacientes" ON patients FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de pacientes" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de pacientes" ON patients FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção de pacientes" ON patients FOR DELETE USING (true);

-- Criação da tabela de Serviços
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para serviços" ON services FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de serviços" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de serviços" ON services FOR UPDATE USING (true);
CREATE POLICY "Permitir deleção de serviços" ON services FOR DELETE USING (true);

-- Criação da tabela de Finanças (Fluxo de Caixa)
CREATE TABLE finances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT, -- Ex: Consulta, Aluguel, Materiais, Pagamento, etc.
  type TEXT NOT NULL, -- 'receita' ou 'despesa'
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  is_paid BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública para finances" ON finances FOR SELECT USING (true);
CREATE POLICY "Inserção pública para finances" ON finances FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualização pública para finances" ON finances FOR UPDATE USING (true);
CREATE POLICY "Deleção pública para finances" ON finances FOR DELETE USING (true);
