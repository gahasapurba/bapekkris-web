import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock, ExternalLink, Lock, MapPin, Sparkles, Users } from 'lucide-react';
import { formatToIndonesianDate, formatWibEventRange, getDeadlineStatus } from '../../utils/dateUtils';
import { useEventRegistrationStats } from './useEventRegistrationStats';
import { RegistrationStatsContext } from './RegistrationStatsContext';
import ViewSwitcher from './sections/ViewSwitcher';
import StatsView from './sections/StatsView';
import LuckyDrawView from './sections/LuckyDrawView';
import LatestWinnersModal from './sections/LatestWinnersModal';
import ResetDrawConfirmModal from './sections/ResetDrawConfirmModal';
import DeleteWinnerConfirmModal from './sections/DeleteWinnerConfirmModal';
import PosterModal from './sections/PosterModal';
import DrawAlert from './sections/DrawAlert';

/**
 * Values the hook exposes. Keys are checked; values stay `any` because the hook is still
 * JavaScript, where TypeScript would infer `useState(null)` as always-null.
 */
export type RegistrationStatsState = { [K in keyof ReturnType<typeof useEventRegistrationStats>]: any };

export default function EventRegistrationStats(props: any) {
  const state: RegistrationStatsState = useEventRegistrationStats(props);
  const {
    activeAlert,
    activeView,
    connectedForm,
    effectiveIsLimited,
    effectiveMaxQuota,
    event,
    isDark,
    isFormClosed,
    isLuckyDrawEnabled,
    latestWinners,
    navigateTo,
    onBack,
    onNavigateForm,
    participationRate,
    posterModal,
    resetConfirmOpen,
    showLatestWinnersModal,
    totalPendaftar,
    winnerToDelete
  } = state;

  if (!event) {
    return (
      <div style={{ maxWidth: '680px', margin: '48px auto', textAlign: 'center', padding: '16px', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '44px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          border: '1.5px solid rgba(244, 63, 94, 0.4)',
          background: isDark
            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(14, 25, 55, 0.95) 100%)'
            : 'linear-gradient(135deg, #fff1f2 0%, #ffffff 100%)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#f43f5e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={34} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
              Halaman Statistik Acara Tidak Ditemukan
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              Agenda kegiatan atau event yang Anda tuju mungkin telah dihapus, dipindahkan, atau tautan statistik tidak valid.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                navigateTo('/#home');
              }}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--mandiri-gold)',
                color: '#040914',
                fontWeight: 800,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Kembali ke Beranda
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Kembali ke Daftar Event
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <RegistrationStatsContext.Provider value={state}>
      <div style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '0 14px 80px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px'
      }}>
        {/* 1. TOP NAV & REALTIME STATUS BAR */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '10px 0',
          borderBottom: '1px solid var(--border-card)'
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Kalender Event</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Live Realtime Sync Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.74rem',
              color: '#10b981',
              fontWeight: 700
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981'
              }} />
              <span>Realtime Aktif</span>
            </div>

            {connectedForm && (
              <button
                onClick={() => {
                  if (isFormClosed) return;
                  onNavigateForm && onNavigateForm(connectedForm.id);
                }}
                disabled={isFormClosed}
                title={isFormClosed ? 'Formulir telah ditutup' : 'Buka formulir pendaftaran'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isFormClosed ? 'rgba(239, 68, 68, 0.1)' : 'var(--input-bg)',
                  border: isFormClosed ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border-card)',
                  color: isFormClosed ? '#f87171' : 'var(--text-main)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: isFormClosed ? 'not-allowed' : 'pointer',
                  opacity: isFormClosed ? 0.85 : 1
                }}
              >
                {isFormClosed ? <Lock size={13} /> : <ExternalLink size={13} />}
                <span>{isFormClosed ? 'Formulir Telah Ditutup' : 'Buka Form'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. EVENT & FORM HERO HEADER */}
        <div className="glass-panel" style={{
          padding: '22px 24px',
          border: '1.5px solid var(--mandiri-blue)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            {(() => {
              const s = event?.startDate || event?.date || '';
              const e = event?.endDate || s;
              const sRawDate = s.slice(0, 10);
              const eRawDate = e.slice(0, 10);

              let eventDateDisplay = 'Tanggal Agenda';
              if (/^\d{4}-\d{2}-\d{2}$/.test(sRawDate) && /^\d{4}-\d{2}-\d{2}$/.test(eRawDate)) {
                if (sRawDate === eRawDate) {
                  eventDateDisplay = formatToIndonesianDate(sRawDate);
                } else {
                  eventDateDisplay = formatWibEventRange(sRawDate, eRawDate);
                }
              } else if (s || e) {
                eventDateDisplay = formatWibEventRange(s, e, event?.date || 'Tanggal Agenda');
              }

              let eventTimeDisplay = null;
              if (event?.time && event.time !== 'WIB') {
                eventTimeDisplay = event.time;
              } else {
                const sHasTime = s.includes('T') || /\d{2}:\d{2}/.test(s);
                if (sHasTime) {
                  const sTime = s.includes('T') ? s.split('T')[1]?.slice(0, 5) : s.match(/\d{2}:\d{2}/)?.[0];
                  const eTime = e.includes('T') ? e.split('T')[1]?.slice(0, 5) : e.match(/\d{2}:\d{2}/)?.[0];
                  if (sTime && eTime && sTime !== eTime) {
                    eventTimeDisplay = `${sTime} - ${eTime} WIB`;
                  } else if (sTime) {
                    eventTimeDisplay = `${sTime} WIB`;
                  }
                }
              }

              return (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 184, 0, 0.15)', border: '1px solid var(--mandiri-gold)', color: 'var(--mandiri-gold)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                    <Sparkles size={13} />
                    <span>{isLuckyDrawEnabled ? 'Dashboard Analitik & Undian Acara' : 'Dashboard Analitik Acara'}</span>
                  </div>
                  <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 8px 0', lineHeight: 1.25 }}>
                    {event.title}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="var(--mandiri-gold)" />
                      <span>{eventDateDisplay}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="var(--neon-cyan)" />
                      <span>{event.location || 'Direktorat IT Bank Mandiri'}</span>
                    </div>
                    {eventTimeDisplay && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#10b981" />
                        <span>{eventTimeDisplay}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Connected Form Pill Banner */}
            {connectedForm ? (
              <div style={{
                background: isFormClosed
                  ? (isDark ? 'rgba(239, 68, 68, 0.08)' : '#fef2f2')
                  : 'rgba(56, 189, 248, 0.08)',
                border: isFormClosed
                  ? '1px solid rgba(239, 68, 68, 0.35)'
                  : '1px solid rgba(56, 189, 248, 0.35)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                maxWidth: '340px',
                width: '100%'
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: isFormClosed ? '#f87171' : 'var(--neon-cyan)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  marginBottom: '3px'
                }}>
                  🔗 Formulir Pendaftaran Terhubung
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                  {connectedForm.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {effectiveIsLimited && effectiveMaxQuota > 0 ? `Kuota Form: ${effectiveMaxQuota} Peserta` : 'Kuota Form: Tanpa Batas'} • {(() => {
                    if (isFormClosed) {
                      const dl = connectedForm.deadline ? getDeadlineStatus(connectedForm.deadline) : null;
                      if (dl?.isExpired) {
                        return <span style={{ color: '#f87171', fontWeight: 700 }}>🔴 Ditutup (Batas Waktu Berakhir)</span>;
                      }
                      return <span style={{ color: '#f87171', fontWeight: 700 }}>🔴 Formulir Ditutup</span>;
                    }
                    const isQuotaFull = effectiveIsLimited && effectiveMaxQuota > 0 && totalPendaftar >= effectiveMaxQuota;
                    if (isQuotaFull) {
                      return <span style={{ color: '#f87171', fontWeight: 700 }}>🔒 Kuota Penuh</span>;
                    }
                    return <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 Pendaftaran Dibuka</span>;
                  })()}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 184, 0, 0.08)',
                border: '1px dashed var(--mandiri-gold)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.76rem',
                color: 'var(--mandiri-gold)'
              }}>
                ⚠️ Event ini belum terhubung ke Formulir Pendaftaran khusus.
              </div>
            )}
          </div>
        </div>

        {/* 3. REPLACED METRICS: SINGLE WIDE BANNER CARD (IMAGE 2 STYLE) */}
        <div
          className="glass-panel"
          style={{
            padding: 'clamp(16px, 3vw, 24px)',
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid rgba(255, 184, 0, 0.35)',
            background: isDark
              ? 'linear-gradient(135deg, rgba(255, 184, 0, 0.06) 0%, rgba(6, 182, 212, 0.04) 100%)'
              : 'linear-gradient(135deg, #fffbeb 0%, #ecfeff 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            {/* Left: Total Pendaftar Count */}
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                TOTAL PESERTA HADIR ({event.title.toUpperCase()})
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 900, color: 'var(--mandiri-gold)', lineHeight: 1 }}>
                  {totalPendaftar}
                </span>
                {effectiveIsLimited && effectiveMaxQuota > 0 ? (
                  <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)', fontWeight: 600, color: 'var(--text-muted)' }}>
                    / {effectiveMaxQuota} Target Peserta
                  </span>
                ) : (
                  <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Peserta Terdaftar
                  </span>
                )}
              </div>
            </div>

            {/* Right: Tingkat Partisipasi (if limited) OR Unlimited Badge */}
            {effectiveIsLimited && effectiveMaxQuota > 0 ? (
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  Tingkat Partisipasi
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
                  <span style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: 'var(--mandiri-gold)', lineHeight: 1 }}>
                    {participationRate}%
                  </span>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255, 184, 0, 0.12)',
                    border: '1.5px solid rgba(255, 184, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(255, 184, 0, 0.2)'
                  }}>
                    <Users size={22} color="var(--mandiri-gold)" />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10b981',
                fontSize: '0.82rem',
                fontWeight: 800
              }}>
                <CheckCircle2 size={16} />
                <span>Tanpa Batasan Kuota Peserta (Unlimited)</span>
              </div>
            )}
          </div>

          {/* Sleek Horizontal Progress Bar (Only when quota target exists) */}
          {effectiveIsLimited && effectiveMaxQuota > 0 && (
            <div style={{
              width: '100%',
              height: '7px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${participationRate}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--mandiri-gold) 0%, #fbbf24 100%)',
                borderRadius: '999px',
                boxShadow: '0 0 12px rgba(255, 184, 0, 0.5)',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          )}
        </div>

        {/* 4. SUB-PAGE TAB SWITCHER: 'stats' vs 'luckydraw' (if isLuckyDraw is enabled) */}
        {isLuckyDrawEnabled && <ViewSwitcher />}

        {/* =========================================================================
            VIEW A: QR CODE SCAN + DYNAMIC DIAGRAM + RESPONDENT TABLE
            ========================================================================= */}
        {(!isLuckyDrawEnabled || activeView === 'stats') && <StatsView />}

        {/* =========================================================================
            VIEW B: LUCKY DRAW / DOORPRIZE SYSTEM (STRICTLY FORM REGISTRANTS)
            ========================================================================= */}
        {isLuckyDrawEnabled && activeView === 'luckydraw' && <LuckyDrawView />}

        {/* =========================================================================
            MODAL 1: LATEST WINNERS POPUP CELEBRATION (DISPLAYS ALL SUBMITTED DATA)
            ========================================================================= */}
        {showLatestWinnersModal && latestWinners.length > 0 && <LatestWinnersModal />}

        {/* =========================================================================
            MODAL 2: RESET CONFIRMATION
            ========================================================================= */}
        {resetConfirmOpen && <ResetDrawConfirmModal />}

        {/* =========================================================================
            MODAL 3: DELETE SINGLE WINNER CONFIRMATION
            ========================================================================= */}
        {winnerToDelete && <DeleteWinnerConfirmModal />}

        {/* =========================================================================
            MODAL 3: POSTER QR PREVIEW (OPTIMAL MOBILE & DESKTOP)
            ========================================================================= */}
        {posterModal && <PosterModal />}

        {/* =========================================================================
            REALTIME WELCOME ALERT (BOTTOM-RIGHT SEQUENTIAL FIFO TOAST)
            ========================================================================= */}
        {activeAlert && <DrawAlert />}
      </div>
    </RegistrationStatsContext.Provider>
  );
}
