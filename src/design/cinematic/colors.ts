// ============================================
// SPENDTRAK CINEMATIC EDITION - COLORS
// PRIMARY: Green palette (brand identity)
// FUNCTIONAL: Neon family for data visualization
// ============================================

export const Colors = {
  // ==========================================
  // GREEN PALETTE (Primary Brand - Light to Dark)
  // ==========================================
  neon: '#00ff88',
  bright: '#00e67a',
  primary: '#00cc6a',
  medium: '#00a858',
  deep: '#008545',
  dark: '#004d2a',
  darker: '#002a17',
  deepest: '#001a0f',
  void: '#000000',

  // Top-level semantic color aliases (for convenience)
  income: '#39FF14',      // Phosphorescent Green - money IN
  expense: '#ff3366',     // Neon Red - money OUT

  // ==========================================
  // NEON FAMILY COLORS (Functional)
  // For charts, status indicators, financial data
  // ==========================================
  neonFamily: {
    green: '#00ff88',    // Primary brand, success
    blue: '#0088ff',     // Income, money IN
    purple: '#bf00ff',   // Investments
    pink: '#ff00ff',     // Special/Premium
    orange: '#ff8800',   // Warnings, pending
    red: '#ff3366',      // Expenses, money OUT
    yellow: '#ffff00',   // Alerts, highlights
    silver: '#b8c4d4',   // Neutral, statistics, balances
  },

  // ==========================================
  // SEMANTIC COLORS (Financial)
  // NEW COLOR SYSTEM:
  // - INCOME (Phosphorescent Green #39FF14): income, salary, refunds, gains, savings
  // - EXPENSE (Neon Red #ff3366): expenses, debts, bills, losses, spending
  // - NEUTRAL (Neon Bronze #E6A756): balance, totals, statistics, percentages
  // ==========================================
  semantic: {
    // Financial transactions - PRIMARY COLORS FOR NUMBERS
    income: '#39FF14',      // Phosphorescent Green - money IN (salary, refunds, profit, gains)
    expense: '#ff3366',     // Neon Red - money OUT (spending, bills, losses)
    transfer: '#E6A756',    // Neon Bronze - neutral movement between accounts
    refund: '#39FF14',      // Phosphorescent Green - money coming back IN

    // Explicit naming aliases
    incoming: '#39FF14',    // Phosphorescent Green - alias for income
    outgoing: '#ff3366',    // Neon Red - alias for expense
    positive: '#39FF14',    // Phosphorescent Green - positive values
    negative: '#ff3366',    // Neon Red - negative values

    // Neutral/Statistics - Neon Bronze
    neutral: '#E6A756',     // Neon Bronze - for neutral displays
    statistic: '#E6A756',   // Neon Bronze - for statistical numbers
    balance: '#E6A756',     // Neon Bronze - for balance totals
    count: '#E6A756',       // Neon Bronze - for transaction counts
    percentage: '#E6A756',  // Neon Bronze - for percentages
    target: '#E6A756',      // Neon Bronze - for budget/goal targets

    // Bronze variants
    bronze: '#E6A756',      // Neon Bronze - primary
    bronzeDim: '#C4894A',   // Dimmer bronze for secondary text
    bronzeBright: '#F4C077', // Brighter bronze for emphasis

    // Legacy silver (keeping for compatibility)
    silver: '#E6A756',      // Now maps to bronze
    silverDim: '#C4894A',   // Now maps to bronze dim
    silverBright: '#F4C077', // Now maps to bronze bright

    // Status indicators
    success: '#39FF14',     // Phosphorescent Green
    warning: '#ff8800',     // Orange
    error: '#ff3366',       // Red
    info: '#0088ff',        // Neon Blue

    // Budget status (traffic light)
    budgetSafe: '#39FF14',     // Phosphorescent Green - under budget (<80%)
    budgetWarning: '#FFB347',  // Light Bronze - approaching limit (80-99%)
    budgetDanger: '#ff3366',   // Red - over budget (100%+)

    // Goals/Savings progress
    safeToSpend: '#39FF14',    // Phosphorescent Green - available money
    remaining: '#39FF14',      // Phosphorescent Green - budget remaining
    saved: '#39FF14',          // Phosphorescent Green - money saved towards goal

    // Subscription status
    active: '#39FF14',      // Phosphorescent Green
    paused: '#ff8800',      // Orange
    cancelled: '#ff3366',   // Red
    trial: '#0088ff',       // Neon Blue
  },

  // ==========================================
  // CHART PALETTE
  // For pie charts, donut charts, bar charts
  // ==========================================
  chart: {
    // Primary palette (6 colors for variety)
    palette: [
      '#00ff88',   // Green (primary)
      '#0088ff',   // Neon Blue
      '#bf00ff',   // Purple
      '#ff00ff',   // Pink
      '#ff8800',   // Orange
      '#ff0044',   // Red
    ],
    // Extended palette for more categories
    extended: [
      '#00ff88',   // Green
      '#00cc6a',   // Deep green
      '#0088ff',   // Neon Blue
      '#0066cc',   // Deep blue
      '#bf00ff',   // Purple
      '#9900cc',   // Deep purple
      '#ff00ff',   // Pink
      '#cc00cc',   // Deep pink
      '#ff8800',   // Orange
      '#cc6600',   // Deep orange
    ],
    // Gradient pairs for charts (matching new financial system)
    gradients: {
      income: ['#39FF14', '#2ACC10'],   // Phosphorescent Green - money IN
      expense: ['#ff3366', '#cc2952'],  // Red - money OUT
      neutral: ['#F4C077', '#E6A756'],  // Neon Bronze - neutral
    },
  },

  // ==========================================
  // CATEGORY COLORS
  // Each category gets a distinct neon color
  // ==========================================
  categories: {
    food: '#ff8800',         // Orange
    transport: '#0088ff',    // Neon Blue
    shopping: '#ff00ff',     // Pink
    entertainment: '#bf00ff', // Purple
    utilities: '#0088ff',    // Neon Blue
    health: '#00ff88',       // Green
    education: '#0088ff',    // Neon Blue
    travel: '#ff00ff',       // Pink
    salary: '#00ff88',       // Green (income)
    investment: '#bf00ff',   // Purple
    transfer: '#0088ff',     // Neon Blue
    refund: '#00ff88',       // Green
    subscription: '#ff8800', // Orange
    other: '#008545',        // Deep green
  },

  // ==========================================
  // BACKGROUNDS
  // ==========================================
  background: {
    primary: '#000000',
    secondary: '#020806',
    tertiary: '#051a0f',
    elevated: '#002a17',
  },

  // ==========================================
  // TEXT
  // ==========================================
  text: {
    primary: '#00e67a',
    secondary: '#00cc6a',
    tertiary: '#008545',
    disabled: '#004d2a',
    inverse: '#000000',
    // Aliases for common patterns
    muted: '#008545',       // Alias for tertiary
    subtle: '#004d2a',      // Alias for disabled/very subtle text
    // Semantic text colors (matching new financial system)
    income: '#39FF14',      // Phosphorescent Green - money IN
    expense: '#ff3366',     // Neon Red - money OUT
    balance: '#E6A756',     // Neon Bronze - neutral/balance
    bronze: '#E6A756',      // Neon Bronze - alias
    silver: '#E6A756',      // Legacy alias (now bronze)
  },

  // ==========================================
  // BORDERS
  // ==========================================
  border: {
    default: '#002a17',
    subtle: '#001a0f',
    active: '#00cc6a',
    bright: '#00ff88',
  },

  // ==========================================
  // TRANSPARENT VARIANTS
  // ==========================================
  transparent: {
    // Green (primary)
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
    white05: '#ffffff0d', white10: '#ffffff1a', white20: '#ffffff33', white30: '#ffffff4d', white50: '#ffffff80',

    // Neon family transparent variants (for backgrounds)
    red20: '#ff336633', red10: '#ff33661a', red05: '#ff33660d',
    orange20: '#ff880033', orange10: '#ff88001a', orange05: '#ff88000d',
    blue20: '#0088ff33', blue10: '#0088ff1a', blue05: '#0088ff0d',
    // Cyan aliases for blue (used for transfer badges)
    cyan20: '#0088ff33', cyan10: '#0088ff1a', cyan05: '#0088ff0d',
    purple20: '#bf00ff33', purple10: '#bf00ff1a', purple05: '#bf00ff0d',
    pink20: '#ff00ff33', pink10: '#ff00ff1a', pink05: '#ff00ff0d',
    yellow20: '#ffff0033', yellow10: '#ffff001a', yellow05: '#ffff000d',
    // Phosphorescent Green (income)
    phosphor20: '#39FF1433', phosphor10: '#39FF141a', phosphor05: '#39FF140d',
    // Neon Bronze (neutral)
    bronze20: '#E6A75633', bronze10: '#E6A7561a', bronze05: '#E6A7560d',
    // Legacy silver (now bronze)
    silver20: '#E6A75633', silver10: '#E6A7561a', silver05: '#E6A7560d',
  },

  // ==========================================
  // GRADIENT DEFINITIONS
  // ==========================================
  gradients: {
    // Card gradients
    card: ['#051a0f', '#020806', '#000000'],
    cardSubtle: ['#002a17', '#001a0f', '#000000'],

    // Button gradients
    buttonPrimary: ['#00ff88', '#00cc6a', '#008545'],
    buttonSecondary: ['#008545', '#004d2a', '#002a17'],
    buttonDanger: ['#ff0044', '#cc0036', '#990029'],
    buttonWarning: ['#ff8800', '#cc6d00', '#995200'],

    // Text gradients
    textLuxury: ['#ffffff', '#00ff88', '#00cc6a', '#008545', '#004d2a'],
    textBright: ['#ffffff', '#00ff88', '#00cc6a', '#008545'],
    textPrimary: ['#00ff88', '#00cc6a', '#008545'],
    textSubtle: ['#00e67a', '#00cc6a', '#00a858'],
    textMuted: ['#00cc6a', '#008545', '#004d2a'],

    // Icon gradients
    icon: ['#00ff88', '#008545'],
    iconActive: ['#00ff88', '#00cc6a'],

    // Effect gradients
    fog: ['#00000000', '#00854520', '#00cc6a40'],
    glow: ['#00ff8860', '#00cc6a30', '#00000000'],

    // Semantic gradients (matching new financial system)
    income: ['#39FF14', '#2ACC10'],     // Phosphorescent Green - money IN
    expense: ['#ff3366', '#cc2952'],    // Red - money OUT
    warning: ['#ff8800', '#995200'],
    bronze: ['#F4C077', '#E6A756', '#C4894A'], // Neon Bronze - neutral balance
    silver: ['#F4C077', '#E6A756', '#C4894A'], // Legacy alias (now bronze)
  },

  // ==========================================
  // SHADOWS
  // ==========================================
  shadow: {
    glow: '#00ff88',
    soft: '#00cc6a',
    subtle: '#008545',
    danger: '#ff0044',
    warning: '#ff8800',
  },

  // ==========================================
  // BADGE VARIANTS
  // ==========================================
  badge: {
    success: { bg: '#00ff8820', text: '#00ff88', border: '#00ff8840' },
    warning: { bg: '#ff880020', text: '#ff8800', border: '#ff880040' },
    error: { bg: '#ff004420', text: '#ff0044', border: '#ff004440' },
    info: { bg: '#0088ff20', text: '#0088ff', border: '#0088ff40' },
    premium: { bg: '#bf00ff20', text: '#bf00ff', border: '#bf00ff40' },
    default: { bg: '#00cc6a20', text: '#00cc6a', border: '#00cc6a40' },
  },

  // ==========================================
  // STATUS (Alias for semantic status colors)
  // ==========================================
  status: {
    success: '#39FF14',     // Phosphorescent Green
    warning: '#ff8800',     // Orange
    error: '#ff3366',       // Red
    info: '#0088ff',        // Neon Blue
  },

  // ==========================================
  // PREMIUM (Subscription/Premium branding)
  // ==========================================
  premium: {
    gold: '#ffd700',        // Premium gold for branding
    goldDim: '#e6c200',     // Dimmer gold for secondary elements
    goldBright: '#ffe44d',  // Brighter gold for emphasis
    dark: '#1a1a1a',        // Dark contrast for premium cards
  },
} as const;

