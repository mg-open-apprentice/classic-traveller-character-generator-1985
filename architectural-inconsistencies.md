# Architectural Inconsistencies

This document identifies places where the frontend JavaScript duplicates business logic that should be driven entirely by the backend Python code.

## Current Architecture Issues

The application suffers from **dual business logic** - game rules are implemented in both frontend JavaScript and backend Python, leading to maintenance overhead and potential inconsistencies.

## Identified Inconsistencies

### 1. Commission Eligibility Rules
**Issue**: Frontend duplicates commission eligibility logic
- **Frontend**: `canShowCommissionButton()` checks `character.commissioned`, `character.drafted`, `isScoutsOrOthers(character)`
- **Backend**: `can_show_commission_button()` and `get_base_button_restrictions()` have identical logic
- **Impact**: Two places to maintain the same rules

### 2. Promotion Eligibility Rules  
**Issue**: Frontend duplicates promotion eligibility logic
- **Frontend**: `canShowPromotionButton()` checks commissioned status, service type, injury status, failed commission
- **Backend**: `get_promotion_requirements()` has identical blocking logic
- **Impact**: Frontend showed promotion button for max-rank characters until recently fixed

### 3. Maximum Rank Enforcement
**Issue**: Frontend missing maximum rank checks
- **Frontend**: `canShowPromotionButton()` has no maximum rank validation
- **Backend**: Properly checks `current_rank >= max_rank` and blocks promotion
- **Impact**: Players see promotion button at max rank, get rejected by backend

### 4. Service Type Restrictions
**Issue**: Frontend duplicates service-specific rules
- **Frontend**: `isScoutsOrOthers()` function determines commission/promotion availability  
- **Backend**: Multiple layers check `career in ['scouts', 'others']`
- **Impact**: Same logic exists in JavaScript and Python

### 5. Hardcoded Probability Calculations
**Issue**: Frontend calculates discharge probability
- **Frontend**: Hardcodes discharge success as `'91.67%'` with comment "11/12 chance"
- **Backend**: Reenlistment probabilities properly fetched via API
- **Impact**: Business logic calculation done in frontend instead of backend

### 6. Frontend State Tracking
**Issue**: Frontend maintains game state variables
- **Frontend**: `commissionSuccessful` global variable tracks permanent commission status
- **Backend**: Character data already contains `character.commissioned` field
- **Impact**: Redundant state management, potential for desync

### 7. Action Flow Control
**Issue**: Frontend decides next available actions
- **Frontend**: `showNextActionsAfterSurvival()`, step sequencing logic
- **Backend**: Has all character state needed to determine valid actions
- **Impact**: Frontend makes game rule decisions instead of rendering backend decisions

## Root Cause Analysis

The fundamental issue is **mixed responsibility** - the frontend acts as both:
1. **UI renderer** (correct role)
2. **Game rule engine** (should be backend-only)

## Recommended Architecture

### Target State: Backend-Driven UI
- **Backend**: Single source of truth for all game rules and available actions
- **Frontend**: Pure presentation layer that renders what backend specifies
- **API**: Backend provides "available actions" lists, frontend shows only those actions

### Required Changes
1. **New API endpoint**: `/api/get_available_actions` 
2. **Remove frontend rule functions**: Delete all `canShow*()` and game logic functions
3. **Generic button management**: Replace service-specific logic with data-driven rendering
4. **Eliminate frontend state**: Remove `commissionSuccessful` and similar variables
5. **Backend probability service**: Move all probability calculations to backend

## Benefits of Proposed Architecture

1. **Single source of truth**: All game rules in one place (backend)
2. **Consistent behavior**: Impossible for frontend/backend to disagree
3. **Simpler frontend**: UI focused purely on presentation
4. **Better UX**: No buttons shown that will be rejected by backend
5. **Easier testing**: Game logic concentrated in testable backend code

## Impact Assessment

**High Priority Issues** (blocking user experience):
- Maximum rank promotion button visibility
- Null reference errors from missing commission/promotion buttons

**Medium Priority Issues** (maintenance/consistency):
- Duplicated service type checks
- Frontend state tracking
- Hardcoded probability calculations

**Low Priority Issues** (architectural purity):
- Action flow control duplication

---

*Note: Classic Traveller rules are 50 years old and stable - the concern is architectural consistency, not rule changes.*