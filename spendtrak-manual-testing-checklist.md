# SpendTrak Manual Testing Checklist
## Complete Feature List for QA Testing

**Total Features:** 130+
**Testing Time:** ~2-3 hours for full test

---

## 🆓 FREE TIER FEATURES

### Authentication
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 1 | Email Sign Up | Create account with email/password | ☐ |
| 2 | Email Sign In | Sign in with existing account | ☐ |
| 3 | Google Sign In | Sign in with Google OAuth | ☐ |
| 4 | Password Reset | Request password reset email | ☐ |
| 5 | Sign Out | Sign out and clear session | ☐ |
| 6 | Session Persistence | Close app, reopen, still signed in | ☐ |

### Dashboard
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 7 | Dashboard Summary | View total spending this month | ☐ |
| 8 | Spending Chart | View spending breakdown by category | ☐ |
| 9 | Recent Transactions | View last 5-10 transactions | ☐ |
| 10 | Quick Actions | Add expense, scan receipt buttons work | ☐ |
| 11 | Budget Overview | See budget progress cards | ☐ |

### Transactions (Manual Entry)
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 12 | Add Expense | Add a new expense manually | ☐ |
| 13 | Add Income | Add income transaction | ☐ |
| 14 | Edit Transaction | Modify existing transaction | ☐ |
| 15 | Delete Transaction | Remove a transaction | ☐ |
| 16 | Transaction Details | View full transaction details | ☐ |
| 17 | Add Notes | Add notes to transaction | ☐ |
| 18 | Set Date | Change transaction date | ☐ |
| 19 | Select Category | Assign category to transaction | ☐ |
| 20 | Transaction List | View all transactions | ☐ |
| 21 | Pull to Refresh | Refresh transaction list | ☐ |

### Receipt Scanning (OCR)
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 22 | Open Camera | Tap scan receipt, camera opens | ☐ |
| 23 | Capture Receipt | Take photo of receipt | ☐ |
| 24 | OCR Extraction | Amount/merchant auto-detected | ☐ |
| 25 | Review & Save | Confirm and save scanned transaction | ☐ |
| 26 | Attach to Existing | Attach receipt to existing transaction | ☐ |

### Categories
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 27 | View Categories | See all default categories | ☐ |
| 28 | Create Category | Add custom category | ☐ |
| 29 | Edit Category | Change category name/icon/color | ☐ |
| 30 | Delete Category | Remove custom category | ☐ |
| 31 | Category Icons | Icons display correctly | ☐ |

### Basic Budgets
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 32 | Create Budget | Create monthly budget for category | ☐ |
| 33 | View Budget Progress | See spent vs. budget amount | ☐ |
| 34 | Edit Budget | Change budget amount | ☐ |
| 35 | Delete Budget | Remove a budget | ☐ |
| 36 | Budget Alert | Alert shows when over 80% | ☐ |
| 37 | Over Budget Warning | Warning shows when exceeded | ☐ |

### Basic Goals
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 38 | Create Goal | Create savings goal | ☐ |
| 39 | Goal Progress | See progress bar | ☐ |
| 40 | Add Contribution | Add money to goal | ☐ |
| 41 | Edit Goal | Change target amount/date | ☐ |
| 42 | Delete Goal | Remove goal | ☐ |

### Search & Filter
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 43 | Search Transactions | Search by merchant name | ☐ |
| 44 | Filter by Category | Filter transactions by category | ☐ |
| 45 | Filter by Date | Filter by date range | ☐ |
| 46 | Filter by Amount | Filter by amount range | ☐ |
| 47 | Sort Options | Sort by date/amount | ☐ |

### Settings
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 48 | Profile Settings | View/edit profile | ☐ |
| 49 | Currency Setting | Change currency | ☐ |
| 50 | Theme (Light/Dark) | Toggle theme | ☐ |
| 51 | Notifications | Toggle notification settings | ☐ |

---

## 💰 PLUS TIER ($7.99/month)

### Transaction Splits
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 52 | Split Transaction | Split $100 into 2 categories | ☐ |
| 53 | Multi-Split | Split into 3+ categories | ☐ |
| 54 | Edit Split | Modify split amounts | ☐ |
| 55 | Unsplit | Merge split back to single | ☐ |
| 56 | Split Validation | Total must equal original | ☐ |

### Data Export
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 57 | Export to CSV | Download transactions as CSV | ☐ |
| 58 | Export to JSON | Download as JSON | ☐ |
| 59 | Date Range Export | Export specific date range | ☐ |
| 60 | Category Export | Export by category | ☐ |
| 61 | Share Export | Share exported file | ☐ |

