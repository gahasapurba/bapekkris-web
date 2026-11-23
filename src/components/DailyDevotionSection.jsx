import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Share2, 
  Copy, 
  Download, 
  Sparkles, 
  Check, 
  Search, 
  ChevronRight, 
  Heart, 
  Send,
  MonitorPlay,
  Quote
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { formatToIndonesianDate } from '../utils/dateUtils';

export const DEFAULT_DEVOTIONS = [
  {
    id: 'dev-001',
    title: 'Kekuatan Baru di Tengah Kesibukan Kerja',
    devotionDate: new Date().toISOString().split('T')[0],
    scriptureRef: 'Yesaya 40:29-31',
    scriptureText: 'Dia memberi kekuatan kepada yang lelah dan menambah semangat kepada yang tiada berdaya... tetapi orang-orang yang menanti-nantikan TUHAN mendapat kekuatan baru: mereka seumpama rajawali yang naik terbang dengan kekuatan sayapnya.',
    body: `Sebagai insan Mandiri yang melayani nasabah, mengelola target, dan menyelesaikan tanggung jawab sehari-hari, rasa lelah baik fisik maupun emosional adalah hal yang wajar kita rasakan. Namun, firman Tuhan hari ini mengingatkan kita bahwa sumber kekuatan sejati bukan berasal dari energi manusia kita yang terbatas, melainkan dari Tuhan yang tidak pernah lelah.\n\nMenanti-nantikan Tuhan berarti mengambil waktu hening sejenak di tengah padatnya hari untuk berdoa, menyerahkan kekhawatiran kita, dan menyandarkan diri kepada pimpinan Roh Kudus. Di saat kita menyadari keterbatasan kita, di situlah kuasa Tuhan bekerja secara sempurna memulihkan semangat kita untuk kembali berkarya dengan integritas dan sukacita.`,
    prayer: 'Ya Bapa di sorga, terima kasih atas kekuatan dan penyertaan-Mu yang tidak pernah habis. Di tengah dinamika pekerjaan dan pelayananku hari ini, berikanlah hikmat, ketenangan, dan kekuatan baru dari-Mu agar setiap langkahku menjadi berkat bagi sesama dan memuliakan nama-Mu. Di dalam nama Tuhan Yesus Kristus kami berdoa. Amin.',
    author: 'Tim Rohani Bapekkris Bank Mandiri',
    theme: 'Kekuatan & Pengharapan'
  },
  {
    id: 'dev-002',
    title: 'Bekerja dengan Hati Seperti untuk Tuhan',
    devotionDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    scriptureRef: 'Kolose 3:23-24',
    scriptureText: 'Apapun juga yang kamu perbuat, perbuatlah dengan segenap hatimu seperti untuk Tuhan dan bukan untuk manusia.',
    body: `Setiap tugas yang dipercayakan kepada kita di Bank Mandiri—mulai dari melayani nasabah di garis depan, menjaga stabilitas sistem teknologi, mengelola risiko, hingga kepemimpinan operasional—adalah medan ibadah dan kesaksian kita. Ketika kita memandang pekerjaan kita sebagai persembahan bagi Tuhan, motivasi kita berubah bukan sekadar mencari pengakuan manusia, tetapi menghasilkan karya terbaik dengan penuh sukacita dan integritas.`,
    prayer: 'Tuhan Yesus, terima kasih atas pekerjaan dan talenta yang Kau anugerahkan kepadaku. Bimbinglah hatiku agar selalu tulus, jujur, dan bersemangat dalam menuntaskan setiap tanggung jawabku. Jadikanlah kehadiranku di tempat kerja membawa damai dan berkat bagi rekan kerja serta nasabah. Amin.',
    author: 'Bapekkris Bank Mandiri',
    theme: 'Integritas & Pelayanan'
  },
  {
    id: 'dev-003',
    title: 'Damai Sejahtera yang Melampaui Segala Akal',
    devotionDate: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    scriptureRef: 'Filipi 4:6-7',
    scriptureText: 'Janganlah hendaknya kamu kuatir tentang apapun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur. Damai sejahtera Allah, yang melampaui segala akal, akan memelihara hati dan pikiranmu dalam Kristus Yesus.',
    body: `Kekhawatiran sering kali datang mengetuk pintu hati kita ketika menghadapi ketidakpastian. Namun, firman Tuhan memberikan resep yang penuh kuasa: ubahlah kekhawatiran menjadi doa dengan ucapan syukur. Saat kita menyerahkan masa depan dan pergumulan kita ke tangan Tuhan, damai sejahtera surgawi yang tak terjelaskan oleh akal akan membentengi hati dan pikiran kita dari kepanikan.`,
    prayer: 'Bapa yang baik, aku menyerahkan segala kekhawatiran dan beban hidupku ke dalam tangan-Mu. Penuhilah hatiku dengan damai sejahtera-Mu yang melampaui akal pikiran manusia, agar aku tetap tenang dan teguh melangkah bersama-Mu. Dalam nama Yesus, Amin.',
    author: 'Tim Bapekkris',
    theme: 'Damai Sejahtera'
  }
];

