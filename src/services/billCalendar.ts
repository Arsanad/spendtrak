/**
 * Bill Calendar Service
 * Manages recurring bills, payments, and reminders
 */

import { supabase } from './supabase';
import type {
  Bill,
  BillInsert,
  BillUpdate,
  BillWithCategory,
  BillPayment,
  BillPaymentInsert,
  BillPaymentUpdate,
  BillReminder,
  BillOccurrence,
  BillCalendarMonth,
  BillSummary,
  BillStatus,
  IncomeFrequency,
  Category,
} from '@/types';

// Internal type for bill payment with nested relations from Supabase query
interface BillPaymentWithRelations extends BillPayment {
  bill?: Bill & {
    name?: string;
    is_essential?: boolean;
    category?: Category | null;
  };
}

// ============================================
// BILL MANAGEMENT
// ============================================

/**
 * Get all bills for the current user
 */
export async function getBills(activeOnly: boolean = true): Promise<BillWithCategory[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  let query = supabase
    .from('bills')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id)
    .order('due_day', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch bills: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single bill by ID
 */
export async function getBill(billId: string): Promise<BillWithCategory> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('bills')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', billId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }

  return data;
}

/**
 * Create a new bill
 */
export async function createBill(bill: Omit<BillInsert, 'user_id'>): Promise<Bill> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('bills')
    .insert({
      ...bill,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create bill: ${error.message}`);
  }

  // Generate initial bill payments for the next few months
  await generateBillPayments(data.id, 3);

  return data;
}

/**
 * Update an existing bill
 */
export async function updateBill(billId: string, updates: BillUpdate): Promise<Bill> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('bills')
    .update(updates)
    .eq('id', billId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update bill: ${error.message}`);
  }

  return data;
}

/**
 * Delete a bill (soft delete)
 */
export async function deleteBill(billId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { error } = await supabase
    .from('bills')
    .update({ is_active: false })
    .eq('id', billId)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete bill: ${error.message}`);
  }
}

// ============================================
// BILL PAYMENTS
// ============================================

/**
 * Generate bill payment occurrences for future months
 */
export async function generateBillPayments(
  billId: string,
  monthsAhead: number = 3
): Promise<BillPayment[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const bill = await getBill(billId);
  const payments: BillPaymentInsert[] = [];
  const today = new Date();

  for (let i = 0; i < monthsAhead; i++) {
    const dueDate = new Date(today.getFullYear(), today.getMonth() + i, bill.due_day || 1);

    // Skip if due date is before bill start date
    if (dueDate < new Date(bill.start_date)) continue;

    // Skip if due date is after bill end date
    if (bill.end_date && dueDate > new Date(bill.end_date)) continue;

    // Check if payment already exists for this due date
    const { data: existing } = await supabase
      .from('bill_payments')
      .select('id')
      .eq('bill_id', billId)
      .eq('due_date', dueDate.toISOString().split('T')[0])
      .single();

    if (!existing) {
      payments.push({
        bill_id: billId,
        user_id: user.id,
        due_date: dueDate.toISOString().split('T')[0],
        amount_due: bill.amount,
        amount_paid: 0,
        status: 'pending',
        paid_date: null,
        transaction_id: null,
        notes: null,
      });
    }
  }

  if (payments.length === 0) return [];

  const { data, error } = await supabase
    .from('bill_payments')
    .insert(payments)
    .select();

  if (error) {
    throw new Error(`Failed to generate bill payments: ${error.message}`);
  }

  return data || [];
}

/**
 * Get bill payments for a date range
 */
export async function getBillPayments(
  startDate: string,
  endDate: string
): Promise<BillPayment[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('bill_payments')
    .select('*')
    .eq('user_id', user.id)
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch bill payments: ${error.message}`);
  }

  return data || [];
}

/**
 * Mark a bill payment as paid
 */
