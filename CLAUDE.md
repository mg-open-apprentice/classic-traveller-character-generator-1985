# Classic Traveller Character Generator (1985)

## Project Overview

This is a web-based Classic Traveller character generator that faithfully implements the 1977 Book 1 rules for character creation. The application guides players through the complete character generation process from initial characteristics through career progression to final mustering out.

## Architecture

**Backend-Driven Design**: The Flask backend contains ALL game logic and rules. The frontend is a pure presentation layer that renders what the backend specifies.

**Key Principle**: Frontend never makes game rule decisions. It only displays buttons and content based on backend state flags (`rdy_for_*` fields).

## Core Files

- `app.py` - Flask web server and API endpoints
- `character_generation_rules.py` - All game mechanics and rule logic
- `character_generation_tables.py` - Game data tables from Book 1
- `templates/index.html` - Main UI template
- `static/script.js` - Frontend JavaScript (presentation only)
- `static/style.css` - UI styling

## Development Guidelines

### When Adding Features
1. **Game logic goes in the backend** - Never add rule calculations to JavaScript
2. **Use existing patterns** - Follow the state flag system (`rdy_for_survival_check`, etc.)
3. **Test thoroughly** - Run `python test_character_careers.py` after changes
4. **Check separation** - Review frontend/backend boundaries per `architecture.md`

### Code Style
- Follow existing naming conventions in each file
- Backend uses snake_case, frontend uses camelCase
- No hardcoded game values in JavaScript
- All probabilities and calculations come from Python backend

### Testing Strategy
- `test_character_careers.py` validates complete career flows
- Tests both normal (EDU=8) and low education (EDU=6) characters
- Runs 7-term careers through mustering out
- All 6 services tested with rigged dice (always roll 11)

## Game Rules Implementation

This system implements Classic Traveller Book 1 (1977) rules with verified accuracy:
- All 6 career paths (Navy, Marines, Army, Merchants, Scouts, Others)
- Complete term sequence: Survival → Commission → Promotion → Skills → Aging → Reenlistment
- Proper aging effects and thresholds
- Commission/promotion restrictions and rank limits
- Service-specific enlistment bonuses and survival requirements
- Mustering out benefits system

See `game-rules.md` for detailed rule verification.

## Current Architecture Status

**Frontend/Backend Separation**: Mostly complete, with some remaining issues documented in `FRONTEND_BACKEND_SEPARATION_AUDIT.md`. Priority fixes needed:
- Remove hardcoded probability calculations from frontend
- Eliminate characteristic quality thresholds in JavaScript
- Complete transition to backend-driven UI state

## Quick Commands

```bash
# Run the application
python app.py

# Run comprehensive tests
python test_character_careers.py

# Check for separation issues
grep -r "hardcoded\|TODO\|FIXME" static/script.js
```

## Documentation Structure

- `CLAUDE.md` - This file (project overview)
- `architecture.md` - System design and separation principles
- `game-rules.md` - Classic Traveller rule implementation
- `testing.md` - Test strategy and running tests  
- `development.md` - Setup and development workflows

## AI Assistant Guidelines

When working on this project:
- **Always preserve game rule accuracy** - This is a faithful implementation of 50-year-old stable rules
- **Maintain frontend/backend separation** - No business logic in JavaScript
- **Run tests after changes** - The career test validates the entire system
- **Follow the state flag pattern** - Use `rdy_for_*` flags for UI control
- **Check existing implementations** - Look at similar features before adding new ones
- **Keep it simple** - This is a focused tool, not a complex application

The codebase is clean and well-structured. Most complexity comes from faithfully implementing the original game rules, not from architectural issues.