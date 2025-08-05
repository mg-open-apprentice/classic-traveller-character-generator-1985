# Classic Traveller Game Rules Implementation

## Overview

This system faithfully implements Classic Traveller Book 1 (1977) character generation rules. All game mechanics have been verified against the original source material and tested for accuracy.

## Implemented Services

### Commission Services
- **Navy** - Officers commanding starships and naval operations
- **Marines** - Military forces specializing in boarding actions and ground assault  
- **Army** - Ground-based military forces
- **Merchants** - Commercial spaceship crews and traders

### Non-Commission Services  
- **Scouts** - Exploration and survey service (no ranks)
- **Others** - Catch-all for various civilian careers (no ranks)

## Character Generation Flow

### Commission Services Flow
1. **Survival Check** - Survive the dangers of military service
2. **Commission Check** - Attempt to become an officer (if eligible)
3. **Promotion Check** - Advance in rank (if commissioned)
4. **Skills** - Learn new abilities based on service tables
5. **Aging** - Characters age 4 years per term
6. **Reenlistment** - Continue career or leave service

### Non-Commission Services Flow
1. **Survival Check** - Same survival mechanics
2. **Skills** - Scouts get +2 eligibilities per term, Others get +1
3. **Aging** - Same aging mechanics  
4. **Reenlistment** - Same continuation mechanics

## Service-Specific Rules

### Enlistment Requirements

| Service | Target | Characteristic Bonuses |
|---------|--------|----------------------|
| Navy | 8 | INT≥8(+1), EDU≥9(+2) |
| Marines | 9 | INT≥8(+1), STR≥8(+2) |
| Army | 5 | DEX≥6(+1), END≥5(+2) |
| Scouts | 7 | INT≥6(+1), STR≥8(+2) |
| Merchants | 7 | STR≥7(+1), INT≥6(+2) |
| Others | 3 | None |

### Survival Requirements

| Service | Target | Characteristic Bonuses |
|---------|--------|----------------------|
| Navy | 5 | INT≥7(+2) |
| Marines | 6 | END≥8(+2) |
| Army | 5 | EDU≥6(+2) |
| Scouts | 7 | END≥9(+2) |
| Merchants | 5 | INT≥7(+2) |
| Others | 5 | INT≥9(+2) |

### Commission & Promotion Targets

| Service | Commission Target | Promotion Target |
|---------|------------------|------------------|
| Navy | 10 | 8 |
| Marines | 9 | 9 |
| Army | 5 | 6 |
| Merchants | 4 | 10 |
| Scouts | N/A | N/A |
| Others | N/A | N/A |

## Special Rules

### Commission Restrictions
- Cannot be commissioned if already commissioned
- Drafted characters cannot be commissioned in first term
- Only commission services (Navy/Marines/Army/Merchants) have commissions

### Promotion Restrictions  
- Must be commissioned before promotion attempts
- Cannot exceed maximum rank for service
- Only commissioned services have promotions

### Skill Acquisition
- **First Term**: All characters get +2 skill eligibilities
- **Subsequent Terms**: +1 skill eligibility (Scouts get +2)
- **Commission Success**: +1 additional eligibility  
- **Promotion Success**: +1 additional eligibility
- **Education Table**: Only available if EDU ≥ 8

### Aging System

| Age Range | Aging Thresholds | Characteristics Affected | Target Numbers | Loss per Failed Check |
|-----------|------------------|------------------------|----------------|---------------------|
| **34-46** | 34, 38, 42, 46 | STR, DEX, END | 8, 7, 8 | 1 point each |
| **50-62** | 50, 54, 58, 62 | STR, DEX, END | 9, 8, 9 | 1 point each |
| **66+** | Every 4 years | STR, DEX, END, INT | 9, 9, 9, 9 | 2, 2, 2, 1 points |

### Reenlistment Rules

| Service | Reenlistment Target |
|---------|-------------------|
| Navy | 6 |
| Marines | 6 |  
| Army | 7 |
| Scouts | 3 |
| Merchants | 4 |
| Others | 5 |

**Special Cases:**
- **Mandatory Retention**: Roll of 12 = forced reenlistment regardless of choice
- **Seventh Term Limit**: From 7th term onward, only roll of 12 allows reenlistment
- **Retirement Option**: Available from 5th term onward as alternative to discharge

### Injury Rules
- **Failed Survival**: Character injured, skips all other term activities
- **Reduced Aging**: Injured characters age only +2 years instead of +4
- **Medical Discharge**: Automatic career end, no reenlistment roll

## Implementation Verification

### Testing Coverage
✅ All 6 services tested through complete career progression  
✅ Both commissioned and non-commissioned career flows  
✅ Commission and promotion restrictions enforced  
✅ Proper aging effects at all thresholds  
✅ Special reenlistment cases (mandatory retention, 7th term limits)  
✅ Injury and medical discharge handling  
✅ Education skill table restrictions (EDU < 8)  
✅ Service-specific skill acquisition rates

### Data Integrity
✅ All game tables verified against Classic Traveller Book 1  
✅ Enlistment, survival, commission, and promotion targets accurate  
✅ Skill tables contain correct entries for each service  
✅ Aging thresholds and effects match original rules  
✅ Mustering out benefits tables implemented  

## Rule Accuracy Guarantee

This implementation has been extensively tested against the original 1977 Classic Traveller Book 1 rules. All mechanics, target numbers, and special cases have been verified for accuracy. The system produces characters that are fully compatible with Classic Traveller gameplay.

**Status**: All Classic Traveller Book 1 character generation rules correctly implemented and verified.