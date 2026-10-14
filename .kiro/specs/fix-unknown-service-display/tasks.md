# Implementation Plan: Fix Unknown Service Display Issue

## Overview

This task list implements the fix for the "Unknown Service" display issue that occurs when applications are created. The solution modifies the `createApplication` function in `ApplicationContext.jsx` to fetch complete application data (including joined service and institution information) immediately after the POST request succeeds. The implementation includes proper error handling with graceful degradation to ensure backward compatibility.

## Tasks

- [ ] 1. Modify createApplication function to add getApplication dependency
  - Update the dependency array of the `createApplication` useCallback hook to include `getApplication`
  - Current: `[fetchApplications]`
  - Target: `[fetchApplications, getApplication]`
  - Location: `frontend/src/context/ApplicationContext.jsx`
  - _Requirements: 1.5_

- [ ] 2. Implement complete application data fetching after POST
  - [ ] 2.1 Extract application ID from POST response
    - After successful POST request, extract `appData.id` from the response
    - Validate that the ID exists before proceeding
    - If ID is missing, throw an error to treat as creation failure
    - _Requirements: 1.1_

  - [ ] 2.2 Add try-catch wrapper for complete data fetch
    - Wrap the `getApplication()` call in a try-catch block
    - Implement graceful degradation on fetch failure
    - Ensure errors don't block success screen display
    - _Requirements: 3.1, 3.4, 4.4_

  - [ ] 2.3 Fetch complete application data using getApplication
    - Call `await getApplication(appData.id)` after POST succeeds
    - Store the complete application data in a variable
    - Check if the returned data is valid (not null)
    - _Requirements: 1.1, 1.3, 1.4, 4.2_

  - [ ] 2.4 Update local state with complete application data
    - If complete data is retrieved, use it instead of partial data
    - Update state: `setApplications(prev => [completeApp, ...prev])`
    - If fetch fails, fall back to partial data from POST response
    - _Requirements: 1.3, 1.4_

- [ ] 3. Implement API call sequencing for data refresh
  - [ ] 3.1 Call fetchApplications after complete data retrieval
    - Execute `await fetchApplications()` after getting complete data
    - Ensure this happens in the success path
    - Wrap in try-catch to prevent blocking on failure
    - _Requirements: 1.5, 4.1, 4.3_

  - [ ] 3.2 Maintain correct execution order
    - Verify `fetchApplications()` is called before returning
    - Ensure the call happens in both success and fallback paths
    - Maintain existing behavior for application list refresh
    - _Requirements: 4.1, 4.3_

- [ ] 4. Implement error handling and graceful degradation
  - [ ] 4.1 Add console error logging for fetch failures
    - Log fetch errors with `console.error()` when `getApplication()` fails
    - Include descriptive error messages for debugging
    - Log warnings when falling back to partial data
    - _Requirements: 3.1_

  - [ ] 4.2 Add error notification for fetch failures
    - Set error state with message: "Application created but details could not be loaded"
    - Use existing `setError()` state setter
    - Display user-friendly error notification
    - _Requirements: 3.2, 3.3_

  - [ ] 4.3 Implement fallback to partial data on fetch failure
    - When `getApplication()` fails, use partial data from POST response
    - Transform partial data using existing `transformApplication()` function
    - Update state with partial application data as fallback
    - Ensure success screen still displays even with partial data
    - _Requirements: 3.4, 4.4_

  - [ ]* 4.4 Write unit tests for error handling paths
    - Test creation success with fetch failure scenario
    - Test missing application ID scenario
    - Test fallback behavior with partial data
    - Verify error logging and notification display
    - _Requirements: 3.1, 3.2, 3.4_

- [ ] 5. Checkpoint - Ensure all manual tests pass
  - Test successful application creation flow end-to-end
  - Verify correct service name displays on success screen
  - Test error scenarios (network failures, missing data)
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Add property-based tests for correctness properties
  - [ ]* 6.1 Write property test for application creation triggers complete data fetch
    - **Property 1: Application Creation Triggers Complete Data Fetch**
    - **Validates: Requirements 1.1, 4.2**
    - Generate random valid application data
    - Verify `getApplication` is called with the correct ID after POST succeeds
    - Verify complete data includes joined service and institution information

  - [ ]* 6.2 Write property test for loading state lifecycle
    - **Property 2: Loading State Lifecycle**
    - **Validates: Requirements 1.2, 2.1, 2.3, 2.4**
    - Verify loading transitions from false → true → false
    - Test across various success/failure scenarios
    - Ensure loading state always returns to false

  - [ ]* 6.3 Write property test for complete application data display
    - **Property 3: Complete Application Data Display**
    - **Validates: Requirements 1.3, 1.4**
    - Generate applications with joined service and institution data
    - Verify transformed objects include correct service and institution names
    - Verify "Unknown Service" placeholders are replaced

  - [ ]* 6.4 Write property test for API call sequencing
    - **Property 4: API Call Sequencing**
    - **Validates: Requirements 1.5, 4.1, 4.3**
    - Verify `fetchApplications()` is called before `getApplication()`
    - Test across multiple application creation scenarios
    - Ensure correct execution order in all cases

  - [ ]* 6.5 Write property test for error handling with graceful degradation
    - **Property 5: Error Handling with Graceful Degradation**
    - **Validates: Requirements 3.1, 3.2, 3.4**
    - Simulate various fetch error conditions
    - Verify error logging, notification, and fallback behavior
    - Ensure success screen is never blocked

  - [ ]* 6.6 Write property test for non-blocking error resilience
    - **Property 6: Non-Blocking Error Resilience**
    - **Validates: Requirements 4.4**
    - Test failures in both `fetchApplications()` and `getApplication()`
    - Verify execution continues and success screen displays
    - Ensure no blocking or cascading failures

- [ ] 7. Final checkpoint and verification
  - Run all tests (unit and property tests)
  - Verify backward compatibility with existing code
  - Check console for any error logs
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation maintains full backward compatibility with existing code
- No database migrations or backend changes are required
- Property tests validate universal correctness properties across all scenarios
- Unit tests validate specific examples and edge cases
- Graceful degradation ensures the application always works even if complete data fetch fails
- The solution adds only one additional API call (GET by ID) per application creation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3"] },
    { "id": 3, "tasks": ["2.4", "3.1"] },
    { "id": 4, "tasks": ["3.2", "4.1", "4.2", "4.3"] },
    { "id": 5, "tasks": ["4.4", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6"] }
  ]
}
```
