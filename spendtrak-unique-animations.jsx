import React, { useState, useEffect } from 'react';

const C = {
  neon: '#00ff88',
  bright: '#00e67a',
  primary: '#00cc6a',
  medium: '#00a858',
  deep: '#008545',
  dark: '#004d2a',
  darker: '#002a17',
  deepest: '#001a0f',
  void: '#000000',
};

const SpendTrakUniqueAnimations = () => {
  const [time, setTime] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 1), 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  // ============================================
  // UNIQUE ANIMATED ICONS
  // ============================================

  // 🏠 HOME ICON - Door glows warmly, chimney has rising smoke particles
  const HomeIcon = ({ size = 24 }) => {
    const doorGlow = 0.3 + Math.sin(time * 0.08) * 0.3;
    const smokeY1 = (time * 0.5) % 8;
    const smokeY2 = ((time * 0.5) + 4) % 8;
    const smokeOpacity1 = 1 - (smokeY1 / 8);
    const smokeOpacity2 = 1 - (smokeY2 / 8);

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="homeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
          <filter id="homeGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        
        {/* Chimney smoke particles */}
        <circle cx="17" cy={1 - smokeY1} r="1" fill={C.primary} opacity={smokeOpacity1 * 0.6} />
        <circle cx="17.5" cy={2 - smokeY2} r="0.7" fill={C.primary} opacity={smokeOpacity2 * 0.4} />
        
        {/* House structure */}
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z"
          stroke="url(#homeGrad)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#homeGlow)"
        />
        
        {/* Warm door glow */}
        <rect x="9.5" y="15.5" width="5" height="5" rx="0.5" fill={C.neon} opacity={doorGlow} />
      </svg>
    );
  };

  // 📷 SCAN ICON - Scanning line moves across, corners pulse inward
  const ScanIcon = ({ size = 24 }) => {
    const scanY = 7 + ((time * 0.3) % 10);
    const cornerPulse = 1 - Math.sin(time * 0.1) * 0.15;
    const scanGlow = 0.5 + Math.sin(time * 0.2) * 0.3;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
          <filter id="scanLineGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        
        {/* Animated corners - pulse inward */}
        <g transform={`translate(${(1-cornerPulse)*2}, ${(1-cornerPulse)*2})`}>
          <path d="M4 7V5a2 2 0 012-2h2" stroke="url(#scanGrad)" strokeWidth={1.5} strokeLinecap="round" />
        </g>
        <g transform={`translate(${-(1-cornerPulse)*2}, ${(1-cornerPulse)*2})`}>
          <path d="M16 3h2a2 2 0 012 2v2" stroke="url(#scanGrad)" strokeWidth={1.5} strokeLinecap="round" />
        </g>
        <g transform={`translate(${-(1-cornerPulse)*2}, ${-(1-cornerPulse)*2})`}>
          <path d="M20 17v2a2 2 0 01-2 2h-2" stroke="url(#scanGrad)" strokeWidth={1.5} strokeLinecap="round" />
        </g>
        <g transform={`translate(${(1-cornerPulse)*2}, ${-(1-cornerPulse)*2})`}>
          <path d="M8 21H6a2 2 0 01-2-2v-2" stroke="url(#scanGrad)" strokeWidth={1.5} strokeLinecap="round" />
        </g>
        
        {/* Center frame */}
        <rect x="7" y="7" width="10" height="10" rx="1" stroke="url(#scanGrad)" strokeWidth={1.5} opacity={0.5} />
        
        {/* Scanning line */}
        <line 
          x1="8" y1={scanY} x2="16" y2={scanY} 
          stroke={C.neon} 
          strokeWidth={2} 
          strokeLinecap="round"
          opacity={scanGlow}
          filter="url(#scanLineGlow)"
        />
        
        {/* Scan glow area */}
        <rect x="7" y={scanY - 1} width="10" height="2" fill={C.neon} opacity={scanGlow * 0.2} />
      </svg>
    );
  };

  // ➕ PLUS ICON - Plus pulses like heartbeat, rotates slightly
  const AddIcon = ({ size = 24 }) => {
    const heartbeat = 1 + Math.sin(time * 0.15) * 0.12;
    const rotation = Math.sin(time * 0.05) * 8;
    const glowIntensity = 0.3 + Math.sin(time * 0.15) * 0.3;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="addGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
          <filter id="addGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        
        {/* Pulsing glow background */}
        <circle cx="12" cy="12" r={6 * heartbeat} fill={C.primary} opacity={glowIntensity * 0.3} />
        
        {/* Rotating, pulsing plus */}
        <g transform={`rotate(${rotation} 12 12) scale(${heartbeat})`} transform-origin="12 12">
          <line x1="12" y1="5" x2="12" y2="19" stroke="url(#addGrad)" strokeWidth={2.5} strokeLinecap="round" filter="url(#addGlow)" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="url(#addGrad)" strokeWidth={2.5} strokeLinecap="round" filter="url(#addGlow)" />
        </g>
      </svg>
    );
  };

  // 🔄 BILLS/REFRESH ICON - Arrow rotates continuously
  const BillsIcon = ({ size = 24 }) => {
    const rotation = (time * 2) % 360;
    const pulseOpacity = 0.5 + Math.sin(time * 0.1) * 0.3;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="billsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
          <filter id="billsGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        
        {/* Rotating group */}
        <g transform={`rotate(${rotation} 12 12)`} filter="url(#billsGlow)">
          <path d="M12 3a9 9 0 019 9" stroke="url(#billsGrad)" strokeWidth={1.5} strokeLinecap="round" />
          <path d="M12 3a9 9 0 00-9 9" stroke="url(#billsGrad)" strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
          
          {/* Arrow head */}
          <path d="M21 8l0 4-4 0" stroke={C.neon} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        
        {/* Center dot pulse */}
        <circle cx="12" cy="12" r="2" fill={C.neon} opacity={pulseOpacity} />
      </svg>
    );
  };

  // 📊 STATS ICON - Pie slice fills/animates, data pulse
  const StatsIcon = ({ size = 24 }) => {
    const fillAngle = 90 + Math.sin(time * 0.08) * 30;
    const pulseRing = 9 + Math.sin(time * 0.1) * 0.5;
    const dataPointPulse = Math.sin(time * 0.12);
    
    // Calculate arc path
    const endX = 12 + 9 * Math.cos((fillAngle - 90) * Math.PI / 180);
    const endY = 12 + 9 * Math.sin((fillAngle - 90) * Math.PI / 180);
    const largeArc = fillAngle > 180 ? 1 : 0;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="statsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
          <filter id="statsGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        
        {/* Outer ring - breathing */}
        <circle cx="12" cy="12" r={pulseRing} stroke="url(#statsGrad)" strokeWidth={1.5} fill="none" filter="url(#statsGlow)" />
        
        {/* Animated pie slice fill */}
        <path 
          d={`M12 12 L12 3 A9 9 0 ${largeArc} 1 ${endX} ${endY} Z`}
          fill={C.primary}
          opacity={0.3}
        />
        
        {/* Data line */}
        <path d="M12 3v9l6 3" stroke={C.neon} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Data points that pulse */}
        <circle cx="12" cy="3" r={1.5 + dataPointPulse * 0.5} fill={C.neon} opacity={0.8} />
        <circle cx="18" cy="15" r={1.5 - dataPointPulse * 0.3} fill={C.neon} opacity={0.8} />
      </svg>
    );
  };

  // ☕ FOOD ICON - Steam rises continuously
  const FoodIcon = ({ size = 24 }) => {
    const steam1Y = (time * 0.4) % 6;
    const steam2Y = ((time * 0.4) + 2) % 6;
    const steam3Y = ((time * 0.4) + 4) % 6;
    const steamOpacity = (y) => (1 - y / 6) * 0.7;
    const steamX = (y, offset) => Math.sin((time * 0.1) + offset) * 1.5;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="foodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
          <filter id="steamBlur">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
        </defs>
        
        {/* Rising steam particles */}
        <ellipse cx={6 + steamX(steam1Y, 0)} cy={4 - steam1Y} rx="1.2" ry="0.8" fill={C.neon} opacity={steamOpacity(steam1Y)} filter="url(#steamBlur)" />
        <ellipse cx={10 + steamX(steam2Y, 2)} cy={4 - steam2Y} rx="1" ry="0.6" fill={C.neon} opacity={steamOpacity(steam2Y)} filter="url(#steamBlur)" />
        <ellipse cx={14 + steamX(steam3Y, 4)} cy={4 - steam3Y} rx="1.3" ry="0.7" fill={C.neon} opacity={steamOpacity(steam3Y)} filter="url(#steamBlur)" />
        
        {/* Cup handle */}
        <path d="M18 8h1a4 4 0 010 8h-1" stroke="url(#foodGrad)" strokeWidth={1.5} strokeLinecap="round" />
        
        {/* Cup body */}
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke="url(#foodGrad)" strokeWidth={1.5} />
        
        {/* Steam source lines (static) */}
        <line x1="6" y1="4" x2="6" y2="5" stroke={C.deep} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
        <line x1="10" y1="4" x2="10" y2="5" stroke={C.deep} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
        <line x1="14" y1="4" x2="14" y2="5" stroke={C.deep} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
      </svg>
    );
  };

  // 🚗 TRANSPORT ICON - Wheels rotate, slight bounce
  const TransportIcon = ({ size = 24 }) => {
    const wheelRotation = (time * 5) % 360;
    const bounce = Math.abs(Math.sin(time * 0.15)) * 1;
    const wheelSpoke = wheelRotation * Math.PI / 180;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="carGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
        </defs>
        
        <g transform={`translate(0, ${-bounce})`}>
          {/* Car body */}
          <path d="M5 17H3v-6l2-5h9l4 5h3v6h-2" stroke="url(#carGrad)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <line x1="9" y1="17" x2="15" y2="17" stroke="url(#carGrad)" strokeWidth={1.5} />
          
          {/* Left wheel with rotating spokes */}
          <circle cx="7" cy="17" r="2" stroke="url(#carGrad)" strokeWidth={1.5} fill="none" />
          <line 
            x1={7 + Math.cos(wheelSpoke) * 1.2} y1={17 + Math.sin(wheelSpoke) * 1.2}
            x2={7 - Math.cos(wheelSpoke) * 1.2} y2={17 - Math.sin(wheelSpoke) * 1.2}
            stroke={C.neon} strokeWidth={1} opacity={0.7}
          />
          <line 
            x1={7 + Math.cos(wheelSpoke + Math.PI/2) * 1.2} y1={17 + Math.sin(wheelSpoke + Math.PI/2) * 1.2}
            x2={7 - Math.cos(wheelSpoke + Math.PI/2) * 1.2} y2={17 - Math.sin(wheelSpoke + Math.PI/2) * 1.2}
            stroke={C.neon} strokeWidth={1} opacity={0.7}
          />
          
          {/* Right wheel with rotating spokes */}
          <circle cx="17" cy="17" r="2" stroke="url(#carGrad)" strokeWidth={1.5} fill="none" />
          <line 
            x1={17 + Math.cos(wheelSpoke) * 1.2} y1={17 + Math.sin(wheelSpoke) * 1.2}
            x2={17 - Math.cos(wheelSpoke) * 1.2} y2={17 - Math.sin(wheelSpoke) * 1.2}
            stroke={C.neon} strokeWidth={1} opacity={0.7}
          />
          <line 
            x1={17 + Math.cos(wheelSpoke + Math.PI/2) * 1.2} y1={17 + Math.sin(wheelSpoke + Math.PI/2) * 1.2}
            x2={17 - Math.cos(wheelSpoke + Math.PI/2) * 1.2} y2={17 - Math.sin(wheelSpoke + Math.PI/2) * 1.2}
            stroke={C.neon} strokeWidth={1} opacity={0.7}
          />
          
          {/* Motion lines */}
          <line x1="1" y1={12 - bounce} x2="2.5" y2={12 - bounce} stroke={C.primary} strokeWidth={1} strokeLinecap="round" opacity={0.4} />
          <line x1="0" y1={14 - bounce} x2="2" y2={14 - bounce} stroke={C.primary} strokeWidth={1} strokeLinecap="round" opacity={0.3} />
        </g>
      </svg>
    );
  };

  // 🛒 SHOPPING ICON - Cart rocks/sways, items bounce
  const ShoppingIcon = ({ size = 24 }) => {
    const sway = Math.sin(time * 0.12) * 3;
    const itemBounce1 = Math.abs(Math.sin(time * 0.15)) * 2;
    const itemBounce2 = Math.abs(Math.sin(time * 0.15 + 1)) * 2;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="shopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
        </defs>
        
        <g transform={`rotate(${sway} 12 15)`}>
          {/* Cart body */}
          <path d="M6 6h15l-1.5 9h-12z" stroke="url(#shopGrad)" strokeWidth={1.5} strokeLinejoin="round" />
          
          {/* Items bouncing in cart */}
          <rect x="9" y={8 - itemBounce1} width="2" height="3" rx="0.5" fill={C.neon} opacity={0.5} />
          <rect x="13" y={9 - itemBounce2} width="2" height="2" rx="0.5" fill={C.primary} opacity={0.5} />
        </g>
        
        {/* Wheels */}
        <circle cx="9" cy="20" r="1.2" stroke="url(#shopGrad)" strokeWidth={1.5} fill={C.void} />
        <circle cx="18" cy="20" r="1.2" stroke="url(#shopGrad)" strokeWidth={1.5} fill={C.void} />
        
        {/* Handle */}
        <path d="M6 6L5 3H2" stroke="url(#shopGrad)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  // ⚙️ SETTINGS ICON - Gear rotates slowly, center pulses
  const SettingsIcon = ({ size = 24 }) => {
    const gearRotation = (time * 0.5) % 360;
    const centerPulse = 3 + Math.sin(time * 0.1) * 0.5;
    const rayPulse = 0.5 + Math.sin(time * 0.08) * 0.3;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
          <filter id="gearGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        
        {/* Rotating gear rays */}
        <g transform={`rotate(${gearRotation} 12 12)`} filter="url(#gearGlow)">
          <path
            d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
            stroke="url(#gearGrad)"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={rayPulse + 0.5}
          />
        </g>
        
        {/* Center gear (rotates opposite) */}
        <g transform={`rotate(${-gearRotation * 0.5} 12 12)`}>
          <circle cx="12" cy="12" r={centerPulse} stroke={C.neon} strokeWidth={1.5} fill="none" />
        </g>
        
        {/* Center dot */}
        <circle cx="12" cy="12" r="1.5" fill={C.neon} opacity={0.8} />
      </svg>
    );
  };

  // 💰 WALLET/SALARY ICON - Bills fan out, coin shines
  const SalaryIcon = ({ size = 24 }) => {
    const fanAngle = Math.sin(time * 0.08) * 5;
    const shine = (time * 0.3) % 20;
    const shineOpacity = shine < 3 ? (1 - shine / 3) : 0;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
        </defs>
        
        {/* Fanning bills */}
        <g transform={`rotate(${-fanAngle} 4 19)`}>
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="url(#walletGrad)" strokeWidth={1.5} fill="none" opacity={0.3} />
        </g>
        <g transform={`rotate(${fanAngle} 4 19)`}>
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="url(#walletGrad)" strokeWidth={1.5} fill="none" opacity={0.5} />
        </g>
        
        {/* Main card */}
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="url(#walletGrad)" strokeWidth={1.5} fill="none" />
        <line x1="2" y1="10" x2="22" y2="10" stroke="url(#walletGrad)" strokeWidth={1.5} />
        
        {/* Shine effect */}
        <line x1={2 + shine} y1="5" x2={6 + shine} y2="19" stroke={C.neon} strokeWidth={2} opacity={shineOpacity} strokeLinecap="round" />
      </svg>
    );
  };

  // 🎯 BUDGETS ICON - Target pulses, arrow hits
  const BudgetsIcon = ({ size = 24 }) => {
    const ringPulse = Math.sin(time * 0.1);
    const arrowProgress = ((time * 0.1) % 3);
    const arrowX = arrowProgress < 1 ? 3 + arrowProgress * 9 : 12;
    const arrowOpacity = arrowProgress < 1 ? 1 : Math.max(0, 1 - (arrowProgress - 1));
    const hitFlash = arrowProgress >= 1 && arrowProgress < 1.3 ? 0.6 : 0;

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="budgetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
        </defs>
        
        {/* Pulsing rings */}
        <circle cx="12" cy="12" r={9 + ringPulse * 0.5} stroke="url(#budgetGrad)" strokeWidth={1.5} fill="none" />
        <circle cx="12" cy="12" r={5 - ringPulse * 0.3} stroke="url(#budgetGrad)" strokeWidth={1.5} fill="none" />
        
        {/* Center with hit flash */}
        <circle cx="12" cy="12" r="1.5" fill={C.neon} />
        <circle cx="12" cy="12" r="4" fill={C.neon} opacity={hitFlash} />
        
        {/* Flying arrow */}
        <g transform={`translate(${arrowX - 12}, 0)`} opacity={arrowOpacity}>
          <line x1="3" y1="12" x2="8" y2="12" stroke={C.neon} strokeWidth={1.5} strokeLinecap="round" />
          <path d="M6 10l2 2-2 2" stroke={C.neon} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
      </svg>
    );
  };

  // 👁️ COSMIC EYE - Signature blink animation
  const CosmicEye = ({ size = 48 }) => {
    const blinkCycle = (time * 0.05) % 12;
    const blink = blinkCycle > 10.5 ? Math.sin((blinkCycle - 10.5) * Math.PI / 1.5) : 1;
    const eyeHeight = 14 * Math.max(0.05, blink);
    const pupilDrift = Math.sin(time * 0.03) * 2;
    const glowPulse = 0.3 + Math.sin(time * 0.08) * 0.2;

    return (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={{
        filter: `drop-shadow(0 0 ${15 + glowPulse * 20}px ${C.primary})`,
      }}>
        <defs>
          <radialGradient id="eyeCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="60%" stopColor={C.primary} />
            <stop offset="100%" stopColor={C.deep} />
          </radialGradient>
          <linearGradient id="eyeOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.neon} />
            <stop offset="100%" stopColor={C.deep} />
          </linearGradient>
        </defs>

        <ellipse cx="24" cy="24" rx={18 * blink + 4} ry={eyeHeight + 2} fill={C.primary} fillOpacity={0.15 * blink} />
        <path d={`M4 24 Q24 ${24 - eyeHeight} 44 24 Q24 ${24 + eyeHeight} 4 24 Z`} stroke="url(#eyeOuter)" strokeWidth={1.5} fill="none" />
        <circle cx="24" cy="24" r={10 * blink} stroke={C.primary} strokeWidth={1} fill="none" opacity={0.4 * blink} />
        <circle cx="24" cy="24" r={8 * blink} fill="url(#eyeCore)" opacity={0.4 * blink} />
        
        {/* Pupil with drift */}
        <circle cx={24 + pupilDrift} cy="24" r={5 * blink} fill={C.void} stroke={C.neon} strokeWidth={1} opacity={blink} />
        <circle cx={24 + pupilDrift} cy="24" r={2.5 * blink} fill={C.neon} opacity={blink} />
        
        {/* Reflections */}
        <circle cx={21 + pupilDrift * 0.5} cy={21} r={1.5 * blink} fill={C.neon} opacity={0.8 * blink} />
        <circle cx={27 + pupilDrift * 0.3} cy={22} r={0.75 * blink} fill={C.neon} opacity={0.5 * blink} />
        
        {/* Closed eye line */}
        {blink < 0.3 && <line x1="8" y1="24" x2="40" y2="24" stroke={C.neon} strokeWidth={2} strokeLinecap="round" opacity={1 - blink * 3} />}
      </svg>
    );
  };

  // ============================================
  // GRADIENT TEXT
  // ============================================
  const GradientText = ({ children, style = {}, variant = 'primary' }) => {
    const gradients = {
      primary: `linear-gradient(180deg, ${C.neon} 0%, ${C.primary} 50%, ${C.deep} 100%)`,
      bright: `linear-gradient(180deg, #ffffff 0%, ${C.neon} 30%, ${C.primary} 70%, ${C.deep} 100%)`,
      subtle: `linear-gradient(180deg, ${C.bright} 0%, ${C.primary} 50%, ${C.medium} 100%)`,
      muted: `linear-gradient(180deg, ${C.primary} 0%, ${C.deep} 50%, ${C.dark} 100%)`,
      luxury: `linear-gradient(180deg, #ffffff 0%, ${C.neon} 20%, ${C.primary} 50%, ${C.deep} 80%, ${C.dark} 100%)`,
    };
    return (
      <span style={{ background: gradients[variant], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', ...style }}>
        {children}
      </span>
    );
  };

  // ============================================
  // ATMOSPHERIC FOG
  // ============================================
  const AtmosphericFog = () => {
    const fogPulse = Math.sin(time * 0.02) * 0.1;
    return (
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: 0, left: '-20%', right: '-20%', height: '100%', background: `radial-gradient(ellipse 120% 60% at 50% 100%, ${C.primary}40 0%, ${C.deep}20 30%, transparent 70%)`, opacity: 0.8 + fogPulse }} />
        <div style={{ position: 'absolute', bottom: 0, left: '-10%', right: '-10%', height: '80%', background: `radial-gradient(ellipse 100% 50% at 50% 100%, ${C.neon}30 0%, ${C.primary}15 40%, transparent 70%)`, opacity: 0.6 + fogPulse * 0.5 }} />
        <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '40%', background: `radial-gradient(ellipse 80% 80% at 50% 100%, ${C.neon}50 0%, ${C.primary}25 30%, transparent 60%)`, filter: 'blur(20px)', opacity: 0.7 + fogPulse }} />
        <div style={{ position: 'absolute', bottom: '10%', left: 0, right: 0, height: '30%', background: `radial-gradient(ellipse 150% 40% at 50% 80%, ${C.primary}15 0%, transparent 50%)`, transform: `translateY(${Math.sin(time * 0.03) * 10}px)`, opacity: 0.4 }} />
        {particles.map((p) => {
          const yOffset = ((time * p.speed * 0.5) + p.delay * 100) % 100;
          const floatX = Math.sin((time * 0.05) + p.id) * 5;
          return <div key={p.id} style={{ position: 'absolute', left: `${p.x + floatX}%`, bottom: `${yOffset}%`, width: p.size, height: p.size, borderRadius: '50%', background: C.neon, opacity: p.opacity * (1 - yOffset / 100) * (0.5 + Math.sin(time * 0.1 + p.id) * 0.5), boxShadow: `0 0 ${p.size * 2}px ${C.neon}`, pointerEvents: 'none' }} />;
        })}
      </div>
    );
  };

  // ============================================
  // ICON BOX
  // ============================================
  const IconBox = ({ children, size = 56, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: size * 0.27,
        background: `linear-gradient(135deg, ${C.dark} 0%, ${C.void} 100%)`,
        border: `1px solid ${C.deep}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 20px ${C.primary}20`,
      }}>
        {children}
      </div>
      {label && <GradientText variant="muted" style={{ fontSize: 9, letterSpacing: '0.1em' }}>{label}</GradientText>}
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{ minHeight: '100vh', background: C.void, fontFamily: "'Cinzel', serif", position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap');
        * { font-family: 'Cinzel', serif !important; box-sizing: border-box; }
      `}</style>

      <AtmosphericFog />

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 20px 120px', maxWidth: 500, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <GradientText variant="luxury" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '0.15em', display: 'block' }}>SPENDTRAK</GradientText>
          <GradientText variant="muted" style={{ fontSize: 10, letterSpacing: '0.3em', display: 'block', marginTop: 4 }}>UNIQUE ICON ANIMATIONS</GradientText>
        </div>

        {/* Cosmic Eye */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ width: 100, height: 100, borderRadius: 30, background: `radial-gradient(circle, ${C.dark}60 0%, ${C.void} 70%)`, border: `1px solid ${C.deep}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${C.primary}25` }}>
            <CosmicEye size={60} />
          </div>
        </div>

        {/* Icon Grid */}
        <div style={{ background: `linear-gradient(135deg, ${C.soft} 0%, ${C.void} 100%)`, borderRadius: 20, border: `1px solid ${C.darker}`, padding: 24, marginBottom: 24 }}>
          <GradientText variant="muted" style={{ fontSize: 10, letterSpacing: '0.3em', display: 'block', marginBottom: 20 }}>UNIQUE ANIMATIONS PER ICON</GradientText>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, justifyItems: 'center' }}>
            <IconBox label="HOME" size={52}><HomeIcon size={26} /></IconBox>
            <IconBox label="SCAN" size={52}><ScanIcon size={26} /></IconBox>
            <IconBox label="PLUS" size={52}><AddIcon size={26} /></IconBox>
            <IconBox label="BILLS" size={52}><BillsIcon size={26} /></IconBox>
            <IconBox label="STATS" size={52}><StatsIcon size={26} /></IconBox>
            <IconBox label="FOOD" size={52}><FoodIcon size={26} /></IconBox>
            <IconBox label="TRANSPORT" size={52}><TransportIcon size={26} /></IconBox>
            <IconBox label="SHOPPING" size={52}><ShoppingIcon size={26} /></IconBox>
            <IconBox label="SETTINGS" size={52}><SettingsIcon size={26} /></IconBox>
            <IconBox label="SALARY" size={52}><SalaryIcon size={26} /></IconBox>
            <IconBox label="BUDGETS" size={52}><BudgetsIcon size={26} /></IconBox>
          </div>
        </div>

        {/* Animation Descriptions */}
        <div style={{ background: `linear-gradient(135deg, ${C.soft} 0%, ${C.void} 100%)`, borderRadius: 20, border: `1px solid ${C.darker}`, padding: 24 }}>
          <GradientText variant="muted" style={{ fontSize: 10, letterSpacing: '0.3em', display: 'block', marginBottom: 16 }}>ANIMATION DETAILS</GradientText>
          
          {[
            { icon: '🏠', name: 'Home', desc: 'Door glows warmly, chimney smoke rises' },
            { icon: '📷', name: 'Scan', desc: 'Laser line sweeps, corners pulse inward' },
            { icon: '➕', name: 'Plus', desc: 'Heartbeat pulse, slight rotation' },
            { icon: '🔄', name: 'Bills', desc: 'Continuous rotation with center pulse' },
            { icon: '📊', name: 'Stats', desc: 'Pie fills/animates, data points pulse' },
            { icon: '☕', name: 'Food', desc: 'Steam particles rise and drift' },
            { icon: '🚗', name: 'Transport', desc: 'Wheels rotate, car bounces' },
            { icon: '🛒', name: 'Shopping', desc: 'Cart sways, items bounce inside' },
            { icon: '⚙️', name: 'Settings', desc: 'Gear rotates, rays pulse' },
            { icon: '💰', name: 'Salary', desc: 'Bills fan out, shine sweeps across' },
            { icon: '🎯', name: 'Budgets', desc: 'Arrow flies to target, rings pulse' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 10 ? `1px solid ${C.darker}` : 'none' }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <div>
                <GradientText variant="subtle" style={{ fontSize: 12 }}>{item.name}</GradientText>
                <GradientText variant="muted" style={{ fontSize: 10, display: 'block', marginTop: 2 }}>{item.desc}</GradientText>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpendTrakUniqueAnimations;
