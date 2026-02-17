/**
 * Net Worth Service
 * Manages assets, liabilities, and net worth calculations
 */

import { supabase } from './supabase';
import type {
  Asset,
  AssetInsert,
  AssetUpdate,
  AssetType,
  Liability,
  LiabilityInsert,
  LiabilityUpdate,
  LiabilityType,
  NetWorthSnapshot,
  NetWorthSummary,
  AssetHistory,
  LiabilityHistory,
} from '@/types';

// ============================================
// ASSET MANAGEMENT
// ============================================

/**
 * Get all assets for the current user
 */
export async function getAssets(activeOnly: boolean = true): Promise<Asset[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('assets')
    .select('*')
    .eq('user_id', user.id)
    .order('current_value', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch assets: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single asset by ID
 */
export async function getAsset(assetId: string): Promise<Asset> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch asset: ${error.message}`);
  }

  return data;
}

/**
 * Create a new asset
 */
export async function createAsset(asset: Omit<AssetInsert, 'user_id'>): Promise<Asset> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      ...asset,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create asset: ${error.message}`);
  }

  // Record initial value in history
  await supabase.from('asset_history').insert({
    asset_id: data.id,
    user_id: user.id,
    recorded_value: data.current_value,
    change_reason: 'Initial value',
  });

  return data;
}

/**
 * Update an existing asset
 */
export async function updateAsset(assetId: string, updates: AssetUpdate): Promise<Asset> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', assetId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update asset: ${error.message}`);
  }

  return data;
}

/**
 * Delete an asset (soft delete)
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('assets')
    .update({ is_active: false })
    .eq('id', assetId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete asset: ${error.message}`);
  }
}

/**
 * Get asset value history
 */
export async function getAssetHistory(
  assetId: string,
  startDate?: string,
  endDate?: string
): Promise<AssetHistory[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('asset_history')
    .select('*')
    .eq('asset_id', assetId)
    .eq('user_id', user.id)
    .order('recorded_date', { ascending: false });

  if (startDate) {
    query = query.gte('recorded_date', startDate);
  }
  if (endDate) {
    query = query.lte('recorded_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch asset history: ${error.message}`);
  }

  return data || [];
}

// ============================================
// LIABILITY MANAGEMENT
// ============================================

/**
 * Get all liabilities for the current user
 */
export async function getLiabilities(activeOnly: boolean = true): Promise<Liability[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('liabilities')
    .select('*')
    .eq('user_id', user.id)
    .order('current_balance', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch liabilities: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single liability by ID
 */
export async function getLiability(liabilityId: string): Promise<Liability> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('liabilities')
    .select('*')
    .eq('id', liabilityId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch liability: ${error.message}`);
  }

  return data;
}

/**
 * Create a new liability
 */
export async function createLiability(liability: Omit<LiabilityInsert, 'user_id'>): Promise<Liability> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('liabilities')
    .insert({
      ...liability,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create liability: ${error.message}`);
  }

  // Record initial balance in history
  await supabase.from('liability_history').insert({
    liability_id: data.id,
    user_id: user.id,
    recorded_balance: data.current_balance,
    change_reason: 'Initial balance',
  });

  return data;
}

/**
 * Update an existing liability
 */
export async function updateLiability(liabilityId: string, updates: LiabilityUpdate): Promise<Liability> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('liabilities')
    .update(updates)
    .eq('id', liabilityId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update liability: ${error.message}`);
  }

  return data;
}

/**
 * Delete a liability (soft delete)
 */
export async function deleteLiability(liabilityId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('liabilities')
    .update({ is_active: false })
    .eq('id', liabilityId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete liability: ${error.message}`);
  }
}

/**
 * Get liability balance history
 */
