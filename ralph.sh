#!/bin/bash
# Ralph - Autonomous PRD Executor
# Usage: ./ralph.sh [--tool amp|claude] [max_iterations]
#
# Looks for ralph/prd.json in current directory first, then script directory

set -e

# Parse arguments
TOOL="claude"  # Default to claude
MAX_ITERATIONS=30

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

# Validate tool choice
if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'."
  exit 1
fi

# Find project directory - check for prd.json in current dir or script dir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "./prd.json" ]; then
  PROJECT_DIR="$(pwd)"
elif [ -f "$SCRIPT_DIR/prd.json" ]; then
  PROJECT_DIR="$SCRIPT_DIR"
else
  echo "Error: Cannot find prd.json"
  echo "Expected locations:"
  echo "  - ./prd.json (current directory)"
  echo "  - $SCRIPT_DIR/prd.json (script directory)"
  exit 1
fi

PRD_FILE="$PROJECT_DIR/prd.json"
PROGRESS_FILE="$PROJECT_DIR/progress.txt"
CLAUDE_MD="$PROJECT_DIR/CLAUDE.md"
ARCHIVE_DIR="$PROJECT_DIR/archive"
LAST_BRANCH_FILE="$PROJECT_DIR/.last-branch"

echo "Ralph Configuration:"
echo "  Project dir: $PROJECT_DIR"
echo "  PRD file:    $PRD_FILE"
echo "  CLAUDE.md:   $CLAUDE_MD"
echo "  Tool:        $TOOL"
echo "  Max iters:   $MAX_ITERATIONS"
echo ""

# Check CLAUDE.md exists for claude tool
if [[ "$TOOL" == "claude" ]] && [ ! -f "$CLAUDE_MD" ]; then
  echo "Error: $CLAUDE_MD not found"
  echo "Create this file with instructions for Claude"
  exit 1
fi

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    DATE=$(date +%Y-%m-%d)
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "  Archived to: $ARCHIVE_FOLDER"

    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file if needed
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

# Show current status
echo "Current PRD status:"
TOTAL=$(jq '.userStories | length' "$PRD_FILE")
DONE=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")
NEXT=$(jq -r '.userStories[] | select(.passes == false) | "\(.id): \(.title)"' "$PRD_FILE" | head -1)
echo "  Progress: $DONE / $TOTAL stories completed"
echo "  Next:     $NEXT"
echo ""

# Confirm before starting
read -p "Start Ralph? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Starting Ralph - $MAX_ITERATIONS iterations max"
echo "================================================="

cd "$PROJECT_DIR"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  # Check if all done before running
  REMAINING=$(jq '[.userStories[] | select(.passes == false)] | length' "$PRD_FILE")
  if [ "$REMAINING" -eq 0 ]; then
    echo ""
    echo "All stories completed!"
    exit 0
  fi

  # Show what we're working on
  CURRENT=$(jq -r '.userStories[] | select(.passes == false) | "\(.id): \(.title)"' "$PRD_FILE" | head -1)
  echo "Working on: $CURRENT"
  echo ""

  # Run the tool
  if [[ "$TOOL" == "amp" ]]; then
    OUTPUT=$(cat "$PROJECT_DIR/prompt.md" | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true
  else
    OUTPUT=$(claude --dangerously-skip-permissions --print < "$CLAUDE_MD" 2>&1 | tee /dev/stderr) || true
  fi

  # Check for completion - but verify against actual prd.json, don't trust Claude's claim
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    ACTUAL_REMAINING=$(jq '[.userStories[] | select(.passes == false)] | length' "$PRD_FILE")
    if [ "$ACTUAL_REMAINING" -eq 0 ]; then
      echo ""
      echo "================================================="
      echo "  Ralph completed all tasks!"
      echo "  Finished at iteration $i of $MAX_ITERATIONS"
      echo "================================================="
      exit 0
    else
      echo ""
      echo "================================================="
      echo "  WARNING: Claude claimed completion but $ACTUAL_REMAINING stories remain!"
      echo "  Continuing with next iteration..."
      echo "================================================="
    fi
  fi

  # Update status
  DONE=$(jq '[.userStories[] | select(.passes == true)] | length' "$PRD_FILE")
  echo ""
  echo "Iteration $i complete. Progress: $DONE / $TOTAL"
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS)"
echo "Check ralph/progress.txt for status"
exit 1
