-- Seed script to populate mock logic for ForgeTrack

-- Insert test student and generic students
INSERT INTO public.students (name, usn, branch_code, email) VALUES
('Test Student', '4SH24CS001', 'CS', '4sh24cs001@forge.local'),
('Abhishek Sharma', '4SH24CS002', 'CS', 'abhishek@gmail.com'),
('Divya Kulkarni', '4SH24CS003', 'AI', 'divya@gmail.com'),
('Ravi Kumar', '4SH24CS004', 'IS', 'ravi@gmail.com'),
('Ananya R', '4SH24CS005', 'CS', 'ananya@gmail.com'),
('Karthik Shetty', '4SH24CS006', 'AI', 'karthik@gmail.com'),
('Pooja Hegde', '4SH24CS007', 'CS', 'pooja@gmail.com'),
('Manoj Bhat', '4SH24CS008', 'IS', 'manoj@gmail.com'),
('Sneha Rao', '4SH24CS009', 'CS', 'sneha@gmail.com'),
('Rahul Deshpande', '4SH24CS010', 'AI', 'rahul@gmail.com'),
('Neha Patil', '4SH24CS011', 'CS', 'neha@gmail.com'),
('Varun N', '4SH24CS012', 'IS', 'varun@gmail.com'),
('Sanjana K', '4SH24CS013', 'CS', 'sanjana@gmail.com'),
('Nikhil M', '4SH24CS014', 'AI', 'nikhil@gmail.com'),
('Aishwarya T', '4SH24CS015', 'CS', 'aishwarya@gmail.com'),
('Rohan A', '4SH24CS016', 'IS', 'rohan@gmail.com'),
('Kavya S', '4SH24CS017', 'CS', 'kavya@gmail.com'),
('Prakash V', '4SH24CS018', 'AI', 'prakash@gmail.com'),
('Meghana G', '4SH24CS019', 'CS', 'meghana@gmail.com'),
('Deepak C', '4SH24CS020', 'IS', 'deepak@gmail.com'),
('Swathi P', '4SH24CS021', 'CS', 'swathi@gmail.com'),
('Sandeep R', '4SH24CS022', 'AI', 'sandeep@gmail.com'),
('Bhavya L', '4SH24CS023', 'CS', 'bhavya@gmail.com'),
('Ganesh N', '4SH24CS024', 'IS', 'ganesh@gmail.com'),
('Rakshitha V', '4SH24CS025', 'CS', 'rakshitha@gmail.com');

-- Insert 15 sessions in month 4, 5, 6
INSERT INTO public.sessions (date, topic, month_number) VALUES
('2025-10-01', '8-Layer AI Stack', 4),
('2025-10-03', 'LLM Architectures', 4),
('2025-10-08', 'Prompt Engineering Patterns', 4),
('2025-10-10', 'Vector Databases & Embeddings', 4),
('2025-10-15', 'pgvector RAG', 4),
('2025-11-02', 'ReAct Agent Pattern', 5),
('2025-11-05', 'Tool Calling with Gemini', 5),
('2025-11-10', 'LangChain Basics', 5),
('2025-11-14', 'Advanced Prompt Chains', 5),
('2025-11-20', 'OpenAI API Integration', 5),
('2025-12-01', 'Tiered Autonomy Multi-Agent', 6),
('2025-12-04', 'Agentic Memory Systems', 6),
('2025-12-09', 'AI System Evaluation', 6),
('2025-12-15', 'Productionizing AI Workflows', 6),
('2025-12-18', 'Final Project Presentations', 6);

-- Mock attendance for all combinations, giving generic high attendance
DO $$ 
DECLARE
  student RECORD;
  session RECORD;
  is_present BOOLEAN;
BEGIN
  FOR session IN SELECT * FROM public.sessions LOOP
    FOR student IN SELECT * FROM public.students LOOP
      -- ~85% attendance probability
      is_present := random() < 0.85;
      
      -- ensure 'Ravi Kumar' gets a slightly lower attendance record if we want some variance :)
      IF student.name = 'Ravi Kumar' THEN
          is_present := random() < 0.60;
      END IF;

      INSERT INTO public.attendance (student_id, session_id, present, marked_by)
      VALUES (student.id, session.id, is_present, 'Nischay B K');
    END LOOP;
  END LOOP;
END $$;

-- Insert Mock Materials
INSERT INTO public.materials (session_id, title, type, url)
SELECT id, 'Slides: ' || topic, 'slides', 'https://docs.google.com/presentation/'
FROM public.sessions;

INSERT INTO public.materials (session_id, title, type, url)
SELECT id, 'Recording: ' || topic, 'recording', 'https://youtube.com/watch'
FROM public.sessions WHERE month_number = 4;

-- Seed admin users directly into public.users for auth linkage bypass validation
-- (Only valid if we aren't enforcing FOREIGN KEY on auth.users directly or bypassing it with mock data)
-- For proper deployment, mentor accounts should simply be invited via Supabase Auth UI.
