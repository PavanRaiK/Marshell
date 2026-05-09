import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function clearData() {
  console.log("Logging in as mentor...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nischay@theboringpeople.in',
    password: 'password123'
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }
  console.log("Login successful!");

  // Delete attendance first (though cascade should handle it)
  console.log("Deleting attendance records...");
  const { error: attError } = await supabase.from('attendance').delete().neq('id', 0);
  if (attError) console.error("Error deleting attendance:", attError.message);

  // Delete sessions
  console.log("Deleting sessions...");
  const { error: sessError } = await supabase.from('sessions').delete().neq('id', 0);
  if (sessError) console.error("Error deleting sessions:", sessError.message);

  // Delete students
  console.log("Deleting students...");
  const { error: studError } = await supabase.from('students').delete().neq('id', 0);
  if (studError) console.error("Error deleting students:", studError.message);

  // Delete users that are students
  console.log("Deleting student user records...");
  const { error: userError } = await supabase.from('users').delete().eq('role', 'student');
  if (userError) console.error("Error deleting users:", userError.message);

  console.log("Cleanup complete!");
}

clearData();
