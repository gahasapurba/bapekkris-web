import React, { useState, useEffect } from 'react';

// Pure Fullscreen Projector Display for 2nd Monitor / HDMI Projector
export default function ProjectorDisplay() {
  const [liveState, setLiveState] = useState(() => {
    try {
      const cached = localStorage.getItem('bapekkris_ew_live_state');
      return cached ? JSON.parse(cached) : {
        type: 'logo',
        title: 'BAPEKKRIS BANK MANDIRI',
        text: 'Badan Pembinaan Kerohanian Kristen PT Bank Mandiri (Persero) Tbk.',
        ref: '',
        isBlackout: false,
        isClearText: false,
        isLogo: true,
        isLowerThird: false,
        bgTheme: 'cathedral',
        fontSize: 48
      };
    } catch (e) {
      return { isLogo: true, bgTheme: 'cathedral' };
    }
  });

  useEffect(() => {
    // Listen to BroadcastChannel for real-time instant cross-window sync
    let channel;
    try {
      channel = new BroadcastChannel('bapekkris_easyworship');
      channel.onmessage = (event) => {
        if (event.data) {
          setLiveState(event.data);
        }
      };
    } catch (e) {}

    // Fallback storage event
    const handleStorage = (e) => {
      if (e.key === 'bapekkris_ew_live_state' && e.newValue) {
        try {
          setLiveState(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const getBackgroundStyle = () => {
    if (liveState.isBlackout) return { background: '#000000' };

    switch (liveState.bgTheme) {
      case 'heavenly':
        return {
          background: 'linear-gradient(135deg, #001c3d 0%, #003d79 40%, #ffb800 100%)'
        };
      case 'celestial':
        return {
          background: 'radial-gradient(circle at center, #003d79 0%, #021226 70%, #010814 100%)'
        };
      case 'cross':
        return {
          background: 'linear-gradient(180deg, #051329 0%, #002244 50%, #003d79 100%)'
        };
      case 'minimal':
        return { background: '#050a14' };
      case 'cathedral':
      default:
        return {
          background: 'linear-gradient(135deg, #040914 0%, #002244 45%, #003d79 80%, #040914 100%)'
        };
    }
  };

  if (liveState.isBlackout) {
    return <div style={{ width: '100vw', height: '100vh', background: '#000000' }} />;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: liveState.isLowerThird ? 'flex-end' : 'center',
      alignItems: 'center',
      overflow: 'hidden',
      color: '#ffffff',
      fontFamily: "'Inter', system-ui, sans-serif",
      transition: 'background 0.4s ease',
      zIndex: 999999,
      ...getBackgroundStyle()
    }}>
      {/* Decorative Subtle Cross & Light Rays Background */}
      {!liveState.isLowerThird && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70vw',
          height: '70vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 184, 0, 0.12) 0%, rgba(56, 189, 248, 0.05) 50%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />
      )}

      {/* 1. Logo Mode */}
      {liveState.isLogo && !liveState.isClearText && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 2,
          padding: '40px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '32px',
            background: 'linear-gradient(135deg, #003d79 0%, #001c3d 100%)',
            border: '3px solid #ffb800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            boxShadow: '0 10px 40px rgba(0, 61, 121, 0.7)',
            marginBottom: '28px'
          }}>
            ✝️
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: '#ffffff',
            margin: '0 0 14px 0',
            textShadow: '0 4px 20px rgba(0,0,0,0.8)'
          }}>
            BAPEKKRIS BANK MANDIRI
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.8rem)',
            color: '#ffb800',
            fontWeight: 700,
            margin: 0,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)'
          }}>
            Badan Pembinaan Kerohanian Kristen • PT Bank Mandiri (Persero) Tbk.
          </p>
        </div>
      )}

      {/* 2. Slide Content Mode (Songs, Bible, Announcements) */}
      {!liveState.isLogo && !liveState.isClearText && (
        <div style={{
          width: liveState.isLowerThird ? '100%' : '90%',
          maxWidth: liveState.isLowerThird ? '100%' : '1400px',
          padding: liveState.isLowerThird ? '30px 60px' : '40px',
          background: liveState.isLowerThird ? 'linear-gradient(180deg, rgba(0, 30, 60, 0.88) 0%, rgba(0, 15, 35, 0.96) 100%)' : 'transparent',
          borderTop: liveState.isLowerThird ? '3px solid #ffb800' : 'none',
          boxShadow: liveState.isLowerThird ? '0 -10px 30px rgba(0,0,0,0.6)' : 'none',
          textAlign: 'center',
          zIndex: 2
        }}>
          {/* Header Title / Scripture Reference */}
          {liveState.title && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 20px',
              borderRadius: '9999px',
              background: 'rgba(255, 184, 0, 0.22)',
              border: '1.5px solid #ffb800',
              color: '#ffb800',
              fontSize: liveState.isLowerThird ? '1.1rem' : '1.4rem',
              fontWeight: 800,
              marginBottom: liveState.isLowerThird ? '14px' : '28px',
              textShadow: '0 2px 8px rgba(0,0,0,0.7)'
            }}>
              <span>{liveState.type === 'bible' ? '📖' : '🎵'}</span>
              <span>{liveState.title}</span>
            </div>
          )}

          {/* Main Slide Text */}
          <div style={{
            fontSize: liveState.isLowerThird ? 'clamp(1.4rem, 2.5vw, 2.2rem)' : `clamp(2rem, ${liveState.fontSize || 48}px, 3.8rem)`,
            fontWeight: 800,
            lineHeight: 1.45,
            color: '#ffffff',
            textShadow: '0 4px 16px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0,0,0,0.8)',
            whiteSpace: 'pre-line',
            letterSpacing: '0.01em'
          }}>
            {liveState.text}
          </div>
        </div>
      )}
    </div>
  );
}