export type ColorKey = keyof typeof Colors;

// ==========================================
// COLOR UTILITY FUNCTIONS
// ==========================================

/**
 * Get a color from the chart palette by index
 * Cycles through the palette if index exceeds palette length
 */
export const getChartColor = (index: number, extended: boolean = false): string => {
  const palette = extended ? Colors.chart.extended : Colors.chart.palette;
  return palette[index % palette.length];
};

/**
 * Get category-specific color if available, otherwise use chart palette
 */
export const getCategoryColor = (category: string, fallbackIndex: number = 0): string => {
  const normalizedCategory = category.toLowerCase().replace(/[^a-z]/g, '');
  const categoryColors = Colors.categories as Record<string, string>;
  return categoryColors[normalizedCategory] || getChartColor(fallbackIndex);
};

/**
 * Get semantic color for transaction type (income vs expense)
 * NEW SYSTEM: Phosphorescent Green for income, Neon Red for expense
 */
export const getTransactionColor = (amount: number): string => {
  return amount >= 0 ? '#39FF14' : '#ff3366';
};

/**
 * Get semantic color for investment gain/loss
 * Phosphorescent Green for gains, Neon Red for losses
 */
export const getGainLossColor = (change: number): string => {
  return change >= 0 ? '#39FF14' : '#ff3366';
};

