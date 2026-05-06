import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
// Note: Normally we'd need service_role key to bypass RLS, but since we are just trying to update our own or test users, let's see what happens.
// Wait, if RLS is enabled, we need a service_role key, or we need to login as Pavan first.
// Let's login as Pavan first to get a session!
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Logging in as Pavan...");
  const { data: { session }, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'pavan@theboringpeople.in',
    password: 'password123'
  });

  if (loginErr || !session) {
    console.error("Login failed:", loginErr);
    return;
  }

  const userId = session.user.id;
  console.log("Logged in! User ID:", userId);

  console.log("Upserting public.users record for Pavan...");
  const { error: upsertErr } = await supabase.from('users').upsert({
    id: userId,
    email: 'pavan@theboringpeople.in',
    role: 'mentor',
    display_name: 'Pavan'
  });

  if (upsertErr) {
    console.error("Failed to update public.users:", upsertErr);
  } else {
    console.log("Successfully updated display_name to 'Pavan'!");
  }
}

main();
