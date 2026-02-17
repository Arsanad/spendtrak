/**
 * Subscription Detection Patterns
 * Used to identify subscriptions from emails and transactions
 */

export interface SubscriptionPattern {
  id: string;
  merchantName: string;
  displayName: string;
  icon: string;
  category: string;
  patterns: string[];
  frequency: 'monthly' | 'yearly' | 'weekly' | 'quarterly';
  cancellationUrl?: string;
  cancellationInstructions?: string;
  typicalPrice?: {
    min: number;
    max: number;
    currency: string;
  };
}

export const SUBSCRIPTION_PATTERNS: SubscriptionPattern[] = [
  // Streaming - Video
  {
    id: 'netflix',
    merchantName: 'Netflix',
    displayName: 'Netflix',
    icon: '🎬',
    category: 'entertainment',
    patterns: ['netflix', 'netflix.com', 'netflix inc'],
    frequency: 'monthly',
    cancellationUrl: 'https://www.netflix.com/cancelplan',
    cancellationInstructions: 'Go to Account → Cancel Membership',
    typicalPrice: { min: 29, max: 69, currency: 'USD' },
  },
  {
    id: 'disney-plus',
    merchantName: 'Disney+',
    displayName: 'Disney+',
    icon: '🏰',
    category: 'entertainment',
    patterns: ['disney+', 'disneyplus', 'disney plus', 'disney streaming'],
    frequency: 'monthly',
    cancellationUrl: 'https://www.disneyplus.com/account',
    typicalPrice: { min: 29, max: 50, currency: 'USD' },
  },
  {
    id: 'osn',
    merchantName: 'OSN',
    displayName: 'OSN Streaming',
    icon: '📺',
    category: 'entertainment',
    patterns: ['osn', 'osn.com', 'osn streaming', 'osn+'],
    frequency: 'monthly',
    typicalPrice: { min: 35, max: 99, currency: 'USD' },
  },
  {
    id: 'shahid',
    merchantName: 'Shahid VIP',
    displayName: 'Shahid VIP',
    icon: '📱',
    category: 'entertainment',
    patterns: ['shahid', 'shahid vip', 'shahid.mbc.net', 'mbc shahid'],
    frequency: 'monthly',
    typicalPrice: { min: 19, max: 39, currency: 'USD' },
  },
  {
    id: 'starzplay',
    merchantName: 'StarzPlay',
    displayName: 'StarzPlay',
    icon: '⭐',
    category: 'entertainment',
    patterns: ['starzplay', 'starz play', 'starz', 'lionsgate+'],
    frequency: 'monthly',
    typicalPrice: { min: 25, max: 45, currency: 'USD' },
  },
  {
    id: 'amazon-prime',
    merchantName: 'Amazon Prime',
    displayName: 'Amazon Prime',
    icon: '📦',
    category: 'shopping',
    patterns: ['amazon prime', 'prime video', 'amazon.ae prime', 'prime membership'],
    frequency: 'yearly',
    cancellationUrl: 'https://www.amazon.ae/gp/primecentral',
    typicalPrice: { min: 140, max: 180, currency: 'USD' },
  },
  {
    id: 'youtube-premium',
    merchantName: 'YouTube Premium',
    displayName: 'YouTube Premium',
    icon: '▶️',
    category: 'entertainment',
    patterns: ['youtube premium', 'youtube music', 'google youtube', 'youtube.com/premium'],
    frequency: 'monthly',
    cancellationUrl: 'https://www.youtube.com/paid_memberships',
    typicalPrice: { min: 22, max: 45, currency: 'USD' },
  },
  {
    id: 'apple-tv-plus',
    merchantName: 'Apple TV+',
    displayName: 'Apple TV+',
    icon: '🍎',
    category: 'entertainment',
    patterns: ['apple tv+', 'apple tv plus', 'apple.com/bill tv'],
    frequency: 'monthly',
    typicalPrice: { min: 19, max: 35, currency: 'USD' },
  },
  {
    id: 'hbo-max',
    merchantName: 'HBO Max',
    displayName: 'HBO Max',
    icon: '🎭',
    category: 'entertainment',
    patterns: ['hbo max', 'hbo', 'max streaming', 'warnermedia'],
    frequency: 'monthly',
    typicalPrice: { min: 29, max: 55, currency: 'USD' },
  },

  // Streaming - Music
  {
    id: 'spotify',
    merchantName: 'Spotify',
    displayName: 'Spotify',
    icon: '🎵',
    category: 'entertainment',
    patterns: ['spotify', 'spotify.com', 'spotify ab', 'spotify premium'],
    frequency: 'monthly',
    cancellationUrl: 'https://www.spotify.com/account/subscription/',
    typicalPrice: { min: 19, max: 45, currency: 'USD' },
  },
  {
    id: 'apple-music',
    merchantName: 'Apple Music',
    displayName: 'Apple Music',
    icon: '🍎',
    category: 'entertainment',
    patterns: ['apple music', 'itunes music', 'apple.com/bill music'],
    frequency: 'monthly',
    typicalPrice: { min: 16, max: 40, currency: 'USD' },
  },
  {
    id: 'anghami',
    merchantName: 'Anghami',
    displayName: 'Anghami Plus',
    icon: '🎧',
    category: 'entertainment',
    patterns: ['anghami', 'anghami plus', 'anghami premium'],
    frequency: 'monthly',
    typicalPrice: { min: 14, max: 30, currency: 'USD' },
  },
  {
    id: 'deezer',
    merchantName: 'Deezer',
    displayName: 'Deezer Premium',
    icon: '🎶',
    category: 'entertainment',
    patterns: ['deezer', 'deezer premium', 'deezer family'],
    frequency: 'monthly',
    typicalPrice: { min: 18, max: 36, currency: 'USD' },
  },
  {
    id: 'soundcloud',
    merchantName: 'SoundCloud',
    displayName: 'SoundCloud Go+',
    icon: '☁️',
    category: 'entertainment',
    patterns: ['soundcloud', 'soundcloud go', 'soundcloud premium'],
    frequency: 'monthly',
    typicalPrice: { min: 20, max: 40, currency: 'USD' },
  },

  // Delivery Services
  {
    id: 'talabat-pro',
    merchantName: 'Talabat Pro',
    displayName: 'Talabat Pro',
    icon: '🛵',
    category: 'food-dining',
    patterns: ['talabat pro', 'talabat subscription', 'talabat premium'],
    frequency: 'monthly',
    typicalPrice: { min: 29, max: 49, currency: 'USD' },
  },
  {
    id: 'careem-plus',
    merchantName: 'Careem Plus',
    displayName: 'Careem Plus',
    icon: '🚗',
    category: 'transportation',
    patterns: ['careem plus', 'careem subscription', 'careem membership'],
    frequency: 'monthly',
    typicalPrice: { min: 25, max: 50, currency: 'USD' },
  },
  {
    id: 'deliveroo-plus',
    merchantName: 'Deliveroo Plus',
    displayName: 'Deliveroo Plus',
    icon: '🍕',
    category: 'food-dining',
    patterns: ['deliveroo plus', 'deliveroo subscription', 'deliveroo premium'],
    frequency: 'monthly',
    typicalPrice: { min: 30, max: 45, currency: 'USD' },
  },
  {
    id: 'noon-vip',
    merchantName: 'Noon VIP',
    displayName: 'Noon VIP',
    icon: '🟡',
    category: 'shopping',
    patterns: ['noon vip', 'noon premium', 'noon subscription', 'noon minutes'],
    frequency: 'yearly',
    typicalPrice: { min: 99, max: 149, currency: 'USD' },
  },
  {
    id: 'instashop-plus',
    merchantName: 'InstaShop Plus',
    displayName: 'InstaShop Plus',
    icon: '🛒',
    category: 'food-dining',
    patterns: ['instashop plus', 'instashop subscription', 'instashop premium'],
    frequency: 'monthly',
    typicalPrice: { min: 19, max: 35, currency: 'USD' },
  },

  // Cloud & Software
  {
    id: 'icloud',
    merchantName: 'iCloud',
    displayName: 'iCloud Storage',
    icon: '☁️',
    category: 'other',
    patterns: ['icloud', 'apple icloud', 'apple.com/bill icloud', 'icloud storage'],
    frequency: 'monthly',
    typicalPrice: { min: 3, max: 40, currency: 'USD' },
  },
  {
    id: 'google-one',
    merchantName: 'Google One',
    displayName: 'Google One',
    icon: '🔵',
    category: 'other',
    patterns: ['google one', 'google storage', 'google.com/one', 'google drive storage'],
    frequency: 'monthly',
    typicalPrice: { min: 7, max: 37, currency: 'USD' },
  },
  {
    id: 'dropbox',
    merchantName: 'Dropbox',
    displayName: 'Dropbox',
    icon: '📁',
    category: 'other',
    patterns: ['dropbox', 'dropbox plus', 'dropbox professional'],
    frequency: 'monthly',
    typicalPrice: { min: 40, max: 90, currency: 'USD' },
  },
  {
    id: 'microsoft-365',
    merchantName: 'Microsoft 365',
    displayName: 'Microsoft 365',
    icon: '📊',
    category: 'other',
    patterns: ['microsoft 365', 'office 365', 'microsoft subscription', 'm365'],
    frequency: 'yearly',
    typicalPrice: { min: 250, max: 450, currency: 'USD' },
  },
  {
    id: 'adobe-creative',
    merchantName: 'Adobe Creative Cloud',
    displayName: 'Adobe CC',
    icon: '🎨',
    category: 'other',
    patterns: ['adobe', 'creative cloud', 'adobe cc', 'photoshop', 'lightroom'],
    frequency: 'monthly',
    typicalPrice: { min: 80, max: 250, currency: 'USD' },
  },
  {
    id: 'notion',
    merchantName: 'Notion',
    displayName: 'Notion',
    icon: '📝',
    category: 'other',
    patterns: ['notion', 'notion.so', 'notion labs'],
    frequency: 'monthly',
    typicalPrice: { min: 15, max: 40, currency: 'USD' },
  },

  // Fitness
  {
    id: 'fitness-first',
    merchantName: 'Fitness First',
    displayName: 'Fitness First',
    icon: '💪',
    category: 'health',
    patterns: ['fitness first', 'fitnessfirst'],
    frequency: 'monthly',
    typicalPrice: { min: 350, max: 800, currency: 'USD' },
  },
  {
    id: 'gymnation',
    merchantName: 'GymNation',
    displayName: 'GymNation',
    icon: '🏋️',
    category: 'health',
    patterns: ['gymnation', 'gym nation'],
    frequency: 'monthly',
    typicalPrice: { min: 99, max: 149, currency: 'USD' },
  },
  {
    id: 'gold-gym',
    merchantName: "Gold's Gym",
    displayName: "Gold's Gym",
    icon: '🥇',
    category: 'health',
    patterns: ['gold gym', 'golds gym', "gold's gym"],
    frequency: 'monthly',
    typicalPrice: { min: 300, max: 600, currency: 'USD' },
  },
  {
    id: 'barry-bootcamp',
    merchantName: "Barry's Bootcamp",
    displayName: "Barry's",
    icon: '🏃',
    category: 'health',
    patterns: ["barry's", 'barrys bootcamp', "barry's bootcamp"],
    frequency: 'monthly',
    typicalPrice: { min: 800, max: 1500, currency: 'USD' },
  },
  {
    id: 'peloton',
    merchantName: 'Peloton',
    displayName: 'Peloton',
    icon: '🚴',
    category: 'health',
    patterns: ['peloton', 'peloton digital', 'onepeloton'],
    frequency: 'monthly',
    typicalPrice: { min: 50, max: 180, currency: 'USD' },
  },
  {
    id: 'classpass',
    merchantName: 'ClassPass',
    displayName: 'ClassPass',
    icon: '🧘',
    category: 'health',
    patterns: ['classpass', 'class pass'],
    frequency: 'monthly',
    typicalPrice: { min: 150, max: 400, currency: 'USD' },
  },

  // Apps & Services
  {
    id: 'linkedin-premium',
    merchantName: 'LinkedIn Premium',
    displayName: 'LinkedIn Premium',
    icon: '💼',
    category: 'other',
    patterns: ['linkedin premium', 'linkedin subscription', 'linkedin learning'],
    frequency: 'monthly',
    typicalPrice: { min: 100, max: 220, currency: 'USD' },
  },
  {
    id: 'chatgpt-plus',
    merchantName: 'ChatGPT Plus',
    displayName: 'ChatGPT Plus',
    icon: '🤖',
    category: 'other',
    patterns: ['openai', 'chatgpt plus', 'chatgpt subscription', 'gpt-4'],
    frequency: 'monthly',
    typicalPrice: { min: 73, max: 80, currency: 'USD' },
  },
  {
    id: 'medium',
    merchantName: 'Medium',
    displayName: 'Medium Membership',
    icon: '📝',
    category: 'other',
    patterns: ['medium membership', 'medium.com', 'medium subscription'],
    frequency: 'monthly',
    typicalPrice: { min: 18, max: 25, currency: 'USD' },
  },
  {
    id: 'canva-pro',
    merchantName: 'Canva Pro',
    displayName: 'Canva Pro',
    icon: '🎨',
    category: 'other',
    patterns: ['canva', 'canva pro', 'canva premium'],
    frequency: 'monthly',
    typicalPrice: { min: 45, max: 90, currency: 'USD' },
  },
  {
    id: 'grammarly',
    merchantName: 'Grammarly',
    displayName: 'Grammarly Premium',
    icon: '✍️',
    category: 'other',
    patterns: ['grammarly', 'grammarly premium', 'grammarly pro'],
    frequency: 'monthly',
    typicalPrice: { min: 45, max: 110, currency: 'USD' },
  },

  // News & Publications
  {
    id: 'nyt',
    merchantName: 'New York Times',
    displayName: 'NY Times',
    icon: '📰',
    category: 'other',
    patterns: ['new york times', 'nytimes', 'nyt', 'ny times'],
    frequency: 'monthly',
    typicalPrice: { min: 15, max: 50, currency: 'USD' },
  },
  {
    id: 'economist',
    merchantName: 'The Economist',
    displayName: 'The Economist',
    icon: '📊',
    category: 'other',
    patterns: ['economist', 'the economist'],
    frequency: 'monthly',
    typicalPrice: { min: 50, max: 150, currency: 'USD' },
  },
  {
    id: 'wsj',
    merchantName: 'Wall Street Journal',
    displayName: 'WSJ',
    icon: '📈',
    category: 'other',
    patterns: ['wall street journal', 'wsj', 'dow jones'],
    frequency: 'monthly',
    typicalPrice: { min: 40, max: 100, currency: 'USD' },
  },
  {
    id: 'bloomberg',
    merchantName: 'Bloomberg',
    displayName: 'Bloomberg',
    icon: '💹',
    category: 'other',
    patterns: ['bloomberg', 'bloomberg.com', 'bloomberg news'],
    frequency: 'monthly',
    typicalPrice: { min: 130, max: 180, currency: 'USD' },
  },

  // Gaming
  {
    id: 'playstation-plus',
    merchantName: 'PlayStation Plus',
    displayName: 'PS Plus',
    icon: '🎮',
    category: 'entertainment',
    patterns: ['playstation plus', 'ps plus', 'sony playstation', 'psn'],
    frequency: 'yearly',
    typicalPrice: { min: 180, max: 450, currency: 'USD' },
  },
  {
    id: 'xbox-gamepass',
    merchantName: 'Xbox Game Pass',
    displayName: 'Xbox Game Pass',
    icon: '🎯',
    category: 'entertainment',
    patterns: ['xbox game pass', 'microsoft xbox', 'game pass', 'xbox ultimate'],
    frequency: 'monthly',
    typicalPrice: { min: 35, max: 60, currency: 'USD' },
  },
  {
    id: 'nintendo-online',
    merchantName: 'Nintendo Switch Online',
    displayName: 'Nintendo Online',
    icon: '🕹️',
    category: 'entertainment',
    patterns: ['nintendo', 'nintendo switch online', 'nintendo online'],
    frequency: 'yearly',
    typicalPrice: { min: 70, max: 150, currency: 'USD' },
  },
  {
    id: 'steam',
    merchantName: 'Steam',
    displayName: 'Steam',
    icon: '🎮',
    category: 'entertainment',
    patterns: ['steam', 'valve', 'steam games'],
    frequency: 'monthly',
    typicalPrice: { min: 20, max: 200, currency: 'USD' },
  },

  // VPN & Security
  {
    id: 'nordvpn',
    merchantName: 'NordVPN',
    displayName: 'NordVPN',
    icon: '🔒',
    category: 'other',
    patterns: ['nordvpn', 'nord vpn', 'nordsec'],
    frequency: 'yearly',
    typicalPrice: { min: 150, max: 400, currency: 'USD' },
  },
  {
    id: 'expressvpn',
    merchantName: 'ExpressVPN',
    displayName: 'ExpressVPN',
    icon: '🛡️',
    category: 'other',
    patterns: ['expressvpn', 'express vpn'],
    frequency: 'yearly',
    typicalPrice: { min: 200, max: 500, currency: 'USD' },
  },
  {
    id: '1password',
    merchantName: '1Password',
    displayName: '1Password',
    icon: '🔐',
    category: 'other',
    patterns: ['1password', 'one password', 'agilebits'],
    frequency: 'yearly',
    typicalPrice: { min: 100, max: 200, currency: 'USD' },
  },
];