### Daily Spending Limit
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 62 | Set Daily Limit | Set $50 daily limit | ☐ |
| 63 | Safe to Spend | See remaining for today | ☐ |
| 64 | Over Limit Warning | Alert when exceeded | ☐ |
| 65 | Daily History | View spending by day | ☐ |

### Date Presets
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 66 | This Week | Filter by this week | ☐ |
| 67 | Last Month | Filter by last month | ☐ |
| 68 | Last 30 Days | Filter by last 30 days | ☐ |
| 69 | Custom Range | Set custom date range | ☐ |
| 70 | Save Custom Preset | Save custom range as preset | ☐ |

### Budget Rollover
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 71 | Enable Rollover | Turn on rollover for budget | ☐ |
| 72 | Positive Rollover | Underspent amount carries forward | ☐ |
| 73 | Rollover History | View rollover amounts | ☐ |
| 74 | Max Rollover | Set maximum rollover limit | ☐ |

### Subscription Detection
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 75 | View Subscriptions | See detected subscriptions | ☐ |
| 76 | Add Subscription | Manually add subscription | ☐ |
| 77 | Edit Subscription | Modify subscription details | ☐ |
| 78 | Cancel Subscription | Mark as cancelled | ☐ |
| 79 | Monthly Total | See total monthly subscriptions | ☐ |
| 80 | Annual Total | See yearly cost | ☐ |
| 81 | Renewal Alerts | Get notified before renewal | ☐ |

### Alerts System
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 82 | View Alerts | See all alerts | ☐ |
| 83 | Unread Count | Badge shows unread count | ☐ |
| 84 | Mark as Read | Mark alert as read | ☐ |
| 85 | Dismiss Alert | Dismiss/delete alert | ☐ |
| 86 | Alert Types | Different alert icons/colors | ☐ |

---

## 👑 PREMIUM TIER ($14.99/month)

### AI Financial Consultant
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 87 | Open AI Chat | Open AI consultant screen | ☐ |
| 88 | Send Message | Ask "How much did I spend on food?" | ☐ |
| 89 | Receive Response | AI responds with analysis | ☐ |
| 90 | Conversation History | Previous messages saved | ☐ |
| 91 | Spending Advice | Ask "How can I save money?" | ☐ |
| 92 | Budget Advice | Ask "Am I on track with budgets?" | ☐ |

### Financial Health Score
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 93 | View Health Score | See overall score (0-100) | ☐ |
| 94 | Score Breakdown | See component scores | ☐ |
| 95 | Improvement Tips | See suggestions to improve | ☐ |

### Card Optimizer
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 96 | Add Credit Card | Add card with rewards info | ☐ |
| 97 | View Cards | See all cards | ☐ |
| 98 | Best Card Recommendation | See which card for groceries | ☐ |
| 99 | Category Recommendations | Best card per category | ☐ |
| 100 | Edit Card | Modify card details | ☐ |
| 101 | Delete Card | Remove card | ☐ |

### Missed Rewards Tracking
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 102 | View Missed Rewards | See rewards you missed | ☐ |
| 103 | Monthly Total | Total missed this month | ☐ |
| 104 | By Transaction | See which transactions | ☐ |
| 105 | Better Card Suggestion | Which card would've been better | ☐ |

### Subscription Extras
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 106 | Cancellation Email | Generate cancellation email | ☐ |
| 107 | Price Change Alert | Alert when subscription price changes | ☐ |
| 108 | Duplicate Detection | Detect duplicate charges | ☐ |

### Debt Management
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 109 | Add Debt | Add credit card debt | ☐ |
| 110 | Add Loan | Add auto/student loan | ☐ |
| 111 | View Debts | See all debts | ☐ |
| 112 | Record Payment | Log debt payment | ☐ |
| 113 | Debt Summary | Total debt, interest, etc. | ☐ |
| 114 | Snowball Strategy | Calculate snowball payoff | ☐ |
| 115 | Avalanche Strategy | Calculate avalanche payoff | ☐ |
| 116 | Debt-Free Date | See projected payoff date | ☐ |
| 117 | Compare Strategies | Compare snowball vs avalanche | ☐ |

### Income Tracking
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 118 | Add Income Source | Add salary/freelance income | ☐ |
| 119 | View Income | See all income sources | ☐ |
| 120 | Recurring Income | Set up recurring income | ☐ |
| 121 | Income by Source | Breakdown by source | ☐ |
| 122 | Cash Flow Report | Income vs expenses | ☐ |

