/**
 * Shared credentials for the backup/restore scripts: the project's service-role key (bypasses RLS).
 * Taken from SUPABASE_SERVICE_ROLE_KEY when set (the GitHub secret: it only reaches this project),
 * otherwise fetched at run time through the Management API with SUPABASE_MGMT_TOKEN (.env locally).
 */
const fs = require('fs');
const path = require('path');

function readEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const values = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return values;
}

async function resolveSupabaseAdmin() {
  const env = { ...readEnvFile(), ...process.env };
  const projectId = env.SUPABASE_PROJECT_ID || (env.VITE_SUPABASE_URL || '').match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectId) throw new Error('SUPABASE_PROJECT_ID (atau VITE_SUPABASE_URL) wajib tersedia.');
  const baseUrl = `https://${projectId}.supabase.co`;
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    return { projectId, baseUrl, headers: { apikey: key, Authorization: `Bearer ${key}` }, serviceKey: key };
  }
  const token = env.SUPABASE_MGMT_TOKEN;
  if (!token) throw new Error('Kredensial tidak ada: setel SUPABASE_SERVICE_ROLE_KEY (secret GitHub) atau SUPABASE_MGMT_TOKEN (.env).');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/api-keys?reveal=true`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Management API menolak permintaan kunci (HTTP ${res.status}). Periksa SUPABASE_MGMT_TOKEN.`);
  const keys = await res.json();
  const service = keys.find((k) => k.name === 'service_role' || k.type === 'secret');
  if (!service?.api_key) throw new Error('Service role key tidak ditemukan pada project.');
  return { projectId, baseUrl, headers: { apikey: service.api_key, Authorization: `Bearer ${service.api_key}` }, serviceKey: service.api_key };
}

module.exports = { resolveSupabaseAdmin };
