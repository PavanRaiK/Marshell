import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncStudents() {
  console.log("Authenticating as mentor...");
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'nischay@theboringpeople.in',
    password: 'password123'
  });

  if (authErr) {
    console.error("Auth failed:", authErr.message);
    return;
  }

  console.log("Fetching students from database...");
  
  // 1. Get all students from the public.students table
  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('usn');

  if (fetchError) {
    console.error("Error fetching students:", fetchError.message);
    return;
  }

  console.log(`Found ${students.length} students. Starting sync to Auth...`);
  console.log("(Note: If email confirmation is enabled in Supabase, users will need to confirm before logging in)");

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const student of students) {
    const usn = student.usn;
    const email = `${usn.toLowerCase()}@forge.com`;
    const password = usn.toUpperCase();

    // Attempt to sign up the student
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'student',
          usn: usn
        }
      }
    });

    if (error) {
      if (error.message.includes("already registered")) {
        console.log(`[-] ${usn}: Already has an account.`);
        skipCount++;
      } else {
        console.error(`[X] ${usn}: Failed to create - ${error.message}`);
        failCount++;
      }
    } else {
      console.log(`[+] ${usn}: Auth account created successfully.`);
      successCount++;
      
      // Also ensure they are in the public.users table for role mapping
      // This is usually handled by a trigger, but we'll do a manual check/insert if needed
      await supabase.from('users').upsert({
        id: data.user.id,
        email: email,
        role: 'student',
        full_name: usn // fallback
      });
    }
  }

  console.log("\n--- Sync Complete ---");
  console.log(`Created: ${successCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Failed:  ${failCount}`);
}

syncStudents();
