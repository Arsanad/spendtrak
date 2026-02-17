// SPENDTRAK CINEMATIC EDITION - Icons Part 1 (Core Navigation & Actions)
import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline, Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../design/cinematic';

export interface IconProps { size?: number; color?: string; strokeWidth?: number; }

const Grad: React.FC<{ id: string }> = ({ id }) => (
  <Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor={Colors.neon} /><Stop offset="100%" stopColor={Colors.deep} /></LinearGradient></Defs>
);

// Navigation Icons
export const HomeIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="home" />
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" stroke={color || "url(#home)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TransactionsIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="trans" />
    <Path d="M3 6h18M3 12h18M3 18h18" stroke={color || "url(#trans)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="7" cy="6" r="1.5" fill={color || Colors.primary} /><Circle cx="12" cy="12" r="1.5" fill={color || Colors.primary} /><Circle cx="9" cy="18" r="1.5" fill={color || Colors.primary} />
  </Svg>
);

export const StatsIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="stats" />
    {/* Pie chart with segment - Analytics icon */}
    <Circle cx="12" cy="12" r="9" stroke={color || "url(#stats)"} strokeWidth={strokeWidth} />
    <Path d="M12 12V3" stroke={color || "url(#stats)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M12 12L19.8 16.5" stroke={color || "url(#stats)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M12 12L4.5 7" stroke={color || "url(#stats)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const AnalyticsIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="analytics" />
    {/* Bar chart icon */}
    <Rect x="3" y="14" width="4" height="7" rx="1" stroke={color || "url(#analytics)"} strokeWidth={strokeWidth} />
    <Rect x="10" y="10" width="4" height="11" rx="1" stroke={color || "url(#analytics)"} strokeWidth={strokeWidth} />
    <Rect x="17" y="6" width="4" height="15" rx="1" stroke={color || "url(#analytics)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const SubscriptionsIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="subs" />
    <Path d="M21 12a9 9 0 11-3-6.7" stroke={color || "url(#subs)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M21 4v6h-6" stroke={color || "url(#subs)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const AlertsIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="alert" />
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color || "url(#alert)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color || "url(#alert)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="set" />
    <Circle cx="12" cy="12" r="3" stroke={color || "url(#set)"} strokeWidth={strokeWidth} />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color || "url(#set)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Action Icons
export const PlusIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="plus" />
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color || "url(#plus)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color || "url(#plus)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const ScanIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="scan" />
    <Path d="M4 7V5a2 2 0 012-2h2" stroke={color || "url(#scan)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M16 3h2a2 2 0 012 2v2" stroke={color || "url(#scan)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M20 17v2a2 2 0 01-2 2h-2" stroke={color || "url(#scan)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M8 21H6a2 2 0 01-2-2v-2" stroke={color || "url(#scan)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={color || Colors.neon} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const CameraIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="cam" />
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke={color || "url(#cam)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="4" stroke={color || "url(#cam)"} strokeWidth={strokeWidth} />
  </Svg>
);

export const EditIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="edit" />
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color || "url(#edit)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color || "url(#edit)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="trash" />
    <Polyline points="3 6 5 6 21 6" stroke={color || "url(#trash)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color || "url(#trash)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="search" />
    <Circle cx="11" cy="11" r="8" stroke={color || "url(#search)"} strokeWidth={strokeWidth} />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color || "url(#search)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const FilterIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="filter" />
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={color || "url(#filter)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="close" />
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color || "url(#close)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color || "url(#close)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="check" />
    <Polyline points="20 6 9 17 4 12" stroke={color || "url(#check)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="menu" />
    <Line x1="3" y1="6" x2="21" y2="6" stroke={color || "url(#menu)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color || "url(#menu)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="3" y1="18" x2="21" y2="18" stroke={color || "url(#menu)"} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// Chevrons
export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="chevL" />
    <Polyline points="15 18 9 12 15 6" stroke={color || "url(#chevL)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="chevR" />
    <Polyline points="9 18 15 12 9 6" stroke={color || "url(#chevR)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="chevD" />
    <Polyline points="6 9 12 15 18 9" stroke={color || "url(#chevD)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronUpIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="chevU" />
    <Polyline points="18 15 12 9 6 15" stroke={color || "url(#chevU)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Trend Icons
export const TrendUpIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="tUp" />
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke={color || "url(#tUp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="17 6 23 6 23 12" stroke={color || "url(#tUp)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TrendDownIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="tDn" />
    <Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={color || "url(#tDn)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="17 18 23 18 23 12" stroke={color || "url(#tDn)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Info Icons
export const InfoIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="info" />
    <Circle cx="12" cy="12" r="10" stroke={color || "url(#info)"} strokeWidth={strokeWidth} />
    <Line x1="12" y1="16" x2="12" y2="12" stroke={color || "url(#info)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="12" cy="8" r="0.5" fill={color || Colors.primary} stroke={color || Colors.primary} />
  </Svg>
);

export const HelpIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="help" />
    <Circle cx="12" cy="12" r="10" stroke={color || "url(#help)"} strokeWidth={strokeWidth} />
    <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke={color || "url(#help)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="17" r="0.5" fill={color || Colors.primary} stroke={color || Colors.primary} />
  </Svg>
);

export const WarningIcon: React.FC<IconProps> = ({ size = 24, color, strokeWidth = 1.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Grad id="warn" />
    <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color || "url(#warn)"} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="9" x2="12" y2="13" stroke={color || "url(#warn)"} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="12" cy="17" r="0.5" fill={color || Colors.primary} stroke={color || Colors.primary} />
  </Svg>
);
