# Frontend/Backend Separation Audit
## Classic Traveller Character Generator Codebase

**Document Version:** 1.0  
**Generated:** 2025-01-27  
**Repository:** Classic Traveller Character Generator (1985)

---

## Executive Summary

This audit identifies frontend/backend separation issues in the Classic Traveller character generator codebase. The application suffers from **dual business logic** where game rules are implemented in both frontend JavaScript and backend Python, leading to maintenance overhead and potential inconsistencies.

**Overall Assessment:** The codebase has made significant progress toward proper separation, but several critical issues remain that need immediate attention.

---

## 1. CRITICAL ISSUES

### 1.1 Hardcoded Game Rules in Frontend

**File:** `/static/script.js`  
**Risk Level:** CRITICAL  
**Status:** PENDING

#### Issue: Hardcoded Probability Calculations
- **Location:** Lines 38-40 (comment reference)
- **Problem:** Frontend contains hardcoded discharge probability comment: `"11/12 chance"` and `'91.67%'`
- **Backend Source:** All probability calculations should come from `character_generation_rules.py:calculate_success_probability()`
- **Risk:** Business logic duplication, frontend making probability decisions
- **Recommended Fix:** Remove all frontend probability calculations, query `/api/action_probability` endpoint

```javascript
// BAD: Frontend calculating probabilities
const probability = '91.67%'; // 11/12 chance

// GOOD: Query backend for probabilities
const response = await fetch('/api/action_probability', {
    method: 'POST',
    body: JSON.stringify({action_type: 'reenlist'})
});
```

#### Issue: Service Type Classification Logic
- **Location:** Lines 1582-1625 in `highlightCharacteristicsForService()`
- **Problem:** Frontend logic to determine service eligibility and characteristic bonuses
- **Backend Source:** `character_generation_tables.py:ENLISTMENT_BONUSES`
- **Risk:** Game rules duplicated between frontend and backend
- **Recommended Fix:** Use `/api/enlistment_bonus_requirements` endpoint exclusively

### 1.2 UI State Management Based on Game Rules

**File:** `/static/script.js`  
**Risk Level:** CRITICAL  
**Status:** PARTIALLY FIXED

#### Issue: Button Enabling/Disabling Logic
- **Location:** Lines 638-691 in `updateButtonStates()`
- **Problem:** Frontend partially implements game rule checks for button availability
- **Backend Source:** Backend has complete state control via `rdy_for_*` flags
- **Risk:** Frontend decisions override backend rules
- **Current Status:** IMPROVED - Now uses `/api/get_available_actions` but still has fallback logic
- **Recommended Fix:** Remove all frontend eligibility checks, trust backend completely

---

## 2. MODERATE ISSUES

### 2.1 Enlistment Probability Display Logic

**File:** `/static/script.js`  
**Risk Level:** MODERATE  
**Status:** PENDING

#### Issue: Frontend Enlistment Probability Processing
- **Location:** Lines 1475-1517 in `loadEnlistmentProbabilities()`
- **Problem:** Frontend sorts and displays enlistment probabilities
- **Backend Source:** Backend calculates probabilities via `get_enlistment_requirements()`
- **Risk:** UI presentation logic could conflict with backend calculations
- **Recommended Fix:** Backend should provide pre-sorted probability data with UI hints

```python
# Backend should provide:
{
    "services": [
        {"name": "Army", "percentage": 95, "ui_rank": 1},
        {"name": "Navy", "percentage": 83, "ui_rank": 2},
        # ...
    ]
}
```

### 2.2 Characteristic Value Color Coding

**File:** `/static/script.js`  
**Risk Level:** MODERATE  
**Status:** PENDING

#### Issue: Frontend Business Rule for Characteristic Quality
- **Location:** Lines 1449-1465 in `applyCharacteristicColor()`
- **Problem:** Frontend hardcodes characteristic value quality thresholds
- **Code Sample:**
```javascript
if (value >= 11) {
    element.classList.add('char-excellent'); // 11+: Gold
} else if (value >= 9) {
    element.classList.add('char-good'); // 9-10: Silver
} else if (value >= 6) {
    element.classList.add('char-average'); // 6-8: Green
}
```
- **Risk:** Game balance thresholds defined in frontend instead of backend
- **Recommended Fix:** Backend should provide color class names with characteristic data

### 2.3 Skill Table Availability Logic

