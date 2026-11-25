# Catatan Serah-Terima Pengembangan — Bapekkris Web

Dokumen ini merangkum status perombakan website Bapekkris Bank Mandiri agar pekerjaan bisa dilanjutkan dari perangkat lain (atau sesi AI baru) tanpa kehilangan konteks. **Tidak berisi rahasia** — kredensial disimpan terpisah di luar repo.

Terakhir diperbarui: 25 November 2026 (Fase 3 berjalan — fondasi, komponen, layout & Beranda selesai).

---

## 1. Cara melanjutkan di perangkat lain

1. `git pull origin main` (wajib, sesuai [standar kerja](../.agent/rules/standar-kerja.md)).
2. Pastikan file `.env` ada di root repo (tidak ikut Git) dengan tiga variabel:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_MGMT_TOKEN`.
3. `npm install` lalu `npm run build` untuk memastikan semuanya beres.
4. Untuk AI (Claude Code): minta baca dokumen ini dan `.agent/rules/standar-kerja.md`, lalu lanjutkan dari bagian **5. Langkah berikutnya**.

---

## 2. Keputusan yang sudah disepakati

| Topik | Keputusan |
|---|---|
| Konsep desain | **A "Sanctuary Editorial"** untuk halaman publik (ivory/putih hangat, navy Mandiri pekat, gold hemat, serif display seperti Fraunces/Instrument Serif + Inter, whitespace lega, ayat besar, foto full-bleed) + **pola B "Corporate Bento"** untuk Admin Portal (sidebar + tabel, gaya dashboard SaaS) |
| Akun admin | Supabase Auth, **multi-peran**: `super_admin` (semua data + kelola admin) dan `division_admin` (pengurus, acara, formulir terhubung acara, pendaftaran, galeri divisinya) |
| Stack target | Migrasi bertahap ke **TypeScript + Tailwind CSS v4 + Radix/shadcn + React Router + TanStack Query** |
| Alur kerja | Satu modul per langkah, fitur yang sudah jalan dipertahankan, commit per bagian, push ke `main`, laporan 5 bagian sesuai standar kerja |

---

## 3. Yang sudah selesai (Fase 1 + prioritas Sedang)

### Keamanan & integritas data
- **RLS berbasis peran** menggantikan "Public full access" — migration `supabase/migrations/20261125000000_secure_access_and_admin_roles.sql` (sudah diterapkan di produksi).
  - Pengunjung hanya membaca konten publik (acara draft & FAQ belum terbit tersembunyi).
  - `submissions`, `event_rsvps`, `lucky_draws` hanya terbaca admin yang berwenang.
  - Fungsi helper: `is_admin`, `is_super_admin`, `can_manage_division`, `can_manage_event`, `can_manage_form`.
- **RPC publik** (SECURITY DEFINER): `get_registration_counts`, `get_event_attendees`, `is_submission_value_taken`, `track_submissions`, `get_accepted_submissions`, `submit_form`, `submit_rsvp` (kuota, tenggat WIB, field unik diperiksa atomik). Admin: `assign_admin_role`, `revoke_admin_role`.
- **Login admin** memakai Supabase Auth (hash SHA-256 di bundle dihapus). Tab "Kelola Admin" untuk super admin.
- **Lapisan data**: penulisan per baris (`saveRow`, `deleteRow`, dst.) dengan cek error — pola lama "tulis seluruh list lalu hapus yang tidak ada" yang bisa menghapus data orang lain sudah dihapus. Data pribadi tidak lagi disimpan di localStorage.
- Lucky draw: detail pemenang tersimpan (`lucky_draws.details`), pemenang ganda dicegah unique index; halaman `?stats=` wajib login admin.
- Tabel lama `departments`, `aspirasi` dihapus.

### Bug & performa
- Tenggat, status acara selesai, dan "hari ini" dihitung dalam **WIB** (`parseWibDateTime`, `toWibIsoDate` di `src/utils/dateUtils.js`), identik dengan `parse_wib_deadline` di database.
- Library PDF (595 KB) hanya dimuat saat Export PDF; `html2pdf.js` dihapus, `pg` ke devDependencies.
- Validasi input publik: batas panjang, email/angka, tipe & ukuran file (≤ 20 MB sesuai bucket).
- Admin Divisi hanya melihat data divisinya (`adminScope` di `App.jsx`).
- Navbar tidak lagi tumpang-tindih (menu sekunder di dropdown "Lainnya", hamburger < 1280 px).
- Edge function `og-preview` hanya berjalan di `/` dengan timeout; acara draft tidak dipratinjau.
- Alkitab: versi TB2/BIMK yang salah label dihapus, fallback CDN benar, loader tidak macet.

### Sudah diverifikasi
- Uji RLS lewat REST sebagai anon, super admin, dan admin divisi (akun uji sementara, sudah dihapus).
- Uji UI end-to-end (Playwright): kirim form, cek NIP duplikat, lacak status, RSVP, halaman statistik terkunci, login/logout admin, Kelola Admin, Data Pendaftaran — 12/12 lolos.

---

## 4. Catatan operasional

- **Produksi**: https://bapekkris-mandiri.netlify.app (auto-deploy dari `main`). Supabase project `zkvjudumhhnwxchhakjl`.
- **Menjalankan SQL di produksi** (butuh `SUPABASE_MGMT_TOKEN` di `.env`):
  ```bash
  TOKEN=$(grep '^SUPABASE_MGMT_TOKEN=' .env | cut -d= -f2)
  curl -s -X POST "https://api.supabase.com/v1/projects/zkvjudumhhnwxchhakjl/database/query" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"query":"select 1"}'
  ```
  Setiap perubahan skema: tulis migration baru di `supabase/migrations/`, gabungkan ke `supabase_schema.sql` (idempotent), push → GitHub Actions otomatis backup.
- **Menambah admin**: buat user di Supabase → Authentication → Users, lalu di website: Admin Portal → Kelola Admin (super admin).
- **GitHub CLI**: `gh run list` untuk melihat status backup; `gh workflow run daily-backup.yml` untuk backup manual.
- **Uji UI**: `npx playwright install chromium` lalu jalankan skrip ke `http://localhost:5173` (`npm run dev`) atau langsung ke produksi. Di laptop kantor, Chrome/Edge memblokir `*.netlify.app` (MDM), sehingga uji dilakukan ke `localhost`.
- Selalu matikan dev server setelah selesai (Zero Background Task).

