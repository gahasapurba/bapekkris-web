/**
 * Restores the tables of a backup made by backup-db.cjs (backups/backup_latest.json, or a path
 * given as the first argument). Rows are upserted by primary key in foreign-key order, so rows
 * created after the backup are kept. admin_profiles needs the matching auth users to exist; the
 * audit log is never rewritten. Requires --yes, because it writes to the live project.
 *
 *   node scripts/restore-db.cjs [backup.json] --yes
 */
const fs = require('fs');
const path = require('path');
const { resolveSupabaseAdmin } = require('./supabase-admin.cjs');

// Parents before children so every foreign key resolves
const RESTORE_ORDER = [
  'tenures', 'tenure_roles', 'divisions', 'sub_divisions', 'members', 'events', 'forms', 'submissions',
  'lucky_draws', 'event_rsvps', 'galleries', 'faqs', 'brand_assets', 'page_settings', 'daily_devotions',
  'worship_songs', 'easy_worship_schedules', 'prayer_requests', 'page_view_daily', 'admin_profiles'
];
const CONFLICT_KEY = { page_settings: 'key', admin_profiles: 'user_id', page_view_daily: 'day,page' };
const BATCH = 500;

async function run() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'backups', 'backup_latest.json');
  if (!args.includes('--yes')) {
    console.error('Restore menulis ke database produksi. Jalankan ulang dengan --yes untuk melanjutkan.');
    process.exit(1);
  }
  const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!backup.tables || typeof backup.tables !== 'object') throw new Error(`${file} bukan berkas backup-db.cjs.`);

  const admin = await resolveSupabaseAdmin();
  console.log(`=== RESTORE DATABASE dari ${file} (backup ${backup.meta?.createdAt || '?'}) ke ${admin.projectId} ===`);
  const problems = [];
  for (const table of RESTORE_ORDER) {
    const rows = backup.tables[table] || [];
    if (rows.length === 0) { console.log(`  · ${table}: kosong`); continue; }
    try {
      for (let i = 0; i < rows.length; i += BATCH) {
        const res = await fetch(`${admin.baseUrl}/rest/v1/${table}?on_conflict=${CONFLICT_KEY[table] || 'id'}`, {
          method: 'POST',
          headers: { ...admin.headers, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(rows.slice(i, i + BATCH))
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
      console.log(`  ✓ ${table}: ${rows.length} baris`);
    } catch (err) {
      problems.push(`${table}: ${err.message}`);
      console.error(`  ✗ ${table}: ${err.message}`);
    }
  }
  if (problems.length) {
    console.error(`\n[GAGAL] ${problems.length} tabel tidak pulih.`);
    process.exit(1);
  }
  console.log('\nSelesai. Muat ulang situs (atau tekan "Sinkronkan" di Admin Portal) untuk melihat data.');
}

run().catch((err) => {
  console.error('[FATAL] Restore gagal:', err.message);
  process.exit(1);
});
