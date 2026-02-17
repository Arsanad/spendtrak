/**
 * Date Presets Service
 * Custom date range filters for transactions and reports
 */

import { supabase } from './supabase';
import type {
  CustomDatePreset,
  CustomDatePresetInsert,
  CustomDatePresetUpdate,
} from '@/types';

/**
 * Built-in date presets (not stored in database)
 */
export const BUILT_IN_PRESETS = [
  { id: 'today', name: 'Today', relativeDays: 0 },
  { id: 'yesterday', name: 'Yesterday', relativeDays: 1 },
  { id: 'last-7-days', name: 'Last 7 Days', relativeDays: 7 },
  { id: 'last-14-days', name: 'Last 14 Days', relativeDays: 14 },
  { id: 'last-30-days', name: 'Last 30 Days', relativeDays: 30 },
  { id: 'last-90-days', name: 'Last 90 Days', relativeDays: 90 },
  { id: 'this-month', name: 'This Month', type: 'thisMonth' },
  { id: 'last-month', name: 'Last Month', type: 'lastMonth' },
  { id: 'this-quarter', name: 'This Quarter', type: 'thisQuarter' },
  { id: 'last-quarter', name: 'Last Quarter', type: 'lastQuarter' },
  { id: 'this-year', name: 'This Year', type: 'thisYear' },
  { id: 'last-year', name: 'Last Year', type: 'lastYear' },
] as const;

export type BuiltInPresetId = typeof BUILT_IN_PRESETS[number]['id'];

/**
 * Date range result
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Calculate date range from a built-in preset
 */
export function getBuiltInPresetDateRange(presetId: BuiltInPresetId): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const preset = BUILT_IN_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }

  let startDate: Date;
  let endDate: Date = new Date(today);

  if ('relativeDays' in preset) {
    if (preset.relativeDays === 0) {
      // Today
      startDate = new Date(today);
    } else if (preset.relativeDays === 1 && preset.id === 'yesterday') {
      // Yesterday
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
    } else {
      // Last N days
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - preset.relativeDays + 1);
    }
  } else if ('type' in preset) {
    switch (preset.type) {
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisQuarter': {
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        startDate = new Date(today.getFullYear(), quarterStart, 1);
        endDate = new Date(today.getFullYear(), quarterStart + 3, 0);
        break;
      }
      case 'lastQuarter': {
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const lastQuarterStart = (currentQuarter - 1) * 3;
        if (currentQuarter === 0) {
          startDate = new Date(today.getFullYear() - 1, 9, 1);
          endDate = new Date(today.getFullYear() - 1, 12, 0);
        } else {
          startDate = new Date(today.getFullYear(), lastQuarterStart, 1);
          endDate = new Date(today.getFullYear(), lastQuarterStart + 3, 0);
        }
        break;
      }
      case 'thisYear':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(today);
    }
  } else {
    startDate = new Date(today);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Get user's custom date presets
 */
export async function getCustomDatePresets(): Promise<CustomDatePreset[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('custom_date_presets')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Create a custom date preset
 */
export async function createCustomDatePreset(
  preset: Omit<CustomDatePresetInsert, 'user_id'>
): Promise<CustomDatePreset> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get current max sort order
  const { data: existing } = await supabase
    .from('custom_date_presets')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const maxSortOrder = existing?.[0]?.sort_order ?? -1;

  const newPreset: CustomDatePresetInsert = {
    ...preset,
    user_id: user.id,
    sort_order: maxSortOrder + 1,
  };

  const { data, error } = await supabase
    .from('custom_date_presets')
    .insert(newPreset)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a custom date preset
 */
export async function updateCustomDatePreset(
  id: string,
  updates: CustomDatePresetUpdate
): Promise<CustomDatePreset> {
  const { data, error } = await supabase
    .from('custom_date_presets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a custom date preset
 */
export async function deleteCustomDatePreset(id: string): Promise<void> {
  const { error } = await supabase
    .from('custom_date_presets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Calculate date range from a custom preset
 */
export function getCustomPresetDateRange(preset: CustomDatePreset): DateRange {
  if (preset.is_relative && preset.relative_days !== null) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - preset.relative_days + 1);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  }

  if (preset.start_date && preset.end_date) {
    return {
      startDate: preset.start_date,
      endDate: preset.end_date,
    };
  }

  // Fallback to today if preset is misconfigured
  const today = new Date().toISOString().split('T')[0];
  return { startDate: today, endDate: today };
}

/**
 * Get all presets (built-in + custom) with date ranges
 */
export async function getAllPresetsWithDateRanges(): Promise<
  Array<{
    id: string;
    name: string;
    isBuiltIn: boolean;
    isRelative: boolean;
    dateRange: DateRange;
  }>
> {
  const customPresets = await getCustomDatePresets();

  const builtInWithRanges = BUILT_IN_PRESETS.map((preset) => ({
    id: preset.id,
    name: preset.name,
    isBuiltIn: true,
    isRelative: true,
    dateRange: getBuiltInPresetDateRange(preset.id),
  }));

  const customWithRanges = customPresets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    isBuiltIn: false,
    isRelative: preset.is_relative,
    dateRange: getCustomPresetDateRange(preset),
  }));

  return [...builtInWithRanges, ...customWithRanges];
}

/**
 * Parse a natural language date string (basic implementation)
 * Examples: "last week", "past 3 months", "january 2024"
 */
export function parseNaturalDate(input: string): DateRange | null {
  const normalized = input.toLowerCase().trim();
  const today = new Date();

  // "last N days/weeks/months"
  const lastNMatch = normalized.match(/last\s+(\d+)\s+(day|week|month)s?/);
  if (lastNMatch) {
    const count = parseInt(lastNMatch[1], 10);
    const unit = lastNMatch[2];
    const startDate = new Date(today);

    switch (unit) {
      case 'day':
        startDate.setDate(startDate.getDate() - count);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - count * 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - count);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    };
  }

  // "past N days/weeks/months" (same as last)
  const pastNMatch = normalized.match(/past\s+(\d+)\s+(day|week|month)s?/);
  if (pastNMatch) {
    return parseNaturalDate(normalized.replace('past', 'last'));
  }

  // Month name with optional year: "january 2024" or "jan"
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  for (let i = 0; i < months.length; i++) {
    if (normalized.includes(months[i]) || normalized.startsWith(shortMonths[i])) {
      const yearMatch = normalized.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : today.getFullYear();

      const startDate = new Date(year, i, 1);
      const endDate = new Date(year, i + 1, 0);

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
    }
  }

  // Year only: "2024"
  const yearOnlyMatch = normalized.match(/^\d{4}$/);
  if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[0], 10);
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }

  return null;
}

export default {
  BUILT_IN_PRESETS,
  getBuiltInPresetDateRange,
  getCustomDatePresets,
  createCustomDatePreset,
  updateCustomDatePreset,
  deleteCustomDatePreset,
  getCustomPresetDateRange,
  getAllPresetsWithDateRanges,
  parseNaturalDate,
};
