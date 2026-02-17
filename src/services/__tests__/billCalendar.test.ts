/**
 * Bill Calendar Service Tests
 */

import {
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill,
  generateBillPayments,
  getBillPayments,
  markBillAsPaid,
  getBillCalendarMonth,
  getUpcomingBills,
  getOverdueBills,
  getBillSummary,
  getTodayReminders,
} from '../billCalendar';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Helper to create chainable mock query
function createMockQuery(resolvedData: any, error: any = null) {
  const mockQuery: any = {
    select: jest.fn(() => mockQuery),
    insert: jest.fn(() => mockQuery),
    update: jest.fn(() => mockQuery),
    delete: jest.fn(() => mockQuery),
    eq: jest.fn(() => mockQuery),
    in: jest.fn(() => mockQuery),
    gt: jest.fn(() => mockQuery),
    lt: jest.fn(() => mockQuery),
    gte: jest.fn(() => mockQuery),
    lte: jest.fn(() => mockQuery),
    order: jest.fn(() => mockQuery),
    limit: jest.fn(() => mockQuery),
    single: jest.fn(() => Promise.resolve({ data: resolvedData, error })),
  };
  mockQuery.then = (resolve: any) => {
    resolve({ data: resolvedData, error });
    return mockQuery;
  };
  return mockQuery;
}

