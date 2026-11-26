import { useMemo, useState } from 'react';
import { formatToIndonesianDate } from '../../utils/dateUtils';
import { usePageIntent } from '../../lib/pageIntent';
import type { AppItem } from '../../lib/supabase';
import type { SendToProjector } from '../../types/content';
import { soundFx } from '../../utils/audio';

interface UseDevotionsProps {
  devotions?: AppItem[];
  onSendToEasyWorship?: SendToProjector;
}

/** State, data and handlers of DailyDevotionSection; the markup lives in DailyDevotionSection.tsx and ./sections. */
export function useDevotions({ devotions = [], onSendToEasyWorship }: UseDevotionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [copied, setCopied] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const sortedDevotions = useMemo(() => {
    const time = (d: AppItem) => new Date(d.devotionDate || d.createdAt || 0).getTime();
    return [...devotions].sort((a, b) => time(b) - time(a));
  }, [devotions]);

  const [activeDevotionId, setActiveDevotionId] = useState<string | null>(sortedDevotions[0]?.id || null);
  usePageIntent('renungan', ({ devotionId }) => {
    setSearchQuery('');
    setSelectedTheme('all');
    setActiveDevotionId(devotionId);
  });

  const activeDevotion = sortedDevotions.find(d => d.id === activeDevotionId) || sortedDevotions[0] || null;

  const themesList: string[] = Array.from(new Set(sortedDevotions.map(d => d.theme).filter(Boolean)));

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

  const handleCopyText = (devotion: AppItem | null) => {
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

  const handleShareWhatsApp = (devotion: AppItem | null) => {
    if (!devotion) return;
    soundFx.playClick();
    const text = `📖 *RENUNGAN HARIAN BAPEKKRIS BANK MANDIRI*\n📅 ${formatToIndonesianDate(devotion.devotionDate)}\n\n✨ *${devotion.title}*\n📜 Nats: ${devotion.scriptureRef}\n"${devotion.scriptureText || ''}"\n\n${devotion.body?.slice(0, 400)}...\n\n🙏 *Doa:*\n${devotion.prayer || ''}\n\n✍️ Oleh: ${devotion.author || 'Bapekkris Bank Mandiri'}\n\nBaca selengkapnya di:\nhttps://bapekkris-mandiri.netlify.app/#renungan`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadCard = async (devotion: AppItem | null) => {
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
      if (!ctx) throw new Error('Canvas 2D tidak tersedia');

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
      ctx.font = 'bold 24px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✝️  BAPEKKRIS PT BANK MANDIRI (PERSERO) TBK.', width / 2, 120);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 22px "Inter", sans-serif';
      ctx.fillText(`RENUNGAN HARIAN  •  ${formatToIndonesianDate(devotion.devotionDate).toUpperCase()}`, width / 2, 160);

      // Devotion Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px "Inter", sans-serif';
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
      ctx.font = 'bold 26px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`📖 ${devotion.scriptureRef || ''}`, 130, scriptureY + 48);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'italic 24px "Inter", sans-serif';
      const quoteText = `"${(devotion.scriptureText || '').slice(0, 160)}..."`;
      ctx.fillText(quoteText, 130, scriptureY + 95, width - 260);

      // Reflection Body Preview
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '22px "Inter", sans-serif';
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
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText(`🙏 Doa:`, 110, prayerY);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'italic 20px "Inter", sans-serif';
        const prayerSnippet = `"${devotion.prayer.slice(0, 180)}..."`;
        ctx.fillText(prayerSnippet, 110, prayerY + 36, width - 220);
      }

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '600 20px "Inter", sans-serif';
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

  return {
    activeDevotion,
    copied,
    filteredDevotions,
    handleCopyText,
    handleDownloadCard,
    handleShareWhatsApp,
    isGeneratingCard,
    onSendToEasyWorship,
    searchQuery,
    selectedTheme,
    setActiveDevotionId,
    setSearchQuery,
    setSelectedTheme,
    sortedDevotions,
    themesList
  };
}
