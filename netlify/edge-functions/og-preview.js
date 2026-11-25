// Serves Open Graph previews of shared event / gallery / form links to social crawlers
// (WhatsApp, Telegram, ...). Regular browsers always continue to the SPA untouched.

const SUPABASE_URL = (typeof Netlify !== "undefined" && Netlify.env?.get("VITE_SUPABASE_URL")) ||
                     (typeof Deno !== "undefined" && Deno.env?.get("VITE_SUPABASE_URL")) || "";
const SUPABASE_ANON_KEY = (typeof Netlify !== "undefined" && Netlify.env?.get("VITE_SUPABASE_ANON_KEY")) ||
                          (typeof Deno !== "undefined" && Deno.env?.get("VITE_SUPABASE_ANON_KEY")) || "";

const CRAWLER_PATTERN = /WhatsApp|facebookexternalhit|Facebot|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|SkypeUriPreview|Google-Structured-Data-Testing-Tool|bingbot|crawler|spider/i;
const FETCH_TIMEOUT_MS = 2500;
const DEFAULT_IMAGE = "/assets/mandiri-club-bapekkris-original.png";

// Each previewable resource: query params, table, hash route, and how to describe a row.
// Rows are read with the anon key, so RLS decides visibility (draft events are not returned).
const RESOURCES = [
  {
    params: ["event", "eventId"],
    table: "events",
    route: "event",
    title: (row) => `${row.title} — Kegiatan Bapekkris Bank Mandiri`,
    description: (row) => row.description || "Agenda kegiatan dan ibadah persekutuan Bapekkris PT Bank Mandiri (Persero) Tbk.",
    image: (row) => row.banner_image || row.image || row.poster_url
  },
  {
    params: ["gallery", "galleryId"],
    table: "galleries",
    route: "galeri",
    title: (row) => `${row.title} — Dokumentasi Kegiatan Bapekkris Bank Mandiri`,
    description: (row) => row.description || "Dokumentasi kegiatan persekutuan Bapekkris Bank Mandiri",
    image: (row) => (Array.isArray(row.photos) ? row.photos[0] : null)
  },
  {
    params: ["form", "formId"],
    table: "forms",
    route: "form",
    title: (row) => `${row.title} — Formulir Registrasi Bapekkris Bank Mandiri`,
    description: (row) => row.subtitle || row.description || "Formulir pendaftaran dan registrasi kegiatan resmi Bapekkris PT Bank Mandiri (Persero) Tbk.",
    image: (row) => row.banner_image || row.poster_url || row.image
  }
];

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncate(text, max = 200) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function absoluteUrl(origin, value) {
  const src = value || DEFAULT_IMAGE;
  return src.startsWith("/") ? `${origin}${src}` : src;
}

async function fetchRow(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function renderPreview({ title, ogTitle, description, image, canonicalUrl }) {
  const t = escapeHtml(title);
  const ogT = escapeHtml(ogTitle);
  const d = escapeHtml(description);
  const img = escapeHtml(image);
  const href = escapeHtml(canonicalUrl);
  // JSON-encoded for the inline script; "<" escaped so the value cannot close the tag.
  const scriptUrl = JSON.stringify(canonicalUrl).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Bapekkris Bank Mandiri" />
  <meta property="og:title" content="${ogT}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:secure_url" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${href}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogT}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />
  <meta http-equiv="refresh" content="0;url=${href}" />
</head>
<body>
  <script>window.location.replace(${scriptUrl});</script>
  <p>Membuka <a href="${href}">${ogT}</a>...</p>
</body>
</html>`;
}

export default async function handler(request, context) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return context.next();
  if (!CRAWLER_PATTERN.test(request.headers.get("user-agent") || "")) return context.next();

  const url = new URL(request.url);
  for (const resource of RESOURCES) {
    const id = resource.params.map((p) => url.searchParams.get(p)).find(Boolean);
    if (!id) continue;
    try {
      const row = await fetchRow(resource.table, id);
      if (!row) return context.next();
      const html = renderPreview({
        title: resource.title(row),
        ogTitle: row.title,
        description: truncate(resource.description(row)),
        image: absoluteUrl(url.origin, resource.image(row)),
        canonicalUrl: `${url.origin}/?${resource.params[0]}=${encodeURIComponent(row.id)}#${resource.route}`
      });
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300" }
      });
    } catch (err) {
      console.error(`OG preview for ${resource.table} failed:`, err);
      return context.next();
    }
  }
  return context.next();
}

// Shared links always point at the site root ("/?event=..."), so assets and other paths skip this function.
export const config = {
  path: "/"
};
