# Implementation Plan: Fix Kitchen Mix Header

## Issue Summary
The current header implementation has scrolling issues where:
1. The header and navigation icons are not fixed to the top when scrolling
2. The app name and navigation icons are not always visible when scrolling
3. The overall view appears under the header when the page loads

## Current Implementation Analysis
- The Header component is implemented in `web/src/components/layout/Header/index.tsx`
- The Header is used in both `MixLayout` and `DefaultLayout` components
- The header currently has `sticky top-0` classes which should make it fixed, but there may be issues with the layout
- The main content areas in both layouts don't have proper padding to account for the fixed header

## Technical Approach

### 1. Fix Header Positioning
The header already has `sticky top-0` classes, but we need to ensure it's properly fixed to the top:
- Verify the `z-index` is sufficient to keep the header above content
- Ensure the header has proper positioning context

### 2. Fix Content Layout
The main issue is that content appears under the header when the page loads. This requires:
- Adding top padding to the main content area equal to the header height
- The header has a height of `h-16` (4rem), so we need to add `pt-16` to the main content

### 3. Update Layout Components
We need to modify both layout components:
- `MixLayout` - Used in MixPage
- `DefaultLayout` - Used in other pages

## Implementation Steps

### Step 1: Update MixLayout Component
Modify `web/src/components/layout/MixLayout/index.tsx`:
- Add `pt-16` class to the main container to prevent content from appearing under the header
- Ensure the flex layout properly accounts for the fixed header

### Step 2: Update DefaultLayout Component
Modify `web/src/components/layout/DefaultLayout/index.tsx`:
- Add `pt-16` class to the main container to prevent content from appearing under the header

### Step 3: Verify Header Implementation
Check `web/src/components/layout/Header/index.tsx`:
- Ensure the header has proper positioning with `sticky top-0`
- Verify the `z-50` z-index is sufficient
- Confirm the header has a fixed height of `h-16`

### Step 4: Test Implementation
- Test scrolling behavior on both desktop and mobile
- Verify the header remains fixed at the top
- Confirm content does not appear under the header on page load
- Test in different browsers to ensure consistent behavior

## Size Estimation
Based on the implementation requirements, this is estimated as **XS (0-0.5 hours)** as it primarily involves:
- Adding padding classes to existing layout components
- Verifying existing header positioning
- Testing the changes across different views

## Testing Plan
1. Load the mix page and verify the header is not overlapped by content
2. Scroll down the page and confirm the header remains fixed at the top
3. Test on both desktop and mobile viewports
4. Verify all navigation icons remain visible and functional during scrolling
5. Check that the layout works correctly in both MixLayout and DefaultLayout contexts
