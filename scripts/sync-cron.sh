#!/bin/bash

# Sync Cron Jobs to Task Manager
# This script reads cron jobs and creates/updates tasks in the task manager

API_URL="http://localhost:3000/api"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔄 Syncing cron jobs to task manager..."

# Get current user's cron jobs
crontab -l 2>/dev/null | while IFS= read -r line; do
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

    # Parse cron line (simplified - assumes format: * * * * * command)
    schedule=$(echo "$line" | awk '{print $1, $2, $3, $4, $5}')
    command=$(echo "$line" | awk '{$1=$2=$3=$4=$5=""; print $0}' | sed 's/^[[:space:]]*//')

    # Extract a simple title from command
    title="Cron: $(echo "$command" | awk '{print $1}' | xargs basename)"

    # Check if task already exists for this cron job
    existing_task=$(curl -s "$API_URL/tasks" | jq -r ".[] | select(.source == \"cron\" and .metadata.command == \"$command\") | .id" | head -1)

    if [ -z "$existing_task" ]; then
        # Create new task
        echo "  ➕ Creating task for: $title"
        curl -s -X POST "$API_URL/tasks" \
            -H "Content-Type: application/json" \
            -d "{
                \"title\": \"$title\",
                \"description\": \"Automated cron job\n\nSchedule: $schedule\nCommand: $command\",
                \"status\": \"todo\",
                \"priority\": \"medium\",
                \"category\": \"automation\",
                \"source\": \"cron\",
                \"metadata\": {
                    \"schedule\": \"$schedule\",
                    \"command\": \"$command\"
                }
            }" > /dev/null
    else
        echo "  ✓ Task already exists for: $title"
    fi
done

# Get system-wide cron jobs from /etc/cron.d/ (if accessible)
if [ -d "/etc/cron.d" ] && [ -r "/etc/cron.d" ]; then
    for cronfile in /etc/cron.d/*; do
        [ -f "$cronfile" ] || continue

        filename=$(basename "$cronfile")

        # Check if we already have a task for this cron file
        existing_task=$(curl -s "$API_URL/tasks" | jq -r ".[] | select(.source == \"cron\" and .metadata.cronfile == \"$filename\") | .id" | head -1)

        if [ -z "$existing_task" ]; then
            echo "  ➕ Creating task for system cron: $filename"
            curl -s -X POST "$API_URL/tasks" \
                -H "Content-Type: application/json" \
                -d "{
                    \"title\": \"System Cron: $filename\",
                    \"description\": \"System-wide cron job from /etc/cron.d/$filename\",
                    \"status\": \"todo\",
                    \"priority\": \"medium\",
                    \"category\": \"automation\",
                    \"source\": \"cron\",
                    \"metadata\": {
                        \"cronfile\": \"$filename\",
                        \"type\": \"system\"
                    }
                }" > /dev/null
        fi
    done
fi

echo "✅ Cron sync complete!"
