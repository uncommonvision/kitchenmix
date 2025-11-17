# Implementation Plan: Enable Signout Functionality

## Issue Description
The current web app has a signout option in the user profile menu that does not yet work. Enable the signout functionality to clear the signed in user in the local storage.

## Current Implementation Analysis
1. User identity is managed through `userIdentityService` which maintains the current user in memory
2. User names are persisted in localStorage with the key 'mixUserName'
3. The UserMenu component has a "Sign out" button, but it doesn't have any functionality attached
4. The `useUserIdentity` hook provides a `clearUser` function that calls `userIdentityService.clearUserIdentity()`
5. The MixPage component hydrates the user from localStorage on first mount

## Technical Approach

### 1. Update UserMenu Component
- Add an onClick handler to the "Sign out" button
- The handler should:
  - Clear the user from the userIdentityService
  - Remove the 'mixUserName' item from localStorage
  - Close the menu

### 2. Implementation Details
- Import the necessary hooks and services in UserMenu
- Add a signOut function that:
  - Calls clearUser from userIdentityService
  - Removes 'mixUserName' from localStorage
  - Sets isOpen to false
- Attach this function to the onClick event of the "Sign out" button

### 3. Expected Behavior
- When a user clicks "Sign out":
  - The user identity is cleared from memory
  - The 'mixUserName' entry is removed from localStorage
  - The user is redirected to the name entry dialog
  - The user menu closes

## Files to Modify
1. `web/src/components/ui/UserMenu/index.tsx` - Add signout functionality

## Testing Plan
1. Verify that clicking "Sign out" removes the user from memory
2. Verify that clicking "Sign out" removes 'mixUserName' from localStorage
3. Verify that after signing out, the UserNameDialog appears
4. Verify that the user menu closes after signing out

## Estimated Size
XS - This is a small change that only requires modifying one component and adding a simple event handler.
