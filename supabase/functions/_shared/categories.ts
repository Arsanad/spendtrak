/**
 * Shared category lookup utility for edge functions
 * Dynamically fetches category name → ID mapping from the database
 * Falls back to hardcoded map if the DB query fails
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Hardcoded fallback map — used when DB lookup fails
const FALLBACK_CATEGORY_MAP: Record<string, string> = {
  'Food': '20fd8f82-a55e-4c9c-8782-b55f4041e2d5',
  'Food & Dining': '20fd8f82-a55e-4c9c-8782-b55f4041e2d5',
  'Transport': '4a64920f-9180-4745-8084-ac7bec7db6e7',
  'Transportation': '4a64920f-9180-4745-8084-ac7bec7db6e7',
  'Shopping': '6139efe3-923c-4a89-ac5e-347a78a71e80',
  'Entertainment': 'd8fe056c-5e66-47ba-9911-de147528447f',
  'Utilities': 'fc30b270-589a-457a-ad97-ed67b42c717b',
  'Bills & Utilities': 'fc30b270-589a-457a-ad97-ed67b42c717b',
  'Subscriptions': 'fc30b270-589a-457a-ad97-ed67b42c717b',
  'Health': '37caa6f9-f33c-4dbc-b3fd-c639f68caea6',
  'Travel': 'dec1dd44-667e-440f-8de5-a66391335d9b',
  'Education': 'db67a70d-5a3f-4146-ad67-da26ffe3773b',
  'Other': '7ff33eba-a11d-4fb3-97aa-f293bf02c32f',
};

const FALLBACK_DEFAULT_CATEGORY_ID = '7ff33eba-a11d-4fb3-97aa-f293bf02c32f'; // Other

export interface CategoryLookup {
  map: Record<string, string>;
  defaultCategoryId: string;
}

/**
 * Fetch category name → ID mapping from the database.
 * Returns hardcoded fallback if the query fails.
 *
 * Usage:
 *   const { map, defaultCategoryId } = await getCategoryMap(supabase);
 *   const categoryId = map[parsedReceipt.category] || defaultCategoryId;
 */
export async function getCategoryMap(supabase: SupabaseClient): Promise<CategoryLookup> {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name');

    if (error || !categories || categories.length === 0) {
      console.warn('Failed to fetch categories from DB, using fallback map:', error?.message);
      return {
        map: FALLBACK_CATEGORY_MAP,
        defaultCategoryId: FALLBACK_DEFAULT_CATEGORY_ID,
      };
    }

    // Build the dynamic map from DB rows
    const map: Record<string, string> = {};
    let defaultCategoryId = FALLBACK_DEFAULT_CATEGORY_ID;

    for (const cat of categories) {
      map[cat.name] = cat.id;

      // Also map common aliases
      if (cat.name === 'Food') {
        map['Food & Dining'] = cat.id;
      }
      if (cat.name === 'Transport') {
        map['Transportation'] = cat.id;
      }
      if (cat.name === 'Utilities') {
        map['Bills & Utilities'] = cat.id;
        map['Subscriptions'] = cat.id;
      }
      if (cat.name === 'Other') {
        defaultCategoryId = cat.id;
      }
    }

    return { map, defaultCategoryId };
  } catch (err) {
    console.error('Exception fetching categories, using fallback map:', err);
    return {
      map: FALLBACK_CATEGORY_MAP,
      defaultCategoryId: FALLBACK_DEFAULT_CATEGORY_ID,
    };
  }
}