export async function getLiabilityHistory(
  liabilityId: string,
  startDate?: string,
  endDate?: string
): Promise<LiabilityHistory[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('liability_history')
    .select('*')
    .eq('liability_id', liabilityId)
    .eq('user_id', user.id)
    .order('recorded_date', { ascending: false });

  if (startDate) {
    query = query.gte('recorded_date', startDate);
  }
  if (endDate) {
    query = query.lte('recorded_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch liability history: ${error.message}`);
  }

  return data || [];
}

// ============================================
// NET WORTH CALCULATIONS
// ============================================

/**
 * Calculate current net worth
 */
export async function calculateNetWorth(): Promise<NetWorthSummary> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get assets
  const assets = await getAssets(true);
  const liabilities = await getLiabilities(true);

  // Calculate totals
  const totalAssets = assets
    .filter(a => a.include_in_net_worth)
    .reduce((sum, a) => sum + a.current_value, 0);

  const liquidAssets = assets
    .filter(a => a.include_in_net_worth && a.is_liquid)
    .reduce((sum, a) => sum + a.current_value, 0);

  const totalLiabilities = liabilities
    .filter(l => l.include_in_net_worth)
    .reduce((sum, l) => sum + l.current_balance, 0);

  // Also include debts not linked to liabilities
  const { data: debts } = await supabase
    .from('debts')
    .select('id, current_balance')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const linkedDebtIds = liabilities
    .filter(l => l.linked_debt_id)
    .map(l => l.linked_debt_id);

  const unlinkedDebtTotal = (debts || [])
    .filter(d => !linkedDebtIds.includes(d.id))
    .reduce((sum, d) => sum + d.current_balance, 0);

  const netWorth = totalAssets - totalLiabilities - unlinkedDebtTotal;

  // Calculate breakdowns
  const assetBreakdown = assets
    .filter(a => a.include_in_net_worth)
    .reduce((acc, a) => {
      acc[a.asset_type] = (acc[a.asset_type] || 0) + a.current_value;
      return acc;
    }, {} as Record<AssetType, number>);

  const liabilityBreakdown = liabilities
    .filter(l => l.include_in_net_worth)
    .reduce((acc, l) => {
      acc[l.liability_type] = (acc[l.liability_type] || 0) + l.current_balance;
      return acc;
    }, {} as Record<LiabilityType, number>);

  // Get historical data for change calculations
  const today = new Date().toISOString().split('T')[0];
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: monthSnapshot } = await supabase
    .from('net_worth_history')
    .select('net_worth')
    .eq('user_id', user.id)
    .lte('snapshot_date', oneMonthAgo)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  const { data: yearSnapshot } = await supabase
    .from('net_worth_history')
    .select('net_worth')
    .eq('user_id', user.id)
    .lte('snapshot_date', oneYearAgo)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  const monthChange = monthSnapshot ? netWorth - monthSnapshot.net_worth : 0;
  const monthChangePercentage = monthSnapshot && monthSnapshot.net_worth !== 0
    ? (monthChange / Math.abs(monthSnapshot.net_worth)) * 100
    : 0;

  const yearChange = yearSnapshot ? netWorth - yearSnapshot.net_worth : 0;
  const yearChangePercentage = yearSnapshot && yearSnapshot.net_worth !== 0
    ? (yearChange / Math.abs(yearSnapshot.net_worth)) * 100
    : 0;

  return {
    total_assets: totalAssets,
    total_liabilities: totalLiabilities + unlinkedDebtTotal,
    net_worth: netWorth,
    liquid_assets: liquidAssets,
    asset_breakdown: assetBreakdown,
    liability_breakdown: liabilityBreakdown,
    month_change: monthChange,
    month_change_percentage: monthChangePercentage,
    year_change: yearChange,
    year_change_percentage: yearChangePercentage,
  };
}

/**
 * Create a net worth snapshot (for historical tracking)
 */
export async function createNetWorthSnapshot(notes?: string): Promise<NetWorthSnapshot> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const summary = await calculateNetWorth();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('net_worth_history')
    .upsert({
      user_id: user.id,
      snapshot_date: today,
      total_assets: summary.total_assets,
      total_liabilities: summary.total_liabilities,
      net_worth: summary.net_worth,
      liquid_assets: summary.liquid_assets,
      asset_breakdown: summary.asset_breakdown,
      liability_breakdown: summary.liability_breakdown,
      notes,
    }, {
      onConflict: 'user_id,snapshot_date',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create snapshot: ${error.message}`);
  }

  return data;
}

/**
 * Get net worth history
 */
export async function getNetWorthHistory(
  startDate?: string,
  endDate?: string,
  limit?: number
): Promise<NetWorthSnapshot[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('net_worth_history')
    .select('*')
    .eq('user_id', user.id)
    .order('snapshot_date', { ascending: false });

  if (startDate) {
    query = query.gte('snapshot_date', startDate);
  }
  if (endDate) {
    query = query.lte('snapshot_date', endDate);
  }
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch net worth history: ${error.message}`);
  }

  return data || [];
}

/**
 * Get assets grouped by type
 */
export async function getAssetsByType(): Promise<Record<AssetType, Asset[]>> {
  const assets = await getAssets(true);

  return assets.reduce((acc, asset) => {
    if (!acc[asset.asset_type]) {
      acc[asset.asset_type] = [];
    }
    acc[asset.asset_type].push(asset);
    return acc;
  }, {} as Record<AssetType, Asset[]>);
}

/**
 * Get liabilities grouped by type
 */
export async function getLiabilitiesByType(): Promise<Record<LiabilityType, Liability[]>> {
  const liabilities = await getLiabilities(true);

  return liabilities.reduce((acc, liability) => {
    if (!acc[liability.liability_type]) {
      acc[liability.liability_type] = [];
    }
    acc[liability.liability_type].push(liability);
    return acc;
  }, {} as Record<LiabilityType, Liability[]>);
}

/**
 * Link a liability to an existing debt
 */
export async function linkLiabilityToDebt(liabilityId: string, debtId: string): Promise<Liability> {
  return updateLiability(liabilityId, { linked_debt_id: debtId });
}

/**
 * Get net worth trend data for charting
 */
export async function getNetWorthTrend(
  months: number = 12
): Promise<Array<{ date: string; net_worth: number; total_assets: number; total_liabilities: number }>> {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const history = await getNetWorthHistory(
    startDate.toISOString().split('T')[0],
    undefined,
    months
  );

  return history.map(snapshot => ({
    date: snapshot.snapshot_date,
    net_worth: snapshot.net_worth,
    total_assets: snapshot.total_assets,
    total_liabilities: snapshot.total_liabilities,
  })).reverse();
}
