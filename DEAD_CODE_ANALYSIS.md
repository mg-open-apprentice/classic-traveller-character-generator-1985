# Dead Code Analysis - Classic Traveller Character Generator

## Overview

This document analyzes unused functions in the Classic Traveller Character Generator codebase and identifies where their functionality is actually implemented in the working code.

## Unused Functions Analysis

The following table shows 5 unused functions in `character_generation_rules.py` and where their functionality is actually implemented:

| Unused Function | Purpose | Working Implementation Location | Key Differences |
|-----------------|---------|--------------------------------|-----------------|
| `complete_term()` (line 159) | Increments terms_served when term completes | `character_generation_rules.py:841-844` in `attempt_reenlistment()` | Working code includes conditional logic to skip increment for medical discharge |
| `is_ready_for_skills()` (line 334) | Determines if character ready for skills | `character_generation_rules.py:403,410` in `check_survival()` + `app.py:194,320,330` flag checks | Working code sets flag based on survival outcome vs always returning True |
| `get_skill_eligibility_count()` (line 1117) | Returns skill eligibilities available | `app.py:193,231,263,328` + `character_generation_rules.py:1138,1282,1304` | Working code accesses `character_record.get("skill_eligibility", 0)` directly |
| `get_next_phase()` (line 1296) | Determines next phase (skills/ageing/reenlistment) | `app.py:306-316` in `api_resolve_skill()` + flag management throughout | Working code uses distributed conditional logic in API endpoints vs centralized function |
| `calculate_mustering_out_info()` (line 1314) | Calculates mustering out info without executing | `character_generation_rules.py:1417-1460` within `perform_mustering_out()` | Working code combines calculation with execution vs separate calculation function |

## Detailed Analysis

### 1. `complete_term()` - Line 159

**Unused Function:**
```python
def complete_term(character_record: dict[str, Any]) -> None:
    character_record["terms_served"] = character_record.get("terms_served", 0) + 1
```

**Working Implementation:**
- **Location:** `character_generation_rules.py:841-844` in `attempt_reenlistment()`
- **Code:**
```python
# Increment terms_served for all outcomes except medical discharge
if outcome != "medical_discharge":
    old_terms = character_record.get("terms_served", 0)
    character_record["terms_served"] = old_terms + 1
```

**Key Difference:** The working implementation includes conditional logic to skip incrementing for medical discharge, while the unused function always increments.

### 2. `is_ready_for_skills()` - Line 334

**Unused Function:**
```python
def is_ready_for_skills(character_record: dict) -> bool:
    # Character is ready for skills after survival check
    return True
```

**Working Implementation:**
- **Location:** `character_generation_rules.py:403,410` in `check_survival()`
- **Code:**
```python
# For survived characters:
character_record["ready_for_skills"] = True

# For injured characters:
character_record["ready_for_skills"] = False
```
- **Also used in:** `app.py:194,320,330` where the flag is checked directly

**Key Difference:** The working implementation sets a flag in the character record based on survival outcome, while the unused function would always return True regardless of context.

### 3. `get_skill_eligibility_count()` - Line 1117

**Unused Function:**
```python
def get_skill_eligibility_count(character_record: dict[str, Any]) -> int:
    return character_record.get("skill_eligibility", 0)
```

**Working Implementation:**
- **Location:** Multiple locations in `app.py:193,231,263,328` and `character_generation_rules.py:1138,1282,1304`
- **Code:**
```python
skill_eligibility = current_character.get("skill_eligibility", 0)
```

**Key Difference:** The working code accesses the value directly rather than using a function wrapper.

### 4. `get_next_phase()` - Line 1296

**Unused Function:**
```python
def get_next_phase(character_record: dict) -> str:
    skill_eligibility = character_record.get('skill_eligibility', 0)
    # If there are still skills to roll, stay in skills phase
    if skill_eligibility > 0:
        return 'skills'
    # Always do ageing after skills, before reenlistment
    if not character_record.get('ready_for_ageing', False):
        return 'ageing'
    # After ageing, proceed to reenlistment
    return 'reenlistment'
```

**Working Implementation:**
- **Location:** `app.py:306-316` in `api_resolve_skill()`
- **Code:**
```python
# Check if ageing should be triggered
if current_character.get("ready_for_ageing", False):
    rng = chargen.get_random_generator(current_character)
    current_character = chargen.check_ageing(rng, current_character)
    # ... ageing logic ...

# Always get available reenlistment options after skills are resolved
available_options = chargen.get_available_reenlistment_options(current_character)
```

**Key Difference:** The working implementation uses conditional logic and flag checking within the API endpoints rather than a centralized phase determination function.

### 5. `calculate_mustering_out_info()` - Line 1314

**Unused Function:**
```python
def calculate_mustering_out_info(character_record: dict[str, Any]) -> dict[str, Any]:
    # Calculates: career, terms_served, rank, total_rolls, max_cash_rolls, 
    # benefit_rank_bonus, cash_table, benefit_table, requires_mustering_out
    # Returns dictionary with calculation results
```

**Working Implementation:**
- **Location:** `character_generation_rules.py:1417-1460` within `perform_mustering_out()`
- **Code:**
```python
# Calculate total rolls (terms + rank bonus)
total_rolls = int(terms_served)
if 1 <= rank <= 2:
    total_rolls += 1
elif 3 <= rank <= 4:
    total_rolls += 2
elif 5 <= rank <= 6:
    total_rolls += 3

# Calculate bonuses
benefit_rank_bonus = 1 if rank in (5, 6) else 0

# Get appropriate tables
career_cash_table = cash_table.get(current_career, cash_table['Other'])
career_benefit_table = benefit_table.get(current_career, benefit_table['Other'])
```

**Key Difference:** The working implementation combines calculation with execution in a single function, while the unused function would only calculate without executing the mustering out process.

## Other Dead Code Found

### Additional Unused Items
- **Function:** `load_character_from_file()` in `app.py:33` - Never called
- **Parameter:** `death_rule_enabled` in `check_survival()` - Defined but never used
- **Debug Code:** Multiple `[DEBUG]` print statements in `app.py`
- **Debug Code:** `console.log` statements in JavaScript files
- **Disabled Code:** Random skill table selection (lines 1197-1203) - Intentionally commented out

## Recommendations

1. **Remove unused functions** - All 5 functions can be safely deleted since their functionality exists elsewhere
2. **Remove debug statements** - Clean up `[DEBUG]` prints and console.log statements for production
3. **Remove unused parameter** - Remove `death_rule_enabled` parameter from `check_survival()`
4. **Evaluate disabled code** - Determine if random skill table selection should be permanently removed

## Summary

The working implementations are generally more integrated and context-aware than the unused standalone functions. Most functionality was moved into the main workflow functions rather than using separate helper functions, providing better encapsulation and reducing the overall API surface.

---

*Analysis generated on: 2025-07-20*