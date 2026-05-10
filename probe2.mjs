import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bbjscjhatzuldydmazsn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianNjamhhdHp1bGR5ZG1henNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDAzNzQsImV4cCI6MjA5Mjg3NjM3NH0.YY-HDpHG6Gu-hXQC1R_ZlZoxSbjdiViTFeHS5dRKjdQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkReal() {
  const { data, error } = await supabase.from('fiados').insert({ test_123: null });
  console.log('Error structure:', JSON.stringify(error));
  
  // Let's insert a completely empty record to see what required columns are missing
  const { error: emptyErr } = await supabase.from('fiados').insert({});
  console.log('Empty insert error:', emptyErr);
  
  // If it tells us "telefone violates not-null", we provide telefone and try again
  const { error: err2 } = await supabase.from('fiados').insert({ telefone: '123' });
  console.log('Insert with just telefone error:', err2);
}

checkReal();
