# SpendTrak E2E Testing Guide

## Complete Automated Test Suite for 180+ Features

This document describes how to run the complete automated E2E test suite for SpendTrak.

---

## Prerequisites

### 1. Install Maestro

**Windows (using WSL or Git Bash):**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$PATH":"$HOME/.maestro/bin"
```

**macOS:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Verify installation:**
```bash
maestro --version
```

### 2. Setup Device/Emulator

- **Android:** Start an Android emulator or connect a physical device
- **iOS:** Start iOS simulator or connect a physical device

### 3. Start the App

```bash
cd spendtrak
npx expo start --dev-client
```

---

## Running Tests

### Run All Tests (180 Features)
```bash
npm run e2e:full
# or
maestro test maestro/run-all-tests.yaml
```

### Run Individual Test Categories

| Command | Category | Tests |
|---------|----------|-------|
| `npm run e2e:auth` | Authentication | 6 |
| `npm run e2e:dashboard` | Dashboard | 14 |
| `npm run e2e:transactions` | Transactions | 12 |
| `npm run e2e:add-expense` | Add Expense | 9 |
| `npm run e2e:receipt` | Receipt Scanner | 13 |
| `npm run e2e:subscriptions` | Subscriptions | 11 |
| `npm run e2e:alerts` | Alerts | 24 |
| `npm run e2e:ai` | AI Consultant | 11 |
| `npm run e2e:settings` | Settings | 15 |
| `npm run e2e:budgets` | Budgets | 10 |
| `npm run e2e:goals` | Goals | 11 |
| `npm run e2e:cards` | Card Optimizer | 11 |
| `npm run e2e:transaction-detail` | Transaction Detail | 12 |
| `npm run e2e:navigation` | Navigation | 10 |
| `npm run e2e:theme` | Theme/UI | 11 |

---

## Test Structure

```
maestro/
├── config.yaml              # Test configuration
├── run-all-tests.yaml       # Master test runner
├── helpers/
│   └── login.yaml           # Login helper flow
└── tests/
    ├── 01-authentication.yaml
    ├── 02-dashboard.yaml
    ├── 03-transactions.yaml
    ├── 04-add-expense.yaml
    ├── 05-receipt-scanner.yaml
    ├── 06-subscriptions.yaml
    ├── 07-alerts.yaml
    ├── 08-ai-consultant.yaml
    ├── 09-settings.yaml
    ├── 10-budgets.yaml
    ├── 11-goals.yaml
    ├── 12-cards.yaml
    ├── 13-transaction-detail.yaml
    ├── 14-navigation.yaml
    └── 15-theme.yaml
