#!/bin/bash

# Auto-update script - runs periodically to sync all data
# Can be added to crontab to run automatically

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Running auto-update..."
echo "Time: $(date)"
echo ""

# Sync cron jobs
echo "1️⃣  Syncing cron jobs..."
bash "$SCRIPT_DIR/sync-cron.sh"
echo ""

# Parse logs for tasks
echo "2️⃣  Parsing logs..."
bash "$SCRIPT_DIR/parse-logs.sh"
echo ""

echo "✅ Auto-update complete!"
echo "Next run: Add this to crontab:"
echo "  */30 * * * * $SCRIPT_DIR/auto-update.sh >> /tmp/task-manager-sync.log 2>&1"
