/**
 * Full backup of the Bapekkris Supabase project: every table (all rows, read with the service-role
 * key so RLS does not hide private data) and every file in the `bapekkris-media` bucket.
 *
 * Output: backups/database_<TAG>_<time>.json, backups/backup_latest.json and a ZIP with the
 * database + storage files. Exits non-zero when any table or file could not be read, so a broken
 * backup shows as a failed GitHub Actions run instead of a green one with nothing in it.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveSupabaseAdmin } = require('./supabase-admin.cjs');

const BUCKET = 'bapekkris-media';
const TABLES = [
  'tenures', 'tenure_roles', 'divisions', 'sub_divisions', 'members', 'events', 'galleries', 'forms',
  'submissions', 'lucky_draws', 'event_rsvps', 'faqs', 'brand_assets', 'page_settings', 'daily_devotions',
  'worship_songs', 'easy_worship_schedules', 'admin_profiles', 'prayer_requests', 'page_view_daily', 'admin_audit_log'
];
// Stable paging needs an order; tables without an `id` column use their primary key
const ORDER_BY = { page_settings: 'key', admin_profiles: 'user_id', page_view_daily: 'day,page' };
const PAGE_SIZE = 1000;
const WARN_MB = 400;
const CRIT_MB = 800;

const triggerTag = process.env.TRIGGER_TAG || 'LOCAL';
const triggerLabel = process.env.TRIGGER_LABEL || 'Manual (lokal)';
const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');

async function fetchAllRows(admin, table) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const url = `${admin.baseUrl}/rest/v1/${table}?select=*&order=${ORDER_BY[table] || 'id'}&limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url, { headers: admin.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

/** Every object in the bucket, walking folders (the list API returns one level at a time). */
async function listAllObjects(admin, prefix = '') {
  const objects = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const res = await fetch(`${admin.baseUrl}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...admin.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: PAGE_SIZE, offset, sortBy: { column: 'name', order: 'asc' } })
    });
    if (!res.ok) throw new Error(`Daftar storage "${prefix || '/'}" gagal: HTTP ${res.status}`);
    const entries = await res.json();
    for (const entry of entries) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) objects.push(...await listAllObjects(admin, fullPath));
      else objects.push({ path: fullPath, size: Number(entry.metadata?.size || 0), createdAt: entry.created_at || null });
    }
    if (entries.length < PAGE_SIZE) return objects;
  }
}

async function downloadObject(admin, objectPath, destPath) {
  const res = await fetch(`${admin.baseUrl}/storage/v1/object/${BUCKET}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, { headers: admin.headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

function appendGithubSummary(markdown) {
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n', 'utf8');
}

async function run() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const admin = await resolveSupabaseAdmin();
  console.log(`=== FULL BACKUP SUPABASE BAPEKKRIS (${triggerLabel} [${triggerTag}]) — project ${admin.projectId} ===`);

  fs.mkdirSync(backupDir, { recursive: true });
  const tempDir = fs.mkdtempSync(path.join(backupDir, 'tmp-'));
  const storageDir = path.join(tempDir, 'storage');
  const problems = [];

  console.log(`\n--- 1/3. Database (${TABLES.length} tabel) ---`);
  const database = { meta: { project: admin.projectId, createdAt: new Date().toISOString(), trigger: triggerTag }, tables: {} };
  const tableStats = [];
  for (const table of TABLES) {
    try {
      const rows = await fetchAllRows(admin, table);
      database.tables[table] = rows;
      tableStats.push({ table, count: rows.length, ok: true });
      console.log(`  ✓ ${table}: ${rows.length} baris`);
    } catch (err) {
      problems.push(`Tabel ${table}: ${err.message}`);
      tableStats.push({ table, count: 0, ok: false });
      console.error(`  ✗ ${table}: ${err.message}`);
    }
  }
  const totalRows = tableStats.reduce((n, t) => n + t.count, 0);
  const dbJson = JSON.stringify(database, null, 2);
  fs.writeFileSync(path.join(tempDir, 'database.json'), dbJson);
  const dbFile = path.join(backupDir, `database_${triggerTag}_${timestamp}.json`);
  fs.writeFileSync(dbFile, dbJson);
  fs.writeFileSync(path.join(backupDir, 'backup_latest.json'), dbJson);

  console.log(`\n--- 2/3. Storage (${BUCKET}) ---`);
  let objects = [];
  try {
    objects = await listAllObjects(admin);
  } catch (err) {
    problems.push(err.message);
    console.error(`  ✗ ${err.message}`);
  }
  let totalBytes = 0;
  for (const [i, obj] of objects.entries()) {
    try {
      await downloadObject(admin, obj.path, path.join(storageDir, obj.path));
      totalBytes += obj.size;
      console.log(`  [${i + 1}/${objects.length}] ✓`); // nama berkas sengaja tidak dicetak: log Actions repo publik terbuka
    } catch (err) {
      problems.push(`Berkas ${obj.path}: ${err.message}`);
      console.error(`  [${i + 1}/${objects.length}] ✗ ${err.message}`);
    }
  }
  const sizeMb = (totalBytes / 1024 / 1024).toFixed(2);
  const level = totalBytes > CRIT_MB * 1048576 ? 'CRITICAL' : totalBytes > WARN_MB * 1048576 ? 'WARNING' : 'NORMAL';
  if (level === 'CRITICAL') console.log(`::error::Ukuran storage ${sizeMb} MB melampaui ${CRIT_MB} MB`);
  if (level === 'WARNING') console.log(`::warning::Ukuran storage ${sizeMb} MB melampaui ${WARN_MB} MB`);

  console.log('\n--- 3/3. Arsip ZIP ---');
  const zipPath = path.join(backupDir, `supabase_backup_${triggerTag}_${timestamp}.zip`);
  fs.mkdirSync(storageDir, { recursive: true });
  execSync(`cd "${tempDir}" && zip -r -q "${zipPath}" database.json storage`);
  fs.copyFileSync(zipPath, path.join(backupDir, 'supabase_full_backup_latest.zip'));
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`  ✓ ${zipPath}`);

  appendGithubSummary(`
## 🛡️ Backup Supabase Bapekkris

- **Dijalankan oleh:** ${triggerLabel} (\`${triggerTag}\`)
- **Status:** ${problems.length === 0 ? '✅ Lengkap' : `❌ ${problems.length} masalah`}
- **Database:** **${totalRows} baris** dari ${TABLES.length} tabel
- **Storage:** **${objects.length} berkas** (${sizeMb} MB) — kapasitas ${level === 'NORMAL' ? '🟢 normal' : level === 'WARNING' ? '🟡 perhatian' : '🔴 kritis'}

| Tabel | Baris | Status |
| :--- | ---: | :---: |
${tableStats.map((t) => `| \`${t.table}\` | ${t.count} | ${t.ok ? '✓' : '✗'} |`).join('\n')}
${problems.length ? `\n### Masalah\n${problems.map((p) => `- ${p}`).join('\n')}` : ''}
`);

  console.log(`\nDatabase ${totalRows} baris · storage ${objects.length} berkas (${sizeMb} MB) · ${problems.length} masalah`);
  if (problems.length > 0) {
    console.error('[GAGAL] Backup tidak lengkap:\n- ' + problems.join('\n- '));
    process.exit(1);
  }
}

module.exports = { BUCKET, TABLES, ORDER_BY, fetchAllRows, listAllObjects, appendGithubSummary };

if (require.main === module) {
  run().catch((err) => {
    console.error('[FATAL] Backup gagal:', err.message);
    process.exit(1);
  });
}
