#!/bin/bash
# Task Manager API Helper - Quick task updates

BASE_URL="http://localhost:3000/api"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

case "$1" in
  create)
    # Create new task
    curl -s -X POST "$BASE_URL/tasks" \
      -H "Content-Type: application/json" \
      -d "{
        \"title\": \"$2\",
        \"description\": \"$3\",
        \"status\": \"${4:-todo}\",
        \"priority\": \"${5:-medium}\",
        \"category\": \"${6:-project}\"
      }" | python3 -m json.tool
    ;;
    
  done)
    # Mark task as done
    curl -s -X PUT "$BASE_URL/tasks/$2" \
      -H "Content-Type: application/json" \
      -d '{"status": "done"}' | python3 -m json.tool
    ;;
    
  progress)
    # Mark task as in-progress
    curl -s -X PUT "$BASE_URL/tasks/$2" \
      -H "Content-Type: application/json" \
      -d '{"status": "in-progress"}' | python3 -m json.tool
    ;;
    
  update)
    # Update task with JSON
    curl -s -X PUT "$BASE_URL/tasks/$2" \
      -H "Content-Type: application/json" \
      -d "$3" | python3 -m json.tool
    ;;
    
  list)
    # List all tasks
    curl -s "$BASE_URL/tasks" | python3 -m json.tool
    ;;
    
  *)
    echo "Task Manager API Helper"
    echo ""
    echo "Usage:"
    echo "  $0 create <title> [description] [status] [priority] [category]"
    echo "  $0 done <task-id>"
    echo "  $0 progress <task-id>"
    echo "  $0 update <task-id> <json>"
    echo "  $0 list"
    echo ""
    echo "Examples:"
    echo "  $0 create \"Fix bug\" \"Description here\" todo high project"
    echo "  $0 done task-007"
    echo "  $0 progress task-002"
    ;;
esac
