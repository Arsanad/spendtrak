#!/bin/bash

CATEGORY=$1

if [ -z "$CATEGORY" ]; then
    echo "Usage: ./scripts/test-category.sh <category>"
    echo ""
    echo "Available categories:"
    echo "  auth          - Authentication tests"
    echo "  dashboard     - Dashboard tests"
    echo "  transactions  - Transaction tests"
    echo "  add-expense   - Add expense tests"
    echo "  receipt       - Receipt scanner tests"
    echo "  subscriptions - Subscription tests"
    echo "  alerts        - Alert tests"
    echo "  ai            - AI consultant tests"
    echo "  settings      - Settings tests"
    echo "  budgets       - Budget tests"
    echo "  goals         - Goals tests"
    echo "  cards         - Card optimizer tests"
    echo "  navigation    - Navigation tests"
    echo "  theme         - Theme tests"
    exit 1
fi

case $CATEGORY in
    auth)
        maestro test maestro/tests/01-authentication.yaml
        ;;
    dashboard)
        maestro test maestro/tests/02-dashboard.yaml
        ;;
    transactions)
        maestro test maestro/tests/03-transactions.yaml
        ;;
    add-expense)
        maestro test maestro/tests/04-add-expense.yaml
        ;;
    receipt)
        maestro test maestro/tests/05-receipt-scanner.yaml
        ;;
    subscriptions)
        maestro test maestro/tests/06-subscriptions.yaml
        ;;
    alerts)
        maestro test maestro/tests/07-alerts.yaml
        ;;
    ai)
        maestro test maestro/tests/08-ai-consultant.yaml
        ;;
    settings)
        maestro test maestro/tests/09-settings.yaml
        ;;
    budgets)
        maestro test maestro/tests/10-budgets.yaml
        ;;
    goals)
        maestro test maestro/tests/11-goals.yaml
        ;;
    cards)
        maestro test maestro/tests/12-cards.yaml
        ;;
    navigation)
        maestro test maestro/tests/14-navigation.yaml
        ;;
    theme)
        maestro test maestro/tests/15-theme.yaml
        ;;
    *)
        echo "Unknown category: $CATEGORY"
        exit 1
        ;;
esac
