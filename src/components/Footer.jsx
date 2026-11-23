import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer({ theme }) {
  const isDark = theme === 'dark';
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '1px solid var(--border-card)',
      background: 'var(--bg-nav)',
      padding: '40px 0 28px 0',
      marginTop: 'auto',
      position: 'relative',
      zIndex: 5
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Left Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src={isDark ? "/assets/mandiri-club-bapekkris-white.png" : "/assets/mandiri-club-bapekkris-original.png"} 
              alt="Bapekkris Bank Mandiri" 
              style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = "/assets/mandiri-club-bapekkris-original.png";
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                Bapekkris Bank Mandiri
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Badan Pembinaan Kerohanian Kristen • PT Bank Mandiri (Persero) Tbk.
              </div>
            </div>
          </div>

          {/* Partner Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.95 }}>
            <img 
              src={isDark ? "/assets/Mandiri/04-Mandiri White Color Alternative Logo.png" : "/assets/mandiri-logo.png"} 
              alt="Bank Mandiri" 
              style={{ height: '24px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = "/assets/mandiri-logo.png";
              }}
            />
            <div style={{ height: '20px', width: '1px', background: 'var(--border-card)' }} />
            <img 
              src={isDark ? "/assets/Danantara/negative-danantara-indonesia-horizontal-logo.png" : "/assets/danantara-logo.png"} 
              alt="Danantara Indonesia" 
              style={{ height: '22px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.src = "/assets/danantara-logo.png";
              }}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-card)',
          paddingTop: '18px',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            © {currentYear} Bapekkris Bank Mandiri. Menjadi Terang dan Garam bagi Negeri.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              Melayani dengan <Heart size={13} color="#f43f5e" fill="#f43f5e" /> Kasih & Integritas Kristus
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
