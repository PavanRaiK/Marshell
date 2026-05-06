import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Attempting to create mentor user...");
  const mentorRes = await supabase.auth.signUp({
    email: 'nischay@theboringpeople.in',
    password: 'password123'
  });
  console.log("Mentor creation result:", mentorRes.data, mentorRes.error);

  console.log("Attempting to create student user...");
  const studentRes = await supabase.auth.signUp({
    email: '4sh24cs001@forge.com',
    password: '4SH24CS001'
  });
  console.log("Student creation result:", studentRes.data, studentRes.error);
}

main();
