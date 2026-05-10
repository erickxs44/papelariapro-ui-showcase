const supabaseUrl = "https://bbjscjhatzuldydmazsn.supabase.co/rest/v1/";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJianNjamhhdHp1bGR5ZG1henNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDAzNzQsImV4cCI6MjA5Mjg3NjM3NH0.YY-HDpHG6Gu-hXQC1R_ZlZoxSbjdiViTFeHS5dRKjdQ";

async function getOpenApiSpec() {
  try {
    const res = await fetch(supabaseUrl, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const data = await res.json();
    
    // Output all available definitions (table names)
    console.log("Available definitions (tables):", Object.keys(data.definitions || {}));
    
    // Check if there is anything close to fiados
    const defs = Object.keys(data.definitions || {});
    const fiadosTables = defs.filter(k => k.includes('fiado'));
    console.log("Tables matching 'fiado':", fiadosTables);
    
    for (const t of fiadosTables) {
      console.log(`\n--- Schema for ${t} ---`);
      console.log(JSON.stringify(data.definitions[t].properties, null, 2));
    }
    
  } catch (e) {
    console.error("Error fetching OpenAPI spec:", e);
  }
}

getOpenApiSpec();
