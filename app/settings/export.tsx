// SPENDTRAK CINEMATIC EDITION - Export Data Screen
// Themed export with PDF generation and native sharing
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, ActivityIndicator, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '../../src/design/cinematic';
import { useTranslation } from '../../src/context/LanguageContext';
import { useCurrency } from '../../src/context/CurrencyContext';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Button } from '../../src/components/ui/Button';
import { Header } from '../../src/components/navigation';
import { ConfirmationModal } from '../../src/components/ui/ConfirmationModal';

import { ExportIcon, CheckIcon } from '../../src/components/icons';
import { useTransition } from '../../src/context/TransitionContext';
import { logger } from '../../src/utils/logger';
// Import stores and services for real data
import { useTransactionStore } from '../../src/stores/transactionStore';
import { useAuthStore } from '../../src/stores/authStore';
import { getDevBudgets, getDevGoals, DevBudget, DevGoal } from '../../src/services/devStorage';

// Export format options
const exportFormats = [
  { id: 'pdf', nameKey: 'settings.pdfReport', descKey: 'settings.formattedReport', icon: 'document-text' },
  { id: 'csv', nameKey: 'settings.csvSpreadsheet', descKey: 'settings.forExcelOrSheets', icon: 'grid' },
  { id: 'json', nameKey: 'settings.jsonBackup', descKey: 'settings.completeDataBackup', icon: 'code-slash' },
];

// Date range options
const dateRanges = [
  { id: 'week', nameKey: 'settings.last7Days', days: 7 },
  { id: 'month', nameKey: 'settings.last30Days', days: 30 },
  { id: '3months', nameKey: 'settings.last3Months', days: 90 },
  { id: 'year', nameKey: 'settings.lastYear', days: 365 },
  { id: 'all', nameKey: 'settings.allTime', days: -1 },
];

// Export data interface
interface ExportData {
  user: {
    name: string;
    email: string;
    currency: string;
    exportDate: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
  };
  transactions: Array<{
    date: string;
    merchant: string;
    category: string;
    amount: number;
    notes?: string;
  }>;
  budgets: Array<{
    category: string;
    budget: number;
    spent: number;
    remaining: number;
  }>;
  goals: Array<{
    name: string;
    target: number;
    current: number;
    progress: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    percentage: number;
    count: number;
  }>;
}

