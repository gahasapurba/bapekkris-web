/**
 * Keeps the `bapekkris-media` bucket in step with the database.
 *
 * - Orphans: files no table refers to (an upload whose save failed, a public registration the
 *   server rejected after its attachment was uploaded, a best-effort delete that did not go
 *   through). Removed once they are older than GRACE_HOURS, so uploads in progress are kept.
 * - Missing: URLs in the database whose file no longer exists. Reported, never changed.
 *
 * Every table the service role can see is scanned (taken from the REST schema, not a fixed
 * list), so a table added later cannot make its files look orphaned. If any table cannot be
 * read, nothing is deleted. Logs print counts only (the repository is public).
 *
 * Usage: node scripts/storage-reconcile.cjs            # report only
 *        node scripts/storage-reconcile.cjs --apply    # also delete orphans
 */
const { resolveSupabaseAdmin } = require('./supabase-admin.cjs');
const { BUCKET, fetchAllRows, listAllObjects, appendGithubSummary } = require('./backup-db.cjs');

const APPLY = process.argv.includes('--apply');
const GRACE_HOURS = Number(process.env.GRACE_HOURS || 24);
// A run that would delete most of the bucket is far more likely a bug than real orphans
const MAX_DELETE_SHARE = 0.5;
const MAX_DELETE_FLOOR = 10;
const URL_MARKER = `/storage/v1/object/public/${BUCKET}/`;

async function listTables(admin) {
  const res = await fetch(`${admin.baseUrl}/rest/v1/`, { headers: { ...admin.headers, Accept: 'application/openapi+json' } });
  if (!res.ok) throw new Error(`Skema REST tidak terbaca: HTTP ${res.status}`);
  const spec = await res.json();
  return Object.keys(spec.definitions || {}).sort();
}

/** Storage paths referenced anywhere in a row (columns, arrays, nested JSON). */
function collectRefs(value, refs) {
  const text = JSON.stringify(value);
  let idx = text.indexOf(URL_MARKER);
  while (idx >= 0) {
    const start = idx + URL_MARKER.length;
    let end = start;
    while (end < text.length && !'"\\?# '.includes(text[end])) end++;
    const raw = text.slice(start, end);
    try { refs.add(decodeURIComponent(raw)); } catch { refs.add(raw); }
    idx = text.indexOf(URL_MARKER, end);
  }
}

async function deleteObjects(admin, paths) {
  for (let i = 0; i < paths.length; i += 100) {
    const res = await fetch(`${admin.baseUrl}/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      headers: { ...admin.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefixes: paths.slice(i, i + 100) })
    });
    if (!res.ok) throw new Error(`Hapus berkas yatim gagal: HTTP ${res.status}`);
  }
}

async function run() {
  const admin = await resolveSupabaseAdmin();
  const tables = await listTables(admin);
  const refs = new Set();
  for (const table of tables) {
    // A table that cannot be read stops the run: its files would otherwise look orphaned
    const rows = await fetchAllRows(admin, table).catch((err) => { throw new Error(`Tabel ${table} tidak terbaca (${err.message}); tidak ada yang dihapus`); });
    for (const row of rows) collectRefs(row, refs);
  }

  const objects = (await listAllObjects(admin)).filter((o) => !o.path.endsWith('.emptyFolderPlaceholder'));
  const stored = new Set(objects.map((o) => o.path));
  const cutoff = Date.now() - GRACE_HOURS * 3600 * 1000;
  const unreferenced = objects.filter((o) => !refs.has(o.path));
  const orphans = unreferenced.filter((o) => o.createdAt && Date.parse(o.createdAt) < cutoff);
  const recent = unreferenced.length - orphans.length;
  const missing = [...refs].filter((p) => !stored.has(p));

  const limit = Math.max(MAX_DELETE_FLOOR, Math.floor(objects.length * MAX_DELETE_SHARE));
  let deleted = 0;
  if (APPLY && orphans.length > 0) {
    if (orphans.length > limit) {
      console.log(`::error::${orphans.length} berkas yatim melebihi batas aman ${limit}; tidak ada yang dihapus. Periksa manual.`);
      process.exitCode = 1;
    } else {
      await deleteObjects(admin, orphans.map((o) => o.path));
      deleted = orphans.length;
    }
  }

  const status = missing.length === 0 && (orphans.length === 0 || deleted === orphans.length) ? 'SESUAI' : 'PERLU DICEK';
  console.log(`=== REKONSILIASI STORAGE (${APPLY ? 'hapus yatim' : 'laporan saja'}) ===`);
  console.log(`Tabel dipindai: ${tables.length} · rujukan berkas: ${refs.size} · berkas di storage: ${objects.length}`);
  console.log(`Yatim > ${GRACE_HOURS} jam: ${orphans.length} (dihapus ${deleted}) · yatim baru (ditunggu): ${recent} · rujukan tanpa berkas: ${missing.length}`);
  console.log(`Status: ${status}`);
  if (missing.length > 0) console.log(`::warning::${missing.length} rujukan di database menunjuk berkas yang tidak ada di storage`);

  appendGithubSummary(`## Rekonsiliasi storage
| | Jumlah |
|---|---:|
| Tabel dipindai | ${tables.length} |
| Rujukan berkas di database | ${refs.size} |
| Berkas di storage | ${objects.length} |
| Yatim > ${GRACE_HOURS} jam (dihapus) | ${orphans.length} (${deleted}) |
| Yatim baru, ditunggu | ${recent} |
| Rujukan tanpa berkas | ${missing.length} |

**Status: ${status}**
`);
}

module.exports = { collectRefs };

if (require.main === module) {
  run().catch((err) => {
    console.error('[FATAL] Rekonsiliasi gagal:', err.message);
    process.exit(1);
  });
}
