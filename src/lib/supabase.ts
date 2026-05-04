import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bbjscjhatzuldydmazsn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianNjamhhdHp1bGR5ZG1henNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDAzNzQsImV4cCI6MjA5Mjg3NjM3NH0.YY-HDpHG6Gu-hXQC1R_ZlZoxSbjdiViTFeHS5dRKjdQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // SPA mode: disables auth lock contention that causes
    // "Lock was not released within 5000ms" errors during React re-mounts
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
