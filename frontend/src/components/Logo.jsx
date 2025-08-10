// frontend/src/components/Logo.jsx
import React from 'react';

const Logo = ({ size = 32, showText = false, className = '' }) => {
  return (
    <div className={`logo-container ${className}`} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: showText ? '0.75rem' : '0' 
    }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Background Circle */}
        <circle cx="32" cy="32" r="30" fill="url(#gradient1)" stroke="url(#gradient2)" strokeWidth="2"/>
        
        {/* Oracle Eye */}
        <circle cx="32" cy="28" r="12" fill="url(#gradient3)" stroke="#ffffff" strokeWidth="1.5"/>
        <circle cx="32" cy="28" r="8" fill="url(#gradient4)"/>
        <circle cx="32" cy="28" r="4" fill="#ffffff"/>
        <circle cx="33" cy="27" r="1.5" fill="#1e293b"/>
        
        {/* Lightning Bolt */}
        <path d="M28 42 L30 38 L27 38 L31 32 L29 36 L32 36 L28 42 Z" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.5"/>
        
        {/* Network Nodes */}
        <circle cx="18" cy="18" r="2" fill="#10b981"/>
        <circle cx="46" cy="18" r="2" fill="#10b981"/>
        <circle cx="18" cy="46" r="2" fill="#10b981"/>
        <circle cx="46" cy="46" r="2" fill="#10b981"/>
        
        {/* Connection Lines */}
        <line x1="20" y1="20" x2="30" y2="26" stroke="#6366f1" strokeWidth="1" opacity="0.6"/>
        <line x1="44" y1="20" x2="34" y2="26" stroke="#6366f1" strokeWidth="1" opacity="0.6"/>
        <line x1="20" y1="44" x2="30" y2="38" stroke="#6366f1" strokeWidth="1" opacity="0.6"/>
        <line x1="44" y1="44" x2="34" y2="38" stroke="#6366f1" strokeWidth="1" opacity="0.6"/>
        
        {/* Verification Checkmarks */}
        <path d="M16 16 L18 18 L22 14" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M44 16 L46 18 L50 14" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        
        {/* Gradients */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#6366f1', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#4f46e5', stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#818cf8', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#6366f1', stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#f8fafc', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#e2e8f0', stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#6366f1', stopOpacity:0.8}} />
            <stop offset="100%" style={{stopColor:'#4f46e5', stopOpacity:0.9}} />
          </linearGradient>
        </defs>
      </svg>
      
      {showText && (
        <span style={{ 
          fontWeight: '700', 
          fontSize: `${size * 0.4}px`,
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          NostrOracle
        </span>
      )}
    </div>
  );
};

export default Logo;