```

---

## Feature Coverage

### Authentication (6 tests)
- [ ] Welcome screen appears
- [ ] Get Started navigation
- [ ] Google Sign In visible
- [ ] Microsoft Sign In visible
- [ ] Auto login persistence
- [ ] Sign out functionality

### Dashboard (14 tests)
- [ ] Greeting shows correctly
- [ ] Current date displays
- [ ] Total balance/spent card
- [ ] Transaction count
- [ ] Month comparison (↑/↓)
- [ ] Quick Action: Scan Receipt
- [ ] Quick Action: Add Expense
- [ ] Quick Action: Card Optimizer
- [ ] AI Consultant button
- [ ] Critical alerts section
- [ ] Subscription summary card
- [ ] Top categories
- [ ] Total savings display
- [ ] Pull to refresh

### Transactions (12 tests)
- [ ] Transaction list loads
- [ ] Search functionality
- [ ] Filter: All
- [ ] Filter: Email
- [ ] Filter: Receipt
- [ ] Filter: Manual
- [ ] Transaction card elements
- [ ] Tap transaction → detail
- [ ] Pagination
- [ ] Pull to refresh
- [ ] Empty state
- [ ] Add button

### Add Expense (9 tests)
- [ ] Amount input
- [ ] Merchant input
- [ ] Category grid
- [ ] Select category
- [ ] Date picker
- [ ] Notes field
- [ ] Save button
- [ ] Validation errors
- [ ] Close/cancel

### Receipt Scanner (13 tests)
- [ ] Camera permission
- [ ] Camera view
- [ ] Capture button
- [ ] Gallery button
- [ ] Preview mode
- [ ] Retake button
- [ ] Processing indicator
- [ ] OCR results
- [ ] Confidence badge
- [ ] Edit results
- [ ] Save receipt
- [ ] Discard button
- [ ] Close button

### Subscriptions (11 tests)
- [ ] Subscription list
- [ ] Summary card
- [ ] Potential savings
- [ ] Subscription card elements
- [ ] Status badge
- [ ] Unused detection
- [ ] Cancel button
- [ ] Tap subscription → detail
- [ ] Upcoming renewals
- [ ] Pull to refresh
- [ ] Empty state

### Alerts (24 tests)
- [ ] Alert list
- [ ] Unread count
- [ ] Tab badge
- [ ] Alert card
- [ ] Severity colors
- [ ] Unread indicator
- [ ] Tap alert → marks read
- [ ] Mark all read
- [ ] Dismiss alert
- [ ] Pull to refresh
- [ ] Empty state
- [ ] Alert types (13): Unusual spending, Duplicate charge, Price increase, Free trial ending, Subscription renewal, Large transaction, Budget warning, Budget exceeded, Upcoming bill, Low balance, Goal milestone, Weekly summary, Monthly summary

### AI Consultant (11 tests)
- [ ] Open chat modal
- [ ] Disclaimer banner
- [ ] Welcome state
- [ ] Suggestion chips
- [ ] Text input
- [ ] Send message
- [ ] AI response
- [ ] Loading state
- [ ] Chat history
- [ ] Context awareness
- [ ] Close button

### Budgets (10 tests)
- [ ] Budget list
- [ ] Budget card
- [ ] Progress colors
- [ ] Add budget
- [ ] Select category
- [ ] Set amount
- [ ] Set period
- [ ] Edit budget
- [ ] Delete budget
- [ ] Empty state

### Goals (11 tests)
- [ ] Goals list
- [ ] Goal card
- [ ] Status badge
- [ ] Add goal
- [ ] Goal types
- [ ] Set target
- [ ] Set deadline
- [ ] Edit goal
- [ ] Mark complete
- [ ] Delete goal
- [ ] Empty state

### Card Optimizer (11 tests)
- [ ] Cards list
- [ ] Card display
- [ ] Add card
- [ ] Select bank
- [ ] Card type
- [ ] Set primary
- [ ] Delete card
- [ ] Best card suggestion
- [ ] Missed rewards
- [ ] Card recommendations
- [ ] Transaction card tip

### Settings (15 tests)
- [ ] Profile section
- [ ] Connected accounts
- [ ] Notifications toggle
- [ ] Alert preferences
- [ ] Budgets link
- [ ] Goals link
- [ ] Cards link
- [ ] Categories link
- [ ] Salik settings
- [ ] DEWA settings
- [ ] Help/Support
- [ ] Privacy policy
- [ ] Terms of service
- [ ] App version
- [ ] Sign out

### Transaction Detail (12 tests)
- [ ] Amount display
- [ ] Merchant name
- [ ] Category badge
- [ ] Source badge
- [ ] Date & time
- [ ] Card used
- [ ] Card optimization tip
- [ ] Notes
- [ ] Receipt image
- [ ] Edit button
- [ ] Delete button
- [ ] Back button

### Navigation (10 tests)
- [ ] Home tab
- [ ] Transactions tab
- [ ] Subscriptions tab
- [ ] Alerts tab
- [ ] Settings tab
- [ ] Back navigation
- [ ] Modal navigation
- [ ] Deep linking
- [ ] Tab switching
- [ ] Gesture navigation

### Theme/UI (11 tests)
- [ ] Dark theme consistency
- [ ] Green text colors
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Responsive layout
- [ ] Keyboard handling
- [ ] Modal theming
- [ ] Tab bar styling
- [ ] Card styling
- [ ] Button styling

---

## Test Results Output

After running tests, results are saved to:
- `test-results/[timestamp]/maestro-report.xml` - JUnit XML report
- `test-results/[timestamp]/screenshots/` - Test screenshots
- `test-results/[timestamp]/report.html` - HTML report

---

## Troubleshooting

### Common Issues

1. **Maestro not found**: Ensure PATH is set correctly
2. **No device found**: Start emulator or connect device
3. **App not running**: Start Expo dev server first
4. **Tests timing out**: Increase timeouts in YAML files

### Debug Mode

Run Maestro in debug mode:
```bash
maestro test maestro/tests/02-dashboard.yaml --debug
```

### Record New Tests

Record a new test flow:
```bash
maestro record
```

---

## Summary

| Category | Total Features |
|----------|---------------|
| Authentication | 6 |
| Dashboard | 14 |
| Transactions | 12 |
| Add Expense | 9 |
| Receipt Scanner | 13 |
| Subscriptions | 11 |
| Alerts | 24 |
| AI Consultant | 11 |
| Budgets | 10 |
| Goals | 11 |
| Card Optimizer | 11 |
| Settings | 15 |
| Transaction Detail | 12 |
| Navigation | 10 |
| Theme/UI | 11 |
| **TOTAL** | **180** |
