// ============================================
// SPENDTRAK CINEMATIC EDITION - COLORS
// ⚠️ ONLY THESE COLORS ARE ALLOWED
// NO BLUE, YELLOW, GOLD, OR ANY OTHER COLORS
// ============================================

export const Colors = {
  // GREEN PALETTE (Light to Dark)
  neon: '#00ff88',
  bright: '#00e67a',
  primary: '#00cc6a',
  medium: '#00a858',
  deep: '#008545',
  dark: '#004d2a',
  darker: '#002a17',
  deepest: '#001a0f',
  void: '#000000',

  // BACKGROUNDS
  background: {
    primary: '#000000',
    secondary: '#020806',
    tertiary: '#051a0f',
    elevated: '#002a17',
  },

  // TEXT
  text: {
    primary: '#00e67a',
    secondary: '#00cc6a',
    tertiary: '#008545',
    disabled: '#004d2a',
    inverse: '#000000',
  },

  // BORDERS
  border: {
    default: '#002a17',
    subtle: '#001a0f',
    active: '#00cc6a',
    bright: '#00ff88',
  },

  // TRANSPARENT VARIANTS
  transparent: {
    neon90: '#00ff88e6', neon80: '#00ff88cc', neon60: '#00ff8899',
    neon50: '#00ff8880', neon40: '#00ff8866', neon30: '#00ff884d',
    neon20: '#00ff8833', neon15: '#00ff8826', neon10: '#00ff881a', neon05: '#00ff880d',
    primary80: '#00cc6acc', primary60: '#00cc6a99', primary50: '#00cc6a80',
    primary40: '#00cc6a66', primary30: '#00cc6a4d', primary20: '#00cc6a33',
    primary15: '#00cc6a26', primary10: '#00cc6a1a', primary05: '#00cc6a0d',
    deep80: '#008545cc', deep60: '#00854599', deep50: '#00854580',
    deep40: '#00854566', deep30: '#0085454d', deep20: '#00854533', deep10: '#0085451a',
    dark80: '#004d2acc', dark60: '#004d2a99', dark50: '#004d2a80',
    dark40: '#004d2a66', dark30: '#004d2a4d', dark20: '#004d2a33', dark10: '#004d2a1a',
    darker80: '#002a17cc', darker60: '#002a1799', darker50: '#002a1780',
    darker40: '#002a1766', darker30: '#002a174d', darker20: '#002a1733', darker10: '#002a171a',
    black90: '#000000e6', black80: '#000000cc', black70: '#000000b3',
    black60: '#00000099', black50: '#00000080', black40: '#00000066', black30: '#0000004d',
    white10: '#ffffff1a', white20: '#ffffff33', white30: '#ffffff4d', white50: '#ffffff80',
  },

  // GRADIENT DEFINITIONS
  gradients: {
    card: ['#051a0f', '#020806', '#000000'],
    cardSubtle: ['#002a17', '#001a0f', '#000000'],
    buttonPrimary: ['#00ff88', '#00cc6a', '#008545'],
    buttonSecondary: ['#008545', '#004d2a', '#002a17'],
    textLuxury: ['#ffffff', '#00ff88', '#00cc6a', '#008545', '#004d2a'],
    textBright: ['#ffffff', '#00ff88', '#00cc6a', '#008545'],
    textPrimary: ['#00ff88', '#00cc6a', '#008545'],
    textSubtle: ['#00e67a', '#00cc6a', '#00a858'],
    textMuted: ['#00cc6a', '#008545', '#004d2a'],
    icon: ['#00ff88', '#008545'],
    iconActive: ['#00ff88', '#00cc6a'],
    fog: ['#00000000', '#00854520', '#00cc6a40'],
    glow: ['#00ff8860', '#00cc6a30', '#00000000'],
  },

  // SHADOWS
  shadow: {
    glow: '#00ff88',
    soft: '#00cc6a',
    subtle: '#008545',
  },

  // CATEGORY COLORS (All green shades)
  categories: {
    food: '#00ff88',
    transport: '#00e67a',
    shopping: '#00cc6a',
    entertainment: '#00a858',
    utilities: '#008545',
    health: '#006634',
    education: '#004d2a',
    travel: '#00ff88',
    salary: '#00e67a',
    investment: '#00cc6a',
    other: '#008545',
  },
} as const;

export type ColorKey = keyof typeof Colors;
export default Colors;