/**
 * Get color for monetary amounts based on type
 * @param amount - The amount value
 * @param type - Optional explicit type override
 */
export const getAmountColor = (
  amount: number,
  type?: 'income' | 'expense' | 'transfer' | 'neutral' | 'refund'
): string => {
  // If type is explicitly specified, use it
  if (type === 'income' || type === 'refund') return '#39FF14';  // Phosphorescent Green
  if (type === 'expense') return '#ff3366';                       // Neon Red
  if (type === 'transfer' || type === 'neutral') return '#E6A756'; // Neon Bronze

  // Otherwise, determine by amount sign
  if (amount > 0) return '#39FF14';   // Positive = income (green)
  if (amount < 0) return '#ff3366';   // Negative = expense (red)
  return '#E6A756';                    // Zero = neutral (bronze)
};

/**
 * Get color for statistics and neutral values
 */
export const getStatisticColor = (): string => '#E6A756';

/**
 * Get color for balance displays
 */
export const getBalanceColor = (): string => '#E6A756';

/**
 * Get budget status color based on spending percentage
 * Uses traffic light system: green (safe), orange (warning), red (danger/over)
 */
export const getBudgetStatusColor = (spent: number, budget: number): string => {
  if (budget <= 0) return Colors.text.tertiary;
  const percentage = (spent / budget) * 100;
  if (percentage >= 100) return Colors.semantic.budgetDanger;
  if (percentage >= 80) return Colors.semantic.budgetWarning;
  return Colors.semantic.budgetSafe;
};

/**
 * Get alert severity color
 */
export const getSeverityColor = (severity: 'success' | 'warning' | 'error' | 'info'): string => {
  return Colors.semantic[severity];
};

/**
 * Get health score color based on score value (0-100)
 * Uses traffic light system: green (70+), orange (40-69), red (<40)
 * Used for financial health indicators, credit scores, etc.
 */
export const getHealthScoreColor = (score: number): string => {
  if (score >= 70) return Colors.semantic.income;        // #39FF14 - Healthy/Good
  if (score >= 40) return Colors.semantic.budgetWarning; // #FFB347 - Warning/Needs attention
  return Colors.semantic.expense;                         // #ff3366 - Poor/Danger
};

export default Colors;
