#!/bin/bash

# Frontend Mock Data Cleanup - Verification Script
# Run this after completing all fixes to verify 100% cleanup

echo "==================================================================="
echo "Frontend Mock Data Cleanup - Verification Script"
echo "==================================================================="
echo ""

cd frontend/src

echo "1. Checking for remaining localStorage mock data keys..."
echo "-------------------------------------------------------------------"
MESOB_KEYS=$(grep -r "mesob_" --include="*.jsx" --include="*.js" . | grep -v "mesob_token\|theme\|lang" | wc -l)
if [ "$MESOB_KEYS" -eq 0 ]; then
    echo "✅ PASS: No obsolete localStorage keys found"
    echo "   Only legitimate keys (mesob_token, theme, lang) remain"
else
    echo "❌ FAIL: Found $MESOB_KEYS obsolete localStorage references:"
    grep -r "mesob_" --include="*.jsx" --include="*.js" . | grep -v "mesob_token\|theme\|lang"
fi
echo ""

echo "2. Checking for remaining sharedData imports in dashboards..."
echo "-------------------------------------------------------------------"
SHARED_IMPORTS=$(grep -r "from.*sharedData" pages/dashboard --include="*.jsx" | grep -v "Notification" | wc -l)
if [ "$SHARED_IMPORTS" -eq 0 ]; then
    echo "✅ PASS: No obsolete sharedData imports found"
    echo "   Only notification helper imports remain"
else
    echo "❌ FAIL: Found $SHARED_IMPORTS obsolete sharedData imports:"
    grep -r "from.*sharedData" pages/dashboard --include="*.jsx" | grep -v "Notification"
fi
echo ""

echo "3. Checking for undefined function calls..."
echo "-------------------------------------------------------------------"
UNDEFINED_FUNCS=$(grep -r "getInstitutions\|createInstitution\|updateInstitution\|deleteInstitution" pages --include="*.jsx" | wc -l)
if [ "$UNDEFINED_FUNCS" -eq 0 ]; then
    echo "✅ PASS: No undefined institution function calls found"
else
    echo "❌ FAIL: Found $UNDEFINED_FUNCS undefined function calls:"
    grep -r "getInstitutions\|createInstitution\|updateInstitution\|deleteInstitution" pages --include="*.jsx"
fi
echo ""

echo "4. Checking for organizationsData references in dashboards..."
echo "-------------------------------------------------------------------"
ORG_DATA=$(grep -r "organizationsData" pages/dashboard --include="*.jsx" | wc -l)
if [ "$ORG_DATA" -eq 0 ]; then
    echo "✅ PASS: No organizationsData references in dashboards"
else
    echo "❌ FAIL: Found $ORG_DATA organizationsData references:"
    grep -r "organizationsData" pages/dashboard --include="*.jsx"
fi
echo ""

echo "5. Checking sharedData.js file size..."
echo "-------------------------------------------------------------------"
SHARED_LINES=$(wc -l < utils/sharedData.js)
if [ "$SHARED_LINES" -le 50 ]; then
    echo "✅ PASS: sharedData.js is lean ($SHARED_LINES lines)"
    echo "   File should contain only notification helpers"
else
    echo "⚠️  WARNING: sharedData.js has $SHARED_LINES lines"
    echo "   Expected: ~40 lines (notification helpers only)"
fi
echo ""

echo "6. Checking AuthContext localStorage usage..."
echo "-------------------------------------------------------------------"
AUTH_LOCALSTORAGE=$(grep "localStorage" context/AuthContext.jsx | grep "mesob_users" | wc -l)
if [ "$AUTH_LOCALSTORAGE" -eq 0 ]; then
    echo "✅ PASS: AuthContext doesn't use mesob_users localStorage"
else
    echo "⚠️  WARNING: AuthContext still uses mesob_users localStorage ($AUTH_LOCALSTORAGE occurrences)"
    echo "   Should use /api/users backend API instead"
fi
echo ""

echo "==================================================================="
echo "VERIFICATION SUMMARY"
echo "==================================================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

if [ "$MESOB_KEYS" -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
if [ "$SHARED_IMPORTS" -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
if [ "$UNDEFINED_FUNCS" -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
if [ "$ORG_DATA" -eq 0 ]; then ((PASSED++)); else ((FAILED++)); fi
if [ "$SHARED_LINES" -le 50 ]; then ((PASSED++)); else ((WARNINGS++)); fi
if [ "$AUTH_LOCALSTORAGE" -eq 0 ]; then ((PASSED++)); else ((WARNINGS++)); fi

TOTAL=$((PASSED + FAILED + WARNINGS))

echo "Tests Passed:   ✅ $PASSED/$TOTAL"
echo "Tests Failed:   ❌ $FAILED/$TOTAL"
echo "Warnings:       ⚠️  $WARNINGS/$TOTAL"
echo ""

if [ "$FAILED" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
    echo "🎉 CONGRATULATIONS! Mock data cleanup is 100% complete!"
    echo ""
    echo "✅ All obsolete localStorage keys removed"
    echo "✅ All dashboard imports updated to use contexts"
    echo "✅ All undefined function calls fixed"
    echo "✅ sharedData.js cleaned to only notification helpers"
    echo "✅ AuthContext uses backend API for user management"
    echo ""
    echo "Next steps:"
    echo "1. Test all dashboards manually"
    echo "2. Verify backend API integration works"
    echo "3. Deploy to staging environment"
elif [ "$FAILED" -eq 0 ]; then
    echo "⚠️  Cleanup is almost complete! Only warnings remain."
    echo ""
    echo "Remaining tasks:"
    if [ "$SHARED_LINES" -gt 50 ]; then
        echo "- Review sharedData.js to ensure only notification helpers remain"
    fi
    if [ "$AUTH_LOCALSTORAGE" -gt 0 ]; then
        echo "- Update AuthContext to use /api/users backend API"
    fi
else
    echo "❌ Cleanup is not yet complete. Please fix failing tests."
    echo ""
    echo "Follow these guides:"
    echo "- QUICK_FIX_GUIDE.md for SuperAdminDashboard fixes"
    echo "- FINAL_CLEANUP_REPORT.md for AuthContext updates"
    echo "- CLEANUP_COMPLETE_SUMMARY.md for overall status"
fi

echo ""
echo "==================================================================="
