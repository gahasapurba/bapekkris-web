import { useState } from 'react';
import { Check, ExternalLink, Link2, MessageCircle } from 'lucide-react';
import { Button, ButtonLink } from '../../../ui';

/** Notes the organisers attach to a form (shown after submitting), with a WhatsApp group link if present. */
export function PostSubmissionNotes({ notes }: { notes?: string }) {
  const [copied, setCopied] = useState(false);
  const text = (notes || '').trim();
  if (!text) return null;
  const waUrl = text.match(/(https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/[^\s]+)/i)?.[0] || null;
  return (
    <div className="rounded-lg border border-line bg-page p-5 text-left">
      <p className="flex items-center gap-2 font-semibold text-ink"><MessageCircle size={17} aria-hidden="true" className="text-gold-ink" />Informasi dari panitia</p>
      <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-relaxed text-muted">{text}</p>
      {waUrl && (
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={waUrl} target="_blank" rel="noopener noreferrer" variant="primary" icon={<MessageCircle size={16} aria-hidden="true" />} iconRight={<ExternalLink size={14} aria-hidden="true" />}>
            Gabung grup WhatsApp peserta
          </ButtonLink>
          <Button variant="secondary" icon={copied ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />}
            onClick={() => { navigator.clipboard?.writeText(waUrl); setCopied(true); setTimeout(() => setCopied(false), 2500); }}>
            {copied ? 'Tautan tersalin' : 'Salin tautan grup'}
          </Button>
        </div>
      )}
    </div>
  );
}