---

## 5. Langkah berikutnya

### Fase 2 — Arsitektur (berikutnya)
1. **TypeScript bertahap**: `tsconfig` dengan `allowJs`, `supabase gen types typescript` untuk tipe tabel, migrasi mulai dari `src/lib` dan `src/utils`.
   - ✅ `tsconfig.json` (strict, `allowJs`, `noEmit`), `npm run typecheck`; `npm run build` kini menjalankan `tsc` dulu.
   - ✅ Tipe tabel & RPC di `src/types/database.ts`. Regenerate setiap ada perubahan skema:
     ```bash
     TOKEN=$(grep '^SUPABASE_MGMT_TOKEN=' .env | cut -d= -f2)
     curl -s "https://api.supabase.com/v1/projects/zkvjudumhhnwxchhakjl/types/typescript" \
       -H "Authorization: Bearer $TOKEN" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).types))' > src/types/database.ts
     ```
   - ✅ `src/lib/supabase.ts` bertipe (client `Database`, mapper `fromDb` per tabel, RPC bertipe). `AppItem` sengaja masih longgar sampai state ditipekan di langkah TanStack Query.
   - ✅ Seluruh `src/utils/*` sudah `.ts` (`dateUtils`, `quotaUtils`, `urlUtils`, `memberQuotaUtils`, `audio`, `exportPdf`, `qrPosterGenerator`). Output lama vs baru dibandingkan: 914 pemanggilan contoh (3 zona waktu), 0 perbedaan.
   - Komponen `.jsx` dimigrasi ke `.tsx` saat dipecah di langkah 4, bukan terpisah.
