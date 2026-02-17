#!/bin/bash
# SpendTrak Security Check Script
# Run before each release to check for common security issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   SpendTrak Security Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

ISSUES_FOUND=0
WARNINGS_FOUND=0

# Function to check for pattern in files
check_pattern() {
    local pattern=$1
    local description=$2
    local severity=$3
    local exclude_pattern=${4:-"node_modules"}

    if grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" \
        --exclude-dir="$exclude_pattern" -l "$pattern" . 2>/dev/null; then
        if [ "$severity" = "error" ]; then
            echo -e "${RED}[ERROR]${NC} $description"
            ((ISSUES_FOUND++))
        else
            echo -e "${YELLOW}[WARNING]${NC} $description"
            ((WARNINGS_FOUND++))
        fi
        grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" \
            --exclude-dir="$exclude_pattern" -n "$pattern" . 2>/dev/null || true
        echo ""
    fi
}

echo -e "${BLUE}Checking for exposed secrets...${NC}"
echo ""

# Check for hardcoded API keys
check_pattern "sk_live_" "Hardcoded Stripe live API key" "error"
check_pattern "pk_live_" "Hardcoded Stripe live publishable key" "warning"
check_pattern "AIza" "Possible Google API key" "warning"
check_pattern "AKIA" "Possible AWS access key" "error"

# Check for hardcoded Supabase credentials
check_pattern "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" "Possible exposed JWT token" "error"
check_pattern "service_role" "Service role key reference (should only be server-side)" "error"

# Check for console.log statements in production code
echo -e "${BLUE}Checking for debugging statements...${NC}"
echo ""

DEBUG_LOGS=$(grep -r --include="*.ts" --include="*.tsx" \
    --exclude-dir="node_modules" --exclude-dir="__tests__" --exclude-dir="scripts" \
    -c "console.log" . 2>/dev/null | grep -v ":0$" || true)

if [ -n "$DEBUG_LOGS" ]; then
    echo -e "${YELLOW}[WARNING]${NC} Found console.log statements (should be removed for production):"
    echo "$DEBUG_LOGS"
    ((WARNINGS_FOUND++))
    echo ""
fi

# Check for exposed environment variables
echo -e "${BLUE}Checking for environment file issues...${NC}"
echo ""

if [ -f ".env" ]; then
    echo -e "${YELLOW}[WARNING]${NC} .env file exists - ensure it's in .gitignore"
    ((WARNINGS_FOUND++))
fi

if [ -f ".env.local" ]; then
    echo -e "${YELLOW}[INFO]${NC} .env.local file found (this is expected for local development)"
fi

# Check for proper .gitignore
if [ -f ".gitignore" ]; then
    if ! grep -q ".env" .gitignore; then
        echo -e "${RED}[ERROR]${NC} .env is not in .gitignore"
        ((ISSUES_FOUND++))
    else
        echo -e "${GREEN}[OK]${NC} .env is properly gitignored"
    fi
else
    echo -e "${RED}[ERROR]${NC} No .gitignore file found"
    ((ISSUES_FOUND++))
fi

# Check package.json for security issues
echo ""
echo -e "${BLUE}Checking dependencies...${NC}"
echo ""

if command -v npm &> /dev/null; then
    # Run npm audit (will fail if vulnerabilities found)
    echo "Running npm audit..."
    if npm audit --audit-level=high 2>/dev/null; then
        echo -e "${GREEN}[OK]${NC} No high or critical vulnerabilities found"
    else
        echo -e "${YELLOW}[WARNING]${NC} Vulnerabilities found - review with 'npm audit'"
        ((WARNINGS_FOUND++))
    fi
fi

# Check for sensitive files that should not be committed
echo ""
echo -e "${BLUE}Checking for sensitive files...${NC}"
echo ""

SENSITIVE_FILES=(
    "google-service-account.json"
    "firebase-adminsdk.json"
    "*.pem"
    "*.key"
    "*.p12"
    ".env.production"
)

for file in "${SENSITIVE_FILES[@]}"; do
    if find . -name "$file" -not -path "./node_modules/*" 2>/dev/null | grep -q .; then
        echo -e "${RED}[ERROR]${NC} Found sensitive file: $file"
        ((ISSUES_FOUND++))
    fi
done

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Security Check Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    echo -e "${GREEN}All checks passed! No issues found.${NC}"
    exit 0
elif [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${YELLOW}Warnings: $WARNINGS_FOUND${NC}"
    echo -e "${GREEN}No critical issues found.${NC}"
    exit 0
else
    echo -e "${RED}Critical Issues: $ISSUES_FOUND${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS_FOUND${NC}"
    echo ""
    echo -e "${RED}Please fix critical issues before release!${NC}"
    exit 1
fi
