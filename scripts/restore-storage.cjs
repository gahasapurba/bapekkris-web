/**
 * Uploads the files of a backup back into the `bapekkris-media` bucket (service-role key, so every
 * folder can be restored, not only the public upload folder). Reads backups/storage/ or extracts it
 * from backups/supabase_full_backup_latest.zip. Existing files with the same path are replaced.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { resolveSupabaseAdmin } = require('./supabase-admin.cjs');

const BUCKET = 'bapekkris-media';
const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.avif': 'image/avif', '.pdf': 'application/pdf', '.zip': 'application/zip',
  '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return fs.statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

async function run() {
  const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
  const storageDir = path.join(backupDir, 'storage');
  if (!fs.existsSync(storageDir)) {
    const zip = path.join(backupDir, 'supabase_full_backup_latest.zip');
    if (!fs.existsSync(zip)) throw new Error('backups/storage/ dan supabase_full_backup_latest.zip tidak ditemukan.');
    execSync(`unzip -q -o "${zip}" "storage/*" -d "${backupDir}"`);
  }

  const admin = await resolveSupabaseAdmin();
  const files = listFiles(storageDir);
  console.log(`=== RESTORE STORAGE: ${files.length} berkas ke ${BUCKET} ===`);
  let failed = 0;
  for (const [i, file] of files.entries()) {
    const objectPath = path.relative(storageDir, file).split(path.sep).join('/');
    const res = await fetch(`${admin.baseUrl}/storage/v1/object/${BUCKET}/${objectPath.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: { ...admin.headers, 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'x-upsert': 'true' },
      body: fs.readFileSync(file)
    });
    if (res.ok) console.log(`  [${i + 1}/${files.length}] ✓ ${objectPath}`);
    else { failed++; console.error(`  [${i + 1}/${files.length}] ✗ ${objectPath}: HTTP ${res.status}`); }
  }
  console.log(`\nSelesai: ${files.length - failed} dari ${files.length} berkas dipulihkan.`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('[FATAL] Restore gagal:', err.message);
  process.exit(1);
});