2. **React Router**: ganti routing hash manual di `App.jsx` (`parseLocationRoute`, `setCurrentTab` yang selalu `replaceState`) agar tombol Back berfungsi; pertahankan format link share `/?event=…`, `/?form=…`, `/?gallery=…`, `/?stats=…`, `/admin`.
   - ✅ `react-router` v7 (`BrowserRouter` di `main.jsx`). Tab & ID detail kini diturunkan dari URL; logikanya di `src/lib/appNavigation.tsx` (`parseLocationRoute`, `buildTabUrl`, `useQueuedNavigation`). Format URL tidak berubah.
   - Setiap pindah halaman = entri riwayat baru (Back/Forward berfungsi). Beberapa navigasi dalam satu klik digabung (yang terakhir menang), dan menutup detail kembali satu langkah bila entri sebelumnya memang halaman itu — Back tidak membuka ulang modal yang baru ditutup.
   - Komponen anak memakai `useAppNavigate()` (bukan `window.location.href`, yang memuat ulang seluruh halaman).
   - Bonus perbaikan: link `?galeri=` lama kini membuka galeri yang benar; pindah tab tidak lagi meninggalkan query lama (`/?form=X#home`); pencarian/filter galeri tidak di-reset tiap refresh data.
   - Diuji Playwright ke `localhost`: 37/37 skenario (navbar, Back/Forward, modal acara, deep link, galeri dengan data tiruan, `/admin`, projector).
3. **TanStack Query** sebagai lapisan data (menggantikan `fetchAllCloudState` + polling 60 dtk + state besar di `App.jsx`), invalidasi per tabel dari realtime.
   - ✅ `@tanstack/react-query` v5; `src/lib/queries.ts` (QueryClient, `useTableData`, `usePageSettings`, `useRegistrationCounts`, `useRealtimeInvalidation`, `useSyncStatus`). `fetchAllCloudState` diganti `fetchTableRows` / `fetchPageSettings` / `fetchRegistrationCounts` di `supabase.ts`.
   - Tiap tabel = satu query (`['table', key]`). `useTableData` berbentuk seperti `useState`, jadi handler lama (`setEvents(prev => ...)`) tetap; edit optimistis membatalkan refetch yang sedang jalan agar tidak tertimpa data lama.
   - Realtime kini memuat ulang **hanya tabel yang berubah** (+ hitungan pendaftar bila perlu); polling 60 dtk (berhenti saat tab tersembunyi) & refetch saat fokus ditangani TanStack.
   - Nama divisi di acara/galeri, ketua divisi, kategori anggota, status "Completed", dan tenure aktif kini diturunkan (`useMemo`) dari data mentah — selalu konsisten, bukan hanya saat sinkronisasi.
   - Tabel pribadi (`submissions`, `event_rsvps`, `lucky_draws`) hanya di-query saat admin login dan dihapus dari memori saat logout; ganti peran memuat ulang semua data.
   - Diuji Playwright: 15 skenario lapisan data (termasuk login/logout admin, hanya baca) + 37 skenario navigasi.
