// Dynamic sitemap: the home page plus every public event, open form and gallery.
// Rows are read with the anon key, so RLS decides what is public (draft events are excluded).

const SUPABASE_URL = (typeof Netlify !== "undefined" && Netlify.env?.get("VITE_SUPABASE_URL")) ||
                     (typeof Deno !== "undefined" && Deno.env?.get("VITE_SUPABASE_URL")) || "";
const SUPABASE_ANON_KEY = (typeof Netlify !== "undefined" && Netlify.env?.get("VITE_SUPABASE_ANON_KEY")) ||
                          (typeof Deno !== "undefined" && Deno.env?.get("VITE_SUPABASE_ANON_KEY")) || "";
const FETCH_TIMEOUT_MS = 3000;

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function fetchRows(table, query) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    return res.ok ? await res.json() : [];
  } catch (err) {
    console.error(`sitemap: ${table} failed`, err);
    return [];
  }
}

export default async function handler(request) {
  const origin = new URL(request.url).origin;
  const [events, forms, galleries] = await Promise.all([
    fetchRows("events", "select=id,updated_at&is_public=eq.true"),
    fetchRows("forms", "select=id,updated_at&is_open=eq.true"),
    fetchRows("galleries", "select=id,updated_at")
  ]);

  const entry = (path, lastmod, priority) =>
    `  <url><loc>${escapeXml(origin + path)}</loc>${lastmod ? `<lastmod>${escapeXml(String(lastmod).slice(0, 10))}</lastmod>` : ""}<priority>${priority}</priority></url>`;
  const urls = [
    entry("/", null, "1.0"),
    ...events.map((e) => entry(`/?event=${encodeURIComponent(e.id)}`, e.updated_at, "0.8")),
    ...forms.map((f) => entry(`/?form=${encodeURIComponent(f.id)}`, f.updated_at, "0.7")),
    ...galleries.map((g) => entry(`/?gallery=${encodeURIComponent(g.id)}`, g.updated_at, "0.6"))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" }
  });
}

export const config = { path: "/sitemap.xml" };