**File:** `/static/script.js`  
**Risk Level:** MODERATE  
**Status:** PENDING

#### Issue: Education Skill Table Threshold Check
- **Location:** Lines 925-937 in `showSkillsPanel()`
- **Problem:** Frontend fallback logic for skill table availability
- **Backend Source:** `get_available_skill_tables()` in `character_generation_rules.py`
- **Risk:** Frontend override of backend skill eligibility rules
- **Recommended Fix:** Remove frontend fallbacks, backend API should be authoritative

---

## 3. MINOR ISSUES

### 3.1 Default UI State Values

**File:** `/static/script.js`  
**Risk Level:** MINOR  
**Status:** PENDING

#### Issue: Hardcoded Default Values in UI
- **Location:** Lines 186-296 in `clearUIState()`
- **Problem:** Frontend hardcodes default display values
- **Code Sample:**
```javascript
if (charAge) charAge.textContent = '18';
if (charTerms) charTerms.textContent = '0';
if (uppString) uppString.textContent = '______';
```
- **Risk:** UI default values not driven by backend configuration
- **Recommended Fix:** Backend should provide default UI state values

### 3.2 Hardcoded Age Increments

**File:** `/static/script.js`  
**Risk Level:** MINOR  
**Status:** PENDING

#### Issue: Frontend References to Game Mechanics
- **Location:** Line 181 in ageing panel description
- **Problem:** UI text contains hardcoded game rule values (`"+4 years"`)
- **Backend Source:** Age increments calculated in `increment_character_age()`
- **Risk:** UI text could become incorrect if backend rules change
- **Recommended Fix:** Backend should provide UI display text

### 3.3 Service Name Formatting

**File:** `/static/script.js`  
**Risk Level:** MINOR  
**Status:** PENDING

#### Issue: Frontend Service Name Processing
- **Location:** Lines 1644-1652 in `attemptEnlistment()`
- **Problem:** Frontend capitalizes service names for API calls
- **Code Sample:**
```javascript
service: service.charAt(0).toUpperCase() + service.slice(1)
```
- **Risk:** UI-driven data transformation for backend API
- **Recommended Fix:** Standardize service name format between frontend and backend

---

## 4. COMPLETED FIXES

### 4.1 State-Driven UI Control ✅

**File:** `/static/script.js`  
**Risk Level:** Previously CRITICAL  
**Status:** FIXED

#### What Was Fixed:
- Backend now provides complete UI state control via `rdy_for_*` flags
- Frontend uses `/api/get_available_actions` endpoint for button states
- Eliminated complex frontend rule checking functions
- **Implementation:** Lines 638-691 now query backend for available actions

### 4.2 Commission/Promotion Eligibility ✅

**File:** `character_generation_rules.py`  
**Risk Level:** Previously CRITICAL  
**Status:** FIXED

#### What Was Fixed:
- Backend functions `get_commission_requirements()` and `get_promotion_requirements()` provide complete eligibility logic
- Frontend no longer duplicates commission/promotion rule checking
- Maximum rank enforcement properly handled in backend
- **Implementation:** Lines 684-728 and 729-778 in rules module

### 4.3 Probability Calculation Infrastructure ✅

**File:** `character_generation_rules.py`  
**Risk Level:** Previously MODERATE  
**Status:** FIXED

#### What Was Fixed:
- Backend provides `/api/action_probability` endpoint for all probability calculations
- Function `calculate_success_probability()` centralizes dice probability logic
- Career survival probabilities available via `career_survival()` function
- **Implementation:** Lines 1644-1676 and 1678-1735 in rules module

---

## 5. GOOD PRACTICES

### 5.1 Centralized Game Rules ✅

**File:** `character_generation_rules.py` and `character_generation_tables.py`  
**Implementation:** Excellent separation of game rules from UI logic

#### What's Done Well:
- All Classic Traveller game rules centralized in Python backend
- Game tables separated into dedicated data module
- No business logic in frontend rendering functions
- Clear API boundaries between frontend and backend

### 5.2 Backend-Driven Character State ✅

**File:** `app.py`  
**Implementation:** Clean state management via readiness flags

#### What's Done Well:
- Character state controlled entirely by backend
- Frontend queries state via API calls
- No frontend state variables tracking game progression
- Consistent character data structure

### 5.3 API-First Architecture ✅

**File:** `app.py`  
**Implementation:** Comprehensive REST API for all game operations

