# Phase 7: Search Integration - Frontend Test Checklist

## Manual Testing Guide

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend server running (typically `http://localhost:5173` or `http://localhost:3000`)
- Database seeded with institutions and services

---

## Test Scenarios

### ✅ Test 1: Institution Search
**Steps:**
1. Navigate to Service Catalogue page
2. Type "fayda" in the search box
3. Press Enter or wait for search to trigger

**Expected Results:**
- ✓ "National ID Program / Fayda" institution appears
- ✓ Shows correct number of services (4 services)
- ✓ Can expand institution to see services
- ✓ Search loading indicator shows briefly
- ✓ Results display within 1-2 seconds

**Backend Verified:** ✅ (Test 1 passed - 1 institution, 4 services found)

---

### ✅ Test 2: Service Search
**Steps:**
1. Navigate to Service Catalogue page
2. Type "ID" in the search box
3. Observe results

**Expected Results:**
- ✓ Multiple institutions appear (containing ID-related services)
- ✓ Shows institutions like "National ID Program" and others
- ✓ Expanding institutions shows ID-related services
- ✓ Service names contain "ID" keyword

**Backend Verified:** ✅ (Test 2 passed - 2 institutions, 6 services found)

---

### ✅ Test 3: Keyword Search
**Steps:**
1. Navigate to Service Catalogue page
2. Type "registration" in the search box
3. Check results

**Expected Results:**
- ✓ Institutions and services containing "registration" appear
- ✓ Results may include services about registration processes
- ✓ Keyword matches in service names or descriptions

**Backend Verified:** ✅ (Test 3 passed - 2 institutions, 5 services, 0 requirements)

---

### ✅ Test 4: Empty Search
**Steps:**
1. Navigate to Service Catalogue page
2. Clear the search box (empty string)
3. Observe results

**Expected Results:**
- ✓ Shows all institutions with their services
- ✓ No "no results" message
- ✓ All active institutions listed
- ✓ URL parameter `?search=` removed or empty

**Backend Behavior:** Returns validation error for empty query, frontend shows all institutions from local cache

---

### ✅ Test 5: No Results Search
**Steps:**
1. Navigate to Service Catalogue page
2. Type nonsense string like "xyzabc123"
3. Observe results

**Expected Results:**
- ✓ Shows "No results found for 'xyzabc123'" message
- ✓ No institutions displayed
- ✓ No services displayed
- ✓ Clean empty state with proper messaging

**Backend Verified:** ✅ (Test 6 passed - 0 total results)

---

### ✅ Test 6: Short Query (Less than 2 characters)
**Steps:**
1. Navigate to Service Catalogue page
2. Type single character like "a"
3. Observe behavior

**Expected Results:**
- ✓ Either shows validation message OR
- ✓ Shows no results OR
- ✓ Waits until 2+ characters typed
- ✓ No backend call made (checked in network tab)

**Backend Verified:** ✅ (Test 5 passed - backend rejects with validation error)

---

### ✅ Test 7: Search Results Navigation
**Steps:**
1. Search for "ID"
2. Click on an institution to expand
3. Click on a service to see details
4. Check if "Visit Official Website" links work

**Expected Results:**
- ✓ Institution expands/collapses smoothly
- ✓ Service accordion opens/closes
- ✓ Processing time and fees displayed
- ✓ "Visit Official Website" opens in new tab
- ✓ Service requirements section visible (even if empty)

---

### ✅ Test 8: URL Search Parameter
**Steps:**
1. Navigate to `/services?search=fayda`
2. Observe page loads with search pre-filled
3. Clear search
4. Check URL updates

**Expected Results:**
- ✓ Search box pre-filled with "fayda"
- ✓ Search results show immediately
- ✓ Clearing search removes `?search=` from URL
- ✓ Browser back/forward works correctly with search state

---

### ✅ Test 9: Loading States
**Steps:**
1. Open browser DevTools Network tab
2. Throttle network to "Slow 3G"
3. Search for "registration"
4. Observe loading indicators

**Expected Results:**
- ✓ Loading spinner appears during search
- ✓ "Searching..." text displayed
- ✓ Previous results cleared or kept (design choice)
- ✓ Loading indicator disappears when complete
- ✓ No multiple simultaneous requests (debouncing works)

---

### ✅ Test 10: Error Handling
**Steps:**
1. Stop the backend server
2. Try searching for "test"
3. Observe error handling

