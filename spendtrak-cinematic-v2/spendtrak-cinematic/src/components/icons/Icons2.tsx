// SPENDTRAK CINEMATIC EDITION - Icons Part 2 (Categories, Finance, Misc)
import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline, Polygon, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import { Colors } from '../../design/cinematic';

export interface IconProps { size?: number; color?: string; strokeWidth?: number; }

const G: React.FC<{ id: string }> = ({ id }) => (
  <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={Colors.neon} /><Stop offset="100%" stopColor={Colors.deep} /></LinearGradient></Defs>
);

// Category Icons
export const FoodIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="food" />
    <Path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" stroke={color || "url(#food)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6" y1="1" x2="6" y2="4" stroke={color || "url(#food)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="10" y1="1" x2="10" y2="4" stroke={color || "url(#food)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="14" y1="1" x2="14" y2="4" stroke={color || "url(#food)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const TransportIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="trans" />
    <Path d="M5 17H3v-6l2-5h9l4 5h3v6h-2" stroke={color || "url(#trans)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="7" cy="17" r="2" stroke={color || "url(#trans)"} strokeWidth={strokeWidth} />
    <Circle cx="17" cy="17" r="2" stroke={color || "url(#trans)"} strokeWidth={strokeWidth} />
    <Line x1="9" y1="17" x2="15" y2="17" stroke={color || "url(#trans)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const ShoppingIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="shop" />
    <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={color || "url(#shop)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="3" y1="6" x2="21" y2="6" stroke={color || "url(#shop)"} strokeWidth={strokeWidth} />
    <Path d="M16 10a4 4 0 01-8 0" stroke={color || "url(#shop)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const EntertainmentIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="ent" />
    <Rect x="2" y="7" width="20" height="15" rx="2" stroke={color || "url(#ent)"} strokeWidth={strokeWidth} />
    <Polyline points="17 2 12 7 7 2" stroke={color || "url(#ent)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const UtilitiesIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="util" />
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color || "url(#util)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const HealthIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="health" />
    <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={color || "url(#health)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const EducationIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="edu" />
    <Path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke={color || "url(#edu)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M6 12v5c3 3 9 3 12 0v-5" stroke={color || "url(#edu)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TravelIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="trav" />
    <Path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" stroke={color || "url(#trav)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GiftIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="gift" />
    <Rect x="3" y="8" width="18" height="4" rx="1" stroke={color || "url(#gift)"} strokeWidth={strokeWidth} />
    <Path d="M12 8v13" stroke={color || "url(#gift)"} strokeWidth={strokeWidth} />
    <Rect x="5" y="12" width="14" height="9" stroke={color || "url(#gift)"} strokeWidth={strokeWidth} />
    <Path d="M12 8c-2-2-5-2.5-5 0s3.5 3 5 0c1.5 3 5 2.5 5 0s-3-2-5 0z" stroke={color || "url(#gift)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const HomeExpenseIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="hExp" />
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={color || "url(#hExp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 21v-7h6v7" stroke={color || "url(#hExp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Financial Icons
export const WalletIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="wall" />
    <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color || "url(#wall)"} strokeWidth={strokeWidth} />
    <Path d="M22 10H18a2 2 0 000 4h4" stroke={color || "url(#wall)"} strokeWidth={strokeWidth} />
    <Circle cx="18" cy="12" r="0.5" fill={color || Colors.primary} stroke={color || Colors.primary} />
  </Svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="card" />
    <Rect x="1" y="4" width="22" height="16" rx="2" stroke={color || "url(#card)"} strokeWidth={strokeWidth} />
    <Line x1="1" y1="10" x2="23" y2="10" stroke={color || "url(#card)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const BudgetIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="budg" />
    <Circle cx="12" cy="12" r="10" stroke={color || "url(#budg)"} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="6" stroke={color || "url(#budg)"} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="2" fill={color || Colors.primary} />
  </Svg>
);

export const TargetIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="targ" />
    <Circle cx="12" cy="12" r="10" stroke={color || "url(#targ)"} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="6" stroke={color || "url(#targ)"} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="2" stroke={color || "url(#targ)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const SavingsIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="save" />
    <Path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2" stroke={color || "url(#save)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="2" y1="9" x2="5" y2="9" stroke={color || "url(#save)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const IncomeIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="inc" />
    <Line x1="12" y1="2" x2="12" y2="22" stroke={color || "url(#inc)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M17 7l-5-5-5 5" stroke={color || "url(#inc)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 17l-5 5-5-5" stroke={color || "url(#inc)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const DebtIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="debt" />
    <Circle cx="12" cy="12" r="10" stroke={color || "url(#debt)"} strokeWidth={strokeWidth} />
    <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke={color || "url(#debt)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="17" x2="12.01" y2="17" stroke={color || "url(#debt)"} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const InvestmentIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="inv" />
    <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke={color || "url(#inv)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 7 22 7 22 13" stroke={color || "url(#inv)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const NetWorthIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="nw" />
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color || "url(#nw)"} strokeWidth={strokeWidth} />
    <Line x1="3" y1="9" x2="21" y2="9" stroke={color || "url(#nw)"} strokeWidth={strokeWidth} />
    <Line x1="9" y1="21" x2="9" y2="9" stroke={color || "url(#nw)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const MoneyIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="money" />
    <Line x1="12" y1="1" x2="12" y2="23" stroke={color || "url(#money)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={color || "url(#money)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Misc Icons
export const CalendarIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="cal" />
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color || "url(#cal)"} strokeWidth={strokeWidth} />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color || "url(#cal)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color || "url(#cal)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color || "url(#cal)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="clk" />
    <Circle cx="12" cy="12" r="10" stroke={color || "url(#clk)"} strokeWidth={strokeWidth} />
    <Polyline points="12 6 12 12 16 14" stroke={color || "url(#clk)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const NotificationIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="notif" />
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color || "url(#notif)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color || "url(#notif)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="prof" />
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color || "url(#prof)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="7" r="4" stroke={color || "url(#prof)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const EmailIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="email" />
    <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color || "url(#email)"} strokeWidth={strokeWidth} />
    <Polyline points="22 6 12 13 2 6" stroke={color || "url(#email)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ShareIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="share" />
    <Circle cx="18" cy="5" r="3" stroke={color || "url(#share)"} strokeWidth={strokeWidth} />
    <Circle cx="6" cy="12" r="3" stroke={color || "url(#share)"} strokeWidth={strokeWidth} />
    <Circle cx="18" cy="19" r="3" stroke={color || "url(#share)"} strokeWidth={strokeWidth} />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color || "url(#share)"} strokeWidth={strokeWidth} />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color || "url(#share)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const ExportIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="exp" />
    <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color || "url(#exp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="17 8 12 3 7 8" stroke={color || "url(#exp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="3" x2="12" y2="15" stroke={color || "url(#exp)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="ref" />
    <Polyline points="23 4 23 10 17 10" stroke={color || "url(#ref)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="1 20 1 14 7 14" stroke={color || "url(#ref)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={color || "url(#ref)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LinkIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="link" />
    <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color || "url(#link)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color || "url(#link)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="log" />
    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color || "url(#log)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="16 17 21 12 16 7" stroke={color || "url(#log)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color || "url(#log)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const StarIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="star" />
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color || "url(#star)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TrophyIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="tro" />
    <Path d="M6 9H4.5a2.5 2.5 0 010-5H6" stroke={color || "url(#tro)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18 9h1.5a2.5 2.5 0 000-5H18" stroke={color || "url(#tro)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 22h16" stroke={color || "url(#tro)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 14.66V22h4v-7.34c2.39-.77 4-2.88 4-5.66V4H6v6c0 2.78 1.61 4.89 4 5.66z" stroke={color || "url(#tro)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GlobeIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="glob" />
    <Circle cx="12" cy="12" r="10" stroke={color || "url(#glob)"} strokeWidth={strokeWidth} />
    <Line x1="2" y1="12" x2="22" y2="12" stroke={color || "url(#glob)"} strokeWidth={strokeWidth} />
    <Path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke={color || "url(#glob)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const CurrencyIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="curr" />
    <Circle cx="12" cy="12" r="10" stroke={color || "url(#curr)"} strokeWidth={strokeWidth} />
    <Line x1="12" y1="6" x2="12" y2="18" stroke={color || "url(#curr)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M15 9.5c-.5-1-1.5-1.5-3-1.5s-3 .5-3 2 1.5 2 3 2.5 3 1 3 2.5-1 2-3 2-2.5-.5-3-1.5" stroke={color || "url(#curr)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PrivacyIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="priv" />
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color || "url(#priv)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TermsIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="term" />
    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color || "url(#term)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="14 2 14 8 20 8" stroke={color || "url(#term)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={color || "url(#term)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={color || "url(#term)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="10" y1="9" x2="8" y2="9" stroke={color || "url(#term)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const GroupIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="grp" />
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color || "url(#grp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="9" cy="7" r="4" stroke={color || "url(#grp)"} strokeWidth={strokeWidth} />
    <Path d="M23 21v-2a4 4 0 00-3-3.87" stroke={color || "url(#grp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 3.13a4 4 0 010 7.75" stroke={color || "url(#grp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const RobotIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="rob" />
    <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color || "url(#rob)"} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="5" r="2" stroke={color || "url(#rob)"} strokeWidth={strokeWidth} />
    <Line x1="12" y1="7" x2="12" y2="11" stroke={color || "url(#rob)"} strokeWidth={strokeWidth} />
    <Line x1="8" y1="16" x2="8" y2="16" stroke={color || "url(#rob)"} strokeWidth={2} strokeLinecap="round" />
    <Line x1="16" y1="16" x2="16" y2="16" stroke={color || "url(#rob)"} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const SecurityIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="sec" />
    <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color || "url(#sec)"} strokeWidth={strokeWidth} />
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color || "url(#sec)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ThemeIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="thm" />
    <Circle cx="12" cy="12" r="5" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} />
    <Line x1="12" y1="1" x2="12" y2="3" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="12" y1="21" x2="12" y2="23" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="1" y1="12" x2="3" y2="12" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="21" y1="12" x2="23" y2="12" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={color || "url(#thm)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const CloudIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="cld" />
    <Path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke={color || "url(#cld)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const FeedbackIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><G id="fb" />
    <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color || "url(#fb)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