export async function markBillAsPaid(
  paymentId: string,
  options: {
    amountPaid?: number;
    paidDate?: string;
    transactionId?: string;
    notes?: string;
  } = {}
): Promise<BillPayment> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get the current payment to know the amount due
  const { data: current } = await supabase
    .from('bill_payments')
    .select('amount_due')
    .eq('id', paymentId)
    .single();

  const { data, error } = await supabase
    .from('bill_payments')
    .update({
      status: 'paid',
      amount_paid: options.amountPaid ?? current?.amount_due ?? 0,
      paid_date: options.paidDate ?? new Date().toISOString().split('T')[0],
      transaction_id: options.transactionId ?? null,
      notes: options.notes ?? null,
    })
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark bill as paid: ${error.message}`);
  }

  return data;
}

/**
 * Update a bill payment
 */
export async function updateBillPayment(
  paymentId: string,
  updates: BillPaymentUpdate
): Promise<BillPayment> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('bill_payments')
    .update(updates)
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update bill payment: ${error.message}`);
  }

  return data;
}

// ============================================
// BILL CALENDAR VIEW
// ============================================

/**
 * Get bill calendar for a specific month
 */
export async function getBillCalendarMonth(
  year: number,
  month: number
): Promise<BillCalendarMonth> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Get bills with their payments for this month
  const { data: payments, error } = await supabase
    .from('bill_payments')
    .select(`
      *,
      bill:bills(*, category:categories(*))
    `)
    .eq('user_id', user.id)
    .gte('due_date', startDateStr)
    .lte('due_date', endDateStr)
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch bill calendar: ${error.message}`);
  }

  const bills: BillOccurrence[] = (payments || []).map((p: BillPaymentWithRelations) => ({
    bill_id: p.bill_id,
    bill_name: p.bill?.name || 'Unknown',
    amount: p.amount_due,
    due_date: p.due_date,
    status: p.status,
    is_essential: p.bill?.is_essential || false,
    category: p.bill?.category || null,
  }));

  const totalDue = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    total_due: totalDue,
    total_paid: totalPaid,
    bills,
  };
}

/**
 * Get upcoming bills for the next N days
 */
export async function getUpcomingBills(days: number = 30): Promise<BillOccurrence[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const today = new Date();
  const endDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  const startDateStr = today.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: payments, error } = await supabase
    .from('bill_payments')
    .select(`
      *,
      bill:bills(*, category:categories(*))
    `)
    .eq('user_id', user.id)
    .gte('due_date', startDateStr)
    .lte('due_date', endDateStr)
    .in('status', ['pending', 'scheduled'])
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch upcoming bills: ${error.message}`);
  }

  return (payments || []).map((p: BillPaymentWithRelations) => ({
    bill_id: p.bill_id,
    bill_name: p.bill?.name || 'Unknown',
    amount: p.amount_due,
    due_date: p.due_date,
    status: p.status,
    is_essential: p.bill?.is_essential || false,
    category: p.bill?.category || null,
  }));
}

/**
 * Get overdue bills
 */