/**
 * Email patterns that indicate subscription charges
 */
export const SUBSCRIPTION_EMAIL_PATTERNS = [
  'your subscription',
  'subscription charge',
  'recurring payment',
  'monthly charge',
  'annual charge',
  'yearly charge',
  'membership fee',
  'renewal',
  'auto-renewal',
  'billing cycle',
  'next billing date',
  'your membership',
  'premium subscription',
  'plan renewal',
  'subscription renewed',
  'payment processed for subscription',
  'automatic payment',
  'recurring billing',
];

/**
 * Detect subscription from merchant name
 */
export function detectSubscription(merchantName: string | null | undefined): SubscriptionPattern | null {
  // Guard against undefined/null merchant name
  if (!merchantName) {
    return null;
  }

  const normalized = merchantName.toLowerCase();

  for (const sub of SUBSCRIPTION_PATTERNS) {
    for (const pattern of sub.patterns) {
      if (normalized.includes(pattern)) {
        return sub;
      }
    }
  }

  return null;
}

/**
 * Check if email indicates a subscription
 */
export function isSubscriptionEmail(subject: string | null | undefined, body: string | null | undefined): boolean {
  const combined = `${subject || ''} ${body || ''}`.toLowerCase();

  return SUBSCRIPTION_EMAIL_PATTERNS.some((pattern) =>
    combined.includes(pattern)
  );
}

/**
 * Get subscription by ID
 */
export function getSubscriptionById(id: string): SubscriptionPattern | undefined {
  return SUBSCRIPTION_PATTERNS.find((sub) => sub.id === id);
}

/**
 * Get all subscriptions by category
 */
export function getSubscriptionsByCategory(category: string): SubscriptionPattern[] {
  return SUBSCRIPTION_PATTERNS.filter((sub) => sub.category === category);
}

/**
 * Calculate annual cost from subscription
 */
export function calculateAnnualCost(price: number, frequency: SubscriptionPattern['frequency']): number {
  switch (frequency) {
    case 'weekly':
      return price * 52;
    case 'monthly':
      return price * 12;
    case 'quarterly':
      return price * 4;
    case 'yearly':
      return price;
    default:
      return price * 12;
  }
}

export default SUBSCRIPTION_PATTERNS;
