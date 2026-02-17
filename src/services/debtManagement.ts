/**
 * Debt Management Service
 * Handles debt tracking, payments, and payoff strategies
 */

import { supabase } from './supabase';
import type {
  Debt,
  DebtPayment,
  DebtWithPayments,
  PayoffPlan,
  DebtSummary,
  DebtInsert,
  DebtUpdate,
  DebtPaymentInsert,
  PayoffStrategy,
} from '@/types';

// ============================================
// DEBT CRUD OPERATIONS
// ============================================

/**
 * Get all debts for the current user
 */
export async function getDebts(activeOnly: boolean = true): Promise<Debt[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('debts')
    .select('*')
    .eq('user_id', user.id)
    .order('interest_rate', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get a single debt by ID
 */
export async function getDebt(debtId: string): Promise<Debt | null> {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('id', debtId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get a debt with its payment history
 */
export async function getDebtWithPayments(debtId: string): Promise<DebtWithPayments | null> {
  const { data: debt, error: debtError } = await supabase
    .from('debts')
    .select('*')
    .eq('id', debtId)
    .single();

  if (debtError && debtError.code !== 'PGRST116') throw debtError;
  if (!debt) return null;

  const { data: payments, error: paymentsError } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('debt_id', debtId)
    .order('payment_date', { ascending: false });

  if (paymentsError) throw paymentsError;

  const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalInterestPaid = (payments || []).reduce((sum, p) => sum + Number(p.interest_amount), 0);

  // Calculate months remaining based on current balance and minimum payment
  let monthsRemaining: number | null = null;
  if (debt.minimum_payment > 0 && debt.current_balance > 0) {
    monthsRemaining = calculateMonthsToPayoff(
      debt.current_balance,
      debt.interest_rate,
      debt.minimum_payment
    );
  }

  return {
    ...debt,
    payments: payments || [],
    total_paid: totalPaid,
    total_interest_paid: totalInterestPaid,
    months_remaining: monthsRemaining,
  };
}

/**
 * Create a new debt
 */
export async function createDebt(debt: Omit<DebtInsert, 'user_id'>): Promise<Debt> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const newDebt: DebtInsert = {
    ...debt,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('debts')
    .insert(newDebt)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a debt
 */
export async function updateDebt(debtId: string, updates: DebtUpdate): Promise<Debt> {
  const { data, error } = await supabase
    .from('debts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', debtId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a debt
 */
export async function deleteDebt(debtId: string): Promise<void> {
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', debtId);

  if (error) throw error;
}

// ============================================
// PAYMENT OPERATIONS
// ============================================

/**
 * Record a debt payment
 */
export async function recordPayment(payment: Omit<DebtPaymentInsert, 'user_id'>): Promise<DebtPayment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get the debt to calculate principal/interest split
  const debt = await getDebt(payment.debt_id);
  if (!debt) throw new Error('Debt not found');

  // Calculate interest portion (monthly interest on current balance)
  const monthlyInterestRate = debt.interest_rate / 12;
  const interestAmount = Math.min(
    payment.amount,
    debt.current_balance * monthlyInterestRate
  );
  const principalAmount = payment.amount - interestAmount;
  const balanceAfter = Math.max(0, debt.current_balance - principalAmount);

  const newPayment: DebtPaymentInsert = {
    debt_id: payment.debt_id,
    user_id: user.id,
    amount: payment.amount,
    payment_date: payment.payment_date,
    principal_amount: principalAmount,
    interest_amount: interestAmount,
    balance_after: balanceAfter,
    notes: payment.notes || null,
    transaction_id: payment.transaction_id || null,
  };

  const { data, error } = await supabase
    .from('debt_payments')
    .insert(newPayment)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get payment history for a debt
 */
export async function getPaymentHistory(debtId: string): Promise<DebtPayment[]> {
  const { data, error } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('debt_id', debtId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================
// DEBT SUMMARY & ANALYTICS
// ============================================

/**
 * Get debt summary for the user
 */
export async function getDebtSummary(): Promise<DebtSummary> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const debts = await getDebts(true);

  if (debts.length === 0) {
    return {
      total_debt: 0,
      total_minimum_payments: 0,
      highest_interest_rate: 0,
      lowest_balance: 0,
      debts_count: 0,
      monthly_interest_cost: 0,
      projected_payoff_date: null,
    };
  }

  const totalDebt = debts.reduce((sum, d) => sum + Number(d.current_balance), 0);
  const totalMinimumPayments = debts.reduce((sum, d) => sum + Number(d.minimum_payment), 0);
  const highestInterestRate = Math.max(...debts.map(d => Number(d.interest_rate)));
  const lowestBalance = Math.min(...debts.map(d => Number(d.current_balance)));
  const monthlyInterestCost = debts.reduce((sum, d) => {
    return sum + (Number(d.current_balance) * (Number(d.interest_rate) / 12));
  }, 0);

  // Calculate projected payoff date (assuming minimum payments only)
  let maxMonths = 0;
  debts.forEach(debt => {
    const months = calculateMonthsToPayoff(
      debt.current_balance,
      debt.interest_rate,
      debt.minimum_payment
    );
    if (months > maxMonths) maxMonths = months;
  });

  const projectedPayoffDate = maxMonths > 0 && maxMonths < 600
    ? new Date(Date.now() + maxMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null;

  return {
    total_debt: Math.round(totalDebt * 100) / 100,
    total_minimum_payments: Math.round(totalMinimumPayments * 100) / 100,
    highest_interest_rate: highestInterestRate,
    lowest_balance: Math.round(lowestBalance * 100) / 100,
    debts_count: debts.length,
    monthly_interest_cost: Math.round(monthlyInterestCost * 100) / 100,
    projected_payoff_date: projectedPayoffDate,
  };
}

// ============================================
// PAYOFF STRATEGIES
// ============================================

/**
 * Calculate payoff plan using specified strategy
 */
export async function calculatePayoffPlan(
  strategy: PayoffStrategy = 'avalanche',
  extraPayment: number = 0
): Promise<PayoffPlan[]> {
  const debts = await getDebts(true);
  if (debts.length === 0) return [];

  // Sort debts based on strategy
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'snowball') {
      // Smallest balance first
      return Number(a.current_balance) - Number(b.current_balance);
    } else if (strategy === 'avalanche') {
      // Highest interest rate first
      return Number(b.interest_rate) - Number(a.interest_rate);
    }
    return 0;
  });

  const totalMinimum = debts.reduce((sum, d) => sum + Number(d.minimum_payment), 0);
  const totalPayment = totalMinimum + extraPayment;

  const plans: PayoffPlan[] = [];
  let remainingExtra = extraPayment;

  sortedDebts.forEach((debt, index) => {
    // Calculate recommended payment (minimum + extra for focused debt)
    const recommendedPayment = index === 0
      ? Number(debt.minimum_payment) + remainingExtra
      : Number(debt.minimum_payment);

    const monthsToPayoff = calculateMonthsToPayoff(
      debt.current_balance,
      debt.interest_rate,
      recommendedPayment
    );

    const totalInterest = calculateTotalInterest(
      debt.current_balance,
      debt.interest_rate,
      recommendedPayment,
      monthsToPayoff
    );

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + monthsToPayoff);

    plans.push({
      debt_id: debt.id,
      debt_name: debt.name,
      current_balance: Number(debt.current_balance),
      interest_rate: Number(debt.interest_rate),
      minimum_payment: Number(debt.minimum_payment),
      recommended_payment: recommendedPayment,
      payoff_order: index + 1,
      months_to_payoff: monthsToPayoff,
      total_interest: Math.round(totalInterest * 100) / 100,
      payoff_date: payoffDate.toISOString().split('T')[0],
    });
  });

  return plans;
}

/**
 * Compare payoff strategies
 */
export async function compareStrategies(extraPayment: number = 0): Promise<{
  snowball: { totalInterest: number; monthsToDebtFree: number };
  avalanche: { totalInterest: number; monthsToDebtFree: number };
  savings: number;
}> {
  const snowballPlan = await calculatePayoffPlan('snowball', extraPayment);
  const avalanchePlan = await calculatePayoffPlan('avalanche', extraPayment);

  const snowballTotalInterest = snowballPlan.reduce((sum, p) => sum + p.total_interest, 0);
  const avalancheTotalInterest = avalanchePlan.reduce((sum, p) => sum + p.total_interest, 0);

  const snowballMonths = Math.max(...snowballPlan.map(p => p.months_to_payoff), 0);
  const avalancheMonths = Math.max(...avalanchePlan.map(p => p.months_to_payoff), 0);

  return {
    snowball: {
      totalInterest: Math.round(snowballTotalInterest * 100) / 100,
      monthsToDebtFree: snowballMonths,
    },
    avalanche: {
      totalInterest: Math.round(avalancheTotalInterest * 100) / 100,
      monthsToDebtFree: avalancheMonths,
    },
    savings: Math.round((snowballTotalInterest - avalancheTotalInterest) * 100) / 100,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate months to pay off a debt
 */
function calculateMonthsToPayoff(
  balance: number,
  annualRate: number,
  monthlyPayment: number
): number {
  if (monthlyPayment <= 0 || balance <= 0) return 0;

  const monthlyRate = annualRate / 12;

  // If no interest, simple division
  if (monthlyRate === 0) {
    return Math.ceil(balance / monthlyPayment);
  }

  // If payment doesn't cover interest, debt will never be paid off
  const monthlyInterest = balance * monthlyRate;
  if (monthlyPayment <= monthlyInterest) {
    return 999; // Indicate very long time
  }

  // Calculate using amortization formula
  // n = -log(1 - (r * P) / M) / log(1 + r)
  const months = -Math.log(1 - (monthlyRate * balance) / monthlyPayment) / Math.log(1 + monthlyRate);

  return Math.ceil(months);
}

/**
 * Calculate total interest paid over the life of the debt
 */
function calculateTotalInterest(
  balance: number,
  annualRate: number,
  monthlyPayment: number,
  months: number
): number {
  const totalPaid = monthlyPayment * months;
  return Math.max(0, totalPaid - balance);
}

/**
 * Get upcoming debt payments (debts due in the next X days)
 */
export async function getUpcomingPayments(days: number = 7): Promise<Debt[]> {
  const debts = await getDebts(true);
  const today = new Date();
  const currentDay = today.getDate();

  return debts.filter(debt => {
    if (!debt.due_date) return false;

    // Calculate days until due date
    let dueDay = debt.due_date;
    let daysUntilDue: number;

    if (dueDay >= currentDay) {
      daysUntilDue = dueDay - currentDay;
    } else {
      // Due date is next month
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      daysUntilDue = daysInMonth - currentDay + dueDay;
    }

    return daysUntilDue <= days;
  });
}

export default {
  getDebts,
  getDebt,
  getDebtWithPayments,
  createDebt,
  updateDebt,
  deleteDebt,
  recordPayment,
  getPaymentHistory,
  getDebtSummary,
  calculatePayoffPlan,
  compareStrategies,
  getUpcomingPayments,
};
