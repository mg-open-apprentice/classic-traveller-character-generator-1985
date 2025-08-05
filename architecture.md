# System Architecture

## Core Design Principle

**Backend-Driven UI**: The frontend is a pure presentation layer. All game logic, business rules, and state management reside in the Python backend.

## Architecture Overview

```
Frontend (JavaScript)     Backend (Python)
├── UI Rendering          ├── Game Rules Engine
├── Event Handling        ├── Character State Management
├── API Calls             ├── Probability Calculations
└── Display Logic         └── Data Persistence
```

## Separation of Concerns

### Backend Responsibilities
- **Game Rule Implementation** - All Classic Traveller Book 1 rules
- **State Management** - Character progression through career phases
- **Probability Calculations** - Dice roll outcomes and success rates
- **Data Validation** - Ensure character data integrity
- **API Endpoints** - Provide structured data for frontend consumption

### Frontend Responsibilities  
- **UI Rendering** - Display character information and available actions
- **User Input Handling** - Capture button clicks and form submissions
- **API Communication** - Send requests and process responses
- **Visual Feedback** - Show loading states, highlights, animations

### What Frontend Must NOT Do
- Calculate probabilities or success rates
- Determine button availability based on game rules
- Make decisions about character progression
- Store or manipulate character state beyond display

## State Control System

Characters progress through career phases controlled by readiness flags:

```python
# Backend sets these flags based on game state
character = {
    "rdy_for_survival_check": True/False,
    "rdy_for_commission_check": True/False, 
    "rdy_for_promotion_check": True/False,
    "skill_roll_eligibility": 0-5,
    "rdy_for_ageing_check": True/False,
    "rdy_for_reenlistment": True/False
}
```

Frontend reads these flags and shows appropriate buttons. No frontend logic determines availability.

## API Design Patterns

### Standard Response Format
```json
{
    "success": true,
    "character": { /* full character object */ },
    "message": "Action completed successfully"
}
```

### Key Endpoints
- `POST /api/create_character` - Generate new character
- `POST /api/attempt_enlistment` - Try to join a service
- `POST /api/check_survival` - Resolve survival check
- `POST /api/check_commission` - Attempt commission
- `POST /api/check_promotion` - Attempt promotion
- `POST /api/resolve_skill` - Learn new skill
- `POST /api/check_ageing` - Apply aging effects
- `POST /api/attempt_reenlistment` - Continue or end career

## Data Flow

1. **User Action** - Frontend captures button click
2. **API Request** - POST to appropriate endpoint with current character
3. **Backend Processing** - Apply game rules, update character state
4. **State Update** - Set readiness flags for next available actions
5. **API Response** - Return updated character with new state flags
6. **UI Update** - Frontend renders new state and available buttons

## Service-Specific Rules

### Commission Services (Navy, Marines, Army, Merchants)
**Flow**: Survival → Commission → Promotion → Skills → Aging → Reenlistment

### Non-Commission Services (Scouts, Others)  
**Flow**: Survival → Skills → Aging → Reenlistment

Backend enforces these flows through state flags. Frontend has no service-specific logic.

## Known Architecture Issues

### Remaining Frontend Business Logic
These issues are documented in `FRONTEND_BACKEND_SEPARATION_AUDIT.md`:

**Critical Issues:**
- Hardcoded probability calculations (`'91.67%'` discharge probability)
- Characteristic quality thresholds (excellent/good/average colors)
- Service type classification logic in JavaScript

**Resolution Plan:**
1. Move all probability calculations to backend endpoints
2. Backend provides UI color classes for characteristics  
3. Remove frontend service-specific logic
4. Complete transition to backend-driven state management

## File Organization

```
project/
├── app.py                          # Flask server & API endpoints
├── character_generation_rules.py   # Game logic & state management
├── character_generation_tables.py  # Game data from Book 1
├── static/
│   ├── script.js                   # Frontend presentation layer
│   └── style.css                   # UI styling
└── templates/
    └── index.html                  # Main UI template
```

## Design Benefits

1. **Single Source of Truth** - Game rules exist only in Python backend
2. **Consistency** - Impossible for frontend/backend to disagree on rules
3. **Testability** - Game logic concentrated in testable Python code
4. **Maintainability** - Changes to game rules require updates in one place
5. **User Experience** - No buttons shown that backend will reject

## Future Architecture Goals

1. **Complete Separation** - Zero business logic in frontend JavaScript
2. **Enhanced APIs** - Backend provides all UI hints and display data
3. **Comprehensive Testing** - Full coverage of game rule implementations
4. **Documentation Sync** - Architecture matches implementation exactly

The system is 90% properly separated. Completing the remaining frontend business logic removal will achieve the target architecture.