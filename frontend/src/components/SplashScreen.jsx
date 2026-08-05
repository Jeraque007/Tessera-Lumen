import React from 'react';

export default function SplashScreen() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#0a0c1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      transition: 'opacity 0.5s ease-out'
    }}>
      {/* Cinematic Background Elements for instant visual parity */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, rgba(26,21,53,0.4) 0%, rgba(10,12,26,1) 70%)',
        zIndex: -1
      }} />

      <img
        src="/Logo.png"
        alt="Tessera Lumen"
        style={{
          width: '120px',
          height: 'auto',
          filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.4))',
          animation: 'pulse-slow 3s infinite ease-in-out'
        }}
      />

      <div style={{
        marginTop: '24px',
        fontFamily: "'Cinzel', serif",
        color: '#D4AF37',
        fontSize: '10px',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        opacity: 0.8,
        textShadow: '0 0 8px rgba(212,175,55,0.3)'
      }}>
        Code of Sophia
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
