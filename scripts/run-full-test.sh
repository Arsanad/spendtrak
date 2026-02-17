#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          SPENDTRAK COMPLETE AUTOMATED TEST SUITE             ║"
echo "║                  Testing All 180 Features                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Create results directory
RESULTS_DIR="test-results/$(date +%Y-%m-%d_%H-%M-%S)"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/screenshots"

# Start timer
START_TIME=$(date +%s)

echo "📱 Starting test run..."
echo "📁 Results will be saved to: $RESULTS_DIR"
echo ""

# Run all tests with Maestro
echo "🧪 Running Maestro E2E Tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

maestro test maestro/run-all-tests.yaml \
  --output "$RESULTS_DIR/maestro-report.xml" \
  --format junit \
  2>&1 | tee "$RESULTS_DIR/test-output.log"

MAESTRO_EXIT_CODE=$?

# Copy screenshots
cp -r ~/.maestro/tests/*/screenshots/* "$RESULTS_DIR/screenshots/" 2>/dev/null || true

# End timer
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Parse results and generate report
echo "📊 Generating Test Report..."

# Create HTML report
cat > "$RESULTS_DIR/report.html" << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <title>SpendTrak Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #00C853; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #00C853; border-bottom: 2px solid #00C853; padding-bottom: 10px; }
        h2 { color: #00E676; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .stat { background: #121212; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; text-align: center; }
        .stat-value { font-size: 48px; font-weight: bold; }
        .stat-label { color: #1B5E20; margin-top: 5px; }
        .pass { color: #00C853; }
        .fail { color: #FF5252; }
        .skip { color: #FFB300; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #1a1a1a; }
        th { background: #121212; color: #00E676; }
        tr:hover { background: #0a0a0a; }
        .status-pass { color: #00C853; }
        .status-fail { color: #FF5252; }
        .status-skip { color: #FFB300; }
        .screenshot { max-width: 200px; border-radius: 8px; border: 1px solid #1a1a1a; }
        .category { background: #1B5E20; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 SpendTrak Test Report</h1>
        <p>Generated: $(date)</p>

        <div class="summary">
            <div class="stat">
                <div class="stat-value pass">-</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat">
                <div class="stat-value fail">-</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat">
                <div class="stat-value skip">-</div>
                <div class="stat-label">Skipped</div>
            </div>
            <div class="stat">
                <div class="stat-value">-</div>
                <div class="stat-label">Duration</div>
            </div>
        </div>

        <h2>Test Categories</h2>
        <table>
            <tr><th>Category</th><th>Tests</th><th>Status</th></tr>
            <tr><td>Authentication</td><td>6</td><td class="status-pass">-</td></tr>
            <tr><td>Dashboard</td><td>14</td><td class="status-pass">-</td></tr>
            <tr><td>Transactions</td><td>12</td><td class="status-pass">-</td></tr>
            <tr><td>Add Expense</td><td>9</td><td class="status-pass">-</td></tr>
            <tr><td>Receipt Scanner</td><td>13</td><td class="status-pass">-</td></tr>
            <tr><td>Subscriptions</td><td>11</td><td class="status-pass">-</td></tr>
            <tr><td>Alerts</td><td>24</td><td class="status-pass">-</td></tr>
            <tr><td>AI Consultant</td><td>11</td><td class="status-pass">-</td></tr>
            <tr><td>Settings</td><td>15</td><td class="status-pass">-</td></tr>
            <tr><td>Budgets</td><td>10</td><td class="status-pass">-</td></tr>
            <tr><td>Goals</td><td>11</td><td class="status-pass">-</td></tr>
            <tr><td>Cards</td><td>11</td><td class="status-pass">-</td></tr>
            <tr><td>Transaction Detail</td><td>12</td><td class="status-pass">-</td></tr>
            <tr><td>Navigation</td><td>10</td><td class="status-pass">-</td></tr>
            <tr><td>Theme</td><td>11</td><td class="status-pass">-</td></tr>
        </table>

        <h2>Screenshots</h2>
        <p>Check the screenshots folder for visual verification.</p>
    </div>
</body>
</html>
HTMLEOF

# Generate summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                      TEST RESULTS SUMMARY                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⏱️  Duration: ${DURATION}s"
echo "📁 Report: $RESULTS_DIR/report.html"
echo "📸 Screenshots: $RESULTS_DIR/screenshots/"
echo ""

if [ $MAESTRO_EXIT_CODE -eq 0 ]; then
    echo "✅ ALL TESTS PASSED!"
else
    echo "❌ SOME TESTS FAILED - Check report for details"
fi

echo ""
echo "To view the report, open:"
echo "  $RESULTS_DIR/report.html"
