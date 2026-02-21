#!/bin/bash
# Run all performance test scenarios and generate baseline report
# Usage: ./scripts/run-baseline.sh [environment]

set -e

ENV=${1:-local}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="./results/${TIMESTAMP}"

echo "=============================================="
echo "RDVPriority Performance Baseline Test"
echo "Environment: ${ENV}"
echo "Timestamp: ${TIMESTAMP}"
echo "=============================================="

# Create results directory
mkdir -p "${RESULTS_DIR}"

# Check k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "ERROR: k6 is not installed"
    echo "Install with: brew install k6 (macOS) or choco install k6 (Windows)"
    exit 1
fi

echo ""
echo "Starting baseline tests..."
echo ""

# Run each scenario
run_scenario() {
    local name=$1
    local file=$2
    local extra_args=${3:-""}
    
    echo "----------------------------------------"
    echo "Running: ${name}"
    echo "----------------------------------------"
    
    k6 run \
        --env TEST_ENV=${ENV} \
        --out json="${RESULTS_DIR}/${name}.json" \
        ${extra_args} \
        "scenarios/${file}" \
        2>&1 | tee "${RESULTS_DIR}/${name}.log"
    
    echo ""
}

# 1. Auth load test (shorter for baseline)
run_scenario "auth-load" "auth-load.js" "--duration 3m"

# 2. Alerts CRUD test
run_scenario "alerts-crud" "alerts-crud.js" "--duration 3m"

# 3. Prefecture cache test  
run_scenario "prefecture-cache" "prefecture-cache.js" "--duration 2m"

# 4. Admin dashboard test
run_scenario "admin-dashboard" "admin-dashboard.js" "--duration 2m"

# 5. DB pool stress (optional - can be slow)
if [ "${RUN_STRESS:-false}" = "true" ]; then
    run_scenario "stress-db-pool" "stress-db-pool.js" "--duration 5m"
fi

# Generate summary
echo "=============================================="
echo "BASELINE TEST COMPLETE"
echo "=============================================="
echo ""
echo "Results saved to: ${RESULTS_DIR}"
echo ""
echo "Files:"
ls -la "${RESULTS_DIR}"
echo ""

# Generate summary report
echo "Generating summary report..."
cat > "${RESULTS_DIR}/summary.md" << EOF
# Performance Baseline Report

**Date:** $(date)
**Environment:** ${ENV}

## Test Results

| Scenario | Status | Duration |
|----------|--------|----------|
| Auth Load | $(grep -q '"status": "passed"' "${RESULTS_DIR}/auth-load.json" 2>/dev/null && echo "PASS" || echo "FAIL") | 3m |
| Alerts CRUD | $(grep -q '"status": "passed"' "${RESULTS_DIR}/alerts-crud.json" 2>/dev/null && echo "PASS" || echo "FAIL") | 3m |
| Prefecture Cache | $(grep -q '"status": "passed"' "${RESULTS_DIR}/prefecture-cache.json" 2>/dev/null && echo "PASS" || echo "FAIL") | 2m |
| Admin Dashboard | $(grep -q '"status": "passed"' "${RESULTS_DIR}/admin-dashboard.json" 2>/dev/null && echo "PASS" || echo "FAIL") | 2m |

## Key Metrics

See individual log files for detailed metrics.

## Recommendations

- Review any FAIL status tests
- Check for slow queries (>1s) in logs
- Monitor p95/p99 response times
EOF

echo ""
echo "Summary report: ${RESULTS_DIR}/summary.md"
echo ""
echo "Done!"
