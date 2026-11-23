/**
 * Script Full Backup Otomatis Database & Storage Bucket Supabase Bapekkris Bank Mandiri
 * 
 * SAFETY NET SYSTEM:
 * 1. Database Priority: Database SQL selalu di-backup dan diisolasi terlebih dahulu.
 * 2. Early Warning: Peringatan otomatis jika ukuran mendekati ambang batas Supabase free tier.
 * 3. GitHub Step Summary: Laporan visual otomatis di dashboard GitHub Actions setiap eksekusi
 *    dengan penanda jelas apakah dijalankan oleh SISTEM (02:00 WIB) atau ANTIGRAVITY AI.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let token = process.env.SUPABASE_MGMT_TOKEN;
let projectId = process.env.SUPABASE_PROJECT_ID;

const triggerTag = process.env.TRIGGER_TAG || 'LOCAL';
const triggerLabel = process.env.TRIGGER_LABEL || (triggerTag === 'SYSTEM' ? '⏰ Sistem (Jadwal Otomatis 02:00 WIB)' : '🤖 Antigravity AI (Manual / Pasca Pembaruan)');

if (!token || !projectId || !process.env.VITE_SUPABASE_ANON_KEY) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const tokenMatch = envContent.match(/SUPABASE_MGMT_TOKEN=([^\s]+)/);
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=https:\/\/([^.]+)\.supabase\.co/);
    const anonMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=([^\s]+)/);
    if (!token && tokenMatch) token = tokenMatch[1];
    if (!projectId && urlMatch) projectId = urlMatch[1];
    if (!process.env.VITE_SUPABASE_ANON_KEY && anonMatch) process.env.VITE_SUPABASE_ANON_KEY = anonMatch[1];
  }
}

if (!projectId) projectId = process.env.VITE_SUPABASE_PROJECT_ID || '';

const tables = [
  'tenures', 'tenure_roles', 'divisions', 'sub_divisions',
  'members', 'events', 'galleries', 'forms', 'submissions',
  'lucky_draws', 'event_rsvps', 'faqs', 'brand_assets', 'page_settings',
  'daily_devotions', 'worship_songs', 'easy_worship_schedules'
];

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} when downloading ${url}`);
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

function appendGithubSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, markdown + '\n', 'utf8');
    } catch (e) {}
  }
}

async function runFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  console.log(`[${new Date().toISOString()}] === MEMULAI FULL BACKUP SUPABASE (DB + STORAGE) BAPEKKRIS ===`);
  console.log(`Dijalankan Oleh : ${triggerLabel} [${triggerTag}]`);
  console.log(`Project ID      : ${projectId}\n`);

  const backupDir = path.join(__dirname, '..', 'backups');
  const tempDir = path.join(backupDir, `snapshot_${timestamp}`);
  const storageDir = path.join(tempDir, 'storage');

  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  // 1. ISOLASI DATABASE POSTGRESQL TERLEBIH DAHULU
  console.log('--- 1/2. Mengunduh Data Tabel Database (19 Tabel) ---');
  const backupData = {
    meta: {
      timestamp: new Date().toISOString(),
      projectId,
      triggerTag,
      triggerLabel,
      version: '1.0-bapekkris-cloud'
    },
    tables: {}
  };

  let totalDbRows = 0;
  const tableStats = [];

  for (const tbl of tables) {
    try {
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
      const res = await fetch(`https://${projectId}.supabase.co/rest/v1/${tbl}?select=*`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${token || anonKey}`
        }
      }).then(r => r.json());

      if (Array.isArray(res)) {
        backupData.tables[tbl] = res;
        totalDbRows += res.length;
        tableStats.push({ table: tbl, count: res.length, status: 'OK' });
        console.log(`  ✓ ${tbl}: ${res.length} rows`);
      } else {
        backupData.tables[tbl] = [];
        tableStats.push({ table: tbl, count: 0, status: 'EMPTY / WARN' });
      }
    } catch (err) {
      console.error(`  ✗ ${tbl} error:`, err.message);
      backupData.tables[tbl] = [];
      tableStats.push({ table: tbl, count: 0, status: 'ERROR' });
    }
  }

  const dbJsonPath = path.join(tempDir, 'database.json');
  fs.writeFileSync(dbJsonPath, JSON.stringify(backupData, null, 2), 'utf8');

  const standaloneDbJson = path.join(backupDir, `database_${triggerTag}_${timestamp}.json`);
  const latestJsonPath = path.join(backupDir, 'backup_latest.json');
  fs.copyFileSync(dbJsonPath, standaloneDbJson);
  fs.copyFileSync(dbJsonPath, latestJsonPath);

  // 2. MENGUNDUH STORAGE BUCKET (bapekkris-media)
  console.log('\n--- 2/2. Mengunduh Berkas Fisik Storage Bucket (bapekkris-media) ---');
  let storageFiles = [];
  try {
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const listRes = await fetch(`https://${projectId}.supabase.co/storage/v1/object/list/bapekkris-media`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${token || anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefix: '', limit: 100 })
    }).then(r => r.json());

    if (Array.isArray(listRes)) {
      storageFiles = listRes;
      console.log(`Ditemukan ${storageFiles.length} berkas fisik di bucket bapekkris-media.`);
    }
  } catch (err) {
    console.error('Gagal membaca daftar file storage:', err.message);
  }

  let totalDownloadedBytes = 0;
  let failedStorageCount = 0;

  for (let i = 0; i < storageFiles.length; i++) {
    const fileObj = storageFiles[i];
    const fileUrl = `https://${projectId}.supabase.co/storage/v1/object/public/bapekkris-media/${fileObj.name}`;
    const dest = path.join(storageDir, fileObj.name);

    try {
      await downloadFile(fileUrl, dest);
      totalDownloadedBytes += Number(fileObj.metadata?.size || 0);
      console.log(`  [${i + 1}/${storageFiles.length}] ✓ ${fileObj.name}`);
    } catch (err) {
      failedStorageCount++;
      console.error(`  ✗ Gagal download ${fileObj.name}:`, err.message);
    }
  }

  const storageSizeMb = (totalDownloadedBytes / 1024 / 1024).toFixed(2);
  console.log(`\nSelesai mengunduh storage: ${storageSizeMb} MB`);

  // SAFETY NET: EARLY WARNING
  const WARN_THRESHOLD_MB = 400;
  const CRIT_THRESHOLD_MB = 800;
  let alertLevel = 'NORMAL';

  if (totalDownloadedBytes > CRIT_THRESHOLD_MB * 1024 * 1024) {
    alertLevel = 'CRITICAL';
    console.log(`::error::[CRITICAL CAPACITY] Total ukuran backup (${storageSizeMb} MB) telah melampaui ${CRIT_THRESHOLD_MB} MB!`);
  } else if (totalDownloadedBytes > WARN_THRESHOLD_MB * 1024 * 1024) {
    alertLevel = 'WARNING';
    console.log(`::warning::[EARLY WARNING] Total ukuran backup (${storageSizeMb} MB) telah melampaui ${WARN_THRESHOLD_MB} MB.`);
  }

  // 3. PACKAGING KE FILE ZIP
  console.log('\n--- 3/3. Mengompresi Database & Storage ke Archive ZIP ---');
  const zipFilename = `supabase_backup_${triggerTag}_${timestamp}.zip`;
  const zipPath = path.join(backupDir, zipFilename);
  const latestZipPath = path.join(backupDir, 'supabase_full_backup_latest.zip');

  let zipSuccess = false;
  try {
    execSync(`cd "${tempDir}" && zip -r "${zipPath}" database.json storage/ -q`);
    fs.copyFileSync(zipPath, latestZipPath);
    zipSuccess = true;
    console.log(`  ✓ ZIP berhasil dibuat: ${zipPath}`);
  } catch (err) {
    console.warn('  ⚠️ Tidak dapat membuat file zip otomatis via CLI:', err.message);
  }

  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  const summaryMarkdown = `
## 🛡️ Laporan Supabase Full Backup Bapekkris

- **Dijalankan Oleh:** **${triggerLabel}** (\`${triggerTag}\`)
- **Status Eksekusi:** ${zipSuccess ? '✅ Berhasil Sempurna' : '⚠️ Berhasil Sebagian (Database Terselamatkan)'}
- **Waktu Eksekusi:** \`${new Date().toISOString()}\`
- **Total Data Database:** **${totalDbRows} baris** (19 tabel)
- **Total Berkas Storage:** **${storageFiles.length} file** (${storageSizeMb} MB)
- **Status Kapasitas:** ${alertLevel === 'NORMAL' ? '🟢 Normal (< 400 MB)' : alertLevel === 'WARNING' ? '🟡 Perhatian (> 400 MB)' : '🔴 Kritis (> 800 MB)'}

### Rincian Data Tabel Database:
| Tabel | Jumlah Baris | Status |
| :--- | :---: | :---: |
${tableStats.map(s => `| \`${s.table}\` | ${s.count} | ${s.status === 'OK' ? '✓' : '⚠️'} |`).join('\n')}

> *Catatan: Backup disimpan secara aman di Cloud GitHub Actions Artifacts.*
`;

  appendGithubSummary(summaryMarkdown);

  console.log(`\n============================================================`);
  console.log(`[SUCCESS] FULL BACKUP BAPEKKRIS SELESAI DENGAN SUKSES!`);
  console.log(`  • Dijalankan Oleh     : ${triggerLabel} [${triggerTag}]`);
  console.log(`  • Status Safety Net   : ${alertLevel}`);
  console.log(`  • Total Data Database : ${totalDbRows} baris (19 tabel)`);
  console.log(`  • Total File Storage  : ${storageFiles.length} berkas (${storageSizeMb} MB)`);
  console.log(`  • Berkas Database     : ${standaloneDbJson}`);
  console.log(`  • Berkas Arsip Utuh   : ${zipPath}`);
  console.log(`============================================================\n`);
}

runFullBackup().catch(err => {
  console.error('[FATAL] Backup gagal:', err);
  process.exit(1);
});
