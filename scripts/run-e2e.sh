#!/bin/bash
# SpendTrak E2E Test Runner
# Uses Maestro for E2E testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   SpendTrak E2E Test Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}Error: Maestro is not installed${NC}"
    echo "Install with: curl -Ls 'https://get.maestro.mobile.dev' | bash"
    exit 1
fi

echo -e "${GREEN}✓ Maestro is installed${NC}"
maestro --version
echo ""

# Default flow to run
FLOW="${1:-all}"

# E2E test directory
E2E_DIR="./maestro"

# Check if maestro directory exists
if [ ! -d "$E2E_DIR" ]; then
    echo -e "${RED}Error: Maestro directory not found at $E2E_DIR${NC}"
    exit 1
fi

run_single_flow() {
    local flow_name=$1
    local flow_file="$E2E_DIR/$flow_name.yaml"

    if [ ! -f "$flow_file" ]; then
        echo -e "${RED}Error: Flow file not found: $flow_file${NC}"
        return 1
    fi

    echo -e "${YELLOW}Running: $flow_name${NC}"
    if maestro test "$flow_file"; then
        echo -e "${GREEN}✓ $flow_name passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $flow_name failed${NC}"
        return 1
    fi
}

run_all_flows() {
    local failed=0
    local passed=0
    local flows=(
        "auth-flow"
        "dashboard-flow"
        "add-expense-flow"
        "transactions-flow"
        "subscriptions-flow"
        "alerts-flow"
        "settings-flow"
        "camera-flow"
        "ai-consultant-flow"
        "full-app-flow"
    )

    echo -e "${BLUE}Running all E2E test flows...${NC}"
    echo ""

    for flow in "${flows[@]}"; do
        if run_single_flow "$flow"; then
            ((passed++))
        else
            ((failed++))
        fi
        echo ""
    done

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   Test Results${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}Passed: $passed${NC}"
    echo -e "${RED}Failed: $failed${NC}"
    echo ""

    if [ $failed -gt 0 ]; then
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    else
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    fi
}

case "$FLOW" in
    "all")
        run_all_flows
        ;;
    "auth")
        run_single_flow "auth-flow"
        ;;
    "dashboard")
        run_single_flow "dashboard-flow"
        ;;
    "expense")
        run_single_flow "add-expense-flow"
        ;;
    "transactions")
        run_single_flow "transactions-flow"
        ;;
    "subscriptions")
        run_single_flow "subscriptions-flow"
        ;;
    "alerts")
        run_single_flow "alerts-flow"
        ;;
    "settings")
        run_single_flow "settings-flow"
        ;;
    "camera")
        run_single_flow "camera-flow"
        ;;
    "ai")
        run_single_flow "ai-consultant-flow"
        ;;
    "full")
        run_single_flow "full-app-flow"
        ;;
    *)
        echo -e "${YELLOW}Usage: ./scripts/run-e2e.sh [flow]${NC}"
        echo ""
        echo "Available flows:"
        echo "  all          - Run all E2E tests (default)"
        echo "  auth         - Run authentication flow"
        echo "  dashboard    - Run dashboard flow"
        echo "  expense      - Run add expense flow"
        echo "  transactions - Run transactions flow"
        echo "  subscriptions- Run subscriptions flow"
        echo "  alerts       - Run alerts flow"
        echo "  settings     - Run settings flow"
        echo "  camera       - Run camera/receipt scanner flow"
        echo "  ai           - Run AI consultant flow"
        echo "  full         - Run full app flow"
        exit 1
        ;;
esac
