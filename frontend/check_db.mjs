import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Testing mentor login with password123...");
  const { data: mentorData, error: mentorErr } = await supabase.auth.signInWithPassword({
    email: 'nischay@theboringpeople.in',
    password: 'password123'
  });
  
  if (mentorErr) console.log("Mentor login failed:", mentorErr.message);
  else console.log("Mentor login SUCCESS");

  console.log("Testing student login with 4SH24CS001...");
  const { data: studentData, error: studentErr } = await supabase.auth.signInWithPassword({
    email: '4sh24cs001@forge.com',
    password: '4SH24CS001'
  });
  
  if (studentErr) console.log("Student login failed:", studentErr.message);
  else console.log("Student login SUCCESS");

  // Check if public.users is mapped properly
  console.log("Querying public.users directly...");
  const { data: users, error: usersErr } = await supabase.from('users').select('*');
  console.log("public.users rows:", users, usersErr?.message || '');
}

main();