export default function DailyDevotionSection({
  devotions = [],
  theme,
  onNavigate,
  onSendToEasyWorship
}) {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [copied, setCopied] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // Combine custom devotions from Supabase with curated built-in devotions
  const combinedDevotions = useMemo(() => {
    const list = [...(devotions || [])];
    DEFAULT_DEVOTIONS.forEach(dd => {
      if (!list.some(d => d.title.toLowerCase() === dd.title.toLowerCase() || d.id === dd.id)) {
        list.push(dd);
      }
    });
    return list;
  }, [devotions]);

  // Default selection is the first / latest devotion if available
  const sortedDevotions = [...combinedDevotions].sort((a, b) => {
    return new Date(b.devotionDate || b.createdAt || 0) - new Date(a.devotionDate || a.createdAt || 0);
  });

  const [activeDevotionId, setActiveDevotionId] = useState(sortedDevotions[0]?.id || null);

  const activeDevotion = sortedDevotions.find(d => d.id === activeDevotionId) || sortedDevotions[0] || null;

  const themesList = Array.from(new Set(sortedDevotions.map(d => d.theme).filter(Boolean)));

  const filteredDevotions = sortedDevotions.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (d.title || '').toLowerCase().includes(q) ||
      (d.scriptureRef || '').toLowerCase().includes(q) ||
      (d.body || '').toLowerCase().includes(q) ||
      (d.author || '').toLowerCase().includes(q);
    const matchesTheme = selectedTheme === 'all' || d.theme === selectedTheme;
    return matchesSearch && matchesTheme;
  });

  const handleCopyText = (devotion) => {
    if (!devotion) return;
    const text = `📖 *RENUNGAN HARIAN BAPEKKRIS BANK MANDIRI*\n📅 ${formatToIndonesianDate(devotion.devotionDate)}\n\n✨ *${devotion.title}*\n📜 Nats: ${devotion.scriptureRef}\n"${devotion.scriptureText || ''}"\n\n${devotion.body}\n\n🙏 *Doa:*\n${devotion.prayer || ''}\n\n✍️ Oleh: ${devotion.author || 'Bapekkris Bank Mandiri'}\n🔗 https://bapekkris-mandiri.netlify.app/#renungan`;
    
    try {
      navigator.clipboard.writeText(text);
      soundFx.playClick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleShareWhatsApp = (devotion) => {
    if (!devotion) return;
    soundFx.playClick();
    const text = `📖 *RENUNGAN HARIAN BAPEKKRIS BANK MANDIRI*\n📅 ${formatToIndonesianDate(devotion.devotionDate)}\n\n✨ *${devotion.title}*\n📜 Nats: ${devotion.scriptureRef}\n"${devotion.scriptureText || ''}"\n\n${devotion.body?.slice(0, 400)}...\n\n🙏 *Doa:*\n${devotion.prayer || ''}\n\n✍️ Oleh: ${devotion.author || 'Bapekkris Bank Mandiri'}\n\nBaca selengkapnya di:\nhttps://bapekkris-mandiri.netlify.app/#renungan`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadCard = async (devotion) => {
    if (!devotion || isGeneratingCard) return;
    setIsGeneratingCard(true);
    soundFx.playClick();

    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1440;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Background Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#001c3d');
      grad.addColorStop(0.5, '#003d79');
      grad.addColorStop(1, '#051329');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Gold Glow Accents
      const goldGlow = ctx.createRadialGradient(width - 150, 150, 20, width - 150, 150, 450);
      goldGlow.addColorStop(0, 'rgba(255, 184, 0, 0.35)');
      goldGlow.addColorStop(1, 'rgba(255, 184, 0, 0)');
      ctx.fillStyle = goldGlow;
      ctx.fillRect(0, 0, width, height);

      // Decorative Border
      ctx.strokeStyle = 'rgba(255, 184, 0, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, 50, width - 100, height - 100);

      // Header Tag
      ctx.fillStyle = '#ffb800';
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✝️  BAPEKKRIS PT BANK MANDIRI (PERSERO) TBK.', width / 2, 120);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`RENUNGAN HARIAN  •  ${formatToIndonesianDate(devotion.devotionDate).toUpperCase()}`, width / 2, 160);

      // Devotion Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';

      // Wrap Title
      const titleWords = (devotion.title || 'Renungan Firman').split(' ');
      let titleLine = '';
      let titleY = 240;
      for (const word of titleWords) {
        const testLine = titleLine + word + ' ';
        if (ctx.measureText(testLine).width > width - 180) {
          ctx.fillText(titleLine.trim(), width / 2, titleY);
          titleLine = word + ' ';
          titleY += 56;
        } else {
          titleLine = testLine;
        }
      }
      ctx.fillText(titleLine.trim(), width / 2, titleY);

      // Scripture Box
      const scriptureY = titleY + 40;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(100, scriptureY, width - 200, 180);
      ctx.strokeStyle = '#ffb800';
      ctx.lineWidth = 2;
      ctx.strokeRect(100, scriptureY, width - 200, 180);

      ctx.fillStyle = '#ffb800';
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`📖 ${devotion.scriptureRef || ''}`, 130, scriptureY + 48);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'italic 24px "Plus Jakarta Sans", sans-serif';
      const quoteText = `"${(devotion.scriptureText || '').slice(0, 160)}..."`;
      ctx.fillText(quoteText, 130, scriptureY + 95, width - 260);

      // Reflection Body Preview
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '22px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';

      const bodyText = (devotion.body || '').slice(0, 320) + '...';
      const words = bodyText.split(' ');
      let line = '';
      let textY = scriptureY + 240;
      for (const w of words) {
        const testL = line + w + ' ';
        if (ctx.measureText(testL).width > width - 220) {
          ctx.fillText(line.trim(), 110, textY);
          line = w + ' ';
          textY += 36;
        } else {
          line = testL;
        }
      }
      ctx.fillText(line.trim(), 110, textY);

      // Prayer Box
      if (devotion.prayer) {
        const prayerY = textY + 40;
        ctx.fillStyle = '#ffb800';
        ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`🙏 Doa:`, 110, prayerY);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'italic 20px "Plus Jakarta Sans", sans-serif';
        const prayerSnippet = `"${devotion.prayer.slice(0, 180)}..."`;
        ctx.fillText(prayerSnippet, 110, prayerY + 36, width - 220);
      }

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`bapekkris-mandiri.netlify.app  •  Penulis: ${devotion.author || 'Bapekkris Bank Mandiri'}`, width / 2, height - 90);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `renungan-bapekkris-${(devotion.title || 'harian').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download card error', e);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  return (
    <div className="daily-devotion-wrapper" style={{ padding: '40px 0 80px 0', position: 'relative', zIndex: 10 }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px, 3vw, 32px)' }}>
        
        {/* Header Title */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 40px auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 184, 0, 0.15)',
            border: '1px solid rgba(255, 184, 0, 0.35)',
            color: 'var(--mandiri-gold)',
            fontSize: '0.78rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} />
            <span>Santapan Rohani Harian</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: 900,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
            marginBottom: '14px'
          }}>
            RENUNGAN <span style={{
              background: 'linear-gradient(135deg, #ffb800 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>HARIAN</span>
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
            Awali hari bersama firman Tuhan. Wadah pembinaan kerohanian, refleksi firman, dan doa bersama bagi seluruh insan Kristen Bank Mandiri di seluruh Indonesia.
          </p>
        </div>

        {/* Content Layout: Left Featured Devotion, Right Archive/Calendar */}
        {sortedDevotions.length === 0 ? (
          <div className="glass-panel" style={{
            padding: '60px 24px',
            textAlign: 'center',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-card)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}>📖</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Belum Ada Renungan Harian
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto' }}>
              Renungan harian belum ditambahkan. Admin Bapekkris dapat mempublikasikan renungan firman melalui menu <strong>Admin Portal &gt; Kelola Renungan Harian</strong>.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)',
            gap: '30px',
            alignItems: 'start'
          }} className="devotion-grid-layout">
            
            {/* Active Devotion Card */}
            {activeDevotion && (
              <div className="glass-panel" style={{
                padding: 'clamp(24px, 3.5vw, 42px)',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--mandiri-gold)',
                boxShadow: 'var(--shadow-card)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Spiritual Golden Accent bar on top */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #ffb800, #38bdf8, #ffb800)'
                }} />

                {/* Date & Thematic Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mandiri-gold)', fontSize: '0.88rem', fontWeight: 700 }}>
                    <Calendar size={16} />
                    <span>{formatToIndonesianDate(activeDevotion.devotionDate)}</span>
                  </div>

                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 61, 121, 0.08)',
                    color: isDark ? '#38bdf8' : '#003d79',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}>
                    {activeDevotion.theme || 'Iman & Pengharapan'}
                  </span>
                </div>

                {/* Title */}
                <h2 style={{
                  fontSize: 'clamp(1.6rem, 2.8vw, 2.2rem)',
                  fontWeight: 900,
                  color: 'var(--text-main)',
                  lineHeight: 1.3,
                  marginBottom: '22px'
                }}>
                  {activeDevotion.title}
                </h2>

                {/* Scripture Nats Reading Box */}
                <div style={{
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-md)',
                  background: isDark ? 'rgba(255, 184, 0, 0.08)' : 'rgba(255, 184, 0, 0.12)',
                  borderLeft: '4px solid var(--mandiri-gold)',
                  marginBottom: '28px',
                  position: 'relative'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: 'var(--mandiri-gold)'
                    }}>
                      <BookOpen size={16} />
                      <span>{activeDevotion.scriptureRef}</span>
                    </span>

                    {onSendToEasyWorship && (
                      <button
                        type="button"
                        onClick={() => onSendToEasyWorship({
                          type: 'bible',
                          title: activeDevotion.scriptureRef,
                          text: activeDevotion.scriptureText || ''
                        })}
                        title="Tampilkan ayat ini di Layar EasyWorship Multimedia"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(56, 189, 248, 0.18)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: isDark ? '#38bdf8' : '#0284c7',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <MonitorPlay size={13} />
                        <span>Kirim ke EasyWorship</span>
                      </button>
                    )}
                  </div>

                  {activeDevotion.scriptureText && (
                    <p style={{
                      fontSize: '0.98rem',
                      fontStyle: 'italic',
                      color: 'var(--text-main)',
                      lineHeight: 1.6,
                      margin: 0
                    }}>
                      "{activeDevotion.scriptureText}"
                    </p>
                  )}
                </div>

                {/* Devotion Reflection Body */}
                <div style={{
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  marginBottom: '32px',
                  whiteSpace: 'pre-line'
                }}>
                  {activeDevotion.body}
                </div>

                {/* Closing Prayer Box */}
                {activeDevotion.prayer && (
                  <div style={{
                    padding: '20px 24px',
                    borderRadius: 'var(--radius-md)',
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid var(--border-card)',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      color: 'var(--mandiri-gold)',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>🙏</span>
                      <span>DOA PENUTUP:</span>
                    </div>
                    <p style={{
                      fontSize: '0.92rem',
                      fontStyle: 'italic',
                      lineHeight: 1.65,
                      color: 'var(--text-muted)',
                      margin: 0
                    }}>
                      "{activeDevotion.prayer}"
                    </p>
                  </div>
                )}

                {/* Author Info & Interactive Share Toolbar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-card)',
                  paddingTop: '20px',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Direfleksikan Oleh:</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {activeDevotion.author || 'Bapekkris Bank Mandiri'}
                    </div>
                  </div>

                  {/* Share Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyText(activeDevotion)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: copied ? '#10b981' : 'var(--text-main)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(activeDevotion)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(37, 211, 102, 0.15)',
                        border: '1px solid rgba(37, 211, 102, 0.5)',
                        color: '#25d366',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Share2 size={14} />
                      <span>Kirim WA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadCard(activeDevotion)}
                      disabled={isGeneratingCard}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--mandiri-gold)',
                        border: 'none',
                        color: '#040914',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: isGeneratingCard ? 'wait' : 'pointer',
                        boxShadow: '0 2px 10px rgba(255, 184, 0, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Download size={14} />
                      <span>{isGeneratingCard ? 'Membuat...' : 'Download Gambar'}</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Right Column: Devotions Archive & Filter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="glass-panel" style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Arsip Renungan ({filteredDevotions.length})
                  </h3>
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Cari renungan atau ayat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>

                {/* Theme Filter */}
                {themesList.length > 0 && (
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <option value="all">Semua Tema Renungan</option>
                    {themesList.map(th => (
                      <option key={th} value={th}>{th}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Devotion List Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '720px', overflowY: 'auto' }}>
                {filteredDevotions.map((dev) => {
                  const isSelected = activeDevotion?.id === dev.id;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => {
                        soundFx.playClick();
                        setActiveDevotionId(dev.id);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      className="glass-panel glass-panel-hover"
                      style={{
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        border: isSelected ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                        background: isSelected ? (isDark ? 'rgba(255, 184, 0, 0.1)' : 'rgba(255, 184, 0, 0.08)') : 'var(--bg-card)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--mandiri-gold)', fontWeight: 700 }}>
                          {formatToIndonesianDate(dev.devotionDate)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          {dev.scriptureRef}
                        </span>
                      </div>

                      <h4 style={{
                        fontSize: '0.94rem',
                        fontWeight: 800,
                        color: 'var(--text-main)',
                        margin: '0 0 6px 0',
                        lineHeight: 1.3
                      }}>
                        {dev.title}
                      </h4>

                      <p style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4
                      }}>
                        {dev.body}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