### Net Worth Tracking
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 123 | Add Asset | Add cash/investment asset | ☐ |
| 124 | Add Property | Add real estate | ☐ |
| 125 | Add Vehicle | Add car value | ☐ |
| 126 | Add Liability | Add loan/debt | ☐ |
| 127 | View Net Worth | See total net worth | ☐ |
| 128 | Net Worth Chart | Historical net worth graph | ☐ |
| 129 | Assets vs Liabilities | Breakdown view | ☐ |
| 130 | Monthly Change | See month-over-month change | ☐ |

### Household Sharing
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 131 | Create Household | Create new household | ☐ |
| 132 | Invite Member | Send invitation email | ☐ |
| 133 | Accept Invite | Join household via code | ☐ |
| 134 | View Members | See household members | ☐ |
| 135 | Shared Budget | Create shared budget | ☐ |
| 136 | Shared Goal | Create shared goal | ☐ |
| 137 | Assign Transaction | Assign expense to member | ☐ |
| 138 | Member Spending | See who spent what | ☐ |
| 139 | Hide Transaction | Hide from partner | ☐ |
| 140 | Remove Member | Remove from household | ☐ |

### Bill Calendar
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 141 | Add Bill | Add recurring bill | ☐ |
| 142 | View Calendar | See bills on calendar | ☐ |
| 143 | Upcoming Bills | See next 7 days bills | ☐ |
| 144 | Mark Paid | Mark bill as paid | ☐ |
| 145 | Overdue Bills | See overdue bills | ☐ |
| 146 | Bill Reminders | Get reminder notification | ☐ |
| 147 | Monthly Bill Total | Total bills this month | ☐ |
| 148 | Edit Bill | Modify bill details | ☐ |
| 149 | Delete Bill | Remove bill | ☐ |

### Zero-Based Budgeting
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 150 | Create Period | Create new budget period | ☐ |
| 151 | Set Income | Enter total income | ☐ |
| 152 | Allocate to Categories | Assign $ to each category | ☐ |
| 153 | Balance Check | Verify income = allocated | ☐ |
| 154 | Unallocated Warning | Alert if money unallocated | ☐ |
| 155 | Track Spending | See spent vs allocated | ☐ |
| 156 | Reallocate | Move money between categories | ☐ |

### Investment Tracking
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 157 | Add Stock | Add stock holding | ☐ |
| 158 | Add ETF | Add ETF holding | ☐ |
| 159 | Add Crypto | Add cryptocurrency | ☐ |
| 160 | View Portfolio | See all holdings | ☐ |
| 161 | Portfolio Value | Total investment value | ☐ |
| 162 | Gain/Loss | See profit/loss | ☐ |
| 163 | Gain/Loss % | Percentage change | ☐ |
| 164 | Price Refresh | Refresh current prices | ☐ |
| 165 | Buy Transaction | Record purchase | ☐ |
| 166 | Sell Transaction | Record sale | ☐ |
| 167 | Dividend | Record dividend | ☐ |
| 168 | Asset Allocation | Pie chart by type | ☐ |
| 169 | Performance Chart | Portfolio over time | ☐ |

### Gamification
| # | Feature | Test Steps | Pass? |
|---|---------|------------|:-----:|
| 170 | View Achievements | See all achievements | ☐ |
| 171 | Unlock Achievement | Complete action, unlock badge | ☐ |
| 172 | View Points | See total points | ☐ |
| 173 | Current Level | See level (Bronze, Silver, etc.) | ☐ |
| 174 | Level Progress | Progress bar to next level | ☐ |
| 175 | Daily Streak | See current streak | ☐ |
| 176 | Streak Milestone | 7-day, 30-day streak badges | ☐ |
| 177 | View Challenges | See active challenges | ☐ |
| 178 | Join Challenge | Join a challenge | ☐ |
| 179 | Challenge Progress | See progress in challenge | ☐ |
| 180 | Leaderboard | See rankings | ☐ |

---

## 📊 Testing Summary

| Tier | Features | Tests |
|------|----------|-------|
| Free | 51 | ☐ |
| Plus ($7.99) | 35 | ☐ |
| Premium ($14.99) | 94 | ☐ |
| **TOTAL** | **180** | ☐ |

---

## 🐛 Bug Report Template

If you find a bug:

```
Feature: [Feature name]
Test #: [Number]
Steps to Reproduce:
1. 
2. 
3. 
Expected: 
Actual: 
Screenshot: [if applicable]
```

---

## ✅ Sign-Off

| Tester | Date | Free Tier | Plus Tier | Premium Tier |
|--------|------|:---------:|:---------:|:------------:|
| | | ☐ | ☐ | ☐ |

**App Version:** 2.0.0
**Test Device:** 
**OS Version:** 

---

*SpendTrak v2.0.0 - Manual QA Testing Checklist*