// Generate HTML content for PDF with Cinzel font (brand identity)
const generatePDFContent = (data: ExportData, rangeName: string): string => {
  const { user, summary, transactions, budgets, goals, categoryBreakdown } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SpendTrak Financial Report</title>
  <!-- Cinzel Font - Brand Identity -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Cinzel', serif;
      background: linear-gradient(135deg, #000000 0%, #001a0f 50%, #002a17 100%);
      color: #00ff88;
      padding: 40px;
      min-height: 100vh;
    }
    .container { max-width: 800px; margin: 0 auto; }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #00ff8840;
    }
    .logo {
      font-family: 'Cinzel', serif;
      font-size: 42px;
      font-weight: 700;
      background: linear-gradient(135deg, #00ff88, #00cc6a, #008545);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
      letter-spacing: 4px;
    }
    .subtitle {
      font-family: 'Cinzel', serif;
      color: #00cc6a;
      font-size: 14px;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 500;
    }
    .export-info {
      margin-top: 15px;
      color: #008545;
      font-size: 12px;
      font-weight: 400;
    }
    .user-info {
      margin-top: 10px;
      color: #00cc6a;
      font-size: 13px;
    }

    /* Section */
    .section {
      background: linear-gradient(135deg, #051a0f 0%, #020806 100%);
      border: 1px solid #00ff8830;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title {
      font-family: 'Cinzel', serif;
      font-size: 18px;
      font-weight: 600;
      color: #00ff88;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #00ff8820;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    /* Summary Cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .summary-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .summary-card {
      background: #001a0f;
      border: 1px solid #00ff8820;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .summary-label {
      font-family: 'Cinzel', serif;
      color: #008545;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .summary-value {
      font-family: 'Cinzel', serif;
      font-size: 22px;
      font-weight: 700;
    }
    .income { color: #39FF14; }
    .expense { color: #ff3366; }
    .neutral { color: #E6A756; }
    .positive { color: #39FF14; }

    /* Table */
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th {
      font-family: 'Cinzel', serif;
      text-align: left;
      padding: 12px 8px;
      color: #008545;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #00ff8830;
      font-weight: 600;
    }
    .table td {
      font-family: 'Cinzel', serif;
      padding: 12px 8px;
      border-bottom: 1px solid #00ff8810;
      font-size: 12px;
      font-weight: 400;
    }
    .table tr:hover { background: #00ff8808; }
    .amount-positive { color: #39FF14; font-weight: 600; }
    .amount-negative { color: #ff3366; font-weight: 600; }

    /* Progress Bar */
    .progress-container {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .progress-info { flex: 1; }
    .progress-name {
      font-family: 'Cinzel', serif;
      color: #00cc6a;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 13px;
    }
    .progress-bar {
      height: 10px;
      background: #001a0f;
      border-radius: 5px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #00ff88, #00cc6a);
      border-radius: 5px;
    }
    .progress-text {
      font-family: 'Cinzel', serif;
      color: #E6A756;
      font-size: 11px;
      min-width: 80px;
      text-align: right;
      font-weight: 500;
    }

    /* Category breakdown */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .category-item {
      background: #001a0f;
      border: 1px solid #00ff8815;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-name {
      font-family: 'Cinzel', serif;
      color: #00cc6a;
      font-size: 12px;
      font-weight: 500;
    }
    .category-amount {
      font-family: 'Cinzel', serif;
      color: #ff3366;
      font-size: 13px;
      font-weight: 600;
    }
    .category-percent {
      font-family: 'Cinzel', serif;
      color: #E6A756;
      font-size: 10px;
      margin-left: 8px;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #00ff8820;
      color: #008545;
      font-size: 11px;
    }
    .footer p {
      font-family: 'Cinzel', serif;
      font-weight: 400;
    }
    .confidential {
      margin-top: 12px;
      font-size: 10px;
      color: #00ff8850;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">SPENDTRAK</div>
      <div class="subtitle">Financial Report</div>
      <div class="user-info">${user.name} • ${user.email}</div>
      <div class="export-info">
        ${rangeName} • Generated on ${user.exportDate}
      </div>
    </div>

    <!-- Financial Summary -->
    <div class="section">
      <div class="section-title">Financial Summary</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Income</div>
          <div class="summary-value income">${user.currency} ${summary.totalIncome.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Total Expenses</div>
          <div class="summary-value expense">${user.currency} ${summary.totalExpenses.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Net Savings</div>
          <div class="summary-value positive">${user.currency} ${summary.netSavings.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Savings Rate</div>
          <div class="summary-value neutral">${summary.savingsRate.toFixed(1)}%</div>
        </div>
      </div>
      <div style="margin-top: 16px; text-align: center; color: #008545; font-size: 12px;">
        Total Transactions: ${summary.transactionCount}
      </div>
    </div>

    <!-- Category Breakdown -->
    ${categoryBreakdown.length > 0 ? `
    <div class="section">
      <div class="section-title">Spending by Category</div>
      <div class="category-grid">
        ${categoryBreakdown.map(cat => `
          <div class="category-item">
            <span class="category-name">${cat.category}</span>
            <span>
              <span class="category-amount">${user.currency} ${cat.total.toLocaleString()}</span>
              <span class="category-percent">(${cat.percentage.toFixed(1)}%)</span>
            </span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- All Transactions -->
    <div class="section">
      <div class="section-title">Transaction History (${transactions.length} transactions)</div>
      ${transactions.length > 0 ? `
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(tx => `
            <tr>
              <td>${tx.date}</td>
              <td>${tx.merchant}${tx.notes ? ` - ${tx.notes}` : ''}</td>
              <td>${tx.category}</td>
              <td style="text-align: right;" class="${tx.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                ${tx.amount >= 0 ? '+' : ''}${user.currency} ${Math.abs(tx.amount).toFixed(2)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : '<p style="color: #008545; text-align: center;">No transactions in selected period</p>'}
    </div>

    <!-- Budget Status -->
    ${budgets.length > 0 ? `
    <div class="section">
      <div class="section-title">Budget Status</div>
      ${budgets.map(b => {
        const percentage = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0;
        const isOverBudget = percentage > 100;
        return `
          <div class="progress-container">
            <div class="progress-info">
              <div class="progress-name">${b.category}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background: ${isOverBudget ? 'linear-gradient(90deg, #ff3366, #ff6699)' : 'linear-gradient(90deg, #00ff88, #00cc6a)'}"></div>
              </div>
            </div>
            <div class="progress-text" style="color: ${isOverBudget ? '#ff3366' : '#E6A756'}">${percentage}% used</div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-left: 4px; font-size: 11px;">
            <span style="color: #008545;">Spent: ${user.currency} ${b.spent.toFixed(2)}</span>
            <span style="color: #008545;">Budget: ${user.currency} ${b.budget.toFixed(2)}</span>
            <span style="color: ${b.remaining >= 0 ? '#39FF14' : '#ff3366'};">Remaining: ${user.currency} ${b.remaining.toFixed(2)}</span>
          </div>
        `;
      }).join('')}
    </div>
    ` : ''}

    <!-- Goals Progress -->
    ${goals.length > 0 ? `
    <div class="section">
      <div class="section-title">Savings Goals</div>
      ${goals.map(g => `
        <div class="progress-container">
          <div class="progress-info">
            <div class="progress-name">${g.name}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(g.progress, 100)}%"></div>
            </div>
          </div>
          <div class="progress-text">${g.progress.toFixed(0)}%</div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-left: 4px; font-size: 11px;">
          <span style="color: #39FF14;">Current: ${user.currency} ${g.current.toLocaleString()}</span>
          <span style="color: #E6A756;">Target: ${user.currency} ${g.target.toLocaleString()}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>Generated by SpendTrak • Your Personal Finance Companion</p>
      <p class="confidential">This report is confidential and for personal use only.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Generate comprehensive CSV content
const generateCSVContent = (data: ExportData): string => {
  const { user, summary, transactions, budgets, goals, categoryBreakdown } = data;
  let csv = '';

  // Summary section
  csv += 'SPENDTRAK FINANCIAL EXPORT\n';
  csv += `Generated,${user.exportDate}\n`;
  csv += `User,${user.name}\n`;
  csv += `Email,${user.email}\n`;
  csv += `Currency,${user.currency}\n\n`;

  // Financial summary
  csv += 'FINANCIAL SUMMARY\n';
  csv += `Total Income,${summary.totalIncome}\n`;
  csv += `Total Expenses,${summary.totalExpenses}\n`;
  csv += `Net Savings,${summary.netSavings}\n`;
  csv += `Savings Rate,${summary.savingsRate}%\n`;
  csv += `Transaction Count,${summary.transactionCount}\n\n`;

  // Category breakdown
  if (categoryBreakdown.length > 0) {
    csv += 'SPENDING BY CATEGORY\n';
    csv += 'Category,Total,Percentage,Count\n';
    categoryBreakdown.forEach(cat => {
      csv += `"${cat.category}",${cat.total},${cat.percentage}%,${cat.count}\n`;
    });
    csv += '\n';
  }

  // Transactions
  csv += 'TRANSACTIONS\n';
  csv += 'Date,Description,Category,Amount,Notes\n';
  transactions.forEach(tx => {
    csv += `${tx.date},"${tx.merchant}","${tx.category}",${tx.amount},"${tx.notes || ''}"\n`;
  });
  csv += '\n';

  // Budgets
  if (budgets.length > 0) {
    csv += 'BUDGETS\n';
    csv += 'Category,Budget,Spent,Remaining,Usage %\n';
    budgets.forEach(b => {
      const usage = b.budget > 0 ? ((b.spent / b.budget) * 100).toFixed(1) : '0';
      csv += `"${b.category}",${b.budget},${b.spent},${b.remaining},${usage}%\n`;
    });
    csv += '\n';
  }

  // Goals
  if (goals.length > 0) {
    csv += 'SAVINGS GOALS\n';
    csv += 'Goal,Target,Current,Progress %\n';
    goals.forEach(g => {
      csv += `"${g.name}",${g.target},${g.current},${g.progress}%\n`;
    });
  }

  return csv;
};

// Generate comprehensive JSON content
const generateJSONContent = (data: ExportData): string => {
  return JSON.stringify({
    exportInfo: {
      app: 'SpendTrak',
      version: '1.0.0',
      exportDate: data.user.exportDate,
      format: 'SpendTrak Backup Format',
    },
    ...data,
  }, null, 2);
};

export default function ExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { triggerBlackout } = useTransition();
  const { currencyCode } = useCurrency();
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [selectedRange, setSelectedRange] = useState('month');
  const [isExporting, setIsExporting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isReady, setIsReady] = useState(true);
  const appStateRef = useRef(AppState.currentState);

  // Get real data from stores
  const transactions = useTransactionStore((state) => state.transactions);
  const user = useAuthStore((state) => state.user);

  // State for budgets and goals from devStorage
  const [budgets, setBudgets] = useState<DevBudget[]>([]);
  const [goals, setGoals] = useState<DevGoal[]>([]);

  // Load budgets and goals on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedBudgets, loadedGoals] = await Promise.all([
          getDevBudgets(),
          getDevGoals(),
        ]);
        setBudgets(loadedBudgets);
        setGoals(loadedGoals);
      } catch (error) {
        logger.general.error('Error loading export data:', error);
      }
    };
    loadData();
  }, []);

  // Reset state when screen comes into focus (handles return from share)
  useFocusEffect(
    useCallback(() => {
      setIsExporting(false);
      setIsReady(true);
      return () => {};
    }, [])
  );

  // Handle app state changes (return from sharing app)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - reset export state
        setIsExporting(false);
        setIsReady(true);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Build export data from real stores
  const buildExportData = useCallback((): ExportData => {
    const rangeData = dateRanges.find(r => r.id === selectedRange);
    const days = rangeData?.days || -1;

    // Filter transactions by date range
    const now = new Date();
    const filteredTransactions = days === -1
      ? transactions
      : transactions.filter(tx => {
          const txDate = new Date(tx.transaction_date || tx.created_at);
          const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= days;
        });

    // Calculate summary
    const totalIncome = filteredTransactions
      .filter(tx => (tx.amount || 0) > 0)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const totalExpenses = Math.abs(filteredTransactions
      .filter(tx => (tx.amount || 0) < 0)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0));

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // Category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>();
    filteredTransactions
      .filter(tx => (tx.amount || 0) < 0)
      .forEach(tx => {
        const cat = tx.category?.name || 'Uncategorized';
        const current = categoryMap.get(cat) || { total: 0, count: 0 };
        categoryMap.set(cat, {
          total: current.total + Math.abs(tx.amount || 0),
          count: current.count + 1,
        });
      });

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);

    // Format transactions for export
    const formattedTransactions = filteredTransactions
      .sort((a, b) => new Date(b.transaction_date || b.created_at).getTime() - new Date(a.transaction_date || a.created_at).getTime())
      .map(tx => ({
        date: new Date(tx.transaction_date || tx.created_at).toLocaleDateString(),
        merchant: tx.merchant_name || 'Unknown',
        category: tx.category?.name || 'Uncategorized',
        amount: tx.amount || 0,
        notes: tx.notes || '',
      }));

    // Format budgets for export - calculate spent from transactions
    const formattedBudgets = budgets.map(b => {
      // Calculate spent amount from transactions in this category
      const categoryTransactions = filteredTransactions.filter(tx =>
        (tx.category?.name || '').toLowerCase() === (b.category?.name || b.category || '').toString().toLowerCase() &&
        (tx.amount || 0) < 0
      );
      const spent = Math.abs(categoryTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0));

      return {
        category: typeof b.category === 'string' ? b.category : (b.category?.name || 'Budget'),
        budget: b.amount || 0,
        spent,
        remaining: (b.amount || 0) - spent,
      };
    });

    // Format goals for export
    const formattedGoals = goals.map(g => ({
      name: g.name || 'Goal',
      target: g.target_amount || 0,
      current: g.current_amount || 0,
      progress: (g.target_amount || 0) > 0 ? ((g.current_amount || 0) / (g.target_amount || 1)) * 100 : 0,
    }));

    return {
      user: {
        name: user?.display_name || 'SpendTrak User',
        email: user?.email || '',
        currency: currencyCode,
        exportDate: new Date().toLocaleDateString(undefined, {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
      },
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        transactionCount: filteredTransactions.length,
      },
      transactions: formattedTransactions,
      budgets: formattedBudgets,
      goals: formattedGoals,
      categoryBreakdown,
    };
  }, [transactions, budgets, goals, user, currencyCode, selectedRange]);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const data = buildExportData();
      const rangeData = dateRanges.find(r => r.id === selectedRange);
      const rangeName = rangeData ? t(rangeData.nameKey as any) : t('settings.allTime');
      const timestamp = new Date().toISOString().split('T')[0];

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (selectedFormat) {
        case 'pdf':
          // For PDF, we create an HTML file that can be opened/printed as PDF
          content = generatePDFContent(data, rangeName);
          filename = `SpendTrak_Report_${timestamp}.html`;
          mimeType = 'text/html';
          break;
        case 'csv':
          content = generateCSVContent(data);
          filename = `SpendTrak_Export_${timestamp}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          content = generateJSONContent(data);
          filename = `SpendTrak_Backup_${timestamp}.json`;
          mimeType = 'application/json';
          break;
        default:
          throw new Error('Invalid format');
      }

      // Save file to cache directory using new expo-file-system API
      const file = new File(Paths.cache, filename);
      file.write(content);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        // Open native share dialog
        await Sharing.shareAsync(file.uri, {
          mimeType,
          dialogTitle: 'Export SpendTrak Data',
        });
        // Sharing completed or cancelled - state will be reset by AppState listener
      } else {
        // Fallback - show success modal
        setShowSuccessModal(true);
      }
    } catch (error) {
      logger.general.error('Export error:', error);
    } finally {
      // Always reset exporting state
      setIsExporting(false);
    }
  };

  const selectedFormatObj = exportFormats.find(f => f.id === selectedFormat);
  const selectedRangeObj = dateRanges.find(r => r.id === selectedRange);

  return (
    <View style={styles.container}>
      <Header title={t('settings.exportData')} showBack onBack={() => triggerBlackout(() => router.back())} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Export Preview Card */}
        <GlassCard variant="glow" style={styles.previewCard}>
          <View style={styles.previewIcon}>
            <Ionicons
              name={(selectedFormatObj?.icon || 'document') as any}
              size={32}
              color={Colors.neon}
            />
          </View>
          <GradientTitle style={styles.previewTitle}>
            {selectedFormatObj ? t(selectedFormatObj.nameKey as any) : t('settings.exportData')}
          </GradientTitle>
          <Text style={styles.previewSubtitle}>
            {selectedRangeObj ? t(selectedRangeObj.nameKey as any) : t('settings.allTime')}
          </Text>
        </GlassCard>

        {/* Format Selection */}
        <View style={styles.sectionContainer}>
          <GradientText variant="muted" style={styles.sectionLabel}>
            {t('settings.exportFormat')}
          </GradientText>
          <GlassCard variant="default" style={styles.optionsCard}>
            {exportFormats.map((format, index) => (
              <Pressable
                key={format.id}
                onPress={() => setSelectedFormat(format.id)}
                style={[
                  styles.optionItem,
                  index < exportFormats.length - 1 && styles.itemBorder,
                  selectedFormat === format.id && styles.optionItemSelected,
                ]}
              >
                <View style={[
                  styles.optionIcon,
                  selectedFormat === format.id && styles.optionIconSelected,
                ]}>
                  <Ionicons
                    name={format.icon as any}
                    size={20}
                    color={selectedFormat === format.id ? Colors.neon : Colors.text.tertiary}
                  />
                </View>
                <View style={styles.optionInfo}>
                  <GradientText
                    variant={selectedFormat === format.id ? 'bright' : 'subtle'}
                    style={styles.optionName}
                  >
                    {t(format.nameKey as any)}
                  </GradientText>
                  <Text style={styles.optionDesc}>{t(format.descKey as any)}</Text>
                </View>
                {selectedFormat === format.id && (
                  <View style={styles.checkContainer}>
                    <CheckIcon size={18} color={Colors.neon} />
                  </View>
                )}
              </Pressable>
            ))}
          </GlassCard>
        </View>

        {/* Date Range Selection */}
        <View style={styles.sectionContainer}>
          <GradientText variant="muted" style={styles.sectionLabel}>
            {t('settings.dateRange')}
          </GradientText>
          <GlassCard variant="default" style={styles.optionsCard}>
            {dateRanges.map((range, index) => (
              <Pressable
                key={range.id}
                onPress={() => setSelectedRange(range.id)}
                style={[
                  styles.optionItem,
                  index < dateRanges.length - 1 && styles.itemBorder,
                  selectedRange === range.id && styles.optionItemSelected,
                ]}
              >
                <GradientText
                  variant={selectedRange === range.id ? 'bright' : 'subtle'}
                  style={styles.rangeName}
                >
                  {t(range.nameKey as any)}
                </GradientText>
                {selectedRange === range.id && (
                  <View style={styles.checkContainer}>
                    <CheckIcon size={18} color={Colors.neon} />
                  </View>
                )}
              </Pressable>
            ))}
          </GlassCard>
        </View>

        {/* Export Info */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={16} color={Colors.text.tertiary} />
          <Text style={styles.infoText}>
            {t('settings.exportInfoText')}
          </Text>
        </View>

        {/* Export Button */}
        <Button
          variant="primary"
          icon={isExporting ? undefined : <ExportIcon size={20} color={Colors.void} />}
          onPress={handleExport}
          disabled={isExporting}
          style={styles.exportButton}
        >
          {isExporting ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="small" color={Colors.void} />
              <Text style={styles.loadingText}>{t('settings.preparingExport')}</Text>
            </View>
          ) : (
            t('settings.shareExport')
          )}
        </Button>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Success Modal (fallback when sharing unavailable) */}
      <ConfirmationModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onConfirm={() => setShowSuccessModal(false)}
        title={t('settings.exportReady')}
        message={t('settings.exportReadyMessage')}
        confirmText={t('common.done')}
        cancelText=""
        variant="default"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  gateContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Preview Card
  previewCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.transparent.neon20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.transparent.neon30,
  },
  previewTitle: {
    fontSize: FontSize.h3,
    marginBottom: Spacing.xs,
  },
  previewSubtitle: {
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    fontFamily: FontFamily.regular,
  },

  // Section
  sectionContainer: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  optionsCard: {
    padding: 0,
    overflow: 'hidden',
  },

  // Option Item
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  optionItemSelected: {
    backgroundColor: Colors.transparent.neon10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.transparent.deep20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionIconSelected: {
    backgroundColor: Colors.transparent.neon20,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: FontSize.body,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
  },
  rangeName: {
    flex: 1,
    fontSize: FontSize.body,
  },
  checkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.transparent.neon20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },

  // Export Button
  exportButton: {
    marginTop: Spacing.md,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.void,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
  },
});