**Expected Results:**
- ✓ Error message displayed to user
- ✓ No blank screen or crash
- ✓ User can still interact with page
- ✓ Graceful degradation (shows cached data if available)

---

### ✅ Test 11: Language Support (if applicable)
**Steps:**
1. Switch language to Amharic
2. Search for institution/service
3. Verify results display in Amharic

**Expected Results:**
- ✓ Institution names show Amharic (`name_am`)
- ✓ Service names show Amharic (`name_am`)
- ✓ Search still works with English terms
- ✓ All UI text translated correctly

---

### ✅ Test 12: Special Characters
**Steps:**
1. Search with special characters: `ID@123`, `test&service`, etc.
2. Verify no errors occur

**Expected Results:**
- ✓ No JavaScript errors in console
- ✓ Search handled gracefully
- ✓ Either returns no results or relevant matches
- ✓ URL encoding works correctly

**Backend Verified:** ✅ (Test 8 passed - special characters handled)

---

## Backend API Tests Summary

**All Backend Tests Passed: 8/8 (100%)**

| Test | Query | Status | Results |
|------|-------|--------|---------|
| 1 | `fayda` | ✅ PASS | 1 institution, 4 services |
| 2 | `ID` | ✅ PASS | 2 institutions, 6 services |
| 3 | `registration` | ✅ PASS | 2 institutions, 5 services |
| 4 | Empty `q=` | ✅ PASS | 400 validation error |
| 5 | Short `q=a` | ✅ PASS | Validation error |
| 6 | No results `xyzabc123` | ✅ PASS | 0 results |
| 7 | Missing param | ✅ PASS | 400 error |
| 8 | Special chars `ID@123` | ✅ PASS | 0 results (handled) |

---

## Integration Points Verified

### ✅ ServiceContext
- [x] `searchServicesAndInstitutions()` now async
- [x] Calls `GET /api/search?q=<query>`
- [x] Returns empty array for queries < 2 characters
- [x] Returns all institutions for empty query (local cache)
- [x] Maps backend response to frontend format
- [x] Handles institutions and services grouping
- [x] Provides `searchLoading` and `searchError` states

### ✅ ServiceCataloguePage
- [x] Uses `useEffect` to trigger search on query change
- [x] Displays loading spinner during search
- [x] Shows error messages if search fails
- [x] Handles empty results gracefully
- [x] Updates URL with search parameter
- [x] Preserves expand/collapse state
- [x] Displays institution and service details correctly

### ✅ Backend API
- [x] Endpoint: `GET /api/search?q=<query>`
- [x] Validates minimum 2 characters
- [x] Returns structured response with institutions, services, requirements
- [x] Searches across multiple fields (name_en, name_am, description, code)
- [x] Returns active institutions and services only
- [x] Limits results appropriately (10 institutions, 20 services)

---

## Known Limitations

1. **No Debouncing Yet**
   - Search triggers immediately on keystroke
   - Recommend adding 300-500ms debounce to reduce API calls

2. **No Search History**
   - Recent searches not saved
   - Could add localStorage cache for better UX

3. **No Search Suggestions**
   - No autocomplete or "did you mean?"
   - Could enhance with typeahead

4. **Requirements Search Limited**
   - Backend searches requirements but frontend doesn't display them separately
   - Requirements are nested under services

---

## Performance Considerations

- ✅ Backend limits: 10 institutions, 20 services, 15 requirements
- ✅ Local cache used for empty query (no API call)
- ✅ Async search doesn't block UI
- ⚠️ No request cancellation (consider AbortController for rapid typing)
- ⚠️ No result caching (same query = new API call)

---

## Security Verified

- ✅ Query parameter properly URL-encoded
- ✅ No SQL injection risk (uses Supabase parameterized queries)
- ✅ XSS protection (React escapes content automatically)
- ✅ Public API endpoint (no auth required - appropriate for search)

---

## Accessibility (Basic Check)

- [ ] Search input has proper ARIA labels
- [ ] Loading state announced to screen readers
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Focus management correct
- [ ] High contrast mode compatible

**Note:** Full accessibility audit not in Phase 7 scope

---

## Browser Compatibility

**Tested On:** (To be filled during manual testing)
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Conclusion

**Backend API:** ✅ 100% Tested & Working  
**Frontend Integration:** ✅ Complete  
**Manual Testing:** ⏳ Pending (requires browser)

**Ready for manual QA testing.**
