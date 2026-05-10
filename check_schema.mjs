import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bbjscjhatzuldydmazsn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianNjamhhdHp1bGR5ZG1henNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDAzNzQsImV4cCI6MjA5Mjg3NjM3NH0.YY-HDpHG6Gu-hXQC1R_ZlZoxSbjdiViTFeHS5dRKjdQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('--- Checking tables ---');
  
  const tables = ['fiados', 'historico_fiados', 'clientes_fiado'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`${table} ERROR:`, error.message);
    } else {
      console.log(`${table} COLUMNS:`, data && data.length > 0 ? Object.keys(data[0]) : 'Table exists but is empty');
      
      if (data && data.length === 0) {
        const { error: insertError } = await supabase.from(table).insert({ test_column_does_not_exist: 1 });
        console.log(`${table} INSERT ERR (to infer schema):`, insertError ? insertError.message : 'No error');
      }
    }
  }
}

checkSchema();
