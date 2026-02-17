$files = @(
    "tests\02-dashboard.yaml",
    "tests\03-transactions.yaml",
    "tests\04-add-expense.yaml",
    "tests\05-receipt-scanner.yaml",
    "tests\06-subscriptions.yaml",
    "tests\07-alerts.yaml",
    "tests\08-ai-consultant.yaml",
    "tests\09-settings.yaml",
    "tests\10-budgets.yaml",
    "tests\11-goals.yaml",
    "tests\12-cards.yaml",
    "tests\13-transaction-detail.yaml",
    "tests\14-navigation.yaml",
    "tests\15-theme.yaml",
    "tests\01-authentication.yaml",
    "tests\free-tier\01-authentication.yaml",
    "tests\free-tier\02-dashboard.yaml",
    "tests\free-tier\03-transactions.yaml",
    "tests\free-tier\04-receipt-scanning.yaml",
    "tests\free-tier\05-categories.yaml",
    "tests\free-tier\06-budgets.yaml",
    "tests\free-tier\07-goals.yaml",
    "tests\free-tier\08-search-filter.yaml",
    "tests\free-tier\09-settings.yaml",
    "tests\plus-tier\01-transaction-splits.yaml",
    "tests\plus-tier\02-data-export.yaml",
    "tests\plus-tier\03-daily-spending-limit.yaml",
    "tests\plus-tier\04-date-presets.yaml",
    "tests\plus-tier\05-budget-rollover.yaml",
    "tests\plus-tier\06-subscriptions.yaml",
    "tests\plus-tier\07-alerts.yaml",
    "tests\premium-tier\01-ai-consultant.yaml",
    "tests\premium-tier\02-financial-health.yaml",
    "tests\premium-tier\03-card-optimizer.yaml",
    "tests\premium-tier\04-missed-rewards.yaml",
    "tests\premium-tier\05-subscription-extras.yaml",
    "tests\premium-tier\06-debt-management.yaml",
    "tests\premium-tier\07-income-tracking.yaml",
    "tests\premium-tier\08-net-worth.yaml",
    "tests\premium-tier\09-household-sharing.yaml",
    "tests\premium-tier\10-bill-calendar.yaml",
    "tests\premium-tier\11-zero-based-budget.yaml",
    "tests\premium-tier\12-investments.yaml",
    "tests\premium-tier\13-gamification.yaml",
    "helpers\login.yaml",
    "config.yaml",
    "auth-flow.yaml",
    "dashboard-flow.yaml",
    "transactions-flow.yaml",
    "camera-flow.yaml",
    "settings-flow.yaml",
    "subscriptions-flow.yaml",
    "alerts-flow.yaml",
    "ai-consultant-flow.yaml",
    "add-expense-flow.yaml",
    "full-app-flow.yaml",
    "run-all-tests.yaml"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        $content = $content -replace 'com\.spendtrak\.app\.dev', 'com.spendtrak.app'
        Set-Content $path $content -NoNewline
        Write-Host "Updated: $file"
    }
}
Write-Host "Done!"
