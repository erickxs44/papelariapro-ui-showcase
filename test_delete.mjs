import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    env[key.trim()] = value.join('=').trim().replace(/"/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkForeignKeys() {
  const { data: fiados } = await supabase.from('fiados').select('id, nome_cliente').limit(1);
  if (fiados && fiados.length > 0) {
    const fiado = fiados[0];
    console.log("Tentando deletar:", fiado.nome_cliente);
    const { error } = await supabase.from('fiados').delete().eq('id', fiado.id);
    console.log("Resultado da deleção:", error ? error.message : "Sucesso");
  } else {
    console.log("Nenhum fiado encontrado.");
  }
}
checkForeignKeys();