4. **Pecah komponen raksasa**: `AdminPortal.jsx` (~16 ribu baris, 180+ useState) per tab ke `src/admin/tabs/*`; `EventRegistrationStats.jsx`, `DynamicFormSection.jsx` ke komponen + hooks.
   - ✅ `AdminPortal.jsx` 16.057 → ~2.500 baris (kini hanya state + handler). Tampilan pindah ke `src/admin/`: `tabs/*Tab.tsx` (14 tab), `modals/*.tsx`, `modals/edit/*Fields.tsx` (field dialog edit per jenis data), `AdminSummaryBar`, `AdminTabNavigation`, `AdminLoginForm`, `AdminAccountsPanel`.
   - State sengaja tetap di `AdminPortal` dan dibagikan lewat `AdminPortalContext` (bertipe: koleksi `AppItem[]`, setter `Dispatch<SetStateAction>`), agar filter & isian setengah jadi tetap ada saat pindah tab. Memindahkan state ke hook per tab = pekerjaan lanjutan (cocok dilakukan saat redesign Fase 3).
   - ✅ `EventRegistrationStats` → `src/components/registration-stats/` (hook `useEventRegistrationStats` + 8 section); `DynamicFormSection` → `src/components/dynamic-form/` (hook `useDynamicForm` + 7 section). Hook masih `.js/.jsx`; context-nya bertipe per kunci (nilai `any`).
   - Parameter callback yang belum bertipe ditandai `: any` secara eksplisit (±150 tempat) — cari `: any` untuk melanjutkan penipean.
   - Kode dipindah apa adanya dengan ekstraktor berbasis Babel; diverifikasi dengan membandingkan teks tampilan versi lama vs baru (16 tab admin, 9 dialog edit, halaman formulir, statistik & lucky draw semua acara): identik.
   - Bug lama yang ikut diperbaiki: `setOptionFilter` (tidak pernah dideklarasikan) melempar `ReferenceError` setiap memilih field diagram statistik; `soundFx.playPop?.()` (tidak ada) dihapus.
5. Validasi form admin dengan zod + react-hook-form.
   - ✅ Semua aturan validasi admin di `src/admin/validation/schemas.ts` (zod 4): form tambah (pengurus, role, divisi, periode, acara, formulir, galeri, asset, FAQ), dialog edit (`editItemError`), login, dan akun admin. `collectFieldErrors` = semua error sekaligus (field map, seperti sebelumnya); `firstError` = satu pesan untuk dialog.
   - ✅ react-hook-form + `zodResolver` untuk form yang state-nya mandiri: `AdminLoginForm` dan `AdminAccountsPanel`. Form tab lain masih memakai state di `AdminPortal`; dipindah ke RHF saat form-nya dibangun ulang dengan komponen Fase 3.
   - Pesan & kondisi identik dengan kode lama: diuji fuzz 52.000 kombinasi (termasuk kunci yang hilang) lawan salinan validator lama → 0 beda, plus uji browser (pesan yang tampil sama, tanpa ada request tulis).
   - Aturan yang butuh data lain tetap fungsi bisnis: kuota jabatan (`validateMemberQuota`), duplikat field unik, cek URL foto (async).
   - ✅ `npm test` (Vitest): uji unit skema validasi & routing (`*.test.ts`).

**Fase 2 selesai.** Lanjut ke Fase 3.

### Fase 3 — Redesign UI (konsep A + B)

