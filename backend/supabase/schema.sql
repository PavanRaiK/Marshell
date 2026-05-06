-- ForgeTrack Database Schema
-- Run this in your Supabase SQL editor.

-- 1. Enable pgcrypto for UUIDs (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CREATE TABLES

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    usn TEXT UNIQUE NOT NULL,
    admission_number TEXT,
    email TEXT,
    branch_code TEXT NOT NULL,
    batch TEXT DEFAULT '2024-2028',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    topic TEXT NOT NULL,
    month_number INTEGER NOT NULL,
    duration_hours DECIMAL(3,1) DEFAULT 2.0,
    session_type TEXT DEFAULT 'offline',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ImportLog Table
CREATE TABLE IF NOT EXISTS public.import_log (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_rows INTEGER NOT NULL,
    imported_rows INTEGER NOT NULL,
    skipped_rows INTEGER NOT NULL,
    warnings TEXT,
    column_mapping TEXT,
    status TEXT NOT NULL
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marked_by TEXT DEFAULT 'system',
    import_id INTEGER REFERENCES public.import_log(id) ON DELETE SET NULL,
    UNIQUE(student_id, session_id)
);

-- Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Extension (Mapping Supabase Auth to Students)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
    student_id INTEGER REFERENCES public.students(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ADD CHECK CONSTRAINTS

-- Attendance date cannot be in the future, and cannot be prior to program start (2025-08-04)
-- Since 'date' is on the sessions table, we check it there, or we enforce via trigger on attendance.
-- Or simply add a constraint on sessions:
ALTER TABLE IF EXISTS public.sessions
ADD CONSTRAINT check_session_date_range 
CHECK (date <= CURRENT_DATE AND date >= '2025-08-04');

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES

-- Students Policy: Mentors full access, Students select own
CREATE POLICY "students_mentor_all" ON public.students FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor')
);
CREATE POLICY "students_read_own" ON public.students FOR SELECT USING (
    id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Sessions Policy: Mentors full access, Students select all
CREATE POLICY "sessions_mentor_all" ON public.sessions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor')
);
CREATE POLICY "sessions_read_all" ON public.sessions FOR SELECT USING (true);

-- Attendance Policy: Mentors full access, Students select own
CREATE POLICY "attendance_mentor_all" ON public.attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor')
);
CREATE POLICY "attendance_read_own" ON public.attendance FOR SELECT USING (
    student_id = (SELECT student_id FROM public.users WHERE id = auth.uid())
);

-- Materials Policy: Mentors full access, Students select all
CREATE POLICY "materials_mentor_all" ON public.materials FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor')
);
CREATE POLICY "materials_read_all" ON public.materials FOR SELECT USING (true);

-- ImportLog Policy: Mentors full access, Students no access
CREATE POLICY "importlog_mentor_all" ON public.import_log FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'mentor')
);

-- Users Policy: Students and Mentors select own
CREATE POLICY "users_read_own" ON public.users FOR SELECT USING (
    id = auth.uid()
);

-- 6. AUTO-CREATE STUDENT AUTH ACCOUNT TRIGGER
-- When a student is inserted, we want an auth user to be created. 
-- Note: the auth.users table is managed by Supabase, and inserting raw passwords via normal SQL is generally restricted.
-- In a real app, you would use an Edge Function or Backend logic to call the Supabase Admin API.
-- For the sake of the specification "Build an auth trigger that auto-creates...", here's the trigger function structure
-- but be aware it is pseudo-functional for the Supabase managed `auth.users` schema.

CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS TRIGGER AS $$
BEGIN
    -- This assumes we are creating a stub in public.users. 
    -- The actual auth.users creation should be handled via supabase UI / admin APIs
    -- However, we can create the public.users record here conditionally.
    INSERT INTO public.users (id, email, role, student_id, display_name)
    -- We can only do this if auth id exists. Bypassing true auth id generation for demo mapping logic via backend is safer.
    -- Alternatively, we generate a mock UUID since this is purely a demonstration of 'trigger logic'.
    VALUES (
        gen_random_uuid(), 
        NEW.usn || '@forge.local', 
        'student', 
        NEW.id, 
        NEW.name
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_student_created
    AFTER INSERT ON public.students
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_student();
