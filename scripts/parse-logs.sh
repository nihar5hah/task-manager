#!/bin/bash

# Parse logs and extract action items/tasks
# This script scans logs for TODO, FIXME, ACTION items and creates tasks

API_URL="http://localhost:3000/api"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Log directories to scan (customize as needed)
LOG_DIRS=(
    "$HOME/clawd/memory"
    "$HOME/.local/share/clawd"
    "/var/log"
)

echo "🔍 Parsing logs for action items..."

# Patterns to search for
PATTERNS=(
    "TODO:"
    "FIXME:"
    "ACTION:"
    "TASK:"
    "BUG:"
)

for log_dir in "${LOG_DIRS[@]}"; do
    [ -d "$log_dir" ] || continue

    echo "  📂 Scanning: $log_dir"

    for pattern in "${PATTERNS[@]}"; do
        # Find recent log files (last 7 days)
        find "$log_dir" -type f -name "*.log" -o -name "*.txt" -mtime -7 2>/dev/null | while read -r logfile; do
            # Search for pattern in file
            grep -in "$pattern" "$logfile" 2>/dev/null | while IFS=: read -r line_num line_content; do
                # Extract task text
                task_text=$(echo "$line_content" | sed "s/.*$pattern//g" | xargs)

                # Skip if empty
                [ -z "$task_text" ] && continue

                # Create a simple hash to avoid duplicates
                task_hash=$(echo "$task_text" | md5sum | awk '{print $1}')

                # Check if task already exists
                existing_task=$(curl -s "$API_URL/tasks" | jq -r ".[] | select(.metadata.log_hash == \"$task_hash\") | .id" | head -1)

                if [ -z "$existing_task" ]; then
                    # Determine priority based on pattern
                    priority="medium"
                    case "$pattern" in
                        "BUG:"|"FIXME:") priority="high" ;;
                        "TODO:") priority="medium" ;;
                        "ACTION:") priority="high" ;;
                    esac

                    echo "  ➕ Found: $task_text"
                    curl -s -X POST "$API_URL/tasks" \
                        -H "Content-Type: application/json" \
                        -d "{
                            \"title\": \"$task_text\",
                            \"description\": \"Found in: $logfile:$line_num\n\nPattern: $pattern\",
                            \"status\": \"backlog\",
                            \"priority\": \"$priority\",
                            \"category\": \"maintenance\",
                            \"source\": \"conversation\",
                            \"metadata\": {
                                \"log_hash\": \"$task_hash\",
                                \"log_file\": \"$logfile\",
                                \"line_number\": \"$line_num\",
                                \"pattern\": \"$pattern\"
                            }
                        }" > /dev/null
                fi
            done
        done
    done
done

# Parse git commit messages for completed tasks
if [ -d "$PROJECT_ROOT/../.." ] && [ -d "$PROJECT_ROOT/../../.git" ]; then
    echo "  📝 Parsing recent git commits..."

    cd "$PROJECT_ROOT/../.." || exit

    # Get commits from last 24 hours
    git log --since="24 hours ago" --pretty=format:"%s" 2>/dev/null | while read -r commit_msg; do
        # Look for task completion patterns
        if echo "$commit_msg" | grep -iq "fix\|complete\|finish\|done\|implement"; then
            task_hash=$(echo "$commit_msg" | md5sum | awk '{print $1}')

            existing_task=$(curl -s "$API_URL/tasks" | jq -r ".[] | select(.metadata.commit_hash == \"$task_hash\") | .id" | head -1)

            if [ -z "$existing_task" ]; then
                echo "  ✅ Completed: $commit_msg"
                curl -s -X POST "$API_URL/tasks" \
                    -H "Content-Type: application/json" \
                    -d "{
                        \"title\": \"$commit_msg\",
                        \"description\": \"Completed via git commit\",
                        \"status\": \"done\",
                        \"priority\": \"medium\",
                        \"category\": \"project\",
                        \"source\": \"conversation\",
                        \"metadata\": {
                            \"commit_hash\": \"$task_hash\"
                        }
                    }" > /dev/null
            fi
        fi
    done
fi

echo "✅ Log parsing complete!"
