#!/bin/bash

# Task Manager Comprehensive Test Script
# Tests all API endpoints and features

echo "🧪 Task Manager Comprehensive Test Suite"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"
FAILED=0
PASSED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
    ((PASSED++))
    echo -e "${GREEN}✓${NC} $1"
}

fail() {
    ((FAILED++))
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    info "Testing: $description"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -X "$method" "$BASE_URL$endpoint")
    fi
    
    if [ $? -eq 0 ]; then
        pass "$description"
        echo "   Response: $response" | head -c 100
        echo ""
        echo "$response"
    else
        fail "$description"
    fi
    echo ""
}

# Test 1: Server is running
info "Checking server status..."
if curl -s "$BASE_URL" > /dev/null; then
    pass "Server is running on $BASE_URL"
else
    fail "Server is not responding"
    exit 1
fi
echo ""

# Test 2: Get all tasks (should be empty or have previous data)
info "Test 1: GET /api/tasks"
response=$(curl -s "$BASE_URL/api/tasks")
if echo "$response" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
    pass "GET /api/tasks returns valid JSON"
    task_count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
    info "Current task count: $task_count"
else
    fail "GET /api/tasks returned invalid JSON"
fi
echo ""

# Test 3: Create a new task
info "Test 2: POST /api/tasks (Create Task)"
new_task='{"title":"Test Task 1","description":"Testing task creation","status":"todo","priority":"high","category":"project","tags":["test","api"]}'
response=$(curl -s -X POST "$BASE_URL/api/tasks" \
    -H "Content-Type: application/json" \
    -d "$new_task")

if echo "$response" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
    pass "Successfully created task"
    TASK_ID=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
    info "Created task ID: $TASK_ID"
else
    fail "Failed to create task"
    echo "Response: $response"
fi
echo ""

# Test 4: Create multiple tasks for testing
info "Test 3: Creating multiple tasks..."
for i in {2..5}; do
    task_data="{\"title\":\"Test Task $i\",\"status\":\"backlog\",\"priority\":\"medium\",\"category\":\"automation\"}"
    curl -s -X POST "$BASE_URL/api/tasks" \
        -H "Content-Type: application/json" \
        -d "$task_data" > /dev/null
done
pass "Created 4 additional test tasks"
echo ""

# Test 5: Get all tasks again
info "Test 4: Verify task creation"
response=$(curl -s "$BASE_URL/api/tasks")
new_count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
if [ "$new_count" -ge 5 ]; then
    pass "All tasks created successfully (count: $new_count)"
else
    fail "Expected at least 5 tasks, got $new_count"
fi
echo ""

# Test 6: Update a task
if [ -n "$TASK_ID" ]; then
    info "Test 5: PUT /api/tasks/:id (Update Task)"
    update_data='{"status":"in-progress","priority":"urgent"}'
    response=$(curl -s -X PUT "$BASE_URL/api/tasks/$TASK_ID" \
        -H "Content-Type: application/json" \
        -d "$update_data")
    
    updated_status=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'error'))")
    if [ "$updated_status" = "in-progress" ]; then
        pass "Task updated successfully"
    else
        fail "Task update failed"
    fi
    echo ""
fi

# Test 7: Get task IDs for bulk operations
info "Test 6: Preparing bulk operations..."
response=$(curl -s "$BASE_URL/api/tasks")
TASK_IDS=$(echo "$response" | python3 -c "
import sys, json
tasks = json.load(sys.stdin)
ids = [t['id'] for t in tasks[:3]]  # Get first 3 IDs
print(','.join(ids))
")

if [ -n "$TASK_IDS" ]; then
    pass "Retrieved task IDs for bulk operations"
    info "Task IDs: $TASK_IDS"
else
    fail "Could not retrieve task IDs"
fi
echo ""

# Test 8: Bulk update
info "Test 7: POST /api/tasks/bulk-update"
IFS=',' read -ra ID_ARRAY <<< "$TASK_IDS"
bulk_ids=$(printf ',"%s"' "${ID_ARRAY[@]}")
bulk_ids="[${bulk_ids:1}]"
bulk_update_data="{\"ids\":$bulk_ids,\"updates\":{\"status\":\"done\"}}"

response=$(curl -s -X POST "$BASE_URL/api/tasks/bulk-update" \
    -H "Content-Type: application/json" \
    -d "$bulk_update_data")

if echo "$response" | grep -q "Tasks updated"; then
    pass "Bulk update successful"
else
    fail "Bulk update failed"
fi
echo ""

# Test 9: Verify bulk update
info "Test 8: Verifying bulk update..."
response=$(curl -s "$BASE_URL/api/tasks")
done_count=$(echo "$response" | python3 -c "
import sys, json
tasks = json.load(sys.stdin)
print(len([t for t in tasks if t['status'] == 'done']))
")
if [ "$done_count" -ge 3 ]; then
    pass "Bulk update verified ($done_count tasks marked as done)"
else
    fail "Bulk update verification failed"
fi
echo ""

# Test 10: Sync endpoint
info "Test 9: POST /api/sync"
response=$(curl -s -X POST "$BASE_URL/api/sync")
if echo "$response" | grep -q "Sync completed"; then
    pass "Sync endpoint working"
else
    fail "Sync endpoint failed"
fi
echo ""

# Test 11: Bulk delete
info "Test 10: DELETE /api/tasks/bulk-delete"
bulk_delete_data="{\"ids\":$bulk_ids}"
response=$(curl -s -X DELETE "$BASE_URL/api/tasks/bulk-delete" \
    -H "Content-Type: application/json" \
    -d "$bulk_delete_data")

if echo "$response" | grep -q "Tasks deleted"; then
    pass "Bulk delete successful"
else
    fail "Bulk delete failed"
fi
echo ""

# Test 12: Delete individual task
if [ -n "$TASK_ID" ]; then
    info "Test 11: DELETE /api/tasks/:id"
    response=$(curl -s -X DELETE "$BASE_URL/api/tasks/$TASK_ID")
    if echo "$response" | grep -q "Task deleted"; then
        pass "Individual task delete successful"
    else
        fail "Individual task delete failed"
    fi
    echo ""
fi

# Test 13: Final task count
info "Test 12: Final verification"
response=$(curl -s "$BASE_URL/api/tasks")
final_count=$(echo "$response" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
info "Final task count: $final_count"
echo ""

# Summary
echo "=========================================="
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
