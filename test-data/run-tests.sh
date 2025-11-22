#!/bin/bash

# Test runner for Alakran Vapi webhooks
# Usage: ./run-tests.sh [test-name]
# Examples:
#   ./run-tests.sh                    # Run all tests
#   ./run-tests.sh availability       # Run availability tests only
#   ./run-tests.sh reservation        # Run reservation tests only

BASE_URL="${BASE_URL:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Alakran Vapi Webhook Tests"
echo "Base URL: $BASE_URL"
echo "========================================"
echo ""

run_test() {
    local name="$1"
    local endpoint="$2"
    local json_file="$3"

    echo -e "${YELLOW}Testing: $name${NC}"
    echo "Endpoint: $endpoint"
    echo "Payload: $json_file"
    echo ""

    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d @"$SCRIPT_DIR/$json_file")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    echo "Status: $http_code"
    echo "Response:"
    echo "$body" | jq . 2>/dev/null || echo "$body"
    echo ""

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
    fi
    echo ""
    echo "----------------------------------------"
    echo ""
}

# Check if server is running
echo "Checking server health..."
health_response=$(curl -s "$BASE_URL/health" 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Server is not running at $BASE_URL${NC}"
    echo "Start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}Server is healthy${NC}"
echo ""
echo "----------------------------------------"
echo ""

# Run tests based on argument
case "${1:-all}" in
    availability|avail)
        run_test "Check Availability (tool-calls format)" \
            "/webhooks/check-availability" \
            "check-availability-tool-calls.json"

        run_test "Check Availability (function-call format)" \
            "/webhooks/check-availability" \
            "check-availability-function-call.json"
        ;;

    reservation|res)
        run_test "Reservation Complete (standard)" \
            "/webhooks/reservation-complete" \
            "reservation-complete.json"

        run_test "Reservation with Baby" \
            "/webhooks/reservation-complete" \
            "reservation-with-baby.json"

        run_test "Reservation with Wrong Year (should auto-correct)" \
            "/webhooks/reservation-complete" \
            "reservation-wrong-year.json"
        ;;

    all|*)
        run_test "Check Availability (tool-calls format)" \
            "/webhooks/check-availability" \
            "check-availability-tool-calls.json"

        run_test "Check Availability (function-call format)" \
            "/webhooks/check-availability" \
            "check-availability-function-call.json"

        run_test "Reservation Complete (standard)" \
            "/webhooks/reservation-complete" \
            "reservation-complete.json"

        run_test "Reservation with Baby" \
            "/webhooks/reservation-complete" \
            "reservation-with-baby.json"

        run_test "Reservation with Wrong Year (should auto-correct)" \
            "/webhooks/reservation-complete" \
            "reservation-wrong-year.json"
        ;;
esac

echo "========================================"
echo "Tests completed"
echo "========================================"