describe('Bill Calendar Service', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getBills', () => {
    it('should fetch all active bills with categories', async () => {
      const mockBills = [
        {
          id: 'bill-1',
          user_id: 'user-123',
          name: 'Rent',
          amount: 1500,
          frequency: 'monthly',
          due_day: 1,
          is_essential: true,
          is_active: true,
          category: { id: 'cat-1', name: 'Housing' },
        },
        {
          id: 'bill-2',
          user_id: 'user-123',
          name: 'Netflix',
          amount: 15.99,
          frequency: 'monthly',
          due_day: 15,
          is_essential: false,
          is_active: true,
          category: { id: 'cat-2', name: 'Entertainment' },
        },
      ];

      const mockQuery = createMockQuery(mockBills);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getBills(true);

      expect(mockSupabase.from).toHaveBeenCalledWith('bills');
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Rent');
    });

    it('should throw error when not authenticated', async () => {
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(getBills()).rejects.toThrow('Not authenticated');
    });
  });

  describe('createBill', () => {
    it('should create a new bill and generate payments', async () => {
      const newBill = {
        name: 'Electric Bill',
        amount: 150,
        frequency: 'monthly' as const,
        due_day: 20,
        is_essential: true,
        start_date: '2024-01-01',
        category_id: 'cat-1',
        household_id: null,
        currency: 'USD',
        payee_name: null,
        auto_pay: false,
        reminder_days: 3,
        notes: null,
        is_active: true,
        end_date: null,
      };

      const createdBill = {
        id: 'bill-new',
        user_id: 'user-123',
        ...newBill,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const billWithCategory = {
        ...createdBill,
        category: { id: 'cat-1', name: 'Utilities' },
      };

      // Mock for createBill
      const insertQuery = createMockQuery(createdBill);
      // Mock for getBill in generateBillPayments
      const getBillQuery = createMockQuery(billWithCategory);
      // Mock for checking existing payments
      const existingQuery = createMockQuery(null, { code: 'PGRST116' });
      // Mock for inserting payments
      const paymentsQuery = createMockQuery([]);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(insertQuery)
        .mockReturnValueOnce(getBillQuery)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(paymentsQuery);

      const result = await createBill(newBill);

      expect(result.id).toBe('bill-new');
      expect(result.name).toBe('Electric Bill');
    });
  });

  describe('updateBill', () => {
    it('should update an existing bill', async () => {
      const updatedBill = {
        id: 'bill-1',
        user_id: 'user-123',
        name: 'Updated Rent',
        amount: 1600,
        is_active: true,
      };

      const mockQuery = createMockQuery(updatedBill);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await updateBill('bill-1', { amount: 1600 });

      expect(result.amount).toBe(1600);
    });
  });

  describe('deleteBill', () => {
    it('should soft delete a bill', async () => {
      const mockQuery = createMockQuery(null);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      await deleteBill('bill-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('bills');
    });
  });

  describe('generateBillPayments', () => {
    it('should generate payment occurrences for future months', async () => {
      const mockBill = {
        id: 'bill-1',
        name: 'Rent',
        amount: 1500,
        due_day: 1,
        start_date: '2024-01-01',
        end_date: null,
        category: null,
      };

      const getBillQuery = createMockQuery(mockBill);
      const existingQuery = createMockQuery(null, { code: 'PGRST116' });
      const insertQuery = createMockQuery([
        { id: 'payment-1', due_date: '2024-02-01', amount_due: 1500 },
        { id: 'payment-2', due_date: '2024-03-01', amount_due: 1500 },
        { id: 'payment-3', due_date: '2024-04-01', amount_due: 1500 },
      ]);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(getBillQuery)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(insertQuery);

      const result = await generateBillPayments('bill-1', 3);

      expect(result.length).toBe(3);
    });
  });

  describe('getBillPayments', () => {
    it('should fetch payments for a date range', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          bill_id: 'bill-1',
          due_date: '2024-01-15',
          amount_due: 100,
          amount_paid: 0,
          status: 'pending',
        },
        {
          id: 'payment-2',
          bill_id: 'bill-2',
          due_date: '2024-01-20',
          amount_due: 50,
          amount_paid: 50,
          status: 'paid',
        },
      ];

      const mockQuery = createMockQuery(mockPayments);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getBillPayments('2024-01-01', '2024-01-31');

      expect(result.length).toBe(2);
    });
  });

  describe('markBillAsPaid', () => {
    it('should mark a payment as paid with default values', async () => {
      const currentPayment = { amount_due: 100 };
      const paidPayment = {
        id: 'payment-1',
        status: 'paid',
        amount_due: 100,
        amount_paid: 100,
        paid_date: new Date().toISOString().split('T')[0],
      };

      const getCurrentQuery = createMockQuery(currentPayment);
      const updateQuery = createMockQuery(paidPayment);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(getCurrentQuery)
        .mockReturnValueOnce(updateQuery);

      const result = await markBillAsPaid('payment-1');

      expect(result.status).toBe('paid');
      expect(result.amount_paid).toBe(100);
    });

    it('should mark with custom paid amount', async () => {
      const currentPayment = { amount_due: 100 };
      const paidPayment = {
        id: 'payment-1',
        status: 'paid',
        amount_due: 100,
        amount_paid: 80, // Partial payment
        paid_date: '2024-01-15',
      };

      const getCurrentQuery = createMockQuery(currentPayment);
      const updateQuery = createMockQuery(paidPayment);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(getCurrentQuery)
        .mockReturnValueOnce(updateQuery);

      const result = await markBillAsPaid('payment-1', {
        amountPaid: 80,
        paidDate: '2024-01-15',
      });

      expect(result.amount_paid).toBe(80);
    });
  });

  describe('getBillCalendarMonth', () => {
    it('should get bill calendar for a specific month', async () => {
      const mockPayments = [
        {
          bill_id: 'bill-1',
          due_date: '2024-01-15',
          amount_due: 1500,
          status: 'pending',
          bill: {
            name: 'Rent',
            is_essential: true,
            category: { id: 'cat-1', name: 'Housing' },
          },
        },
        {
          bill_id: 'bill-2',
          due_date: '2024-01-20',
          amount_due: 100,
          status: 'paid',
          bill: {
            name: 'Internet',
            is_essential: true,
            category: { id: 'cat-2', name: 'Utilities' },
          },
        },
      ];

      const mockQuery = createMockQuery(mockPayments);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getBillCalendarMonth(2024, 1);

      expect(result.month).toBe('2024-01');
      expect(result.total_due).toBe(1600);
      expect(result.total_paid).toBe(100); // Only the paid bill
      expect(result.bills.length).toBe(2);
    });
  });

  describe('getUpcomingBills', () => {
    it('should get upcoming bills for next N days', async () => {
      const mockPayments = [
        {
          bill_id: 'bill-1',
          due_date: '2024-01-10',
          amount_due: 100,
          status: 'pending',
          bill: {
            name: 'Phone',
            is_essential: false,
            category: null,
          },
        },
        {
          bill_id: 'bill-2',
          due_date: '2024-01-15',
          amount_due: 200,
          status: 'scheduled',
          bill: {
            name: 'Insurance',
            is_essential: true,
            category: { id: 'cat-1', name: 'Insurance' },
          },
        },
      ];

      const mockQuery = createMockQuery(mockPayments);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getUpcomingBills(30);

      expect(result.length).toBe(2);
      expect(result[0].status).toBe('pending');
    });
  });

  describe('getOverdueBills', () => {
    it('should get and update overdue bills', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          bill_id: 'bill-1',
          due_date: '2024-01-01',
          amount_due: 100,
          status: 'pending',
          bill: {
            name: 'Overdue Bill',
            is_essential: true,
            category: null,
          },
        },
      ];

      const getQuery = createMockQuery(mockPayments);
      const updateQuery = createMockQuery(null);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(getQuery)
        .mockReturnValueOnce(updateQuery);

      const result = await getOverdueBills();

      expect(result.length).toBe(1);
      expect(result[0].status).toBe('overdue');
    });
  });

  describe('getBillSummary', () => {
    it('should calculate correct bill summary', async () => {
      const mockUpcoming = [
        { amount_due: 100, due_date: '2024-01-10', bill: { name: 'Phone' } },
        { amount_due: 200, due_date: '2024-01-15', bill: { name: 'Internet' } },
      ];

      const mockOverdue = [{ amount_due: 50 }];
      const mockPaid = [{ amount_paid: 1500 }];
      const mockEssential = [{ amount: 1500 }, { amount: 100 }];

      const upcomingQuery = createMockQuery(mockUpcoming);
      const overdueQuery = createMockQuery(mockOverdue);
      const paidQuery = createMockQuery(mockPaid);
      const essentialQuery = createMockQuery(mockEssential);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(upcomingQuery)
        .mockReturnValueOnce(overdueQuery)
        .mockReturnValueOnce(paidQuery)
        .mockReturnValueOnce(essentialQuery);

      const result = await getBillSummary();

      expect(result.upcoming_count).toBe(2);
      expect(result.upcoming_total).toBe(300);
      expect(result.overdue_count).toBe(1);
      expect(result.overdue_total).toBe(50);
      expect(result.paid_this_month).toBe(1500);
      expect(result.essential_total).toBe(1600);
      expect(result.next_due_date).toBe('2024-01-10');
      expect(result.next_due_bill).toBe('Phone');
    });

    it('should handle no upcoming bills', async () => {
      const upcomingQuery = createMockQuery([]);
      const overdueQuery = createMockQuery([]);
      const paidQuery = createMockQuery([]);
      const essentialQuery = createMockQuery([]);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(upcomingQuery)
        .mockReturnValueOnce(overdueQuery)
        .mockReturnValueOnce(paidQuery)
        .mockReturnValueOnce(essentialQuery);

      const result = await getBillSummary();

      expect(result.upcoming_count).toBe(0);
      expect(result.next_due_date).toBeNull();
      expect(result.next_due_bill).toBeNull();
    });
  });

  describe('getTodayReminders', () => {
    it('should fetch reminders for today', async () => {
      const mockReminders = [
        {
          id: 'reminder-1',
          bill_id: 'bill-1',
          reminder_date: new Date().toISOString().split('T')[0],
          is_sent: false,
          bill: { name: 'Rent', amount: 1500 },
        },
      ];

      const mockQuery = createMockQuery(mockReminders);
      (mockSupabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await getTodayReminders();

      expect(result.length).toBe(1);
      expect((result[0] as any).bill.name).toBe('Rent');
    });
  });

  describe('frequency handling', () => {
    it('should correctly calculate due dates for monthly bills', async () => {
      const mockBill = {
        id: 'bill-1',
        name: 'Monthly Subscription',
        amount: 50,
        frequency: 'monthly',
        due_day: 15,
        start_date: '2024-01-01',
        end_date: null,
        category: null,
      };

      const getBillQuery = createMockQuery(mockBill);
      const existingQuery = createMockQuery(null, { code: 'PGRST116' });
      const insertQuery = createMockQuery([
        { due_date: '2024-01-15', amount_due: 50 },
        { due_date: '2024-02-15', amount_due: 50 },
      ]);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(getBillQuery)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(existingQuery)
        .mockReturnValueOnce(insertQuery);

      const result = await generateBillPayments('bill-1', 2);

      expect(result.length).toBe(2);
    });
  });

  describe('essential vs non-essential bills', () => {
    it('should correctly track essential bill totals', async () => {
      const mockEssential = [
        { amount: 1500 }, // Rent
        { amount: 100 },  // Insurance
        { amount: 200 },  // Utilities
      ];

      const upcomingQuery = createMockQuery([]);
      const overdueQuery = createMockQuery([]);
      const paidQuery = createMockQuery([]);
      const essentialQuery = createMockQuery(mockEssential);

      (mockSupabase.from as jest.Mock)
        .mockReturnValueOnce(upcomingQuery)
        .mockReturnValueOnce(overdueQuery)
        .mockReturnValueOnce(paidQuery)
        .mockReturnValueOnce(essentialQuery);

      const result = await getBillSummary();

      expect(result.essential_total).toBe(1800);
    });
  });
});