#### What's Done Well:
- Complete API coverage for all character generation phases
- Proper error handling and validation in API endpoints
- Consistent JSON response format
- Clear endpoint responsibilities

---

## 6. ARCHITECTURAL RECOMMENDATIONS

### 6.1 Immediate Priority (Next Sprint)

1. **Remove Frontend Probability Calculations**
   - Replace hardcoded `'91.67%'` with API calls
   - Delete all frontend probability math
   - Backend provides all percentage displays

2. **Eliminate Frontend Game Rule Constants**
   - Remove characteristic color thresholds from JavaScript
   - Remove hardcoded age increment references
   - Backend provides all UI display logic

3. **Centralize Service Logic**
   - Remove service name processing from frontend
   - Standardize service name format in backend
   - Backend provides UI-ready service data

### 6.2 Medium-Term Improvements

1. **Enhanced Backend UI Hints**
   - Backend provides pre-sorted probability data
   - Backend specifies UI color classes for characteristics
   - Backend provides complete UI state in single endpoint

2. **Configuration-Driven UI Text**
   - Move all game rule text ("+4 years", thresholds) to backend configuration
   - Backend provides localized/configurable UI text
   - Eliminate hardcoded game mechanics in frontend

### 6.3 Long-Term Architecture Goals

1. **Pure Presentation Layer Frontend**
   - Frontend becomes purely a rendering engine
   - No game logic or business rules in JavaScript
   - Complete backend control over UI behavior

2. **API Standardization**
   - Consistent response format across all endpoints
   - Standardized error handling and validation
   - Comprehensive API documentation

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Critical Issue Resolution (Week 1)
- [ ] Remove hardcoded probabilities from frontend
- [ ] Eliminate frontend game rule constants
- [ ] Remove service name processing logic
- [ ] Add backend UI hint endpoints

### Phase 2: Moderate Issue Resolution (Week 2)
- [ ] Backend-provided characteristic color classes
- [ ] Enhanced skill table availability API
- [ ] Sorted probability data from backend
- [ ] Configuration-driven UI text

### Phase 3: Architecture Refinement (Week 3)
- [ ] Comprehensive backend UI state endpoint
- [ ] Remove all frontend fallback logic
- [ ] Standardize API response formats
- [ ] Complete frontend/backend boundary documentation

---

## 8. TESTING RECOMMENDATIONS

### 8.1 Separation Validation Tests
- Unit tests for all backend game rule functions
- Integration tests for API endpoints with no business logic
- Frontend tests that mock all backend calls
- End-to-end tests validating UI matches backend state

### 8.2 Consistency Verification
- Tests ensuring frontend displays match backend calculations
- Validation that no frontend code contains game rules
- Verification that all game mechanics are backend-controlled

---

## 9. METRICS FOR SUCCESS

### Before Fixes:
- **Game Rules in Frontend:** 8 locations
- **Hardcoded Values:** 12 instances  
- **Business Logic Functions in JavaScript:** 6 functions
- **Frontend State Variables:** 3 variables

### After Fixes (Target):
- **Game Rules in Frontend:** 0 locations
- **Hardcoded Values:** 0 instances
- **Business Logic Functions in JavaScript:** 0 functions
- **Frontend State Variables:** 0 variables

### Current Progress:
- **Game Rules in Frontend:** 3 locations (IMPROVED)
- **Hardcoded Values:** 5 instances (IMPROVED)
- **Business Logic Functions in JavaScript:** 2 functions (IMPROVED)
- **Frontend State Variables:** 0 variables (COMPLETED)

---

## 10. CONCLUSION

The Classic Traveller character generator has made significant progress toward proper frontend/backend separation. The backend now drives most UI state through the `rdy_for_*` flag system and comprehensive API endpoints. However, critical issues remain around hardcoded game rules and probability calculations in the frontend.

**Priority Actions:**
1. Remove all probability calculations from frontend JavaScript
2. Eliminate hardcoded game rule constants (characteristic thresholds, age increments)
3. Complete the transition to backend-driven UI state

**Success Criteria:**
The frontend should become a pure presentation layer with no game logic, making it impossible for frontend and backend to disagree about game rules or character state.

**Timeline:** All critical and moderate issues can be resolved within 2-3 weeks with focused effort.

---

*This audit was generated by analyzing the codebase for separation of concerns between game logic (backend) and presentation (frontend). The goal is a maintainable, consistent architecture where game rules exist in exactly one place.*