**Progres (rilis langsung ke `main`, sesuai keputusan pengguna 25 Nov 2026):**
- ✅ Fondasi: token konsep A di `src/styles/tokens.css` (ivory/navy/emas, terang & gelap, kontras AA), Fraunces + Inter, Tailwind v4 **tanpa preflight** (CSS lama di layer `legacy` → `src/styles/legacy.css`), tema awal mengikuti OS sampai pengunjung memilih (`src/lib/theme.ts`), glass/glow/starfield dihapus, `prefers-reduced-motion`.
- ✅ Komponen dasar `src/ui/` (Button, Card, Badge, Field/Input/Select/Textarea, Dialog, Sheet, Tabs, Skeleton, EmptyState, PageHeader, toast + confirm via `useFeedback`). Pratinjau: `npm run dev` lalu buka `/#ui-kit` (tidak ikut build produksi). Semua `alert()`/`confirm()` sudah diganti.
- ✅ Layout: `src/components/layout/` (SiteHeader, menu seluler Sheet, SiteFooter, `navItems.ts`).
- ✅ Beranda: `src/components/home/`.
- ✅ Ibadah & Acara: `src/components/events/` (daftar, modal detail + RSVP, kalender — kalender juga dipakai Admin).
- ✅ Formulir: `src/components/dynamic-form/sections/`.
- ✅ Renungan (`devotions/`), Alkitab (`bible/`), Kidung (`songs/`), EasyWorship (`easyworship/`). Pola: logika lama dipindah apa adanya ke hook `useX.jsx`, markup ditulis ulang di `X.tsx`.
- ✅ Organisasi (`organization/`; bagan tetap memakai `#org-tree-export-container` + kelas `crew-member-card`/`org-anggota-box` untuk ekspor PDF) Galeri (`gallery/`; lightbox `role=dialog`), dan Aset (`assets/`; pratinjau selalu berlatar terang agar logo navy terbaca di mode gelap).
- ✅ Statistik pendaftaran & undian acara (`registration-stats/`, khusus admin; modal memakai `Dialog`).
- ✅ Admin — kerangka konsep B: sidebar berkelompok (`AdminTabNavigation.tsx`, Sheet di seluler), top bar aksi, ringkasan bento (`AdminSummaryBar.tsx`), login baru; notifikasi admin kini lewat `useFeedback`. Isi tiap tab masih gaya lama.
- ⏭️ Berikutnya: isi tab Admin satu per satu (mulai Ibadah & acara, Formulir, Data pendaftaran) → sisa a11y & copy. Pengumuman (announcement bar) & pencarian cepat di `App.jsx` juga masih gaya lama.

**Aturan teknis redesign:**
- Halaman yang sudah di-redesign didaftarkan di `FULL_BLEED_TABS` (`App.jsx`) agar lepas dari `.container` lama dan mengatur lebarnya sendiri (`Container`/`Section` di `home/shared.tsx`).
- Jangan pakai warna bawaan Tailwind atau modifier opasitas (`bg-navy/10`) → keduanya jadi `oklch()`/`color-mix()` yang membuat ekspor PDF bagan organisasi (html2canvas) crash. Pakai token `*-tint`/`*-line`.
- Tanpa preflight: `<button>` perlu `border-0 bg-transparent`, dan `[font:inherit]` bila membungkus teks judul; `<ul>` perlu `list-none`.
- Teks emas: komponen baru pakai `--gold-ink` (teks) / `--gold-fill` (latar tombol); `--mandiri-gold` lama bernilai kompromi.
- Tailwind v4 + design tokens (warna, tipografi, spacing, radius, light/dark + `prefers-color-scheme`).
- Komponen dasar: Button, Card, Input, Select, Dialog, Tabs, Badge, Skeleton, EmptyState, PageHeader, Toast.
- Redesign per halaman: Layout/Navbar/Footer → Home → Acara → Form → Renungan/Alkitab/Kidung → Organisasi → Galeri/Asset → Admin.
- Aksesibilitas (focus-visible, aria, kontras AA, tombol bukan `div onClick`), ganti `alert()` dengan toast, rapikan copy sisa template ("Agenda/Program Budaya" → Ibadah/Pelayanan), kurangi emoji di UI, starfield hormati `prefers-reduced-motion`.

### Fase 4 — Fitur baru (urut prioritas)
1. Halaman ganti password admin (saat ini lewat dashboard Supabase).
2. Check-in QR di lokasi acara (scan ID registrasi → tandai hadir → laporan).
3. EasyWorship/Projector lintas perangkat via Supabase Realtime.
4. SEO: `document.title` per halaman, sitemap, robots.txt, JSON-LD.
5. PWA (renungan, Alkitab, lirik bisa offline), pengingat acara, pokok doa, pencarian global, analytics ringan.

### Temuan kecil yang masih terbuka
- Rapikan sisa logika duplikat (ekstraksi nama peserta di `EventRegistrationStats.jsx`, field `_eventId` di `fields[0]` yang menduplikasi kolom `event_id`).
- `formatDeadlineWib` dan beberapa formatter lain masih memakai `new Date(y, m, d)` untuk nama hari (aman, tapi bisa diseragamkan ke helper WIB).
