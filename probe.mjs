import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bbjscjhatzuldydmazsn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianNjamhhdHp1bGR5ZG1henNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDAzNzQsImV4cCI6MjA5Mjg3NjM3NH0.YY-HDpHG6Gu-hXQC1R_ZlZoxSbjdiViTFeHS5dRKjdQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function discoverFiadosColumns() {
  const possibleColumns = ['nome', 'name', 'telefone', 'phone', 'saldo_devedor', 'amount', 'saldo', 'data_vencimento', 'due_date', 'dueDate', 'vencimento', 'status'];
  
  console.log("Checking fiados table columns...");
  
  const { data, error } = await supabase.from('fiados').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Found existing record. Columns:", Object.keys(data[0]));
    return;
  }
  
  for (const col of possibleColumns) {
    const { error: err } = await supabase.from('fiados').insert({ [col]: null });
    if (err && err.message.includes('Could not find the')) {
      // Column doesn't exist
    } else if (err && err.message.includes('null value in column')) {
      console.log(`Column exists and is required: ${col}`);
    } else if (err) {
      console.log(`Column ${col} behavior: ${err.message}`);
    } else {
      console.log(`Column exists and is optional: ${col}`);
    }
  }
}

discoverFiadosColumns();