export async function getOverdueBills(): Promise<BillOccurrence[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: payments, error } = await supabase
    .from('bill_payments')
    .select(`
      *,
      bill:bills(*, category:categories(*))
    `)
    .eq('user_id', user.id)
    .lt('due_date', today)
    .eq('status', 'pending')
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch overdue bills: ${error.message}`);
  }

  // Update status to overdue
  const overdueIds = (payments || []).map((p: BillPaymentWithRelations) => p.id);
  if (overdueIds.length > 0) {
    await supabase
      .from('bill_payments')
      .update({ status: 'overdue' })
      .in('id', overdueIds);
  }

  return (payments || []).map((p: BillPaymentWithRelations) => ({
    bill_id: p.bill_id,
    bill_name: p.bill?.name || 'Unknown',
    amount: p.amount_due,
    due_date: p.due_date,
    status: 'overdue' as BillStatus,
    is_essential: p.bill?.is_essential || false,
    category: p.bill?.category || null,
  }));
}

// ============================================
// BILL SUMMARY
// ============================================

/**
 * Get bill summary statistics
 */
export async function getBillSummary(): Promise<BillSummary> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const todayStr = today.toISOString().split('T')[0];
  const endOfMonthStr = endOfMonth.toISOString().split('T')[0];
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

  // Get upcoming bills (next 30 days)
  const { data: upcoming } = await supabase
    .from('bill_payments')
    .select('amount_due, due_date, bill:bills(name)')
    .eq('user_id', user.id)
    .gte('due_date', todayStr)
    .lte('due_date', thirtyDaysStr)
    .in('status', ['pending', 'scheduled'])
    .order('due_date', { ascending: true });

  // Get overdue bills
  const { data: overdue } = await supabase
    .from('bill_payments')
    .select('amount_due')
    .eq('user_id', user.id)
    .lt('due_date', todayStr)
    .in('status', ['pending', 'overdue']);

  // Get paid this month
  const { data: paidThisMonth } = await supabase
    .from('bill_payments')
    .select('amount_paid')
    .eq('user_id', user.id)
    .gte('paid_date', startOfMonthStr)
    .lte('paid_date', endOfMonthStr)
    .eq('status', 'paid');

  // Get essential bills total
  const { data: essential } = await supabase
    .from('bills')
    .select('amount')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('is_essential', true);

  const upcomingBills = upcoming || [];
  const overdueBills = overdue || [];
  const paidBills = paidThisMonth || [];
  const essentialBills = essential || [];

  return {
    upcoming_count: upcomingBills.length,
    upcoming_total: upcomingBills.reduce((sum, b) => sum + b.amount_due, 0),
    overdue_count: overdueBills.length,
    overdue_total: overdueBills.reduce((sum, b) => sum + b.amount_due, 0),
    paid_this_month: paidBills.reduce((sum, b) => sum + b.amount_paid, 0),
    essential_total: essentialBills.reduce((sum, b) => sum + b.amount, 0),
    next_due_date: upcomingBills.length > 0 ? upcomingBills[0].due_date : null,
    next_due_bill: upcomingBills.length > 0 ? (upcomingBills[0] as { bill?: { name?: string } }).bill?.name ?? null : null,
  };
}

// ============================================
// BILL REMINDERS
// ============================================

/**
 * Get pending reminders for today
 */
export async function getTodayReminders(): Promise<BillReminder[]> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('bill_reminders')
    .select(`
      *,
      bill:bills(name, amount)
    `)
    .eq('user_id', user.id)
    .eq('reminder_date', today)
    .eq('is_sent', false);

  if (error) {
    throw new Error(`Failed to fetch reminders: ${error.message}`);
  }

  return data || [];
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(reminderId: string): Promise<void> {
  const { error } = await supabase
    .from('bill_reminders')
    .update({
      is_sent: true,
      sent_at: new Date().toISOString(),
    })
    .eq('id', reminderId);

  if (error) {
    throw new Error(`Failed to mark reminder as sent: ${error.message}`);
  }
}

/**
 * Create reminders for upcoming bills
 */
export async function createUpcomingReminders(): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Get active bills with reminder settings
  const { data: bills } = await supabase
    .from('bills')
    .select('id, due_day, reminder_days')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .gt('reminder_days', 0);

  if (!bills || bills.length === 0) return;

  const today = new Date();
  const reminders: Array<{ bill_id: string; user_id: string; reminder_date: string }> = [];

  for (const bill of bills) {
    // Calculate next due date
    let nextDueDate = new Date(today.getFullYear(), today.getMonth(), bill.due_day || 1);
    if (nextDueDate < today) {
      nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, bill.due_day || 1);
    }

    // Calculate reminder date
    const reminderDate = new Date(nextDueDate);
    reminderDate.setDate(reminderDate.getDate() - (bill.reminder_days || 3));

    // Only create reminder if it's in the future
    if (reminderDate > today) {
      const reminderDateStr = reminderDate.toISOString().split('T')[0];

      // Check if reminder already exists
      const { data: existing } = await supabase
        .from('bill_reminders')
        .select('id')
        .eq('bill_id', bill.id)
        .eq('reminder_date', reminderDateStr)
        .single();

      if (!existing) {
        reminders.push({
          bill_id: bill.id,
          user_id: user.id,
          reminder_date: reminderDateStr,
        });
      }
    }
  }

  if (reminders.length > 0) {
    await supabase.from('bill_reminders').insert(reminders);
  }
}

/**
 * Get bills by day of month for calendar view
 */
export async function getBillsByDayOfMonth(): Promise<Map<number, BillWithCategory[]>> {
  const bills = await getBills(true);

  const billsByDay = new Map<number, BillWithCategory[]>();

  for (const bill of bills) {
    const day = bill.due_day || 1;
    if (!billsByDay.has(day)) {
      billsByDay.set(day, []);
    }
    billsByDay.get(day)!.push(bill);
  }

  return billsByDay;
}
