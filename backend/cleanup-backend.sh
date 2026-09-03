#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         🧹 BACKEND CLEANUP - REMOVE UNNECESSARY FILES        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DELETED_COUNT=0
KEPT_COUNT=0

delete_file() {
    local file="$1"
    if [ -f "$file" ]; then
        rm "$file"
        echo -e "${RED}❌ Deleted:${NC} $file"
        ((DELETED_COUNT++))
    else
        echo -e "${YELLOW}⚠️  Not found:${NC} $file"
    fi
}

delete_directory() {
    local dir="$1"
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo -e "${RED}❌ Deleted directory:${NC} $dir"
        ((DELETED_COUNT++))
    else
        echo -e "${YELLOW}⚠️  Directory not found:${NC} $dir"
    fi
}

keep_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Keeping:${NC} $file"
        ((KEPT_COUNT++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Delete Duplicate/Outdated Documentation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

delete_file "ANALYSIS_COMPLETE.md"
delete_file "API_TEST_GUIDE.md"
delete_file "DIAGNOSTIC_REPORT.md"
delete_file "FINAL_FIX_REPORT.md"
delete_file "FINAL_SUMMARY.md"
delete_file "FIXES_APPLIED.md"
delete_file "FIX_NOW.md"
delete_file "GET_APPLICATIONS_FIX.md"
delete_file "GET_QUEUES_FIX.md"
delete_file "GET_QUEUES_STATUS.md"
delete_file "QUICK_START_CHECKLIST.md"
delete_file "START_HERE.md"
delete_file "STATUS_REPORT.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Delete Duplicate Test Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

delete_file "auto-fix-and-test.sh"
delete_file "detailed-test.sh"
delete_file "quick-test.sh"
delete_file "test-after-restart.sh"
delete_file "test-api-complete.sh"
delete_file "test-auth-api.sh"
delete_file "test-complete-api.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Delete Temporary SQL Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

delete_file "FIX_REMAINING_ISSUES.sql"
delete_file "SIMPLE_FIX.sql"
delete_file "seed_missing_users.sql"
delete_file "VERIFY_AND_FIX_SCHEMA.sql"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Delete Log Files and Temporary Scripts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

delete_file "server.log"
delete_file "run-database-updates.sh"
delete_file "start-server.ps1"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Delete Archived SQL Files (Outdated)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "docs/sql-archive" ]; then
    echo -e "${BLUE}Found sql-archive folder with outdated SQL files${NC}"
    delete_directory "docs/sql-archive"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 6: Delete Cleanup Documentation (After Review)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

delete_file "CLEANUP_PLAN.md"
delete_file "CLEANUP_INSTRUCTIONS.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 7: Essential Files (Keeping)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}Documentation to keep:${NC}"
keep_file "COMPLETE_WORK_SUMMARY.md"
keep_file "GET_APPLICATIONS_QUEUES_FIX_COMPLETE.md"
keep_file "README_TESTING.md"
keep_file "USER_ROLES_REFERENCE.md"
keep_file "HOW_TO_ADD_MISSING_USERS.md"
keep_file "ISSUES_FOUND_IN_TESTING.md"
keep_file "QUICK_FIX_GUIDE.md"
keep_file "FINAL_TEST_STATUS.md"

echo ""
echo -e "${GREEN}Test scripts to keep:${NC}"
keep_file "test-all-api.sh"
keep_file "test-all-roles.sh"
keep_file "test-fixed-endpoints.sh"
keep_file "verify-fixes.sh"
keep_file "diagnose-queue-error.sh"
keep_file "check-users.sh"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 8: Optional Cleanup (Manual Review Recommended)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${YELLOW}Optional deletions (not included in this script):${NC}"
echo "  .agents/ - Delete if not used by your IDE"
echo "  backups/ - Keep or rename to .backups to hide"
echo "  docs/reports/ - Check if empty and delete"
echo "  skills-lock.json - Delete if not needed"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    CLEANUP SUMMARY                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${RED}Files/folders deleted: $DELETED_COUNT${NC}"
echo -e "${GREEN}Essential files kept: $KEPT_COUNT${NC}"
echo ""
echo "Cleanup complete! Your backend folder is now organized."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RECOMMENDED NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Verify tests still work:"
echo "   bash test-all-api.sh"
echo "   bash test-all-roles.sh"
echo ""
echo "2. Commit cleaned codebase:"
echo "   git add ."
echo "   git commit -m \"Clean up backend: removed duplicate docs and temp files\""
echo ""
echo "3. Review remaining files:"
echo "   ls -la"
echo ""
echo "4. Delete this cleanup script:"
echo "   rm cleanup-backend.sh"
echo ""
echo -e "${GREEN}✅ Backend cleanup complete!${NC}"
