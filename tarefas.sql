-- 1. Tabela de Tarefas
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  due_date date,
  created_by uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Atribuições de Tarefas (Assignments)
CREATE TABLE public.task_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  viewed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
