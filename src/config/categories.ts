/**
 * Category Configuration
 * Default categories for expense tracking
 */

import { COLORS } from './theme';

export interface CategoryConfig {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  keywords: string[];
  isDefault: boolean;
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'food-dining',
    name: 'Food & Dining',
    nameAr: 'الطعام والمطاعم',
    icon: 'restaurant',
    color: COLORS.category.foodDining,
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'kfc',
      'burger', 'pizza', 'talabat', 'deliveroo', 'careem now', 'zomato',
      'grocery', 'carrefour', 'lulu', 'spinneys', 'waitrose', 'choithrams',
      'bakery', 'sweets', 'ice cream', 'juice', 'shawarma', 'biryani',
      'tim hortons', 'dunkin', 'costa', 'food', 'meal', 'lunch', 'dinner',
      'breakfast', 'brunch', 'fine dining', 'fast food', 'takeaway',
      'sushi', 'chinese', 'indian', 'lebanese', 'italian', 'thai'
    ],
    isDefault: true,
  },
  {
    id: 'transportation',
    name: 'Transportation',
    nameAr: 'المواصلات',
    icon: 'car',
    color: COLORS.category.transportation,
    keywords: [
      'gas', 'petrol', 'fuel', 'shell', 'chevron', 'exxon', 'bp',
      'uber', 'lyft', 'taxi', 'metro', 'bus', 'subway', 'parking',
      'car wash', 'service', 'maintenance', 'tire', 'toll',
      'oil change', 'car registration', 'insurance', 'car rental',
      'gas station', 'petrol station', 'traffic fine', 'valet'
    ],
    isDefault: true,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    nameAr: 'التسوق',
    icon: 'cart',
    color: COLORS.category.shopping,
    keywords: [
      'amazon', 'noon', 'namshi', 'shein', 'h&m', 'zara', 'nike',
      'adidas', 'ikea', 'home centre', 'mall', 'dubai mall', 'moe',
      'electronics', 'sharaf dg', 'jumbo', 'virgin', 'clothing',
      'shoes', 'accessories', 'jewelry', 'gold', 'watch', 'bags',
      'fashion', 'boutique', 'retail', 'department store', 'outlet',
      'online shopping', 'marketplace', 'souq', 'dragon mart'
    ],
    isDefault: true,
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    nameAr: 'الترفيه',
    icon: 'film',
    color: COLORS.category.entertainment,
    keywords: [
      'netflix', 'spotify', 'apple', 'disney', 'osn', 'shahid', 'starzplay',
      'anghami', 'youtube', 'cinema', 'vox', 'reel', 'novo', 'movie',
      'concert', 'event', 'theme park', 'dubai parks', 'img worlds',
      'kidzania', 'gaming', 'playstation', 'xbox', 'steam', 'nintendo',
      'museum', 'exhibition', 'show', 'ticket', 'booking', 'club',
      'lounge', 'bar', 'nightlife', 'sports', 'golf', 'tennis'
    ],
    isDefault: true,
  },
  {
    id: 'bills-utilities',
    name: 'Bills & Utilities',
    nameAr: 'الفواتير والخدمات',
    icon: 'flash',
    color: COLORS.category.billsUtilities,
    keywords: [
      'electric', 'electricity', 'water', 'verizon', 'at&t', 't-mobile', 'internet',
      'mobile', 'phone', 'comcast', 'spectrum', 'xfinity', 'cable',
      'utility', 'bill', 'gas bill', 'power',
      'subscription', 'monthly', 'annual', 'renewal', 'recharge',
      'postpaid', 'prepaid', 'wifi', 'broadband', 'fiber'
    ],
    isDefault: true,
  },
  {
    id: 'health',
    name: 'Health',
    nameAr: 'الصحة',
    icon: 'medical',
    color: COLORS.category.health,
    keywords: [
      'pharmacy', 'medicine', 'hospital', 'clinic', 'doctor', 'dentist',
      'life pharmacy', 'boots', 'aster', 'nmc', 'mediclinic', 'medcare',
      'insurance', 'daman', 'thiqa', 'medical', 'health', 'gym',
      'fitness first', 'gymnation', 'fitness', 'wellness', 'spa',
      'optician', 'glasses', 'laboratory', 'test', 'checkup',
      'physiotherapy', 'chiropractor', 'mental health', 'therapy'
    ],
    isDefault: true,
  },
  {
    id: 'travel',
    name: 'Travel',
    nameAr: 'السفر',
    icon: 'airplane',
    color: COLORS.category.travel,
    keywords: [
      'emirates', 'etihad', 'flydubai', 'air arabia', 'flight', 'airline',
      'hotel', 'marriott', 'hilton', 'booking', 'expedia', 'airbnb',
      'visa', 'holiday', 'vacation', 'trip', 'tourism', 'airport',
      'luggage', 'travel insurance', 'cruise', 'resort', 'all inclusive',
      'tour', 'excursion', 'safari', 'adventure', 'staycation'
    ],
    isDefault: true,
  },
  {
    id: 'education',
    name: 'Education',
    nameAr: 'التعليم',
    icon: 'school',
    color: COLORS.category.education,
    keywords: [
      'school', 'university', 'college', 'course', 'training', 'tuition',
      'gems', 'taaleem', 'sabis', 'book', 'stationery', 'udemy',
      'coursera', 'masterclass', 'certification', 'exam', 'fees',
      'workshop', 'seminar', 'conference', 'learning', 'tutoring',
      'language', 'nursery', 'daycare', 'uniform', 'supplies'
    ],
    isDefault: true,
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    nameAr: 'العناية الشخصية',
    icon: 'body',
    color: COLORS.category.personalCare,
    keywords: [
      'salon', 'spa', 'barber', 'haircut', 'beauty', 'skincare',
      'cosmetics', 'sephora', 'faces', 'nails', 'massage', 'wellness',
      'grooming', 'facial', 'waxing', 'threading', 'makeup', 'perfume',
      'fragrance', 'skincare', 'dermatologist', 'aesthetics', 'botox'
    ],
    isDefault: true,
  },
  {
    id: 'housing',
    name: 'Housing',
    nameAr: 'السكن',
    icon: 'home',
    color: COLORS.category.housing,
    keywords: [
      'rent', 'mortgage', 'maintenance', 'repair', 'cleaning', 'maid',
      'furniture', 'home', 'apartment', 'condo', 'real estate',
      'landlord', 'tenant', 'lease', 'deposit', 'commission',
      'renovation', 'interior', 'appliance', 'plumber', 'electrician',
      'hvac', 'pest control', 'moving', 'storage'
    ],
    isDefault: true,
  },
  {
    id: 'family',
    name: 'Family',
    nameAr: 'العائلة',
    icon: 'people',
    color: COLORS.category.family,
    keywords: [
      'kids', 'children', 'baby', 'toys', 'nursery', 'daycare',
      'nanny', 'family', 'gift', 'birthday', 'party', 'celebration',
      'wedding', 'anniversary', 'maternity', 'paternity', 'diapers',
      'formula', 'stroller', 'car seat', 'playground', 'activities'
    ],
    isDefault: true,
  },
  {
    id: 'other',
    name: 'Other',
    nameAr: 'أخرى',
    icon: 'ellipsis-horizontal',
    color: COLORS.category.other,
    keywords: [],
    isDefault: true,
  },
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): CategoryConfig | undefined {
  return DEFAULT_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get category color by ID
 */
export function getCategoryColor(id: string): string {
  const category = getCategoryById(id);
  return category?.color || COLORS.category.other;
}

/**
 * Get category icon by ID
 */
export function getCategoryIcon(id: string): string {
  const category = getCategoryById(id);
  return category?.icon || 'ellipsis-horizontal';
}

/**
 * Suggest category based on merchant name
 */
export function suggestCategory(merchantName: string): CategoryConfig {
  const normalizedMerchant = merchantName.toLowerCase();

  for (const category of DEFAULT_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (normalizedMerchant.includes(keyword)) {
        return category;
      }
    }
  }

  // Default to "Other"
  return DEFAULT_CATEGORIES.find((cat) => cat.id === 'other')!;
}

/**
 * Get category options for dropdown/picker
 */
export function getCategoryOptions(): { label: string; value: string; icon: string; color: string }[] {
  return DEFAULT_CATEGORIES.map((cat) => ({
    label: cat.name,
    value: cat.id,
    icon: cat.icon,
    color: cat.color,
  }));
}

export default DEFAULT_CATEGORIES;
