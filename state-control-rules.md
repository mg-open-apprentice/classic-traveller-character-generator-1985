# Character State Control Rules

This document defines the definitive state model for character generation UI control.

## Initial State (New Character)

When a new character is created, all readiness flags start as False:

- `rdy_for_survival_check = False`
- `rdy_for_commission_check = False`
- `rdy_for_promotion_check = False`
- `skill_roll_eligibility = 0`
- `rdy_for_ageing_check = False`
- `rdy_for_reenlistment = False`

## State Transitions

### After Enlistment/Draft
- `rdy_for_survival_check = True`

### After Survival Check (survived or injured)
- `skill_roll_eligibility += 1 or 2`
- `rdy_for_survival_check = False`
- `survival_outcome = "survived" or "injured"` (permanent record)
- **Next state depends on service and eligibility:**
  - If eligible for commission: `rdy_for_commission_check = True`
  - If already commissioned and eligible for promotion: `rdy_for_promotion_check = True`
  - If no commission/promotion available: proceed to skills phase

### After Commission Attempt
- `rdy_for_commission_check = False`
- If successful: `skill_roll_eligibility += 1`
- **Next state:**
  - If now commissioned and eligible for promotion: `rdy_for_promotion_check = True`
  - Otherwise: proceed to skills phase

### After Promotion Attempt  
- `rdy_for_promotion_check = False`
- If successful: `skill_roll_eligibility += 1`
- Proceed to skills phase

### Skills Phase
- Character consumes `skill_roll_eligibility` until it reaches 0
- When `skill_roll_eligibility = 0`: `rdy_for_ageing_check = True`

### After Ageing
- `rdy_for_ageing_check = False`
- `rdy_for_reenlistment = True`

### After Reenlistment (if continuing career)
- Reset all readiness flags to False
- `rdy_for_survival_check = True` (start new term)

## Service-Specific Rules

### Commission Eligibility
- **Scouts**: Never eligible (never `rdy_for_commission_check = True`)
- **Others**: Never eligible (never `rdy_for_commission_check = True`)
- **Army/Navy/Marines/Merchants**: Can be eligible based on other rules

### Promotion Eligibility  
- **Scouts**: Never eligible (never `rdy_for_promotion_check = True`)
- **Others**: Never eligible (never `rdy_for_promotion_check = True`)
- **Army/Navy/Marines/Merchants**: Can be eligible if commissioned

### Additional Commission Rules
- Must not already be commissioned
- Drafted characters cannot be commissioned in first term

### Additional Promotion Rules
- Must be commissioned first
- Must not be at maximum rank for service

## UI Control Principle

**Frontend displays buttons based solely on which `rdy_for_*` flags are True in the character data.**

The backend evaluates all game rules and sets the appropriate readiness flags. The frontend renders these flags without any business logic of its own.

## Variables Made Redundant

This model eliminates:
- `survival_outcome = "pending"` (replaced by `rdy_for_survival_check`)
- `ready_for_skills` (replaced by `skill_roll_eligibility > 0`)
- `ready_for_ageing` (replaced by `rdy_for_ageing_check`)
- `ready_for_reenlistment` (replaced by `rdy_for_reenlistment`)
- `commission_attempted_this_term`
- `commission_failed_this_term`
- All frontend eligibility checking functions
- Complex frontend state management

## Historical vs Control Data

- `survival_outcome = "survived"/"injured"` → **Keep** (permanent character record)
- `rdy_for_survival_check = True/False` → **New** (UI control flag)

These serve different purposes and both are needed.